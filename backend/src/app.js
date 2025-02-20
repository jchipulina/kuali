const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();
const bearerToken = process.env.BEARER_TOKEN;

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
        await analizar(nombres, telefono, experienciaLaboral, estudios, cv,id);
        res.json({ status: 'OK', message: 'Formulario recibido con éxito y datos guardados en la base de datos' });
    } catch (error) {
        console.error('Error al guardar los datos en la base de datos:', error);
        res.status(500).json({ status: 'ERROR', message: 'Error al guardar los datos en la base de datos' });
    }
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

app.get('/test', async (req, res) => {
    res.json({ status: 'OK_TEST_2', message: 'Loren ipsum dolor sit amet' });
});

async function analizar(nombres, telefono, experienciaLaboral, estudios, cv, id) {
    const cvPath = path.join(__dirname, '..', 'uploads', cv);
    let cvText = '';
    try {
        const dataBuffer = fs.readFileSync(cvPath);
        const data = await pdfParse(dataBuffer);
        cvText = data.text;
    } catch (error) {
        console.error('Error al leer el CV:', error);
    }
    const prompt = `
    Analiza la siguiente información del candidato y genera un puntaje de adecuación para el puesto de trabajo y dame como resultado un score de 0 al 100 en este formato #SCORE=XX:
    Nombres: ${nombres}
    Teléfono: ${telefono}
    Experiencia Laboral: ${experienciaLaboral}
    Estudios: ${estudios}
    CV: ${cvText}
    `;
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            store: true,
            messages: [
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            }
        });
        const rpta = response.data.choices[0].message.content.trim();
        const scoreMatch = rpta.match(/#SCORE=(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
        if (score !== null) {
            const query = 'UPDATE usuario SET response = ?, ranking = ? WHERE id = ?';
            const values = [rpta, score, id];
            await connection.execute(query, values);
        } else {
            console.error('No se pudo extraer el puntaje de la respuesta de la IA');
        }
    } catch (error) {
        console.error('Error al analizar la información del candidato:', error);
    }
}

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});