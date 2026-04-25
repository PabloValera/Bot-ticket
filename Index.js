const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`🔥 Bot GOD activo: ${client.user.tag}`);
});

// PANEL
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'panel') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('crear_ticket')
        .setLabel('🎫 Crear Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "🎮 Soporte 24/7 - Abre tu ticket",
      components: [row]
    });
  }
});

// BOTONES
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // CREAR TICKET
  if (interaction.customId === 'crear_ticket') {
    const canal = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: config.staffRole, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const cerrarBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('cerrar_ticket')
        .setLabel('🔒 Cerrar')
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({
      content: `👋 Hola ${interaction.user}, describe tu problema.`,
      components: [cerrarBtn]
    });

    await interaction.reply({ content: "✅ Ticket creado", ephemeral: true });
  }

  // CERRAR TICKET
  if (interaction.customId === 'cerrar_ticket') {
    const mensajes = await interaction.channel.messages.fetch({ limit: 100 });

    let contenido = "";
    mensajes.reverse().forEach(msg => {
      contenido += `${msg.author.tag}: ${msg.content}\n`;
    });

    const fileName = `transcript-${interaction.channel.name}.txt`;
    fs.writeFileSync(fileName, contenido);

    const logChannel = interaction.guild.channels.cache.get(config.logChannel);

    if (logChannel) {
      await logChannel.send({
        content: `📁 Transcript de ${interaction.channel.name}`,
        files: [fileName]
      });
    }

    await interaction.reply("🔒 Cerrando en 3s...");
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

// ANTI-SPAM SIMPLE
const cooldown = new Map();

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  if (cooldown.has(msg.author.id)) {
    msg.delete().catch(() => {});
    return;
  }

  cooldown.set(msg.author.id, true);
  setTimeout(() => cooldown.delete(msg.author.id), 3000);
});

client.login(process.env.TOKEN);