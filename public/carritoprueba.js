import { pintarCarrito, iniciarFirebase, extraerParametros, verificarSiEstaAbiertoElComercio, calcularTotalesCarrito, getFirestoreDb, pintarFooter, aumentarDisminuir } from "./funciones.js"; // Importar pintarFooter y btnAumentarDisminuir
import { Carrito, Score, Usuario, Comercio } from "./objetos.js";

// iniciarFirebase(); // Will be called inside DOMContentLoaded

const cantidadDeProductos = document.getElementById("insignia");
const loginForm = document.getElementById('task-form-envio'); // Este parece ser el formulario del offcanvas
let categoria2 = document.getElementById('categorias');
let color2 = document.getElementById('colores');
let talle2 = document.getElementById('talles');
let marca2 = document.getElementById('marcas');
let todas2 = document.getElementById('todas');
const items = document.getElementById('items'); // Ahora apunta a la tabla principal
const offcanvasItems = document.getElementById('offcanvas-items'); // Nueva referencia para la tabla del offcanvas
const footer = document.getElementById('footer');
const footer2 = document.getElementById('footer2');
const descuentos = document.getElementById("descuentos");

// Declarar las variables de plantilla aquí, pero inicializarlas dentro de DOMContentLoaded
let templateFooter;
let templateFooter2;
let templateDescuentos;
let templateCarrito;

const fragment = document.createDocumentFragment();
const login = document.getElementById("login"); // This refers to the login section in usuario.html, not relevant here for direct display control.

let carrito = new Carrito(); // Assumed Carrito is a class
let comercioGlobal = null;
let bbddProductos = null;
let uid = null;

let idGuardado = "";
let vendedor = "";

let listaCupones = [];
let vendedorFicha = {};
let telefono = "";
let totalDescuentos = 0;

let abierto = false;
let inicio = true;

let nombreVendedor = "";
let direccionVendedor = "";
let vendedorCalle = "";
let vendedorDepartamento = "";
let vendedorDireccion = "";
let vendedorEntreCalles = "";
let vendedorNombre = "";
let vendedorNumero = "";
let vendedorReferencia = "";
let totalPeso = 0;

let total = 0;
let logeado = false; // Global variable for login status
let usuario = new Usuario();
let comercio = new Comercio();
let ultimaCompra = new Carrito();
var Score2 = new Score(0);

// Reference to the shipping info container in the offcanvas
const offcanvasUserInfo = document.getElementById('offcanvasUserInfo') || document.getElementById('hiddenPrivateInfo3'); // Correct ID from usuario.html update
const btnEnviar = document.getElementById('btnEnviar'); // Reference to the "Comprar" button

// Element for the "Iniciar Sesión" button (already exists in HTML)
const btnIniciarSesionContainer = document.getElementById('btnIniciarSesion');


