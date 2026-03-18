const { Client, GatewayIntentBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const { GiveawaysManager } = require("discord-giveaways");
const ms = require("ms");

const db = new QuickDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🎁 Giveaway system
const manager = new GiveawaysManager(client, {
  storage: "./giveaways.json"
});

client.once("ready", () => {
  console.log("🔥 Bot is online");
});

// 🎉 Welcome system
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(c => c.name === "general");
  if (channel) {
    channel.send(`🎉 Welcome ${member.user} to the server!`);
  }

  const role = member.guild.roles.cache.find(r => r.name === "Member");
  if (role) member.roles.add(role);
});

// 💬 Commands + Level system
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // XP system
  let xp = await db.get(`xp_${message.author.id}`) || 0;
  xp += 5;
  await db.set(`xp_${message.author.id}`, xp);

  let level = await db.get(`level_${message.author.id}`) || 1;

  if (xp >= level * 100) {
    await db.set(`xp_${message.author.id}`, 0);
    await db.set(`level_${message.author.id}`, level + 1);
    message.channel.send(`🔥 ${message.author} leveled up to ${level + 1}`);
  }

  const args = message.content.split(" ");
  const cmd = args.shift().toLowerCase();

  // 📈 Level
  if (cmd === "!level") {
    let xp = await db.get(`xp_${message.author.id}`) || 0;
    let level = await db.get(`level_${message.author.id}`) || 1;
    message.channel.send(`Level: ${level} | XP: ${xp}`);
  }

  // 🏆 Leaderboard
  if (cmd === "!leaderboard") {
    const data = await db.all();
    const levels = data
      .filter(x => x.id.startsWith("level_"))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    let text = "🏆 Leaderboard:\n";
    for (let i = 0; i < levels.length; i++) {
      const userId = levels[i].id.split("_")[1];
      const user = await client.users.fetch(userId);
      text += `${i + 1}. ${user.username} - Level ${levels[i].value}\n`;
    }

    message.channel.send(text);
  }

  // 🧹 Clear messages
  if (cmd === "!clear") {
    if (!message.member.permissions.has("ManageMessages")) return;
    const amount = parseInt(args[0]);
    if (!amount) return message.reply("Enter number");

    message.channel.bulkDelete(amount);
  }

  // 🎁 Giveaway
  if (cmd === "!giveaway") {
    const duration = ms(args[0]);
    const winners = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    if (!duration || !winners || !prize) {
      return message.reply("Usage: !giveaway 1m 1 Prize");
    }

    manager.start(message.channel, {
      duration,
      winnerCount: winners,
      prize
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
