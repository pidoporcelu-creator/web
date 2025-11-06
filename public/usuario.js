import { iniciarFirebase, extraerParametros, mostrarCampos, escucharCambiosEnCampos } from "./funciones.js"; // Importar getFirestoreDb, mostrarCampos, escucharCambiosEnCampos
import { Carrito, Score, Usuario, Comercio } from "./objetos.js"; // Asegúrate de que estas clases estén bien definidas en objetos.js

   // Inicializa Firebase App aquí, después de que el DOM esté listo
    iniciarFirebase(); 

    // Obtiene la instancia de Firestore después de inicializar Firebase
     const db = firebase.firestore();

// --- Variables Globales y Elementos del DOM ---
// Asegúrate de que estos elementos existan en tu HTML
var profile = document.getElementById('profile');
var login = document.getElementById('login');
const fragment = document.createDocumentFragment();

// Referencias a elementos de autenticación telefónica
var numberButton = document.getElementById('numberButton');
var validateButton = document.getElementById('validate');

// Referencias maps

let address = ""

 //Barra de carga: Enviando
 const loadingBar = document.getElementById('loading-bar');

// --- Instancias Globales ---
let usuario = new Usuario(); // Instancia global de Usuario
let carrito = new Carrito(); // Instancia global de Carrito

// --- Referencias a elementos del DOM (obtenidos en DOMContentLoaded) ---
let purchaseForm, btnEnviar, editar, logout, googleSignInButton, linkGoogleButton, showAlternativeLogin;

// Ocultar la sección de login/perfil al inicio hasta que se determine el estado
if (login) login.style.display = 'none';
if (profile) profile.style.display = 'none';


/*********** general functions ***********/

// Evento DOMContentLoaded: Se dispara cuando el documento HTML ha sido completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', async e => {
    console.log("DOMContentLoaded: Iniciado.");

    // --- Obtener elementos del DOM después de que se carguen ---
    purchaseForm = document.getElementById('formulario1');
    btnEnviar = document.getElementById('btnEnviar');
    editar = document.getElementById('editar');
    logout = document.getElementById('logout');
    googleSignInButton = document.getElementById('googleSignInButton');
    linkGoogleButton = document.getElementById('linkGoogleAccount');
    showAlternativeLogin = document.getElementById('show-alternative-login');
 
    // ✅ CORRECCIÓN: Mover la lógica del event listener aquí dentro.
    // Ahora se ejecuta después de que 'linkGoogleButton' ha sido asignado.
    if (linkGoogleButton) {
        linkGoogleButton.addEventListener('click', () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Debes estar logueado para vincular una cuenta.");
                return;
            }

            const provider = new firebase.auth.GoogleAuthProvider();

            user.linkWithPopup(provider).then((result) => {
                const linkedUser = result.user;
                console.log("¡Cuenta de Google vinculada con éxito!", linkedUser);
                checkGoogleLinkStatus(linkedUser); // Actualizar la UI
                alert("¡Tu cuenta de Google ha sido vinculada! Ahora puedes usarla para iniciar sesión.");
            }).catch((error) => {
                console.error("Error al vincular la cuenta de Google:", error);
                alert(`Error al vincular la cuenta: ${error.message}`);
            });
        });
    }

    // ✅ NUEVA LÓGICA: Añadir funcionalidad al botón de Iniciar Sesión con Google
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    console.log("Inicio de sesión con Google exitoso para:", user.displayName);
                    // onAuthStateChanged se encargará de mostrar el perfil.
                    alert(`¡Bienvenido de nuevo, ${user.displayName}!`);
                })
                .catch((error) => {
                    console.error("Error en el inicio de sesión con Google:", error);
                    // Manejar errores comunes, como una cuenta que ya existe con otro método.
                    const errorMessage = error.code === 'auth/account-exists-with-different-credential'
                        ? 'Ya existe una cuenta con este correo. Intenta iniciar sesión con el método original.'
                        : `Error: ${error.message}`;
                    elError(errorMessage);
                });
        });
    }

    // ✅ NUEVA LÓGICA: Mostrar el botón de login de Google al hacer clic en el enlace.
    if (showAlternativeLogin) {
        showAlternativeLogin.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que el enlace recargue la página
            const googleContainer = document.getElementById('google-login-container');
            const separator = document.getElementById('separator-container');
            if (googleContainer && separator) {
                googleContainer.classList.remove('hidden');
                separator.classList.remove('hidden');
                showAlternativeLogin.style.display = 'none'; // Ocultar el enlace una vez mostrado
            }
        });
    }

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
            showProfile(user); // Llama a showProfile para configurar la UI y los listeners
      
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

