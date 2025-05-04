const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const path = require("path");
const version = require(path.join(__dirname, "..", "version.json"));

const categoryEmojis = {
  Security: "🛡️",
  Configuration: "⚙️",
  Moderation: "🔐",
  Ranking: "📊",
  Utility: "🧰",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands and features.")
    .setDMPermission(true),

  async execute(interaction) {
    const isAdmin = interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    );
    const client = interaction.client;

    // Group commands by category
    const grouped = {};
    for (const command of client.commands.values()) {
      const category = command.category || "Utility";
      const emoji = categoryEmojis[category] || "❔";

      if (command.adminOnly && !isAdmin) continue;

      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(`\`/${command.data.name}\``);
    }

    // Build fields dynamically
    const fields = Object.entries(grouped).map(([category, cmds]) => ({
      name: `${categoryEmojis[category] || "📁"} ${category}`,
      value: cmds.join(", "),
    }));

    fields.push({
      name: "📎 Notes",
      value: "_Admin-only commands are hidden if you lack permission._",
    });

    const embed = new EmbedBuilder()
      .setTitle("📘 Caine Command Reference")
      .setDescription(
        "Caine is your modular security and moderation system. Here’s what he can do:"
      )
      .setColor(0x7289da)
      .addFields(fields)
      .setFooter({
        text: `Caine Security System • v${version.number || "1.0"}`,
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_config_panel")
        .setLabel("🛠 Open Config Panel")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      ephemeral: true,
      embeds: [embed],
      components: isAdmin ? [row] : [],
    });
  },
};
