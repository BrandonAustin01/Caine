const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

function buildPunishmentSelect(id = "select_punishment", includeMute = false) {
  const options = [
    { label: "Kick", value: "kick" },
    { label: "Ban", value: "ban" },
  ];

  if (includeMute) {
    options.push({ label: "Mute", value: "mute" });
  }

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder("Select punishment")
      .addOptions(options)
  );
}

function buildModlogChannelSelect(guild) {
  const options = guild.channels.cache
    .filter((c) => c.isTextBased() && c.type === 0) // GuildText only
    .map((c) => ({
      label: `#${c.name}`,
      value: c.id,
    }))
    .slice(0, 25); // Discord max

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_modlog_channel")
      .setPlaceholder("Select a mod-log channel")
      .addOptions(options)
  );
}

module.exports = {
  buildPunishmentSelect,
  buildModlogChannelSelect,
};
