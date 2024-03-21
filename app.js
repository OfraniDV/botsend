// app.js

const bot = require('./src/bot');



// Función para iniciar el bot
function startBot(retryDelay = 10000) {
    bot.launch()
      .then(() => {
        console.log('Bot iniciado correctamente');
      })
      .catch((error) => {
        console.error('Error al iniciar el bot:', error);
  
        // Reintentar después de un retraso si hay un error
        console.log(`Intentando reiniciar el bot en ${retryDelay / 1000} segundos...`);
        setTimeout(() => startBot(retryDelay), retryDelay);
      });
  }
  
  // Iniciar el bot
  startBot();
  
  // Manejar cierre elegante del bot
  process.on('SIGINT', () => bot.stop('SIGINT'));
  process.on('SIGTERM', () => bot.stop('SIGTERM'));