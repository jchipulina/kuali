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
const port = 5002;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();
const bearerToken = process.env.BEARER_TOKEN;
console.log("bearerToken "+bearerToken);
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


// Ruta para analizar un usuario
app.get('/analizar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.execute('SELECT * FROM usuario WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'ERROR', message: 'Usuario no encontrado' });
        }
        const { nombres, telefono, experienciaLaboral, estudios, cv } = rows[0];
        await analizar(nombres, telefono, experienciaLaboral, estudios, cv, id);
        res.json({ status: 'OK', message: 'Usuario analizado correctamente' });
    } catch (error) {
        console.error('Error al analizar el usuario:', error);
        res.status(500).send('Error al analizar el usuario');
    }
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