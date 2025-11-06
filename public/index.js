import { iniciarFirebase } from "./funciones.js";
import { Carrito, Score, Usuario, Comercio } from "./objetos.js";

iniciarFirebase();




 



const db = firebase.firestore();
const cards = document.getElementById('cards')
const cards2 = document.getElementById('cards2')
const cantidadDeProductos= document.getElementById("insignia")
const taskForm = document.getElementById("task-form");
let categoria2 = document.getElementById('categorias')
let color2 = document.getElementById('colores')
let talle2 = document.getElementById('talles')
let marca2 = document.getElementById('marcas')
let todas2 = document.getElementById('todas')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
//const btnWhatsapp = document.getElementById('btn-wsp')
const templateCard = document.getElementById('template-comercios').content
const templateCard2 = document.getElementById('template-comerciosGuia').content
const templateFooter = document.getElementById('template-footer').content
const templateCarrito = document.getElementById('template-carrito').content
const templateCategorias = document.getElementById('template-categorias').content
const fragment = document.createDocumentFragment()


let carrito = {}
let idGuardado= ""
let vendedor=""
let bbddComercios= []
let bbddComerciosGuia= []
let vendedorFicha = {}
let telefono=""
let emailVendedor="lution.celeste@gmail.com"
let comercio= new Comercio()

//firebase inicializar


//botones



// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {  

    // Se comenta esta línea que causaba la redirección forzada.
    // window.location="/catalogo?comercio="+"YBuVH33YSNMYIlOgWpVRPEwXP2r2"

    if (localStorage.getItem('carrito')) {
    
        carrito = JSON.parse(localStorage.getItem('carrito'))
        console.log(carrito)
       // pintarCarrito()
    }
    console.log("habilitar catalogo de comercios")
    recuperarCatalogo()
   // recuperarCatalogo2()
    //extraerParametros()
    init()
});



items.addEventListener('click', e => { btnAumentarDisminuir(e) })


taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const buscador = taskForm["buscador"].value;

    console.log("buscar", buscador)
    return filtrar(buscador.toLowerCase())

 
});





function recuperarCatalogo() {


db.collection("comercios")
.get()
.then((querySnapshot) => {
    
    bbddComercios=querySnapshot
    pintarCards(bbddComercios)
   //filtrarDatos(bbddComercios.data().comercios)

   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});
}

function recuperarCatalogo2() {


    db.collection("comerciosGuia")
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {    
            console.log("comerciosGuia.lista", doc)
            bbddComerciosGuia=doc
            pintarCards2(bbddComerciosGuia)
            //filtrarDatos(bbddComercios.data().comercios)
        }); 

       
        //filtrarDatos(bbddComercios)
       
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });
    }


// Pintar productos
const pintarCards = data2 => {
    console.log("pintarCards", bbddComercios)
    console.log("item.data().title")
    data2.forEach(item2 => {

        let item=item2.data()
        console.log("item: ", item)
        console.log("horariodeatencion: ", item.horarioDeAtencion)
         let tags2= ""
        if(item.activo=="true"){


             item.tags.forEach(itemTags=>{
                
            tags2= tags2+itemTags+" "
          
                
            })
            

            
        templateCard.querySelector('.titulo').textContent = item.nombre
        templateCard.querySelector('img').setAttribute('src', item.imagen)
        templateCard.querySelector('li').setAttribute('id', item.telefono)
        templateCard.querySelector('.card-img-top').dataset.nombre = "item.nombre"
        templateCard.querySelector('.card-img-top').dataset.id = item.id
        templateCard.querySelector('.card-img-top').dataset.imagen = item.imagen
        templateCard.querySelector('.card-img-top').dataset.marca = JSON.stringify(item)
        templateCard.querySelector('.card-img-top').dataset.precio = item.precio
        templateCard.querySelector('.card-img-top').dataset.title = item.title
        templateCard.querySelector('.card-img-top').dataset.total = item.total
        templateCard2.querySelector('.card-img-top').dataset.id = JSON.stringify(item)
        templateCard.querySelector('.card-img-top').dataset.email = item.email
        templateCard.querySelector('.card-img-top').dataset.horarioDeAtencion = JSON.stringify(item.horarioDeAtencion)
        templateCard.querySelector('.card-img-top').dataset.tags = tags2
        templateCard.querySelector('.card-img-top').dataset.uid = item.uid
        const clone = templateCard.cloneNode(true)
        fragment.appendChild(clone)          //url:1 GET http://127.0.0.1:5503/url 404 (Not Found)
    }
    })
     
    cards.appendChild(fragment)
    cards.addEventListener('click', e => { console.log("agregar al carrito"), recuperarDatosDeLaImagen(e)
});
}

