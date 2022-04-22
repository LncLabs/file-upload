// Export logger function

const colors = require("colors");
const cfg = require("./config.json");
const Discord = require('discord.js');
const webhookClient = new Discord.WebhookClient({ id: cfg.webhookId, token: cfg.webhookToken });

module.exports = {
    error: async function (title, msg) {

        console.error(colors.black(`[${title}] `).bgRed, msg);

        let color = "#ff0000";

        let message = msg.length > 1800 ? `${msg.slice(0, 1800)}...` : msg;

        let msgToSend = `\`\`\`js\n${message}\`\`\``;

        // Create embed to send in webhook
        try {
            let logCode = "0x" + Math.floor(Math.random() * 16777215).toString(16);

            let embed = new Discord.MessageEmbed()
                .setTitle(title)
                .setDescription(msgToSend)
                .setColor(color)
                .setFooter({ text: "Check console for detailed logs." + `| ${logCode}` })
                .setTimestamp();

            // Send embed to webhook
            return webhookClient.send({
                username: "CDN LOGS",
                embeds: [embed]
            })
        } catch (e) {
            console.error(colors.black(`[DISCORD WEBHOOK]`).bgRed, e);
        }
    },
    warn: async function (title, msg) {

        console.warn(colors.black(`[${title}] `).bgYellow, msg);

        let color = "#ffd700";

        let message = msg.length > 1800 ? `${msg.slice(0, 1800)}...` : msg;

        try {

            let logCode = "0x" + Math.floor(Math.random() * 16777215).toString(16);

            let embed = new Discord.MessageEmbed()
                .setTitle(title)
                .setDescription(message)
                .setColor(color)
                .setFooter({ text: "Check console for detailed logs." + `| ${logCode}` })
                .setTimestamp();

            // Send embed to webhook
            return webhookClient.send({
                username: "CDN LOGS",
                embeds: [embed]
            })
        } catch (e) {
            console.error(colors.black(`[DISCORD WEBHOOK]`).bgRed, e);
        }
    },
    info: async function (title, msg) {

        console.log(colors.black(`[${title}] `).bgGreen, msg);

        let color = "#15ff00";

        let message = msg.length > 1800 ? `${msg.slice(0, 1800)}...` : msg;

        try {

            let logCode = "0x" + Math.floor(Math.random() * 16777215).toString(16);

            let embed = new Discord.MessageEmbed()
                .setTitle(title)
                .setDescription(message)
                .setColor(color)
                .setFooter({ text: "Check console for detailed logs." + `| ${logCode}` })
                .setTimestamp();

            // Send embed to webhook
            return webhookClient.send({
                username: "CDN LOGS",
                embeds: [embed]
            })
        } catch (e) {
            console.error(colors.black(`[DISCORD WEBHOOK]`).bgRed, e);
        }
    },
    debug: async function (title, msg) {

        console.log(colors.black(`[${title}] `).bgBlue, msg);

        let color = "#0000ff";

        let message = msg.length > 1800 ? `${msg.slice(0, 1800)}...` : msg;

        try {

            let logCode = "0x" + Math.floor(Math.random() * 16777215).toString(16);

            let embed = new Discord.MessageEmbed()
                .setTitle(title)
                .setDescription(message)
                .setColor(color)
                .setFooter({ text: "Check console for detailed logs." + `| ${logCode}` })
                .setTimestamp();

            // Send embed to webhook
            return webhookClient.send({
                username: "CDN LOGS",
                embeds: [embed]
            })
        } catch (e) {
            console.error(colors.black(`[DISCORD WEBHOOK]`).bgRed, e);
        }
    },
    message: async function (msg) {

        console.log(msg);

        let message = msg.length > 1800 ? `${msg.slice(0, 1800)}...` : msg;

        // Send to webhook as normal text.
        try {
            return webhookClient.send({
                username: "CDN LOGS",
                content: message
            });
        } catch (e) {
            console.error(colors.black(`[DISCORD WEBHOOK]`).bgRed, e);
        }
    }
}