import { Client, GatewayIntentBits } from "discord.js";
import { GiveawaysManager } from "discord-giveaways";
import { QuickDB } from "quick.db";
import fs from "fs";

// Load environment variables from Render secrets
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN is not set in Render environment variables.");
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Initialize database
const db = new QuickDB();

// Ensure giveaways storage exists
const giveawaysFile = "./giveaways.json";
if (!fs.existsSync(giveawaysFile)) {
  fs.writeFileSync(giveawaysFile, "[]", "utf-8");
}

// Initialize giveaways manager
const manager = new GiveawaysManager(client, {
  storage: giveawaysFile,
  updateCountdownEvery: 5000,
  default: {
    botsCanWin: false,
    embedColor: "#FF0000",
    reaction: "🎉"
  }
});

// Events
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

manager.on("giveawayEnded", (giveaway, winners) => {
  console.log(`Giveaway ended: ${giveaway.messageId}, Winners: ${winners.map(u => u.tag).join(", ")}`);
});

// Login
client.login(token);
