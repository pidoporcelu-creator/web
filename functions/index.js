// 1. Importaciones de módulos (ahora todas usan la sintaxis 'import')
import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin"; // ✅ CORRECCIÓN: Importar el namespace de admin
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore"; // ✅ AÑADIDO: Timestamp
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onSchedule } from "firebase-functions/v2/scheduler"; // ✅ AÑADIDO: Para funciones programadas
import { getFunctions } from "firebase-admin/functions"; // ✅ AÑADIDO: Para encolar tareas
import { defineSecret } from 'firebase-functions/params'; // Importación corregida
import { onTaskDispatched } from "firebase-functions/v2/tasks"; // ✅ AÑADIDO: Para manejar tareas encoladas
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https'; // Importar HttpsError
import { logger } from "firebase-functions";
import cors from 'cors'; 
import geohash from 'ngeohash'
import { getAuth } from "firebase-admin/auth";



// // Importaciones para Mercado Pago y Express (Comentadas temporalmente)
import express from 'express'; // ✅ REACTIVADO: Necesario para la API unificada.
// import { MercadoPagoConfig, Preference } from 'mercadopago';
// import crypto from 'crypto';
import { Client } from "@googlemaps/google-maps-services-js";
import * as geofirestore from 'geofirestore';
admin.initializeApp();
// 2. Inicializar la app y los servicios
const db = getFirestore();
const messaging = getMessaging();

// ✅ SOLUCIÓN: Inicializar GeoFirestore aquí, después de que 'db' esté disponible.
// Esto crea una instancia de GeoFirestore que podemos usar en nuestras funciones.
const GeoFirestore = geofirestore.initializeApp(db);

// --- ¡TOKEN FIJO PARA PRUEBAS! (Ahora global) ---
const TEST_FCM_TOKEN = "dRkU38sOTG2NOfAo1_W7Af:APA91bEdvkNiHmg3RbzEFhV08TK2KU8bOnzVM084djjf4xMCbj8EpAqM40RfSSpJi6cDCE3JNKrl6Amui2fx45YiBjeTPkS_Y9pJCkE8AxEg";
// ---------------------------------

// === CRÍTICO ===
const MP_REGION = 'southamerica-east1'; // Región para las funciones
// // Constantes de Mercado Pago (Comentadas temporalmente)
// const PROJECT_ID = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
// const REDIRECT_URI = `https://${MP_REGION}-${PROJECT_ID}.cloudfunctions.net/apiService/mp-callback`;
// const NOTIFICATION_URI = `https://${MP_REGION}-${PROJECT_ID}.cloudfunctions.net/apiService/mp-webhook`;

// Configuración global de la región para todas las OTRAS funciones (si las hay)
setGlobalOptions({ region: MP_REGION }); 
// ===================================


// =================================================================
// ✅ NUEVO: API UNIFICADA CON EXPRESS
// Todas las funciones HTTP/Callable se manejarán aquí para evitar conflictos de CORS.
// =================================================================

const api = express();

// Usar el middleware de CORS para permitir peticiones desde cualquier origen.
// Esto es crucial para el desarrollo local.
api.use(cors({ origin: true }));
api.use(express.json()); // Middleware para parsear cuerpos de petición JSON.

// Endpoint para suspender cadetes
api.post('/api/suspender-cadete', async (req, res) => {
    // La autenticación se puede verificar aquí si es necesario.
    // const idToken = req.headers.authorization?.split('Bearer ')[1];
    // if (!idToken) { return res.status(401).send('Unauthorized'); }
    
    const { cadeteId, dias } = req.body;
    // ✅ CORRECCIÓN: Se permite que 'dias' sea 0.
    if (!cadeteId || typeof dias !== 'number' || dias < 0) {
        logger.error('Llamada a /suspender-cadete con datos inválidos:', req.body);
        return res.status(400).json({ error: 'Se requiere "cadeteId" y un número de "dias" válido (mayor o igual a 0).' });
    }

    const cadeteRef = db.collection('usuarios').doc(cadeteId);

    try {
        // ✅ NUEVA LÓGICA: Si los días son 0, reactivamos al cadete.
        if (dias === 0) {
            await cadeteRef.update({
                estado: 'activo',
                suspensionHasta: FieldValue.delete() // Eliminamos el campo de la fecha de suspensión
            });
            logger.info(`Cadete ${cadeteId} reactivado manualmente.`);
            return res.status(200).json({ 
                success: true, 
                message: `El cadete ha sido reactivado.` 
            });
        } else {
            // Lógica original para suspender por un tiempo determinado.
            const diasEnMilisegundos = dias * 24 * 60 * 60 * 1000;
            const ahora = Timestamp.now();
            const fechaFinSuspension = new Date(ahora.toMillis() + diasEnMilisegundos);

            await cadeteRef.update({
                estado: 'suspendido',
                suspensionHasta: Timestamp.fromDate(fechaFinSuspension)
            });

            const queue = getFunctions().taskQueue("reactivarcadeteprogramado");
            await queue.enqueue(
                { cadeteId: cadeteId },
                { scheduleTime: fechaFinSuspension }
            );

            logger.info(`Cadete ${cadeteId} suspendido por ${dias} días. Reactivación programada para ${fechaFinSuspension.toISOString()}`);
            
            return res.status(200).json({ 
                success: true, 
                message: `Cadete suspendido hasta ${fechaFinSuspension.toLocaleDateString('es-AR')}.` 
            });
        }

    } catch (error) {
        logger.error(`Error al suspender al cadete ${cadeteId}:`, error);
        return res.status(500).json({ error: 'No se pudo completar la suspensión.' });
    }
});

// Exportamos la aplicación Express como una única función onRequest.
export const apiService = onRequest({ region: MP_REGION }, api);



