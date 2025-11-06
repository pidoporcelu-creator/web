import { iniciarFirebase, extraerParametros, mostrarCampos, escucharCambiosEnCampos } from "./funciones.js"; // Importar getFirestoreDb, mostrarCampos, escucharCambiosEnCampos
import { Carrito, Score, Usuario, Comercio } from "./objetos.js"; // Asegúrate de que estas clases estén bien definidas en objetos.js

   // Inicializa Firebase App aquí, después de que el DOM esté listo
    iniciarFirebase(); 

    // Obtiene la instancia de Firestore después de inicializar Firebase
     const db = firebase.firestore();

const botonBorrar = document.getElementById('borrarDatos');

// --- Variables Globales y Elementos del DOM ---
// Asegúrate de que estos elementos existan en tu HTML
var profile = document.getElementById('profile');
var login = document.getElementById('login');
const fragment = document.createDocumentFragment();
let usuario = new Usuario(); // Instancia global de Usuario
let carrito = new Carrito(); // Instancia global de Carrito

// Referencias a elementos del formulario de datos de usuario (para el submit)
const purchaseForm = document.getElementById('formulario1'); // El formulario principal
const btnEnviar = document.getElementById('btnEnviar'); // El botón de enviar/comprar

// Referencias a elementos de autenticación telefónica
var numberButton = document.getElementById('numberButton');
var validateButton = document.getElementById('validate');

// Referencias a elementos de edición de perfil
var editar = document.getElementById('editar');
var logout = document.getElementById('logout'); // Corrección de la asignación

// Referencias maps

let address = ""

 //Barra de carga: Enviando
 const loadingBar = document.getElementById('loading-bar');


// Ocultar la sección de login/perfil al inicio hasta que se determine el estado
if (login) login.style.display = 'none';
if (profile) profile.style.display = 'none';


/*********** general functions ***********/

// Evento DOMContentLoaded: Se dispara cuando el documento HTML ha sido completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', async e => {
    console.log("DOMContentLoaded: Iniciado.");




