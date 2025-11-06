  // Obtener referencias a los elementos del DOM
        const addressInput = document.getElementById('addressInput');
        const searchButton = document.getElementById('searchButton');
        const googleMapIframe = document.getElementById('googleMapIframe');
        const messageBox = document.getElementById('messageBox'); // Referencia al nuevo contenedor de mensajes

        // Función para mostrar mensajes al usuario
        function showMessage(message, type = 'error') {
            messageBox.textContent = message;
            messageBox.style.display = 'block'; // Muestra el cuadro de mensaje
            if (type === 'error') {
                messageBox.style.backgroundColor = '#ffebee';
                messageBox.style.color = '#d32f2f';
                messageBox.style.borderColor = '#ef9a9a';
            } else {
                // Puedes añadir otros tipos de mensajes (ej. 'info', 'success')
                messageBox.style.backgroundColor = '#e8f5e9';
                messageBox.style.color = '#2e7d32';
                messageBox.style.borderColor = '#a5d6a7';
            }
        }

        // Función para ocultar mensajes
        function hideMessage() {
            messageBox.style.display = 'none';
        }

        // Función para cargar el mapa
        function loadMap() {
            console.log("Cargando mapa con la dirección:", addressInput.value); // Log para depuración
            hideMessage(); // Oculta cualquier mensaje anterior

            const address = addressInput.value.trim(); // Elimina espacios en blanco al inicio/final

            if (!address) {
                showMessage('Por favor, ingresa una dirección para buscar.');
                return; // Detiene la ejecución si no hay dirección
            }

            // Verifica si el iframe del mapa existe antes de intentar usarlo
            if (!googleMapIframe) {
                console.error("Error: No se encontró el elemento 'googleMapIframe'. Verifica el ID en el HTML.");
                showMessage('Ha ocurrido un error al cargar el mapa. Por favor, inténtalo de nuevo más tarde.', 'error');
                return; // Detiene la ejecución si el iframe no se encuentra
            }

            // Codificar la dirección para la URL
            const encodedAddress = encodeURIComponent(address);
            // Construir la URL de Google Maps Embed
            // ¡REEMPLAZA 'YOUR_GOOGLE_MAPS_API_KEY' CON TU CLAVE DE API REAL!
            const googleMapsUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyCJpJBJn2o7-0ezJrWmD5tUgf2Fbj90tUU&q=${encodedAddress}`;
            googleMapIframe.src = googleMapsUrl;
        }

        // Añadir el evento click al botón
        searchButton.addEventListener('click', loadMap);

        // Opcional: Cargar el mapa al presionar Enter en el campo de texto
        addressInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                loadMap();
            }
        });

        // Cargar un mapa predeterminado al iniciar la página (opcional)
        window.onload = () => {
            // Puedes establecer una dirección inicial o dejarlo vacío
            addressInput.value = 'Urquiza y sarmiento, Gualeguaychu, Entre Rios, Argentina';
            loadMap(); // Cargar el mapa con la dirección inicial
        };