/*
=================================================================
TODO EL BLOQUE DE MERCADO PAGO HA SIDO COMENTADO TEMPORALMENTE
PARA SOLUCIONAR EL ERROR DE DESPLIEGUE.
=================================================================

// 3a. Secrets de Mercado Pago
const mercadopagoAccessToken = defineSecret('MP_PLATFORM_ACCESS_V2');
const mercadopagoClientSecret = defineSecret('MP_CLIENT_SECRET_V2');
const mercadopagoWebhookSecret = defineSecret('MP_WEBHOOK_SECRET_V2');

// 3c. Secret para Google Maps
const googleMapsApiKey = defineSecret('GOOGLE_MAPS_API_KEY');

// 3b. Credenciales Públicas (constantes)
const CLIENT_ID = "6552776689253759"; 
const PLATFORM_USER_ID = 2716301481 

// Configurar el servidor Express
const api = express();
api.use(cors({ origin: true })); 
api.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Ruta para crear la preferencia de pago
api.post('/create_preference', async (req, res) => {
    // ... lógica de crear preferencia ...
});

// Ruta para el webhook de Mercado Pago
api.post('/mp-webhook', async (req, res) => {
    // ... lógica del webhook ...
});

// Ruta para el callback de autorización de vendedores
api.get('/mp-callback', async (req, res) => {
    // ... lógica del callback ...
});

// Exportación de la función de API
export const apiService = onRequest({ 
    secrets: [mercadopagoAccessToken, mercadopagoClientSecret, mercadopagoWebhookSecret],
    cors: true
}, api);

*/

// =================================================================
// 4. Servicio para calcular el costo de envío
// =================================================================

/*
export const shippingService = onCall({
    secrets: [googleMapsApiKey]
}, async (request) => {
    // ✅ PASO 1: VERIFICAR AUTENTICACIÓN
    // Si la función es llamada sin un token de autenticación válido, request.auth será undefined.
    // Esto protege la función de llamadas no autorizadas.
    if (!request.auth) {
        logger.error("Intento de llamada no autenticada a shippingService.");
        throw new HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }

    // El UID del usuario autenticado está en request.auth.uid. Lo usamos como la fuente de verdad.
    const usuarioId = request.auth.uid;
    logger.info(`Llamada autenticada por el usuario: ${usuarioId}`);

    // 2. Validar la entrada
    const { comercioId } = request.data;
    if (!comercioId) {
        logger.error("Falta 'comercioId' en la solicitud.");
        throw new HttpsError('invalid-argument', 'Se requiere el "comercioId".');
    }
    logger.info(`Calculando envío para comercio: ${comercioId} y usuario: ${usuarioId}`);

    try {
        // 2. Obtener direcciones desde Firestore
        const userDocRef = db.collection('usuarios').doc(usuarioId);
        const commerceDocRef = db.collection('comercios').doc(comercioId);
        const datosGeneralesRef = db.collection('datosGenerales').doc('datos');

        const [userDoc, commerceDoc, datosGeneralesDoc] = await Promise.all([
            userDocRef.get(), 
            commerceDocRef.get(),
            datosGeneralesRef.get()
        ]);

        if (!userDoc.exists || !commerceDoc.exists) {
            logger.error(`No se encontró el documento para el usuario ${usuarioId} o el comercio ${comercioId}.`);
            throw new HttpsError('not-found', 'No se pudo encontrar la información del usuario o del comercio.');
        }

        const direccionUsuario = userDoc.data()?.direccion;
        const direccionComercio = commerceDoc.data()?.direccion;

        if (!direccionUsuario || !direccionComercio) {
            logger.error(`Falta la dirección para el usuario ${usuarioId} o el comercio ${comercioId}.`);
            throw new HttpsError('failed-precondition', 'Falta la dirección de origen o destino.');
        }

        // ✅ OBTENER PARÁMETROS DE ENVÍO DESDE FIRESTORE
        if (!datosGeneralesDoc.exists) {
            logger.error("El documento 'datosGenerales/datos' no fue encontrado.");
            throw new HttpsError('internal', 'Faltan datos de configuración del sistema.');
        }
        const datosGenerales = datosGeneralesDoc.data();
        const envioPrecioMin = datosGenerales.envioPrecioMin;
        const envioPrecioPorKm = datosGenerales.envioPrecioPorKm;

        if (typeof envioPrecioMin !== 'number' || typeof envioPrecioPorKm !== 'number') {
            logger.error("Los campos 'envioPrecioMin' o 'envioPrecioPorKm' no son números válidos en 'datosGenerales/datos'.");
            throw new HttpsError('internal', 'Datos de configuración de envío inválidos.');
        }

        logger.info(`Origen: ${direccionComercio} | Destino: ${direccionUsuario}`);

        // 3. Llamar a la API de Google Maps para calcular la distancia
        const mapsClient = new Client({});
        const distanceResponse = await mapsClient.distancematrix({
            params: {
                origins: [direccionComercio],
                destinations: [direccionUsuario],
                // key: googleMapsApiKey.value(), // ✅ TEMPORAL: Comentado
                units: 'metric', // Para obtener la distancia en kilómetros
                mode: 'driving' // 'driving', 'walking', 'bicycling'
            },
            timeout: 5000 // 5 segundos de timeout
        });

        // ✅ VALIDACIÓN ROBUSTA: Verificar que la respuesta de la API tenga la estructura esperada.
        if (!distanceResponse.data.rows || distanceResponse.data.rows.length === 0 || !distanceResponse.data.rows[0].elements || distanceResponse.data.rows[0].elements.length === 0) {
            logger.error('Respuesta inválida de Google Maps API. Posiblemente no se encontró una ruta.', distanceResponse.data);
            throw new HttpsError('not-found', 'No se pudo encontrar una ruta entre el origen y el destino.');
        }

        const result = distanceResponse.data.rows[0].elements[0];

        // ✅ VALIDACIÓN ADICIONAL: Asegurarse de que el elemento tenga una distancia válida.
        if (!result.distance || typeof result.distance.value === 'undefined') {
            logger.error('El elemento de la respuesta de Google Maps no contiene una distancia válida.', result);
            throw new HttpsError('not-found', 'No se pudo determinar la distancia para la ruta encontrada.');
        }

        if (result.status !== 'OK') {
            logger.error('Error de la API de Google Maps al calcular la distancia:', result.status);
            throw new HttpsError('internal', 'No se pudo calcular la distancia.');
        }

        const distanciaEnMetros = result.distance.value;
        const distanciaEnKm = distanciaEnMetros / 1000;
        logger.info(`Distancia calculada: ${distanciaEnKm.toFixed(2)} km.`);

        // 4. Calcular el costo de envío (¡LÓGICA PERSONALIZABLE!)
        // Se calcula el costo basado en la distancia.
        const costoCalculado = distanciaEnKm * envioPrecioPorKm;
        // El costo final es el mayor entre el costo calculado y el precio mínimo de envío.
        const costoEnvio = Math.max(costoCalculado, envioPrecioMin);

        // 5. Devolver el resultado
        return {
            costo: parseFloat(costoEnvio.toFixed(2))
        };

    } catch (error) {
        logger.error("Error en shippingService:", error);
        // Si el error ya es un HttpsError, lo relanzamos.
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Ocurrió un error inesperado al calcular el envío.');
    }
});
*/




