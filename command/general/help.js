const djs = require("@discordjs/collection")
const moment = require('moment-timezone')
const ucapan = "Selamat "+ moment(Date.now()).tz('Asia/Jakarta').locale('id').format('a')

module.exports = {
    name: "help",
    alias: ["h", "cmd", "menu"],
    category: "general",
    async exec(msg, sock, args) {
        if (args[0]) {
            const data = [];
            const name = args[0].toLowerCase();
            const { commands, prefix } = djs;
            const cmd = commands.get(name) || commands.find((cmd) => cmd.alias && cmd.alias.includes(name));
            if (!cmd || cmd.category === "private") return await sock.sendMessage(msg.from, { text: "No command found" }, { quoted: msg });
            else data.push(cmd.name);
            if (cmd.alias) data.push(`*Alias:* ${cmd.alias.join(', ')}`);
            if (cmd.desc) data.push(`*Description:* ${cmd.desc}`);
            if (cmd.use) data.push(`*Usage:* ${prefix}${cmd.name} ${cmd.use}\n\nNote: [] = optional, | = or, <> = must filled`);

            return await sock.sendMessage(msg.from, { text: data.join('\n') }, { quoted: msg })
        } else {
            const { pushName, sender } = msg;
            const { prefix, commands } = djs;
            const cmds = commands.keys()
            let category = [];

            for (let cmd of cmds) {
                let info = commands.get(cmd);
                if (!cmd) continue;
                if (!info.category || info.category === 'private') continue;
                if (Object.keys(category).includes(info.category)) category[info.category].push(info);
                else {
                    category[info.category] = [];
                    category[info.category].push(info);
                }
            }
            let str = `Hello, ${pushName === undefined ? sender.split("@")[0] : pushName}\n${ucapan}\n\n`;
            const keys = Object.keys(category);
            for (const key of keys) {
                str += `*</${key.toUpperCase()}>*\n≻ ${category[key]
                    .map((cmd) => cmd.name).join('\n')}\n\n`
            }
            //str += `send ${prefix}help followed by a command name to get detail of command, e.g. ${prefix}help sticker`;
            await sock.sendMessage(msg.from, {
            	image: { url: fs.readFileSync('././temp/img.jpg') },
                text: str,
                footer: "Rzx Bot Multi Device",
                templateButtons: [
                    { urlButton: { displayText: "Group Chat", url: "https://chat.whatsapp.com/KaZAmu5laH85QSQDUD5M2p" } }
                ]
            }, { quoted: msg })
        }
    }
}