const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const TOKEN = process.env.TOKEN;

// APPLICATION ID
const CLIENT_ID = '1508813594924683384';

// PUT YOUR LOGS CHANNEL ID HERE
const LOG_CHANNEL_ID = '1509146646414360616';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', async () => {

    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{
            name: 'Lil Pump Stock',
            type: 3
        }],
        status: 'online'
    });

    const commands = [
        new SlashCommandBuilder()
            .setName('redeem')
            .setDescription('Redeem your key')
            .addStringOption(option =>
                option
                    .setName('key')
                    .setDescription('Enter your redeem key')
                    .setRequired(true)
            )
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('Slash command registered.');

    } catch (error) {

        console.error(error);

    }

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'redeem') {

        const key = interaction.options.getString('key');

        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

        // READ KEYS
        let keys = fs.readFileSync('./keys.txt', 'utf8')
            .split('\n')
            .map(k => k.trim())
            .filter(Boolean);

        // INVALID KEY
        if (!keys.includes(key)) {

            const invalidEmbed = new EmbedBuilder()
                .setTitle('❌ Invalid Redeem Attempt')
                .addFields(
                    {
                        name: 'Discord Username',
                        value: interaction.user.tag
                    },
                    {
                        name: 'Discord ID',
                        value: interaction.user.id
                    },
                    {
                        name: 'Key Tried',
                        value: key
                    },
                    {
                        name: 'Key Result',
                        value: 'Invalid or Used'
                    }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            if (logChannel) {
                logChannel.send({ embeds: [invalidEmbed] });
            }

            return interaction.reply({
                content: '❌ Invalid or Used Key.',
                ephemeral: true
            });

        }

        // REMOVE USED KEY
        keys = keys.filter(k => k !== key);

        fs.writeFileSync('./keys.txt', keys.join('\n'));

        // READ COMBO STOCK
        let combos = fs.readFileSync('./combo.txt', 'utf8')
            .split('\n')
            .filter(Boolean);

        // CHECK STOCK
        if (combos.length < 1000) {

            return interaction.reply({
                content: '❌ Not enough stock remaining.',
                ephemeral: true
            });

        }

        // GET FIRST 1000 LINES
        const claimed = combos.slice(0, 1000);

        // REMOVE CLAIMED LINES
        combos = combos.slice(1000);

        fs.writeFileSync('./combo.txt', combos.join('\n'));

        // TEMP FILE NAME
        const filename = `claim-${interaction.user.id}.txt`;

        // CREATE TXT FILE
        fs.writeFileSync(filename, claimed.join('\n'));

        // SUCCESS LOG
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ New Redeem')
            .addFields(
                {
                    name: 'Discord Username',
                    value: interaction.user.tag
                },
                {
                    name: 'Discord ID',
                    value: interaction.user.id
                },
                {
                    name: 'Redeemed Key',
                    value: key
                },
                {
                    name: 'Key Result',
                    value: 'Used Successfully'
                },
                {
                    name: 'Lines Sent',
                    value: '1000'
                },
                {
                    name: 'Remaining Stock',
                    value: `${combos.length}`
                }
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

        if (logChannel) {
            logChannel.send({ embeds: [successEmbed] });
        }

        // SEND FILE
        await interaction.reply({
            content:
`✅ Successfully Redeemed!

📦 You received 1000 lines.

Please vouch us here:
https://discord.com/channels/1507954297290100887/1507964172250513498`,
            files: [filename],
            ephemeral: true
        });

        // DELETE TEMP FILE
        setTimeout(() => {

            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename);
            }

        }, 5000);

    }

});

client.login(TOKEN);
