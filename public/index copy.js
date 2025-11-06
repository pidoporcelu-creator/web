import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());

const db = firebase.firestore();
let bbddProductos= []



 

 db.collection("productos")
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
           
            
           
        });
        
        
        
        bbddProductos=querySnapshot
        
     
        filtrarDatos(bbddProductos)
        
        pintarCards(bbddProductos)
        
       
       
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });


const cards = document.getElementById('cards')
let categoria2 = document.getElementById('categorias')
let color2 = document.getElementById('colores')
let talle2 = document.getElementById('talles')
let marca2 = document.getElementById('marcas')
let todas2 = document.getElementById('todas')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
const btnWhatsapp = document.getElementById('btn-wsp')
const templateCard = document.getElementById('template-card').content
const templateFooter = document.getElementById('template-footer').content
const templateCarrito = document.getElementById('template-carrito').content
const templateCategorias = document.getElementById('template-categorias').content
const fragment = document.createDocumentFragment()

let carrito = {}
let idGuardado= ""
let vendedor=""

//firebase inicializar



// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {
    fetchData()
    if (localStorage.getItem('carrito')) {
        carrito = JSON.parse(localStorage.getItem('carrito'))
        pintarCarrito()
    }

    if (localStorage.getItem('idGuardado')) {
        idGuardado= localStorage.getItem('idGuardado')
        //console.log("idguardado: "+idGuardado)
        

    }

    if (localStorage.getItem('vendedor')) {
        vendedor= localStorage.getItem('vendedor')
        console.log("vendedor:"+vendedor)
     
    }





});




items.addEventListener('click', e => { btnAumentarDisminuir(e) })
btnWhatsapp.addEventListener('click', e => { enviarWhatsapp()});



// Traer productos
const fetchData = async () => {
    const res = await fetch('api.json');
    const data = await res.json()
   // console.log(data)
    //pintarCards(data)
    //pintarColores(data)
}
// Pintar Categorias

