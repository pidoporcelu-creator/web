const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Carga las variables de entorno

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON
app.use(express.json());

// Ruta que recibe el código de autorización
app.get('/oauth/callback', async (req, res) => {
    // 1. Obtiene el código de la URL
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).send('Faltan el código de autorización.');
    }

    // 2. Prepara los datos para la solicitud a Mercado Pago
    const requestData = {
        client_id: process.env.MERCADOPAGO_CLIENT_ID,
        client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
        code: authorizationCode,
        redirect_uri: process.env.MERCADOPAGO_REDIRECT_URI,
        grant_type: 'authorization_code'
    };

    try {
        // 3. Envía la solicitud POST a Mercado Pago
        const response = await axios.post('https://api.mercadopago.com/oauth/token', requestData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // La respuesta contiene el Access Token y el Refresh Token
        const { access_token, refresh_token, user_id } = response.data;
        
        // 4. Almacena el Access Token de forma segura
        // Aqusardar el 'access_token', 'refresh_token' y 'user_id'
        // en tu base de datos, asociados al vendedor correspondiente.
        console.log('Autorización exitosa. Datos del vendedor:');
        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);
        console.log('User ID:', user_id);

        // Envía una respuesta al frontend para que sepa que la autorización fue exitosa
        res.send('¡Vendedor autorizado correctamente! Puedes cerrar esta ventana.');

    } catch (error) {
        console.error('Error al solicitar el Access Token:', error.response ? error.response.data : error.message);
        res.status(500).send('Error al conectar con Mercado Pago.');
    }
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});