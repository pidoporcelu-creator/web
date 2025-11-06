import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());

const db = firebase.firestore();
const iniciarSesion= document.getElementById('iniciarSesion');
const btnIniciarSesion = document.getElementById('btnIniciarSesion');
const btnRegistrarUsuario = document.getElementById('btnLogin');
const btnCoordinarConVendedor= document.getElementById("coordinarEntrega");
const cards = document.getElementById('cards')
const vendedores = document.getElementById('vendedores')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
const templateCard = document.getElementById('template-card').content
const templateVendedores = document.getElementById('template-vendedores').content
const templateFooter = document.getElementById('template-footer').content
const templateCarrito = document.getElementById('template-carrito').content
const fragment = document.createDocumentFragment()
let carrito = {}
let idGuardado= ""
let vendedor=""
let total=""
let vendedorFicha={}
let telefono=""
let email=""
let emailVendedor=""






// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {

 


    fetchData()
    if (localStorage.getItem('carrito')) {
        carrito = JSON.parse(localStorage.getItem('carrito'))
        console.log(carrito)
        pintarCarrito()

    }


    extraerParametros

    if (localStorage.getItem('idGuardado')) {
        idGuardado= localStorage.getItem('idGuardado')
       // console.log("="+idGuardado)
    }




    
if(localStorage.getItem('vendedor')  && localStorage.getItem('vendedor') !="undefined"){




}else{
    if (localStorage.getItem('vendedorFicha')  && localStorage.getItem('vendedorFicha') !="undefined" )  {
        console.log("vendedorFicha:",JSON.parse(localStorage.getItem('vendedorFicha')))
        vendedorFicha =   JSON.parse(localStorage.getItem('vendedorFicha')) 
        btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick
        cambiarBtnCoordinar(vendedorFicha.nick)
        handleAuthState()
        
        
    }else{
        console.log("no hay vendedorFicha en LocalStorage");

        //ocultar boton coordinar entrega
        btnCoordinarConVendedor.style.display = 'none';
        buscarVendedores()
        
     
    }
}









});

//fetch productos

/* db.collection("tiendaProductos")
.get()
.then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
       

       
       // console.log(doc.data());
       
    });
    const data2=  querySnapshot
    pintarCards(data2)
    
   
   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
}); */


vendedores.addEventListener('click', e => { Seleccionar(e) });
items.addEventListener('click', e => { btnAumentarDisminuir(e) })
btnIniciarSesion.addEventListener('click', e => { login(e) })
btnCoordinarConVendedor.addEventListener('click', e => { console.log("btncoordinarConVendedor"), vendedorVerificarSeleccionado()})


//normalizar url
/*
function normalizarUrl(...partes) {
    return partes.join('/')
        .replace(/[\/]+/g, '/')
        .replace(/^(.+):\//, '$1://')
        .replace(/^file:/, 'file:/')
        .replace(/\/(\?|&|#[^!])/g, '$1')
        .replace(/\?/g, '&')
        .replace('&', '?');
}

console.log(normalizarUrl('http://www.wikipedia.org', "asdasa", 'JavaScript', '?resaltar=URL', '?formato=xml'));
*/

// Traer productos
const fetchData = async () => {
    const res = await fetch('api.json');
    const data = await res.json()
    console.log(data)
    //pintarCards(data)
}

// Pintar productos
/* const pintarCards = data => {
    data.forEach(item => {

        console.log(item.data().id)
       


        
        if(item.data().id==idGuardado){

            console.log(item.data().precio);
           templateCard.querySelector('.titulo').textContent = item.data().title
           templateCard.querySelector('.precio').textContent = item.data().precio
           templateCard.querySelector('button').dataset.id = item.data().id
           templateCard.querySelector('.talle').textContent = item.data().talle
           templateCard.querySelector('.color').textContent = item.data().color
           templateCard.querySelector('img').setAttribute('src', item.data().thumbnailUrl)
           const clone = templateCard.cloneNode(true)
           fragment.appendChild(clone)
        }

        
          
        
      
    })
    cards.appendChild(fragment)
} */