// Añadir un "event listener" al botón
botonBorrar.addEventListener('click', () => {
  // Usar el método 'clear()' para borrar todos los elementos del localStorage
  localStorage.clear();
  // Opcional: mostrar una alerta para confirmar que los datos fueron borrados
  alert('¡Los datos locales han sido vaciados!');
});

 
    // Obtener hiddenPrivateInfo3 aquí dentro de DOMContentLoaded
    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
    if (!hiddenPrivateInfo3) {
        console.error("Elemento 'hiddenPrivateInfo3' no encontrado en DOMContentLoaded. No se pueden mostrar los campos de usuario.");
        // Considera mostrar un mensaje de error al usuario o deshabilitar funcionalidad
        return; 
    }


    // Manejador del evento submit para el formulario de datos de usuario
    if (purchaseForm) {
        purchaseForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Evita la recarga de la página al enviar el formulario

            console.log("Formulario de datos de usuario/compra enviado.");

            // Obtener los elementos de los campos de entrada y error
            // Asegúrate de que estos IDs existan y sean únicos en tu HTML
            const campoTelefono = document.getElementById('telefono');
            const errorTelefono = document.getElementById('errorTelefono');
            const campoDireccion = document.getElementById('addressInput');
            const campoReferencia = document.getElementById('referencia');
            const campoNombre = document.getElementById('nombre');

            // Asignar los valores a la instancia global de usuario
            // Estos ya deberían estar actualizados por los listeners de 'input' en funciones.js
            // Pero los re-asignamos aquí para asegurar que tomamos el valor final del DOM al submit
            usuario.direccion = campoDireccion ? campoDireccion.value.trim() : '';
            usuario.referencia = campoReferencia ? campoReferencia.value.trim() : '';
            usuario.nombre = campoNombre ? campoNombre.value.trim() : '';
            usuario.telefono = campoTelefono ? campoTelefono.value.trim() : '';

            // --- VALIDACIÓN DE CAMPOS DEL FORMULARIO (al enviar) ---
            let isValidForm = true;

            // Validación del Teléfono (se replica la lógica del 'input' para el submit)
            if (!campoTelefono || !errorTelefono) {
                console.error("Elementos 'telefono' o 'errorTelefono' no encontrados para validación.");
                isValidForm = false;
            } else if (usuario.telefono.length === 0) {
                errorTelefono.textContent = 'El teléfono no puede estar vacío.';
                errorTelefono.style.color = 'red';
                campoTelefono.focus();
                campoTelefono.setCustomValidity('El teléfono no puede estar vacío.'); // Mensaje nativo
                isValidForm = false;
            } else if (/\D/.test(usuario.telefono)) { // Verifica si contiene caracteres no numéricos
                errorTelefono.textContent = 'Por favor, ingresa solo números (0-9).';
                errorTelefono.style.color = 'red';
                campoTelefono.focus();
                campoTelefono.setCustomValidity('Por favor, ingresa solo números (0-9).'); // Mensaje nativo
                isValidForm = false;
            } else if (usuario.telefono.length !== 10) { // Verifica exactamente 10 dígitos numéricos
                errorTelefono.textContent = 'El teléfono debe tener exactamente 10 dígitos.';
                errorTelefono.style.color = 'red';
                campoTelefono.focus();
                campoTelefono.setCustomValidity('El teléfono debe tener exactamente 10 dígitos.'); // Mensaje nativo
                isValidForm = false;
            } else {
                errorTelefono.textContent = 'Teléfono correcto';
                errorTelefono.style.color = 'green';
                campoTelefono.setCustomValidity(''); // Limpiar el mensaje nativo si es válido
            }

            // Validación de Nombre
            if (!campoNombre) {
                console.error("Elemento 'nombre' no encontrado para validación.");
                isValidForm = false;
            } else if (usuario.nombre.length === 0) {
                console.error("Error: El nombre no puede estar vacío.");
                campoNombre.setCustomValidity('El nombre no puede estar vacío.');
                campoNombre.classList.add('is-invalid');
                campoNombre.classList.remove('is-valid');
                isValidForm = false;
            } else {
                campoNombre.setCustomValidity('');
                campoNombre.classList.remove('is-invalid');
                campoNombre.classList.add('is-valid');
            }

            // Validación de Dirección
            if (!campoDireccion) {
                console.error("Elemento 'direccion' no encontrado para validación.");
                isValidForm = false;
            } else if (usuario.direccion.length === 0) {
                console.error("Error: La dirección no puede estar vacía.");
                campoDireccion.setCustomValidity('La dirección no puede estar vacía.');
                campoDireccion.classList.add('is-invalid');
                campoDireccion.classList.remove('is-valid');
                isValidForm = false;
            } else {
                campoDireccion.setCustomValidity('');
                campoDireccion.classList.remove('is-invalid');
                campoDireccion.classList.add('is-valid');
            }
            // Puedes añadir más validaciones para 'referencia' si es 'required'

            if (!isValidForm) {
                console.warn("Validación de formulario fallida. Deteniendo envío.");
                // Forzar la validación de todo el formulario al enviar
                purchaseForm.reportValidity(); 
                return; 
            }
            // --- FIN DE LA VALIDACIÓN ---

            // Si todas las validaciones pasan:
            localStorage.setItem("usuario_data_key", JSON.stringify(usuario)); // Usar clave consistente
            console.log("Datos de usuario guardados en localStorage:", usuario);

            let mensaje = "Pedido procesado correctamente, en breve lo enviaremos a: " + usuario.direccion;
            alert(mensaje); // Considera reemplazar alert con un modal personalizado para mejor UX

            console.log("Lógica para guardar pedido en Firebase (trabajando en ello).");
            // Aquí iría la lógica para guardar el pedido completo en Firebase Firestore.
            // Por ejemplo: await getFirestoreDb().collection('pedidos').add({ ...datosDelPedido });
        });
    } else {
        console.error("Elemento 'formulario1' no encontrado. No se pudo adjuntar el event listener de envío.");
    }

    console.log("Mostrando campos de usuario...");
    // Carga el usuario desde localStorage para la renderización inicial
    let storedUsuario = localStorage.getItem("usuario_data_key"); // Usar clave consistente
    if (storedUsuario) {
        try {
            usuario = JSON.parse(storedUsuario);
        } catch (e) {
            console.error("Error al parsear usuario de localStorage, reiniciando:", e);
            usuario = new Usuario();
            localStorage.removeItem("usuario_data_key"); // Limpiar datos corruptos
        }
    } else {
        usuario = new Usuario();
    }
    
    // hiddenPrivateInfo3 ya se obtuvo al inicio de DOMContentLoaded
    console.log("usuario.js: hiddenPrivateInfo3 antes de llamar a mostrarCampos y escucharCambiosEnCampos (DOMContentLoaded):", typeof hiddenPrivateInfo3, hiddenPrivateInfo3);
    mostrarCampos(usuario, hiddenPrivateInfo3); // Usar mostrarCampos importada
    escucharCambiosEnCampos(usuario); // Ya no se pasa hiddenPrivateInfo3
    
    console.log("Verificando estado de autenticación de Firebase...");
    // Listener del estado de autenticación de Firebase (solo uno necesario)
    firebase.auth().onAuthStateChanged(function(user) {
        console.log("onAuthStateChanged: Estado de autenticación cambiado.");
        if (user) {
            console.log("Usuario autenticado:", user.uid);
            profile.hidden = false; // Mostrar perfil
      
            recuperarDatos(user); // Recuperar y mostrar datos del usuario

            // Ya no se llama a volver() aquí. La redirección se maneja solo después de un login exitoso.
        } else {
            console.log("Usuario no autenticado.");
            hideProfile(); // Ocultar sección de perfil, mostrar login
        }
    });

    // La llamada a loadGoogleMapsScript ya está en window.onload, no duplicar aquí.
    // window.onload = loadGoogleMapsScript; // Esto ya está en la parte inferior del script.
}); // Fin de DOMContentLoaded