function pintarFiltros(categorias, filtro, filtro2) {

 
   

    categorias.forEach(item => {
        console.log(item)
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
    color2 = document.getElementById('colores')
    talle2 = document.getElementById('talles')
    marca2 = document.getElementById('marcas')
    todas2 = document.getElementById('todas')

    categoria2.addEventListener('click', e => { filtroSeleccionado(e) })
talle2.addEventListener('click', e => { filtroSeleccionado(e) })
color2.addEventListener('click', e => { filtroSeleccionado(e) })
marca2.addEventListener('click', e => { filtroSeleccionado(e) })
todas2.addEventListener('click', e => { filtroSeleccionado(e) })


}

// Pintar productos
const pintarCards = data2 => {
    console.log("pintarCards", bbddProductos)

    data2.forEach(item => {

        

        console.log(item.data().title)

       templateCard.querySelector('.titulo').textContent = item.data().title
       templateCard.querySelector('.precio').textContent = item.data().precio
       templateCard.querySelector('button').dataset.id = item.data().id
       templateCard.querySelector('.talle').textContent = item.data().talle
       templateCard.querySelector('.color').textContent = item.data().color
      

       templateCard.querySelector('li').setAttribute('data-category', item.data().categoria)
       templateCard.querySelector('li').setAttribute('id', item.data().id)
       


        templateCard.querySelector('img').setAttribute('src', item.data().thumbnailUrl)

        
        const clone = templateCard.cloneNode(true)
        fragment.appendChild(clone)
    })
    const cards = document.getElementById('cards')   // lo vuelvo a enlazar porque cuando elimino las cards, el elemento "cards" no existe mas y entonces no pinta en ningun lado.  
    cards.appendChild(fragment)

    cards.addEventListener('click', e => { addCarrito(e) });

   


}

// Pintar colores
/*const pintarColores = data => {
    data.forEach(item => {

        if(item.title=="Pizza"){
           // console.log("vamo no ma")
            
        }
        templateCheckbox.querySelector('button').textContent = item.title

        const clone = templateCheckbox.cloneNode(true)
        fragment.appendChild(clone)
    })
    boxes.appendChild(fragment)
}
*/

// Agregar al carrito
const addCarrito = e => {
    if (e.target.classList.contains('btn-dark')) {
         console.log("addCarrito:",e.target.dataset.id)
         console.log("addCarrito: "+e.target.parentElement)
        setCarrito(e.target.parentElement)
    }
    if (e.target.classList.contains('card-img-top')) {
         console.log(e.target.dataset.id)
        // console.log(e.target.parentElement)
        setId(e.target.parentElement)
    }
    e.stopPropagation()
}

const setId = item => {
    //console.log(item)
   const producto = {
    title: item.querySelector('.titulo').textContent,
    precio: item.querySelector('.precio').textContent,
    id: item.querySelector('button').dataset.id,
       cantidad: 1
   }
    const id= producto.id
    console.log(id)
    localStorage.setItem("idGuardado", id )
    window.location="producto.html?producto="+id+"&vendedor="+vendedor;

  
}




const setCarrito = item => {
     console.log("item", item)
    const producto = {
        title: item.querySelector('.titulo').textContent,
        precio: item.querySelector('.precio').textContent,
        talle: item.querySelector('.talle').textContent,
        color: item.querySelector('.color').textContent,
        id: item.querySelector('button').dataset.id,
       
        cantidad: 1
    }
     console.log("==========================",producto.imagen)
     console.log(producto.id)
    if (carrito.hasOwnProperty(producto.id)) {
        producto.cantidad = carrito[producto.id].cantidad + 1
    }

    carrito[producto.id] = { ...producto }
    
    pintarCarrito()
}

const pintarCarrito = () => {
    items.innerHTML = ''

    console.log(carrito)

    Object.values(carrito).forEach(producto => {
        templateCarrito.querySelector('th').textContent = producto.id
        templateCarrito.querySelectorAll('td')[0].textContent = producto.title
        templateCarrito.querySelectorAll('td')[1].textContent = producto.talle
        templateCarrito.querySelectorAll('td')[2].textContent = producto.color
        templateCarrito.querySelectorAll('td')[3].textContent = producto.cantidad
        

        templateCarrito.querySelector('span').textContent = producto.precio * producto.cantidad
        
        //botones
        templateCarrito.querySelector('.btn-info').dataset.id = producto.id
        templateCarrito.querySelector('.btn-danger').dataset.id = producto.id
    

        const clone = templateCarrito.cloneNode(true)
        fragment.appendChild(clone)
    })
    items.appendChild(fragment)

    pintarFooter()

    localStorage.setItem('carrito', JSON.stringify(carrito))
}

const pintarFooter = () => {
    footer.innerHTML = ''
    
    if (Object.keys(carrito).length === 0) {
        footer.innerHTML = `
        <th scope="row" colspan="5">Carrito vacío con innerHTML</th>
        `
        return
    }
    
    // sumar cantidad y sumar totales
    const nCantidad = Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0)
    const nPrecio = Object.values(carrito).reduce((acc, {cantidad, precio}) => acc + cantidad * precio ,0)
    // console.log(nPrecio)

    templateFooter.querySelectorAll('td')[0].textContent = nCantidad
    templateFooter.querySelector('span').textContent = nPrecio

    const clone = templateFooter.cloneNode(true)
    fragment.appendChild(clone)

    footer.appendChild(fragment)

    const boton = document.querySelector('#vaciar-carrito')
    boton.addEventListener('click', () => {
        carrito = {}
        pintarCarrito()
    })

    const boton2 = document.querySelector('#comprar-carrito')
    boton2.addEventListener('click', () => {

        window.location="carrito.html"
        
    
        
    })
 

}



const btnAumentarDisminuir = e => {
    // console.log(e.target.classList.contains('btn-info'))
    if (e.target.classList.contains('btn-info')) {
        const producto = carrito[e.target.dataset.id]
        producto.cantidad++
        carrito[e.target.dataset.id] = { ...producto }
        pintarCarrito()
    }

    if (e.target.classList.contains('btn-danger')) {
        const producto = carrito[e.target.dataset.id]
        producto.cantidad--
        if (producto.cantidad === 0) {
            delete carrito[e.target.dataset.id]
        } else {
            carrito[e.target.dataset.id] = {...producto}
        }
        pintarCarrito()
    }
    e.stopPropagation()
}


function extraerParametros(url) {

  


    if (typeof url != 'string') {
        throw TypeError('El argumento debe ser una cadena de caracteres.');
    }

    // Pendiente: validar si una cadena de caracteres corresponde con una URL.

    return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce((a, p) => ((a[p.slice(0, p.indexOf('='))] = p.slice(p.indexOf('=') + 1)), a), {});
}

try {
    localStorage.setItem("vendedor", extraerParametros(document.URL).vendedor)
    if(extraerParametros(document.URL).vendedor.length>0){
        localStorage.setItem("vendedor", extraerParametros(document.URL).vendedor)
    }
    
    // {prop1: v1, prop2: v2, prop3: v3}
} catch (e) {
    console.log(`Error: ${e.message}`);
}


function enviarWhatsapp() { 
    console.log("enviar whatsapp")


let telefono=""
    

    db.collection("vendedores")
.get()
.then((querySnapshot) => {
    querySnapshot.forEach((doc) => {

        console.log("vendedor foreach:"+vendedor)
        console.log("doc.data().nick:"+doc.data().nick)



        if(doc.data().nick==vendedor){
            
            telefono= doc.data().telefono
            console.log("nick=vendedor:"+telefono)
            window.open="https://api.whatsapp.com/send?phone=+549"+telefono+"&text=Hola,%20vengo%20de%20www.tienda1.com.ar.%20Quisiera%20realizarte%20una%20consulta";

         
        }else{
            console.log("selecciona vendedor")
        }
      
       
    });
    const data2=  querySnapshot
    pintarCards(data2)
    
   
   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});

}

//crear el icono de whatsapp. inicio

function init() {
 
    let a = createA("https://api.whatsapp.com/send?phone=+5493446562973&text=Hola,%20vengo%20de%20www.tienda1.com.ar.%20Quisiera%20realizarte%20una%20consulta"
    , "whatsapp");
 
    document.body.appendChild(a);
 
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
        icono.setAttribute("class", "bi bi-whatsapp")
        a.appendChild(icono);
    }
    return a;
}
 
