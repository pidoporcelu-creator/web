//alt+shift+f formatear / acomodar documento
import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());

const db = firebase.firestore();
const iniciarSesion = document.getElementById('iniciarSesion');
const formularioRegistro = document.getElementById('loginFormUi');
const btnIniciarSesion = document.getElementById('btnIniciarSesion');
const btnRegistrarUsuario = document.getElementById('btnLogin');
const btnCoordinarConVendedor = document.getElementById("coordinarEntrega");
const btnPagar = document.getElementById("pagar");
const cards = document.getElementById('cards')
const vendedores = document.getElementById('vendedores')
const items = document.getElementById('items')
const footer = document.getElementById('footer')
const templateCard = document.getElementById('template-card').content
const templateVendedores = document.getElementById('template-vendedores').content
const templateFooter = document.getElementById('template-footer').content
const templateCarrito = document.getElementById('template-carrito').content
const fragment = document.createDocumentFragment()
          







btnCoordinarConVendedor.style.display = "none";
btnIniciarSesion.style.display = "none";
iniciarSesion.style.display = "none";
vendedores.style.display = "none";
eligeTuVendedor.style.display = "none"


let carrito = {}
let idGuardado = ""
let vendedor = ""
let total = ""
let vendedorFicha = {}
let telefono = ""
let email = ""
let emailVendedor = ""
let preference = {
    items: [

    ],
    back_urls: {
        success: "http://localhost:3000/feedback",
        failure: "http://localhost:3000/feedback",
        pending: "http://localhost:3000/feedback",
      },
      auto_return: "approved",
};