// Eventos
// The DOMContentLoaded event is fired when the HTML document has been completely loaded and parsed
document.addEventListener('DOMContentLoaded', async e => {
    iniciarFirebase();
    // Verificar login y ejecutar toda la lógica solo si está logueado
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
        firebase.auth().onAuthStateChanged(async function(user) {
            if (!user) {
                window.location = "usuario.html?volver=carrito&comercio=YBuVH33YSNMYIlOgWpVRPEwXP2r2";
                return;
            }
            // --- Aquí va toda la lógica de pintado y carga del carrito ---

            // Inicializar las variables de plantilla aquí, dentro de DOMContentLoaded
            // Obtener las referencias directas a los elementos <template>
            const rawTemplateFooter = document.getElementById('template-footer');
            const rawTemplateFooter2 = document.getElementById('template-footer2');
            const rawTemplateDescuentos = document.getElementById('template-descuento');
            const rawTemplateCarrito = document.getElementById('template-carrito');

            // Asignar la propiedad .content (DocumentFragment) a las variables
            // Asegurarse de que el elemento existe antes de acceder a .content
            templateFooter = rawTemplateFooter ? rawTemplateFooter.content : null;
            templateFooter2 = rawTemplateFooter2 ? rawTemplateFooter2.content : null;
            templateDescuentos = rawTemplateDescuentos ? rawTemplateDescuentos.content : null;
            templateCarrito = rawTemplateCarrito ? rawTemplateCarrito.content : null;

            // Debugging: Verificar si las plantillas se cargaron correctamente


            // Initialize Firebase App here, after the DOM is ready
            iniciarFirebase(); 
            const db = getFirestoreDb(); // Get Firestore instance after Firebase is initialized


            // 1. Hide specific elements on this page (if applicable)
            const loginElement = document.getElementById('login'); // This refers to the login section in usuario.html
            if (loginElement) {
                loginElement.style.display = "none";
            }
            const descuentosElement = document.getElementById("descuentos");
            if (descuentosElement) {
                descuentosElement.style.display = "none";
            }

            // Explicitly hide elements that depend on login state initially
            if (offcanvasUserInfo) {
                offcanvasUserInfo.style.display = 'none';
            }
            if (btnEnviar) {
                btnEnviar.style.display = 'none';
            }
            // The btnIniciarSesionContainer should be visible by default if not logged in.
            // Its visibility is handled by the auth state listener.
            // No need to explicitly hide it here, as it will be handled by the auth state listener.


            //uid = "1QgN8gr4e9QfVXIuiEpzEReHXbu1"; // Fixed UID for testing, uncomment if using URL
            
            // 2. Extract the commerce UID from the URL
            const urlParams = extraerParametros(document.URL);
            uid = urlParams.comercio; // Assign to the global 'uid'

            if (!uid || uid.trim() === "") {
                console.error("DOMContentLoaded: Commerce UID not found or invalid in the URL.");
                alert("Error: Commerce not found or invalid in the address.");
                return; // Stop execution if no UID
            }
            console.log("Commerce UID from URL:", uid);
            

            // 3. Load the 'comercioGlobal' object (first from localStorage, then from Firebase)
            try {
                const storedComercioData = localStorage.getItem("comercio_data_key"); 
                
                if (storedComercioData) {
                    const parsedComercio = JSON.parse(storedComercioData);
                    if (parsedComercio && parsedComercio.uid === uid) {
                        comercioGlobal = parsedComercio;
                    } else {
                        localStorage.removeItem("comercio_data_key"); // Clear if no match
                        await buscarYGuardarComercio(uid); // Load from Firebase
                    }
                } else {
                    await buscarYGuardarComercio(uid); // Load from Firebase
                }
            } catch (error) {
                localStorage.removeItem("comercio_data_key"); 
                await buscarYGuardarComercio(uid); 
            }

            // Check if comercioGlobal loaded correctly after attempts
            if (!comercioGlobal || !comercioGlobal.uid) {
                alert("Could not load essential commerce information. Please check the URL or try again.");
                return; 
            }

            // 4. Load the complete product catalog 'bbddProductos'
            try {
                const docRefCatalogos = db.collection("catalogos").doc(uid); 
                bbddProductos = await docRefCatalogos.get(); 
                
                if (bbddProductos.exists) {
                    console.log("bbddProductos loaded successfully:", bbddProductos.data());
                } else {
                    bbddProductos = null; 
                    alert("Error: Could not load product catalog. Please try again later.");
                    // Do not return here if you want the cart to be painted empty in case of missing products
                }
            } catch (e) {
                bbddProductos = null; 
                alert("Error: Failed to connect to the product database. Please try again later.");
                // Do not return here
            }

            // 5. Load the 'carrito' state from localStorage
            try {
                const carritoGuardado = localStorage.getItem(comercioGlobal.uid); 
                if (carritoGuardado) {
                    const dataPlana = JSON.parse(carritoGuardado);
                    Object.assign(carrito, dataPlana); // Assign properties to the existing carrito object
                    if (!carrito.productos || typeof carrito.productos !== 'object') {
                        carrito.productos = {}; // Ensure products is an object
                    }
                } else {
                    // If no cart saved, ensure it's a clean instance
                    carrito = new Carrito(); 
                }
            } catch (e) {
                carrito = new Carrito(); // Reset cart if there's an error
            }

            // 6. Assign the commerce to the cart if not already assigned (crucial for saving)
            if (!carrito.comercio || carrito.comercio.uid !== comercioGlobal.uid) {
                console.log("Comercio global:", comercioGlobal);
                carrito.comercio = comercioGlobal.nombre;
                carrito.comercioNombre = comercioGlobal.nombre || "";
            }
            
            // 7. Call painting and business logic functions
            // Now bbddProductos and comercioGlobal are loaded and 'carrito' is in its final state.

// --- LÓGICA DE CUPÓN DE DESCUENTO ---
const btnAplicarCodigoDescuento = document.getElementById('btnAplicarCodigoDescuento');
const inputCodigoDescuento = document.getElementById('inputCodigoDescuento');
if (btnAplicarCodigoDescuento && inputCodigoDescuento) {
    btnAplicarCodigoDescuento.addEventListener('click', function(e) {
        e.preventDefault();
        const valorCupon = inputCodigoDescuento.value.trim();
        /*
        if (valorCupon) {
            console.log('Cupón ingresado:', valorCupon);
            let cuponEncontrado = null;
            if (comercioGlobal && comercioGlobal.cupones && typeof comercioGlobal.cupones === 'object') {
                for (const key in comercioGlobal.cupones) {
                    const cupon = comercioGlobal.cupones[key];
                    if (cupon.id === valorCupon) {
                        cuponEncontrado = cupon;
                        break;
                    }
                }
            }
            if (cuponEncontrado) {
                console.log('Cupón válido:', cuponEncontrado);
                // Si el cupón es de tipo "descuento", aplicar el descuento como porcentaje
                if (cuponEncontrado.tipo === "descuento") {
                    const totalOriginal = carrito.total;
                    // cantidad es el porcentaje (ej: 10 para 10%)
                    const porcentaje = parseFloat(cuponEncontrado.cantidad) || 0;
                  
                    carrito.descuentoAplicado = porcentaje;
                  
                    carrito.cuponAplicado = cuponEncontrado;
                    actualizarResumenCompra()
                    console.log(`Descuento aplicado:  (${porcentaje}%). Total original: $${totalOriginal}, total con descuento: $${carrito.total}`);
                }
            } else {
                console.log('Cupón no válido o no encontrado.');
            }
        } else {
            console.log('No se ingresó ningún cupón.');
        }
            */
    });
}
         


// Declaración global de pintarCarritoLocal para que esté disponible en todo el archivo


pintarCarritoLocal(); // Call the function to paint the cart



            // 8. Load the 'usuario' state from localStorage or create a new instance
            try {
                const usuarioGuardado = localStorage.getItem("usuario_data_key"); // Use a specific key for the user
                if (usuarioGuardado) {
                    const dataPlanaUsuario = JSON.parse(usuarioGuardado);
                    // Reconstruct the 'usuario' object as an instance of the clase Usuario
                    usuario = new Usuario(
                        dataPlanaUsuario.nombre,
                        dataPlanaUsuario.direccion,
                        dataPlanaUsuario.telefono,
                        dataPlanaUsuario.email,
                        dataPlanaUsuario.dni,
                        dataPlanaUsuario.envioGratis,
                        dataPlanaUsuario.lat,
                        dataPlanaUsuario.lon,
                        dataPlanaUsuario.minimoEnvioGratis,
                        dataPlanaUsuario.referencia,
                        dataPlanaUsuario.rol,
                        dataPlanaUsuario.saldo
                        // Pass all necessary properties for the constructor here
                    );
                } else {
                    usuario = new Usuario(); // Instantiate an empty user if no saved data
                }
            } catch (e) {
                usuario = new Usuario(); // Reset user if there's an error
            }
            
            // Execute other functions dependent on comercioGlobal, etc.
            if (comercioGlobal.horarioDeAtencion) { 
                console.log("Comercio horario de atención:", comercioGlobal.horarioDeAtencion);
                     abierto = verificarSiEstaAbiertoElComercio(comercioGlobal.horarioDeAtencion);
            } else {
                console.warn("No se pudo obtener el horario comercial.");
                abierto = false; // Default to closed if no schedule is available
       
            }

            //check if user is logged - MOVED INSIDE DOMContentLoaded
            if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
                firebase.auth().onAuthStateChanged(function(user) {
                    if (user) {
                         usuario = JSON.parse(localStorage.getItem("usuario"));
                        if(!usuario){
                            console.log("Usuario no encontrado en localStorage, creando nuevo usuario.");
                            usuario = new Usuario(); // Create a new user instance if not found
                        }
                     
                        usuario.telefono = user.phoneNumber || ""; // Ensure phone number is set from Firebase user
                        // Validar que usuario existe y tiene la propiedad 'direccion' antes de llamar a mostrarCampos
                        const usuarioSeguro = usuario && typeof usuario === 'object' ? usuario : { direccion: '' };
                        logeado = true; // Actualiza la variable global
                        // Mostrar campos de envío y ocultar botón de inicio de sesión
                     
                        
                        if (offcanvasUserInfo) {
                            offcanvasUserInfo.style.display = 'block';
                        }
                        // Verificar existencia antes de mostrar campos privados
                        const hiddenPrivateInfo3Element = document.getElementById('hiddenPrivateInfo3');
                        if (hiddenPrivateInfo3Element) {
                            console.log("usuario: ", usuarioSeguro);
                            mostrarCamposNoEditable(usuarioSeguro, hiddenPrivateInfo3Element);
                        } else {
                            console.warn("Elemento hiddenPrivateInfo3 no encontrado.");
                        }

                        if (btnEnviar) {
                            btnEnviar.style.display = 'block';
                        }
                        // Ocultar el botón "Iniciar Sesión" si el usuario está logueado
                        if (btnIniciarSesionContainer) {
                            btnIniciarSesionContainer.style.display = 'none'; 
                        }
                    } else {

                        window.location = "usuario.html?volver=carrito&comercio=YBuVH33YSNMYIlOgWpVRPEwXP2r2";

                        // logeado = false; // Actualiza la variable global
                        // // Ocultar campos de envío y mostrar botón de inicio de sesión
                        // if (offcanvasUserInfo) {
                        //     offcanvasUserInfo.style.display = 'none';
                        // }
                        // if (btnEnviar) {
    //     btnEnviar.style.display = 'none';
    // }
    // // Mostrar el botón "Iniciar Sesión" si el usuario NO está logueado
    // if (btnIniciarSesionContainer) {
    //     btnIniciarSesionContainer.style.display = 'block';
    //     btnIniciarSesionContainer.onclick = () => {
    //         window.location = "usuario.html?volver=carrito";
    //     };
    // }
                    }
                });
            } else {
                // Asegúrate de que el botón de iniciar sesión esté visible si Firebase Auth no está listo
                if (btnIniciarSesionContainer) {
                    btnIniciarSesionContainer.style.display = 'block';
                    btnIniciarSesionContainer.onclick = () => {
                        window.location = "usuario.html?volver=carrito&comercio=YBuVH33YSNMYIlOgWpVRPEwXP2r2";
                    };
                }
                if (offcanvasUserInfo) {
        offcanvasUserInfo.style.display = 'none';
    }
    if (btnEnviar) {
        btnEnviar.style.display = 'none';
    }
}


// Verificar si el usuario está logueado y redirigir si no lo está
if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location = "usuario.html?volver=carrito&comercio=YBuVH33YSNMYIlOgWpVRPEwXP2r2";
        }
    });
}