// Llama a la función para cargar el script de Google Maps cuando la página esté lista.
window.onload = loadMap;

// Función para mostrar/ocultar secciones de perfil/login
function showProfile(user) {
    console.log("showProfile: Usuario logeado. Mostrando perfil.");

    const userRef = db.collection("usuarios").doc(user.uid);

    userRef.get().then((doc) => {
        let dataToSet;
        if (doc.exists) {
            // Si el usuario ya existe, solo actualizamos los datos que pueden cambiar al iniciar sesión.
            // NO incluimos el 'rol' para no sobrescribirlo.
            dataToSet = {
                activo: true,
                nombre: user.displayName || doc.data().nombre || "",
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                telefono: user.phoneNumber || doc.data().telefono || "",
                photoURL: user.photoURL || ""
            };
        } else {
            // Si el usuario es nuevo, creamos el documento con el rol por defecto 'usuario'.
            dataToSet = {
                activo: true,
                nombre: user.displayName || "",
                rol: "usuario", // El rol solo se establece en la creación.
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                telefono: user.phoneNumber || "",
                photoURL: user.photoURL || ""
            };
        }
        // Usamos set con merge:true para crear o actualizar de forma segura.
        return userRef.set(dataToSet, { merge: true });
    }).then(() => {
        console.log("Documento de usuario asegurado en Firestore.");
        recuperarDatos(user); // Siempre recuperamos los datos después de asegurar el documento.
    }).catch(error => {
        console.error("Error al asegurar el documento de usuario:", error);
        elError("Error al guardar los datos de tu perfil.");
    });

    if (profile) profile.style.display = 'block'; // Usar 'block' o 'flex' según tu CSS
    if (login) login.style.display = 'none';

    // --- ASIGNACIÓN DE EVENT LISTENERS PARA ELEMENTOS DEL PERFIL ---
    // Se hace aquí porque ahora sabemos que la sección #profile es visible.

    const botonBorrar = document.getElementById('borrarDatos');
    if (botonBorrar) {
        botonBorrar.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar todos los datos locales de la aplicación? Esta acción no se puede deshacer.')) {
                localStorage.clear();
                alert('¡Los datos locales han sido vaciados!');
                window.location.reload();
            }
        });
    }

    const accesoVendedores = document.getElementById('accesoVendedores');
    if (accesoVendedores) {
        accesoVendedores.addEventListener('click', () => {
            window.location.href = "vendedores.html";
        });
    }

    if (logout) {
        logout.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                console.log("Sesión cerrada exitosamente.");
                hideProfile();
                alert("Sesión cerrada correctamente.");
                localStorage.removeItem('usuario');
            }).catch(error => elError(error));
        });
    }
    setupEditButtonListener();
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
            
            // ✅ NUEVO: Lógica para mostrar el botón de cadetería según el rol.

            console.log("recuperarDatos: Verificando rol para acceso a cadetería:", usuario.rol);
            const accesoCadeteriaBtn = document.getElementById('accesoCadeteria');
            if (accesoCadeteriaBtn) {
                if (usuario.rol === 'cadeteria') {
                    accesoCadeteriaBtn.style.display = 'block'; // Mostrar el botón
                    accesoCadeteriaBtn.onclick = () => {
                        window.location.href = 'cadeteria.html';
                    };
                } else {
                    accesoCadeteriaBtn.style.display = 'none'; // Ocultar el botón
                }
            }

            // Actualizar elementos de la UI fuera del formulario dinámico si existen
            if (document.getElementById('username')) document.getElementById('username').textContent = userData.displayName || userData.nombre || 'Usuario';
            if (document.getElementById('email')) document.getElementById('email').textContent = userData.email || '';
            if (document.getElementById('photo')) document.getElementById('photo').src = userData.photoURL || 'https://placehold.co/100x100/cccccc/333333?text=Foto';

            
            checkGoogleLinkStatus(user);
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
    // ✅ CORRECCIÓN: Solo redirigir si el usuario está autenticado.
    // Si no hay usuario, no hacemos nada para permitir que se muestre el formulario de login.
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("volver: Usuario no autenticado, no se redirige para permitir login.");
        return;
    }

    console.log("volver: Intentando redirigir...");
    const paginaVolver = extraerParametros(window.location.href).volver;
    const comercio = extraerParametros(window.location.href).comercio;
    if (paginaVolver !== undefined) {
        // Si el parámetro es 'carrito', redirige a carrito.html
        if (paginaVolver === 'carrito') {
            window.location.href = `carrito.html?comercio=${encodeURIComponent(comercio)}`;
        } else {
            window.location.href = `${paginaVolver}?comercio=${encodeURIComponent(comercio)}`;
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
function setupEditButtonListener() {
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

        // ✅ NUEVO: Añadir un listener para ocultar el mensaje de error al empezar a escribir.
        if (campoReferencia) {
            campoReferencia.addEventListener('input', () => {
                const messageBox2 = document.getElementById('messageBox2');
                if (messageBox2 && messageBox2.style.display !== 'none') {
                    messageBox2.style.display = 'none';
                }
            }, { once: true }); // { once: true } hace que el listener se ejecute solo una vez.
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
}

// ✅ NUEVA FUNCIÓN: Comprueba si una cuenta de Google ya está vinculada.
function checkGoogleLinkStatus(user) {
    const linkButton = document.getElementById('linkGoogleAccount');
    const linkedMessage = document.getElementById('googleLinkedMessage');
    const recoveryOptions = document.getElementById('recovery-options');

    if (!linkButton || !linkedMessage || !recoveryOptions) return;

    // Comprobar si el proveedor de Google ya está vinculado a la cuenta del usuario
    const isGoogleLinked = user.providerData.some(provider => provider.providerId === 'google.com');

    if (isGoogleLinked) {
        linkButton.style.display = 'none'; // Ocultar el botón de vincular
        linkedMessage.style.display = 'block'; // Mostrar el mensaje de que ya está vinculado
    } else {
        linkButton.style.display = 'flex'; // Mostrar el botón de vincular
        linkedMessage.style.display = 'none'; // Ocultar el mensaje
    }
    recoveryOptions.style.display = 'block'; // Asegurarse de que la sección de recuperación sea visible
}

/*********** phone authentication ***********/

// Event listener para el botón de enviar número de teléfono
if (numberButton) {
    // ✅ CORRECCIÓN: Crear el reCAPTCHA una sola vez, al cargar la página.
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
            // reCAPTCHA resuelto, signInWithPhoneNumber se llamará automáticamente.
            console.log("reCAPTCHA resuelto.");
        },
        'expired-callback': () => {
            // La respuesta del reCAPTCHA ha expirado.
            elError("El reCAPTCHA ha expirado. Por favor, inténtalo de nuevo.");
        }
    });
    // Renderizar el reCAPTCHA invisible inmediatamente para que esté listo.
    window.recaptchaVerifier.render();

    numberButton.addEventListener('click', function() {
        var number = "+549" + document.getElementById('number').value.trim();
        console.log("Intentando enviar código a:", number);

        // ✅ CORRECCIÓN: Reutilizar la instancia global del appVerifier.
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
                // En caso de error, reseteamos el reCAPTCHA para el siguiente intento.
                appVerifier.clear();
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
                     window.location.href = 'usuarioCreado.html'; // Redirigir a la página usuarioCreado solo después de un inicio de sesión exitoso
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