// Pintar productos
const pintarCards2 = data2 => {
    console.log("pintarCards", bbddComerciosGuia)
    console.log("item.data().title")
    data2.data().comercios.forEach(item => {

        let tags2= ""
        if(item.actualizado=="true"){


            item.tags.forEach(itemTags=>{
                
            tags2= tags2+itemTags+" "
              
                
            })
          
            
    
            console.log("horariodeatencionforeahc: ", item.horarioDeAtencion)
          //  templateCard2.setAttribute("id", item.telefono)
       templateCard2.querySelector('.titulo').textContent = item.nombre
       templateCard2.querySelector('img').setAttribute('src', item.galeria[0])
       templateCard2.querySelector('li').setAttribute('id', item.telefono)
        templateCard2.querySelector('.card-img-top').dataset.nombre = item.nombre
        templateCard2.querySelector('.card-img-top').dataset.id = item.telefono
        templateCard2.querySelector('.card-img-top').dataset.imagen = item.galeria[0]
        templateCard2.querySelector('.card-img-top').dataset.marca = item.marca
        templateCard2.querySelector('.card-img-top').dataset.precio = item.precio
        templateCard2.querySelector('.card-img-top').dataset.title = item.title
        templateCard2.querySelector('.card-img-top').dataset.total = item.total
       // templateCard2.querySelector('.card-img-top').dataset.id = item.telefono
        templateCard2.querySelector('.card-img-top').dataset.id = JSON.stringify(item)
        templateCard2.querySelector('.card-img-top').dataset.horarioDeAtencion = JSON.stringify(item.horarioDeAtencion) 
        templateCard2.querySelector('.card-img-top').dataset.tags = tags2


        const clone = templateCard2.cloneNode(true)
        fragment.appendChild(clone)          //url:1 GET http://127.0.0.1:5503/url 404 (Not Found)
    }
    })
     
    cards2.appendChild(fragment)
    cards2.addEventListener('click', e => { console.log("agregar al carrito"), recuperarDatosDeLaImagen2(e)
});
}


const recuperarDatosDeLaImagen = e => {    


    console.log("arreglar esto")
  //  window.location="catalogo.html?comercio="+"1QgN8gr4e9QfVXIuiEpzEReHXbu1";




    console.log("e.target", e.target)
    console.log("e.currentTarget", e.currentTarget)
    if (e.target.dataset.imagen != undefined) {

        console.log("cambiarde pagina")
       // e.target.style.visibility = 'hidden';
        var comercio45 = e.target.dataset
        var comercio= JSON.parse(comercio45.marca)
        localStorage.setItem("comercio", JSON.stringify(comercio))

       // console.log(qweqweqw)
        // window.location="/catalogo?comercio="+comercio.uid; // También comentamos esta línea por si acaso

    }else{
        console.log("e.target undefined", e.target.data)
    }
   
    e.stopPropagation()
}



const recuperarDatosDeLaImagen2 = e => {
    console.log("e.target", e.target)
    if (e.target.dataset.imagen != undefined) {
        console.log("Imagen", e.target.dataset.imagen)
        console.log("Nombre", e.target.dataset.nombre)
        console.log("Id", e.target.dataset.id)
       // e.target.style.visibility = 'hidden';
      //  setCarrito(e.target)
        if (e.target.classList.contains('card-img-top')) {
            console.log("prueba1")
         //   setCarrito(e.target)
        }
    }else{
        console.log("e.target undefined", e.target.data)
    }
   
    e.stopPropagation()
}



