const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

function buildSimpleModal(id, title, label, placeholder) {
  return new ModalBuilder()
    .setCustomId(id)
    .setTitle(title)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel(label)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(placeholder)
      )
    );
}

function buildMaxJoinsModal() {
  return buildSimpleModal(
    "modal_maxJoins",
    "Set Max Joins",
    "Max joins in interval",
    "e.g., 5"
  );
}

function buildRaidIntervalModal() {
  return buildSimpleModal(
    "modal_interval",
    "Set Interval in Seconds",
    "Time window (seconds)",
    "e.g., 10"
  );
}

function buildSpamMaxModal() {
  return buildSimpleModal(
    "modal_spam_max",
    "Set Max Messages",
    "Max messages in interval",
    "e.g., 5"
  );
}

function buildSpamIntervalModal() {
  return buildSimpleModal(
    "modal_spam_interval",
    "Set Spam Interval (sec)",
    "Interval in seconds",
    "e.g., 10"
  );
}

module.exports = {
  buildSimpleModal, // optional
  buildMaxJoinsModal,
  buildRaidIntervalModal,
  buildSpamMaxModal,
  buildSpamIntervalModal,
};
