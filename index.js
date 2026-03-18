// --- Dummy port for Render Web Service ---
import express from "express";
const app = express();
const port = process.env.PORT || 3000;
import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } from "discord.js";
import tmi from "tmi.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// === Discord Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = process.env.PREFIX || "!";

// === Moderation Commands ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const member = message.member;
  const target = message.mentions.members.first();

  if (!member.permissions.has(PermissionsBitField.Flags.BanMembers || PermissionsBitField.Flags.KickMembers))
    return message.reply("You don't have permission to use moderation commands.");

  if (command === "ban") {
    if (!target) return message.reply("Please mention a user to ban.");
    const reason = args.join(" ") || "No reason provided";
    try {
      await target.ban({ reason });
      message.channel.send(`✅ Banned ${target.user.tag} | Reason: ${reason}`);
    } catch {
      message.channel.send("❌ I cannot ban this user.");
    }
  }

  if (command === "kick") {
    if (!target) return message.reply("Please mention a user to kick.");
    const reason = args.join(" ") || "No reason provided";
    try {
      await target.kick(reason);
      message.channel.send(`✅ Kicked ${target.user.tag} | Reason: ${reason}`);
    } catch {
      message.channel.send("❌ I cannot kick this user.");
    }
  }

  if (command === "mute") {
    if (!target) return message.reply("Please mention a user to mute.");
    let muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");

    if (!muteRole) {
      try {
        muteRole = await message.guild.roles.create({
          name: "Muted",
          permissions: [],
        });
        message.guild.channels.cache.forEach(async (channel) => {
          await channel.permissionOverwrites.edit(muteRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false,
          });
        });
      } catch (err) {
        console.log(err);
      }
    }

    const duration = args[1] ? parseInt(args[1]) * 1000 : null;
    await target.roles.add(muteRole);
    message.channel.send(
      `✅ Muted ${target.user.tag}${duration ? ` for ${args[1]} seconds` : ""}`
    );

    if (duration) {
      setTimeout(() => {
        target.roles.remove(muteRole);
        message.channel.send(`🔊 Unmuted ${target.user.tag}`);
      }, duration);
    }
  }

  if (command === "unmute") {
    if (!target) return message.reply("Please mention a user to unmute.");
    const muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");
    if (!muteRole) return message.reply("Muted role does not exist.");
    await target.roles.remove(muteRole);
    message.channel.send(`🔊 Unmuted ${target.user.tag}`);
  }
});

// === Twitch Chat Bridge ===
const twitchClient = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH,
  },
  channels: process.env.TWITCH_CHANNELS.split(","),
});

twitchClient.connect();

twitchClient.on("message", (channel, tags, message, self) => {
  if (self) return;
  const discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (discordChannel) {
    discordChannel.send(`**${tags["display-name"]}** (Twitch): ${message}`);
  }
});

// === Twitch Live Notifications ===
let liveStatus = {};

setInterval(async () => {
  const channels = process.env.TWITCH_CHANNELS.split(",");
  for (const channel of channels) {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${channel}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
        },
      }
    );
    const data = await response.json();
    const isLive = data.data && data.data.length > 0;

    if (isLive && !liveStatus[channel]) {
      liveStatus[channel] = true;
      const discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
      if (discordChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`${channel} is now LIVE on Twitch!`)
          .setURL(`https://twitch.tv/${channel}`)
          .setColor("#9146FF")
          .setDescription(data.data[0].title)
          .setImage(data.data[0].thumbnail_url.replace("{width}x{height}", "1280x720"));
        discordChannel.send({ embeds: [embed] });
      }
    } else if (!isLive) {
      liveStatus[channel] = false;
    }
  }
}, 60_000);

// === Login ===
client.login(process.env.DISCORD_TOKEN);