//crear el icono de whatsapp. inicio

function init() {

    

    const telefono= vendedorFicha.telefono
    console.log("init()", telefono)
    
    if(telefono>0){
        console.log("lengt >0")
    
        let a = createA("https://wa.me/+54"+telefono+"&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta"
        , "whatsapp");
        document.body.appendChild(a);
    }else{

        console.log("lengt <0")
 /*
    let a = createA("vendedores.html"
    , "whatsapp");
    document.body.appendChild(a);
    */
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
     let bbddComerciosFiltrados=[]
    let filtro=""
    let filtro2=""
        // coloreo el filtro elegido
        //document.getElementById(filtro2a).style.color = '#FF0000'
      if(buscador.length>0){
    
          
                  bbddComercios.forEach(item => {
                    
                      if(item.data().activo == "true"){
                                         console.log("item.data().telefono: ", item.data().telefono)
            if(item.data().tags.join().toLowerCase().includes(buscador)){
                bbddComerciosFiltrados.push(item)
                filtro="categorias"
                filtro2="categoria"         
              console.log("item.data().telefono: blcok ", item.data().telefono)
                document.getElementById(item.data().telefono).style.display = "block";
               
            }else{
                  console.log("item.data().telefono: none ", item.data().telefono)
                document.getElementById(item.data().telefono).style.display="none" 
                
            }  
                      }
       
    
         }) 
          
          
          
          
            bbddComerciosGuia.data().comercios.forEach(item => {
            if(item.tags.join().toLowerCase().includes(buscador)){
                bbddComerciosFiltrados.push(item)
                filtro="categorias"
                filtro2="categoria"         
                document.getElementById(item.telefono).style.display = "block";
            }else{
                document.getElementById(item.telefono).style.display="none" 
            }  
    
         }) 
          
         
              }else{
                  

                  
                    bbddComercios.forEach(item => {
                     console.log("cambiar a true")
                      if(item.data().activo == "true"){
                       console.log("item.data().telefono: ", item.data().telefono)
                      document.getElementById(item.data().telefono).style.display = "block";
                      }
                    })
                  
                  
             bbddComerciosGuia.data().comercios.forEach(item => {
          
                document.getElementById(item.telefono).style.display = "block";
            
    
         }) 
      
        
        }
}

const filtroSeleccionado = e =>{



    console.log("todas?", e.target.textContent)
    if(e.target.textContent=="Todas"){
        location.reload()
    }else{


    let bbddComerciosFiltrados=[]
    let filtro=""
    let filtro2=""
   


    
    const filtro2a=e.target.textContent
    console.log("filtro2a", filtro2a)
    const categoria2a="categoria"

   
    
    if(e.target.dataset.id=="categoria"){

        console.log("categoria seleccionada 23")


     

        
        
       

        // coloreo el filtro elegido
        //document.getElementById(filtro2a).style.color = '#FF0000'

        bbddComercios.forEach(item => {
            if(item.data().categoria==filtro2a){
                bbddComerciosFiltrados.push(item)
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
        bbddComercios.forEach(item => {
            if(item.data().marca==filtro2a){
                bbddComerciosFiltrados.push(item)
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

    

    console.log(bbddComercios)

    
  // filtrarDatos(bbddComerciosFiltrados)
     //pintarCards(bbddComercios, filtro, filtro2)
        
}
}

// ocultar / mostrar desplegables
function ver(n) {
    document.getElementById("subseccion"+n).style.display="block"
    }
function ocultar(n) {
    document.getElementById("subseccion"+n).style.display="none"
    }







    const pintarCarrito = () => {

        let bbddComercios = []  
       db.collection("catalogos").doc(emailVendedor).collection("productos")
       .get()
       .then((querySnapshot) => {
           bbddComercios=querySnapshot
          items.innerHTML = ''
          Object.values(carrito).forEach(producto => {
      
              const idProductoCarrito= producto.id
         
              bbddComercios.forEach(producto2=>{
      
            
      
             
      
      
                  if(idProductoCarrito==producto2.data().id){
                     
                      if(producto2.data().stock!=0){
                  
      
      
                      
              templateCarrito.querySelector('th').textContent = producto.cantidad
              console.log("producto2.data().cantidad.toString", producto2.data().cantidad)
              if(producto2.data().cantidad >0){
                  templateCarrito.querySelectorAll('td')[1].textContent = producto2.data().title+" x"+producto2.data().cantidad.toString();
              }else{
                  templateCarrito.querySelectorAll('td')[1].textContent = producto2.data().title
              }
              templateCarrito.querySelector('img').setAttribute('src', producto2.data().imagen)        
      
              templateCarrito.querySelector('span').textContent = producto2.data().precio * producto.cantidad
      
              
              
              //botones
              templateCarrito.querySelector('.btn-success').dataset.id = producto.id
      
              
              templateCarrito.querySelector('.btn-danger').dataset.id = producto.id
         
              templateVendedores.querySelector('img').setAttribute('src', producto2.data().imagen)
      
              carrito[producto.id].precio= producto2.data().precio * producto.cantidad
      
      
      
              //agregar al carrito actualizado
      
      
                      }
                  }
              })
      
      
      
      
         
              const clone = templateCarrito.cloneNode(true)
              fragment.appendChild(clone)
          })
      
          items.appendChild(fragment)
      
          pintarFooter()
      
          localStorage.setItem('carrito', JSON.stringify(carrito))
          actualizarCarrito()
      
      })
      .catch((error) => {
         
      });
      }

      const actualizarCarrito = ()=>{

        
        if(inicio){
            inicio=false
        }else{
            const carrito = JSON.parse(localStorage.getItem('carrito'))
          //console.log("pintar carrito inicio no")
          //const carritoArray= Array.from(Object.values(carrito));
          db.collection("carrito").doc(email).collection("productos").doc(emailVendedor).set({
              carrito: carrito,
          vendedorEmail: emailVendedor })
         
          .then(() => {
              console.log("Carrito guardado");
          })
          .catch((error) => {
              console.error("Error guardando carrito en bbdd ", error);
          });
      }
      }


      const pintarFooter = () => {
        console.log("pintarfooter")
        footer.innerHTML = ''
        
        if (Object.keys(carrito).length === 0) {
            footer.innerHTML = `
            <th scope="row" colspan="5">Carrito vacío. Ve a inicio y comienza a cargar productos al carrito.</th>
            `
            return
        }else{
        
        }
        
        // sumar cantidad y sumar totales
        const nCantidad = Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0)
        const nPrecio = Object.values(carrito).reduce((acc, {cantidad, precio}) => acc + cantidad * precio ,0)
        // console.log(nPrecio)
        total= nPrecio
        templateFooter.querySelectorAll('td')[1].textContent = "Total"
        templateFooter.querySelectorAll('td')[2].textContent = nCantidad
        templateFooter.querySelector('span').textContent = nPrecio
        
    
        //pinto el numero al lado del carrito "insignia"
        cantidadDeProductos.querySelector('span').textContent = nCantidad
        const clone = templateFooter.cloneNode(true)
        fragment.appendChild(clone)
    
        footer.appendChild(fragment)
    
        const boton = document.querySelector('#vaciar-carrito')
        boton.addEventListener('click', () => {
            carrito = {}
            pintarCarrito()
            cantidadDeProductos.querySelector('span').textContent = ""
            
        })
    
     
    
    }




    const btnAumentarDisminuir = e => {
        // console.log(e.target.classList.contains('btn-success'))
        if (e.target.classList.contains('btn-success')) {
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