// Seleccionar el criterio guardado en carrito.criterio, o el default si no existe
let criterioSeleccionado = carrito.criterio || 'criterioPidoporcelu';
const radio = document.getElementById(criterioSeleccionado);
if (radio) {
    radio.checked = true;
}

// Guardar el criterio seleccionado en carrito y actualizar descriptionArea
const radiosCriterio = document.querySelectorAll('input[name="substitution"]');
const descriptionArea = document.getElementById('descriptionArea');
const descriptionTitle = document.getElementById('descriptionTitle');
const descriptionText = document.getElementById('descriptionText');
const descripciones = {
    criterioPidoporcelu: {
        title: "Criterio pidoporcelu.com",
        text: "Si un artículo de tu pedido no está disponible, lo reemplazaremos por la mejor alternativa, asegurando siempre la misma o superior calidad y la cantidad original."
    },
    llamado: {
        title: "Llamado",
        text: "Te llamaremos para consultarte antes de realizar cualquier sustitución en tu pedido."
    },
    noSustituir: {
        title: "No Sustituir",
        text: "No realizaremos ninguna sustitución. Si un producto no está disponible, será eliminado del pedido y no se cobrará."
    }
};
radiosCriterio.forEach(radio => {
    radio.addEventListener('change', function() {
        carrito.criterio = this.id;
        localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito));
        // Actualizar descriptionArea
        if (descriptionArea && descriptionTitle && descriptionText && descripciones[this.id]) {
            descriptionTitle.textContent = descripciones[this.id].title;
            descriptionText.textContent = descripciones[this.id].text;
        }
    });
});