// Llama a la función para cargar el script de Google Maps cuando la página esté lista
window.onload = loadMap// Función para mostrar/ocultar secciones de perfil/login
function showProfile(user) {
    console.log("showProfile: Usuario logeado. Mostrando perfil.");
    if (profile) profile.style.display = 'block'; // Usar 'block' o 'flex' según tu CSS
    if (login) login.style.display = 'none';

 

    // Crear/actualizar documento de usuario en Firestore
    db.collection("usuarios").doc(user.uid).set({
        activo: true,
        nombre: user.displayName || "", // Usar displayName de Firebase si existe
        rol: "usuario",
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        telefono: user.phoneNumber || "", // Usar phoneNumber de Firebase si existe
        photoURL: user.photoURL || ""
    }, { merge: true }) // merge: true para no sobrescribir datos existentes
    .then(() => {
        console.log("Documento de usuario creado/actualizado en Firestore.");
        // Después de crear/actualizar el documento, recuperamos los datos para poblar el formulario
        recuperarDatos(user); // Esto ahora actualizará el 'usuario' global y re-renderizará
    })
    .catch((error) => {
        console.error("Error al crear/actualizar documento de usuario en Firestore: ", error);
        elError("Error al guardar tus datos de perfil.");
    });
}

// Función para recuperar datos del usuario desde Firestore y poblar el formulario
function recuperarDatos(user) {
    console.log("recuperarDatos: Buscando datos del usuario en Firestore...");
    if (profile) profile.style.display = 'block';
    if (login) login.style.display = 'none';

    
    // Obtener hiddenPrivateInfo3 aquí dentro de recuperarDatos
    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
    if (!hiddenPrivateInfo3) {
        console.error("Elemento 'hiddenPrivateInfo3' no encontrado en recuperarDatos. No se pueden mostrar los campos de usuario.");
        return;
    }

    db.doc('usuarios/' + user.uid).onSnapshot((doc) => {
        console.log("onSnapshot: Datos de usuario recibidos.");
        if (doc.exists && doc.data() !== undefined) {
            const userData = doc.data();
            localStorage.setItem('usuario', JSON.stringify(userData)); // Usar clave consistente

            // Actualizar el objeto 'usuario' GLOBAL con los datos de Firestore
            usuario.nombre = userData.nombre || '';
            usuario.direccion = userData.direccion || '';
            usuario.telefono = userData.telefono || '';
            usuario.email = userData.email || '';
            usuario.dni = userData.dni || '';
            usuario.envioGratis = userData.envioGratis || false;
            usuario.lat = userData.lat || null;
            usuario.lon = userData.lon || null;
            usuario.minimoEnvioGratis = userData.minimoEnvioGratis || 0;
            usuario.referencia = userData.referencia || '';
            usuario.rol = userData.rol || 'usuario';
            usuario.saldo = userData.saldo || 0;
            
            // Actualizar elementos de la UI fuera del formulario dinámico si existen
            if (document.getElementById('username')) document.getElementById('username').textContent = userData.displayName || userData.nombre || 'Usuario';
            if (document.getElementById('email')) document.getElementById('email').textContent = userData.email || '';
            if (document.getElementById('photo')) document.getElementById('photo').src = userData.photoURL || 'https://placehold.co/100x100/cccccc/333333?text=Foto';

            console.log("Objeto usuario global actualizado desde Firestore:", usuario);

            // Llamar a mostrarCampos para re-renderizar el formulario con el 'usuario' global actualizado
            console.log("usuario.js: hiddenPrivateInfo3 antes de llamar a mostrarCampos y escucharCambiosEnCampos (recuperarDatos):", typeof hiddenPrivateInfo3, hiddenPrivateInfo3);
            mostrarCampos(usuario, hiddenPrivateInfo3); // Usar la función importada directamente
            escucharCambiosEnCampos(usuario); // Ya no se pasa hiddenPrivateInfo3

        } else {
            console.warn("Documento de usuario no encontrado en Firestore para UID:", user.uid);
            // Si no hay documento, asegurar que el 'usuario' global se reinicie o esté vacío y re-renderizar
            usuario = new Usuario(); // Reiniciar a valores por defecto
            console.log("usuario.js: hiddenPrivateInfo3 antes de llamar a mostrarCampos y escucharCambiosEnCampos (recuperarDatos - no doc):", typeof hiddenPrivateInfo3, hiddenPrivateInfo3);
            mostrarCampos(usuario, hiddenPrivateInfo3);
            escucharCambiosEnCampos(usuario); // Ya no se pasa hiddenPrivateInfo3
            if (document.getElementById('username')) document.getElementById('username').textContent = user.displayName || 'Usuario';
            if (document.getElementById('email')) document.getElementById('email').textContent = user.email || '';
            if (document.getElementById('photo')) document.getElementById('photo').src = user.photoURL || 'https://placehold.co/100x100/cccccc/333333?text=Foto';
        }

        if(!usuario.direccion.trim() || !usuario.nombre.trim() || !usuario.referencia.trim()) {
             volver(); // Llama a volver() después de que los datos del usuario se hayan cargado/actualizado

        }

        volver(); // Llama a volver() después de que los datos del usuario se hayan cargado/actualizado
    }, (error) => {
        console.error("Error al obtener datos del usuario en tiempo real: ", error);
        elError("Error al cargar tus datos de perfil.");
    });
}

