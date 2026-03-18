import { Client, GatewayIntentBits } from 'discord.js';
import { GiveawaysManager } from 'discord-giveaways';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import QuickDB from 'quick.db';
import ms from 'ms';

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// QuickDB setup
const db = new QuickDB();

// Giveaways manager setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manager = new GiveawaysManager(client, {
  storage: path.join(__dirname, 'giveaways.json'),
  updateCountdownEvery: 5000,
  default: {
    botsCanWin: false,
    embedColor: '#FF0000',
    reaction: '🎉'
  }
});

client.giveawaysManager = manager;

// Bot ready
client.on('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

// Example: simple message command
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!ping') {
    message.channel.send('Pong!');
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);
