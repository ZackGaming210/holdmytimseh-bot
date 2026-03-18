// index.js
import { Client, GatewayIntentBits } from 'discord.js';
import { GiveawaysManager } from 'discord-giveaways';
import { QuickDB } from 'quick.db';

// === Create Discord client ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
});

// === Setup QuickDB for giveaways ===
const db = new QuickDB();

// === Setup GiveawaysManager ===
const manager = new GiveawaysManager(client, {
    storage: './giveaways.json', // storage file
    default: {
        botsCanWin: false,
        embedColor: '#FF0000',
        reaction: '🎉',
    },
});

client.giveawaysManager = manager;

// === Bot ready event ===
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// === Optional: simple message command example ===
client.on('messageCreate', (message) => {
    if (message.content.toLowerCase() === '!ping') {
        message.reply('Pong!');
    }
});

// === Login ===
client.login(process.env.BOT_TOKEN); // Set BOT_TOKEN in Render secrets