// Al cargar la página, actualizar descriptionArea según el criterio guardado
if (descriptionArea && descriptionTitle && descriptionText && descripciones[criterioSeleccionado]) {
    descriptionTitle.textContent = descripciones[criterioSeleccionado].title;
    descriptionText.textContent = descripciones[criterioSeleccionado].text;
}

// Agrego sección resumen en el div resumenCompra
const resumenDiv = document.getElementById('resumenCompra');
 console.log("carrito total.........................: ", carrito.total, carrito.cantidad);
if (resumenDiv) {
    resumenDiv.innerHTML = '';
    const resumenSection = document.createElement('div');
    resumenSection.className = "max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg mt-4 mb-4";
    resumenSection.innerHTML = `
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Resumen de compra</h2>
         
        <div class="flex flex-col gap-2">
            <div><span class="font-medium">Total:</span> ${carrito.total ? carrito.total.toFixed(0) : '0.00'}</div>
            <div><span class="font-medium">Productos:</span> ${carrito.cantidad || 0}</div>
            <div><span class="font-medium">Envío:</span> a cargo del comprador</div>
        </div>
        <br>
        <button id="btnVerCarrito" class="btn btn-primary bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
        Ver carrito
    </button>
    `;
    resumenDiv.appendChild(resumenSection);
}

});
    }

