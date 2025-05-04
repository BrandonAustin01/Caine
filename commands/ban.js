const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const config = require("../config/config.json");
const securityLog = require("../utils/securityLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to ban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
        .setRequired(false)
    ),

  category: "Moderation", // or 'Configuration', 'Ranking', etc.
  adminOnly: true, // if admin-gated

  category: "Security", // or 'Configuration', 'Ranking', etc.
  adminOnly: true, // if admin-gated

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Try to fetch the member from the guild
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: `❌ Could not find a member with ID \`${target.id}\` in this server.`,
        flags: 1 << 6,
      });
    }

    if (!member.bannable) {
      return interaction.reply({
        content: `⚠️ I cannot ban ${target.tag}. Check role hierarchy and permissions.`,
        flags: 1 << 6,
      });
    }

    try {
      // ✅ Attempt DM
      await target
        .send({
          embeds: [
            new EmbedBuilder()
              .setTitle("⛔ You have been banned")
              .setColor(0xff5555)
              .setDescription(
                `You have been banned from **${interaction.guild.name}**.`
              )
              .addFields({ name: "Reason", value: reason })
              .setTimestamp(),
          ],
        })
        .catch(() => {}); // DM might fail, ignore it

      // ✅ Ban the member
      await member.ban({ reason });

      const logEmbed = new EmbedBuilder()
        .setTitle("🚫 Member Banned")
        .setColor(0xff5555)
        .addFields(
          {
            name: "👤 User",
            value: `${target.tag} (${target.id})`,
            inline: true,
          },
          { name: "📄 Reason", value: reason, inline: true },
          { name: "🔧 Moderator", value: interaction.user.tag, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: "Cain • Ban Log" });

      // ✅ Log to mod-log channel
      const logChannelId = config.modLogChannel;
      const logChannel = logChannelId
        ? interaction.guild.channels.cache.get(logChannelId)
        : null;

      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [logEmbed] });
      }

      // ✅ Internal log
      securityLog.log(
        `🔨 Banned user ${target.tag} (${target.id}) by ${interaction.user.tag} — Reason: ${reason}`
      );

      // ✅ Ephemeral reply to moderator
      return interaction.reply({ embeds: [logEmbed], flags: 1 << 6 });
    } catch (err) {
      console.error(err);
      securityLog.log(`❌ Ban error for ${target.id}: ${err.message}`);
      return interaction.reply({
        content: "❌ Failed to ban user due to an error.",
        flags: 1 << 6,
      });
    }
  },
};