// --- FUNCIÓN DE PRUEBA GENÉRICA (V2 Callable) ---
// Nota: 'onCall' es la función V2 equivalente a 'functions.https.onCall'
export const sendGenericHolaMessage = onCall(async () => {
    const message = {
        notification: {
            title: "Mensaje de Prueba Simple",
            body: "¡Hola! Esta es una notificación genérica para ti."
        },
        data: {
            "purpose": "test",
            "source": "generic_function"
        },
        token: TEST_FCM_TOKEN
    };

    try {
        const response = await messaging.send(message);
        logger.info('Mensaje genérico "Hola" enviado con éxito (por token):', response);
        return { success: true, messageId: response.messageId || 'N/A' };
    } catch (error) {
        logger.error('Error al enviar mensaje genérico "Hola" (por token):', error);
        // ✅ CORRECCIÓN: Usar HttpsError importado desde 'firebase-functions/v2/https'.
        // Se elimina la dependencia residual del SDK v1 (functions.https).
        throw new HttpsError('internal', 'Ocurrió un error al enviar el mensaje de prueba.');
    }
});

// --- NUEVA FUNCIÓN DE PRUEBA SÚPER SIMPLE PARA TOPICS (V2) ---
// Nota: 'onRequest' es la función V2 equivalente a 'functions.https.onRequest'
export const sendSimpleTopicTestMessage = onRequest(async (req, res) => {
    const TEST_TOPIC = "test_topic_para_pruebas";
    const payload = {
        notification: {
            title: 'Notificación de Prueba de Topic',
            body: '¡Hola! Este mensaje viene desde un topic de prueba.'
        },
        data: {
            "origin": "simple_topic_test_function",
            "testType": "topic"
        }
    };
    logger.info(`Intentando enviar notificación al topic: ${TEST_TOPIC}`);
    try {
        const response = await messaging.sendToTopic(TEST_TOPIC, payload);
        logger.info(`Notificación de prueba a topic ${TEST_TOPIC} enviada exitosamente:`, response);
        res.status(200).send(`Notificación enviada a topic '${TEST_TOPIC}' con éxito.`);
    } catch (error) {
        logger.error(`Error al enviar notificación al topic ${TEST_TOPIC}:`, error);
        res.status(500).send(`Error al enviar notificación a topic '${TEST_TOPIC}': ${error.message}`);
    }
});

// 2. Definición de la función auxiliar para enviar notificaciones a un topic
async function enviarNotificacionAlVendedor(nombreCliente, channel, emailVendedor) {
    const payload = {
        notification: {
            title: '¡Nueva venta!',
            body: "Cliente: " + nombreCliente,
        },
        data: {
            channel: channel,
            email: emailVendedor
        }
    };
    const topicName = emailVendedor.replace(/[@.]/g, '_');
    logger.info(`Intentando enviar notificación al topic: ${topicName} con payload:`, payload);
    try {
        const response = await messaging.sendToTopic(topicName, payload);
        logger.info(`Notificación enviada exitosamente al topic ${topicName}:`, response);
        return response;
    } catch (error) {
        logger.error(`Error al enviar notificación al topic ${topicName}:`, error);
        throw error;
    }
}

/**
 * Función auxiliar para enviar una notificación a los dispositivos de un usuario.
 * @param {string} userId - El ID del usuario al que se enviará la notificación.
 * @param {string} idPedido - El ID del pedido.
 * @param {string} nombreComercio - El nombre del comercio.
 * @returns {Promise<object>} - Un objeto con el resultado del envío.
 */
async function enviarNotificacionDeVenta(userId, idPedido, nombreComercio, direccionCliente) {
    // Log para depuración de la versión del SDK
    logger.log('Firebase Admin SDK version:', admin.SDK_VERSION); // Se asegura el uso del módulo 'admin' importado.
    logger.log(`Preparando notificación de venta para el usuario: ${userId}, pedido: ${idPedido}`);

    try {
        const deviceTokensRef = db
            .collection("usuarios")
            .doc(userId)
            .collection("device_tokens");
        const snapshot = await deviceTokensRef.get();

        if (snapshot.empty) {
            logger.log(`No se encontraron tokens de FCM para el usuario: ${userId}.`);
            return { success: false, message: "No se encontraron tokens para el usuario." };
        }
        const tokens = snapshot.docs.map(doc => doc.id);
        logger.log(`Tokens encontrados para ${userId}: ${tokens.join(", ")}`);

        const fechaVenta = new Date().toLocaleDateString("es-ES");
        const mensajes = tokens.map(token => ({
            notification: {
                title: `${nombreComercio} a ${direccionCliente}`,
                body: `¡Nueva venta en ${nombreComercio}! Pedido: ${idPedido}`
            },
            data: {
                "purpose": "nueva_venta_notificacion",
                "pedidoId": idPedido,
                "userId": userId
            },
            token: token,
        }));

        if (tokens.length > 0) {
            // Se actualizó a sendEach para manejar mejor las grandes cantidades de tokens
            const response = await messaging.sendEach(mensajes);
            logger.log('Notificaciones enviadas con éxito:', JSON.stringify(response));

            // sendEach no retorna successCount y failureCount, hay que calcularlo manualmente
            const successCount = response.successCount;
            const failureCount = response.failureCount;

            const tokensToDelete = [];
            response.responses.forEach((result, index) => {
                const error = result.error;
                if (error) {
                    logger.error(`Fallo al enviar a token: ${tokens[index]} para ${userId}`, error);
                    if (error.code === "messaging/invalid-registration-token" ||
                        error.code === "messaging/registration-token-not-registered") {
                        tokensToDelete.push(tokens[index]);
                    }
                }
            });
            if (tokensToDelete.length > 0) {
                const deletePromises = tokensToDelete.map(token =>
                    db.collection("usuarios").doc(userId)
                        .collection("device_tokens").doc(token).delete()
                );
                await Promise.all(deletePromises);
                logger.log(`Tokens inválidos eliminados para ${userId}.`);
            }
            return {
                success: true,
                message: `Notificaciones enviadas. Éxitos: ${successCount}, Fallos: ${failureCount}`,
                successCount: successCount,
                failureCount: failureCount
            };
        } else {
            return { success: false, message: "No hay tokens válidos para enviar." };
        }
    } catch (error) {
        logger.error(`Error en enviarNotificacionDeVenta para ${userId}:`, error);
        return { success: false, message: `Error interno: ${error.message}` };
    }
}

