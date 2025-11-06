import { iniciarFirebase, mostrarCampos } from "./funciones.js";
import { extraerParametros } from "./funciones.js";
import { verificarSiEstaAbiertoElComercio, calcularTotalesCarrito } from "./funciones.js";
import { Carrito, Score, Usuario, Comercio } from "./objetos.js";
iniciarFirebase()

const db = firebase.firestore();

const cantidadDeProductos= document.getElementById("insignia")
// const loginForm = document.getElementById('task-form-envio'); // Eliminado
let categoria2 = document.getElementById('categorias')
let color2 = document.getElementById('colores')
let talle2 = document.getElementById('talles')
let marca2 = document.getElementById('marcas')
let todas2 = document.getElementById('todas')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
// const footer2  = document.getElementById('footer2') // Eliminado
// const descuentos = document.getElementById("descuentos") // Eliminado
//const btnWhatsapp = document.getElementById('btn-wsp')

const templateFooter = document.getElementById('template-footer').content

const templateCarrito = document.getElementById('template-carrito').content
const fragment = document.createDocumentFragment()
const login= document.getElementById("login")



let carrito = new Carrito(); // Asumo que Carrito es una clase
let comercioGlobal = null;
let bbddProductos = null;
let uid = null;


let idGuardado= ""
let vendedor=""

// let listaCupones = [] // Eliminado
let vendedorFicha = {}
let telefono=""
// let totalDescuentos=0 // Eliminado

let abierto=false
let inicio=true

let nombreVendedor=""
let direccionVendedor= ""
let vendedorCalle = ""
let vendedorDepartamento= ""
let vendedorDireccion = ""
let vendedorEntreCalles = ""
let vendedorNombre = ""
let vendedorNumero = ""
let vendedorReferencia = ""
let totalPeso=0





let total=0
let logeado= false
let usuario= new Usuario()
let comercio= new Comercio()
let ultimaCompra= new Carrito()
var Score2= new Score(0)

console.log(Score2)




//firebase inicializar


//botones

