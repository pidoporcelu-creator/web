import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());

const db = firebase.firestore();
const iniciarSesion= document.getElementById('iniciarSesion');

const btnIniciarSesion = document.getElementById('btnIniciarSesion');
const btnRegistrarUsuario = document.getElementById('btnLogin');
const cards = document.getElementById('cards')
const vendedores = document.getElementById('vendedores')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
const templateCard = document.getElementById('template-card').content
const templateVendedores = document.getElementById('template-vendedores').content
const templateFooter = document.getElementById('template-footer').content
const templateCarrito = document.getElementById('template-carrito').content
const fragment = document.createDocumentFragment()
const btnEnviar= document.getElementById('btnEnviar');


// SDK de Mercado Pago





btnIniciarSesion.style.display = "none";
iniciarSesion.style.display = "none";
//vendedores.style.display= "none";
//eligeTuVendedor.style.display="none"


let carrito = {}
let venta = false
let idGuardado= ""
let vendedor=""
let total=""
let vendedorFicha={}
let telefono=""
let email=""

let preference = {
    items: [
      {
        title: 'Mi producto',
        unit_price: 100,
        quantity: 1,
      }
    ]
  };

let emailVendedor="lution.celeste@gmail.com"
let inicio=true





// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {

 


    
    if (localStorage.getItem('carrito')) {
        carrito = JSON.parse(localStorage.getItem('carrito'))

      
       

        pintarCarrito()
		verificarLogin()

    }


    //extraerParametros()

    if (localStorage.getItem('idGuardado')) {
        idGuardado= localStorage.getItem('idGuardado')
       // console.log("="+idGuardado)
    }




    
if(localStorage.getItem('vendedor')  && localStorage.getItem('vendedor') !="undefined"){




}else{
    if (localStorage.getItem('vendedorFicha')  && localStorage.getItem('vendedorFicha') !="undefined" )  {
        console.log("vendedorFicha345:",JSON.parse(localStorage.getItem('vendedorFicha')))
        vendedorFicha =   JSON.parse(localStorage.getItem('vendedorFicha')) 
        btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick


        
        
    }else{
        console.log("no hay vendedorFicha en LocalStorage");

        //ocultar boton coordinar entrega

        
        
     
    }
}









});




items.addEventListener('click', e => { btnAumentarDisminuir(e) })
btnIniciarSesion.addEventListener('click', e => { login(e) })



const Seleccionar = e => {
    if (e.target.classList.contains('btn-dark')) {

       eligeTuVendedor.style.display="none"
       vendedores.style.display="none"
        setVendedor(e.target.parentElement)
    }
    if (e.target.classList.contains('crop')) {
        // console.log(e.target.dataset.id)
        // console.log(e.target.parentElement)
        
    }
    e.stopPropagation()
}

const setVendedor = item => {


  

    


   vendedorFicha = {
       nombre: item.querySelector('.titulo').textContent,
       apellido: item.querySelector('.precio').textContent,
       direccion: item.querySelector('.talle').textContent,
       nick: item.querySelector('.color').textContent,
       telefono: item.querySelector('.precio').textContent,
       email: item.querySelector('.email').textContent,
    }


  
   // init()

    
   localStorage.setItem("vendedorFicha", JSON.stringify(vendedorFicha) ) 
   //const vendedorFicha=JSON.parse(localStorage.getItem("vendedorFicha"))


    
    


    

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
    //console.log(id)
    localStorage.setItem("idGuardado", id )
  
}




const setCarrito = item => {
     //console.log(item)
    const producto = {
        title: item.querySelector('.titulo').textContent,
        precio: item.querySelector('.precio').textContent,
        talle: item.querySelector('.talle').textContent,
        color: item.querySelector('.color').textContent,
        id: item.querySelector('button').dataset.id,

        cantidad: 1

        
    }
  
  
    if (carrito.hasOwnProperty(producto.id)) {
        producto.cantidad = carrito[producto.id].cantidad + 1
    }

    carrito[producto.id] = { ...producto }
    
    pintarCarrito()
}

