const fs = require('fs');
const path = require('path');
const sendConfigPanel = require('../utils/sendConfigPanel');


const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const configPath = path.join(__dirname, '../config/config.json');

function confirmInteraction(interaction, label, value) {
  return interaction.followUp({
    content: `✅ \`${label}\` updated to \`${value}\`.`,
    ephemeral: true
  });
}

function saveConfig(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
}

function getConfig() {
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
}

function buildAntiRaidEmbed(antiRaid) {
  return new EmbedBuilder()
    .setTitle('🛡️ Anti-Raid Settings')
    .setDescription('Live configuration panel for Cain\'s auto-raid protection.\nUse the buttons below to adjust values.')
    .setColor(antiRaid.enabled ? 0x4caf50 : 0xf44336)
    .addFields(
      { name: '📌 Enabled', value: antiRaid.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
      { name: '👥 Max Joins', value: `\`${antiRaid.maxJoins}\` users`, inline: true },
      { name: '⏱️ Time Window', value: `\`${antiRaid.intervalMs / 1000}s\``, inline: true },
      { name: '🚨 Punishment', value: `\`${antiRaid.punishment.toUpperCase()}\``, inline: true }
    )
    .setFooter({ text: 'Cain Security Panel • v1.0' })
    .setTimestamp();
}

function buildSpamFilterEmbed(spamFilter) {
  return new EmbedBuilder()
    .setTitle('🧹 Spam Filter Settings')
    .setDescription('Live configuration panel for Cain’s message spam detection.')
    .setColor(spamFilter.enabled ? 0x4caf50 : 0xf44336)
    .addFields(
      { name: '📌 Enabled', value: spamFilter.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
      { name: '💬 Max Messages', value: `\`${spamFilter.maxMessages}\``, inline: true },
      { name: '⏱️ Interval', value: `\`${spamFilter.intervalMs / 1000}s\``, inline: true },
      { name: '⚖️ Punishment', value: `\`${spamFilter.punishment.toUpperCase()}\``, inline: true }
    )
    .setFooter({ text: 'Cain Security Panel • v1.0' })
    .setTimestamp();
}

module.exports = async (client, interaction) => {
  const config = getConfig();

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ Something went wrong executing that command.',
        ephemeral: true
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'toggle_antiRaid') {
      config.antiRaid.enabled = !config.antiRaid.enabled;
      saveConfig(config);

      await interaction.update({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Anti-Raid Enabled', config.antiRaid.enabled ? 'Yes' : 'No');
    }

    if (interaction.customId === 'set_maxJoins') {
      const modal = new ModalBuilder()
        .setCustomId('modal_maxJoins')
        .setTitle('Set Max Joins')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Max joins in interval')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('e.g., 5')
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_interval') {
      const modal = new ModalBuilder()
        .setCustomId('modal_interval')
        .setTitle('Set Interval in Seconds')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Time window (seconds)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('e.g., 10')
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_punishment') {
      const select = new StringSelectMenuBuilder()
        .setCustomId('select_punishment')
        .setPlaceholder('Select punishment')
        .addOptions([
          { label: 'Kick', value: 'kick' },
          { label: 'Ban', value: 'ban' }
        ]);

      return interaction.reply({
        content: 'Select a punishment method:',
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true
      });
    }

    if (interaction.customId === 'toggle_spamFilter') {
      config.spamFilter.enabled = !config.spamFilter.enabled;
      saveConfig(config);

      await interaction.update({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Spam Filter Enabled', config.spamFilter.enabled ? 'Yes' : 'No');
    }

    if (interaction.customId === 'set_spam_max') {
      const modal = new ModalBuilder()
        .setCustomId('modal_spam_max')
        .setTitle('Set Max Messages')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Max messages in interval')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('e.g., 5')
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_spam_interval') {
      const modal = new ModalBuilder()
        .setCustomId('modal_spam_interval')
        .setTitle('Set Spam Interval (sec)')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Interval in seconds')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('e.g., 10')
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_spam_punishment') {
      const select = new StringSelectMenuBuilder()
        .setCustomId('select_spam_punishment')
        .setPlaceholder('Select punishment')
        .addOptions([
          { label: 'Kick', value: 'kick' },
          { label: 'Mute', value: 'mute' }
        ]);

      return interaction.reply({
        content: 'Select a spam punishment method:',
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true
      });
    }

    if (interaction.customId === 'open_config_panel') {
        return sendConfigPanel(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    const value = interaction.fields.getTextInputValue('value');

    if (interaction.customId === 'modal_maxJoins') {
      config.antiRaid.maxJoins = parseInt(value);
      saveConfig(config);

      await interaction.message.edit({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Max Joins', value);
    }

    if (interaction.customId === 'modal_interval') {
      config.antiRaid.intervalMs = parseInt(value) * 1000;
      saveConfig(config);

      await interaction.message.edit({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Interval (seconds)', value);
    }

    if (interaction.customId === 'modal_spam_max') {
      config.spamFilter.maxMessages = parseInt(value);
      saveConfig(config);

      await interaction.message.edit({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Max Messages', value);
    }

    if (interaction.customId === 'modal_spam_interval') {
      config.spamFilter.intervalMs = parseInt(value) * 1000;
      saveConfig(config);

      await interaction.message.edit({
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Spam Interval (seconds)', value);
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_punishment') {
      config.antiRaid.punishment = interaction.values[0];
      saveConfig(config);

      await interaction.update({
        content: null,
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Punishment', config.antiRaid.punishment.toUpperCase());
    }

    if (interaction.customId === 'select_spam_punishment') {
      config.spamFilter.punishment = interaction.values[0];
      saveConfig(config);

      await interaction.update({
        content: null,
        embeds: [buildAntiRaidEmbed(config.antiRaid), buildSpamFilterEmbed(config.spamFilter)],
        components: interaction.message.components
      });

      return confirmInteraction(interaction, 'Spam Punishment', config.spamFilter.punishment.toUpperCase());
    }
  }
};
