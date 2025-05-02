const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const {
  buildAntiRaidEmbed,
  buildSpamFilterEmbed,
  buildRankingEmbed
} = require('../utils/buildConfigEmbed');

const {
  buildAntiRaidButtons,
  buildSpamFilterButtons,
  buildRankingButtons,
  buildUtilityButtons
} = require('../utils/buildConfigButtons');

const config = require('../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Open Cain’s interactive config panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const antiRaid = config.antiRaid;
    const spamFilter = config.spamFilter;
    const ranking = config.rankingSystem;

    // 🧱 Use modular embed builders for cleaner architecture
    const antiRaidEmbed = buildAntiRaidEmbed(antiRaid);
    const spamFilterEmbed = buildSpamFilterEmbed(spamFilter);
    const rankingEmbed = buildRankingEmbed(ranking, config.rankRoles);

    return interaction.reply({
      content: '⚙️ Cain Config Panel',
      embeds: [antiRaidEmbed, spamFilterEmbed, rankingEmbed],
      components: [
        ...buildAntiRaidButtons(),
        ...buildSpamFilterButtons(),
        ...buildRankingButtons(),
        ...buildUtilityButtons()
      ],
      ephemeral: true
    });
  }
};