//pintar vendedores

const pintarVendedores = data => {

    console.log("pintarVendedores")


    

    data.forEach(item => {
        console.log(item.data())
 
           templateVendedores.querySelector('.titulo').textContent = item.data().nombre+" "+item.data().apellido
           templateVendedores.querySelector('.precio').textContent = item.data().telefono
           templateVendedores.querySelector('button').dataset.id = item.data().telefono
           templateVendedores.querySelector('.talle').textContent = item.data().direccion
           templateVendedores.querySelector('.color').textContent = item.data().nick
           templateVendedores.querySelector('.email').textContent = item.data().email
           templateVendedores.querySelector('img').setAttribute('src', item.data().imagen)
           const clone = templateVendedores.cloneNode(true)
           fragment.appendChild(clone)
        

        
          
        
      
    })
    vendedores.appendChild(fragment)

    const eligeTuVendedor= document.getElementById("eligeTuVendedor");
eligeTuVendedor.textContent="Elige tu vendedor"
   

    //boton seleccionar
    

}

const Seleccionar = e => {
    if (e.target.classList.contains('btn-dark')) {
       // btnCoordinarConVendedor.style.display="block"
       btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick
        // console.log(e.target.dataset.id)
        console.log(e.target.parentElement)
        setVendedor(e.target.parentElement)
    }
    if (e.target.classList.contains('crop')) {
        // console.log(e.target.dataset.id)
        // console.log(e.target.parentElement)
        
    }
    e.stopPropagation()
}

const setVendedor = item => {
    console.log("setVendedor")

  

    


   vendedorFicha = {
       nombre: item.querySelector('.titulo').textContent,
       apellido: item.querySelector('.precio').textContent,
       direccion: item.querySelector('.talle').textContent,
       nick: item.querySelector('.color').textContent,
       telefono: item.querySelector('button').dataset.id,
       email: item.querySelector('.email').textContent,
    }




    console.log("emailVendedor2", vendedorFicha.email)
   localStorage.setItem("vendedorFicha", JSON.stringify(vendedorFicha) ) 


    


    

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
    console.log("=================================", imagen)
     console.log(producto)
   console.log("dggdlkgldkgldkg", producto.id)
    if (carrito.hasOwnProperty(producto.id)) {
        producto.cantidad = carrito[producto.id].cantidad + 1
    }

    carrito[producto.id] = { ...producto }
    
    pintarCarrito()
}