// Tu función HTTP Callable (si aún la necesitas para pruebas directas)
export const enviarNotificacionTestManualmente = onCall(async (data, context) => {
    const { userId, idPedido, nombreComercio } = data;
    if (!userId || !idPedido || !nombreComercio) {
        // ✅ CORRECCIÓN: Usar HttpsError importado desde 'firebase-functions/v2/https'.
        // Se elimina la dependencia residual del SDK v1 (functions.https).
        throw new HttpsError('invalid-argument', 'Faltan parámetros: userId, idPedido, nombreComercio.');
    }
    return enviarNotificacionDeVenta(userId, idPedido, nombreComercio);
});

export const nuevaVenta = onDocumentWritten('ventas/{docId}', async (event) => { // Asegurarse de que el trigger sea onDocumentWritten
    // ✅ LOG DE ACTIVACIÓN: Para confirmar que la función se dispara.
    logger.info("Función nuevaVenta activada.");

    // 1. Obtener los datos ANTES y DESPUÉS del cambio.
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Si no hay datos después (documento eliminado), no hacemos nada.
    if (!afterData) {
        logger.log("Documento de venta eliminado. No se envía notificación.");
        return null;
    }

    // ✅ MEJORA: Solo enviar notificación si el estado cambia DE "Pendiente de Pago" A "Pagada".
    // Esto evita notificaciones duplicadas si el webhook se ejecuta varias veces sobre un pedido ya pagado.
    const estadoAnterior = beforeData?.estado;
    const estadoNuevo = afterData.estado;

    if (estadoAnterior !== 'Pendiente de Pago' || estadoNuevo !== 'Pagada') {
        logger.log(`La notificación no se envía. Transición de estado no válida. Anterior: '${estadoAnterior}', Nuevo: '${estadoNuevo}'.`);
        return null;
    }

    const ventaData = afterData;
    const docId = event.params.docId;
    logger.log(`Venta pagada detectada, ID: ${docId}, Datos:`, JSON.stringify(ventaData));
    const idUsuarioComercio = ventaData.comercio.uid;
    const nombreDelComercio = ventaData.comercio.nombre || "Tu Comercio";
    const direccionCliente= ventaData.usuario.direccion.split(',')[0]
    const idDelPedido = docId;

    if (!idUsuarioComercio) {
        logger.error("Error: 'idUsuarioComercio' no encontrado en los datos de la venta.");
        return null;
    }
    logger.log(`Enviando notificación de nueva venta a: ${idUsuarioComercio} para el pedido ${idDelPedido}`);
    try {
        const resultadoEnvio = await enviarNotificacionDeVenta(
            idUsuarioComercio,
            idDelPedido,
            nombreDelComercio,
            direccionCliente
        );
        logger.log("Resultado del envío de notificación desde nuevaVenta:", resultadoEnvio);
    } catch (error) {
        logger.error("Error al llamar a enviarNotificacionDeVenta desde nuevaVenta:", error);
    }
    return null;
});

/**
 * Función auxiliar para enviar una notificación a un usuario específico.
 * @param {string} userId - El UID del usuario a notificar.
 * @param {string} title - El título de la notificación.
 * @param {string} body - El cuerpo del mensaje de la notificación.
 * @returns {Promise<void>}
 */
async function enviarNotificacionAUsuario(userId, title, body) {
    if (!userId) {
        logger.warn("No se proporcionó userId, no se puede enviar notificación.");
        return;
    }

    const deviceTokensRef = db.collection("usuarios").doc(userId).collection("device_tokens");
    const snapshot = await deviceTokensRef.get();

    if (snapshot.empty) {
        logger.info(`No se encontraron tokens de FCM para el usuario: ${userId}.`);
        return;
    }

    const tokens = snapshot.docs.map(doc => doc.id);
     // 1. Prepara el payload del mensaje. El payload ahora se combina en un solo objeto.
    const message = {
        notification: {
            title: title,
            body: body,
        },
        tokens: tokens, // Los tokens ahora van dentro del objeto del mensaje
    };

    try {
        // 2. Usa 'sendEachForMulticast' en lugar de 'sendToDevice'.
        // Este método es el recomendado actualmente.
        const response = await messaging.sendEachForMulticast(message);
        
        logger.info(`Notificación enviada para ${userId}: ${response.successCount} éxitos, ${response.failureCount} fallos.`);

        // 3. La lógica de limpieza de tokens ya es compatible con la nueva respuesta. ¡No necesita cambios!
        if (response.failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((result, index) => {
                const error = result.error;
                if (!result.success && error) {
                    logger.error(`Fallo al enviar al token: ${tokens[index]} para ${userId}`, error);
                    
                    if (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered') {
                        tokensToDelete.push(tokens[index]);
                    }
                }
            });

            if (tokensToDelete.length > 0) {
                logger.info(`Eliminando ${tokensToDelete.length} tokens inválidos para el usuario ${userId}.`);
                const deletePromises = tokensToDelete.map(token =>
                    deviceTokensRef.doc(token).delete() // Reutilizamos la referencia que ya teníamos
                );
                await Promise.all(deletePromises);
            }
        }
    } catch (error) {
        logger.error(`Error crítico al enviar notificaciones multicast al usuario ${userId}:`, error);
    }
}

/**
 * Función auxiliar para calcular la distancia entre dos puntos en Km (fórmula de Haversine).
 */
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    logger.info(`Distancia calculada entre puntos: ${R * c} km.`);
    return R * c; // Distancia en km
}


/**
 * Función Callable para asignar manualmente un envío a un cadete.
 * Es atómica y segura contra condiciones de carrera.
 */
