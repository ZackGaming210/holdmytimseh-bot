import { Client, GatewayIntentBits } from 'discord.js';
import { GiveawaysManager } from 'discord-giveaways';
import { QuickDB } from 'quick.db'; // ✅ Correct ESM import
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ms from 'ms';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// QuickDB
const db = new QuickDB();

// Giveaways manager
const { Client, GatewayIntentBits } = require('discord.js');
const { GiveawaysManager } = require('discord-giveaways');
const client = new Client({ intents: 32767 });

const manager = new GiveawaysManager(client, {
  storage: './giveaways.json',
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

// Login using environment variable
client.login(process.env.DISCORD_TOKEN);