// Funciones de pintado y lógica de carrito (movidas antes de DOMContentLoaded)
const pintarCarrito = () => {
    console.log("pintarCarrito...");
    console.log("Estado actual del carrito global (pintarCarrito): ", carrito);
    console.log("comercio.uid (pintarCarrito): ", comercioGlobal.uid); // Usar comercioGlobal.uid

    items.innerHTML = ''; // Limpiar el contenedor de items

    // Si 'carrito' no es una instancia válida o no tiene productos, maneja el caso de carrito vacío.
    // Ya que 'carrito' es global y siempre una instancia de Carrito, esto debería ser más robusto.
    if (!carrito.productos || Object.keys(carrito.productos).length === 0) {
        console.warn("pintarCarrito: Carrito vacío o con productos no válidos.");
        pintarFooter(); // Siempre llama a pintarFooter para actualizar la UI del footer
        return;
    }


       
  
        
  if (localStorage.getItem(comercio.uid)) {
      console.log(carrito)
  }
      //elimna todos los productos del carrito que se ve.
      items.innerHTML = ''     
       // 1. Manejo inicial del carrito para evitar errores si está nulo/indefinido
    // Esto es vital si 'carrito.productos' puede no existir al cargar la página
    if (!carrito || !carrito.productos || typeof carrito.productos !== 'object') {
        console.warn("pintarCarrito: El objeto 'carrito' o 'carrito.productos' no es válido. Inicializando como vacío.");
        carrito = { productos: {} }; // Asegura que 'carrito.productos' sea un objeto vacío
        
    }

    // 2. Limpia el contenedor de ítems para evitar duplicados al re-renderizar
    items.innerHTML = '';

    // 3. Prepara un mapa de productos de la base de datos para búsquedas eficientes
    // Asegúrate de que bbddProductos esté cargado. Si es asíncrono, deberías esperar por ello.
    // Esto asume que bbddProductos.data() existe y tiene una propiedad 'productos' que es un array.
    if (!bbddProductos || !bbddProductos.data || !bbddProductos.data().productos) {
        console.error("pintarCarrito: Los datos de la base de datos (bbddProductos) no están disponibles o tienen un formato incorrecto.");
        return; // Sale de la función si no hay datos de productos para comparar
    }

    const productosDbArray = bbddProductos.data().productos;
    const productosMap = {};
    productosDbArray.forEach(prod => {
        productosMap[prod.id] = prod;
    });

    // 4. Itera sobre los productos en el carrito
    Object.values(carrito.productos).forEach(function (productoEnCarrito) {
        const idProductoCarrito = productoEnCarrito.id;
        const productoDb = productosMap[idProductoCarrito]; // Búsqueda directa O(1)

        // 5. Verifica si el producto del carrito existe en la DB y tiene stock
        if (productoDb && productoDb.stock > 0) {
            const clone = templateCarrito.cloneNode(true); // ¡Clona el template para cada ítem!

            // Actualiza los elementos del template con los datos del producto
            // Usando productoEnCarrito para la cantidad actual en el carrito
            // Usando productoDb para los detalles del producto de la base de datos (título, precio, stock)
            
            // Cantidad
            clone.querySelectorAll('td')[3].textContent = productoEnCarrito.cantidad;

            // Título del producto con cantidad
            clone.querySelectorAll('td')[1].textContent = `${productoDb.title}`;
            
            // Imagen del producto (usando la del carrito si la tiene, o la de la DB)
            // Es buena práctica asegurarse de que 'productoEnCarrito.imagen' exista
            clone.querySelector('img').setAttribute('src', productoEnCarrito.imagen || productoDb.imagen);
            
            // Precio total por ítem (precio unitario de DB * cantidad en carrito)
            // Formateado a 2 decimales para moneda
            clone.querySelector('span').textContent = (productoDb.precio * productoEnCarrito.cantidad).toFixed(0);

           
         

            // Opcional: Actualizar el precio dentro del objeto 'carrito.productos' si necesitas que refleje el total por ítem
            // Si 'precio' en 'carrito.productos' debe ser el precio unitario, no hagas esto.
            // Si debe ser el subtotal por ítem, entonces sí:
            // carrito.productos[productoEnCarrito.id].precio = productoDb.precio * productoEnCarrito.cantidad;
            // Asegúrate de la consistencia de tus datos.

            // Añade el clon al DOM
            items.appendChild(clone);
        } else {
            // Opcional: Si un producto del carrito no se encuentra en la DB o no tiene stock,
            // podrías querer notificar al usuario o eliminarlo del carrito.
            console.warn(`Producto ${idProductoCarrito} en el carrito no encontrado en la DB o sin stock. Se omitirá.`);
            // Si quieres eliminarlo del carrito automáticamente:
            // delete carrito.productos[idProductoCarrito];
            // Y luego podrías volver a llamar a pintarCarrito para reflejar el cambio.
        }
    });

    // 6. Actualiza los totales del carrito (cantidad total, precio total, peso total)
    const totales = calcularTotalesCarrito(Object.values(carrito.productos));
    // --- Pintar total en el footer del carrito ---
    const footer = document.getElementById('footer');
    if (footer) {
        footer.innerHTML = `<th scope="row" colspan="6" class="text-right text-gray-800 py-3">Total: $${totales.nPrecioTotal.toFixed(0)}</th>`;
    }

    // Asume que tienes elementos HTML para mostrar estos totales, por ejemplo:
    // const elementoCantidadTotal = document.getElementById('cantidad-total');
    // const elementoPrecioTotal = document.getElementById('precio-total');
    // const elementoPesoTotal = document.getElementById('peso-total');

    if (document.getElementById('cantidad-total')) {
        document.getElementById('cantidad-total').textContent = totales.nCantidadTotal;
    }
    if (document.getElementById('precio-total')) {
        document.getElementById('precio-total').textContent = totales.nPrecioTotal.toFixed(0);
    }
    if (document.getElementById('peso-total')) {
        document.getElementById('peso-total').textContent = totales.nPesoTotal.toFixed(0);
    }

    // Finalmente, guarda el carrito actualizado en localStorage
   //localStorage.setItem("ultimaCompra", JSON.stringify(carrito));
    //localStorage.setItem(comercio.uid, JSON.stringify(carrito));
    pintarFooter()
}

