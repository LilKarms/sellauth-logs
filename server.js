const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.post("/webhook", async (req, res) => {

    const data = req.body;

    await axios.post(process.env.DISCORD_WEBHOOK, {
        content:
`🛒 NEW ORDER

Product: ${data.product_name}
Price: ${data.total}
Buyer: ${data.customer_email}`
    });

    res.send("ok");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Running...");
});