export const aceptarEnvio = onCall(
       async (request) => {
    // 1. Validar la entrada
    const cadeteId = request.auth?.uid;
    const { envioId } = request.data; // Desestructuración moderna

    // ✅ LOG: Registrar los datos de entrada.
    logger.info(`[aceptarEnvio] Inicio. Cadete: ${cadeteId}, Datos recibidos:`, request.data);

    if (!cadeteId) {
        throw new HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }
    if (!envioId) {
        throw new HttpsError('invalid-argument', 'La función debe ser llamada con un "envioId".');
    }

    logger.info(`Intento de aceptación: Cadete ${cadeteId} -> Envío ${envioId}`);

    // 2. Referencias a los documentos
    const envioRef = db.collection('envios').doc(envioId);
    const cadeteRef = db.collection('usuarios').doc(cadeteId);

    try {
        // 3. Ejecutar la lógica dentro de una transacción atómica
        await db.runTransaction(async (transaction) => {
            // ✅ LOG: Confirmar que la transacción ha comenzado.
            logger.info(`[aceptarEnvio] Dentro de la transacción. Leyendo documentos...`);

            const envioDoc = await transaction.get(envioRef);
            const cadeteDoc = await transaction.get(cadeteRef);

            // 4. Validaciones de negocio
            if (!envioDoc.exists) {
                throw new HttpsError('not-found', `El envío ${envioId} no existe.`);
            }
            if (!cadeteDoc.exists) {
                throw new HttpsError('not-found', `El perfil del cadete ${cadeteId} no existe.`);
            }

            const envioData = envioDoc.data();
            const cadeteData = cadeteDoc.data();
            
            // ✅ LOG: Mostrar los datos leídos de la base de datos.
            logger.info(`[aceptarEnvio] Datos del envío:`, envioData);
            logger.info(`[aceptarEnvio] Datos del cadete:`, cadeteData);

            // ✅ CORRECCIÓN: Lógica simplificada según tu solicitud.
            // La función ahora solo permite aceptar envíos que están estrictamente en estado 'pendiente'.
            logger.info(`[aceptarEnvio] Verificando estado del envío. Actual: '${envioData.estado}', Requerido: 'pendiente'.`);
            if (envioData.estado !== 'pendiente') {
                logger.warn(`El cadete ${cadeteId} intentó aceptar el envío ${envioId}, pero su estado es '${envioData.estado}'.`);
                throw new HttpsError('failed-precondition', 'Este envío ya no está disponible.');
            }

            logger.info(`[aceptarEnvio] Verificando estado del cadete. Actual: '${cadeteData.estado}', Requerido: 'activo'. ¿Ocupado?: ${!!cadeteData.envioAsignadoId}`);
            if (cadeteData.estado !== 'activo' || cadeteData.envioAsignadoId) {
                 logger.warn(`El cadete ${cadeteId} intentó aceptar un envío pero su estado es '${cadeteData.estado}' o ya está ocupado.`);
                 throw new HttpsError('failed-precondition', 'No puedes aceptar envíos si no estás activo y libre.');
            }

            // 5. Actualizaciones
            logger.info(`¡Validaciones superadas! Asignando envío ${envioId} al cadete ${cadeteId}.`);
            logger.info(`[aceptarEnvio] ¡Validaciones superadas! Actualizando documentos...`);
            transaction.update(envioRef, {
                cadeteId: cadeteId,
                estado: 'asignado'
            });
            transaction.update(cadeteRef, {
                estado: 'ocupado',
                envioAsignadoId: envioId
            });
        });

        // 6. Éxito
        logger.info(`¡Éxito! Transacción completada para envío ${envioId}.`);
        logger.info(`[aceptarEnvio] ¡Éxito! Transacción completada para envío ${envioId}.`);
        return { success: true, message: "Envío aceptado correctamente." };

    } catch (error) {
        logger.error(`Error en la transacción para aceptar el envío ${envioId}:`, error);
        // ✅ LOG: Registrar el error específico que causó el fallo.
        logger.error(`[aceptarEnvio] Error en la transacción para el envío ${envioId}:`, error);

        if (error instanceof HttpsError) {
            throw error;
        } else {
            throw new HttpsError('internal', 'Ocurrió un error inesperado al intentar aceptar el envío.');
        }
    }
});

/**
 * Función Callable para que un cadete marque un envío como entregado.
 * Es atómica y segura contra condiciones de carrera.
 */
export const marcarEnvioComoEntregado = onCall(async (request) => {
    // 1. Validar autenticación y datos de entrada.
    const cadeteId = request.auth?.uid;
    const { descansar } = request.data; // Solo recibimos 'descansar'

    if (!cadeteId) {
        throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
    }
    if (descansar === undefined) {
        throw new HttpsError('invalid-argument', 'Se requiere el parámetro "descansar".');
    }

    // La referencia al envío se obtendrá dentro de la transacción.
    const cadeteRef = db.collection('usuarios').doc(cadeteId);

    try {
        // 3. Usar una transacción para una finalización segura.
        await db.runTransaction(async (transaction) => {
            const cadeteDoc = await transaction.get(cadeteRef);

            if (!cadeteDoc.exists) {
                throw new HttpsError('not-found', `El perfil del cadete ${cadeteId} no existe.`);
            }

            const cadeteData = cadeteDoc.data();

            // Obtenemos el ID del envío desde el perfil del cadete.
            const envioId = cadeteData.envioAsignadoId;
            if (!envioId) {
                throw new HttpsError('failed-precondition', 'No tienes ningún envío asignado para finalizar.');
            }

            logger.info(`Intento de entrega: Cadete ${cadeteId} -> Envío ${envioId}. Descansar: ${descansar}`);

            // Ahora obtenemos el documento del envío.
            const envioRef = db.collection('envios').doc(envioId);
            const envioDoc = await transaction.get(envioRef);

            if (!envioDoc.exists) {
                throw new HttpsError('not-found', `El envío ${envioId} (asignado a ti) no existe.`);
            }
            const envioData = envioDoc.data();

            // 4. Verificaciones de negocio.
            if (envioData.cadeteId !== cadeteId) {
                throw new HttpsError('permission-denied', 'No tienes permiso para marcar este envío como entregado.');
            }
            if (envioData.estado !== 'asignado') {
                throw new HttpsError('failed-precondition', `Este envío no puede ser marcado como entregado. Estado actual: ${envioData.estado}.`);
            }

            // 5. Actualizar los documentos.
            logger.info(`¡Validaciones superadas! Marcando envío ${envioId} como entregado por cadete ${cadeteId}.`);
            transaction.update(envioRef, { 
                estado: 'entregado',
                fechaEntrega: FieldValue.serverTimestamp()
            });

            const nuevoEstadoCadete = descansar ? 'inactivo' : 'activo';
            transaction.update(cadeteRef, {
                estado: nuevoEstadoCadete,
                envioAsignadoId: FieldValue.delete()
            });
        });

        logger.info(`¡Éxito! El cadete ${cadeteId} marcó un envío como entregado.`);
        return { success: true, message: 'Envío marcado como entregado correctamente.' };

    } catch (error) {
        logger.error(`Error al intentar marcar como entregado un envío por el cadete ${cadeteId}:`, error.message);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Error interno al marcar el envío como entregado.');
    }
});

