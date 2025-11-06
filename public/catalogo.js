import { iniciarFirebase, verificarSiEstaAbiertoElComercio, pintarFooter } from "./funciones.js";
import { extraerParametros, calcularTotalesCarrito, aumentarDisminuir, pintarCarrito } from "./funciones.js";
import { Carrito, Score, Usuario, Comercio, Producto } from "./objetos.js";

// Inicializa Firebase (asumiendo que esta función está en funciones.js y configura 'firebase')
iniciarFirebase();

// Obtiene la instancia de Firestore después de inicializar Firebase
const db = firebase.firestore();

// --- Variables Globales y Elementos del DOM ---
const cards = document.getElementById('cards');
const btnAgregar = document.getElementById('btnAgregar');
const cantidadDeProductos = document.getElementById("insignia");
const taskForm = document.getElementById("task-form");
const loginForm = document.getElementById('task-form-envio');
const btnIniciarSesion = document.getElementById('btnIniciarSesion');
const btnAgregar2 = document.getElementById("btnAgregar2");
const destacado = document.getElementById("destacado");
const productoDestacado = document.getElementById("productoDestacado");
let categoria2 = document.getElementById('categorias');
let color2 = document.getElementById('colores');
let talle2 = document.getElementById('talles');
let marca2 = document.getElementById('marcas');
let todas2 = document.getElementById('todas');
const items = document.getElementById('items');
const footer = document.getElementById('footer');
const taskFormEnviar = document.getElementById('task-form-enviar') || document.createElement('button'); // Botón de enviar/comprar

const templateCard = document.getElementById('template-card');
const templateFooter = document.getElementById('template-footer').content;
const templateCarrito = document.getElementById('template-carrito').content;
const templateCategorias = document.getElementById('template-categorias').content;
const fragment = document.createDocumentFragment();
const mainImageContainer = document.getElementById('main-image-container');

let idGuardado = "";
let vendedor = "";
let listaCupones = [];
let vendedorFicha = {};
let telefono = "";
let usuario = {};

let carrito = new Carrito(); // La instancia global de Carrito
let comercioGlobal = {};     // Para almacenar el objeto completo del comercio
let bbddProductos = null;    // Datos del catálogo de productos de Firebase
let uid = null;
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
let email = "";
let total = 0;

/**
 * Busca los datos del comercio en Firestore usando el UID y los guarda globalmente y en localStorage.
 * @param {string} uid - El UID del comercio a buscar.
 */
async function buscarYGuardarComercio(uid) {
    console.log(`Buscando comercio ${uid} en Firebase y guardando...`);
    
    const docRef = db.collection("comercios").doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        // Si el documento existe, carga sus datos
        comercioGlobal = docSnap.data();
        comercioGlobal.uid = uid; // Asegura que el UID esté en el objeto

        console.log("Datos de comercio cargados de Firebase:", comercioGlobal);
        localStorage.setItem("comercio_data_key", JSON.stringify(comercioGlobal));
        
        console.log("Comercio cargado de Firebase y guardado en localStorage.");
        console.log("comercio.horarioDeAtencion (cargado):", comercioGlobal.horarioDeAtencion); // Verifica aquí
        console.log("comercio.direccion (cargado):", comercioGlobal.direccion); // Verifica aquí
        
    } else {
        // Si el comercio no se encuentra en Firebase, inicializa un objeto vacío
        console.error("Comercio no encontrado en Firebase:", uid);
        comercioGlobal = {
            uid: uid,
            nombre: "Nuevo Comercio", // Nombre predeterminado para un comercio no encontrado
            horarioDeAtencion: {}, // Por defecto, vacío si no se encuentra
            // ... otras propiedades por defecto que necesites ...
        };
        localStorage.setItem("comercio_data_key", JSON.stringify(comercioGlobal));
        console.log("Comercio inicializado como nuevo y guardado en localStorage.");
    }
}

/**
 * Maneja el evento de aumentar o disminuir la cantidad de un producto en el carrito.
 * @param {Event} e - El evento de clic.
 */
const btnAumentarDisminuir = e => {
    if(e.target.classList.contains('btn-success') || e.target.classList.contains('btn-danger')) {
    console.log(e.target.classList.contains('btn-success'));
    console.log(e.target.classList.contains('btn-danger'));
    console.log(e.target.dataset.id); // Asegúrate de que el dataset tenga el ID correcto
    const producto = carrito.productos[e.target.dataset.id];  
    console.log("producto: ", producto);
    const productoActualizado = aumentarDisminuir(e, producto); // Asumo que aumentarDisminuir es una función externa

    if (productoActualizado === 0) {
        if(e.target.classList.contains('btn-danger')) {    
            console.log("Eliminando producto del carrito porque la cantidad es 1 y se presionó el botón de disminuir.");
        delete carrito.productos[e.target.dataset.id];
    }
    } else {
        console.log("booton aumentar")
          carrito.productos[e.target.dataset.id] = { ...productoActualizado };
   
}

    console.log(carrito);

    carrito.total = 0;
    carrito.totalPeso = 0;
    carrito.cantidad = 0; // Asegúrate de que carrito.cantidad esté definido
    for (const productId in carrito.productos) {
        const prod = carrito.productos[productId];
        carrito.total += prod.total;
        carrito.totalPeso += prod.totalPeso;
        carrito.cantidad += prod.cantidad; // Asegúrate de que carrito.cantidad esté definidos
    }

    // CORRECCIÓN: Usar comercioGlobal.uid para guardar en localStorage
    localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito));
    pintarCarritoCatalogo();
 }
    e.stopPropagation();

};

/**
 * Añade o actualiza un producto en el carrito.
 * @param {HTMLElement} item - El elemento HTML que contiene los datos del producto en sus atributos data-.
 */
