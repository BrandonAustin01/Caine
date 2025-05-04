const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isRateLimited } = require("../utils/rateLimiter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("baninfo")
    .setDescription("Show ban reason and details for a user by ID.")
    .addStringOption((option) =>
      option
        .setName("userid")
        .setDescription("The ID of the banned user")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString("userid");

    if (isRateLimited(interaction.user.id, 5000)) {
      return interaction.reply({
        content: "⏳ Slow down! Try again in a few seconds.",
        ephemeral: true,
      });
    }

    try {
      const ban = await interaction.guild.bans.fetch(userId);

      const embed = new EmbedBuilder()
        .setTitle(`🚫 Ban Info: ${ban.user.tag}`)
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(0xff5555)
        .addFields(
          { name: "User ID", value: ban.user.id, inline: true },
          {
            name: "Reason",
            value: ban.reason || "No reason provided",
            inline: false,
          },
          {
            name: "Banned By",
            value: "⚠️ Not available via Discord API",
            inline: false,
          }
        )
        .setFooter({
          text: "Note: Discord does not expose ban timestamps or executor via the API.",
        });

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({
        content: `❌ No ban found for \`${userId}\`, or the user was never banned.`,
        ephemeral: true,
      });
    }
  },
};
