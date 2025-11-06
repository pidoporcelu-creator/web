// Función para aumentar/disminuir cantidad en el carrito desde el evento click
export function btnAumentarDisminuir(e) {
    const target = e.target;
    let comercioUid = null;
    if (window.comercioGlobal && window.comercioGlobal.uid) {
        comercioUid = window.comercioGlobal.uid;
    } else {
        const keys = Object.keys(localStorage);
        comercioUid = keys.find(k => {
            try {
                const obj = JSON.parse(localStorage.getItem(k));
                return obj && obj.productos;
            } catch { return false; }
        });
    }
    if (!comercioUid) comercioUid = 'carrito';

    let carrito = JSON.parse(localStorage.getItem(comercioUid));
    if (!carrito || !carrito.productos) return;

    let id = target.dataset.id;
    let changed = false;
    if (target.classList.contains('btn-success')) {
        if (carrito.productos[id]) {
            carrito.productos[id].cantidad += 1;
            changed = true;
        }
    } else if (target.classList.contains('btn-danger')) {
        if (carrito.productos[id] && carrito.productos[id].cantidad > 1) {
            carrito.productos[id].cantidad -= 1;
            changed = true;
        }
        if( carrito.productos[id] && carrito.productos[id].cantidad <= 1) {
            delete carrito.productos[id];
            changed = true;
        }
    }
    if (changed) {
        localStorage.setItem(comercioUid, JSON.stringify(carrito));
        // Actualizar solo la fila del producto en el DOM
        const row = target.closest('tr');
        if (row) {
            // Actualizar cantidad
            const cantidadTd = row.querySelectorAll('td')[3];
            if (cantidadTd) cantidadTd.textContent = carrito.productos[id].cantidad;
            // Actualizar precio
            const priceSpan = row.querySelector('span');
            if (priceSpan && row.querySelectorAll('td')[1]) {
                let precioUnitario = priceSpan.dataset.precio ? parseFloat(priceSpan.dataset.precio) : null;
                if (!precioUnitario) {
                    precioUnitario = priceSpan.textContent ? parseFloat(priceSpan.textContent) / carrito.productos[id].cantidad : 0;
                }
                priceSpan.textContent = (precioUnitario * carrito.productos[id].cantidad).toFixed(0);
            }
        }
        // Recalcular totales del carrito
        let totalCarrito = 0;
        let cantidadProductos = 0;
        Object.values(carrito.productos).forEach(prod => {
            totalCarrito += prod.precio ? prod.precio * prod.cantidad : 0;
            cantidadProductos += prod.cantidad;
        });
        carrito.total = totalCarrito;
        carrito.cantidad = cantidadProductos;
        // Actualizar footer
        if (window.pintarFooter && typeof window.pintarFooter === 'function') {
            const footer = document.getElementById('footer');
            const cantidadDeProductos = document.getElementById('insignia');
            const btnEnviar = document.getElementById('btnEnviar');
            window.pintarFooter({
                footer,
                carrito,
                cantidadDeProductos,
                taskFormEnviar: btnEnviar
            });
        }
        // Actualizar resumen de compra
        const resumenDiv = document.getElementById('resumenCompra');
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
            `;
            resumenDiv.appendChild(resumenSection);
        }
    }
}
// functions/funciones.js

// Importaciones necesarias para las funciones
import { Carrito, Score, Usuario, Comercio, Producto } from "./objetos.js";

// Declara la variable para la instancia de Firestore, pero no la asigna todavía.
let _dbInstance; 

// ✅ MEJOR PRÁCTICA: Exportar la configuración para que otros scripts puedan usarla.
export let firebaseConfig = {};

/**
 * Inicializa la aplicación de Firebase.
 * Debe ser llamada antes de intentar acceder a cualquier servicio de Firebase.
 */
export function iniciarFirebase() {
    // Evita inicializar la aplicación múltiples veces.
    if (!firebase.apps.length) {
        // ⬇️ REEMPLAZA ESTOS VALORES CON LOS DE TU NUEVO PROYECTO DE FIREBASE ⬇️
        firebaseConfig = {
            //tienda1

            /*
            apiKey: "AIzaSyABT6UlDO81MNfDcgcdWXy53wLIWKm0oD0",
            authDomain: "tienda1-81220.firebaseapp.com",
            databaseURL: "https://tienda1-81220-default-rtdb.firebaseio.com",
            projectId: "tienda1-81220",
            storageBucket: "tienda1-81220.appspot.com",
            messagingSenderId: "566253241992",
            appId: "1:566253241992:web:71d160ed0e5d7a74c1013d",
            measurementId: "G-1N8XR9T0RQ"
*/
            //prueba1 pidoporcelu

            apiKey: "AIzaSyAomkyCAR5RPOTqMHu3Nz-uxH6wXMznR1w",
            authDomain: "pidoporcelu-5bbf8.firebaseapp.com",
            databaseURL: "https://pidoporcelu-5bbf8-default-rtdb.firebaseio.com",
            projectId: "pidoporcelu-5bbf8",
            storageBucket: "pidoporcelu-5bbf8.appspot.com",
            messagingSenderId: "200203661599",
            appId: "1:200203661599:web:2379651fe51bda2e69802a",
            measurementId: "G-LNS1HYSF39" // Opcional
        };

        firebase.initializeApp(firebaseConfig);

        // La configuración de Firestore para compatibilidad con Timestamps se eliminó para evitar advertencias de sobreescritura de host.
    }
    // Asigna la instancia de Firestore a la variable de módulo después de la inicialización.
    _dbInstance = firebase.firestore(); 
    console.log("Firebase inicializado y Firestore disponible (desde funciones.js)");
}

/**
 * Retorna la instancia de Firestore.
 * Asegúrate de llamar a `iniciarFirebase()` antes de usar esta función.
 * @returns {firebase.firestore.Firestore} La instancia de Firestore.
 */
export function getFirestoreDb() {
    if (!_dbInstance) {
        console.error("Firestore DB no inicializado. Llama a iniciarFirebase() primero.");
        // Opcional: podrías lanzar un error aquí si el comportamiento no inicializado es crítico.
        // throw new Error("Firestore DB no inicializado.");
    }
    return _dbInstance;
}

/**
 * Extrae parámetros de la URL.
 * @param {string} url La URL de la que extraer los parámetros.
 * @returns {object} Un objeto con los parámetros de la URL.
 */
export function extraerParametros(url) {
    const params = {};
    new URL(url).searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}

/**
 * Verifica si el comercio está abierto en el horario actual considerando turnos numerados.
 * @param {object} horarioDeAtencion Objeto con los horarios de atención del comercio.
 * @returns {boolean} True si el comercio está abierto, false en caso contrario.
 */
export function verificarSiEstaAbiertoElComercio(horarioDeAtencion) {
    console.log("horarioDeAtencion: ", horarioDeAtencion);
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 para domingo, 1 para lunes, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    console.log('Fecha actual:', now);
    console.log('Día de la semana:', dayOfWeek);
    console.log('Hora actual:', currentHour, 'Minuto actual:', currentMinute);

    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const today = days[dayOfWeek];
    console.log('Hoy es:', today);

    if (!horarioDeAtencion || !horarioDeAtencion[today]) {
        console.log(`No hay horario definido para ${today}.`);
        return false;
    }

    const daySchedule = horarioDeAtencion[today];
    console.log('Horario del día:', daySchedule);
    if (!daySchedule.abierto) {
        console.log(`Comercio cerrado hoy ${today}.`);
        return false;
    }

    // Si hay turnos numerados, verificar cada uno
    if (daySchedule.turnos) {
        const currentTime = currentHour * 60 + currentMinute;
        console.log('Turnos encontrados:', daySchedule.turnos);
        for (const turnoNum in daySchedule.turnos) {
            const turno = daySchedule.turnos[turnoNum];
            const [openHour, openMinute] = turno.apertura.split(':').map(Number);
            const [closeHour, closeMinute] = turno.cierre.split(':').map(Number);
            const openTime = openHour * 60 + openMinute;
            const closeTime = closeHour * 60 + closeMinute;
            console.log(`Turno ${turnoNum}: apertura ${openTime} cierre ${closeTime} (actual ${currentTime})`);
            if (closeTime < openTime) {
                // Horario que pasa por la medianoche
                if (currentTime >= openTime || currentTime <= closeTime) {
                    console.log(`Comercio abierto en turno ${turnoNum} (pasa medianoche)`);
                    return true;
                }
            } else {
                if (currentTime >= openTime && currentTime <= closeTime) {
                    console.log(`Comercio abierto en turno ${turnoNum}`);
                    return true;
                }
            }
        }
        console.log('Ningún turno activo. Comercio cerrado.');
        return false;
    }

    // Si no hay turnos, usar apertura/cierre general
    const { apertura, cierre } = daySchedule;
    const [openHour, openMinute] = apertura.split(':').map(Number);
    const [closeHour, closeMinute] = cierre.split(':').map(Number);
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    const currentTime = currentHour * 60 + currentMinute;
    console.log(`Horario general: apertura ${openTime} cierre ${closeTime} (actual ${currentTime})`);
    if (closeTime < openTime) {
        if (currentTime >= openTime || currentTime <= closeTime) {
            console.log('Comercio abierto (pasa medianoche)');
            return true;
        } else {
            console.log('Comercio cerrado (pasa medianoche)');
            return false;
        }
    } else {
        if (currentTime >= openTime && currentTime <= closeTime) {
            console.log('Comercio abierto');
            return true;
        } else {
            console.log('Comercio cerrado');
            return false;
        }
    }
}

/**
 * Calcula los totales (cantidad, precio, peso) de los productos en un carrito.
 * @param {Array<Object>} productosArray Un array de objetos de producto con propiedades cantidad, precio y tamano.
 * @returns {Object} Un objeto con nCantidadTotal, nPrecioTotal y nPesoTotal.
 */
export function calcularTotalesCarrito(productosArray) {
    let nCantidadTotal = 0;
    let nPrecioTotal = 0;
    let nPesoTotal = 0;

    productosArray.forEach(producto => {
        nCantidadTotal += producto.cantidad || 0;
        nPrecioTotal += (producto.precio * producto.cantidad) || 0;
        nPesoTotal += (producto.tamano * producto.cantidad) || 0;
    });

    return { nCantidadTotal, nPrecioTotal, nPesoTotal };
}

/**
 * Aumenta o disminuye la cantidad de un producto.
 * @param {Event} e El evento de clic.
 * @param {Object} producto El objeto producto a actualizar.
 * @returns {Object} El producto actualizado.
 */
export function aumentarDisminuir(e, producto) {
    const newProducto = { ...producto }; // Crea una copia para no mutar el original directamente

    if (e.target.classList.contains('btn-success')) {
        newProducto.cantidad++;
    } else if (e.target.classList.contains('btn-danger')) {
        newProducto.cantidad--;
    }

    // Recalcular el total y totalPeso para este producto
    newProducto.total = newProducto.precio * newProducto.cantidad;
    newProducto.totalPeso = newProducto.tamano * newProducto.cantidad;

    return newProducto;
}

/**
 * Busca los datos del comercio en Firestore usando el UID y los retorna.
 * @param {string} uid - El UID del comercio a buscar.
 * @returns {Promise<Object|null>} Una promesa que resuelve con los datos del comercio o null si no se encuentra.
 */
export async function buscarYGuardarComercio(uid) { // Renombrado para reflejar que también guarda
    console.log(`Buscando comercio ${uid} en Firebase...`);
    const db = getFirestoreDb(); // Obtiene la instancia de Firestore
    
    const docRef = db.collection("comercios").doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const comercioData = docSnap.data();
        comercioData.uid = uid; // Asegura que el UID esté en el objeto
        console.log("Datos de comercio cargados de Firebase:", comercioData);
        // La lógica de guardar en localStorage se manejará en carrito.js
        return comercioData;
    } else {
        console.error("Comercio no encontrado en Firebase:", uid);
        return null;
    }
}

/**
 * Pinta los descuentos en la interfaz de usuario.
 * @param {object} data Objeto con los cupones de descuento.
 * @param {HTMLElement} descuentosElement El elemento DOM donde se pintarán los descuentos.
 * @param {HTMLTemplateElement} templateDescuentosElement El template HTML para un descuento.
 * @param {DocumentFragment} fragmentElement El fragmento de documento para optimización.
 * @param {number} total El total actual del carrito (para calcular descuentos).
 * @param {Function} pintarFooter2Callback La función para pintar el segundo footer.
 */
export const pintarDescuento = (data, descuentosElement, templateDescuentosElement, fragmentElement, total, pintarFooter2Callback) => {
    console.log("pintarDescuento (desde funciones.js)");
    descuentosElement.innerHTML = '';
    
    Object.values(data).forEach(function (cupon) {
        let descuentoCalculado = 0;
        if(cupon.tipo === "descuento"){
            descuentoCalculado = total * ((cupon.cantidad) / 100);
            if(descuentoCalculado > cupon.tope){
                cupon.descuento = cupon.tope;
            } else { 
                cupon.descuento = -descuentoCalculado;
            }
        } else if(cupon.tipo === "montoFijo"){
            cupon.descuento = cupon.cantidad; // Si es monto fijo, la cantidad es el descuento
        } else if(cupon.tipo === "regalo"){
            cupon.descuento = 0;
        }
        
        templateDescuentosElement.querySelectorAll('td')[1].textContent = cupon.descripcion;
        templateDescuentosElement.querySelector('span').textContent = -cupon.descuento;

        templateDescuentosElement.querySelector('.btn').dataset.id = cupon.id;
        const clone = templateDescuentosElement.cloneNode(true);
        fragmentElement.appendChild(clone);
    });
    
    descuentosElement.appendChild(fragmentElement);
    pintarFooter2Callback(data, total); // Pasa 'total' a pintarFooter2
};


/**
 * Suma los descuentos de una lista de cupones.
 * @param {object} lista Objeto con los cupones.
 * @returns {number} El total de los descuentos.
 */
export function sumarLista(lista) {
    var total = 0;
    if (lista != null) {
        Object.values(lista).forEach(function (item) {
            total += item.descuento;
        });
        return total;
    } else {
        return 0;
    }
}

/**
 * Pinta el segundo footer (relacionado con descuentos).
 * @param {object} listaCupones Objeto con los cupones de descuento.
 * @param {number} currentTotal El total actual del carrito antes de descuentos.
 * @param {HTMLElement} footer2Element El elemento DOM del segundo footer.
 * @param {HTMLTemplateElement} templateFooter2Element El template HTML para el segundo footer.
 * @param {DocumentFragment} fragmentElement El fragmento de documento para optimización.
 */
export const pintarFooter2 = (listaCupones, currentTotal, footer2Element, templateFooter2Element, fragmentElement) => {
    console.log("pintarFooter2 (desde funciones.js)");
    footer2Element.innerHTML = `
    <th scope="row" colspan="5">Carrito vacío. Toca en las imágenes para agregar los productos al carrito.</th>
    `;
    let totalDescuentos = sumarLista(listaCupones);
    let totalConDescuento = currentTotal - totalDescuentos; // Usa currentTotal
    
    templateFooter2Element.querySelectorAll('td')[2].textContent = "";
    templateFooter2Element.querySelector('span').textContent = totalConDescuento.toFixed(2);
    const clone = templateFooter2Element.cloneNode(true);
    fragmentElement.appendChild(clone);
    footer2Element.appendChild(fragmentElement);
};


/**
 * Guarda un pedido en Firestore.
 * @param {Usuario} usuario La instancia del usuario que realiza la compra.
 * @param {Carrito} carrito La instancia del carrito con los productos.
 * @param {Comercio} comercioGlobal La instancia del comercio.
 * @returns {Promise<void>} Una promesa que se resuelve cuando el pedido es guardado.
 */
export function guardarPedido(usuario, carrito, comercioGlobal) {
    console.log("guardarPedido (desde funciones.js): Iniciando...");
    const db = getFirestoreDb(); // Obtiene la instancia de Firestore

    if (!comercioGlobal || !comercioGlobal.uid) {
        console.error("guardarPedido: Objeto comercioGlobal no válido. No se puede guardar el pedido.");
        alert("Error: Datos del comercio no disponibles. No se pudo procesar tu compra.");
        return Promise.reject(new Error("ComercioGlobal no válido."));
    }
    
    const ref = db.collection("ventas").doc();
    const refId = ref.id;

    return ref.set({
        "usuario": usuario.toFirestore(),
        "comercio": comercioGlobal,
        "estado": "Sin procesar",
        "fecha": firebase.firestore.FieldValue.serverTimestamp(),
        "id": refId,
        "logistica": "envio",
        "nota": "",
        "total": carrito.total,
        "carrito": carrito.toFirestore(),
    })
    .then(() => {
        console.log("Compra exitosa con ID:", refId);
        alert("¡Compra realizada con éxito!");
        // La lógica de limpiar el carrito y refrescar la UI se moverá a carrito.js
    })
    .catch((error) => {
        console.error("Error al guardar el pedido:", error);
        alert("No se pudo procesar tu compra. Verifica tu conexión a internet y vuelve a intentar.");
        throw error; // Propagar el error
    });
}

/**
 * Función de inicialización para el botón de WhatsApp.
 * @param {object} vendedorFicha Objeto con la información del vendedor, incluyendo el teléfono.
 */
export function initWhatsapp(vendedorFicha) {
    const telefono = vendedorFicha.telefono;
    console.log("initWhatsapp()", telefono);
    
    if (telefono > 0) {
        console.log("length > 0");
        let a = createA("https://api.whatsapp.com/send?phone=+54" + telefono + "&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta", "whatsapp");
        document.body.appendChild(a);
    } else {
        console.log("length < 0");
        let a = createA("vendedores.html", "whatsapp");
        document.body.appendChild(a);
    }
}
 
/**
 * Crea un elemento 'a' con un icono de WhatsApp.
 * @param {string} link El URL para el enlace.
 * @param {string} text El texto alternativo o clase para el icono.
 * @returns {HTMLElement} El elemento 'a' creado.
 */
export function createA(link, text) {
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

/**
 * Filtra los datos de productos y pinta los filtros de categorías y marcas.
 * @param {firebase.firestore.QuerySnapshot} bbddProductosSnapshot El snapshot de la colección de productos.
 * @param {HTMLElement} categoriasElement El elemento DOM para las categorías.
 * @param {HTMLElement} marcasElement El elemento DOM para las marcas.
 * @param {HTMLElement} todasElement El elemento DOM para el botón "Todas".
 * @param {HTMLTemplateElement} templateCategoriasElement El template para las categorías.
 * @param {DocumentFragment} fragmentElement El fragmento de documento para optimización.
 */
export function filtrarDatos(bbddProductosSnapshot, categoriasElement, marcasElement, todasElement, templateCategoriasElement, fragmentElement) {
    console.log("filtrar datos (desde funciones.js)");
    let categorias1 = [];
    let marcas1 = [];

    bbddProductosSnapshot.forEach(item => {
        categorias1.push(item.data().categoria);
        marcas1.push(item.data().marca);
    });

    categorias1.sort();
    marcas1.sort();
    
    const categorias = new Set(categorias1);
    const marcas = new Set(marcas1);

    pintarFiltros(categorias, "categorias", "categoria", categoriasElement, templateCategoriasElement, fragmentElement);
    pintarFiltros(marcas, "marcas", "marca", marcasElement, templateCategoriasElement, fragmentElement);
}

/**
 * Pinta los filtros en el DOM.
 * @param {Set<string>} itemsSet El conjunto de ítems (categorías o marcas).
 * @param {string} filtroId El ID del contenedor de filtros en el DOM.
 * @param {string} datasetId El ID para el dataset del elemento.
 * @param {HTMLElement} containerElement El elemento DOM donde se insertarán los filtros.
 * @param {HTMLTemplateElement} templateCategoriasElement El template para las categorías.
 * @param {DocumentFragment} fragmentElement El fragmento de documento para optimización.
 */
export function pintarFiltros(itemsSet, filtroId, datasetId, containerElement, templateCategoriasElement, fragmentElement) {
    console.log("pintar filtros (desde funciones.js)");

    itemsSet.forEach(item => {
        templateCategoriasElement.querySelector('a').setAttribute('id', item);
        templateCategoriasElement.querySelector('a').textContent = item;
        templateCategoriasElement.querySelector('a').dataset.id = datasetId;
        templateCategoriasElement.querySelector('li').setAttribute('class', filtroId);
        templateCategoriasElement.querySelector('li').setAttribute('id', "idFiltro" + filtroId + item);

        const clone = templateCategoriasElement.cloneNode(true);
        fragmentElement.appendChild(clone);
    });
    
    containerElement.appendChild(fragmentElement);
}

/**
 * Filtra productos basándose en un buscador.
 * @param {string} buscador El texto a buscar en los títulos de los productos.
 * @param {firebase.firestore.QuerySnapshot} bbddProductosSnapshot El snapshot de la colección de productos.
 */
export const filtrar = (buscador, bbddProductosSnapshot) => {
    console.log("filtrar (desde funciones.js)");
    bbddProductosSnapshot.forEach(item => {
        // Esta lógica de manipulación DOM debería estar en el script principal.
        const productElement = document.getElementById(item.data().id);
        if (productElement) {
            if (item.data().title.toLowerCase().includes(buscador.toLowerCase())) {
                productElement.style.display = "block";
            } else {
                productElement.style.display = "none";
            }
        }
    }); 
};

/**
 * Maneja la selección de un filtro (categoría o marca).
 * @param {Event} e El evento de clic.
 * @param {firebase.firestore.QuerySnapshot} bbddProductosSnapshot El snapshot de la colección de productos.
 */
export const filtroSeleccionado = (e, bbddProductosSnapshot) => {
    console.log("filtroSeleccionado (desde funciones.js)");
    if (e.target.textContent === "Todas") {
        window.location.reload(); // Recargar la página para mostrar todos los productos
    } else {
        const filtroValue = e.target.textContent;
        const datasetId = e.target.dataset.id;

        bbddProductosSnapshot.forEach(item => {
            let shouldDisplay = false;
            if (datasetId === "categoria" && item.data().categoria === filtroValue) {
                shouldDisplay = true;
            } else if (datasetId === "marca" && item.data().marca === filtroValue) {
                shouldDisplay = true;
            }
            
            const productElement = document.getElementById(item.data().id);
            if (productElement) {
                productElement.style.display = shouldDisplay ? "block" : "none";
            }
        });
        // Opcional: colorear el filtro elegido (esto también debería ser manejado por el script principal)
        const selectedFilterElement = document.getElementById('idFiltro' + datasetId + filtroValue);
        if (selectedFilterElement) {
            selectedFilterElement.style.color = '#FF0000';
        }
    }
};

/**
 * Muestra una subsección.
 * @param {number} n El número de la subsección.
 */
export function ver(n) {
    const subseccion = document.getElementById("subseccion" + n);
    if (subseccion) subseccion.style.display = "block";
}

/**
 * Oculta una subsección.
 * @param {number} n El número de la subsección.
 */
export function ocultar(n) {
    const subseccion = document.getElementById("subseccion" + n);
    if (subseccion) subseccion.style.display = "none";
}

/**
 * Busca y muestra el estado de apertura del comercio.
 * @param {object} horarioDeAtencion El objeto con los horarios de atención del comercio.
 * @param {HTMLElement} horarioElement El elemento DOM donde se mostrará el estado.
 * @param {Function} pintarFooterCallback La función para pintar el footer.
 */
export function buscarHorarios(horarioDeAtencion, horarioElement, pintarFooterCallback) {
    console.log("buscarHorarios (desde funciones.js)");  
    const abierto = verificarSiEstaAbiertoElComercio(horarioDeAtencion);
    if (horarioElement) horarioElement.style.display = 'block';
    
    if (abierto) {
       if (horarioElement) horarioElement.innerHTML = `<h3><b></b>Comercio Abierto</h3>`;
    } else {
       if (horarioElement) horarioElement.innerHTML = `<h3><h3><b></b>Comercio Cerrado</h3>`;
    }
    if (pintarFooterCallback) pintarFooterCallback();
}

/**
 * Recupera datos de usuario (ej. de localStorage).
 * @param {object} firebaseUser El objeto de usuario de Firebase Auth (firebase.auth().currentUser).
 * @param {Function} mostrarCamposCallback La función para mostrar campos de usuario.
 * @returns {Usuario} La instancia del usuario recuperado o nueva.
 */
export function recuperarDatos(firebaseUser, mostrarCamposCallback) {
    const usuarioData = localStorage.getItem("usuario"); // Asumo que la clave es "usuario"
    let usuarioInstance;

    if (usuarioData) {
        const parsedUsuario = JSON.parse(usuarioData);
        // Asegúrate de que el UID del usuario logeado coincida con el del localStorage si es necesario
        // if (firebaseUser && firebaseUser.uid === parsedUsuario.uid) { // Descomentar si necesitas verificar UID
            usuarioInstance = new Usuario(
                parsedUsuario.nombre,
                parsedUsuario.direccion,
                parsedUsuario.telefono,
                parsedUsuario.email,
                parsedUsuario.dni,
                parsedUsuario.envioGratis,
                parsedUsuario.lat,
                parsedUsuario.lon,
                parsedUsuario.minimoEnvioGratis,
                parsedUsuario.referencia,
                parsedUsuario.rol,
                parsedUsuario.saldo
            );
            console.log("Usuario recuperado de localStorage:", usuarioInstance);
            if (mostrarCamposCallback) mostrarCamposCallback(usuarioInstance);
            return usuarioInstance;
        // }
    }
    
    console.log("No se encontró usuario guardado o no coincide. Creando nuevo Usuario.");
    usuarioInstance = new Usuario();
    if (mostrarCamposCallback) mostrarCamposCallback(usuarioInstance); // Mostrar campos con valores por defecto
    return usuarioInstance;
}

/**
 * Muestra y rellena los campos de información privada del usuario.
 * @param {Usuario} usuario La instancia del usuario.
 * @param {HTMLElement} hiddenPrivateInfo3Element El elemento DOM contenedor.
 */
export function mostrarCampos(usuario, hiddenPrivateInfo3Element) {
    console.log("mostrarCampos (desde funciones.js)");
    console.log("usuario.direccion: ",usuario)
    if (!hiddenPrivateInfo3Element) {
        console.error("Elemento hiddenPrivateInfo3 no encontrado.");
        return;
    }
    
    hiddenPrivateInfo3Element.style.display = 'block';
    hiddenPrivateInfo3Element.innerHTML = `
       

        <br>
        Referencia: <br>
        <input
            class="input w-full max-w-lg"
            type="text"
            name="referencia"
            id="referencia"
            placeholder="Ej: casa verde, por ejemplo"
            value="${usuario.referencia || ''}"
            required
        />
        <br>
           Nombre: <br>
        <input
            class="input w-full max-w-lg"
            type="text"
            name="nombre"
            id="nombre"
            placeholder="Nombre y apellido"
            value="${usuario.nombre || ''}"
            required
        />
        <br>
       <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Teléfono:</label>
            <div id="telefono" class="w-full max-w-lg px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 flex items-center gap-2 select-none cursor-not-allowed" style="margin-bottom: 4px;">
                <i class="bi bi-lock-fill text-gray-400"></i>
                <span>${usuario.telefono ? usuario.telefono : '<span class="text-gray-400">Sin teléfono</span>'}</span>
            </div>
            <!-- El span de errorTelefono ya no es necesario si el campo no es editable -->
        </div>
        <br>
  
    `;

    const campoDireccion = hiddenPrivateInfo3Element.querySelector('#addressInput');
    const campoReferencia = hiddenPrivateInfo3Element.querySelector('#referencia');
    const campoNombre = hiddenPrivateInfo3Element.querySelector('#nombre');  
    const errorReferencia = hiddenPrivateInfo3Element.querySelector('#errorReferencia');
    const errorNombre = hiddenPrivateInfo3Element.querySelector('#errorNombre');
    // Adjuntar el event listener para el campo de dirección dinámicamente
    if (campoDireccion) {
        campoDireccion.addEventListener('input', function() {
            const valorDireccion = this.value.trim();

            if (valorDireccion.length === 0) {
 
                campoDireccion.classList.add('is-invalid');
                campoDireccion.classList.remove('is-valid');
                campoDireccion.setCustomValidity('La dirección no puede estar vacía.');
            } else {
               
                campoDireccion.classList.remove('is-invalid');
                campoDireccion.classList.add('is-valid');
                campoDireccion.setCustomValidity('');
            }
            campoDireccion.reportValidity();
        });
    } 
    if (campoReferencia && errorReferencia) {
        campoReferencia.addEventListener('input', function() {
            const valorReferencia = this.value.trim();

            if (valorReferencia.length === 0) {
                errorReferencia.textContent = 'La referencia no puede estar vacía.';
                errorReferencia.style.color = 'red';
                campoReferencia.classList.add('is-invalid');
                campoReferencia.classList.remove('is-valid');
                campoReferencia.setCustomValidity('La referencia no puede estar vacía.');
            } else {
                errorReferencia.textContent = 'Referencia válida';
                errorReferencia.style.color = 'green';
                campoReferencia.classList.remove('is-invalid');
                campoReferencia.classList.add('is-valid');
                campoReferencia.setCustomValidity('');
            }
            campoReferencia.reportValidity();
        });
    }
    if (campoNombre && errorNombre) {
        campoNombre.addEventListener('input', function() {
            const valorNombre = this.value.trim();

            if (valorNombre.length === 0) {
                errorNombre.textContent = 'El nombre no puede estar vacío.';
                errorNombre.style.color = 'red';
                campoNombre.classList.add('is-invalid');
                campoNombre.classList.remove('is-valid');
                campoNombre.setCustomValidity('El nombre no puede estar vacío.');
            } else {
                errorNombre.textContent = 'Nombre válido';
                errorNombre.style.color = 'green';
                campoNombre.classList.remove('is-invalid');
                campoNombre.classList.add('is-valid');
                campoNombre.setCustomValidity('');
            }
            campoNombre.reportValidity();
        });
    }

    // Adjuntar el event listener para el campo de teléfono dinámicamente
    const campoTelefono = hiddenPrivateInfo3Element.querySelector('#telefono');
    const errorTelefono = hiddenPrivateInfo3Element.querySelector('#errorTelefono');

    if (campoTelefono && errorTelefono) {
        campoTelefono.addEventListener('input', function() {
            const valorTelefono = this.value.trim();

            if (valorTelefono.length === 0) {
                errorTelefono.textContent = 'El teléfono no puede estar vacío.';
                errorTelefono.style.color = 'red';
                campoTelefono.classList.add('is-invalid');
                campoTelefono.classList.remove('is-valid');
                campoTelefono.setCustomValidity('El teléfono no puede estar vacío.');
                campoTelefono.reportValidity();
            } else if (/\D/.test(valorTelefono)) {
                errorTelefono.textContent = 'Por favor, ingresa solo números (0-9).';
                errorTelefono.style.color = 'red';
                campoTelefono.classList.add('is-invalid');
                campoTelefono.classList.remove('is-valid');
                campoTelefono.setCustomValidity('Por favor, ingresa solo números (0-9).');
                campoTelefono.reportValidity();
            } else if (valorTelefono.length !== 10) {
                errorTelefono.textContent = 'El teléfono debe tener exactamente 10 dígitos.';
                errorTelefono.style.color = 'red';
                campoTelefono.classList.add('is-invalid');
                campoTelefono.classList.remove('is-valid');
                campoTelefono.setCustomValidity('El teléfono debe tener exactamente 10 dígitos.');
                campoTelefono.reportValidity();
            } else {
                errorTelefono.textContent = 'Teléfono válido';
                errorTelefono.style.color = 'green';
                campoTelefono.classList.remove('is-invalid');
                campoTelefono.classList.add('is-valid');
                campoTelefono.setCustomValidity('');
            }
        });
    }
}

/**
 * Pinta el carrito en la tabla indicada, usando el template y los datos provistos.
 * @param {Object} params
 * @param {Object} params.carrito - Objeto carrito (con productos)
 * @param {Object} params.bbddProductos - Documento de productos de Firestore (con .data().productos)
 * @param {HTMLElement} params.items - Elemento tbody donde se pintan los productos
 * @param {DocumentFragment} params.templateCarrito - Template del producto
 * @param {HTMLElement|null} params.offcanvasItems - (opcional) Elemento tbody del offcanvas
 */
export function pintarCarrito({ carrito, bbddProductos, items, templateCarrito, offcanvasItems = null }) {
    items.innerHTML = '';
    if (!templateCarrito) return;
    if (!carrito.productos || Object.keys(carrito.productos).length === 0) return;
    if (!bbddProductos || !bbddProductos.data || !bbddProductos.data().productos) return;

    const productosDbArray = bbddProductos.data().productos;
    const productosMap = {};
    productosDbArray.forEach(prod => { productosMap[prod.id] = prod; });

    Object.values(carrito.productos).forEach(function (productoEnCarrito) {
        const idProductoCarrito = productoEnCarrito.id;
        const productoDb = productosMap[idProductoCarrito];
        if (productoDb && productoDb.stock > 0 && productoEnCarrito.cantidad > 0) {
            // Clonar el <tr> del template correctamente
            const cloneFragment = templateCarrito.cloneNode(true);
            const clonedRow = cloneFragment.firstElementChild || cloneFragment.querySelector('tr');
            if (!clonedRow) return;
            const tdElements = clonedRow.querySelectorAll('td');
            // Primer <td>: imagen
            if (tdElements[0]) {
                const img = tdElements[0].querySelector('img');
                if (img) {
                    img.setAttribute('src', productoEnCarrito.imagen || productoDb.imagen);
                    img.setAttribute('alt', productoDb.title);
                }
            }
            // Segundo <td>: nombre
            if (tdElements[1]) tdElements[1].textContent = productoDb.title;
            // Tercer <td>: cantidad
            if (tdElements[3]) tdElements[3].textContent = productoEnCarrito.cantidad;
            // Botones
            const btnSuccess = clonedRow.querySelector('.btn-success');
            if (btnSuccess) btnSuccess.dataset.id = productoEnCarrito.id;
            const btnDanger = clonedRow.querySelector('.btn-danger');
            if (btnDanger) btnDanger.dataset.id = productoEnCarrito.id;
            // Precio
            let priceSpan = clonedRow.querySelector('.product-total-price') || clonedRow.querySelector('span');
            if (priceSpan) priceSpan.textContent = (productoDb.precio * productoEnCarrito.cantidad).toFixed(0);
            items.appendChild(clonedRow);
            // Offcanvas
            if (offcanvasItems) {
                const offcanvasCloneFragment = templateCarrito.cloneNode(true);
                const offcanvasClonedRow = offcanvasCloneFragment.firstElementChild || offcanvasCloneFragment.querySelector('tr');
                if (offcanvasClonedRow) {
                    const offcanvasTdElements = offcanvasClonedRow.querySelectorAll('td');
                    if (offcanvasTdElements[0]) {
                        const img2 = offcanvasTdElements[0].querySelector('img');
                        if (img2) {
                            img2.setAttribute('src', productoEnCarrito.imagen || productoDb.imagen);
                            img2.setAttribute('alt', productoDb.title);
                        }
                    }
                    if (offcanvasTdElements[1]) offcanvasTdElements[1].textContent = productoDb.title;
                    if (offcanvasTdElements[2]) offcanvasTdElements[2].textContent = productoEnCarrito.cantidad;
                    const btnSuccess2 = offcanvasClonedRow.querySelector('.btn-success');
                    if (btnSuccess2) btnSuccess2.dataset.id = productoEnCarrito.id;
                    const btnDanger2 = offcanvasClonedRow.querySelector('.btn-danger');
                    if (btnDanger2) btnDanger2.dataset.id = productoEnCarrito.id;
                    let offcanvasPriceSpan = offcanvasClonedRow.querySelector('.product-total-price') || offcanvasClonedRow.querySelector('span');
                    if (offcanvasPriceSpan) offcanvasPriceSpan.textContent = (productoDb.precio * productoEnCarrito.cantidad).toFixed(2);
                    offcanvasItems.appendChild(offcanvasClonedRow);
                }
            }
        }
    });
}

/**
 * Pinta el pie de página del carrito con los totales.
 * Puede usarse tanto en catálogo como en carrito.
 * @param {Object} params - Parámetros para la función.
 * @param {HTMLElement} params.footer - Elemento footer donde se pinta.
 * @param {Object} params.carrito - Objeto carrito con productos y totales.
 * @param {HTMLElement} [params.cantidadDeProductos] - Elemento para mostrar cantidad de productos (opcional).
 * @param {HTMLElement} [params.taskFormEnviar] - Botón de enviar/comprar (opcional).
 */
export function pintarFooter({ footer, carrito, cantidadDeProductos, taskFormEnviar }) {
    footer.innerHTML = '';
    const productosEnCarrito = carrito.productos || {};
    if (Object.keys(productosEnCarrito).length === 0) {
        if (cantidadDeProductos && cantidadDeProductos.querySelector('span')) {
            cantidadDeProductos.querySelector('span').textContent = "";
        }
        footer.innerHTML = `
            <th scope="row" colspan="5">Carrito vacío. Toca en las imágenes para agregar los productos al carrito.</th>
        `;
        if (taskFormEnviar) {
            taskFormEnviar.style.display = 'none';
        }
        return;
    } else {
        if (taskFormEnviar) {
            taskFormEnviar.style.display = 'block';
        }
    }
    const totalCantidadItems = Object.values(productosEnCarrito).reduce((acc, { cantidad }) => acc + cantidad, 0);
    const precioTotalCarrito = carrito.total;
    const pesoTotalCarrito = carrito.totalPeso;
    if (cantidadDeProductos && cantidadDeProductos.querySelector('span')) {
        cantidadDeProductos.querySelector('span').textContent = totalCantidadItems;
    }
    const footerContent = `
        <th scope="row" colspan="2">Total productos:</th>
        <td>${totalCantidadItems}</td>
        <td></td>
        <td></td>
        <td><span>${precioTotalCarrito.toFixed(0)}</span></td>
        <td></td>
    `;
    footer.innerHTML = footerContent;
}




export function escucharCambiosEnCampos(usuario) {



      console.log("escucharCambiosEnCampos (desde funciones.js): Adjuntando listeners.");
    
    // Obtener hiddenPrivateInfo3Element directamente aquí
    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');

    // Defensive check: Ensure it's an actual HTML element and has the querySelector method
    if (!hiddenPrivateInfo3 || 
        !(hiddenPrivateInfo3 instanceof HTMLElement) || 
        typeof hiddenPrivateInfo3.querySelector !== 'function') {
        console.error("Error: hiddenPrivateInfo3Element no es un elemento HTML válido o no tiene querySelector. Valor:", hiddenPrivateInfo3);
        return; // Exit if the element is not valid
    }


          // --- Detección de cambios y actualización del objeto usuario ---
    const campoDireccion = hiddenPrivateInfo3.querySelector('#addressInput');
    const campoReferencia = hiddenPrivateInfo3.querySelector('#referencia');
    const campoNombre = hiddenPrivateInfo3.querySelector('#nombre');
    const btnGuardarCambios = document.getElementById('editar')

    // Listener para el campo de Dirección
    if (campoDireccion) {
        campoDireccion.addEventListener('input', function() {
            console.log("Dirección actualizada:", this.value);
            btnGuardarCambios.style.display = 'block'; // Mostrar botón al cambiar
        });
    }

    // Listener para el campo de Referencia
    if (campoReferencia) {
        campoReferencia.addEventListener('input', function() {
            console.log("Referencia actualizada:", this.value);
              btnGuardarCambios.style.display = 'block'; // Mostrar botón al cambiar

        });
    }

        // Listener para el campo de Nombre
    if (campoNombre) {
        campoNombre.addEventListener('input', function() {
            console.log("Nombre actualizado:", this.value);
            btnGuardarCambios.style.display = 'block'; // Mostrar botón al cambiar

        });
    }
}

// Ya no se importan módulos de Firebase, se usa la variable global 'firebase' proporcionada por la CDN