const setCarrito = item => {
    // 1. Asegurarse de que 'carrito' sea una instancia válida de Carrito
    // Si 'carrito' es null, undefined, o no es una instancia de Carrito, lo inicializa.
    if (carrito === null || !(carrito instanceof Carrito)) {
        carrito = new Carrito();
        console.log("Carrito inicializado por primera vez.");
    }

    // 2. Crear un objeto 'producto' con los datos del item
    const producto = new Producto();
    producto.id = item.dataset.id; // ID del producto

    // Asigna los datos del dataset al nuevo producto
    producto.categoria = item.dataset.categoria;
    producto.imagen = item.dataset.imagen;
    producto.marca = item.dataset.marca;
    producto.medida = item.dataset.medida;
    producto.precio = parseInt(item.dataset.precio) || 0; // Precio unitario
    producto.talle = item.dataset.talle || "talle"; // Asegura un valor por defecto
    producto.tamano = parseInt(item.dataset.tamano) || 0; // Tamaño/peso unitario
    producto.title = item.dataset.title;

    // 3. Verificar si el producto ya existe en el carrito
    if (carrito.productos.hasOwnProperty(producto.id)) {
        // Si el producto ya existe, incrementa su cantidad
        console.log(`Producto con ID ${producto.id} ya en el carrito. Incrementando cantidad.`);
        producto.cantidad = carrito.productos[producto.id].cantidad + 1;
    } else {
        // Si es un producto nuevo, su cantidad inicial es 1
        console.log(`Producto con ID ${producto.id} es nuevo en el carrito. Añadiendo.`);
        producto.cantidad = 1;
    }

    // 4. Calcular los totales para este producto específico (basados en su cantidad actualizada)
    producto.total = producto.precio * producto.cantidad;
    producto.totalPeso = producto.tamano * producto.cantidad;

    // 5. Añadir o actualizar el producto en el mapa de productos del carrito
    // Usamos el operador spread para crear una copia del objeto 'producto'
    // Esto evita mutaciones inesperadas si 'producto' se reutiliza.
    carrito.productos[producto.id] = { ...producto };
    // Animación al agregar producto
    if (item.classList) {
        item.classList.add('agregado-al-carrito');
        setTimeout(() => {
            item.classList.remove('agregado-al-carrito');
        }, 700);
    }
    // Animación para el ícono fa-shopping-cart
    const iconoCarrito = document.querySelector('.fa-shopping-cart');
    if (iconoCarrito) {
        iconoCarrito.classList.add('animar-cart');
        setTimeout(() => {
            iconoCarrito.classList.remove('animar-cart');
        }, 700);
    }

    // 6. Recalcular los totales generales del carrito
    // Es crucial iterar sobre todos los productos en carrito.productos para obtener el total general.
    carrito.total = 0;
    carrito.totalPeso = 0;
    carrito.cantidad= 0;
    for (const productId in carrito.productos) {
        const prod = carrito.productos[productId];
        carrito.total += prod.total;
        carrito.totalPeso += prod.totalPeso;
        carrito.cantidad += prod.cantidad; // Asegúrate de que carrito.cantidad esté definido
    }

    console.log("Estado actual del carrito:", carrito);

    // 7. Guardar el carrito en localStorage
    // Asegurarse de que 'comercioGlobal' y 'comercioGlobal.uid' estén definidos antes de guardar.
    if (typeof comercioGlobal !== 'undefined' && comercioGlobal !== null && typeof comercioGlobal.uid === 'string') {
        localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito));
        console.log("Carrito guardado en localStorage para UID:", comercioGlobal.uid);
    } else {
        console.warn("Advertencia: comercioGlobal o comercioGlobal.uid no están definidos. No se pudo guardar el carrito en localStorage.");
    }

    // 8. Actualizar la interfaz de usuario
    // Asume que 'pintarCarrito()' existe y actualiza el DOM.
    pintarCarritoCatalogo();
};


// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', async e => {
    //console.log("DOMContentLoaded: Iniciado.");

    // 1. Extraer el UID del comercio de la URL primero
    uid = extraerParametros(document.URL).comercio;
    if (!uid) {
        console.error("DOMContentLoaded: UID de comercio no encontrado en la URL. No se puede continuar.");
        alert("Error: El identificador del comercio no se encontró en la dirección.");
        return; 
    }
    //console.log("UID de comercio de la URL:", uid);

    // 2. Cargar el objeto 'comercioGlobal' (del localStorage o Firebase)
    // ESTE ES EL ÚNICO LUGAR DONDE comercioGlobal DEBE CARGARSE DESDE CERO
    try {
        const storedComercioData = localStorage.getItem("comercio_data_key"); 
        
        if (storedComercioData) {
            const parsedComercio = JSON.parse(storedComercioData);
            // Verifica que el comercio cargado de localStorage COINCIDA con el UID de la URL
            if (parsedComercio && parsedComercio.uid === uid) {
                comercioGlobal = parsedComercio;
                //console.log("Comercio cargado de localStorage:", comercioGlobal);
            } else {
                console.warn("Comercio en localStorage no coincide o es inválido. Buscando en base de datos.");
                localStorage.removeItem("comercio_data_key"); 
                await buscarYGuardarComercio(uid); // Ir a DB si no coincide o es inválido
            }
        } else {
            //console.log("Comercio no encontrado en localStorage. Buscando en base de datos.");
            await buscarYGuardarComercio(uid); // Ir a DB si no está en LS
        }
    } catch (error) {
        console.error("Error al cargar o parsear el objeto comercio de localStorage:", error);
        //console.log("Intentando buscar el comercio en la base de datos como fallback.");
        localStorage.removeItem("comercio_data_key"); // Limpiar datos corruptos en LS
        await buscarYGuardarComercio(uid); // Fallback a DB
    }

    // --- VERIFICACIÓN CRÍTICA DESPUÉS DE INTENTAR CARGAR EL COMERCIO ---
    if (!comercioGlobal || !comercioGlobal.uid) {
        console.error("DOMContentLoaded: ¡ERROR FATAL! El objeto comercioGlobal no es válido o no tiene UID después de todos los intentos de carga. No se puede inicializar la aplicación.");
        alert("No se pudo cargar la información esencial del comercio. Por favor, verifica la URL o intenta de nuevo.");
        return; // Detener la ejecución de la aplicación si no hay comercio válido
    }
    //console.log("ComercioGlobal VALIDADO y listo:", comercioGlobal);

    // 3. Ahora que `comercioGlobal` está *definitivamente* cargado y validado,
    // puedes proceder a inicializar el resto de la aplicación, incluyendo el carrito.
    await inicializarAplicacion(); 

    //console.log("Carrito global después de inicializarAplicacion:", carrito);
    //console.log("Comercio global DESPUÉS de inicializarAplicacion (debería ser el mismo):", comercioGlobal); // Verificar que no cambió

    // 4. Lógica de UI y carga de catálogo
    if (destacado) { // Asegúrate de que 'destacado' es una variable global o está definida
        destacado.style.display = "none";
    }
    
    // CORRECCIÓN: Adjuntar el event listener para 'cards' aquí, una sola vez.
    // Esto evita que se adjunte múltiples veces si pintarCards() se llama más de una vez.
    if (cards) { // Asegúrate de que 'cards' esté definido antes de adjuntar el listener
        cards.addEventListener('click', e => {
            //console.log("Evento click en cards, delegando a addCarrito"); 
            addCarrito(e);
        });
    } else {
        console.warn("Elemento 'cards' no encontrado. No se pudo adjuntar el event listener para el carrito.");
    }


    // 5. Verificar horario de atención del comercio
    if (comercioGlobal.horarioDeAtencion) { // Ya verificamos que comercioGlobal es válido arriba
        //console.log("Comercio encontrado y cargado. Verificando horario.");
        verHorario(); // Asegúrate de que verHorario exista
    } else {
        console.warn("No se pudo obtener el horario de atención del comercio.");
        cambiarColor(false); // Cambia el color a rojo si no hay horario
        document.getElementById("horario").innerHTML=`<h4> <b></b> Comercio cerrado</h4>`;
    }

    // verificarLogin() // Si existe y es necesario

    //console.log("DOMContentLoaded: Finalizado.");
});

/**
 * Inicializa la aplicación después de cargar el comercio global.
 * Carga el catálogo de productos y el carrito desde localStorage.
 */
const inicializarAplicacion = async () => {
    //console.log("Inicializando aplicación (desde inicializarAplicacion)...");

    // Lógica para asignar comercioGlobal a carrito.comercio (ya asumimos que comercioGlobal es válido)
    if (!comercioGlobal || !comercioGlobal.uid) {
        console.error("inicializarAplicacion: comercioGlobal no es válido. Esto indica un problema en la carga inicial.");
        return; 
    }
    // Asegurarse de que carrito esté inicializado antes de asignarle propiedades
    if (carrito === null || !(carrito instanceof Carrito)) {
        carrito = new Carrito();
        console.log("Carrito inicializado en inicializarAplicacion.");
    }
    // ✅ CORRECCIÓN: Asignar el objeto de comercio COMPLETO al carrito.
    carrito.comercio = comercioGlobal;
    carrito.comercioNombre = comercioGlobal.nombre || "";
    //console.log("Comercio asignado al carrito:", carrito.comercio);

    // --- AHORA CARGAMOS bbddProductos AQUÍ, CON AWAIT ---
    try {
        //console.log("Intentando cargar bbddProductos desde 'catalogos' para UID:", uid);
        const docRefCatalogos = db.collection("catalogos").doc(uid); 
        bbddProductos = await docRefCatalogos.get(); 
        
        if (bbddProductos.exists) {
            console.log("bbddProductos cargado exitosamente:", bbddProductos.data());
    
        } else {
            console.error("No se encontró el documento de catálogo en Firebase para UID:", uid, "en la colección 'catalogos'.");
            bbddProductos = null; 
            alert("Error: No se pudo cargar el catálogo de productos. Intenta de nuevo más tarde.");
            return; 
        }
    } catch (e) {
        console.error("Error al cargar bbddProductos desde Firebase (colección 'catalogos'):", e);
        bbddProductos = null; 
        alert("Error: Falló la conexión con la base de datos de productos. Intenta de nuevo más tarde.");
        return; 
    }

    // Cargar el estado del carrito desde localStorage
    try {
        const carritoGuardado = localStorage.getItem(comercioGlobal.uid); 
        if (carritoGuardado) {
            const dataPlana = JSON.parse(carritoGuardado);
            // ✅ CORRECCIÓN CRÍTICA: Validar que el carrito guardado pertenezca al comercio actual.
            // Si no coincide, se descarta para evitar enviar un mp_user_id incorrecto.
            if (!dataPlana.comercio || dataPlana.comercio.uid !== comercioGlobal.uid) {
                console.warn("El carrito en localStorage pertenece a otro comercio. Se creará un carrito nuevo.");
                localStorage.removeItem(comercioGlobal.uid); // Limpiar el carrito viejo.
                carrito = new Carrito(); // Empezar con un carrito limpio.
                return; // Salir de la función de carga del carrito.
            }
            if (carrito === null || !(carrito instanceof Carrito)) {
                carrito = new Carrito();
            }
            Object.assign(carrito, dataPlana); 
            if (!carrito.productos || typeof carrito.productos !== 'object') {
                carrito.productos = {};
            }
            //console.log("Carrito cargado de localStorage:", carrito);
        } else {
            //console.log("No se encontró carrito guardado para este comercio. Se usará un carrito vacío.");
        }
    } catch (e) {
        console.error("Error al cargar el carrito de localStorage:", e);
        carrito = new Carrito(); 
        carrito.comercio = comercioGlobal.nombre; 
        carrito.comercioNombre = comercioGlobal.nombre || "";
        console.warn("Carrito reiniciado debido a error en localStorage.");
    }
    
    // Una vez que TODO (comercioGlobal y bbddProductos) está cargado y el carrito está en su estado correcto
    // Ahora bbddProductos DEBERÍA estar listo cuando pintamos el carrito.
    pintarCarritoCatalogo(); 
    if (mainImageContainer) { mainImageContainer.style.display = 'none'; }


    // LLAMA A pintarCards CON TODOS LOS PRODUCTOS LA PRIMERA VEZ
    // Asegúrate de que bbddProductos.data().productos sea el array correcto antes de pasarlo.
    if (bbddProductos && bbddProductos.exists && Array.isArray(bbddProductos.data().productos)) {


        

        // ...dentro de inicializarAplicacion, antes de llamar a pintarCards...
if (bbddProductos && bbddProductos.exists && Array.isArray(bbddProductos.data().productos)) {
    // Ordenar los productos por el campo "orden" antes de pintarlos
    const productosOrdenados = [...bbddProductos.data().productos].sort((a, b) => {
        // Si alguno no tiene "orden", lo manda al final
        if (a.orden === undefined) return 1;
        if (b.orden === undefined) return -1;
        return a.orden - b.orden;
    });
    pintarCards(productosOrdenados); // Pasa los productos ordenados
} else {
    console.error("No se pudo pintar las tarjetas iniciales: bbddProductos no es válido o está vacío.");
    // Opcional: Mostrar un mensaje al usuario aquí.
}







    } else {
        console.error("No se pudo pintar las tarjetas iniciales: bbddProductos no es válido o está vacío.");
        // Opcional: Mostrar un mensaje al usuario aquí.
    }
    //console.log("Inicialización de aplicación finalizada.");
};