setupMercadoPago();

    
});

items.addEventListener('click', e => { btnAumentarDisminuir(e) });





function init() {
const telefono = vendedorFicha.telefono;

if (telefono > 0) {
    let a = createA("https://api.whatsapp.com/send?phone=+54"+telefono+"&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta", "whatsapp");
    document.body.appendChild(a);
} else {
    let a = createA("vendedores.html", "whatsapp");
    document.body.appendChild(a);
}
}

function createA(link, text) {
let a = document.createElement("a");
if (link) {
    a.setAttribute("href", link);
    a.setAttribute("class", "btn-wsp");
    a.setAttribute("id", "btn-wsp");
    a.setAttribute("target", "_blank");
}
if (text) {
    let icono = document.createElement("i");
    icono.setAttribute("class", "bi bi-whatsapp");
    a.appendChild(icono);
}
return a;
}


function filtrarDatos(data2) {
let categorias1 = [];
let marcas1 = [];

data2.forEach(item => {
   categorias1.push(item.data().categoria);
   marcas1.push(item.data().marca);
});

categorias1.sort();
marcas1.sort();

let filtro = "";
let filtro2 = "";

const categorias = new Set(categorias1);
const marcas = new Set(marcas1);

filtro = "categorias";
filtro2 = "categoria";
pintarFiltros(categorias, filtro, filtro2);

filtro = "marcas";
filtro2 = "marca";
pintarFiltros(marcas, filtro, filtro2);
}

function pintarFiltros(categorias, filtro, filtro2) {

categorias.forEach(item => {
    templateCategorias.querySelector('a').setAttribute('id', item);
    templateCategorias.querySelector('a').textContent = item;
    templateCategorias.querySelector('a').dataset.id = filtro2;
    templateCategorias.querySelector('li').setAttribute('class', filtro);
    templateCategorias.querySelector('li').setAttribute('id', "idFiltro"+filtro+item);

    const clone = templateCategorias.cloneNode(true);
    fragment.appendChild(clone);
});

document.getElementById(filtro).appendChild(fragment);

categoria2 = document.getElementById('categorias');
marca2 = document.getElementById('marcas');
todas2 = document.getElementById('todas');

categoria2.addEventListener('click', e => { filtroSeleccionado(e) });
marca2.addEventListener('click', e => { filtroSeleccionado(e) });
todas2.addEventListener('click', e => { filtroSeleccionado(e) });
}

const filtrar = buscador => {
let bbddProductosFiltrados = [];
let filtro = "";
let filtro2 = "";

bbddProductos.forEach(item => {
    if (item.data().title.toLowerCase().includes(buscador)) {
        bbddProductosFiltrados.push(item);
        filtro = "categorias";
        filtro2 = "categoria";

        document.getElementById(item.data().id).style.display = "block";
    } else {
        document.getElementById(item.data().id).style.display = "none";
    }     
}); 
}

