const db = require('./db'); // Asegúrate de que db.js exporte tu conexión SQLite
const moment = require('moment-timezone');

// Crea la tabla `registros` con un esquema que permite la unicidad de `idgrupo` e `iduser`
function createRegistros() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS registros (
      serial INTEGER PRIMARY KEY AUTOINCREMENT,
      idgrupo BIGINT,
      iduser BIGINT,
      active BOOLEAN NOT NULL CHECK (active IN (0, 1)),
      fecha DATETIME NOT NULL,
      UNIQUE(idgrupo, iduser)
    );
  `;
  db.run(createTableSQL, (err) => {
    if (err) {
      return console.error("Error al crear la tabla 'registros':", err.message);
    }
    console.log("Tabla 'registros' creada o ya existía.");
  });
}

createRegistros();
// Actualiza el estado `active` de un registro por `idgrupo` o `iduser`
function updateActiveState(id, isActive, isGroup) {
  const column = isGroup ? 'idgrupo' : 'iduser';
  const updateSQL = `
    UPDATE registros
    SET active = ?
    WHERE ${column} = ?;
  `;
  db.run(updateSQL, [isActive, id], (err) => {
    if (err) {
      return console.error(`Error al actualizar el estado 'active' para el ${isGroup ? 'grupo' : 'usuario'}:`, err.message);
    }
    console.log(`Estado 'active' actualizado para el ${isGroup ? 'grupo' : 'usuario'} con ID: ${id}`);
  });
}

// Añade o actualiza un registro para un usuario o grupo
function addOrUpdateId(id, isGroup) {
  const nowInCuba = moment().tz("America/Havana").format("YYYY-MM-DD HH:mm:ss");
  const column = isGroup ? 'idgrupo' : 'iduser';
  const otherColumn = isGroup ? 'iduser' : 'idgrupo';
  const checkSQL = `SELECT * FROM registros WHERE ${column} = ?;`;
  
  db.get(checkSQL, [id], (err, row) => {
    if (err) {
      return console.error("Error al buscar ID:", err.message);
    }

    if (row) {
      // ID ya existe, actualiza el estado active a true
      updateActiveState(id, true, isGroup);
    } else {
      // Nuevo ID, inserta el registro
      const insertSQL = `
        INSERT INTO registros (${column}, ${otherColumn}, active, fecha)
        VALUES (?, NULL, ?, ?);
      `;
      db.run(insertSQL, [id, true, nowInCuba], (err) => {
        if (err) {
          return console.error("Error al insertar nuevo ID:", err.message);
        }
        console.log(`Nuevo ${isGroup ? 'grupo' : 'usuario'} agregado con ID: ${id}`);
      });
    }
  });
}

// Función para obtener los ID de grupos y usuarios activos
function getActiveIds() {
  return new Promise((resolve, reject) => {
      const sql = `SELECT idgrupo, iduser FROM registros WHERE active = 1`;
      db.all(sql, [], (err, rows) => {
          if (err) {
              reject(err);
          } else {
              const activeGroups = rows.filter(row => row.idgrupo !== null).map(row => row.idgrupo);
              const activeUsers = rows.filter(row => row.iduser !== null).map(row => row.iduser);
              resolve({ activeGroups, activeUsers });
          }
      });
  });
}


// Asegúrate de exportar la nueva función
module.exports = {
  createRegistros,
  updateActiveState,
  addOrUpdateId,
  getActiveIds
};