window.onload = init;

//crear el icono de whatsapp. fin

function filtrarDatos(data2) {

    let categorias1 = []
    let talles1 = []
    let colores1 = []
    let marcas1 = []

    //creo un array de categorias
    data2.forEach(item => {
      
       categorias1.push(item.data().categoria);
       talles1.push(item.data().talle);
       colores1.push(item.data().color);
       marcas1.push(item.data().marca);
    })
    
    // creo un nuevo array con set para que no se repitan items.
    let filtro=""
    let filtro2=""
    
    const categorias= new Set(categorias1)
    const talles= new Set(talles1)
    const colores= new Set(colores1)
    const marcas= new Set(marcas1)
     filtro="categorias"
     filtro2="categoria"
    pintarFiltros(categorias, filtro, filtro2)
     filtro="talles"
     filtro2="talle"
    pintarFiltros(talles, filtro, filtro2)
    filtro="colores"
    filtro2="color"
    pintarFiltros(colores, filtro, filtro2)
    filtro="marcas"
    filtro2="marca"
    pintarFiltros(marcas, filtro, filtro2)

}

const filtroSeleccionado = e =>{

    console.log("todas?", e.target.textContent)
    if(e.target.textContent=="Todas"){
        location.reload()
    }else{

    //remover los cards
/*     const element = document.getElementById("cards");
element.parentNode.removeChild(element);


 const hiddenPrivateInfo2 = document.getElementById('container2');
 
hiddenPrivateInfo2.innerHTML = `
<h1>Filtra por categorías</h1>
<input type="radio" id="All" name="categories" value="All" checked>
<input type="radio" id="bombacha" name="categories" value="bombacha">
<input type="radio" id="boxer" name="categories" value="boxer">
<input type="radio" id="slip" name="categories" value="slip">
<input type="radio" id="conjunto" name="categories" value="conjunto">
<input type="radio" id="Corpiño" name="categories" value="Corpiño">
<input type="radio" id="top" name="categories" value="top">

<ol class="filters" >
<li id="todas">Todas</li><br>  
<li id="categorias"></li><br>
<li id="talles"></li><br>
<li id="colores"></li><br>
<li id="marcas"></li><br>


</ol>


<ol class="posts" id="cards">

</ol>` */ 




    let bbddProductosFiltrados=[]
    let filtro=""
    let filtro2=""
   

    
    const filtro2a=e.target.textContent
    const categoria2a="categoria"

    
 
   // document.getElementById("idFiltrocategoriasCorpiño").style.color = '#FF0000';
   // console.log('idFiltro'+e.target.dataset.id+e.target.textContent)
   // console.log("idFiltrocategoriasCorpiño")
    
   // document.getElementById('idFiltro'+e.target.dataset.id+e.target.textContent).style.color = '#FF0000'



    
    
    if(e.target.dataset.id=="categoria"){
       

        // coloreo el filtro elegido
        document.getElementById('idFiltrocategorias'+e.target.textContent).style.color = '#FF0000'

        bbddProductos.forEach(item => {
            if(item.data().categoria==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="categorias"
                filtro2="categoria"
                console.log("categoria pintar: "+item.data().id)
            }else{
                console.log("categoria borrar: "+item.data().id)
                document.getElementById(item.data().id).style.display="none"
                //document.getElementById("idFiltrocategoriasCorpiño").style.display="none"
                
            }     
         })       
    }

    if(e.target.dataset.id=="talle"){
              // coloreo el filtro elegido
              document.getElementById('idFiltrotalles'+e.target.textContent).style.color = '#FF0000'
        bbddProductos.forEach(item => {
            if(item.data().talle==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="talles"
                filtro2="talle"
            }else{
                console.log("categoria borrar: "+item.data().id)
                document.getElementById(item.data().id).style.display="none"
            }     
         })       
    }
    if(e.target.dataset.id=="color"){
              // coloreo el filtro elegido
              document.getElementById('idFiltrocolores'+e.target.textContent).style.color = '#FF0000'
        bbddProductos.forEach(item => {
            if(item.data().color==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="colores"
                filtro2="color"
            }else{
                console.log("categoria borrar: "+item.data().id)
                document.getElementById(item.data().id).style.display="none"
            }     
         })       
    }
    if(e.target.dataset.id=="marca"){
              // coloreo el filtro elegido
              document.getElementById('idFiltromarcas'+e.target.textContent).style.color = '#FF0000'
        bbddProductos.forEach(item => {
            if(item.data().marca==filtro2a){
                bbddProductosFiltrados.push(item)
                filtro="marcas"
                filtro2="marca"
            }else{
                console.log("categoria borrar: "+item.data().id)
                document.getElementById(item.data().id).style.display="none"
            }     
         })       
    }

     bbddProductos= bbddProductosFiltrados

    console.log(bbddProductos)
    // pintarCards(bbddProductos, filtro, filtro2)
     //filtrarDatos(bbddProductos, filtro, filtro2)    
}
}

// ocultar / mostrar desplegables

/* const desplegableCategorias= document.getElementById("subseccion1");
desplegableCategorias.addEventListener('click', e => { ver(1) }) */
//document.getElementById("subseccion1").style.display="none"

function ver(n) {
         document.getElementById("subseccion"+n).style.display="block"
         }
function ocultar(n) {
         document.getElementById("subseccion"+n).style.display="none"
         }


         
document.addEventListener('click', e => { 
    console.log("Click en: ", e.target) 

if(e.target.matches('id1')){
    console.log("Click en: ", "id1") 

}

})