btnIniciarSesion.addEventListener('click', e2 => { login(e2) });
// borrar la siguiente linea para mostrar boton de login
const btnIniciarSesion2 = document.getElementById('btnIniciarSesion2');

btnIniciarSesion.style.display = 'none';

/**
 * Muestra el estado de horario del comercio (abierto/cerrado) y cambia el color.
 * @param {Object} horario - El objeto de horario de atención del comercio.
 */
function verHorario(){
    // CORRECCIÓN: Usar comercioGlobal consistentemente
    console.log("comercio.horariodeatencion: ", comercioGlobal.horarioDeAtencion);
    
    console.log("comercio.direccion: ", comercioGlobal.direccion);
    abierto = verificarSiEstaAbiertoElComercio(comercioGlobal.horarioDeAtencion);
    
    console.log("comercio: ", comercioGlobal, "abierto: ", abierto);
    
    // Esta línea fuerza a que siempre esté abierto, considera removerla para la lógica real
    
    if(abierto){
        document.getElementById("horario").innerHTML=`<h4> <b></b> Comercio abierto</h4>`;
        cambiarColor(abierto);
    }else{
        cambiarColor(abierto);
        document.getElementById("horario").innerHTML=`<h4> <b></b> Comercio cerrado</h4>`;
    }
}

/**
 * Cambia el color de fondo del elemento de horario según si el comercio está abierto o cerrado.
 * @param {boolean} abierto - True si el comercio está abierto, false si está cerrado.
 */
function cambiarColor(abierto) {
    var div = document.getElementById("horario");
    if(abierto){
        div.style.backgroundColor = "#1b812c"; // Color verde
    }
    else{
        div.style.backgroundColor = "#f83333"; // Color rojo
    }
}

/**
 * Redirige a la página de inicio de sesión.
 */
function login(){
    window.location="usuario2.html?volver=catalogo";
}

// Event listener para los botones de aumentar/disminuir cantidad en el carrito
items.addEventListener('click', e => { btnAumentarDisminuir(e); });

/**
 * Pinta las tarjetas de productos en el DOM.
 * @param {Array<Object>} productosAMostrar - Array de objetos de producto a mostrar.
 */