const filtroSeleccionado = e => {
if (e.target.textContent === "Todas") {
    location.reload();
} else {
    let bbddProductosFiltrados = [];
    let filtro = "";
    let filtro2 = "";
    
    const filtro2a = e.target.textContent;
    const categoria2a = "categoria";

    if (e.target.dataset.id === "categoria") {
        bbddProductos.forEach(item => {
            if (item.data().categoria === filtro2a) {
                bbddProductosFiltrados.push(item);
                filtro = "categorias";
                filtro2 = "categoria";
                document.getElementById(item.data().id).style.display = "block";
            } else {
                document.getElementById(item.data().id).style.display = "none";
            }     
        });       
    }

    if (e.target.dataset.id === "marca") {
        document.getElementById('idFiltromarcas'+e.target.textContent).style.color = '#FF0000';
        bbddProductos.forEach(item => {
            if (item.data().marca === filtro2a) {
                bbddProductosFiltrados.push(item);
                filtro = "marcas";
                filtro2 = "marca";
                document.getElementById(item.data().id).style.display = "block";
            } else {
               document.getElementById(item.data().id).style.display = "none";
            }     
        });       
    }
}
}

// ocultar / mostrar desplegables
function ver(n) {
document.getElementById("subseccion"+n).style.display="block";
}
function ocultar(n) {
document.getElementById("subseccion"+n).style.display="none";
}

//# sourceMappingURL=carrito.js.map

// Declaración global de pintarCarritoLocal para que esté disponible antes de btnAumentarDisminuir
function pintarCarritoLocal() {
    pintarCarrito({
        items,
        carrito,
        bbddProductos,
        templateCarrito,
        fragment
    });
    pintarFooter({
        footer,
        carrito,
        cantidadDeProductos,
        taskFormEnviar: btnEnviar
    });
    // Calcular cantidad total de productos
    let cantidadTotal = 0;
    Object.values(carrito.productos).forEach(prod => {
        cantidadTotal += prod.cantidad;
    });
    carrito.cantidad = cantidadTotal;
    // Actualizar dinámicamente el resumen de compra
    actualizarResumenCompra();

  
}

// Declaración global de btnAumentarDisminuir para asegurar que el event listener lo encuentre
const btnAumentarDisminuir = e => {
        if(e.target.classList.contains('btn-success') || e.target.classList.contains('btn-danger')) {

    console.log(e.target.classList.contains('btn-success'));
    const producto = carrito.productos[e.target.dataset.id];  
    console.log("producto: ", producto);
    const productoActualizado = aumentarDisminuir(e, producto); // Asumo que aumentarDisminuir es una función externa

    if (productoActualizado.cantidad === 0) {
        delete carrito.productos[e.target.dataset.id];
    } else {
        carrito.productos[e.target.dataset.id] = { ...productoActualizado };
    }

    console.log(carrito);

    carrito.total = 0;
    carrito.totalPeso = 0;
    for (const productId in carrito.productos) {
        const prod = carrito.productos[productId];
        carrito.total += prod.total;
        carrito.totalPeso += prod.totalPeso;
    }

    // CORRECCIÓN: Usar comercioGlobal.uid para guardar en localStorage
    localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito));
    pintarCarritoLocal(); // Llamar a la función para pintar el carrito actualizado
}
    e.stopPropagation();
};

function actualizarResumenCompra(){
     const resumenDiv = document.getElementById('resumenCompra');
/*
 let descuento = Math.round(carrito.total * (carrito.cuponAplicado.cantidad / 100));

       let total = Math.max(0, carrito.total - descuento || 0); // Asegurarse de que el total no sea negativo

       if(descuento > carrito.cuponAplicado.tope ) {
              console.warn("Descuento aplicado excede el tope del cupón. Ajustando al tope.");
              descuento = Math.round(carrito.cuponAplicado.tope);
       }
*/



    if (resumenDiv) {
        resumenDiv.innerHTML = '';
        const resumenSection = document.createElement('div');
        resumenSection.className = "max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg mt-4 mb-4";
        let descuentoHtml = '';
        if (carrito.descuentoAplicado && carrito.descuentoAplicado > 0) {
            //descuentoHtml = `<div><span class=\"font-medium text-green-700\">Descuento aplicado:</span> -$${descuento}</div>`;
            descuentoHtml = ""
        }
        resumenSection.innerHTML = `
            <h2 class=\"text-lg font-semibold text-gray-800 mb-4\">Resumen de compra</h2>
            <div class=\"flex flex-col gap-2\">
                <div><span class=\"font-medium\">Total:</span> ${carrito.total ? carrito.total.toFixed(0) : '0.00'}</div>
                ${descuentoHtml}
                <div><span class=\"font-medium\">Productos:</span> ${carrito.cantidad || 0}</div>
                <div><span class=\"font-medium\">Envío:</span> a cargo del comprador</div>
            </div>
        `;
        resumenDiv.appendChild(resumenSection);
    }
    if (typeof comercioGlobal !== 'undefined' && comercioGlobal !== null && typeof comercioGlobal.uid === 'string') {
        localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito)); 
    } else {
        console.warn("Advertencia: comercioGlobal o comercioGlobal.uid no están definidos. No se pudo guardar el carrito en localStorage en pintarCarrito.");
    }
}

