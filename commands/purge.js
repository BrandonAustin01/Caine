const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const config = require("../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages in this channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (max 100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Only delete messages from this user")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const target = interaction.options.getUser("target");

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let filtered;

    if (target) {
      filtered = messages
        .filter((msg) => msg.author.id === target.id)
        .first(amount);
    } else {
      filtered = messages.first(amount);
    }

    try {
      const deleted = await interaction.channel.bulkDelete(filtered, true);

      const responseEmbed = new EmbedBuilder()
        .setTitle("🧹 Messages Purged")
        .setColor(0xff5555)
        .addFields(
          { name: "Deleted", value: `${deleted.size} messages`, inline: true },
          {
            name: "Filtered By",
            value: target ? `${target.tag}` : "Everyone",
            inline: true,
          }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

      // Log to mod log channel if configured
      if (config.modLogChannel) {
        const logChannel = interaction.guild.channels.cache.get(
          config.modLogChannel
        );
        if (logChannel && logChannel.type === ChannelType.GuildText) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🧹 Purge Logged")
            .setColor(0xff8844)
            .addFields(
              {
                name: "Moderator",
                value: `<@${interaction.user.id}>`,
                inline: true,
              },
              {
                name: "Channel",
                value: `<#${interaction.channel.id}>`,
                inline: true,
              },
              { name: "Amount", value: `${deleted.size}`, inline: true },
              {
                name: "Targeted User",
                value: target ? `${target.tag}` : "None",
                inline: true,
              }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    } catch (err) {
      console.error("❌ Purge failed:", err);
      return interaction.reply({
        content:
          "❌ Could not purge messages. Messages older than 14 days cannot be deleted.",
        ephemeral: true,
      });
    }
  },
};