// Eventos
// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {





    if (localStorage.getItem('carrito')) {
        carrito = JSON.parse(localStorage.getItem('carrito'))









        console.log("carrito", carrito)








        pintarCarrito()

    }


    extraerParametros()

    if (localStorage.getItem('idGuardado')) {
        idGuardado = localStorage.getItem('idGuardado')
        // console.log("="+idGuardado)
    }





    if (localStorage.getItem('vendedor') && localStorage.getItem('vendedor') != "undefined") {




    } else {
        if (localStorage.getItem('vendedorFicha') && localStorage.getItem('vendedorFicha') != "undefined") {
            console.log("vendedorFicha345:", JSON.parse(localStorage.getItem('vendedorFicha')))
            vendedorFicha = JSON.parse(localStorage.getItem('vendedorFicha'))
            btnRegistrarUsuario.textContent = "coordinar entrega con: " + vendedorFicha.nick




        } else {
            console.log("no hay vendedorFicha en LocalStorage");

            //ocultar boton coordinar entrega
            btnCoordinarConVendedor.style.display = 'none';



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
btnCoordinarConVendedor.addEventListener('click', e => { console.log("btncoordinarConVendedor"), verificarLogin() })
btnPagar.addEventListener('click', e => { console.log("btnPagar"), pagar() })

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
/* const fetchData = async () => {
    const res = await fetch('api.json');
    const data = await res.json()
    console.log(data)
    //pintarCards(data)
} */

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




    data.forEach(item => {
        console.log(item.data().nick, "CintiaFernandez")

        templateVendedores.querySelector('.titulo').textContent = item.data().nombre + " " + item.data().apellido
        templateVendedores.querySelector('.precio').textContent = item.data().telefono
        templateVendedores.querySelector('button').dataset.id = item.data().nick
        templateVendedores.querySelector('.talle').textContent = item.data().direccion
        templateVendedores.querySelector('.color').textContent = item.data().nick



        if (item.data().nick = "CintiaFernandez") {
            templateVendedores.querySelector('img').setAttribute('src', "recursos/imagenes/vendedores/" + item.data().nick + ".jpeg")


        }







        templateVendedores.querySelector('.email').textContent = item.data().email

        const clone = templateVendedores.cloneNode(true)
        fragment.appendChild(clone)






    })
    vendedores.appendChild(fragment)

    const eligeTuVendedor = document.getElementById("eligeTuVendedor");
    eligeTuVendedor.style.display = "block";


    //boton seleccionar


}

const Seleccionar = e => {
    if (e.target.classList.contains('btn-dark')) {
        btnCoordinarConVendedor.style.display = "block"
        btnCoordinarConVendedor.textContent = "Coordinar entrega con: " + e.target.dataset.id
        eligeTuVendedor.style.display = "none"
        vendedores.style.display = "none"
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
        telefono: item.querySelector('.precio').textContent,
        email: item.querySelector('.email').textContent,
    }


    console.log("telefono 6493", vendedorFicha.telefono)
    init()

    console.log("emailVendedor2", vendedorFicha.email)
    localStorage.setItem("vendedorFicha", JSON.stringify(vendedorFicha))
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
    const id = producto.id
    //console.log(id)
    localStorage.setItem("idGuardado", id)

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

    let bbddProductos = []
    db.collection("catalogo")
        .get()
        .then((querySnapshot) => {

            bbddProductos = querySnapshot
            console.log("bbddProductos")

            items.innerHTML = ''

            Object.values(carrito).forEach(producto => {

                console.log("carrito", producto)

                const idGrupoProductoCarrito = producto.idGrupo
                console.log("idGrupoProductoCarrito", idGrupoProductoCarrito)
                bbddProductos.forEach(producto2 => {






                    if (idGrupoProductoCarrito == producto2.data().idGrupo) {
                        console.log("idproCarrito", idGrupoProductoCarrito)
                        console.log("idpro", producto2.data().idGrupo)
                        console.log("idpro", producto2.data().title)


                        preference.items.push({
                            title: producto2.data().title,
                            unit_price: producto2.data().precio,
                            quantity: producto.cantidad,
                        });




                        templateCarrito.querySelector('th').textContent = producto.id
                        templateCarrito.querySelectorAll('td')[0].textContent = producto2.data().title
                        templateCarrito.querySelectorAll('td')[1].textContent = producto2.data().talle
                        templateCarrito.querySelectorAll('td')[2].textContent = producto.color
                        templateCarrito.querySelectorAll('td')[3].textContent = producto.cantidad

                        templateCarrito.querySelector('span').textContent = producto2.data().precio * producto.cantidad



                        //botones
                        templateCarrito.querySelector('.btn-info').dataset.id = producto2.data().id
                        templateCarrito.querySelector('.btn-danger').dataset.id = producto2.data().id
                        console.log("producto2.data.url", producto2.data().url)
                        templateVendedores.querySelector('img').setAttribute('src', producto2.data().url)

                        carrito[producto.id].precio = producto2.data().precio * producto.cantidad
                        console.log("carritoActualizado", carrito)


                        //agregar al carrito actualizado


                    }

                    
                })




                console.log("clone")
                const clone = templateCarrito.cloneNode(true)
                fragment.appendChild(clone)
            })
            console.log("preference: ", preference.items)

            

            console.log("items.appendChild")
            items.appendChild(fragment)

            pintarFooter()

            localStorage.setItem('carrito', JSON.stringify(carrito))
            console.log("carrito guardado en local storage", carrito)
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
}

const pintarFooter = () => {
    footer.innerHTML = ''

    if (Object.keys(carrito).length === 0) {
        vendedores.style.display = "none"
        eligeTuVendedor.style.display = "none"
        footer.innerHTML = `
        <th scope="row" colspan="5">Carrito vacío. Ve a inicio y comienza a cargar productos al carrito.</th>
        `
        return
    } else {
        vendedores.style.display = ""
        eligeTuVendedor.style.display = "block"
    }

    // sumar cantidad y sumar totales
    const nCantidad = Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0)
    const nPrecio = Object.values(carrito).reduce((acc, { cantidad, precio }) => acc + cantidad * precio, 0)
    // console.log(nPrecio)
    total = nPrecio
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
            carrito[e.target.dataset.id] = { ...producto }
        }
        pintarCarrito()
    }
    e.stopPropagation()
}


function extraerParametros() {



    // url en string
    const url = window.location.href;


    console.log("extraerParametros", url)





    if (typeof url != 'string') {
        throw TypeError('El argumento debe ser una cadena de caracteres.');
    }

    // Pendiente: validar si una cadena de caracteres corresponde con una URL.

    return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce((a, p) => ((a[p.slice(0, p.indexOf('='))] = p.slice(p.indexOf('=') + 1)), a), {});
}

