const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;

        const embed = {
            title: "🛒 New Purchase",
            color: 0x9b59b6,
            thumbnail: {
                url: "https://media.discordapp.net/attachments/1508157696384307230/1509086078056009869/ChatGPT_Image_May_25_2026_10_10_27_PM.png"
            },
            fields: [
                {
                    name: "Customer",
                    value: data.customer_email || "Unknown",
                    inline: true
                },
                {
                    name: "Product",
                    value: data.product_name || "Unknown",
                    inline: true
                },
                {
                    name: "Amount",
                    value: `$${data.price || "0"}`,
                    inline: true
                }
            ],
            footer: {
                text: "Lil Pump Stock Server: https://discord.gg/EkFXMfWCyW"
            },
            timestamp: new Date()
        };

        await axios.post(process.env.DISCORD_WEBHOOK, {
            embeds: [embed]
        });

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
