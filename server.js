const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());

const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// LOAD USED KEYS
let usedKeys = {};
if (fs.existsSync('./used.json')) {
    usedKeys = JSON.parse(fs.readFileSync('./used.json'));
}

// PRODUCTS
let products = {
    combo: { stock: "products/combo.txt", keys: "keys/combo.txt" },
    premium: { stock: "products/premium.txt", keys: "keys/premium.txt" },
    cheap: { stock: "products/cheap.txt", keys: "keys/cheap.txt" },
    "5k": { stock: "products/5k.txt", keys: "keys/5k.txt" },
    "21k": { stock: "products/21k.txt", keys: "keys/21k.txt" },
    "31k": { stock: "products/31k.txt", keys: "keys/31k.txt" },
    "51k": { stock: "products/51k.txt", keys: "keys/51k.txt" },
    "100k": { stock: "products/100k.txt", keys: "keys/100k.txt" },
    "100kup": { stock: "products/100kup.txt", keys: "keys/100kup.txt" }
};

// READY
client.once('ready', async () => {

    console.log(`Logged in as ${client.user.tag}`);

    const commands = [

        new SlashCommandBuilder()
            .setName('redeem')
            .setDescription('Redeem key')
            .addStringOption(opt => opt.setName('key').setRequired(true))
            .addStringOption(opt =>
                opt.setName('product').setRequired(true)
                    .addChoices(
                        { name: 'Combo', value: 'combo' },
                        { name: 'Premium', value: 'premium' },
                        { name: 'Cheap', value: 'cheap' }
                    )
            ),

        new SlashCommandBuilder()
            .setName('genkey')
            .setDescription('Generate keys')
            .addIntegerOption(opt => opt.setName('amount').setRequired(true))
            .addStringOption(opt =>
                opt.setName('product').setRequired(true)
                    .addChoices(
                        { name: 'Combo', value: 'combo' },
                        { name: 'Premium', value: 'premium' },
                        { name: 'Cheap', value: 'cheap' }
                    )
            ),

        new SlashCommandBuilder()
            .setName('update')
            .setDescription('Update dashboard')

    ].map(c => c.toJSON());

    const rest = new REST({ version: '10' }).setToken(config.TOKEN);
    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });

    setInterval(updateDashboard, 30000);
});

// DASHBOARD
async function updateDashboard() {

    let channel;
    try {
        channel = await client.channels.fetch(config.DASHBOARD_CHANNEL_ID);
    } catch { return; }

    let fields = [];

    for (let name in products) {

        let stockFile = products[name].stock;

        if (!fs.existsSync(stockFile)) continue;

        let stock = fs.readFileSync(stockFile, 'utf8').split('\n').filter(Boolean).length;
        let sold = Object.values(usedKeys).filter(k => k.product === name).length;

        let warn = stock <= 5 ? " ⚠️ LOW" : "";

        fields.push({
            name: `${name.toUpperCase()}${warn}`,
            value: `Stock: ${stock}\nSold: ${sold}`
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0f172a')
        .setTitle('🟢 STORE DASHBOARD')
        .addFields(fields)
        .setTimestamp();

    if (!global.msg) {
        global.msg = await channel.send({ embeds: [embed] });
    } else {
        await global.msg.edit({ embeds: [embed] });
    }
}

// COMMANDS
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const isOwner = interaction.user.id === config.OWNER_ID;

    // GENKEY (UPDATED SYSTEM)
    if (interaction.commandName === 'genkey') {

        if (!isOwner) return interaction.reply({ content: '❌', ephemeral: true });

        const amount = interaction.options.getInteger('amount');
        const product = interaction.options.getString('product');

        let rawKeys = [];
        let styledKeys = [];

        for (let i = 0; i < amount; i++) {

            let code = Math.random().toString(36).substring(2, 8).toUpperCase();
            let cleanKey = `SL-${product.toUpperCase()}-${code}`;

            rawKeys.push(cleanKey);

            styledKeys.push(
                `${cleanKey} → JOIN DISCORD TO REDEEM YOUR KEY → https://discord.gg/EkFXMfWCyW`
            );
        }

        fs.appendFileSync(products[product].keys, '\n' + rawKeys.join('\n'));

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#0f172a')
                    .setTitle('🔑 KEYS GENERATED')
                    .setDescription(`Generated ${amount} keys for ${product}`)
            ],
            files: [{
                attachment: Buffer.from(styledKeys.join('\n')),
                name: `${product}_sellauth_keys.txt`
            }],
            ephemeral: true
        });
    }

    // REDEEM
    if (interaction.commandName === 'redeem') {

        const key = interaction.options.getString('key');
        const product = interaction.options.getString('product');

        let keys = fs.readFileSync(products[product].keys,'utf8').split('\n').filter(Boolean);

        if (!keys.includes(key)) {
            return interaction.reply({ content: '❌ Invalid key', ephemeral: true });
        }

        if (usedKeys[key]) {
            return interaction.reply({ content: '❌ Key already used', ephemeral: true });
        }

        let stock = fs.readFileSync(products[product].stock,'utf8').split('\n').filter(Boolean);

        if (stock.length < 1) {
            return interaction.reply({ content: '❌ Out of stock', ephemeral: true });
        }

        const item = stock.shift();
        fs.writeFileSync(products[product].stock, stock.join('\n'));

        usedKeys[key] = {
            userId: interaction.user.id,
            product
        };

        fs.writeFileSync('./used.json', JSON.stringify(usedKeys, null, 2));

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#0f172a')
                    .setTitle('🎉 REDEEM SUCCESSFUL')
                    .setDescription('Check file below.')
            ],
            files: [{
                attachment: Buffer.from(item),
                name: 'account.txt'
            }],
            ephemeral: true
        });
    }

    // UPDATE
    if (interaction.commandName === 'update') {
        if (!isOwner) return;
        await updateDashboard();
        interaction.reply({ content: '✅ Updated', ephemeral: true });
    }

});

client.login(config.TOKEN);
app.listen(3000, () => console.log('Webhook ready'));
