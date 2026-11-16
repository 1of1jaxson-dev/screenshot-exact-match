import http from "node:http";
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const { DISCORD_TOKEN, GUILD_ID, PORT = 3000 } = process.env;
const HUB = "🎮┃Create Squad";
const squads = new Map(); // channelId -> leaderId
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once("ready", async () => {
  const guild = await client.guilds.fetch(GUILD_ID);
  const chans = await guild.channels.fetch();
  if (!chans.find((c) => c?.name === HUB && c.type === ChannelType.GuildVoice))
    await guild.channels.create({ name: HUB, type: ChannelType.GuildVoice });
  await guild.commands.set([
    new SlashCommandBuilder().setName("invite").setDescription("Invite up to 4 members to your squad")
      .addUserOption((o) => o.setName("user1").setDescription("Member").setRequired(true))
      .addUserOption((o) => o.setName("user2").setDescription("Member"))
      .addUserOption((o) => o.setName("user3").setDescription("Member"))
      .addUserOption((o) => o.setName("user4").setDescription("Member")),
  ]);
  console.log("Ready as", client.user.tag);
});

client.on("voiceStateUpdate", async (oldS, newS) => {
  if (newS.channel?.name === HUB) {
    const m = newS.member;
    const vc = await newS.guild.channels.create({
      name: `${m.displayName}'s Squad`, type: ChannelType.GuildVoice, parent: newS.channel.parentId, userLimit: 5,
      permissionOverwrites: [
        { id: newS.guild.id, deny: [PermissionFlagsBits.Connect] },
        { id: client.user.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] },
        { id: m.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
      ],
    });
    squads.set(vc.id, m.id);
    await m.voice.setChannel(vc).catch(() => {});
  }
  const left = oldS.channel;
  if (left && squads.has(left.id) && left.members.size === 0) {
    squads.delete(left.id);
    await left.delete().catch(() => {});
  }
});

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand() || i.commandName !== "invite") return;
  const vc = i.member.voice.channel;
  if (!vc || squads.get(vc.id) !== i.user.id)
    return i.reply({ content: "You must be the leader of a squad VC.", ephemeral: true });
  const users = ["user1", "user2", "user3", "user4"].map((n) => i.options.getUser(n)).filter(Boolean);
  for (const u of users) await vc.permissionOverwrites.edit(u.id, { Connect: true, ViewChannel: true });
  i.reply({ content: `Invited: ${users.map((u) => `<@${u.id}>`).join(", ")}`, ephemeral: true });
});

function stats() {
  const g = client.guilds.cache.get(GUILD_ID);
  const vcs = g ? [...g.channels.cache.values()].filter((c) => c.isVoiceBased()) : [];
  return {
    online: client.isReady(),
    voiceUsers: vcs.reduce((n, c) => n + c.members.size, 0),
    squadPlayers: vcs.filter((c) => squads.has(c.id)).reduce((n, c) => n + c.members.size, 0),
    activeSquads: squads.size,
  };
}

http.createServer((req, res) => {
  const s = stats();
  const code = req.url === "/health" && !s.online ? 503 : 200;
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(s));
}).listen(PORT);

client.login(DISCORD_TOKEN);
