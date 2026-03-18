import { Client, GatewayIntentBits } from 'discord.js';
import { GiveawaysManager } from 'discord-giveaways';
import { QuickDB } from 'quick.db'; // ✅ Correct import
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
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

const db = new QuickDB(); // ✅ Works now

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

client.on('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!ping') {
    message.channel.send('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);
