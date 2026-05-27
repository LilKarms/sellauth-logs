const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.post("/webhook", async (req, res) => {

    const data = req.body;

    await axios.post(process.env.DISCORD_WEBHOOK, {

        embeds: [
            {
                title: "🛒 New Purchase",
                color: 0x8b5cf6,

                thumbnail: {
                    url: "https://media.discordapp.net/attachments/1508157696384307230/1509086078056009869/ChatGPT_Image_May_25_2026_10_10_27_PM.png"
                },

                fields: [
                    {
                        name: "👤 Buyer",
                        value: data.customer_email || "Unknown",
                        inline: true
                    },
                    {
                        name: "📦 Product",
                        value: data.product_name || "Unknown",
                        inline: true
                    },
                    {
                        name: "💰 Amount",
                        value: `$${data.total || "0"}`,
                        inline: true
                    }
                ],

                footer: {
                    text: "Lil Pump Stock Server • discord.gg/EkFXMfWCyW",
                    icon_url: "https://media.discordapp.net/attachments/1508157696384307230/1509086078056009869/ChatGPT_Image_May_25_2026_10_10_27_PM.png"
                },

                timestamp: new Date()
            }
        ]

    });

    res.send("ok");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Running...");
});