// Evita recargar la página al enviar el formulario de compra
if (btnEnviar) {
    btnEnviar.addEventListener('click', function(e) {
        e.preventDefault(); // Evita el submit y recarga
        // Aquí va la lógica de guardarPedido y validaciones
        if(abierto)
        {
            guardarPedido(usuario);
        }else {
            alert("El comercio está cerrado. Por favor, vuelve más tarde.");
        }
    });
}

function guardarPedido(usuario) {
    const db = getFirestoreDb(); // Asegura que db esté definido
    // --- Guardar datos del formulario en usuario ---

    if(!usuario.direccion.trim() || !usuario.nombre.trim() || !usuario.referencia.trim()) {
        if (confirm("Debes completar los campos de envío antes de confirmar tu compra. ¿Deseas hacerlo ahora?")) {
            // Redirigir al usuario a la página de usuario para completar los datos
            window.location = "usuario.html?volver=carrito&comercio=YBuVH33YSNMYIlOgWpVRPEwXP2r2";
         } else {
            alert("¡Has cancelado!"); 
            }
        return;
    }
  

    // --- Asegura que usuario sea instancia de Usuario ---
    if (!(usuario instanceof Usuario)) {
        usuario = Object.assign(new Usuario(), usuario);
    }
    // --- Guardar usuario en localStorage ---
    localStorage.setItem('usuario', JSON.stringify(usuario));
    // ...existing code...
    const ref = db.collection("ventas").doc();
    const refId = ref.id;
    ref.set({
        "carrito": carrito.toFirestore(),
        "comercio": comercioGlobal,
        "estado": "Sin procesar",
        "fecha": firebase.firestore.FieldValue.serverTimestamp(),
        "id": refId,
        "logistica": "envio",
        "nota": "",
        "total": carrito.total,
        "usuario": usuario.toFirestore(),
    })
      .then(() => {
            console.log("pedido cargado3")
            localStorage.setItem('ultimaCompra', JSON.stringify(carrito));
            carrito = new Carrito();
          localStorage.removeItem(comercioGlobal.uid); // Limpiar el carrito en localStorage
          console.log("Carrito pedido exitosamente con ID:", refId);
             alert("Carrito pedido exitosamente. ¡Gracias por tu compra!");
             window.location.href = "graciasPorSuCompra.html"; // Redirigir a la página principal
          pintarCarritoLocal(); 
          
        })
        .catch((error) => {
            console.error("Error pedido cargado2: ", error);
        });
}

    function mostrarCamposNoEditable(usuario, hiddenPrivateInfo3Element) {        
    if (hiddenPrivateInfo3Element) {
        hiddenPrivateInfo3Element.style.display = 'block'; // Mostrar campos de envío
        hiddenPrivateInfo3Element.innerHTML = `
       

        <br>
       <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Dirección:</label>
            <div id="direccion" class="w-full max-w-lg px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 flex items-center gap-2 select-none cursor-not-allowed" style="margin-bottom: 4px;">
                <i class="bi bi-lock-fill text-gray-400"></i>
                <span>${usuario.direccion ? usuario.direccion : '<span class="text-gray-400">Sin dirección</span>'}</span>
            </div>
        </div>
        <br>
      <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Referencia:</label>
            <div id="referencia" class="w-full max-w-lg px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 flex items-center gap-2 select-none cursor-not-allowed" style="margin-bottom: 4px;">
                <i class="bi bi-lock-fill text-gray-400"></i>
                <span>${usuario.referencia ? usuario.referencia : '<span class="text-gray-400">Sin referencia</span>'}</span>
            </div>
        </div>
        <br>
              <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Nombre:</label>
            <div id="nombre" class="w-full max-w-lg px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 flex items-center gap-2 select-none cursor-not-allowed" style="margin-bottom: 4px;">
                <i class="bi bi-lock-fill text-gray-400"></i>
                <span>${usuario.nombre ? usuario.nombre : '<span class="text-gray-400">Sin nombre</span>'}</span>
            </div>
         
        </div>
        <br>
       <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Teléfono:</label>
            <div id="telefono" class="w-full max-w-lg px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 flex items-center gap-2 select-none cursor-not-allowed" style="margin-bottom: 4px;">
                <i class="bi bi-lock-fill text-gray-400"></i>
                <span>${usuario.telefono ? usuario.telefono : '<span class="text-gray-400">Sin teléfono</span>'}</span>
            </div>
        </div>
        <br>
    
  
    `;


       const divDireccion = document.getElementById('direccion');
    const divReferencia = document.getElementById('referencia');
    const divNombre = document.getElementById('nombre');
    const divTelefono = document.getElementById('telefono');

    // Función para manejar el clic
    function handleClick(event) {
        // 'event.currentTarget' se refiere al elemento al que se adjuntó el escuchador de eventos
        // En este caso, será el div con el ID 'direccion', 'referencia', etc.
        const idDelElemento = event.currentTarget.id;
        console.log(`¡Se hizo clic en el div con ID: ${idDelElemento}!`);



        // Puedes añadir lógica específica aquí para cada div
        if (idDelElemento === 'direccion') {
            
            mensaje("Para editar la dirección, por favor ve a tu perfil.");
        } else if (idDelElemento === 'referencia') {
            mensaje("Para editar la referencia, por favor ve a tu perfil.");
        } else if (idDelElemento === 'nombre') {
            mensaje("Para editar el nombre, por favor ve a tu perfil.");
        } else if (idDelElemento === 'telefono') {
            
        }
    }
    

    divDireccion.addEventListener('click', handleClick);
    divReferencia.addEventListener('click', handleClick);
    divNombre.addEventListener('click', handleClick);
    divTelefono.addEventListener('click', handleClick);

    } else {
        console.warn("Elemento hiddenPrivateInfo3 no encontrado.");
    }

    function mensaje(msj){
        if (confirm(msj)) {
    window.location.href = "usuario.html?"; // Redirigir al usuario a la página de usuario para completar los datos
} else {
  
}
    }
}

     function setupMercadoPago() {
    const publicKey = 'APP_USR-15791c84-af4e-41f5-aa45-51c5789d14cb'; // Reemplaza con tu clave pública
    const serverURL = 'https://us-central1-tienda1-81220.cloudfunctions.net/mercadopagoApi'; // La URL de tu servidor


    async function createAndRenderPreference() {
        const loadingDiv = document.getElementById('loading');
    if (loadingDiv) { // Verificamos si el elemento existe
    loadingDiv.classList.remove('hidden');
        }
        errorMessageDiv.classList.add('hidden');

        try {
            const response = await fetch(`${serverURL}/create_preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{
                        title: 'Producto de prueba',
                        quantity: 1,
                        unit_price: 5000,
                    }],
                    back_urls: {
                        success: "http://localhost:3000/success",
                        pending: "http://localhost:3000/pending",
                        failure: "http://localhost:3000/failure"
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.statusText}`);
            }

            const data = await response.json();
            const preferenceId = data.id;

            if (!preferenceId) {
                throw new Error('No se recibió el ID de la preferencia.');
            }

            const mp = new MercadoPago(publicKey, { locale: 'es-AR' });
            const bricksBuilder = mp.bricks();

            bricksBuilder.create('wallet', 'wallet_container', {
                initialization: {
                    preferenceId: preferenceId,
                }
            });
            
        } catch (error) {
            console.error("Error:", error);
            errorMessageDiv.textContent = `Error: ${error.message}. Asegúrate de que tu servidor esté corriendo y de que la clave pública sea correcta.`;
            errorMessageDiv.classList.remove('hidden');
        } finally {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) { // Verificamos si el elemento existe
        loadingDiv.classList.add('hidden');
    }
}
    }

    // Llama a la función de la integración de Mercado Pago.
    // Usar 'DOMContentLoaded' es más seguro que 'window.onload' porque
    // se ejecuta tan pronto como el DOM está listo, sin esperar a que
    // se carguen las imágenes y otros recursos.
    document.addEventListener('DOMContentLoaded', createAndRenderPreference);
}

// Llama a la función principal para configurar la integración de Mercado Pago.

