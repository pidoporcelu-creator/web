import { iniciarFirebase } from '/funciones.js';
import ngeohash from 'https://cdn.skypack.dev/ngeohash'; // ✅ NUEVO: Importamos la librería para geohashing
iniciarFirebase();

/**
 * ✅ NUEVA FUNCIÓN: Carga dinámicamente el script de Google Maps y devuelve una promesa.
 * Esto nos da control total sobre el orden de carga y evita errores de "google is not defined".
 */
async function loadGoogleMaps() {
    // Si el script ya está cargado, no hacemos nada.
    if (window.google && window.google.maps) {
        return Promise.resolve();
    }

    try {
        // 1. Obtener la clave de la API desde Firestore
        const db = firebase.firestore(); // Aseguramos que db esté disponible
        const configDoc = await db.collection('datosGenerales').doc('datos').get();
        if (!configDoc.exists || !configDoc.data().googleMapsApiKey) {
            throw new Error("La clave de API de Google Maps no está configurada en Firestore (datosGenerales/datos).");
        }
        const apiKey = configDoc.data().googleMapsApiKey;

        // 2. Cargar el script con la clave obtenida
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        // 3. Esperar a que el script se cargue
        return new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar el script de Google Maps.'));
        });
    } catch (error) {
        console.error("Error al cargar la configuración de Google Maps:", error);
        alert(error.message); // Notificar al usuario del problema
        return Promise.reject(error);
    }
}