export const buscarEnviosCercanos = onCall(
  { region: "southamerica-east1", memory: "256MiB" },
  async (request) => {
    // 1. VALIDACIÓN Y AUTENTICACIÓN
    const cadeteId = request.auth?.uid;
    logger.info(`[buscarEnviosCercanos] Inicio. Cadete autenticado: ${cadeteId}`);

    if (!cadeteId) {
      throw new HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }

    try {
      // 2. OBTENER DATOS Y UBICACIÓN DEL CADETE DESDE FIRESTORE (LA FUENTE DE VERDAD)
      const cadeteDoc = await db.collection('usuarios').doc(cadeteId).get();
      if (!cadeteDoc.exists) {
        throw new HttpsError('not-found', 'No se encontró el perfil del cadete.');
      }
      const cadeteData = cadeteDoc.data();
      const idCadeteria = cadeteData.idCadeteria;
      
      // Obtenemos la ubicación GeoPoint ('l') del documento del cadete
      const ubicacionCadete = cadeteData.l; 

      if (!idCadeteria) {
        throw new HttpsError('failed-precondition', 'El perfil del cadete no tiene una cadetería asignada.');
      }
      // Verificamos que la ubicación exista y sea válida
      if (!ubicacionCadete || typeof ubicacionCadete.latitude !== 'number' || typeof ubicacionCadete.longitude !== 'number') {
          logger.warn(`[buscarEnviosCercanos] El cadete ${cadeteId} no tiene una ubicación válida en su perfil. No se puede buscar.`);
          return { envios: [] }; // Devolvemos una lista vacía si no hay ubicación
      }
      
      // Extraemos lat y lon desde el documento del cadete
      const lat = ubicacionCadete.latitude;
      const lon = ubicacionCadete.longitude;
      logger.info(`Ubicación obtenida del perfil del cadete: [${lat}, ${lon}]`);


      // 3. LÓGICA DE BÚSQUEDA GEOESPACIAL (ESTRATEGIA DE RANGO) - SIN CAMBIOS
      const radioEnKm = 5.0;
      const [minLat, minLon, maxLat, maxLon] = getBoundingBox(lat, lon, radioEnKm);
      const lowerBound = geohash.encode(minLat, minLon);
      const upperBound = geohash.encode(maxLat, maxLon);

      logger.info(`Buscando para cadetería '${idCadeteria}' en estado 'pendiente' entre geohash '${lowerBound}' y '${upperBound}'.`);

      // 4. CONSTRUIR Y EJECUTAR LA CONSULTA CORRECTA - SIN CAMBIOS
      const query = db.collection("envios")
         .where("idCadeteria", "==", idCadeteria)
        .where("estado", "==", "pendiente")
        // 👇 --- CAMBIO AQUÍ --- 👇
        .where("g", ">=", lowerBound)      // Cambiado de "origen.g" a "g"
        .where("g", "<=", upperBound)      // Cambiado de "origen.g" a "g"
        .orderBy("g");                     // Cambiado de "origen.g" a "g"

      const enviosSnapshot = await query.get();

      if (enviosSnapshot.empty) {
        logger.info("[buscarEnviosCercanos] La consulta de rango no encontró envíos en el área.");
        return { envios: [] };
      }

      // 5. FILTRADO FINAL EN MEMORIA - SIN CAMBIOS EN LA LÓGICA
      logger.info(`[buscarEnviosCercanos] ${enviosSnapshot.size} documentos encontrados en el cuadro. Filtrando por radio exacto...`);
      
      const enviosCercanos = [];
      enviosSnapshot.forEach(doc => {
        const envioData = doc.data();
        const origenCoords = envioData.l; // ✅ CORRECCIÓN: Usar el GeoPoint 'l' de la raíz del documento.

        if (origenCoords) {
          const distancia = getDistanceInKm(lat, lon, origenCoords.latitude, origenCoords.longitude);
          if (distancia <= radioEnKm) {
            const envioParaCliente = {
              id: doc.id,
              origen: envioData.origen?.direccion || "No disponible", // ✅ CORRECCIÓN: Ahora devuelve solo el valor de la dirección.
              destino: envioData.destino?.direccion || "No disponible" , // Mantenemos la estructura para el cliente
              distancia: parseFloat(distancia.toFixed(2)), // Devolvemos la distancia calculada
              propina: envioData.propina || 0.0
            };
            enviosCercanos.push(envioParaCliente);
          }
        } else {
          logger.warn(`[Debug] 'origenCoords' NO existe para doc ${doc.id}. Se omite este envío.`);
        }
      });

      // 6. ÉXITO - SIN CAMBIOS
      logger.info(`[buscarEnviosCercanos] ¡Éxito! Enviando ${enviosCercanos.length} envíos al cliente.`);
      return { envios: enviosCercanos };

    } catch (error) {
      logger.error("[buscarEnviosCercanos] Error crítico durante la búsqueda:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Error interno al buscar envíos. Verifica los índices y logs.');
    }
  }
);

/**
 * Calcula las coordenadas de un cuadro delimitador (bounding box) alrededor de un punto central.
 */
function getBoundingBox(lat, lon, distanceInKm) {
    const R = 6371; // Radio de la Tierra en km
    const latRad = lat * (Math.PI / 180);
    const dLat = distanceInKm / R;
    const dLon = distanceInKm / (R * Math.cos(latRad));
    const minLat = lat - dLat * (180 / Math.PI);
    const maxLat = lat + dLat * (180 / Math.PI);
    const minLon = lon - dLon * (180 / Math.PI);
    const maxLon = lon + dLon * (180 / Math.PI);
    return [minLat, minLon, maxLat, maxLon];
}
// =================================================================
// 6. Servicio para Asignar Envíos a Cadetes (basado en colección 'cadetes')
// =================================================================






/**
 * Se activa cuando se crea un nuevo documento en la colección "envios".
 * Busca al cadete más cercano (con rol "cadete") en un radio de 1 km
 * y, si lo encuentra, asigna su UID al envío.
 */

// ✅ NUEVO: Constante para el radio de búsqueda base.
const RADIO_BUSQUEDA_BASE_KM = 1;

/**
 * ✅ CAMBIO: Se activa cuando se crea O actualiza un documento en "envios".
 * Esto permite re-lanzar la búsqueda si un cliente mejora la propina o si un cadete rechaza el viaje.
 */
export const asignarEnvioCadeteCercano = onDocumentWritten("envios/{envioId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const envioId = event.params.envioId;

    // Si el documento fue eliminado, no hacemos nada.
    if (!afterData) {
        logger.info(`Envío ${envioId} eliminado. No se procesa.`);
        return null;
    }

    // ✅ MEJORA: La función solo se ejecuta si el estado final es 'solicitado'
    // y el estado anterior NO era 'solicitado'. Esto cubre la creación inicial
    // y las actualizaciones que intencionadamente re-lanzan la búsqueda.
    if (afterData.estado !== 'solicitado' || beforeData?.estado === 'solicitado') {
        logger.info(`El envío ${envioId} no requiere una nueva asignación. Estado anterior: ${beforeData?.estado}, Estado actual: ${afterData.estado}.`);
        return null;
    }
    const envioData = afterData;
    // ✅ SOLUCIÓN: Validar que el envío tenga un 'idCadeteria' antes de continuar.
    // Esto evita el error si el envío se crea desde una fuente que no incluye este campo.
    if (!envioData.idCadeteria) {
        logger.error(`El envío ${envioId} no tiene el campo 'idCadeteria'. No se puede buscar cadetes.`);
        return null;
    }

    // 2. Obtener las coordenadas de origen del envío
    const origenCoords = envioData.origen?.coordenadas;
    if (!origenCoords || typeof origenCoords.latitude !== 'number' || typeof origenCoords.longitude !== 'number') {
        logger.error(`El envío ${envioId} no tiene coordenadas de origen válidas.`, { data: envioData.origen });
        return null;
    }

    // ✅ MEJORA: Obtener la tarifa mínima directamente desde el documento del envío.
    // Esto evita una lectura adicional a la base de datos.
    const tarifaMinima = envioData.tarifaMinima || 1; // Usamos 1 como fallback para evitar división por cero.
    if (envioData.tarifaMinima === undefined) {
        logger.warn(`El envío ${envioId} no tiene el campo 'tarifaMinima'. Se usará un valor por defecto para el cálculo del radio.`);
        return null;
    }

    const propina = envioData.propina || 0;
    const radioBusquedaKm = propina > 0 ? RADIO_BUSQUEDA_BASE_KM + (propina / tarifaMinima) : RADIO_BUSQUEDA_BASE_KM;
    logger.info(`Cálculo de radio para envío ${envioId}: Propina: ${propina}, Tarifa Mínima: ${tarifaMinima}, Radio Final: ${radioBusquedaKm.toFixed(2)} km.`);

    try {
        // ✅ SOLUCIÓN DEFINITIVA: Separar la lógica en dos pasos.
        // PASO 1: Obtener TODOS los cadetes activos de la cadetería correcta.
        // Esta consulta requiere un índice compuesto en Firestore sobre:
        // (idCadeteria ASC, estado ASC, rol ASC)
        const cadetesQuery = db.collection('usuarios')
            .where('idCadeteria', '==', envioData.idCadeteria)
            .where('estado', '==', 'activo')
            .where('rol', '==', 'cadete');

        const cadetesSnapshot = await cadetesQuery.get();

        if (cadetesSnapshot.empty) {
            logger.warn(`No se encontraron cadetes activos para la cadetería ${envioData.idCadeteria}.`);
            await db.collection('envios').doc(envioId).update({ estado: 'pendiente' });
            return null;
        }

        // PASO 2: Calcular la distancia a cada cadete y encontrar al más cercano dentro del radio.
        let cadeteMasCercano = null;
        let distanciaMinima = Infinity;

        cadetesSnapshot.forEach(doc => {
            const cadete = doc.data();
            const cadeteCoords = cadete.l; // El campo 'l' es el GeoPoint

            if (cadeteCoords && cadeteCoords.latitude && cadeteCoords.longitude) {
                const distancia = getDistanceInKm(origenCoords.latitude, origenCoords.longitude, cadeteCoords.latitude, cadeteCoords.longitude);
                logger.info(`[Depuración] Distancia al cadete ${doc.id}: ${distancia.toFixed(2)} km.`);
                if (distancia < distanciaMinima && distancia <= radioBusquedaKm) {
                    distanciaMinima = distancia;
                    cadeteMasCercano = { id: doc.id, ...cadete };
                }
            }
        });

        if (!cadeteMasCercano) {
            logger.warn(`No se encontraron cadetes dentro del radio de ${radioBusquedaKm.toFixed(2)}km para el envío ${envioId}. El envío queda pendiente.`);
            await db.collection('envios').doc(envioId).update({ estado: 'pendiente' });
            return null;
        }

        // Si encontramos un cadete, lo asignamos.
        const cadeteId = cadeteMasCercano.id;
        logger.info(`Cadete más cercano encontrado: ${cadeteId} a ${distanciaMinima.toFixed(2)} km. Asignando al envío ${envioId}...`);

        // ✅ MEJORA: Actualizar tanto el envío como el estado del cadete en una transacción.
        const envioRef = db.collection('envios').doc(envioId);
        const cadeteRef = db.collection('usuarios').doc(cadeteId);

        await db.runTransaction(async (transaction) => {
            transaction.update(envioRef, { cadeteId: cadeteId, estado: 'asignado' });
            transaction.update(cadeteRef, { estado: 'ocupado', envioAsignadoId: envioId });
        });

        // ✅ MEJORA: Enviar notificación al cliente y al cadete.
        const nombreCadete = cadeteMasCercano.nombre || 'un cadete';
        await enviarNotificacionAUsuario(envioData.usuarioId, '¡Cadete Asignado!', `Se ha asignado a ${nombreCadete} a ${distanciaMinima.toFixed(2)} km.`);
        await enviarNotificacionAUsuario(cadeteId, '¡Nuevo Envío Asignado!', `Origen: ${envioData.origen.direccion.split(',')[0]}`);
        
        logger.info(`¡Éxito! Envío ${envioId} asignado al cadete ${cadeteId}.`);

    } catch (error) {
        logger.error(`Error al buscar o asignar cadete para el envío ${envioId}:`, error);
    }
    
    return null;
});