const pintarCards = (productosAMostrar) => {
    // Limpiar el contenedor principal de las tarjetas ANTES de pintar
    cards.innerHTML = ''; 

    // *** VERIFICACIÓN CRÍTICA: Asegúrate de que los productosAMostrar son válidos. ***
    if (!productosAMostrar || !Array.isArray(productosAMostrar) || productosAMostrar.length === 0) {
        // Si no hay productos para mostrar, lo indicamos y salimos.
        cards.innerHTML = '<p class="text-center text-muted mt-5">No se encontraron productos.</p>';
        return;
    }

    // Limpiar el fragmento antes de usarlo para evitar duplicados
    while (fragment.firstChild) {
        fragment.removeChild(fragment.firstChild);
    }

    productosAMostrar.forEach(item => {
        // Asegúrate de que el producto tiene stock y es de tipo "producto"
        if(item.stock > 0 && item.tipo === "producto"){
            // Clonamos el *contenido* de la plantilla, no la plantilla en sí.
            const clone = templateCard.content.cloneNode(true); 
            
            // Modificamos los elementos DENTRO del 'clone'
            clone.querySelector('.titulo').textContent = item.title;
            clone.querySelector('.precio').textContent = item.precio;
            
            // Si item.tamano no está definido o es nulo, usamos 0 o un texto alternativo
            if(item.tamano === undefined || item.tamano === null){
                clone.querySelector('.cantidad').textContent = 'N/A'; // O 0, según prefieras
            }else{
                // Usamos item.medida si existe, si no, una cadena vacía
                clone.querySelector('.cantidad').textContent = item.tamano + (item.medida || ''); 
            }
            
            // Asignar atributos al elemento <li> principal de la tarjeta
            clone.querySelector('li').setAttribute('data-category', item.categoria || '');
            clone.querySelector('li').setAttribute('id', item.id); // ¡Importante para identificación!

            // Asignar imagen si existe
            if (item.imagen) {
                clone.querySelector('#imagenCard').setAttribute('src', item.imagen);
            } else {
                console.warn(`Producto ${item.title} no tiene URL de imagen.`);
                // Opcional: clone.querySelector('img').setAttribute('src', 'ruta/a/imagen_por_defecto.png');
            }

             // --- Lógica para mostrar/ocultar la etiqueta de oferta ---
    const etiquetaOferta = clone.querySelector('#oferta');

    if (item.oferta) { // Suponiendo que 'items.oferta' es una propiedad numérica
        etiquetaOferta.style.display = 'block'; // O 'inline-block'
    } else {
        etiquetaOferta.style.display = 'none'; // Asegurarse de que esté oculta si no está en oferta
    }

    const etiquetaNuevo = clone.querySelector('#nuevo');

    if(item.nuevo) { // Suponiendo que 'item.nuevo' es un booleano
        etiquetaNuevo.style.display = 'block'; // O 'inline-block'
    } else {
        etiquetaNuevo.style.display = 'none'; // Asegurarse de que esté oculta si no es nuevo
    }


            // Asignar los data-attributes al botón "Agregar" (btn-primary)
            const btnPrimary = clone.querySelector('.btn-primary');
            if (btnPrimary) {
                btnPrimary.dataset.descripcion = item.descripcion || '';
                btnPrimary.dataset.id = item.id;
                btnPrimary.dataset.imagen = item.imagen || '';
                btnPrimary.dataset.marca = item.marca || '';
                btnPrimary.dataset.precio = item.precio; 
                btnPrimary.dataset.title = item.title;
                btnPrimary.dataset.total = item.total || 0; 
                btnPrimary.dataset.categoria = item.categoria || '';
                btnPrimary.dataset.cantidad = item.cantidad || 0; 
                btnPrimary.dataset.tamano = item.tamano || '';
                btnPrimary.dataset.medida = item.medida || '';
            } else {
                console.warn("pintarCards: No se encontró el botón '.btn-primary' en el templateCard para el producto:", item.title);
            }
            
            fragment.appendChild(clone); 
        }
    });
    
    cards.appendChild(fragment); // Añade todos los productos al DOM de una sola vez
};

/**
 * Añade un producto al carrito cuando se hace clic en el botón "Agregar".
 * @param {Event} e - El evento de clic.
 */
const addCarrito = e => {
    if(e.target.id == "btnAgregar"){
        setCarrito(e.target);
    }

    if (e.target.classList.contains('btn-primary')) {
        // setCarrito(e.target) // <-- Esta línea estaba comentada, pero si se descomenta, también causaría doble llamada.
    }
};

/**
 * Pinta los filtros de categorías y marcas en el DOM.
 * @param {Array<string>} categorias - Array de nombres de categorías/filtros.
 * @param {string} filtro - El ID del contenedor HTML para el filtro (ej. 'categorias', 'marcas').
 * @param {string} filtro2 - El tipo de filtro (ej. 'categoria', 'marca').
 */
function pintarFiltros(categorias, filtro, filtro2) {
    // Limpiar el fragmento antes de usarlo para evitar duplicados
    while (fragment.firstChild) {
        fragment.removeChild(fragment.firstChild);
    }

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

    // Re-asignar event listeners después de repintar los elementos
    categoria2.addEventListener('click', e => { filtroSeleccionado(e); });
    marca2.addEventListener('click', e => { filtroSeleccionado(e); });
    todas2.addEventListener('click', e => { filtroSeleccionado(e); });
}

// Event Listener para el campo de búsqueda (mientras el usuario escribe)
document.getElementById('buscador').addEventListener('input', function(event) {
    const searchTerm = event.target.value.toLowerCase(); // Convertir a minúsculas al instante
    console.log(`DEBUG INPUT: Buscando en tiempo real: "${searchTerm}"`);
    filtrar(searchTerm);
});

// Event Listener para el formulario de búsqueda (cuando se presiona Enter o se hace clic en el botón de submit)
taskForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ¡MUY IMPORTANTE! Evita que el formulario recargue la página.
    const searchTerm = document.getElementById('buscador').value.toLowerCase();
    console.log(`DEBUG SUBMIT: Formulario de búsqueda enviado: "${searchTerm}"`);
    filtrar(searchTerm);
});

/**
 * Filtra los productos mostrados en la interfaz de usuario.
 * @param {string} searchTerm - El término de búsqueda para filtrar los productos.
 */
const filtrar = searchTerm => {
    console.log(`DEBUG FILTRAR: Procesando término de búsqueda: "${searchTerm}"`);

    // Obtiene los productos que coinciden con el término de búsqueda.
    // Si el término está vacío, buscarProductos devolverá todos los productos.
    const productosParaMostrar = buscarProductos(searchTerm);

    // Llama a pintarCards para mostrar solo los productos filtrados.
    // Esto limpia la vista y luego la repinta con el nuevo conjunto de productos.
    pintarCards(productosParaMostrar); 
};

/**
 * Busca productos en la base de datos local (bbddProductos) que coincidan con un término de búsqueda.
 * @param {string} buscador - El término de búsqueda.
 * @returns {Array<Object>} Un array de productos que coinciden con el término de búsqueda.
 */
