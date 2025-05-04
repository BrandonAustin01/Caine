// commands/mute.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const config = require("../config/config.json");
const securityLog = require("../utils/securityLogger");

function parseDuration(input) {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2];

  const unitMs = {
    s: 1000,
    m: 60_000,
    h: 60 * 60_000,
    d: 24 * 60 * 60_000,
  };

  return amount * unitMs[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Temporarily mute a member (using Discord timeout).")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member to mute")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Mute duration (e.g. 10m, 2h, 1d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the mute")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const rawDuration = interaction.options.getString("duration");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const durationMs = parseDuration(rawDuration);
    if (
      !durationMs ||
      durationMs < 1000 ||
      durationMs > 28 * 24 * 60 * 60 * 1000
    ) {
      return interaction.reply({
        content:
          "❌ Invalid duration. Use formats like `10m`, `2h`, or `1d` (max 28d).",
        flags: 1 << 6,
      });
    }

    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);
    if (!member) {
      return interaction.reply({
        content: "❌ User not found in this server.",
        flags: 1 << 6,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: `⚠️ I can’t mute ${target.tag}.`,
        flags: 1 << 6,
      });
    }

    try {
      await member.timeout(durationMs, reason);

      // DM
      await target
        .send({
          embeds: [
            new EmbedBuilder()
              .setTitle("🔇 You have been muted")
              .setDescription(
                `You have been muted in **${interaction.guild.name}**.`
              )
              .addFields(
                { name: "⏱ Duration", value: rawDuration, inline: true },
                { name: "Reason", value: reason, inline: true }
              )
              .setColor(0xff8800)
              .setTimestamp(),
          ],
        })
        .catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle("🔇 Member Muted")
        .setColor(0xff8800)
        .addFields(
          {
            name: "👤 User",
            value: `${target.tag} (${target.id})`,
            inline: true,
          },
          { name: "⏱ Duration", value: rawDuration, inline: true },
          { name: "📄 Reason", value: reason, inline: true },
          { name: "🔧 Moderator", value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: "Cain • Timed Mute Log" });

      const modlogChannel = config.modLogChannel
        ? interaction.guild.channels.cache.get(config.modLogChannel)
        : null;

      if (modlogChannel && modlogChannel.isTextBased()) {
        await modlogChannel.send({ embeds: [embed] });
      }

      securityLog.log(
        `🔇 Timed mute: ${target.tag} for ${rawDuration} by ${interaction.user.tag} — ${reason}`
      );

      return interaction.reply({ embeds: [embed], flags: 1 << 6 });
    } catch (err) {
      console.error(err);
      securityLog.log(`❌ Mute failed for ${target.tag}: ${err.message}`);
      return interaction.reply({
        content: "❌ Failed to apply timeout.",
        flags: 1 << 6,
      });
    }
  },
};
