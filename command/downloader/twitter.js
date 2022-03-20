const { getInfo } = require('../../utils/downloader')
const lang = require('../other/text.json')

module.exports = {
    name: 'twtdl',
    alias: ['twt'],
    category: 'downloader',
    async exec(msg, sock, args) {
        if (!args.length > 0 || !args[0].includes('twitter.com') || args[0].includes('t.co')) return await sock.sendMessage(msg.from, { text: 'URL needed' }, { quoted: msg })
        getInfo(args[0]).then(async (data) => {
            if (data.type === 'video') {
                const content = data.variants.filter(x => x.content_type !== 'application/x-mpegURL').sort((a, b) => b.bitrate - a.bitrate)
                await sock.sendMessage(msg.from, { video: { url: content[0].url } }, { quoted: msg })
            } else if (data.type === 'photo') {
                for (let z = 0; z < data.variants.length; z++) {
                    await sock.sendMessage(msg.from, { image: { url: data.variants[z] } }, { quoted: msg })
                }
            } else if (data.type === 'animated_gif') {
                const content = data.variants[0]['url']
                await sock.sendMessage(msg.from, { video: { url: content } }, { quoted: msg })
            }
        }).catch(async() => { await sock.sendMessage(msg.from, { text: `IND:\n${lang.indo.util.download.twittFail}\n\nEN:\n${lang.eng.util.download.twittFail}` }, { quoted: msg }) })
    }
}