const pintarFooter = () => {
    footer.innerHTML = ''; // Limpiar el footer antes de repintar

    const productosEnCarrito = carrito.productos || {};

    if (Object.keys(productosEnCarrito).length === 0) {
        if (cantidadDeProductos && cantidadDeProductos.querySelector('span')) {
            cantidadDeProductos.querySelector('span').textContent = "";
        }
        footer.innerHTML = `
            <th scope="row" colspan="5">Carrito vacío. Toca en las imágenes para agregar los productos al carrito.</th>
        `;
       
        return; 
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
        <td>$<span>${precioTotalCarrito.toFixed(0)}</span></td> <!-- Precio total dentro del span -->
        <td></td>
    `;
    
    footer.innerHTML = footerContent; 
};


// const pintarFooter2 = (listaCupones) => { // Eliminado
//     console.log("pintarfooter2") // Eliminado
//     footer2.innerHTML = ` // Eliminado
//     <th scope="row" colspan="5">Carrito vacío. Toca en las imágenes para agregar los productos al carrito.</th> // Eliminado
//     ` // Eliminado
//     let descuento=0 // Eliminado
//     let totalConDescuento = total-sumarLista(listaCupones, "descuento") // Eliminado
//     totalDescuentos = sumarLista(listaCupones, "descuento") // Eliminado
//     console.log("totaldesceuntos", totalDescuentos) // Eliminado
//     templateFooter2.querySelectorAll('td')[2].textContent ="" // Eliminado
//     templateFooter2.querySelector('span').textContent = totalConDescuento // Eliminado
//     const clone = templateFooter2.cloneNode(true) // Eliminado
//     fragment.appendChild(clone) // Eliminado
//     footer2.appendChild(fragment) // Eliminado

// } // Eliminado

// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', async e => {
    console.log("DOMContentLoaded en carrito.js: Iniciando...");

    // 1. Ocultar elementos específicos de esta página (si aplica)

  const login = document.getElementById('login'); // Asegúrate de que 'login' está definido o lo obtienes aquí
    if (login) {
        login.style.display = "none";
    }
    // const descuentos = document.getElementById("descuentos"); // Eliminado
    // if (descuentos) { // Eliminado
    //     descuentos.style.display = "none"; // Eliminado
    // } // Eliminado


    uid= "1QgN8gr4e9QfVXIuiEpzEReHXbu1"
    /*

    // 2. Extraer el UID del comercio de la URL
    const urlParams = extraerParametros(document.URL);
    uid = urlParams.comercio; // Asignar al 'uid' global

    if (!uid || uid.trim() === "") {
        console.error("DOMContentLoaded: UID de comercio no encontrado o inválido en la URL.");
        alert("Error: Identificador del comercio no disponible en la dirección.");
        return; // Detener la ejecución si no hay UID
    }
    console.log("UID de comercio de la URL:", uid);
    */

    // 3. Cargar el objeto 'comercioGlobal' (primero de localStorage, luego de Firebase)
    try {
        const storedComercioData = localStorage.getItem("comercio_data_key");
        
        if (storedComercioData) {
            const parsedComercio = JSON.parse(storedComercioData);
            if (parsedComercio && parsedComercio.uid === uid) {
                comercioGlobal = parsedComercio;
                console.log("Comercio cargado de localStorage:", comercioGlobal);
            } else {
                console.warn("Comercio en localStorage no coincide o es inválido. Buscando en base de datos.");
                localStorage.removeItem("comercio_data_key"); // Limpiar si no coincide
                await buscarYGuardarComercio(uid); // Carga de Firebase
            }
        } else {
            console.log("Comercio no encontrado en localStorage. Buscando en base de datos.");
            await buscarYGuardarComercio(uid); // Carga de Firebase
        }
    } catch (error) {
        console.error("Error al cargar o parsear el objeto comercio de localStorage:", error);
        console.log("Intentando buscar el comercio en la base de datos como fallback.");
        localStorage.removeItem("comercio_data_key");
        await buscarYGuardarComercio(uid);
    }

    // Verificar si comercioGlobal se cargó correctamente después de los intentos
    if (!comercioGlobal || !comercioGlobal.uid) {
        console.error("DOMContentLoaded: ¡ERROR FATAL! El objeto comercioGlobal no es válido o no tiene UID después de todos los intentos de carga. No se puede inicializar la aplicación.");
        alert("No se pudo cargar la información esencial del comercio. Por favor, verifica la URL o intenta de nuevo.");
        return;
    }
    console.log("ComercioGlobal VALIDADO y listo:", comercioGlobal);

    // 4. Cargar el catálogo completo de productos 'bbddProductos'
    try {
        console.log("Intentando cargar bbddProductos desde 'catalogos' para UID:", uid);
        const docRefCatalogos = db.collection("catalogos").doc(uid);
        bbddProductos = await docRefCatalogos.get();
        
        if (bbddProductos.exists) {
            console.log("bbddProductos cargado exitosamente:", bbddProductos.data());
        } else {
            console.error("No se encontró el documento de catálogo en Firebase para UID:", uid, "en la colección 'catalogos'.");
            bbddProductos = null;
            alert("Error: No se pudo cargar el catálogo de productos. Intenta de nuevo más tarde.");
            // No retornar aquí si quieres que el carrito se pinte vacío en caso de falta de productos
        }
    } catch (e) {
        console.error("Error al cargar bbddProductos desde Firebase (colección 'catalogos'):", e);
        bbddProductos = null;
        alert("Error: Falló la conexión con la base de datos de productos. Intenta de nuevo más tarde.");
        // No retornar aquí
    }

    // 5. Cargar el estado del 'carrito' desde localStorage
    try {
        const carritoGuardado = localStorage.getItem("ultimaCompra");
        if (carritoGuardado) {
            const dataPlana = JSON.parse(carritoGuardado);
            Object.assign(carrito, dataPlana); // Asigna las propiedades al objeto carrito existente
            if (!carrito.productos || typeof carrito.productos !== 'object') {
                carrito.productos = {}; // Asegura que productos sea un objeto
            }
            console.log("Carrito cargado de localStorage:", carrito);
        } else {
            console.log("No se encontró carrito guardado para este comercio. Se usará un carrito vacío.");
            // Si no hay carrito guardado, asegura que sea una instancia limpia
            carrito = new Carrito();
        }
    } catch (e) {
        console.error("Error al cargar el carrito de localStorage:", e);
        carrito = new Carrito(); // Reinicia el carrito si hay un error
        console.warn("Carrito reiniciado debido a error en localStorage.");
    }

    // 6. Asignar el comercio al carrito si no está ya asignado (es crucial para guardar)
    if (!carrito.comercio || carrito.comercio.uid !== comercioGlobal.uid) {
        carrito.comercio = comercioGlobal.nombre;
        carrito.comercioNombre = comercioGlobal.nombre || "";
        console.log("Comercio asignado/actualizado en el carrito:", carrito.comercioNombre);
    }
    
    // 7. Llamar a las funciones de pintado y lógica de negocio
    // Ahora bbddProductos y comercioGlobal están cargados y 'carrito' está en su estado final.
    pintarCarrito(); // Esta función ahora puede confiar en bbddProductos y comercioGlobal
    pintarFooter();  // Esta función también

    // 8. Cargar el estado del 'usuario' desde localStorage o crear una nueva instancia
try {
    usuario = JSON.parse(localStorage.getItem("usuario")); // Usa una clave específica para el usuario
    if (usuario) {
    

        console.log("Usuario cargado de localStorage:", usuario);
        const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');

    mostrarCamposNoEditable(usuario, hiddenPrivateInfo3);

    } else {
        console.log("No se encontró usuario guardado. Se usará un usuario vacío.");
        usuario = new Usuario(); // Instancia un usuario vacío si no hay datos guardados
    }
} catch (e) {
    console.error("Error al cargar el usuario de localStorage:", e);
    usuario = new Usuario(); // Reinicia el usuario si hay un error
    console.warn("Usuario reiniciado debido a error en localStorage.");
}
    
    // Ejecutar otras funciones dependientes de comercioGlobal, etc.
    if (comercioGlobal.horarioDeAtencion) {
        console.log("Comercio cargado. Verificando horario.");
        // buscarHorarios(comercioGlobal.horarioDeAtencion); // Asegúrate de que esta función exista
    } else {
        console.warn("No se pudo obtener el horario de atención del comercio.");
    }

    console.log("DOMContentLoaded en carrito.js: Finalizado.");


    const campoTelefono = document.getElementById('telefono');
    const errorTelefono = document.getElementById('errorTelefono');

if (campoTelefono && errorTelefono) { // Nos aseguramos de que los elementos existan
        campoTelefono.addEventListener('input', function() {
            const valorTelefono = campoTelefono.value;

            // Si el campo está vacío, mostramos el error
    if (valorTelefono.length === 0) {
        errorTelefono.textContent = 'El teléfono no puede estar vacío.';
        errorTelefono.style.color = 'red';
        return; // Salimos de la función sin hacer más validaciones
    }

    // Expresión regular: ^\d{10}$
    // ^ : Comienza con
    // \d : Cualquier dígito (0-9)
    // {10} : Exactamente 10 veces
    // $ : Termina con
    // Si el valor no coincide con 10 dígitos, mostramos el error.
    if (!/^\d{10}$/.test(valorTelefono)) {
        errorTelefono.textContent = 'El teléfono debe tener exactamente 10 dígitos numéricos. Ejemplo: 3446342534';
        errorTelefono.style.color = 'red';
    } else {
        errorTelefono.textContent = 'Teléfono correcto';
        errorTelefono.style.color = 'green';
    }
        });
    }



});