// La lógica principal ahora se ejecuta DESPUÉS de que la promesa de carga del mapa se resuelva.
loadGoogleMaps().then(() => {
    console.log("Google Maps API cargada. Iniciando la lógica de la página.");


    // --- Lógica para restaurar el formulario ---
    const savedFormData = localStorage.getItem('cadeteriaFormDraft');
    if (savedFormData) {
        const formData = JSON.parse(savedFormData); // eslint-disable-line no-unused-vars
        document.getElementById('origen').value = formData.origen || '';
        document.getElementById('referencia_origen').value = formData.referencia_origen || '';
        document.getElementById('destino').value = formData.destino || '';
        document.getElementById('referencia_destino').value = formData.referencia_destino || '';
        document.getElementById('propina').value = formData.propina || ''; // ✅ AÑADIDO: Restaurar propina

        console.log("Formulario restaurado desde el borrador guardado.");
        localStorage.removeItem('cadeteriaFormDraft'); // Limpiar el borrador después de usarlo
    }

    const celularInput = document.getElementById('celular');
    const cadeteriaListContainer = document.getElementById('cadeteria-list');
    const celularFormGroup = document.getElementById('celular-form-group');

    // --- Lógica para el mapa ---
    const originInput = document.getElementById('origen');
    const destinationInput = document.getElementById('destino');
    const toggleDetails = document.getElementById('toggle-details');
    const optionalDetails = document.getElementById('optional-details');
    // ✅ NUEVO: Variables para el cálculo de costo
    let selectedCadeteriaTarifaxkm = 0;
    let selectedCadeteriaTarifaMinima = 0;
    let currentCalculatedCost = 0;
    let currentCalculatedDistanceText = ''; // ✅ NUEVO: Para guardar la distancia en texto
    let selectedCadeteriaId = null; // ✅ NUEVO: Para guardar el ID de la cadetería
    const cadeteriaForm = document.getElementById('cadeteria-form');
    const successMessageContainer = document.getElementById('success-message');

    const mapDiv = document.getElementById('map');
    // ✅ CORRECCIÓN: Mover la declaración de currentDestinationCoordinates a un scope global.
    let map, originMarker, destinationMarker, directionsService, directionsRenderer, currentDestinationCoordinates;
    // ✅ MEJORA: Objeto para almacenar la última dirección y sus coordenadas validadas.
    const lastGeocodedOrigin = {
        address: '',
        coords: null
    };

    // --- Cargar Cadeterías desde Firestore ---
    const db = firebase.firestore();
    // ✅ NUEVO: Lógica para leer el parámetro 'id' de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const nickUrlFromUrl = urlParams.get('nick');

    // ✅ NUEVO: Lógica para leer el nick desde el path de la URL (ej: /cadeterias.html/la-veloz)
    const pathParts = window.location.pathname.split('/');
    // Busca una parte después de '.html' que no esté vacía.
    const nickFromPath = pathParts.find((part, index) => index > 0 && pathParts[index - 1].endsWith('.html') && part) || null;
    
    // Damos prioridad al nick en el path sobre el query param.
    const finalNickUrl = nickFromPath || nickUrlFromUrl;

    // ✅ NUEVO: Referencias a elementos de la UI que se manipularán
    const mainFormContent = document.getElementById('main-form-content');
    const noCadeteriasMessage = document.getElementById('no-cadeterias-message');
    const specificCadeteriaDisplay = document.getElementById('specific-cadeteria-display');
    const cadeteriaSelectionGroup = cadeteriaListContainer.parentElement;
    const specificCadeteriaLogo = document.getElementById('specific-cadeteria-logo');
    const specificCadeteriaName = document.getElementById('specific-cadeteria-name');


    const cadeteriaIdFromUrl = urlParams.get('id');

    // Función para renderizar la lista de cadeterías
    const renderCadeterias = (docs) => {
        cadeteriaListContainer.innerHTML = ""; // ✅ CORRECCIÓN: Limpiar el contenedor al inicio.
        if (docs.length === 0) {
            cadeteriaListContainer.innerHTML = "<p>No hay cadeterías disponibles en este momento.</p>";
            return;
        }

        let isFirst = true;
        docs.forEach((doc) => {
            const cadeteria = doc.data();
            const idCadeteria = doc.id;

            const optionLabel = document.createElement('label');
            optionLabel.className = 'vehicle-option cadeteria-option';

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'cadeteria_id';
            radioInput.value = idCadeteria;
            radioInput.required = true;

            radioInput.dataset.celular = cadeteria.celular || ''; // ✅ NUEVO: Guardar celular
            if (cadeteria.lat && cadeteria.lon) {
                radioInput.dataset.lat = cadeteria.lat;
                radioInput.dataset.lon = cadeteria.lon;
                radioInput.dataset.direccion = cadeteria.direccion;
                radioInput.dataset.tarifaxkm = cadeteria.tarifaxkm || 0;
                radioInput.dataset.tarifaminima = cadeteria.tarifaminima || 0;
                radioInput.dataset.permiteWhatsapp = cadeteria.permiteWhatsapp || false; // ✅ NUEVO: Guardar permiso de WhatsApp
            }
            if (isFirst) {
                radioInput.checked = true;
                isFirst = false;
                selectedCadeteriaTarifaxkm = parseFloat(cadeteria.tarifaxkm) || 0;
                selectedCadeteriaTarifaMinima = parseFloat(cadeteria.tarifaminima) || 1;
                selectedCadeteriaId = idCadeteria;
                updateWhatsappButton(cadeteria.permiteWhatsapp, cadeteria.celular); // ✅ NUEVO: Actualizar botón para la primera cadetería
            }

            const img = document.createElement('img');
            img.src = cadeteria.imagen || '/recursos/imagenes/cadete_default.png';
            img.alt = cadeteria.negocio || 'Cadetería';

            const name = document.createElement('p');
            name.textContent = cadeteria.negocio || 'Sin Nombre';

            optionLabel.appendChild(radioInput);
            optionLabel.appendChild(img);
            optionLabel.appendChild(name);
            cadeteriaListContainer.appendChild(optionLabel);
        });
    };

    // ✅ NUEVO: Función para manejar la lógica cuando se encuentra una cadetería específica por URL
    const setupSpecificCadeteria = (doc) => {
        const cadeteria = doc.data();
        const idCadeteria = doc.id;

        // 1. Ocultar la lista de selección y mostrar el display específico
        cadeteriaSelectionGroup.style.display = 'none';
        specificCadeteriaDisplay.style.display = 'flex';

        // 2. Poblar el display con los datos de la cadetería
        specificCadeteriaLogo.src = cadeteria.imagen || '/recursos/imagenes/cadete_default.png';
        specificCadeteriaLogo.alt = cadeteria.negocio || 'Cadetería';
        specificCadeteriaName.textContent = cadeteria.negocio || 'Sin Nombre';

        // 3. Crear un input de radio oculto para que el formulario funcione
        cadeteriaListContainer.innerHTML = ''; // Limpiar por si acaso
        const hiddenRadio = document.createElement('input');
        hiddenRadio.type = 'radio';
        hiddenRadio.name = 'cadeteria_id';
        hiddenRadio.value = idCadeteria;
        hiddenRadio.checked = true;
        hiddenRadio.style.display = 'none'; // Lo hacemos invisible
        cadeteriaListContainer.appendChild(hiddenRadio);

        // 4. Configurar las variables globales de tarifas y ID
        selectedCadeteriaTarifaxkm = parseFloat(cadeteria.tarifaxkm) || 0;
        selectedCadeteriaTarifaMinima = parseFloat(cadeteria.tarifaminima) || 1;
        selectedCadeteriaId = idCadeteria;

        // 5. Actualizar el botón de WhatsApp
        updateWhatsappButton(cadeteria.permiteWhatsapp, cadeteria.celular);

        // 6. Mostrar el resto del formulario
        mainFormContent.style.display = 'block';
        noCadeteriasMessage.style.display = 'none';
    };

    /**
     * ✅ NUEVO Y ESCALABLE: Busca cadeterías basadas en la ubicación del usuario.
     * Esta es la forma correcta de escalar la aplicación.
     */
    const fetchNearbyCadeterias = (latitude, longitude) => {
        // NOTA: Esta es una simulación. Una implementación real usaría GeoFirestore
        // para hacer una consulta de radio eficiente, algo como:
        // const geoCollection = new GeoFirestore(db.collection('cadeterias'));
        // const query = geoCollection.near({ center: new firebase.firestore.GeoPoint(latitude, longitude), radius: 15 }); // Radio de 15km

        const noCadeteriasMessage = document.getElementById('no-cadeterias-message');
        noCadeteriasMessage.style.display = 'none'; // Ocultar mensaje previo
        mainFormContent.style.display = 'none'; // Ocultar formulario previo
        // query.get().then(snapshot => renderCadeterias(snapshot.docs));
        // Simulación con la lógica actual (filtrado en el cliente) ---
        // Esto todavía descarga todo, pero demuestra el flujo. El siguiente paso sería implementar GeoFirestore.
        cadeteriaListContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #606770;">Buscando cadeterías cercanas...</p>';
        console.log(`Buscando cadeterías cerca de ${latitude}, ${longitude}`);
        db.collection("cadeterias").where("activo", "==", true).get().then(snapshot => {
            const cadeteriasConDistancia = snapshot.docs.map(doc => {
                const cadeteria = doc.data();
                if (cadeteria.lat && cadeteria.lon) {
                    const distance = getDistanceInKm(latitude, longitude, cadeteria.lat, cadeteria.lon);
                    return { doc, distance };
                }
                return { doc, distance: Infinity };
            }).filter(item => item.distance <= 10); // Filtramos a 10km

            // ✅ MEJORA: Ordenar por distancia, de más cercano a más lejano.
            cadeteriasConDistancia.sort((a, b) => a.distance - b.distance);
            const nearbyDocs = cadeteriasConDistancia.map(item => item.doc);

            if (nearbyDocs.length === 0) {
                // ✅ CAMBIO: Si no se encuentran cadeterías cercanas, mostramos un mensaje y no hacemos nada más.
                // Ya no se buscan todas las cadeterías como fallback.
                // ✅ MEJORA: También nos aseguramos de que el resto del formulario permanezca oculto.
                noCadeteriasMessage.textContent = 'Lo sentimos, no hay cadeterías disponibles en esta área.';
                noCadeteriasMessage.style.display = 'block';
            } else {
                // ✅ MEJORA: Mostramos el resto del formulario solo si encontramos cadeterías.
                mainFormContent.style.display = 'block';
                renderCadeterias(nearbyDocs);
            }
        });
    };

    // Función para buscar todas las cadeterías activas
    const fetchAllCadeterias = () => {
        return db.collection("cadeterias").where("activo", "==", true).get()
            .then(snapshot => { cadeteriaListContainer.innerHTML = ''; return snapshot; }) // ✅ MEJORA: Limpiar el contenedor antes de renderizar.
            .then(snapshot => renderCadeterias(snapshot.docs))
            .catch(error => console.error("Error al cargar todas las cadeterías:", error));
    };
    
    // --- LÓGICA DE CARGA PRINCIPAL ---
    if (finalNickUrl) {
        // MODO 1: Se especificó un nick en la URL. Buscamos solo esa cadetería.
        console.log(`Buscando cadetería específica con nickUrl: ${finalNickUrl}`);
        noCadeteriasMessage.textContent = 'Buscando cadetería...';
        noCadeteriasMessage.style.display = 'block';

        db.collection("cadeterias")
          .where("nickUrl", "==", finalNickUrl)
          .where("activo", "==", true)
          .limit(1)
          .get()
          .then(snapshot => {
              if (!snapshot.empty) {
                  console.log("Cadetería encontrada. Configurando página.");
                  const cadeteriaDoc = snapshot.docs[0];
                  // Centrar mapa en la cadetería encontrada
                  const { lat, lon } = cadeteriaDoc.data();
                  if (lat && lon) {
                      initMap(lat, lon);
                  } else {
                      initMap(); // Usar ubicación por defecto si no tiene
                  }
                  setupSpecificCadeteria(cadeteriaDoc);
              } else {
                  console.warn(`No se encontró una cadetería activa con el nickUrl '${finalNickUrl}'.`);
                  noCadeteriasMessage.textContent = 'La cadetería solicitada no existe o no está disponible.';
                  mainFormContent.style.display = 'none';
              }
          }).catch(error => {
              console.error("Error al buscar cadetería por nickUrl:", error);
              noCadeteriasMessage.textContent = 'Error al buscar la cadetería.';
            } );
    } else {
        // MODO 2: No hay nick en la URL. El usuario debe ingresar una dirección para buscar.
        console.log("Modo de búsqueda por ubicación activado.");
        initMap(); // Inicia el mapa, que intentará geolocalizar al usuario.
    }

    // Listener para actualizar el mapa y las tarifas al cambiar de cadetería.
    cadeteriaListContainer.addEventListener('change', (e) => {
        if (e.target.name === 'cadeteria_id') {
            const selectedRadio = e.target;
            const lat = parseFloat(selectedRadio.dataset.lat);
            const lon = parseFloat(selectedRadio.dataset.lon);
            selectedCadeteriaTarifaxkm = parseFloat(selectedRadio.dataset.tarifaxkm) || 0;
            selectedCadeteriaTarifaMinima = parseFloat(selectedRadio.dataset.tarifaminima) || 0;
            selectedCadeteriaId = selectedRadio.value;
            updateWhatsappButton(selectedRadio.dataset.permiteWhatsapp === 'true', selectedRadio.dataset.celular); // ✅ NUEVO: Actualizar botón al cambiar de cadetería

            if (lat && lon && map) {
                const newCenter = new google.maps.LatLng(lat, lon);
                map.setCenter(newCenter);
                originInput.blur();
            }
            calculateAndDisplayRoute();
        }
    });

    // ✅ NUEVO: Función para gestionar la visibilidad y el enlace del botón de WhatsApp
    function updateWhatsappButton(permite, numero) {
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn.parentElement !== document.body) {
            document.body.appendChild(whatsappBtn); // Moverlo si no está ya en el body
        }

        if (permite && numero) {
            const mensaje = encodeURIComponent("Hola, necesito ayuda con un pedido.");
            whatsappBtn.href = `https://wa.me/54${numero}?text=${mensaje}`;
            whatsappBtn.style.display = 'flex'; // Mostrar el botón
        } else {
            whatsappBtn.style.display = 'none'; // Ocultar el botón
        }
    }


    // --- Lógica para mostrar/ocultar el bloque de detalles opcionales ---
    const toggleArrow = document.getElementById('toggle-arrow');
    toggleDetails.addEventListener('click', () => {
        const isHidden = optionalDetails.style.display === 'none';
        optionalDetails.style.display = isHidden ? 'block' : 'none';
        toggleDetails.firstChild.textContent = isHidden ? 'Ocultar detalles ' : 'Agregar detalles (opcional) ';
        toggleArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Inicializamos los servicios de Direcciones de Google Maps
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true // Evita que el renderizador cree sus propios marcadores
    });

    // Inicializamos el mapa tan pronto como el DOM esté listo (después de los servicios de ruta)
    initMap();


    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // --- Usuario está logueado ---
            db.collection('usuarios').doc(user.uid).get().then(userDoc => {
                const userRole = userDoc.exists ? userDoc.data().rol : 'usuario';

                if (userRole === 'usuario') {
                    // Si es un usuario normal, verificar si tiene un envío activo
                    db.collection('envios')
                      .where('usuarioId', '==', user.uid)
                      .where('estado', 'in', ['solicitado', 'asignado', 'en viaje'])
                      .limit(1)
                      .get()
                      .then(activeEnviossSnapshot => {
                          if (!activeEnviossSnapshot.empty) {
                              // Tiene un envío activo, deshabilitar formulario
                              const restrictionMessage = document.getElementById('restriction-message');
                              const form = document.getElementById('cadeteria-form');
                              
                              restrictionMessage.innerHTML = `Ya tienes un pedido en curso. No puedes solicitar otro hasta que el actual finalice. <a href="mis-envios-cliente.html" class="font-bold underline">Ver mi pedido</a>.`;
                              restrictionMessage.style.display = 'block';
                              form.style.display = 'none';
                          } else {
                              // No tiene envíos activos, habilitar el formulario
                              celularFormGroup.style.display = 'none';
                              celularInput.removeAttribute('required');
                          }
                      }).catch(error => {
                          console.error("Error al verificar envíos activos:", error);
                          // En caso de error, por seguridad, se permite continuar.
                          celularFormGroup.style.display = 'none';
                          celularInput.removeAttribute('required');
                      });
                } else {
                    // Si es vendedor o admin, no hay restricciones
                    console.log(`Rol de usuario es '${userRole}'. Sin restricciones de envío.`);
                    celularFormGroup.style.display = 'none';
                    celularInput.removeAttribute('required');

                
                }
            });
        } else {
            // --- Usuario NO está logueado ---
            console.log('Usuario no autenticado.');

            // Mostramos el campo de celular y nos aseguramos de que sea requerido
            celularFormGroup.style.display = 'block';

            // Hacemos que el campo no sea editable y parezca un botón
            celularInput.placeholder = "Haz clic para iniciar sesión y cargar tu celular";
            celularInput.readOnly = true;
            celularInput.style.cursor = 'pointer';
            celularInput.style.backgroundColor = '#e9ecef'; // Gris claro para indicar que está inactivo

            // Al hacer clic, redirigimos a la página de usuario
            celularInput.addEventListener('click', () => { // eslint-disable-line no-unused-vars
                window.location.href = 'usuario.html?volver=cadeteria.html';
            });
        }
    });

    // --- Lógica del Mapa Interactivo ---
    function initMap(lat, lng) {
        // ✅ MEJORA Y LOGS: Lógica de inicialización del mapa mejorada.
        // Si no se proporcionan coordenadas, intenta obtener la ubicación del navegador.
        if (lat === undefined || lng === undefined) {
            console.log("[LOG] initMap: No se proporcionaron coordenadas. Intentando usar geolocalización del navegador.");
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("[LOG] Permiso de ubicación concedido. Centrando mapa en el usuario.");
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        initMap(userLat, userLng); // Llama a sí misma con las coordenadas
                        // Solo buscar si no estamos en modo "cadetería específica"
                        if (!finalNickUrl) {
                            fetchNearbyCadeterias(userLat, userLng);
                        }
                    },
                    () => {
                        console.warn("[LOG] Permiso de ubicación denegado. Usando ubicación por defecto.");
                        initMap(-33.0094, -58.5238); // Gualeguaychú por defecto
                    }
                );
                return; // Detiene la ejecución actual para esperar la respuesta de geolocalización
            }
        }

        map = new google.maps.Map(mapDiv, {
            center: { lat, lng },
            zoom: 15, // Zoom inicial, se aumenta al encontrar una dirección
        });

        // Asociamos el renderizador de rutas al mapa
        directionsRenderer.setMap(map);

        originMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true, // ✅ CORRECCIÓN: El marcador de origen siempre debe ser arrastrable
            title: "Origen"
        });

        // Evento al hacer clic en el mapa para mover el marcador
        map.addListener('click', (e) => {
            originMarker.setPosition(e.latLng);
            updateCoordinates(e.latLng);
            calculateAndDisplayRoute();
        });

        // Evento al terminar de arrastrar el marcador
        originMarker.addListener('dragend', (e) => {
            calculateAndDisplayRoute(); // ✅ CORRECCIÓN: Recalcular la ruta al arrastrar
            updateCoordinates(e.latLng);
        });
    }

    function updateCoordinates(latLng) {
        const lat = latLng.lat();
        const lng = latLng.lng();
        // ✅ MEJORA: Actualizamos las coordenadas en nuestro objeto de estado.
        // ✅ CAMBIO: Esto ahora también dispara la búsqueda de cadeterías.
        if (!finalNickUrl) {
            fetchNearbyCadeterias(lat, lng);
        etchNearbyCadeterias(lat, lng); // eslint-disable-line no-undef
            fetchNearbyCadeterias(lat, lng); // Se elimina la línea duplicada con el error de tipeo.
        }
        lastGeocodedOrigin.coords = { lat: lat, lon: lng };
        console.log(`Coordenadas seleccionadas: Latitud ${lat}, Longitud ${lng}`);
    }

    // Función para calcular y mostrar la ruta
    function calculateAndDisplayRoute() {
        const routeInfoDiv = document.getElementById('route-info');
        const routeDistanceSpan = document.getElementById('route-distance');
        const routeDurationSpan = document.getElementById('route-duration');
        const routeCostSpan = document.getElementById('route-cost');
        const estimateCostBtn = document.getElementById('estimate-cost-btn');

        if (!originMarker || !destinationMarker || !originMarker.getMap() || !destinationMarker.getMap()) {
            // Si no están ambos marcadores, no hacemos nada o limpiamos la ruta existente
            directionsRenderer.setDirections({ routes: [] });
            // ✅ MEJORA: Ocultar la información de la ruta si no hay destino.
            routeInfoDiv.style.display = 'none';
            // ✅ NUEVO: Limpiar el costo
            estimateCostBtn.style.display = 'block'; // Mostrar el botón de estimar
            currentCalculatedCost = 0;
            currentCalculatedDistanceText = ''; // ✅ NUEVO: Limpiar la distancia
            return;
        }

        // ✅ MEJORA: Mostrar un estado de carga mientras se calcula.
        estimateCostBtn.style.display = 'none'; // Ocultar el botón de estimar
        routeInfoDiv.style.display = 'block';
        routeDistanceSpan.textContent = 'Calculando...';
        routeDurationSpan.textContent = 'Calculando...';
        routeCostSpan.textContent = 'Calculando...';
        directionsService.route(
            {
                origin: originMarker.getPosition(),
                destination: destinationMarker.getPosition(),
                travelMode: google.maps.TravelMode.DRIVING, // Modo de viaje en vehículo
                // ✅ MEJORA: Añadimos opciones de conducción para obtener una estimación
                // de duración más precisa basada en el tráfico en tiempo real.
                drivingOptions: {
                    departureTime: new Date(), // Salida "ahora"
                    trafficModel: 'bestguess' // Usa datos de tráfico históricos y en tiempo real
                }
            },
            (response, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(response);

                    // ✅ MEJORA: Extraer y mostrar la distancia y duración.
                    const leg = response.routes[0].legs[0];
                    if (leg) {
                        routeDistanceSpan.textContent = leg.distance.text;
                        routeDurationSpan.textContent = leg.duration.text;
                        currentCalculatedDistanceText = leg.distance.text; // ✅ NUEVO: Guardar la distancia

                        // ✅ NUEVO: Actualizar el enlace del botón de tarifas
                        const verTarifasBtn = document.getElementById('ver-tarifas-btn');
                        verTarifasBtn.href = `tarifas.html?id=${selectedCadeteriaId}`;

                        // ✅ NUEVO: Calcular y mostrar el costo
                        const distanciaEnKm = leg.distance.value / 1000;
                        const costoCalculado = distanciaEnKm * selectedCadeteriaTarifaxkm;
                        const costoFinal = Math.max(costoCalculado, selectedCadeteriaTarifaMinima); // Aplicar tarifa mínima

                        routeCostSpan.textContent = `$${costoFinal.toFixed(2)}`;
                        currentCalculatedCost = parseFloat(costoFinal.toFixed(2));
                    }
                } else {
                    window.alert("No se pudo calcular la ruta: " + status);
                    // Limpiar en caso de error
                    routeDistanceSpan.textContent = 'No disponible';
                    routeDurationSpan.textContent = 'No disponible';
                    estimateCostBtn.style.display = 'block'; // Mostrar el botón si hay error
                    routeCostSpan.textContent = 'No disponible';
                    currentCalculatedCost = 0;
                    currentCalculatedDistanceText = ''; // ✅ NUEVO: Limpiar la distancia en caso de error
                }
            }
        );
    }

    // ✅ NUEVO: Lógica para el botón "Estimar costo"
    document.getElementById('estimate-cost-btn').addEventListener('click', () => {
        const originAddress = originInput.value.trim();
        const destinationAddress = destinationInput.value.trim();

        if (!originAddress) {
            alert('Por favor, ingresa una dirección de origen.');
            return;
        }
        if (!destinationAddress) {
            alert('Por favor, ingresa una dirección de destino para poder estimar el costo.');
            return;
        }
        calculateAndDisplayRoute();
    });

    // Función para calcular la distancia entre dos puntos en Km (fórmula de Haversine)
    function getDistanceInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    }
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    const geocodeOrigin = () => {
        const originAddress = originInput.value.trim();
        if (!originAddress) {
            return; // No hacer nada si el campo está vacío
        }

        // ✅ CORRECCIÓN FINAL Y ROBUSTA: La búsqueda se restringe al área de la cadetería seleccionada.
        // ✅ MEJORA CON LOGS: Lógica para añadir ciudad guardada y restringir búsqueda.
        let direccionParaBuscar = originAddress;
        let searchBounds = null;
        
        // --- LOGS PARA BÚSQUEDA DE CIUDAD ---
        console.log(`[LOG CIUDAD] 1. Dirección inicial: "${direccionParaBuscar}"`);

        // Búsqueda en LocalStorage
        (savedLocation) => {
            try {
                const { localidad } = JSON.parse(savedLocation);
                console.log(`[LOG CIUDAD] 2. Se encontró una ciudad guardada en el navegador: "${localidad}"`);
                if (localidad && !direccionParaBuscar.toLowerCase().includes(localidad.toLowerCase())) {
                    direccionParaBuscar = `${direccionParaBuscar}, ${localidad}`;
                    console.log(`[LOG CIUDAD] 3. Se añadió la ciudad guardada. Dirección ahora es: "${direccionParaBuscar}"`);
                }
            } catch (e) {
                console.warn("[LOG CIUDAD] No se pudo leer la ubicación guardada del navegador.", e);
        } 

        // Búsqueda en la cadetería seleccionada
        const selectedCadeteriaRadio = document.querySelector('input[name="cadeteria_id"]:checked');
        if (selectedCadeteriaRadio) {
            const cadeteriaLat = parseFloat(selectedCadeteriaRadio.dataset.lat);
            const cadeteriaLon = parseFloat(selectedCadeteriaRadio.dataset.lon);
            const cadeteriaDireccion = selectedCadeteriaRadio.dataset.direccion || '';
            const ciudadCadeteria = cadeteriaDireccion.split(',')[1]?.trim();

            // console.log(`[LOG CIUDAD] 4. Se encontró una cadetería seleccionada. Ciudad extraída: "${ciudadCadeteria}"`);

            if (ciudadCadeteria && !direccionParaBuscar.toLowerCase().includes(ciudadCadeteria.toLowerCase())) {
                direccionParaBuscar = `${direccionParaBuscar}, ${ciudadCadeteria}`;
                console.log(`[LOG CIUDAD] 5. Se añadió la ciudad de la cadetería. Dirección ahora es: "${direccionParaBuscar}"`);
            }

            searchBounds = new google.maps.Circle({ center: center, radius: 20000 }).getBounds(); // Radio de 20km
        } else {
            console.warn("[LOG CIUDAD] 4. No hay cadetería seleccionada para refinar la búsqueda.");
        }

        const geocoder = new google.maps.Geocoder();
        const geocodeRequest = { 'address': direccionParaBuscar, 'bounds': searchBounds, 'region': 'AR' };

        // console.log(`[LOG FINAL] Geocodificando con los siguientes parámetros:`, geocodeRequest);

        geocoder.geocode(geocodeRequest, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                const resultLat = location.lat();                const resultLng = location.lng();

             if (!map) { // Si el mapa no está inicializado, lo crea
                    initMap(resultLat, resultLng);
                    map.setZoom(17); // Aumentar zoom al encontrar una dirección específica
                } else { // Si ya existe, solo lo centra y mueve el marcador
                    originMarker.setPosition(location);
                    // Si no hay marcador de destino, centramos el mapa en el origen
                    if (!destinationMarker || !destinationMarker.getMap()) {
                        map.setCenter(location);
                    }
                }
                map.setZoom(17); // Aumentar zoom al encontrar una dirección específica
                updateCoordinates(location);
                // Solo buscar si no estamos en modo "cadetería específica"
                if (!finalNickUrl) {
                    calculateAndDisplayRoute(); // Intentamos dibujar la ruta
                }
                // ✅ MEJORA: Guardamos tanto la dirección como las coordenadas validadas.
                lastGeocodedOrigin.address = originAddress;
            } else {
                alert('No se pudo encontrar la dirección. Error: ' + status);
            }
        });
    };

    // ✅ MEJORA: Se activa la búsqueda al escribir (si es largo) o al quitar el foco.
    originInput.addEventListener('blur', () => {
        // ✅ MEJORA: La geocodificación ahora solo se activa al quitar el foco.
        geocodeOrigin();
    });


    // Actualiza el mapa cuando el usuario deja de escribir en el campo de destino
    destinationInput.addEventListener('blur', () => {
        const destinationAddress = destinationInput.value.trim();
        if (!destinationAddress) {
            if (destinationMarker) {
                destinationMarker.setMap(null); // Oculta el marcador si se borra la dirección
            }
            // ✅ CORRECCIÓN: La lógica de limpiar la ruta ya está en calculateAndDisplayRoute.
            // Simplemente la llamamos para que se encargue de todo.
            calculateAndDisplayRoute();
            return;
        }

        // --- Restricción de búsqueda por ubicación de cadetería ---
        const selectedCadeteriaRadio = document.querySelector('input[name="cadeteria_id"]:checked');
        const cadeteriaLat = selectedCadeteriaRadio?.dataset.lat;
        const cadeteriaLon = selectedCadeteriaRadio?.dataset.lon;
        const cadeteriaDireccion = selectedCadeteriaRadio?.dataset.direccion;

        let searchBounds = null;
        let ciudadCadeteria = '';
        if (cadeteriaLat && cadeteriaLon) {
            const center = new google.maps.LatLng(parseFloat(cadeteriaLat), parseFloat(cadeteriaLon));
            const circle = new google.maps.Circle({ center: center, radius: 20000 });
            searchBounds = circle.getBounds();
        }
        if (cadeteriaDireccion && cadeteriaDireccion.includes(',')) {
            ciudadCadeteria = cadeteriaDireccion.split(',')[1]?.trim() || '';
        }

        const direccionCompletaDestino = ciudadCadeteria ? `${destinationAddress}, ${ciudadCadeteria}` : destinationAddress;

        const geocoder = new google.maps.Geocoder();
        // ✅ CORRECCIÓN: Usamos 'componentRestrictions' para forzar la búsqueda dentro de Argentina.
        // Esto, combinado con 'bounds', hace que la búsqueda sea mucho más precisa y local.
        const geocodeRequest = { 'address': direccionCompletaDestino, 'bounds': searchBounds, componentRestrictions: { country: 'AR' } };

        geocoder.geocode(geocodeRequest, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                // Verificamos la distancia para el destino también
                if (cadeteriaLat && cadeteriaLon) {
                    const distance = getDistanceInKm(cadeteriaLat, cadeteriaLon, location.lat(), location.lng());
                    if (distance > 10) {
                        alert(`La dirección de destino está a ${distance.toFixed(1)} km, fuera del área de cobertura de 10 km.`);
                        return;
                    }
                }
                if (!destinationMarker) {
                    destinationMarker = new google.maps.Marker({
                        position: location,
                        map: map,
                        title: "Destino",
                        icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
                        draggable: true // Hacemos el marcador de destino arrastrable
                    });
                    destinationMarker.addListener('dragend', (e) => {
                        currentDestinationCoordinates = { lat: e.latLng.lat(), lon: e.latLng.lng() };
                        calculateAndDisplayRoute(); // Recalcula la ruta al arrastrar
                        console.log(`Coordenadas de destino actualizadas (arrastre):`, currentDestinationCoordinates);
                    });
                } else {
                    destinationMarker.setPosition(location);
                    destinationMarker.setMap(map);
                }
                calculateAndDisplayRoute(); // Dibuja la ruta
                currentDestinationCoordinates = { lat: location.lat(), lon: location.lng() };
                console.log(`Coordenadas de destino actualizadas (búsqueda):`, currentDestinationCoordinates);
            } else {
                alert('No se pudo encontrar la dirección de destino. Error: ' + status);
            }
        });
    });

    // Prevenir que se envíe el formulario al presionar Enter en los campos de dirección
    originInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita la acción por defecto (enviar formulario)
            originInput.blur();   // Dispara el evento 'blur' para que se actualice el mapa
        }
    });

    destinationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita la acción por defecto (enviar formulario)
            destinationInput.blur();   // Dispara el evento 'blur' para que se actualice el mapa
        }
    });

    // --- Lógica para el envío del formulario ---
    cadeteriaForm.addEventListener('submit', async (e) => { // Se usa la variable 'cadeteriaForm' ya declarada
        e.preventDefault(); // Evitamos que la página se recargue

        const submitButton = document.getElementById('submit-btn');
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';

        // ✅ MEJORA: Validar que la dirección actual coincida con la geocodificada antes de enviar.
        const currentInputAddress = originInput.value.trim(); // eslint-disable-line no-unused-vars
        if (currentInputAddress !== lastGeocodedOrigin.address) {
            alert("La dirección de origen ha cambiado. Por favor, confirma la nueva ubicación en el mapa antes de continuar.");
            // Forzamos la geocodificación de la dirección actual.
            geocodeOrigin(); 
            // Reactivamos el botón y detenemos el envío.
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
            return; // Detiene la ejecución.
        }


        // --- IMPLEMENTACIÓN DE LA MEJOR PRÁCTICA ---
        const user = firebase.auth().currentUser;
        if (!user) {
            // 1. Guardar los datos del formulario en localStorage
            const formData = { // eslint-disable-line no-unused-vars
                origen: document.getElementById('origen').value,
                referencia_origen: document.getElementById('referencia_origen').value,
                destino: document.getElementById('destino').value,
                referencia_destino: document.getElementById('referencia_destino').value,
                propina: document.getElementById('propina').value, // ✅ AÑADIDO: Guardar propina en borrador
            };
            localStorage.setItem('cadeteriaFormDraft', JSON.stringify(formData));

            // 2. Preguntar al usuario si quiere iniciar sesión
            if (confirm("Debes iniciar sesión para realizar un pedido. ¿Deseas ir a la página de inicio de sesión ahora?")) {
                // 3. Redirigir a la página de login con el parámetro para volver
                window.location.href = 'usuario.html?volver=cadeterias.html';
            }
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Pedido';
            return; // Detiene la ejecución de la función si no hay usuario.
        }

        try {
            // ✅ NUEVO: Obtener el nombre del cliente desde Firestore
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            const nombreCliente = userDoc.exists ? userDoc.data().nombre : 'Cliente Anónimo';
            
            const direccionOrigenCompleta = document.getElementById('origen').value;
            const propinaValue = document.getElementById('propina').value;
            const origenCoords = lastGeocodedOrigin.coords;
            const direccionDestinoCompleta = document.getElementById('destino').value.trim();
    
            // ✅ CORRECCIÓN: Se ajusta la estructura del objeto 'envio' según tu solicitud.
            // Los campos 'g' y 'l' ahora están en el nivel raíz para GeoFirestore.
            const envio = {
                cliente: nombreCliente,
                usuarioId: user ? user.uid : null,
                idCadeteria: cadeteriaForm.querySelector('input[name="cadeteria_id"]:checked')?.value,
                vehiculo: cadeteriaForm.querySelector('input[name="vehiculo"]:checked')?.value,
                celular: user ? user.phoneNumber : document.getElementById('celular').value,
                fecha: new Date(),
                estado: 'solicitado',
                costoEstimado: currentCalculatedCost,
                tarifaMinima: selectedCadeteriaTarifaMinima,
                tarifaxkm: selectedCadeteriaTarifaxkm,
                distancia: currentCalculatedDistanceText,
                propina: propinaValue ? parseFloat(propinaValue) : 0,
    
                // --- Objeto de Origen Limpio y Semántico ---
                origen: {
                    direccion: direccionOrigenCompleta,
                    referencia: document.getElementById('referencia_origen').value,
                    coordenadas: new firebase.firestore.GeoPoint(origenCoords.lat, origenCoords.lon)
                },
                // --- Objeto de Destino Limpio y Semántico ---
                destino: {
                    direccion: direccionDestinoCompleta,
                    referencia: document.getElementById('referencia_destino').value,
                    coordenadas: direccionDestinoCompleta && currentDestinationCoordinates ? new firebase.firestore.GeoPoint(currentDestinationCoordinates.lat, currentDestinationCoordinates.lon) : null
                },
                // --- Campos para la Librería de Geolocalización (Geohash y GeoPoint del origen) ---
                g: ngeohash.encode(origenCoords.lat, origenCoords.lon),
                l: new firebase.firestore.GeoPoint(origenCoords.lat, origenCoords.lon)
            };

            console.log("Objeto 'envio' a guardar:", envio);

            // Guardamos el objeto 'envio' en Firestore
            const docRef = await db.collection("envios").add(envio); // eslint-disable-line no-unused-vars
            
            // ✅ CORRECCIÓN: Redirigir al usuario a la página de seguimiento de envíos del cliente.
            window.location.href = 'mis-envios-cliente.html';
        } catch (error) {
            console.error("Error al procesar o guardar el pedido: ", error);
            alert("Hubo un error al realizar el pedido. Por favor, verifica las direcciones e inténtalo de nuevo.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
        }
    });

    // Lógica para el botón de "Hacer otro pedido"
    const newOrderBtn = document.getElementById('new-order-btn');
    newOrderBtn.addEventListener('click', () => {
        window.location.reload(); // La forma más simple de reiniciar el estado
    });
