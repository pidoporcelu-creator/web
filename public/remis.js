import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());






 



const db = firebase.firestore();

const taskForm = document.getElementById("task-form");
const loginForm = document.getElementById('task-form-envio');
const btnIniciarSesion = document.getElementById('btnIniciarSesion');
const seccionIniciarSesion = document.getElementById('iniciarSesion');



const btnCancelar = document.getElementById("cancelarRemis")
const btnRemiseria = document.getElementById("dropdownMenuButton1")
const ultimoViaje = document.getElementById("ultimoViaje")

const templateCard = document.getElementById('template-desplegable').content
const fragment = document.createDocumentFragment()
const cards = document.getElementById('cards')

let email= ""
let idPedido=""
let agenciaNombre="Todas"
let agenciaId="null"
let calificacion= 0








// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {
    console.log("ocultar formulariosolicitud0")
    document.getElementById("formularioSolicitud").style.display="none";
    document.getElementById("iniciarSesion").style.display="none";


   // document.getElementById("formularioSolicitud").style.display="none";
    document.getElementById("calificacion").style.display="none";

    console.log("ocultar vehiculo pedido")
    document.getElementById("vehiculoPedido").style.display="none";


     verificarLogin()  



});

btnCancelar.addEventListener('click', e => { cancelar(e) })
btnIniciarSesion.addEventListener('click', e => { login(e) })
//btnRemiseria.addEventListener('click', e => { console.log("btn remiseria", btnRemiseria.innerHTML) })




function cancelar(){

    console.log("btn cancelar", idPedido)

    // si el viaje no fue tomado por un chofer: lo elimino

    var ref= db.collection("remis").doc("viajes").collection("remis").doc(idPedido)



db.runTransaction((transaction) => {
    return transaction.get(ref).then((sfDoc) => {
        if (!sfDoc.exists) {
            throw "Document does not exist!";
        }

        var viaje = sfDoc.data().viaje;
        var cancelado = "cancelado"
        if (viaje=="pedido") {
            
            ref.delete()
            db.collection("remis").doc("pedidos").collection("remis").doc(idPedido).delete()
            return cancelado;
        } else {
            return Promise.reject("Sorry! el viaje no se puede cancelar, ya ha sido tomado por un remis");
        }
    });
}).then((cancelado) => {
    console.log("El viaje ha sido:", cancelado );
}).catch((err) => {
    // This will be an "population is too big" error.
    console.error("no se pudo cancelar", err);
});

    
}

function login(){

    console.log("login")

    return new Promise((resolve, reject)=> {
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        //ocultar iniciarSesion
        seccionIniciarSesion.style.display="none"
    


        resolve(user.email);

    });

  

   
    
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




taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const buscador = taskForm["buscador"].value;

    console.log("buscar", buscador)
    return filtrar(buscador.toLowerCase())

 
});




function recuperarCatalogo(emailComercio) {


db.collection("catalogos").doc(emailComercio).collection("productos")
.get()
.then((querySnapshot) => {
  bbddProductos=querySnapshot
    bbddProductos=querySnapshot

   // filtrarDatos(bbddProductos)

   
})
.catch((error) => {
    console.log("Error getting documents: ", error);
});
}










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
    buscarRemisPedido()


    buscarUsuarioEnbbdd(user.email)
    

    return console.log('Habemus user 🎉');
  }else{


    console.log("mostrar formulario solicitud")
    document.getElementById("iniciarSesion").style.display="block";

  
   

    return console.log('No habemus user 😭');
  }


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
        const numero = doc.data().numero
        const departamento = doc.data().departamento
        const telefono = doc.data().telefono
        const entreCalles = doc.data().entreCalles
        const referencia = doc.data().referencia


        if(doc.data().direccion != null){

            console.log("existe direccion", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
            showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
        }else{
            const nombre = ""
        const direccion = ""
        const numero = ""
        const departamento = ""
        const telefono = ""
        const entreCalles = ""
        const referencia = ""
            console.log("No existe direccion")
            showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
        }

        //guardarPedido()
        //const clienteFicha23=JSON.parse(localStorage.getItem("vendedorFicha"))
        //console.log("clienteFicha23", clienteFicha23.telefono)



      




           
            
        } else {
            // doc.data() will be undefined in this case
            console.log("No existe ficha del usuario en bbdd!");
            
            
  
        
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
        console.log("Error getting document:", error);
    });



}