// =================================================================
// 7. Servicio para Suspender y Reactivar Cadetes
// =================================================================

/**
 * Función de Tarea: reactivarCadeteProgramado
 * Se ejecuta cuando es llamada por la cola de tareas programada por `suspenderCadete`.
 * - Verifica que el cadete siga suspendido.
 * - Cambia el estado del cadete de vuelta a 'activo'.
 */
export const reactivarCadeteProgramado = onTaskDispatched({ region: MP_REGION }, async (request) => {
    const { cadeteId } = request.data;

    if (!cadeteId) {
        logger.error("Tarea de reactivación ejecutada sin 'cadeteId'.");
        return;
    }

    logger.info(`Iniciando tarea de reactivación para el cadete: ${cadeteId}`);

    const cadeteRef = db.collection('usuarios').doc(cadeteId);

    try {
        const doc = await cadeteRef.get();
        if (!doc.exists) {
            logger.warn(`El cadete ${cadeteId} no fue encontrado para reactivarlo.`);
            return;
        }

        const cadeteData = doc.data();
        // Solo reactivar si el estado actual es 'suspendido'
        if (cadeteData.estado === 'suspendido') {
            await cadeteRef.update({ estado: 'activo', suspensionHasta: FieldValue.delete() });
            logger.info(`¡Éxito! El cadete ${cadeteId} ha sido reactivado.`);
        }
    } catch (error) {
        logger.error(`Error al reactivar al cadete ${cadeteId}:`, error);
    }
});

