const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const config = require('../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Open Cain’s interactive config panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const antiRaid = config.antiRaid;
    const spamFilter = config.spamFilter;

    const antiRaidEmbed = new EmbedBuilder()
      .setTitle('🛡️ Anti-Raid Settings')
      .setDescription('Live settings for Cain’s raid detection system.')
      .setColor(antiRaid.enabled ? 0x4caf50 : 0xf44336)
      .addFields(
        { name: '📌 Enabled', value: antiRaid.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
        { name: '👥 Max Joins', value: `\`${antiRaid.maxJoins}\``, inline: true },
        { name: '⏱️ Interval', value: `\`${antiRaid.intervalMs / 1000}s\``, inline: true },
        { name: '🚨 Punishment', value: `\`${antiRaid.punishment.toUpperCase()}\``, inline: true },
        { name: '🕒 Cooldown', value: `\`${antiRaid.cooldownMs / 1000}s\``, inline: true }
      );

    const spamFilterEmbed = new EmbedBuilder()
      .setTitle('🧹 Spam Filter Settings')
      .setDescription('Live settings for Cain’s spam detection system.')
      .setColor(spamFilter.enabled ? 0x4caf50 : 0xf44336)
      .addFields(
        { name: '📌 Enabled', value: spamFilter.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
        { name: '💬 Max Messages', value: `\`${spamFilter.maxMessages}\``, inline: true },
        { name: '⏱️ Interval', value: `\`${spamFilter.intervalMs / 1000}s\``, inline: true },
        { name: '⚖️ Punishment', value: `\`${spamFilter.punishment.toUpperCase()}\``, inline: true },
        { name: '🕒 Cooldown', value: `\`${spamFilter.cooldownMs / 1000}s\``, inline: true }
      );

    const antiRaidButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('toggle_antiRaid').setLabel('Enable/Disable').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_maxJoins').setLabel('Max Joins').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_interval').setLabel('Interval').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_punishment').setLabel('Punishment').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_cooldown').setLabel('Cooldown').setStyle(ButtonStyle.Secondary)
    );

    const spamFilterButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('toggle_spamFilter').setLabel('Enable/Disable').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_spam_max').setLabel('Max Messages').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_spam_interval').setLabel('Interval').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_spam_punishment').setLabel('Punishment').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_spam_cooldown').setLabel('Cooldown').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: '⚙️ Cain Config Panel',
      embeds: [antiRaidEmbed, spamFilterEmbed],
      components: [antiRaidButtons, spamFilterButtons],
      ephemeral: true
    });
  }
};