function showPrivateInfo(nombre, telefono, direccion, numero, departamento, referencia, entreCalles) {
    console.log("existe direccion2", nombre, telefono, direccion, numero, departamento,  referencia, entreCalles)
    const loginForm = document.getElementById('task-form-envio');
    loginForm.style.display = 'block';
    console.log("ocultar vehiculo Pedido2")
    document.getElementById("vehiculoPedido").style.display="none";
    buscarRemiserias()
    
    const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo3');
    hiddenPrivateInfo.style.display = 'block';


    
    mostrarCampos(nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
    
  
    
  
  }


function mostrarCampos(nombre, telefono, direccion, numero, departamento, referencia, entreCalles){
    console.log("existe direccion3", nombre, telefono, direccion, numero, departamento, referencia, entreCalles)
    
    

    
    console.log("mostrarCampos")
    
    const hiddenPrivateInfo3 = document.getElementById('hiddenPrivateInfo3');
hiddenPrivateInfo3.style.display = 'block';

//busco el input   document.forms[form class][input name]
var Myelement = document.forms['loginForm'];
Myelement['nombre completo'].setAttribute('value',nombre);
Myelement['telefono'].setAttribute('value',telefono);
Myelement['direccion'].setAttribute('value',direccion);
Myelement['numero'].setAttribute('value',numero);
Myelement['departamento'].setAttribute('value',departamento);
Myelement['entreCalles'].setAttribute('value',entreCalles);
Myelement['referencia'].setAttribute('value',referencia);




}



  function ocultarCampos(){
      console.log("ocultar hidden")
    hiddenPrivateInfo3.style.display = 'none';   
  }

  const taskFormCupon = document.forms['formulario2'];
  taskFormCupon.addEventListener("submit", async (e) => {
    e.preventDefault();
    const propina = taskFormCupon["propina"].value;

    console.log("cupon,", propina)

    const ref=db.collection("remis").doc("pedidos").collection("remis").doc(idPedido)

    ref.update({
        clientePropina: Number(propina)
    })
    .then(() => {
        console.log("Propina actualizada.");
    })
    .catch((error) => {
        // The document probably doesn't exist.
        console.error("Error actualizando la propina ", error);
    });






  })

const clasif = document.getElementById("clasificacion32")

clasif.addEventListener('click', e => { 
    

    if( e.target.value !== undefined ){
        calificacion = e.target.value
    }else{
        calificacion = 0
    }
   

    
   const calificacionOtorgada= document.getElementById("calificacionOtorgada")
calificacionOtorgada.innerHTML= `Estrellas: ${calificacion}`;
});



const taskFormCalificar = document.forms['calificacionForm'];
taskFormCalificar.addEventListener("submit", async (e) => {
    e.preventDefault();

   
    if(calificacion>0){

      const ref= db.collection("remis").doc("viajes").collection("remis").doc(idPedido)
      ref.update({
        clienteCalificacion: Number(calificacion)
    })
    .then(() => {
        console.log("Document successfully updated!");
        location.reload();
    })
    .catch((error) => {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
    });

    }else{
        window.alert("toca las estrellas para seleccionar una cantidad")
    }

});




  const taskFormEnviar = document.forms['loginForm'];

  //btnEnviar cuando presiono el boton que dice "enviar"
  taskFormEnviar.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = taskFormEnviar["nombre"].value;
    const telefono = taskFormEnviar["telefono"].value;
    const direccion = taskFormEnviar["direccion"].value;
    const numero = taskFormEnviar["numero"].value;
    const departamento = taskFormEnviar["departamento"].value;
   const entreCalles = taskFormEnviar["entreCalles"].value;
   const referencia = taskFormEnviar["referencia"].value;
   const propina = taskFormEnviar["propina"].value;
   console.log("existe direccion4", nombre, telefono, direccion, numero, departamento, referencia, entreCalles, propina, email)

      
      console.log("formulario funciona")
      if(email===""){

        if(alerta()){

            console.log("dio aceptar.")
            console.log("==================================respuesta")
         //   const idPedido = await asdaasdasdasdasdasdassd

            guardarPedido(nombre, telefono, direccion, numero, departamento, referencia, entreCalles, propina, email)
            


        
    

   console.log("emailes:", email)
        }else{
            console.log("dio cancelar")
        }
 
       }else{

        guardarPedido(nombre, telefono, direccion, numero, departamento, referencia, entreCalles, propina, email)
    }
    
   
  });

 



  function guardarPedido(nombre, telefono, direccion, numero, departamento, referencia, entreCalles, propina, email)
  {
    console.log("guardar pedido")

  
      const fecha=firebase.firestore.FieldValue.serverTimestamp()
  
       const ref=db.collection("remis").doc("viajes").collection("remis").doc()
        idPedido= ref.id
       ref.set({
           "choferDni":"",
        "clienteNombre":nombre,
        "clienteDireccion": direccion+" "+numero+" "+departamento,
        "clienteCalificacion": 0,
        "clienteCalificacionTexto": "",
        "clienteCalle" : direccion,
        "clienteDepartamento": departamento,
        "clienteNumero": Number(numero),
        "clienteEntreCalles": entreCalles,
        "clienteReferencia": referencia,
        "clienteTelefono":Number(telefono),
        "clienteEmail": email,
        "clientePropina": Number(propina),
        agenciaEmail: "",
        agenciaId,
        agenciaNombre,
        agenciaDireccion: "",
        agenciaTelefono: "",
        fecha,
        estado: "Sin procesar",
        "pedido":"Sin procesar",
        "nota":"",
        "idPedido": idPedido,
        "autoPatente": "",
        "calificacion":"",
        "viaje": "pedido",
    
        
      })
   
          .then(() => {

            console.log("ocultar loginform")
            document.getElementById("formularioSolicitud").style.display="none";
            document.getElementById("vehiculoPedido").style.display="block";
            
            buscarRemis(idPedido)
            




       

      
        
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


    async function alerta()
          {
          var mensaje;
          var opcion = confirm("Primero debes iniciar sesión");
          if (opcion == true) {
              
              return true         


          } else {
              mensaje = "Has clickado Cancelar";

              return false
          }
          document.getElementById("ejemplo").innerHTML = mensaje;
      }

      function buscarRemisPedido(){
          db.collection("carrito").doc(email).collection("productos").doc("remis")
          .get()
       .then((doc) => {
        if(doc.exists) {
            // doc.data() is never undefined for query doc snapshots
       
            console.log("existe viaje")
            document.getElementById("vehiculoPedido").style.display="block";

            idPedido  = doc.data().idPedido
            buscarRemis(idPedido)
           

        }else{
            console.log("no existe viaje")
            console.log("mostrar formularioSolicitud")
            document.getElementById("formularioSolicitud").style.display="block";
           
           
            document.getElementById("vehiculoPedido").style.display="none";
            buscarRemiserias()
        }
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });
      }

      function buscarRemis(idPedido){

        console.log("idpedido", idPedido)

          db.collection("remis").doc("viajes").collection("remis").doc(idPedido)
          .onSnapshot((doc) => {
           if(doc.exists) {


            btnCancelar.style.display="none";
        
           // loginForm.style.display="none";
            document.getElementById("seccionPropina").style.display="none";
            document.getElementById("vehiculoPedido").style.display="block";
   
            



      
      
        const choferNombre= doc.data().choferNombre
        const autoPatente=doc.data().autoPatente

        const autoColor=doc.data().autoColor
        const calificacion= doc.data().calificacion
        
        const clienteDireccion= doc.data().clienteDireccion
        const clientePropina = doc.data().clientePropina
        const clienteCalificacion = doc.data().clienteCalificacion


        document.getElementById("ultimoViajeDireccion").innerHTML= clienteDireccion
        document.getElementById("ultimoViajePropina").innerHTML= clientePropina 
        document.getElementById("ultimoViajeCalificacion").innerHTML= clienteCalificacion 

           //actualizar propina placeholder
           var Myelement = document.forms['formulario2'];
           Myelement['propina123'].setAttribute('placeholder',clientePropina);



           console.log("calificacion remis", calificacion, "cleinte", clienteCalificacion)
           if(calificacion>0 && clienteCalificacion>0){
            document.getElementById("vehiculoPedido").style.display="none";
           }


        if(clienteCalificacion>0){
            console.log("clienteCalificacion", clienteCalificacion)

            //document.getElementById("btnCalificar").style.display="none";
            document.getElementById("calificacion").style.display="none";
            loginForm.style.display="block";

            console.log("mostrar formularioSolicitud1")
            document.getElementById("formularioSolicitud").style.display="block";

            document.getElementById("ultimoViajeVehiculo").innerHTML= `${autoColor}, ${autoPatente}, ${choferNombre}`
            





        }else{
           // loginForm.style.display="none"

        console.log("autoPatente", autoPatente)

        if(!autoPatente ==""){
 
            document.getElementById("ultimoViajeVehiculo").innerHTML= `${autoColor}, ${autoPatente}, ${choferNombre}`
            document.getElementById("calificacion").style.display="block";
            btnCancelar.style.display="none";
            document.getElementById("seccionPropina").style.display="none";
      

        }else{

            document.getElementById("seccionPropina").style.display="block";
            document.getElementById("calificacion").style.display="none";
            btnCancelar.style.display="block";
            console.log(" aaaaaaaaaaaaaaaaaaaaaaaaaa")
         

        }
    }

        


            
   
              
   
           }else{
            console.log("mostrar formularioSolicitud2")
            document.getElementById("formularioSolicitud").style.display="block";
            loginForm.style.display="block"
            document.getElementById("vehiculoPedido").style.display="none";

            console.log("no existe el viaje21")
     
           }
       });
  
      }








      function buscarRemiserias(){

        console.log("buscarRemiserias")
        var docRef= db.collection("remis").doc("agencias").collection("datos")
        docRef.get()
        .then((querySnapshot) => {
          bbddProductos=querySnapshot
            console.log(bbddProductos)
          pintarCards(bbddProductos)
           
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });



      }



      // Pintar productos
 function pintarCards(data2) {
    console.log("pintarCards", bbddProductos)
    console.log("item.data().title")

    

    data2.forEach(item => {


        

       //templateCard.querySelector('button').dataset.id = item.data().id
       
    
       templateCard.querySelector('.dropdown-item').textContent = item.data().nombre
       templateCard.querySelector('a').dataset.id = item.data().id
       
       //templateCard.querySelector('.categoria').textContent = item.data().categoria
      // templateCard.querySelector('.color').textContent = "color"
      


       templateCard.querySelector('li').setAttribute('id', item.data().id)



       


      



    

          //botones
         // templateCarrito.querySelector('.btn-success').dataset.id = item.data().id

         
        
          //templateCarrito.querySelector('.btn-danger').dataset.id = item.data().id




        
        const clone = templateCard.cloneNode(true)
        fragment.appendChild(clone)          //url:1 GET http://127.0.0.1:5503/url 404 (Not Found)
    
    })
     
    cards.appendChild(fragment)
    cards.addEventListener('click', e => { addCarrito(e)});
  

}

const addCarrito = e => {

    agenciaNombre = e.target.textContent
    agenciaId = e.target.dataset.id
    console.log("++++++++++++++++++++++++++e.target.dataset.id",e.target.dataset.id)
    btnRemiseria.innerHTML= e.target.textContent;
  
   
}

function calificar(){

}

