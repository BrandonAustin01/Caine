const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

const { getUserStats } = require("../utils/levelSystem");
const requireRankingEnabled = require("../utils/requireRankingEnabled");
const refreshXpCache = require("../utils/refreshXpCache");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the ranked leaderboard with pagination."),

  category: "Ranking",
  adminOnly: false,

  async execute(interaction) {
    if (!requireRankingEnabled(interaction)) return;

    const guildId = interaction.guild.id;
    const xpData = refreshXpCache(guildId); // ✅ use fresh data

    if (!xpData || Object.keys(xpData).length === 0) {
      return interaction.reply({
        content: "📉 No leaderboard data yet. Start chatting to gain XP!",
        ephemeral: true,
      });
    }

    const sorted = Object.entries(xpData)
      .map(([userId]) => {
        const stats = getUserStats(userId, guildId);
        return { userId, xp: stats.xp, level: stats.level };
      })
      .sort((a, b) => b.xp - a.xp);

    const pageSize = 10;
    const totalPages = Math.ceil(sorted.length / pageSize);
    let currentPage = 0;

    const renderPage = async () => {
      const start = currentPage * pageSize;
      const pageData = sorted.slice(start, start + pageSize);

      const entries = await Promise.all(
        pageData.map(async ({ userId, xp, level }, i) => {
          const member = await interaction.guild.members
            .fetch(userId)
            .catch(() => null);
          const tag = member?.user?.tag || `👤 Unknown (${userId})`;
          const index = start + i + 1;
          const emoji =
            index === 1
              ? "🥇"
              : index === 2
              ? "🥈"
              : index === 3
              ? "🥉"
              : `#${index}`;
          return `${emoji} **${tag}** — Level \`${level}\` • \`${xp} XP\``;
        })
      );

      // 📍 Always show viewer’s own rank if not visible
      const viewerId = interaction.user.id;
      const viewerIndex = sorted.findIndex(
        (entry) => entry.userId === viewerId
      );

      if (
        viewerIndex >= 0 &&
        (viewerIndex < start || viewerIndex >= start + pageSize)
      ) {
        const viewer = sorted[viewerIndex];
        const member = await interaction.guild.members
          .fetch(viewer.userId)
          .catch(() => null);
        const tag = member?.user?.tag || `👤 Unknown (${viewer.userId})`;
        entries.push(
          `\n📍 **Your Rank: #${viewerIndex + 1} — ${tag}** — Level \`${
            viewer.level
          }\` • \`${viewer.xp} XP\``
        );
      }

      const embed = new EmbedBuilder()
        .setTitle("🏆 Cain Leaderboard")
        .setDescription(entries.join("\n") || "No entries on this page.")
        .setColor(0xf1c40f)
        .setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️ Prev")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );

      return { embed, row };
    };

    const { embed, row } = await renderPage();
    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on("collect", async (button) => {
      if (button.user.id !== interaction.user.id) {
        return button.reply({
          content: "❌ Only you can interact with these buttons.",
          ephemeral: true,
        });
      }

      if (button.customId === "prev" && currentPage > 0) currentPage--;
      if (button.customId === "next" && currentPage < totalPages - 1)
        currentPage++;

      const { embed, row } = await renderPage();
      await button.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️ Prev")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      await message.edit({ components: [disabledRow] });
    });
  },
};