// Función para volver a la página anterior (si hay un parámetro 'volver' en la URL)
function volver() {
    console.log("volver: Intentando redirigir...");
    const paginaVolver = extraerParametros(window.location.href).volver;
    if (paginaVolver !== undefined) {
        // Si el parámetro es 'carrito', redirige a carrito.html
        if (paginaVolver === 'carrito') {
            window.location.href = 'carrito.html';
        } else {
            window.location.href = paginaVolver;
        }
    } else {
        console.log("No se encontró parámetro 'volver' en la URL.");
    }
}

// Función para mostrar errores al usuario
function elError(e) {
    var errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.innerHTML = e.message || e;
        errorElement.style.color = 'red';
    } else {
        console.error("Elemento de error no encontrado en el DOM. Error: ", e);
    }
}

// Función para ocultar la sección de perfil y mostrar la de login
function hideProfile() {
    console.log("hideProfile: Ocultando perfil, mostrando login.");
    if (profile) profile.style.display = 'none';
    if (login) login.style.display = 'block';
}

// Event listener para el botón 'editar' del perfil
if (editar) {
    editar.addEventListener('click', function() {
        console.log("Botón 'editar' clicado.");
        var user = firebase.auth().currentUser;
        if (!user) {
            console.warn("No hay usuario logeado para editar el perfil.");
            elError("No hay usuario logeado para editar el perfil.");
            return;
        }
        
        // Obtener hiddenPrivateInfo3 aquí para el listener del botón editar
        const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
        if (!hiddenPrivateInfo3) {
            console.error("Elemento 'hiddenPrivateInfo3' no encontrado en el listener de 'editar'.");
            elError("Error interno: No se pudo acceder al formulario de perfil.");
            return;
        }





        
        // Obtener los elementos de los campos de entrada y error
             
        const campoDireccion = document.getElementById('addressInput');
        const campoReferencia = hiddenPrivateInfo3.querySelector('#referencia');
        const campoNombre = hiddenPrivateInfo3.querySelector('#nombre');

        // --- VALIDACIÓN DE CAMPOS DEL FORMULARIO (al enviar) ---
        let isValidForm = true;
  

        // Validación de Nombre
        if (!campoNombre) {
            console.error("Elemento 'nombre' no encontrado para validación en 'editar'.");
            isValidForm = false;
        } else if (campoNombre.value.trim().length === 0) {
            console.error("Error: El nombre no puede estar vacío.");
            campoNombre.setCustomValidity('El nombre no puede estar vacío.');
            campoNombre.classList.add('is-invalid');
            campoNombre.classList.remove('is-valid');
            isValidForm = false;
               showMessage('Por favor, ingresa un nombre.', "error", messageBox2);
                return; // Detiene la ejecución si no hay dirección
        } else {
            campoNombre.setCustomValidity('');
            campoNombre.classList.remove('is-invalid');
            campoNombre.classList.add('is-valid');
        }

        // Validación de Dirección


                const messageBox = document.getElementById('messageBox2'); // Referencia al nuevo contenedor de mensajes

              const address = campoDireccion.value.trim(); // Elimina espacios en blanco al inicio/final

            if (!address) {
                showMessage('Por favor, ingresa una dirección para enviar el pedido.', "error", messageBox2);
                return; // Detiene la ejecución si no hay dirección
            }


        if (!campoDireccion) {
            console.error("Elemento 'direccion' no encontrado para validación en 'editar'.");
            isValidForm = false;
        } else if (campoDireccion.value.trim().length === 0) {
            console.error("Error: La dirección no puede estar vacía.");
            campoDireccion.setCustomValidity('La dirección no puede estar vacía.');
            campoDireccion.classList.add('is-invalid');
            campoDireccion.classList.remove('is-valid');
            isValidForm = false;
        } else {
            campoDireccion.setCustomValidity('');
            campoDireccion.classList.remove('is-invalid');
            campoDireccion.classList.add('is-valid');
        }
        // Puedes añadir más validaciones para 'referencia' si es 'required'
        if (!campoReferencia) {
            console.error("Elemento 'referencia' no encontrado para validación en 'editar'.");
            isValidForm = false;
               
        } else if (campoReferencia.value.trim().length === 0) {
            console.error("Error: La referencia no puede estar vacía.");
            campoReferencia.setCustomValidity('La referencia no puede estar vacía.');
            campoReferencia.classList.add('is-invalid');
            campoReferencia.classList.remove('is-valid');
            isValidForm = false;
                showMessage('Por favor, ingresa una referencia, para encontrar mas fácil tu dirección.', "error", messageBox2);
                return; // Detiene la ejecución si no hay dirección
        } else {
            campoReferencia.setCustomValidity('');
            campoReferencia.classList.remove('is-invalid');
            campoReferencia.classList.add('is-valid');
        }

        if (!isValidForm) {
            console.warn("Validación de formulario fallida al editar. Deteniendo guardado.");
            // Forzar la validación de todo el formulario al enviar
            if (purchaseForm) purchaseForm.reportValidity(); // Asegurarse de que purchaseForm exista
            return; 
        }
        // --- FIN DE LA VALIDACIÓN ---


        console.log("Usuario actual (antes de guardar):", usuario);
        // Actualizar el objeto 'usuario' global desde los inputs del formulario antes de guardar
        // NOTA: Los listeners 'input' en funciones.js ya deberían haber actualizado 'usuario'
        // pero re-asignar aquí asegura que se tomen los valores finales del DOM al momento del clic.
        usuario.nombre = campoNombre.value.trim();
        usuario.direccion = campoDireccion.value.trim();
        usuario.referencia = campoReferencia.value.trim();

        console.log("Usuario actualizado (antes de guardar):", usuario.telefono);

        
        db.collection("usuarios").doc(user.uid).set(
            {
                nombre: usuario.nombre,
                direccion: usuario.direccion,
                referencia: usuario.referencia,
                telefono: usuario.telefono,
                lat: usuario.lat,
                lon: usuario.lon,
            }, { merge: true }
        ).then(() => {
            console.log("Documento de usuario actualizado exitosamente!");
            alert("Perfil actualizado correctamente.");
             editar.style.display = 'none'; 
        })
        .catch((error) => {
            console.error("Error al actualizar el documento: ", error);
            elError("Error al guardar los cambios en tu perfil.");
        });
    });
}