const pintarCarrito = () => {
    items.innerHTML = ''

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
        <th scope="row" colspan="5">Carrito vacío. Ve a inicio y comienza a cargar productos al carrito.</th>
        `
        return
    }
    
    // sumar cantidad y sumar totales
    const nCantidad = Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0)
    const nPrecio = Object.values(carrito).reduce((acc, {cantidad, precio}) => acc + cantidad * precio ,0)
    // console.log(nPrecio)
    total= nPrecio
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
    localStorage.setItem("idGuardado", extraerParametros(document.URL).producto )

    if(extraerParametros(document.URL).vendedor.length>0){
        localStorage.setItem("vendedor", extraerParametros(document.URL).vendedor)
        console.log(extraerParametros(document.URL).vendedor)
    }
    
    
    //console.log(extraerParametros(document.URL).producto);
 
    // {prop1: v1, prop2: v2, prop3: v3}
} catch (e) {
    console.log(`Error: ${e.message}`);
}














function buscarvendedor(vendedor) {
  


    db.collection("vendedores")
.get()
.then((querySnapshot) => {
    querySnapshot.forEach((doc) => {

        console.log(doc.data().nick)



        if(doc.data().nick=vendedor){
           
            vendedorFicha = {
                nombre: doc.data().nombre+" "+doc.data().apellido,
                apellido: doc.data().apellido,
                direccion: doc.data().direccion,
                nick: doc.data().nick,
                telefono: doc.data().telefono,
                email: doc.data().email,
                nick: doc.data().nick
             }
         
         
             console.log("emailVendedor2", vendedorFicha.email)
             cambiarBtnCoordinar(nick)
           
           window.location="https://api.whatsapp.com/send?phone=+549"+telefono+"&text=Hola,%20realice%20la%20compra%20con%20código:%20"+numeroDePedido+"%20Quisiera%20coordinar%20el%20pago%20y%20entrega";

         
        }else{
            
            console.log("selecciona vendedor")
            
        }
      
       
    });

    
   
   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});





    //        window.location="https://api.whatsapp.com/send?phone=+5493446562973&text=Hola,%20realice%20la%20compra%20con%20código:%20"+docRef.id+"%20Quisiera%20coordinar%20el%20pago%20y%20entrega";

}


//crear el icono de whatsapp. inicio

function init() {
      
 
    let a = createA("https://api.whatsapp.com/send?phone=+549"+telefono+"&text=Hola,%20vengo%20de%20www.tienda1.com.ar.%20Quisiera%20realizarte%20una%20consulta"
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

//buscar vendedores en bbdd
function buscarVendedores(){ 
    
    
    
    
    db.collection("vendedores")
.get()
.then((querySnapshot) => {
  
    const data2=  querySnapshot
    pintarVendedores(data2)
   
   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});
}

function cambiarBtnCoordinar(vendedor){
    const vendedorFicha=JSON.parse(localStorage.getItem("vendedorFicha"))
    btnCoordinarConVendedor.textContent = "coordinar entrega con: "+vendedorFicha.nick
}





//  LOGIN INICIO
btnRegistrarUsuario.style.display = 'none';
btnIniciarSesion.style.display = 'none';
iniciarSesion.style.display = 'none';
btnCoordinarConVendedor.style.display = 'none';


    const form = document.forms['loginForm'];
firebase.auth().onAuthStateChanged(handleAuthState);
form.addEventListener('submit', handleFormSubmit);





// Application defs
function handleAuthState(user) {
  if (user) {
      localStorage.setItem("email", user.email)
      console.log("usuario logeado1: "+user.email)
      btnIniciarSesion.style.display = 'none';
      iniciarSesion.style.display = 'none';
    showPrivateInfo(user.email)
    return console.log('Habemus user 🎉');
  }else{
    console.log("usuario no logeado1")
    btnIniciarSesion.style.display = 'block';
    iniciarSesion.style.display = 'block';

    return console.log('No habemus user 😭');
  }

}

function handleFormSubmit(event) {
  event.preventDefault();

  
  const nombrecompleto = form['nombrecompleto'].value;
  const direccion = form['direccion'].value;
  const telefono = form['telefono'].value;
  const dni = form['dni'].value;
  //const isLoginOrSignup = form['isLoginOrSignup'].value;



  return createUser({nombrecompleto, direccion, telefono, dni });
}


// Application Utils
function showPrivateInfo(userEmail) {
  const loginForm = document.getElementById('loginFormUI');
  loginForm.style.display = 'block';
  btnCoordinarConVendedor.style.display="none"

  const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo');
  hiddenPrivateInfo.style.display = 'block';

  buscarUsuario(userEmail)
 
 /*  hiddenPrivateInfo.innerHTML = `
    <p> <b></b> Estas logeado</p>
    <button id="btnLogout" class="button">Cerrar sesión</button>
    
  `; */

  

}

function showLoginForm() {
  const loginForm = document.getElementById('loginFormUI');
  loginForm.style.display = 'block';
  //btnCoordinarConVendedor.style.display="none"

  const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo');
  hiddenPrivateInfo.style.display = 'none';
  hiddenPrivateInfo.innerHTML = `
    <p>Nada que mostrar, tenes que logearte, bro...</p>
  `;

}

// Firebase defs
function createUser({nombrecompleto, direccion, telefono, dni }) {

    var email2= ""

    const user = firebase.auth().currentUser;
    if (user !== null) {
      // The user object has basic properties such as display name, email, etc.
      const displayName = user.displayName;
      email2 = user.email;
      const photoURL = user.photoURL;
      const emailVerified = user.emailVerified;
    
      // The user's ID, unique to the Firebase project. Do NOT use
      // this value to authenticate with your backend server, if
      // you have one. Use User.getToken() instead.
      const uid = user.uid;
    }
    console.log('Creating user ' + email2);

      // guardamos el usuario en firestore
      db.collection("usuarios").doc(email2).set({
        email2,
        nombrecompleto,
        direccion,
        telefono,
        dni
    
     })
     .then(() => {
        console.log("usuario creado con exito")
        guardarPedido()

        // ...
      })

    .catch(function (error) {
      if (error.code === 'error guardando usuario') {
        console.log('Error creando usuario');
        const soLogin = confirm(
       
        );
        return !!soLogin ? loginUser({ email, password }) : alertTryAgain(error);;
      }

      return alertTryAgain(error);
    });
}

function loginUser({ email, password }) {
  console.log('Loging user' + email);

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function (user) {
        
      console.log('Credenciales correctas, bienvenido.');
      
       // busco datos del cliente
      const docRef = db.collection("usuarios").doc(email);

docRef.get().then((doc) => {
    if (doc.exists) {
        console.log("Document data:", doc.data());
        //guardo datos del cliente en localstorage
        
        console.log("clienteFicha2", JSON.parse(localStorage.getItem("clienteFicha")).nombrecompleto) 

        


    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
}).catch((error) => {
    console.log("Error getting document:", error);
});




    })
    .catch(function (error) {
      console.log(error);
      alertTryAgain(error);
    });
}

function signoutUser() {
  firebase.auth().signOut();
}


// General Utils
function alertTryAgain(error) {
  console.log(error);
  return alert('Error, intenta de nuevo ⛈');
}


//  LOGIN FIN 


//   Guardar pedido

 

   function carritoVerificarContenido(){
       console.log("verificando contenido carrito...")
       if(localStorage.getItem('carrito')){

        console.log("Carrito cargado")
    

       }else{

    window.alert("Comienza a agregar productos a tu carrito");
}
   }

   function vendedorVerificarSeleccionado() {

    if(localStorage.getItem('vendedorFicha')  && localStorage.getItem('vendedorFicha') !="undefined" ){

        
        const vendedorFicha=JSON.parse(localStorage.getItem("vendedorFicha"))
        console.log("vendedor seleccionado:", vendedorFicha.nick)

        guardarPedido()

       

       }else{

    window.alert("Selecciona un vendedor con quien quieras coordinar tu pedido, el te ayudará en el proceso");
    localStorage.removeItem("vendedor")
    

}

   }




function login(){

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;

    console.log("usuario logueado:", user.displayName);
    iniciarSesion.style.display="none";
    btnIniciarSesion.style.display="none";
    buscarUsuario(user.email)
    
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

function buscarUsuario(userEmail){
    console.log("verificar datos cargados")

    var docRef= db.collection("usuarios").doc(userEmail)
    docRef.get().then((doc) => {
        if (doc.exists) {
            
        console.log("Document data:", doc.data());

        console.log("email cliente453", doc.data().email, doc.data().nombrecompleto)
        localStorage.setItem("clienteFicha", JSON.stringify(doc.data()) )
        //const clienteFicha23=JSON.parse(localStorage.getItem("vendedorFicha"))
        //console.log("clienteFicha23", clienteFicha23.telefono)








            btnCoordinarConVendedor.style.display="block"
            const usuario34= document.getElementById('usuario34');
            usuario34.style.display = 'none';
            
        } else {
            // doc.data() will be undefined in this case
            console.log("No existe ficha del usuario en bbdd!");
            
            mostrarCampos()
            btnRegistrarUsuario.style.display = "block";
            btnRegistrarUsuario.textContent = "coordinar entrega con: "+vendedorFicha.nick
        
            
    
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });

}



function crearUsuario(){

    console.log("crear usuario")

    const form = document.forms['loginForm'];
firebase.auth().onAuthStateChanged(handleAuthState);
form.addEventListener('submit', handleFormSubmit);



}

function mostrarCampos(){

    console.log("mostrarCampos")

   

    
    const hiddenPrivateInfo2 = document.getElementById('hiddenPrivateInfo2');
hiddenPrivateInfo2.style.display = 'block';
hiddenPrivateInfo2.innerHTML = `

<input
class="input"
type="nombre completo"
name="nombre completo"
id="nombrecompleto"
placeholder="Nombre completo"
required
/>
<input
class="input"
type="direccion"
name="direccion"
id="direccion"
placeholder="Domicilio"
required
/>


<input
class="input"
type="telefono"
name="telefono"
id="telefono"
placeholder="telefono"
required
/>



<input
class="input"
type="dni"
name="dni"
id="dni"
placeholder="dni"
required
/>
  
`


;
  }
   function ocultarCampos(){
    hiddenPrivateInfo2.style.display = 'none';
    hiddenPrivateInfo2.innerHTML = `

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
 
  



    




   

   function guardarPedido() {
       


    var email2= ""

    const user = firebase.auth().currentUser;
    if (user !== null) {
      // The user object has basic properties such as display name, email, etc.
      const displayName = user.displayName;
      email2 = user.email;
      const photoURL = user.photoURL;
      const emailVerified = user.emailVerified;
    
      // The user's ID, unique to the Firebase project. Do NOT use
      // this value to authenticate with your backend server, if
      // you have one. Use User.getToken() instead.
      const uid = user.uid;
    }

    const emailCliente= email2
    const emailVendedor2= JSON.parse(localStorage.getItem('vendedorFicha')).email

    console.log("localStorage, ", JSON.parse(localStorage.getItem("clienteFicha")))
      
    const telefono =JSON.parse(localStorage.getItem("clienteFicha")).telefono



    const nombre =JSON.parse(localStorage.getItem("clienteFicha")).nombrecompleto
    const fecha=firebase.firestore.FieldValue.serverTimestamp()
    const deuda= total
    const mercaderia= "Sin procesar"

    console.log("guardando pedido en firebase......")
    console.log(emailCliente)


     db.collection("pedidos por vendedor").doc(emailVendedor2).collection("pedidos").add({
        
        emailCliente,
      
    })
    .then((docRef) => {

        console.log("pedido por vendedor guardado")
        var  idPedido2=  docRef.id

        db.collection("pedidos por vendedor").doc(emailVendedor2).collection("pedidos").doc(idPedido2)
        .set({
            idPedido2,
            fecha,
            total,
            deuda,
            telefono,
            nombre,
            mercaderia,
            deuda,
        }) 
        .then(() => {
            console.log("pedido por vendedor cargado2")
        })
        .catch((error) => {
            console.error("Error pedido cargado2: ", error);
        });
        

        

         Object.values(carrito).forEach(producto => {
            id= producto.id
            cantidad= producto.cantidad
            color= producto.color
            precio= producto.precio
            talle= producto.talle
            title= producto.title
       
        

            db.collection("pedidos").doc(idPedido2).collection("productos").doc(id).set({
                id,
                cantidad,
                color,
                precio,
                talle,
                title,
             
            }

            )
            .then(() => {
                console.log("pedido cargado 56")
            })
            .catch((error) => {
                console.error("Error pedido cargado1: ", error);
            });


        }) 



        console.log("emailCliente345", emailCliente)


   
   
  




     

        db.collection("pedidos por cliente").doc(emailCliente).collection("pedidos").doc(idPedido2).set({
            carrito,
            vendedor,
            fecha
         })
         .then(() => {
            console.log("pedido cargado3")
            carrito = {}
        pintarCarrito()
            window.location="https://api.whatsapp.com/send?phone=+5493446562973&text=Hola,%20realice%20la%20compra%20con%20código:%20"+docRef.id+"%20Quisiera%20coordinar%20el%20pago%20y%20entrega";
        })
        .catch((error) => {
            console.error("Error pedido cargado3: ", error);
        });

        //buscarvendedor(docRef.id)

        
        
        

    })
    .catch((error) => {
        console.error("Error adding document3: ", error);
    });





   }