items.addEventListener('click', e => { /* btnAumentarDisminuir(e) */ }) // btnAumentarDisminuir no definido en este snippet
// descuentos.addEventListener('click', e => { btnQuitarDescuento(e) }) // Eliminado


function prueba(){
    console.log("prueba") // Corregido 'consolge' a 'console'
}

function recuperarCatalogo(uid) {

db.collection("catalogos").doc(uid)
.get()
.then((doc) => {
  bbddProductos=doc
   pintarCarrito()
   // filtrarDatos(bbddProductos)
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});
}


async function buscarYGuardarComercio(uid) {
    try {
        const docRef = db.collection("comercios").doc(uid);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            comercioGlobal = docSnap.data();
            comercioGlobal.uid = uid; // Asegura que el UID esté en el objeto
            localStorage.setItem("comercio_data_key", JSON.stringify(comercioGlobal));
            console.log("Comercio cargado de Firebase:", comercioGlobal);
        } else {
            console.error("buscarYGuardarComercio: No se encontró el documento del comercio para UID:", uid);
            alert("Error: Comercio no encontrado. Verifica la URL.");
            throw new Error("Comercio no encontrado en la base de datos.");
        }
    } catch (e) {
        console.error("buscarYGuardarComercio: Error al buscar el comercio en Firebase:", e);
        alert("Error de conexión al cargar el comercio. Intenta de nuevo.");
        throw e; // Propagar el error para que el DCL lo maneje
    }
}