/**
 * ✅ CORRECCIÓN: Función Callable para cancelar un envío por parte del cliente.
 * Usa onCall para integrarse correctamente con el frontend y evitar errores de CORS.
 */
export const cancelarEnvioCliente = onCall(async (request) => {
    // 1. Validar autenticación y datos de entrada.
    const userId = request.auth?.uid;
    const { envioId } = request.data;

    if (!userId) {
        throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
    }
    if (!envioId) {
        throw new HttpsError('invalid-argument', 'Se requiere "envioId".');
    }

    const envioRef = db.collection('envios').doc(envioId);

    try {
        // 2. Usar una transacción para una cancelación segura.
        await db.runTransaction(async (transaction) => {
            const envioDoc = await transaction.get(envioRef);
            if (!envioDoc.exists) {
                throw new HttpsError('not-found', `El envío ${envioId} no existe.`);
            }

            const envioData = envioDoc.data();

            // 3. Verificaciones de negocio.
            if (envioData.usuarioId !== userId) {
                throw new HttpsError('permission-denied', 'No tienes permiso para cancelar este envío.');
            }

            if (envioData.estado !== 'solicitado' && envioData.estado !== 'pendiente') {
                throw new HttpsError('failed-precondition', `Este envío ya no se puede cancelar. Estado actual: ${envioData.estado}.`);
            }

            // 4. Actualizar el estado si todo es correcto.
            transaction.update(envioRef, { estado: 'cancelado' });
        });

        logger.info(`El cliente ${userId} canceló exitosamente el envío ${envioId}.`);
        return { success: true, message: 'Envío cancelado correctamente.' };
    } catch (error) {
        logger.error(`Error al intentar cancelar el envío ${envioId} por el cliente ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Error interno al cancelar el envío.');
    }
});

/**
 * Función Callable para vincular la cuenta de un usuario autenticado
 * con su cuenta de Google, usando un idToken proporcionado por el cliente.
 */


logger.info("--- EJECUTANDO VERSIÓN DE FUNCIÓN: v2.0 (Estrategia de Actualización Directa) ---");


logger.info("--- EJECUTANDO VERSIÓN DE FUNCIÓN: v3.0 (Final y Correcta) ---");

export const vincularCuentaConGoogle = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La función solo puede ser llamada por un usuario autenticado.");
    }

    const { idToken } = request.data;
    if (!idToken) {
        throw new HttpsError("invalid-argument", "Falta el 'idToken' en la llamada.");
    }

    const uid = request.auth.uid;
    logger.info(`Iniciando vinculación para el usuario: ${uid}`);

    try {
        const auth = getAuth();
        const firestore = getFirestore();

        // 1. VERIFICAR EL TOKEN DE GOOGLE (LA FORMA CORRECTA)
        // Usamos verifyIdToken con el segundo parámetro 'true'.
        // Esto verifica la firma, la expiración Y relaja la comprobación de 'audience',
        // aceptando el ID de cliente web de tu app.
        const decodedToken = await auth.verifyIdToken(idToken, true);
        const googleEmail = decodedToken.email;

        if (!googleEmail) {
            throw new HttpsError("internal", "El token de Google no contiene un email.");
        }

        // 2. VERIFICAR SI EL EMAIL YA ESTÁ EN USO POR OTRO USUARIO
        try {
            const existingUser = await auth.getUserByEmail(googleEmail);
            if (existingUser.uid !== uid) {
                throw new HttpsError("already-exists", "Esta cuenta de Google ya está registrada con otro perfil.");
            }
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error; // Lanza cualquier otro error que no sea "usuario no encontrado"
            }
        }

        // 3. ACTUALIZAR EL USUARIO EN FIREBASE AUTH
        await auth.updateUser(uid, {
            email: googleEmail,
            emailVerified: true,
        });

        // 4. ACTUALIZAR FIRESTORE
        const userDocRef = firestore.collection("usuarios").doc(uid);
        await userDocRef.update({
            email: googleEmail,
            googleVinculado: true,
        });

        logger.info(`Vinculación exitosa para el usuario ${uid} con el email ${googleEmail}.`);
        return { success: true, message: "Cuenta vinculada correctamente." };

    } catch (error) {
        logger.error(`Error final en el proceso de vinculación para ${uid}:`, error);

        if (error instanceof HttpsError) {
            throw error;
        }

        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            throw new HttpsError("unauthenticated", "El token de Google es inválido o ha expirado.");
        }

        throw new HttpsError("internal", "Ocurrió un error inesperado al intentar vincular la cuenta.");
    }
});