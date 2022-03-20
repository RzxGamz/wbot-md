const { default: WAConnection, DisconnectReason, useSingleFileAuthState, generateWAMessageFromContent, getBinaryNodeChild, makeInMemoryStore } = require("@adiwajshing/baileys-md")
const Pino = require("pino")
const { Boom } = require("@hapi/boom")
const djs = require("@discordjs/collection")
const fs = require("fs")
const { color } = require("./utils")
const chatHandler = require("./event/chat_event")
const joinhandler = require("./event/group_event")

const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) })
store.readFromFile('./baileys-md.json')
setInterval(() => {
	store.writeToFile('./baileys-md.json')
}, 10_000)

const { state, saveState } = useSingleFileAuthState('session-md.json', Pino({ level: "silent" }))
djs.commands = new djs.Collection()
djs.prefix = '/'

function readCmd() {
    let dir = fs.readdirSync('./command');
    dir.forEach(async (res) => {
        const commandFiles = fs.readdirSync(`./command/${res}`).filter((file) => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./command/${res}/${file}`);
            djs.commands.set(command.name, command);
            console.log(command.name + ".js");
        }
    });
    console.log(color('[SYS]', 'yellow'), 'command loaded!');
}
readCmd();

function start() {
    const sock = WAConnection({
        printQRInTerminal: true,
        auth: state,
        logger: Pino({ level: "silent" })
    })
    // store event
    store.bind(sock.ev)
    // custom function
    sock.groupQueryInvite = async (code) => {
        const results = await sock.query({
            tag: 'iq',
            attrs: {
                type: "get",
                xmlns: "w:g2",
                to: "@g.us"
            }, content: [{ tag: "invite", attrs: { code } }]
        });
        const group = getBinaryNodeChild(results, "group");
        return group.attrs;
    }
    sock.sendMessageFromContent = async(mess, obj, opt = {}) => {
    let prepare = await generateWAMessageFromContent(typeof mess == 'object'?mess.key.remoteJid: mess, obj, opt)
    await sock.relayMessage(prepare.key.remoteJid, prepare.message, {
      messageId: prepare.key.id
    })
    return prepare
    }
    // creds.update
    sock.ev.on("creds.update", saveState)
    // connection.update
    sock.ev.on("connection.update", (up) => {
        const { lastDisconnect, connection } = up
        if (connection === "close") {
            if (new Boom(lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                start()
            } else {
                console.log("Closed")
            }
        }
    })
    // messages.upsert
    sock.ev.on("messages.upsert", async (m) => {
        chatHandler(m, sock);
    })
    // group-participants.update
    sock.ev.on("group-participants.update", (json) => {
        joinhandler(json, sock);
    })
}

start()