// Pintar productos












//crear el icono de whatsapp. inicio

function init() {

    const telefono= vendedorFicha.telefono
    console.log("init()", telefono)
    
    if(telefono>0){
        console.log("lengt >0")
        
       
        let a = createA("https://api.whatsapp.com/send?phone=+54"+telefono+"&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta"
        , "whatsapp");
        document.body.appendChild(a);
    }else{
        console.log("lengt <0")
 
    let a = createA("vendedores.html"
    , "whatsapp");
    document.body.appendChild(a);
    }
    
 
    
 
}
 
/*function createA(link, text) {
 
    let a = document.createElement("a");
    if (link) {
        a.setAttribute("href", link);
        a.setAttribute("class", "btn-wsp");
        a.setAttribute("id", "btn-wsp");
        a.setAttribute("target", "_blank");
    }
    if (text) {
        let icono = document.createElement("i");
        icono.setAttribute("class", "bi bi-whatsapp")
        a.appendChild(icono);
    }
    return a;
}
 
*/
//window.onload = init;

//crear el icono de whatsapp. fin


function filtrarDatos(data2) {

    console.log("filtrar datos", )
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
function pintarFiltros(categorias, filtro, filtro2) {
    console.log("pintar filtros")

    categorias.forEach(item => {
        
        templateCategorias.querySelector('a').setAttribute('id', item)
        templateCategorias.querySelector('a').textContent = item
        templateCategorias.querySelector('a').dataset.id = filtro2
        templateCategorias.querySelector('li').setAttribute('class', filtro)
        templateCategorias.querySelector('li').setAttribute('id', "idFiltro"+filtro+item)

        const clone = templateCategorias.cloneNode(true)
        fragment.appendChild(clone)
    })

    
    document.getElementById(filtro).appendChild(fragment)

    categoria2 = document.getElementById('categorias')
    marca2 = document.getElementById('marcas')
    todas2 = document.getElementById('todas')

categoria2.addEventListener('click', e => { filtroSeleccionado(e) })
marca2.addEventListener('click', e => { filtroSeleccionado(e) })
todas2.addEventListener('click', e => { filtroSeleccionado(e) })


}
const filtrar = buscador =>{
    console.log("filtrar")
     let bbddProductosFiltrados=[]
    let filtro=""
    let filtro2=""
        // coloreo el filtro elegido
        //document.getElementById(filtro2a).style.color = '#FF0000'

        bbddProductos.forEach(item => {
            console.log("filtrar2")
            console.log("item.data().title= ", item.data().title)
            console.log(buscador)
            if(item.data().title.toLowerCase().includes(buscador)){
                console.log("iffffffffffffffffffffffffffffffffff")
                bbddProductosFiltrados.push(item)
                filtro="categorias"
                filtro2="categoria"

                console.log(item.data().id)
          
                document.getElementById(item.data().id).style.display="block"
            
                
                
            }else{
                
                document.getElementById(item.data().id).style.display="none"
                //document.getElementById(filtro2a).style.display="none"
                //document.getElementById("idFiltrocategoriasCorpiño").style.display="none"
                
            }     
         })
}

const filtroSeleccionado = e =>{



    console.log("todas?", e.target.textContent)
    if(e.target.textContent=="Todas"){
        location.reload()
    }else{


    let bbddProductosFiltrados=[]
    let filtro=""
    let filtro2=""
   


    
    const filtro2a=e.target.textContent
    console.log("filtro2a", filtro2a)
    const categoria2a="categoria"

   
    
    if(e.target.dataset.id=="categoria"){

        console.log("categoria seleccionada 23")


     

 

        
        
       

        // coloreo el filtro elegido
        //document.getElementById(filtro2a).style.color = '#FF0000'

        bbddProductos.forEach(item => {
            if(item.data().categoria==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="categorias"
                filtro2="categoria"
          
                document.getElementById(item.data().id).style.display="block"
            
                
                
            }else{
                
                document.getElementById(item.data().id).style.display="none"
                //document.getElementById(filtro2a).style.display="none"
                //document.getElementById("idFiltrocategoriasCorpiño").style.display="none"
                
            }     
         })       
    }

   
    if(e.target.dataset.id=="marca"){



        // borro las categorias que no tiene la marca que seleccione
     


              // coloreo el filtro elegido
              document.getElementById('idFiltromarcas'+e.target.textContent).style.color = '#FF0000'
        bbddProductos.forEach(item => {
            if(item.data().marca==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="marcas"
                filtro2="marca"
                document.getElementById(item.data().id).style.display="block"
                //document.getElementById(item.data().categoria).style.display="block"

            }else{
               console.log("itemdata", item.data().categoria)
                document.getElementById(item.data().id).style.display="none"
               
      
            }     
         })       
    }

    

    console.log(bbddProductos)

    
  // filtrarDatos(bbddProductosFiltrados)

        
}
}

// ocultar / mostrar desplegables
function ver(n) {
    document.getElementById("subseccion"+n).style.display="block"
    }
function ocultar(n) {
    document.getElementById("subseccion"+n).style.display="none"
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

    }
}