try {
    localStorage.setItem("idGuardado", extraerParametros(document.URL).producto)

    const parametroVendedor = extraerParametros(document.URL).vendedor

    console.log("parametroVendedor: " + parametroVendedor)


    //busco vendedor en el parametro de la url
    if (parametroVendedor != null && parametroVendedor.length > 0) {
        vendedor = extraerParametros(document.URL).vendedor
        console.log("Vendedor url546", vendedor)
        //window.location="carrito.html?vendedor="+vendedor;
        buscarVendedor(vendedor)
    } else {


        // segunda opcion busco vendedor en el local storage. Primero url para que la venta se la lleve el que compartio el link de la venta.
        vendedorFicha = JSON.parse(localStorage.getItem("vendedorFicha"))
        if (vendedorFicha != null) {
            vendedor = vendedorFicha.nick
            console.log("vendedor738:" + vendedor)
            //window.location="carrito.html?vendedor="+vendedor;
            buscarVendedor(vendedor)
        }
        // si no encuenctro, busco todos los vendedores
        else {
            console.log("parametroVendedor no encontrado")
            buscarVendedor()
        }
    }







    //console.log(extraerParametros(document.URL).producto);

    // {prop1: v1, prop2: v2, prop3: v3}
} catch (e) {
    console.log(`Error: ${e.message}`);
}