// Event listener para el botón 'logout'
if (logout) {
    logout.addEventListener('click', function() {
        firebase.auth().signOut().then(function() {
            console.log("Sesión cerrada exitosamente.");
            hideProfile();
            alert("Sesión cerrada correctamente.");
            // Limpiar datos de usuario del almacenamiento local si es necesario
            localStorage.removeItem('usuario_data_key'); // Usar clave consistente
            // Re-renderizar campos con valores vacíos después de cerrar sesión
            usuario = new Usuario(); // Reiniciar el objeto de usuario global
            // Obtener hiddenPrivateInfo3 aquí para el logout
            const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
            if (hiddenPrivateInfo3) {
                mostrarCampos(usuario, hiddenPrivateInfo3); // Usar la función importada directamente
                escucharCambiosEnCampos(usuario); // Ya no se pasa hiddenPrivateInfo3
            }
        }).catch(function(error) {
            console.error("Error al cerrar sesión: ", error);
            elError(error);
        });
    });
}


/*********** phone authentication ***********/

// Event listener para el botón de enviar número de teléfono
if (numberButton) {
    numberButton.addEventListener('click', function() {
        var number = "+549" + document.getElementById('number').value.trim();
        console.log("Intentando enviar código a:", number);

        if (!document.getElementById('recaptcha-container')) {
            console.error("Elemento 'recaptcha-container' no encontrado en el HTML. Necesario para la verificación telefónica.");
            elError("Error: Falta el elemento reCAPTCHA. No se puede iniciar la verificación.");
            return;
        }

        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log("reCAPTCHA resuelto automáticamente.");
            },
            'expired-callback': () => {
                elError("reCAPTCHA expirado. Por favor, inténtalo de nuevo.");
                window.recaptchaVerifier.render().then(function(widgetId) {
                    grecaptcha.reset(widgetId);
                });
            }
        });
        var appVerifier = window.recaptchaVerifier;
        
        firebase.auth().signInWithPhoneNumber(number, appVerifier)
            .then(function (confirmationResult) {
                console.log("Código de verificación enviado. Resultado de confirmación:", confirmationResult);
                window.confirmationResult = confirmationResult;
                // --- Aquí se considera que el mensaje fue enviado ---
                // Mostrar campos y mensaje, ocultar botón
                const codeInput = document.getElementById('code');
                const codeLabel = document.querySelector('label[for=\"code\"]');
                const validateBtn = document.getElementById('validate');
                let codeMsg = document.getElementById('codeMsg');
                const numberButton = document.getElementById('numberButton');
                // Selecciona el div por su id
                const section = document.getElementById('code-section');
                // Quita el atributo hidden para mostrarlo
                 if (section) section.hidden = false; // Asegurarse de que section exista

                if (codeMsg) {
                    codeMsg.textContent = 'Te hemos enviado un código a tu celular. Por favor revisa tus mensajes, busca el código e introdúcelo aquí:';
                    codeMsg.style.display = '';
                }
                 if (loadingBar) loadingBar.hidden = true; // Asegurarse de que loadingBar exista
                if (codeInput) codeInput.style.display = '';
                if (codeLabel) codeLabel.style.display = '';
                if (validateBtn) validateBtn.style.display = '';
                if (numberButton) numberButton.style.display = 'none';
            }).catch(function (error) {
                console.error("Error al enviar SMS de verificación: ", error);
                elError("Error al enviar el código: " + error.message);
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.render().then(function(widgetId) {
                        grecaptcha.reset(widgetId);
                    });
                }
            });
    });
}

