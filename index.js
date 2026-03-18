import { Client, GatewayIntentBits } from "discord.js";
import { GiveawaysManager } from "discord-giveaways";
import { QuickDB } from "quick.db";
import fs from "fs";
import tmi from "tmi.js";
import dotenv from "dotenv";

dotenv.config();
const token = process.env.BOT_TOKEN;

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Database
const db = new QuickDB();

// Giveaways
const giveawaysFile = "./giveaways.json";
if (!fs.existsSync(giveawaysFile)) fs.writeFileSync(giveawaysFile, "[]");
const manager = new GiveawaysManager(client, {
  storage: giveawaysFile,
  updateCountdownEvery: 5000,
  default: {
    botsCanWin: false,
    embedColor: "#FF0000",
    reaction: "🎉"
  }
});

// Moderation & leveling
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const prefix = "!";

  // LEVELING SYSTEM
  const xp = Math.floor(Math.random() * 10) + 5; // 5-15 XP per message
  const userId = `${message.guild.id}-${message.author.id}`;
  let currentXP = (await db.get(`${userId}.xp`)) || 0;
  let level = (await db.get(`${userId}.level`)) || 1;

  currentXP += xp;
  const nextLevelXP = level * 100;

  if (currentXP >= nextLevelXP) {
    level++;
    currentXP = currentXP - nextLevelXP;
    message.channel.send(`🎉 ${message.author}, you leveled up to **Level ${level}**!`);
  }

  await db.set(`${userId}.xp`, currentXP);
  await db.set(`${userId}.level`, level);

  // COMMANDS
  if (!message.content.startsWith(prefix)) return;
  const [cmd, ...args] = message.content.slice(prefix.length).split(" ");

  // Moderation commands
  if (cmd === "kick") {
    if (!message.member.permissions.has("KickMembers")) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply("Mention a user to kick!");
    await member.kick();
    message.reply(`Kicked ${member.user.tag}`);
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has("BanMembers")) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply("Mention a user to ban!");
    await member.ban();
    message.reply(`Banned ${member.user.tag}`);
  }

  if (cmd === "level") {
    message.reply(`${message.author}, you are level **${level}** with **${currentXP} XP**.`);
  }
});

// Twitch chat bridge
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: { reconnect: true },
  channels: ["YourTwitchChannel"]
});
twitchClient.connect();

twitchClient.on("message", (channel, tags, msg) => {
  const discordChannel = client.channels.cache.get("DISCORD_CHANNEL_ID");
  if (discordChannel) discordChannel.send(`[Twitch] ${tags.username}: ${msg}`);
});

client.on("messageCreate", message => {
  if (message.channel.id === "DISCORD_CHANNEL_ID" && !message.author.bot) {
    twitchClient.say("YourTwitchChannel", `[Discord] ${message.author.username}: ${message.content}`);
  }
});

// Login
client.once("ready", () => console.log(`✅ Logged in as ${client.user.tag}`));
client.login(token);
