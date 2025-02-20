const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const port = 5003;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar a la base de datos
const dbConfig = {
    host: 'db',
    user: 'root',
    password: 'root',
    database: 'kuali',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

let connection;

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection({
            ...dbConfig,
            uri: `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}/${dbConfig.database}?allowPublicKeyRetrieval=true`
        });
        console.log('Conectado a la base de datos');
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        setTimeout(connectToDatabase, 5000); // Intentar reconectar después de 5 segundos
    }
}

connectToDatabase();

// Middleware para verificar la conexión a la base de datos
app.use((req, res, next) => {
    if (!connection) {
        return res.status(500).json({ status: 'ERROR', message: 'No se pudo conectar a la base de datos' });
    }
    next();
});

// Ruta para listar usuarios ordenados por ranking
app.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM usuario ORDER BY ranking DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).send('Error al obtener los usuarios');
    }
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});