const buscarProductos = buscador => {
    if (!buscador || buscador.length === 0) {
        console.log("DEBUG buscarProductos: Buscador vacío. Devolviendo todos los productos.");
        return bbddProductos && bbddProductos.exists && Array.isArray(bbddProductos.data().productos) ? bbddProductos.data().productos : [];
    }
    const searchTermLowerCase = buscador.toLowerCase();
    const productosEncontrados = bbddProductos.data().productos.filter(item => {
       const titleLowerCase = (item.title || "").toLowerCase();
       const descriptionLowerCase = (item.descripcion || "").toLowerCase(); 
       const marcaLowerCase = (item.marca || "").toLowerCase(); 
       const categoriaLowerCase = (item.categoria || "").toLowerCase(); 

       return titleLowerCase.includes(searchTermLowerCase) ||
              descriptionLowerCase.includes(searchTermLowerCase) ||
              marcaLowerCase.includes(searchTermLowerCase) ||
              categoriaLowerCase.includes(searchTermLowerCase);
    });

    console.log(`DEBUG buscarProductos: Productos encontrados para "${buscador}": ${productosEncontrados.length}`);
    return productosEncontrados;
};

/**
 * Maneja la selección de un filtro (categoría o marca).
 * @param {Event} e - El evento de clic.
 */
const filtroSeleccionado = e =>{
    if(e.target.textContent=="Todas"){
        location.reload();
    }else{
        let bbddProductosFiltrados = [];
        const filtro2a = e.target.textContent;
        
        if(e.target.dataset.id == "categoria"){
            bbddProductos.data().productos.forEach(item => { 
                if(item.categoria == filtro2a){ 
                    bbddProductosFiltrados.push(item);
                    document.getElementById(item.id).style.display = "block"; 
                }else{
                    document.getElementById(item.id).style.display = "none"; 
                }     
            });      
        }
        
        if(e.target.dataset.id == "marca"){
            document.getElementById('idFiltromarcas'+e.target.textContent).style.color = '#FF0000';
            bbddProductos.data().productos.forEach(item => { 
                if(item.marca == filtro2a){ 
                    bbddProductosFiltrados.push(item);
                    document.getElementById(item.id).style.display = "block"; 
                }else{
                    document.getElementById(item.id).style.display = "none"; 
                }     
            });      
        }
    }
};

/**
 * Pinta los productos en el carrito en el DOM.
 */


// Reemplazo la función local por la llamada a la función importada y parametrizada
const pintarCarritoCatalogo = () => {
    pintarCarrito({
         items,
        carrito,
        bbddProductos,
        templateCarrito,
        fragment // O el elemento correspondiente si lo usas en catálogo
    });
    pintarFooter({
        footer,
        carrito,
        cantidadDeProductos,
        taskFormEnviar
    });
    if (typeof comercioGlobal !== 'undefined' && comercioGlobal !== null && typeof comercioGlobal.uid === 'string') {
        localStorage.setItem(comercioGlobal.uid, JSON.stringify(carrito)); 
    } else {
        console.warn("Advertencia: comercioGlobal o comercioGlobal.uid no están definidos. No se pudo guardar el carrito en localStorage en pintarCarrito.");
    }


  // Calcular cantidad total de productos
    let cantidadTotal = 0;
    Object.values(carrito.productos).forEach(prod => {
        cantidadTotal += prod.cantidad;
    });
    carrito.cantidad = cantidadTotal;

};

/**
 * Función para actualizar el carrito (lógica de guardado en Firebase, si aplica).
 * Actualmente no guarda en Firebase.
 */
const actualizarCarrito = ()=>{
    if(inicio){
        inicio=false;
    }else{
        const carritoArray = Array.from(Object.values(carrito));
        // Aquí iría la lógica para guardar el carrito en Firebase si fuera necesario.
    }
};

/**
 * Pinta el pie de página del carrito con los totales.
 */



const btnEnviar = document.getElementById('btnEnviar'); 

if (btnEnviar) {
    btnEnviar.addEventListener('click', (e) => {
        e.preventDefault(); // MUY IMPORTANTE: Previene el envío del formulario y la recarga de la página
        console.log("Botón 'Comprar' presionado. Redirigiendo a carrito.html");
        window.location.href = 'carrito.html?comercio=' + encodeURIComponent(comercioGlobal.uid); // Redirige a la página carrito.html
    });
} else {
    console.warn("Elemento 'btnEnviar' no encontrado. El botón 'Comprar' no funcionará.");
}

// ocultar / mostrar desplegables
function ver(n) {
    document.getElementById("subseccion"+n).style.display="block";
}
function ocultar(n) {
    document.getElementById("subseccion"+n).style.display="none";
}

/*
// Función de ejemplo para crear un enlace de WhatsApp (si es necesario)
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
*/

// window.onload = init; // Descomentar si necesitas ejecutar init al cargar la ventana



function init() {

    

    const telefono= vendedorFicha.telefono
    //console.log("init()", telefono)
    
    if(telefono>0){
        //console.log("lengt >0")
        
       
        let a = createA("https://api.whatsapp.com/send?phone=+54"+telefono+"&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta"
        , "whatsapp");
        document.body.appendChild(a);
    }else{
        //console.log("lengt <0")
 
    let a = createA("vendedores.html"
    , "whatsapp");
    document.body.appendChild(a);
    }
    
 
    
 
}
 

function filtrarDatos(data2) {

    //console.log("filtrar datos", )
    let categorias1 = []
    let marcas1 = []

    //creo un array de categorias
    data2.forEach(item => {
      
       categorias1.push(item.data().categoria);
       marcas1.push(item.data().marca);
    })

    categorias1.sort()      //.sort() ordena array por unicode, es decir por abecedario y por numero pero ascendente es 1 10 2 24 29 3 4 , https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/sort 
    marcas1.sort()
    
    // creo un nuevo array con set para que no se repitan items.
    let filtro=""
    let filtro2=""
    
    const categorias= new Set(categorias1)
     const  marcas= new Set(marcas1)
     filtro="categorias"
     filtro2="categoria"
    pintarFiltros(categorias, filtro, filtro2)
    filtro="marcas"
    filtro2="marca"
    pintarFiltros(marcas, filtro, filtro2)


    
}


