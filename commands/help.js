const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show all available commands and features.')
      .setDMPermission(true),
  
    async execute(interaction) {
      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  
      const embed = new EmbedBuilder()
        .setTitle('📘 Cain Command Reference')
        .setDescription('Cain is your personal defense system. Here’s what I can do:')
        .setColor(0x7289da)
        .addFields(
          {
            name: '🛡️ Security Tools',
            value: '`/whois`, `/baninfo`, `/status`, `/securitylog`',
          },
          {
            name: '⚙️ Config & Admin',
            value: isAdmin
              ? '`/config`, `/setalertchannel`'
              : '🔒 Admin only',
          },
          {
            name: '🔐 Lockdown',
            value: isAdmin
              ? '`/lockdown on`, `/lockdown off`, `/lockdown status`'
              : '🔒 Admin only',
          },
          {
            name: '📎 Notes',
            value: '_Commands marked with 🔒 are restricted to admins._',
          }
        )
        .setFooter({ text: 'Cain Security System • v1.0' })
        .setTimestamp();
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_config_panel')
          .setLabel('🛠 Open Config Panel')
          .setStyle(ButtonStyle.Primary)
      );
  
      await interaction.reply({
        ephemeral: true,
        embeds: [embed],
        components: isAdmin ? [row] : []
      });
    }
  };
  