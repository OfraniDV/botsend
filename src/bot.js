// bot.js

require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const fs = require('fs');
const path = require('path');


// Inicializa el bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Cargar middlewares dinámicamente
const middlewaresPath = path.join(__dirname, 'middlewares');
fs.readdir(middlewaresPath, (err, files) => {
    if (err) return console.log(err);

    files.forEach((file) => {
        if (file.endsWith('.js')) {
            const middleware = require(`./middlewares/${file}`);
            middleware(bot); // Aplicar el middleware al bot
        }
    });
});

// Ejecutar configuraciones de la base de datos dinámicamente
const dbPath = path.join(__dirname, 'db');
fs.readdir(dbPath, (err, files) => {
    if (err) return console.log(err);

    files.forEach((file) => {
        if (file.endsWith('.js')) {
            const setupScript = require(`./db/${file}`);
            // Ejecutar el script si es una función
            if (typeof setupScript === 'function') {
                setupScript();
            }
        }
    });
});


// Cargar comandos dinámicamente
const commandsPath = path.join(__dirname, 'commands');
fs.readdir(commandsPath, (err, files) => {
    if (err) return console.log(err);

    files.forEach((file) => {
        if (!file.endsWith('.js')) return; // Ignora archivos que no sean .js
        const command = require(`./commands/${file}`); // Importa el comando como un módulo
        command(bot); // Registra el comando en el bot
    });
});

// Configurar el middleware de sesión
bot.use(session());

// Cargar y registrar wizards dinámicamente
const wizardsPath = path.join(__dirname, 'wizards');
const stage = new Scenes.Stage();

fs.readdir(wizardsPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const wizard = require(`${wizardsPath}/${file}`);
            stage.register(wizard); // Registra la escena en el Stage
        }
    });
});

// Añadir el Stage como middleware
bot.use(stage.middleware());

// Captura global de errores
bot.catch((err, ctx) => {
    // Log del error
    console.error(`Ocurrió un error con el update ${ctx.updateType}`, err);

    // Intenta enviar un mensaje de error genérico al usuario
    try {
        // Verifica si el contexto permite enviar un mensaje
        if (ctx && ctx.reply) {
            ctx.reply('Lo siento, ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.');
        }
    } catch (error) {
        console.error('Error al enviar el mensaje de error al usuario:', error);
    }

    // Aquí podrías agregar más lógica específica de manejo de errores,
    // como enviar un mensaje a un canal o administrador específico para alertar sobre el error
    // o incluso reconectar el bot si el error implica problemas de conectividad.
});

module.exports = bot;