const inicializarCarritoGlobal = () => {
    // Asegúrate de que 'comercio' esté disponible aquí (ej. cargado globalmente o pasado como parámetro)
    // Si 'comercio' también se carga asincrónicamente, es posible que necesites una promesa o callback
    // para asegurar que esté listo antes de que esta función se ejecute con éxito.
    try {
        const storedCarrito = localStorage.getItem(comercio.uid); // Asegúrate de que comercio.uid esté listo
        if (storedCarrito) {
            carrito = JSON.parse(storedCarrito);
            if (!carrito.productos) {
                carrito.productos = {};
            }
        } else {
            carrito = {
                productos: {},
                cantidad: 0,
                total: 0,
                comercio: null, // Valor inicial
                comercioNombre: "",
                peso: 0,
                precio: 0
            };
        }
    } catch (e) {
        console.error("Error al cargar o inicializar el carrito desde localStorage:", e);
        carrito = { productos: {}, cantidad: 0, total: 0, comercio: null, comercioNombre: "", peso: 0, precio: 0 };
    }
    //console.log("Carrito global inicializado:", carrito);
    pintarCarritoCatalogo(); // Llama a pintarCarrito para mostrar el estado inicial
};

  function guardarPedido(nombre, telefono, direccion, numero, departamento, entreCalles, referencia){
    //console.log("guardar pedido")
    //console.log("existe direccion5")

    //console.log(nombre)

   
     


   
  
      const user = firebase.auth().currentUser;
      if (user !== null) {
      //console.log("user distinto de null poner if")
      }
  
     
  
      //console.log("localStorage, ", JSON.parse(localStorage.getItem("clienteFicha")))
        
      
  
  
      const fecha=firebase.firestore.FieldValue.serverTimestamp()
  
  
      //console.log("guardando pedido en firebase......", direccion)

      //console.log("carrito", carrito)
      const carritoArray= Array.from(Object.values(carrito));
      //console.log("arr", carritoArray);
      //console.log("total", total)
      //console.log("fichaCliente", JSON.parse(localStorage.getItem("clienteFicha")))

      

   
  
      //console.log("existe direccion6", nombre, telefono, direccion, numero, departamento, referencia, entreCalles, email, total)
       const ref=db.collection("ventas").doc()
       const refId= ref.id
       ref.set({
        nombre,
        cupon,
        cuponId,
        "direccion": direccion+" "+numero+" "+departamento,
        "direccionCalle" : direccion,
        "direccionNumero": numero,
        "direccionDepartamento": departamento,
        referencia,
        entreCalles,
        telefono,
        email,
        vendedorEmail,
        vendedorNombre,
        vendedorDireccion,
        fecha,
        estado: "Sin procesar",
        "pedido":"Sin procesar",
        total,
        "nota":"",
        "carrito": carritoArray,
        "idPedido": refId,
        envio: "Sin procesar",
        "cadete": "-",
        "cadeteEmail": "",
        totalPeso,

        vendedorCalle,
        vendedorDepartamento,
        vendedorDireccion,
        vendedorEntreCalles,
        vendedorNombre,
        vendedorNumero,
        vendedorReferencia,
    
        
      })
   
          .then(() => {


            const ref2=db.collection("enviosSolicitud").doc(refId)
       
       ref2.set({


        envio: "Sin procesar",
        fecha,
        "idPedido": refId,
        total,
        totalPeso,
        vendedorDireccion: vendedorCalle+" entre: "+vendedorEntreCalles,      
        
      })
      .then(() => {


        window.alert("Compra exitosa!!! En minutos lo recibirá en el domicilio que seleccionó");



              //console.log("pedido cargado3")
              carrito = new Carrito()
              //console.log("1442 carrito: ", carrito)
           
              venta= true
              localStorage.setItem(uid, JSON.stringify(carrito))
          pintarCarrito()
        })
        .catch((error) => {
            console.error("Error envioSoilitud no cargado: ", error);
        });
      
        
          })
          .catch((error) => {
              console.error("Error pedido cargado2: ", error);
          });
          
  
          
  
          /* Object.values(carrito).forEach(producto => {
             
              cantidad= producto.cantidad
              categoria= producto.categoria
              color= producto.color
              id= producto.id
              imagen= producto.imagen
              marca= producto.marca
              precio= producto.precio
              talle= producto.talle
              title= producto.title
              total= producto.total



          }) 
          */
  
  
  
       
  
  
     
     
    
  
  
  
  
   
  
          
          
          
  
      }

      function handleAuthState(user) {
        //console.log("handleAuthState")
        if (user) {
            email = user.email
        localStorage.setItem("email", user.email)
        //console.log("usuario logeado1: "+user.email)
        btnIniciarSesion.style.display="none";
        
       /* if(carrito.size>0){
            //console.log("guardar carrito")
        }else{
            //console.log("buscar carrito guardado")
           
        }
        */
    
           //si el carrito no esta vacio
          if( Object.keys(carrito).length===0){
            //console.log("carrito vacio")
            
            buscarCarrito(email)   
        }else{
            //console.log("carrito cargado")
            actualizarCarrito()
          
        }
       
        
    
    
      }else{
          email= ""
    
        btnIniciarSesion.style.display="block";
        loginForm.style.display = 'none';
      
       
      }
    
    
    }
    
    function buscarUsuarioEnbbdd(emailCliente){
    
    
         
    
    
    
    
        //console.log("buscarUsuario", emailCliente)
        var docRef= db.collection("usuarios").doc(emailCliente)
        docRef.get().then((doc) => {
            if (doc.exists) {
                
        
    
            //console.log("email cliente453", doc.data().email, doc.data().nombre)
            
            localStorage.setItem("clienteFicha", JSON.stringify(doc.data()) )
    
            const nombre = doc.data().nombre
            const direccion = doc.data().direccion
            const numero = doc.data().numero
            const departamento = doc.data().departamento
            const telefono = doc.data().telefono
            const entreCalles = doc.data().entreCalles
            const referencia = doc.data().referencia
    
    
            if(doc.data().direccion != null){
    
                //console.log("existe direccion", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
                showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
            }else{
                const nombre = ""
            const direccion = ""
            const numero = ""
            const departamento = ""
            const telefono = ""
            const entreCalles = ""
            const referencia = ""
                //console.log("No existe direccion")
                showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
            }
    
            //guardarPedido()
            //const clienteFicha23=JSON.parse(localStorage.getItem("vendedorFicha"))
            ////console.log("clienteFicha23", clienteFicha23.telefono)
    
    
    
          
    
    
    
    
               
                
            } else {
                // doc.data() will be undefined in this case
                //console.log("No existe ficha del usuario en bbdd!");
                
                
      
            
               // btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick
               const nombre = ""
               const direccion = ""
               const numero = ""
               const departamento = ""
               const telefono = ""
               const entreCalles = ""
               const referencia = ""
    
    
       
                
                showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
                //mostrarCampos()
            
                
        
            }
        }).catch((error) => {
            //console.log("Error getting document:", error);
        });
    
    
    
    }