const pintarCarrito = () => {

  let bbddProductos = []  
 db.collection("catalogos").doc(emailVendedor).collection("productos")
 .get()
 .then((querySnapshot) => {
     bbddProductos=querySnapshot
    items.innerHTML = ''
    Object.values(carrito).forEach(producto => {

        const idProductoCarrito= producto.id
   
        bbddProductos.forEach(producto2=>{

      

       


            if(idProductoCarrito==producto2.data().id){
               
                if(producto2.data().stock!=0){
            


                
        templateCarrito.querySelector('th').textContent = producto.cantidad
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
      const carritoArray= Array.from(Object.values(carrito));
      db.collection("carrito").doc(email).collection("productos").doc(emailVendedor).set({
          carrito: carritoArray,
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
  
        if(venta){
            footer.innerHTML = `
        <th scope="row" colspan="5">Exelente!!! te enviaremos el pedido según los "Datos de entrega".</th>
        `
        }else{
            footer.innerHTML = `
        <th scope="row" colspan="5">Carrito vacío. Ve a inicio y comienza a cargar productos al carrito.</th>
        `
        }
        
        btnEnviar.style.display="none"
        return
    }else{
    
    }
    
    // sumar cantidad y sumar totales
    const nCantidad = Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0)
    const nPrecio = Object.values(carrito).reduce((acc, {cantidad, precio}) => acc + precio ,0)
    // console.log(nPrecio)
    total= nPrecio
	templateFooter.querySelectorAll('td')[1].textContent = "Total"
    templateFooter.querySelectorAll('td')[2].textContent = nCantidad
    templateFooter.querySelector('span').textContent = nPrecio
    

    const clone = templateFooter.cloneNode(true)
    fragment.appendChild(clone)

    footer.appendChild(fragment)

    const boton = document.querySelector('#vaciar-carrito')
    boton.addEventListener('click', () => {
        carrito = {}
        pintarCarrito()
        
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


function extraerParametros() {



    // url en string
    const url = window.location.href;




  


    if (typeof url != 'string') {
        throw TypeError('El argumento debe ser una cadena de caracteres.');
    }

    // Pendiente: validar si una cadena de caracteres corresponde con una URL.

    return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce((a, p) => ((a[p.slice(0, p.indexOf('='))] = p.slice(p.indexOf('=') + 1)), a), {});
}

try {
    localStorage.setItem("idGuardado", extraerParametros(document.URL).producto )
    
    const parametroVendedor= extraerParametros(document.URL).vendedor





    //busco vendedor en el parametro de la url
    if(parametroVendedor!=null && parametroVendedor.length>0){
        vendedor= extraerParametros(document.URL).vendedor

    
        //window.location="carrito.html?vendedor="+vendedor;
        buscarVendedor(vendedor)
     }else{


     // segunda opcion busco vendedor en el local storage. Primero url para que la venta se la lleve el que compartio el link de la venta.
     vendedorFicha= JSON.parse(localStorage.getItem("vendedorFicha"))
     if(vendedorFicha!=null){
        vendedor= vendedorFicha.nick
        console.log("vendedor738:"+vendedor)
        //window.location="carrito.html?vendedor="+vendedor;
        buscarVendedor(vendedor)
    }
      // si no encuenctro, busco todos los vendedores
      else{
        console.log("parametroVendedor no encontrado")
        buscarVendedor()
    }
}
    
    
    
    
  
    
    
    //console.log(extraerParametros(document.URL).producto);
 
    // {prop1: v1, prop2: v2, prop3: v3}
} catch (e) {
    console.log(`Error: ${e.message}`);
}

/*
function buscarVendedor(vendedor) {
    console.log("buscarVendedor231: ", vendedor)

 
  
    db.collection("vendedores")
.get()
.then((querySnapshot) => {
    const data2=  querySnapshot
    pintarVendedores(data2)
    querySnapshot.forEach((doc) => {

       

        console.log("doc.data().nick", doc.data().nick)
        console.log("vendedor: ", vendedor)
        const nickVendedor= doc.data().nick
        if(nickVendedor==vendedor){

            console.log("vendedor encontrado!!!!", vendedor)
           
            vendedorFicha = {
                nombre: doc.data().nombre+" "+doc.data().apellido,
                apellido: doc.data().apellido,
                direccion: doc.data().direccion,
                nick: doc.data().nick,
                telefono: doc.data().telefono,
                email: doc.data().email,
                nick: doc.data().nick,

            
                
             }
             console.log("emailVendedor encontrado", vendedorFicha.email, vendedorFicha.telefono)  
             //hay un vendedor seleccionado en la url. entonces oculto todos los vendedores
             vendedores.style.display = "none";
             eligeTuVendedor.style.display="none"
       
     

             console.log("telefono969", doc.data().telefono)
             const telefono= vendedorFicha.telefono
             console.log("telefono968", telefono)
             init()
                
       

             

         
        }

    });
 

    
   
   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});





    //        window.location="https://api.whatsapp.com/send?phone=+5493446562973&text=Hola,%20realice%20la%20compra%20con%20código:%20"+docRef.id+"%20Quisiera%20coordinar%20el%20pago%20y%20entrega";

}
*/

//crear el icono de whatsapp. inicio

function init() {

    const telefono = "vendedorFicha.telefono"

    console.log("telefono564", telefono)
      
    if(telefono>0){
    let a = createA("https://api.whatsapp.com/send?phone=+549"+telefono+"&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta"
    , "whatsapp");
 
    document.body.appendChild(a);
   }else{
    console.log("lengt <0")

let a = createA("vendedores.html"
, "whatsapp");
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
        icono.setAttribute("class", "bi bi-whatsapp")
        a.appendChild(icono);
    }
    return a;
}
 
//window.onload = init;

//crear el icono de whatsapp. fin

//buscar vendedores en bbdd


function verificarLogin(){
    console.log("verificarLogin")
   
    firebase.auth().onAuthStateChanged(handleAuthState);

}

function handleAuthState(user) {
    console.log("handleAuthState")
    if (user) {
        email = user.email
    localStorage.setItem("email", user.email)
    console.log("usuario logeado1: "+user.email)
    buscarUsuarioEnbbdd(user.email)
    return console.log('Habemus user 🎉');
  }else{
    console.log("usuario no logeado1")
    iniciarSesion.style.display = "block";
    btnIniciarSesion.style.display = "block";
    const loginForm = document.getElementById('task-form-envio');
    loginForm.style.display = 'none';
   
   

    return console.log('No habemus user 😭');
  }


}

/*function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = document.forms['loginForm'];
    const nombre = form['nombrecompleto'].value;
    const direccion = form['direccion'].value;
    const telefono = form['telefono'].value;
    const entreCalles = form['entreCalles'].value;
    const referencia = form['referencia'].value;
    //const isLoginOrSignup = form['isLoginOrSignup'].value;
    console.log("direccionnnnnnnnnnnnnnnnnnn", direccion)

    return guardarPedido (nombre, direccion, telefono, entreCalles, referencia);
  }*/
  
  function guardarPedido(nombre, telefono, direccion, numero, departamento, entreCalles, referencia){
      console.log("guardar pedido")
      console.log("existe direccion5")

      console.log(nombre)

     
       


     
    
        const user = firebase.auth().currentUser;
        if (user !== null) {
        console.log("user distinto de null poner if")
        }
    
       
    
        console.log("localStorage, ", JSON.parse(localStorage.getItem("clienteFicha")))
          
        
    
    
        const fecha=firebase.firestore.FieldValue.serverTimestamp()
    
    
        console.log("guardando pedido en firebase......", direccion)
  
        console.log("carrito", carrito)
        const carritoArray= Array.from(Object.values(carrito));
        console.log("arr", carritoArray);
        console.log("total", total)
        console.log("fichaCliente", JSON.parse(localStorage.getItem("clienteFicha")))

        

     
    
        console.log("existe direccion6", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
         const ref=db.collection("ventas").doc()
         const refId= ref.id
         ref.set({
            direccion,
            numero,
            departamento,
            entreCalles,
            referencia,
            email,
            "estado": "Sin procesar",
            fecha,
            "idPedido": refId,
            nombre,
            "nota":"",
            "pedido":"Sin procesar",
            telefono,
            total,
            "carrito": carritoArray,
            "envio": "Sin procesar",
            "cadete": "-",
            "retiro": "San martin 1543",
            "vendedor": "Pablos"
          
        })
     
            .then(() => {
                console.log("pedido cargado3")
                carrito = {}
             
                venta= true

            pintarCarrito()

        
          
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
    


  


  function login(){

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;

    console.log("login:", user.displayName);
    iniciarSesion.style.display="none";
    btnIniciarSesion.style.display="none";
    buscarUsuarioEnbbdd(user.email)
    
    //updateUser(user);

    
    
   
   
   
    
    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...

    console.log(errorMessage);
  });
}

function buscarUsuarioEnbbdd(emailCliente){
    console.log("buscarUsuario", emailCliente)
    var docRef= db.collection("usuarios").doc(emailCliente)
    docRef.get().then((doc) => {
        if (doc.exists) {
            
    

        console.log("email cliente453", doc.data().email, doc.data().nombre)
        
        localStorage.setItem("clienteFicha", JSON.stringify(doc.data()) )

        const nombre = doc.data().nombre
        const direccion = doc.data().direccion
        const telefono = doc.data().telefono
        const entreCalles = doc.data().entreCalles
        const referencia = doc.data().referencia
        const numero = doc.data().numero
        const departamento = doc.data().departamento


        if(doc.data().direccion != null){

            console.log("existe direccion", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
            showPrivateInfo(nombre, direccion,  numero, departamento, telefono, referencia, entreCalles)
        }else{
            const nombre = ""
        const direccion = ""
        const numero = ""
        const departamento = ""
        const telefono = ""
        const entreCalles = ""
        const referencia = ""
            console.log("No existe direccion")
            showPrivateInfo(nombre, direccion,  numero, departamento, telefono, referencia, entreCalles)
        }

        //guardarPedido()
        //const clienteFicha23=JSON.parse(localStorage.getItem("vendedorFicha"))
        //console.log("clienteFicha23", clienteFicha23.telefono)



      




           
            
        } else {
            // doc.data() will be undefined in this case
            console.log("No existe ficha del usuario en bbdd!");
            
            
  
        
            btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick
            
   
            
            showPrivateInfo()
            //mostrarCampos()
        
            
    
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });



}

function showPrivateInfo(nombre, direccion, numero, departamento, telefono, referencia, entreCalles) {
    console.log("existe direccion2", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
    const loginForm = document.getElementById('task-form-envio');
    loginForm.style.display = 'block';
    
    const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo3');
    hiddenPrivateInfo.style.display = 'block';
   
    hiddenPrivateInfo.innerHTML = `
      <p> <b></b> Estas logeado</p>
      <button id="btnLogout" class="button">Cerrar sesión</button>
      
    `;

    
    mostrarCampos(nombre, direccion,  numero, departamento, telefono, referencia, entreCalles)
    
  
    
  
  }


function mostrarCampos(nombre, direccion, numero, departamento, telefono, referencia, entreCalles, email){
    console.log("existe direccion3", nombre, telefono, direccion,  numero, departamento, referencia, entreCalles)
    
    

    
    console.log("mostrarCampos")

    
    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
hiddenPrivateInfo3.style.display = 'block';

/*datos de entrega*/
hiddenPrivateInfo3.innerHTML = `




<input
class="input"
type="nombre completo"
name="nombre completo"
id="nombre"
placeholder="nombre completo"
value="${nombre}"
required
/>



<input
class="input"
type="telefono"
name="telefono"
id="telefono"
placeholder="Telefono"
value="${telefono}"
required
/>

<input
class="input"
type="direccion"
name="direccion"
id="direccion"
placeholder="Direccion"
value="${direccion}"
required
/>

<input
class="input"
type="numero"
name="numero"
id="numero"
placeholder="numero"
value="${numero}"
required
/>

<input
class="input"
type="departamento"
name="departamento"
id="departamento"
placeholder="departamento"
value="${departamento}"
required
/>

<input
class="input"
type="entre calles"
name="entre calles"
id="entreCalles"
placeholder="Entre calles"
value="${entreCalles}"
required
/>



<input
class="input"
type="referencia"
name="referencia"
id="referencia"
placeholder="referencia"
value="${referencia}"
required
/>
  
`

}



  function ocultarCampos(){
    hiddenPrivateInfo3.style.display = 'none';
    hiddenPrivateInfo3.innerHTML = `

<input
class="input"
type="nombre completo"
name="nombre completo"
id="nombrecompleto"
placeholder="Nombre completo"

/>
<input
class="input"
type="direccion"
name="direccion"
id="direccion"
placeholder="Domicilio"

/>


<input
class="input"
type="telefono"
name="telefono"
id="telefono"
placeholder="telefono"

/>



<input
class="input"
type="dni"
name="dni"
id="dni"
placeholder="dni"

/>
  
`
   
  }

  


const taskForm = document.forms['loginForm'];

taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

   const nombre = taskForm["nombre"].value;
     const direccion = taskForm["direccion"].value;
     const numero = taskForm["numero"].value;
     const departamento = taskForm["departamento"].value;
    const entreCalles = taskForm["entreCalles"].value;
    const referencia = taskForm["referencia"].value;
    const telefono = taskForm["telefono"].value;
 
    console.log("existe direccion4", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
    
    
    const response = await db.collection("usuarios").doc(email).set({
        nombre,
        direccion,
        numero,
        departamento,
        entreCalles,
        referencia,
        telefono,
        email,
      
     
     })
 
     .then(() => {
         console.log("datos usuario actualizado")
         guardarPedido(nombre, telefono, direccion, numero, departamento, entreCalles, referencia)
         

      
 
      
 
     })
     .catch((error) => {
         console.error("Error pedido cargado2: ", error);
     });
});


function buscarHorarios(parametroExtraido){
    console.log("buscarHorarios")
    console.log("buscarEn", ".collection(comercios).doc("+parametroExtraido+").collection(horarios)")
    db.collection("comercios").doc(emailVendedor).collection("horarios")
    .get()
    .then((querySnapshot) => {
     querySnapshot.forEach((doc) => {
         // doc.data() is never undefined for query doc snapshots
        
        
         const horarios = querySnapshot
         verificarSiEstaAbiertoElComercio(horarios)
         
         
     });
 })
 .catch((error) => {
     console.log("Error getting documents: ", error);
 });
}

function verificarSiEstaAbiertoElComercio(horarios){

    horarios.forEach((doc) => {
        const dia= doc.data().dia

       const diaActual = new Date();
       const diaActualN = diaActual.getDay();
    
       if(diaActualN==doc.data().orden){
    
           const horaApertura = "01/01/2011 "+doc.data().apertura
           const horaCierre = "01/01/2011 "+doc.data().cierre


           const diaActualH = diaActual.getHours();
           const diaActualM = diaActual.getMinutes();
           const horaActual = "01/01/2011 "+diaActualH+":"+diaActualM
            
      
           if(Date.parse(horaApertura)<Date.parse(horaActual) && Date.parse(horaActual)<Date.parse(horaCierre)){
               console.log("abierto")
               abierto = true

               return
           }else{
               console.log("cerrado")
               abierto=false
           }
      
       }else{

        abierto=false
        const horario = document.getElementById('horario');
        horario.style.display = 'block';
       
       horario.innerHTML = `
          <h3> <b></b>Comercio cerrado</h3>
       
          
        `;
        
        console.log("cerrado")}

    });




}