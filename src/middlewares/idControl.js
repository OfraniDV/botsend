const { addOrUpdateId } = require('../db/dbSetup');

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        let id = null;
        let isGroup = false;

        console.log("Middleware ejecutándose para tipo:", ctx.chat.type);

        // Determinar si el mensaje viene de un grupo o de un usuario directamente
        if (ctx.chat.type === 'private') {
            id = ctx.from.id;
            console.log("Detectado mensaje privado, ID de usuario:", id);
        } else if (['group', 'supergroup'].includes(ctx.chat.type)) {
            id = ctx.chat.id;
            isGroup = true;
            console.log("Detectado mensaje de grupo, ID de grupo:", id);
        }

        // Si el bot es agregado a un grupo, verificar si es administrador antes de actualizar el estado
        if (ctx.update.message && ctx.update.message.new_chat_members) {
            const botAdded = ctx.update.message.new_chat_members.some(member => member.is_bot && member.username === bot.botInfo.username);
            if (botAdded) {
                console.log("El bot ha sido agregado a un grupo, verificando estado de administrador...");
                const botAdminStatus = await ctx.getChatMember(bot.botInfo.id);
                if (botAdminStatus && botAdminStatus.status === 'administrator') {
                    console.log("El bot es administrador en el grupo, actualizando estado en la base de datos...");
                    addOrUpdateId(id, isGroup, true); // Actualiza o añade el ID con active = true
                } else {
                    console.log("El bot no es administrador en el grupo, no se actualiza el estado.");
                }
            }
        } else if (id !== null) {
            console.log(`Actualizando o añadiendo ID: ${id}, es grupo: ${isGroup}, a activo en la base de datos.`);
            addOrUpdateId(id, isGroup, true); // Actualiza o añade el ID con active = true
        }

        return next();
    });
};
