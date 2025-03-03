const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 5001;

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

// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, '..','uploads')));

// Ruta para recibir los datos del formulario
app.post('/registrar', upload.single('cv'), async (req, res) => {
    const { nombres, telefono, experienciaLaboral, estudios } = req.body;
    const cv = req.file ? req.file.filename : null;
    console.log('Datos recibidos:', { nombres, telefono, experienciaLaboral, estudios, cv });
    try {
        const query = 'INSERT INTO usuario (nombres, telefono, experiencia_laboral, estudios, cv) VALUES (?, ?, ?, ?, ?)';
        const values = [nombres, telefono, experienciaLaboral, estudios, cv];
        await connection.execute(query, values);
        const [rows] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const id = rows[0].id;
        res.json({ status: 'OK', id:id, message: 'Formulario recibido con éxito y datos guardados en la base de datos' });
    } catch (error) {
        console.error('Error al guardar los datos en la base de datos:', error);
        res.status(500).json({ status: 'ERROR', message: 'Error al guardar los datos en la base de datos' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});