// Event listener para el botón de validar código
if (validateButton) {
    validateButton.addEventListener('click', function() {
        var code = document.getElementById('code').value.trim();
        console.log("Intentando validar código:", code);
        
        if (!window.confirmationResult) {
            elError("No se ha enviado ningún código de verificación. Por favor, envía tu número primero.");
            return;
        }

        window.confirmationResult.confirm(code)
            .then(function (result) {
                console.log("Usuario logeado correctamente con teléfono.");
                var user = result.user;
                if (result.additionalUserInfo.isNewUser) {
                    console.log("Es un usuario nuevo.");
                    showProfile(user);
                    volver(); // Llama a volver() solo después de un inicio de sesión exitoso
                } else {
                    console.log("Es un usuario ya registrado.");
                    recuperarDatos(user); // Esto ya llama a volver() dentro
                  
                }
                alert("¡Sesión iniciada con éxito!");
                
            }).catch(function (error) {
                console.error("Error al validar el código: ", error);
                elError("Código de verificación incorrecto o expirado. Inténtalo de nuevo.");
            });
    });
}

// Al cargar, oculta el input y botón de código de verificación
document.addEventListener('DOMContentLoaded', function() {
    // Oculta el input y botón de código al cargar
    const codeInput = document.getElementById('code');
    const codeLabel = document.querySelector('label[for="code"]');
    const validateBtn = document.getElementById('validate');
    let codeMsg = document.getElementById('codeMsg');
    if (!codeMsg) {
        codeMsg = document.createElement('div');
        codeMsg.id = 'codeMsg';
        codeMsg.className = 'text-blue-600 text-sm mt-2';
        if (codeLabel && codeLabel.parentNode) {
            codeLabel.parentNode.insertBefore(codeMsg, codeLabel.nextSibling);
        }
    }
    codeMsg.style.display = 'none';
    if (codeInput) codeInput.style.display = 'none';
    if (codeLabel) codeLabel.style.display = 'none';
    if (validateBtn) validateBtn.style.display = 'none';

    // Mostrar cuando se envía el código
    const numberButton = document.getElementById('numberButton');
    if (numberButton) {
        numberButton.addEventListener('click', function() {
            // Mostrar mensaje "Enviando código..." inmediatamente
            let codeMsg = document.getElementById('codeMsg');
            if (!codeMsg) {
                codeMsg = document.createElement('div');
                codeMsg.id = 'codeMsg';
                codeMsg.className = 'text-blue-600 text-sm mt-2';
                const codeLabel = document.querySelector('label[for=\"code\"]');
                if (codeLabel && codeLabel.parentNode) {
                    codeLabel.parentNode.insertBefore(codeMsg, codeLabel.nextSibling);
                }
            }
            //codeMsg.textContent = 'Enviando código...';
                 
                // Quita el atributo hidden para mostrarlo
                 if (loadingBar) loadingBar.hidden = false; // Asegurarse de que loadingBar exista


            codeMsg.style.display = '';
            // Deshabilitar el input de número
            const numberInput = document.getElementById('number');
            if (numberInput) numberInput.setAttribute('disabled', 'disabled');
            numberButton.style.display = 'none'; // Oculta el botón "Enviar Código"
        });
    }
});



  // Obtener referencias a los elementos del DOM
        const addressInput = document.getElementById('addressInput');
      
        const searchButton = document.getElementById('searchButton');
        const googleMapIframe = document.getElementById('googleMapIframe');
        const messageBox = document.getElementById('messageBox'); // Referencia al nuevo contenedor de mensajes

        // Función para mostrar mensajes al usuario
        function showMessage(message, type = 'error', messageBox) {
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
            console.log("Cargando mapa con dirección:", addressInput.value.trim());
            address= addressInput.value.trim(); // Elimina espacios en blanco al inicio/final
            

            hideMessage(); // Oculta cualquier mensaje anterior

            if(address == "urquiza y sarmiento, gualeguaychu entre rios"){
                addressInput.value = ""
            }

            

    
            
       

                  
            if (!address) {
                showMessage('Por favor, ingresa una dirección para buscar.', "error", messageBox    );
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
           // Añadir el evento click al botón
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                            editar.style.display = 'block'; // Mostrar botón al cambiar
                // Limpiar el campo de referencia SOLO cuando se hace clic en el searchButton
                const campoReferencia = document.getElementById('referencia');
                console.log("referencia", campoReferencia);
                if (campoReferencia) {
                    campoReferencia.value = '';
                    console.log("Campo 'referencia' limpiado por clic en searchButton.");
                }else {
                    console.error("Elemento 'referencia' no encontrado al limpiar por clic en searchButton.");
                }
                loadMap(); // Luego, carga el mapa
            });
        }

        // Opcional: Cargar el mapa al presionar Enter en el campo de texto
        addressInput.addEventListener('keypress', (event) => {
                                        editar.style.display = 'block'; // Mostrar botón al cambiar
                const campoReferencia = document.getElementById('referencia');

            campoReferencia.value = ""; // Limpia el campo de referencia al cargar el mapa
            if (event.key === 'Enter') {
               
                console.log("Enter presionado en addressInput, cargando mapa...", address);
                loadMap();
            }
        });

        // Cargar un mapa predeterminado al iniciar la página (opcional)
        window.onload = () => {


            if(usuario.direccion) {
                console.log("direccuin encontrada")
                addressInput.value = usuario.direccion // Dirección predeterminada
                
            }else{
    
                console.log("direccuin no encontrada")
                addressInput.value = "urquiza y sarmiento, gualeguaychu entre rios" // Dirección predeterminada
        
          
            }
             
            loadMap(); // Cargar el mapa con la dirección inicial
        };