function buscarVendedor(vendedor) {
    console.log("buscarVendedor231: ", vendedor)



    db.collection("vendedores")
        .get()
        .then((querySnapshot) => {
            const data2 = querySnapshot
            pintarVendedores(data2)
            querySnapshot.forEach((doc) => {



                console.log("doc.data().nick", doc.data().nick)
                console.log("vendedor: ", vendedor)
                const nickVendedor = doc.data().nick
                if (nickVendedor == vendedor) {

                    console.log("vendedor encontrado!!!!", vendedor)

                    vendedorFicha = {
                        nombre: doc.data().nombre + " " + doc.data().apellido,
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
                    eligeTuVendedor.style.display = "none"
                    btnCoordinarConVendedor.textContent = "Coordinar entrega con: " + vendedorFicha.nick
                    btnCoordinarConVendedor.style.display = "block";

                    console.log("telefono969", doc.data().telefono)
                    const telefono = vendedorFicha.telefono
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


//crear el icono de whatsapp. inicio

function init() {

    const telefono = vendedorFicha.telefono

    console.log("telefono564", telefono)

    if (telefono > 0) {
        let a = createA("https://api.whatsapp.com/send?phone=+549" + telefono + "&text=Hola,%20vengo%20de%20https://tienda1.ar.%20Quisiera%20realizarte%20una%20consulta"
            , "whatsapp");

        document.body.appendChild(a);
    } else {
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

window.onload = init;

//crear el icono de whatsapp. fin

//buscar vendedores en bbdd
const form = document.forms['loginForm'];

function verificarLogin() {
    console.log("verificarLogin")

    firebase.auth().onAuthStateChanged(handleAuthState);
    form.addEventListener('submit', handleFormSubmit);
}

function handleAuthState(user) {
    console.log("handleAuthState")
    if (user) {
        localStorage.setItem("email", user.email)
        console.log("usuario logeado1: " + user.email)
        buscarUsuarioEnbbdd(user.email)
        return console.log('Habemus user 🎉');
    } else {
        console.log("usuario no logeado1")
        iniciarSesion.style.display = "block";
        btnIniciarSesion.style.display = "block";
        btnCoordinarConVendedor.style.display = "none";


        return console.log('No habemus user 😭');
    }


}

function handleFormSubmit(event) {
    event.preventDefault();

    const nombre = form['nombrecompleto'].value;
    const direccion = form['direccion'].value;
    const telefono = form['telefono'].value;
    const dni = form['dni'].value;
    //const isLoginOrSignup = form['isLoginOrSignup'].value;

    return crearUsuario({ nombre, direccion, telefono, dni });
}

function guardarPedido() {
    console.log("guardar pedido")






    var email2 = ""

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

    const emailCliente = email2

    console.log("localStorage, ", JSON.parse(localStorage.getItem("clienteFicha")))

    const telefono = JSON.parse(localStorage.getItem("clienteFicha")).telefono



    const nombre = JSON.parse(localStorage.getItem("clienteFicha")).nombre
    const direccion = JSON.parse(localStorage.getItem("clienteFicha")).direccion
    const dni = JSON.parse(localStorage.getItem("clienteFicha")).dni
    const fecha = firebase.firestore.FieldValue.serverTimestamp()


    console.log("guardando pedido en firebase......")
    console.log(emailCliente)
    console.log("vendedor", vendedorFicha.email)
    console.log("carrito", carrito)
    const carritoArray = Array.from(Object.values(carrito));
    console.log("arr", carritoArray);
    console.log("total", total)
    console.log("fichaCliente", JSON.parse(localStorage.getItem("clienteFicha")))






    const ref = db.collection("ventas").doc()
    const refId = ref.id
    ref.set({
        direccion,
        dni,
        "email": emailCliente,
        "estado": "Sin procesar",
        fecha,
        "idPedido": refId,
        nombre,
        "nota": "",
        "pedido": "Sin procesar",
        telefono,
        total,
        "vendedor": vendedorFicha.email,
        "carrito": carritoArray,

    })

        .then(() => {
            console.log("pedido cargado3")
            carrito = {}
            btnCoordinarConVendedor.style.display = "none";
            pintarCarrito()
            const telefono = vendedorFicha.telefono
            console.log("telefono342", telefono)

            window.location = "https://api.whatsapp.com/send?phone=+549" + telefono + "&text=Hola,%20realice%20la%20compra%20con%20código:%20" + refId + "%20Quisiera%20coordinar%20el%20pago%20y%20entrega";

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






function login() {

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        console.log("login:", user.displayName);
        iniciarSesion.style.display = "none";
        btnIniciarSesion.style.display = "none";
        buscarUsuarioEnbbdd(user.email)

        //updateUser(user);







        // ...
    }).catch(function (error) {
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

function buscarUsuarioEnbbdd(emailCliente) {
    console.log("buscarUsuario", emailCliente)
    var docRef = db.collection("usuarios").doc(emailCliente)
    docRef.get().then((doc) => {
        if (doc.exists) {

            console.log("Document data:", doc.data());

            console.log("email cliente453", doc.data().email, doc.data().nombre)
            localStorage.setItem("clienteFicha", JSON.stringify(doc.data()))
            guardarPedido()
            //const clienteFicha23=JSON.parse(localStorage.getItem("vendedorFicha"))
            //console.log("clienteFicha23", clienteFicha23.telefono)








            btnCoordinarConVendedor.style.display = "block"


        } else {
            // doc.data() will be undefined in this case
            console.log("No existe ficha del usuario en bbdd!");



            btnCoordinarConVendedor.style.display = "none";
            btnRegistrarUsuario.textContent = "coordinar entrega con: " + vendedorFicha.nick


            showPrivateInfo()
            //mostrarCampos()



        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });



}

function showPrivateInfo(user) {
    const loginForm = document.getElementById('loginFormUI');
    loginForm.style.display = 'block';

    const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo3');
    hiddenPrivateInfo.style.display = 'block';

    hiddenPrivateInfo.innerHTML = `
      <p> <b></b> Estas logeado</p>
      <button id="btnLogout" class="button">Cerrar sesión</button>
      
    `;

    mostrarCampos()




}


function mostrarCampos() {


    btnCoordinarConVendedor.style.display = "none;"

    btnRegistrarUsuario.style.display = "block"
    console.log("mostrarCampos")

    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
    hiddenPrivateInfo3.style.display = 'block';
    hiddenPrivateInfo3.innerHTML = `

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

function ocultarCampos() {
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

function crearUsuario({ nombre, direccion, telefono, dni }) {

    var email2 = ""

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
        "email": email2,
        nombre,
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

async function pay() {
    try{
        


        var script = document.createElement("script");
  
        // The source domain must be completed according to the site for which you are integrating.
        // For example: for Argentina ".com.ar" or for Brazil ".com.br".
        script.src = "https://www.mercadopago.com.ar/integrations/v1/web-payment-checkout.js";
        script.type = "text/javascript";
        script.dataset.preferenceId = preference.preferenceId;
        document.getElementById("page-content").innerHTML = "";
        document.querySelector("#page-content").appendChild(script);

    }
    catch {
        window.alert("Sin stock");
    }

    carrito = [];
    total = 0;
    //await fetchProducts();
    document.getElementById("checkout").innerHTML = `Pagar $${total}`
}