/*
    function extraerParametros() {
        
        



        // url en string
        const url = window.location.href;
    
        
        //console.log(url)
    
    
    
      
    
    
        if (typeof url != 'string') {
            throw TypeError('El argumento debe ser una cadena de caracteres.');
        }
    
        // Pendiente: validar si una cadena de caracteres corresponde con una URL.
    
        return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce((a, p) => ((a[p.slice(0, p.indexOf('='))] = p.slice(p.indexOf('=') + 1)), a), {});
    }
    
    try {
        localStorage.setItem("idGuardado", extraerParametros(document.URL).producto )
        
        const parametroExtraido= extraerParametros(document.URL).comercio
       

        //console.log("parametroextraido producto===============", parametroExtraido)
    
    
    
    
    
        //busco vendedor en el parametro de la url
        if(parametroExtraido!=null && parametroExtraido.length>0){
           

            //console.log("vendedor========================", parametroExtraido)
            const comercio= parametroExtraido.replace(/_/g, " ")
    
        
            //window.location="carrito.html?vendedor="+vendedor;
            //buscarComercio(comercio)

         }else{
    
    
         // segunda opcion busco vendedor en el local storage. Primero url para que la venta se la lleve el que compartio el link de la venta.
         vendedorFicha= JSON.parse(localStorage.getItem("vendedorFicha"))
         
         if(vendedorFicha!=null){
            vendedor= vendedorFicha.nick
            //console.log("vendedor738:"+vendedor)
            //window.location="carrito.html?vendedor="+vendedor;
            buscarVendedor(vendedor)
    
        }
          // si no encuenctro, busco todos los vendedores
          else{
            //console.log("parametroVendedor no encontrado")
            buscarVendedor()
       
        }
    }
       
        
        
        
      
        
        
        ////console.log(extraerParametros(document.URL).producto);
     
        // {prop1: v1, prop2: v2, prop3: v3}
    } catch (e) {
         
        //console.log(`Error: ${e.message}`);
   
    }
    */

    function pintarProductoDestacado(){

        destacado.style.display="block"

        var producto= extraerParametros(document.URL).producto
        //console.log("producto destacado function")

    if(producto != undefined && producto!=null && producto != ""){
        //console.log("producto distinto de vacio")

        bbddProductos.forEach(item => {
            ////console.log(item.data().id, producto)
            if(item.data().id === producto){

                //stock?

                if(item.data().stock===0){
                    productoDestacado.querySelector('.stock').textContent = "Sin stock"
                    btnAgregar2.style.display="none"
                }


                //console.log("imagen", item.data().imagen)
                productoDestacado.querySelector('.titulo').textContent = item.data().title
                productoDestacado.querySelector('.precio').textContent = item.data().precio



                productoDestacado.querySelector('img').setAttribute('src', item.data().imagen)

                

                if(item.data().tamano ===undefined){
                    productoDestacado.querySelector('.cantidad').textContent = 0
                   }else{
                   productoDestacado.querySelector('.cantidad').textContent = item.data().tamano+item.data().medida}
                 

                  productoDestacado.querySelector('.btn-primary').dataset.id = item.data().id
                  productoDestacado.querySelector('.btn-primary').dataset.imagen = item.data().imagen
                   productoDestacado.querySelector('.btn-primary').dataset.marca = item.data().marca
                   productoDestacado.querySelector('.btn-primary').dataset.precio = item.data().precio
                   productoDestacado.querySelector('.btn-primary').dataset.title = item.data().title
                   productoDestacado.querySelector('.btn-primary').dataset.total = item.data().total
                   productoDestacado.querySelector('.btn-primary').dataset.categoria = item.data().categoria

                   productoDestacado.querySelector('.btn-primary').dataset.cantidad = item.data().cantidad
                   productoDestacado.querySelector('.btn-primary').dataset.tamano = item.data().tamano
                   productoDestacado.querySelector('.btn-primary').dataset.medida = item.data().medida

                   productoDestacado.querySelector('.btn-primary').dataset.id = item.data().id

                }
        });

        //btnAgregar2.addEventListener("click", e =>{//console.log("boton agregar222222222222222"), addCarrito(e)})
       

    }else {
        //borrar producto destacado
        destacado.style.display="none"
    }
    }
