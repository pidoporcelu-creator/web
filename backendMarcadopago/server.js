// Importa las clases necesarias del SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago');
const express = require('express');

// Inicializa la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crea una nueva instancia del cliente de Mercado Pago
// Esta es la forma correcta de configurar la autenticación en la versión 2.0+
const client = new MercadoPagoConfig({
    accessToken: 'APP_USR-15791c84-af4e-41f5-aa45-51c5789d14cb'
});

// Middleware: habilita el parseo de JSON y CORS
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Hola! El servidor está funcionando correctamente.');
});

// Ruta para crear la preferencia de pago
app.post('/create_preference', async (req, res) => {
    // La información del producto viene del frontend
    const { items, back_urls } = req.body;

    // Crea un objeto de preferencia
    let preferenceBody = {
        items: items,
        back_urls: back_urls,
        auto_return: "approved"
    };

    try {
        // Usa la clase Preference para crear la preferencia a través de la instancia del cliente
        const preference = new Preference(client);
        const response = await preference.create({ body: preferenceBody });
        const preferenceId = response.id;

        // Envía el ID de la preferencia al frontend
        console.log('Preferencia creada exitosamente:', preferenceId);
        res.status(200).json({ id: preferenceId });
    } catch (error) {
        console.error('Error al crear la preferencia de pago:', error);
        res.status(500).json({ error: error.message });
    }
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
