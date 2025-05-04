const fs = require("fs");
const path = require("path");
const sendConfigPanel = require("../utils/sendConfigPanel");

const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const {
  buildAntiRaidEmbed,
  buildSpamFilterEmbed,
  buildRankingEmbed,
} = require("../utils/buildConfigEmbed");

const {
  buildMaxJoinsModal,
  buildSpamIntervalModal,
  buildSpamMaxModal,
  buildRaidIntervalModal,
} = require("../utils/buildConfigModals");

const {
  buildPunishmentSelect,
  buildModlogChannelSelect,
} = require("../utils/buildConfigSelects");

const configPath = path.join(__dirname, "../config/config.json");

function confirmInteraction(interaction, label, value) {
  return interaction.followUp({
    content: `✅ \`${label}\` updated to \`${value}\`.`,
    ephemeral: true,
  });
}

function saveConfig(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf8");
}

function getConfig() {
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
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
        content: "❌ Something went wrong executing that command.",
        ephemeral: true,
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "toggle_antiRaid") {
      config.antiRaid.enabled = !config.antiRaid.enabled;
      saveConfig(config);

      await interaction.update({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(
        interaction,
        "Anti-Raid Enabled",
        config.antiRaid.enabled ? "Yes" : "No"
      );
    }

    if (interaction.customId === "set_modlog_channel") {
      return interaction.reply({
        content: "Choose a channel to use for mod-logs:",
        components: [buildModlogChannelSelect(interaction.guild)],
        ephemeral: true,
      });
    }

    if (interaction.customId === "set_maxJoins") {
      return interaction.showModal(buildMaxJoinsModal());
    }

    if (interaction.customId === "set_interval") {
      return interaction.showModal(buildRaidIntervalModal());
    }

    if (interaction.customId === "set_punishment") {
      return interaction.reply({
        content: "Select a punishment method:",
        components: [buildPunishmentSelect("select_punishment")],
        ephemeral: true,
      });
    }

    if (interaction.customId === "toggle_spamFilter") {
      config.spamFilter.enabled = !config.spamFilter.enabled;
      saveConfig(config);

      await interaction.update({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(
        interaction,
        "Spam Filter Enabled",
        config.spamFilter.enabled ? "Yes" : "No"
      );
    }

    if (interaction.customId === "toggle_ranking") {
      config.rankingSystem.enabled = !config.rankingSystem.enabled;
      saveConfig(config);

      const updatedEmbeds = [
        buildAntiRaidEmbed(config.antiRaid),
        buildSpamFilterEmbed(config.spamFilter),
        buildRankingEmbed(config.rankingSystem, config.rankRoles),
      ];

      await interaction.update({
        embeds: updatedEmbeds,
        components: interaction.message.components,
      });

      return confirmInteraction(
        interaction,
        "Ranking System Enabled",
        config.rankingSystem.enabled ? "Yes" : "No"
      );
    }

    if (interaction.customId === "set_spam_max") {
      return interaction.showModal(buildSpamMaxModal());
    }

    if (interaction.customId === "set_spam_interval") {
      return interaction.showModal(buildSpamIntervalModal());
    }

    if (interaction.customId === "set_spam_punishment") {
      return interaction.reply({
        content: "Select a spam punishment method:",
        components: [buildPunishmentSelect("select_spam_punishment", true)],
        ephemeral: true,
      });
    }

    if (interaction.customId === "open_config_panel") {
      return sendConfigPanel(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    const value = interaction.fields.getTextInputValue("value");

    if (interaction.customId === "modal_maxJoins") {
      config.antiRaid.maxJoins = parseInt(value);
      saveConfig(config);

      await interaction.message.edit({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(interaction, "Max Joins", value);
    }

    if (interaction.customId === "modal_interval") {
      config.antiRaid.intervalMs = parseInt(value) * 1000;
      saveConfig(config);

      await interaction.message.edit({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(interaction, "Interval (seconds)", value);
    }

    if (interaction.customId === "modal_spam_max") {
      config.spamFilter.maxMessages = parseInt(value);
      saveConfig(config);

      await interaction.message.edit({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(interaction, "Max Messages", value);
    }

    if (interaction.customId === "modal_spam_interval") {
      config.spamFilter.intervalMs = parseInt(value) * 1000;
      saveConfig(config);

      await interaction.message.edit({
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(interaction, "Spam Interval (seconds)", value);
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "select_modlog_channel") {
      const config = getConfig();
      const selectedId = interaction.values[0];

      config.modLogChannel = selectedId;
      saveConfig(config);

      return interaction.update({
        content: `✅ Mod-log channel set to <#${selectedId}>`,
        components: [],
      });
    }

    if (interaction.customId === "select_punishment") {
      config.antiRaid.punishment = interaction.values[0];
      saveConfig(config);

      await interaction.update({
        content: null,
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(
        interaction,
        "Punishment",
        config.antiRaid.punishment.toUpperCase()
      );
    }

    if (interaction.customId === "select_spam_punishment") {
      config.spamFilter.punishment = interaction.values[0];
      saveConfig(config);

      await interaction.update({
        content: null,
        embeds: [
          buildAntiRaidEmbed(config.antiRaid),
          buildSpamFilterEmbed(config.spamFilter),
        ],
        components: interaction.message.components,
      });

      return confirmInteraction(
        interaction,
        "Spam Punishment",
        config.spamFilter.punishment.toUpperCase()
      );
    }
  }
};
