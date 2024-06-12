const { getActiveIds, updateActiveState } = require('../db/dbSetup');
require('dotenv').config();

// Cargar IDs de propietarios, programador y grupo admin desde variables de entorno
const OWNER_IDS = process.env.OWNER.split(','); // Separar los IDs del propietario en un array
const ID_PROGRAMADOR = process.env.ID_PROGRAMADOR;
const ID_GROUP_ADMIN = process.env.ID_GROUP_ADMIN;

module.exports = (bot) => {
    bot.command('send', async (ctx) => { // Usar async para manejar promesas dentro de la función
        if (!OWNER_IDS.includes(String(ctx.from.id)) && String(ctx.from.id) !== ID_PROGRAMADOR) {
            return ctx.reply('No tienes permiso para ejecutar este comando.');
        }

        if (String(ctx.chat.id) !== ID_GROUP_ADMIN) {
            return ctx.reply('Este comando solo se puede ejecutar en el grupo admin.');
        }

        const message = ctx.message.text.split(' ').slice(1).join(' ');
        if (!message) {
            return ctx.reply('Por favor, proporciona un mensaje para enviar.');
        }

        console.log('Mensaje a enviar:', message); // Para depuración

        try {
            const { activeGroups, activeUsers } = await getActiveIds();
            console.log('Grupos activos:', activeGroups); // Para depuración
            console.log('Usuarios activos:', activeUsers); // Para depuración

            const sendMessageAndPin = async (id, isGroup) => {
                try {
                    const sentMessage = await bot.telegram.sendMessage(id, message, { parse_mode: 'HTML' });
                    console.log(`Mensaje enviado a ${isGroup ? 'grupo' : 'usuario'} con ID: ${id}`);

                    // Intentar fijar el mensaje tanto en grupos como en chats privados
                    await bot.telegram.pinChatMessage(id, sentMessage.message_id, {disable_notification: true});
                    console.log(`Mensaje fijado en ${isGroup ? 'grupo' : 'chat privado'} con ID: ${id}`);
                } catch (error) {
                    console.error(`Error al enviar o fijar mensaje a ${isGroup ? 'grupo' : 'usuario'} con ID ${id}:`, error);
                    await updateActiveState(id, false, isGroup);
                }
            };

            // Enviar y fijar el mensaje a todos los usuarios activos
            /*for (const userId of activeUsers) {
                await sendMessageAndPin(userId, false);
            }*/

            // Enviar y fijar el mensaje a todos los grupos activos
            for (const groupId of activeGroups) {
                await sendMessageAndPin(groupId, true);
            }

            ctx.reply('Mensajes enviados y fijados.');
        } catch (error) {
            console.error('Error durante la ejecución del comando send:', error);
            ctx.reply('Ocurrió un error al intentar enviar y fijar el mensaje.');
        }
    });
};
