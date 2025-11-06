import { iniciarFirebase, firebaseConfig } from "./funciones.js";

/**
 * Función principal que se ejecuta cuando el DOM está completamente cargado.
 */
function onPageLoad() {
    // 1. Inicializar Firebase para poder usar sus servicios.
    iniciarFirebase();
    const auth = firebase.auth();

    // 2. Obtener el botón del HTML.
    const authButton = document.getElementById('authButton');
    if (!authButton) {
        console.error("El botón con id 'authButton' no fue encontrado en el HTML.");
        return;
    }

    /**
     * Inicia el flujo de autorización de Mercado Pago.
     * Esta función se llama cuando se hace clic en el botón.
     */
    function startAuthFlow() {
        // Se verifica el estado del usuario en el momento exacto del clic.
        const user = auth.currentUser;

        if (user) {
            // Si el usuario está autenticado, se construye la URL y se redirige.
            console.log("Usuario autenticado. Redirigiendo a Mercado Pago...");
            const firebaseUid = user.uid;

            const CLIENT_ID = "6552776689253759";
            
            // ✅ MEJORA: Construir la URL de redirección dinámicamente usando la configuración del proyecto.
            const region = 'southamerica-east1'; // La región donde están tus funciones.
            const REDIRECT_URI = `https://${region}-${firebaseConfig.projectId}.cloudfunctions.net/mercadopagoService/mp-callback`;

            const authUrl = `https://auth.mercadopago.com/authorization?` +
                `client_id=${encodeURIComponent(CLIENT_ID)}` +
                `&response_type=code` +
                `&platform_id=mp` +
                `&state=${encodeURIComponent(firebaseUid)}` + // Se pasa el UID para asociar la cuenta.
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

            window.location.href = authUrl;
        } else {
            // Si el usuario no está autenticado, se le informa y se le redirige a la página de login.
            console.log("Usuario no autenticado al hacer clic. Redirigiendo a login...");
            alert("Debes iniciar sesión para poder conectar tu cuenta de vendedor.");
            window.location.href = 'usuario.html?volver=vendedores.html';
        }
    }

    // 3. Asignar la función al evento 'click' del botón.
    authButton.addEventListener('click', () => {
        startAuthFlow();
    });

    // 4. Observar el estado de la sesión para habilitar o deshabilitar el botón.
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Estado de sesión: Autenticado. Botón habilitado.");
            authButton.disabled = false;
        } else {
            console.log("Estado de sesión: No autenticado. Botón deshabilitado.");
            authButton.disabled = true;
        }
    });
}

// Asegurarse de que el script se ejecute solo cuando el DOM esté listo.
document.addEventListener('DOMContentLoaded', onPageLoad);