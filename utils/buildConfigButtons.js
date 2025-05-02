const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildAntiRaidButtons() {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('toggle_antiRaid').setLabel('Enable/Disable').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_maxJoins').setLabel('Max Joins').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_interval').setLabel('Interval').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_punishment').setLabel('Punishment').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_cooldown').setLabel('Cooldown').setStyle(ButtonStyle.Secondary)
    );
    
    return [row]; // ✅ Return array so it can be spread
  }
  

function buildSpamFilterButtons() {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('toggle_spamFilter').setLabel('Enable/Disable').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_spam_max').setLabel('Max Messages').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_spam_interval').setLabel('Interval').setStyle(ButtonStyle.Primary)
    );
  
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_spam_punishment').setLabel('Punishment').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_spam_cooldown').setLabel('Cooldown').setStyle(ButtonStyle.Secondary)
    );
  
    return [row1, row2]; // ✅ Return array
  }
  

  function buildRankingButtons() {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('toggle_ranking')
          .setLabel('Enable/Disable')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }
  
  function buildUtilityButtons() {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('set_modlog_channel')
          .setLabel('Set Mod Log Channel')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('open_config_panel')
          .setLabel('Refresh Panel')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }
  
  
module.exports = {
  buildAntiRaidButtons,
  buildSpamFilterButtons,
  buildRankingButtons,
  buildUtilityButtons
};