import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());


//const db = firebase.firestore();
const cards = document.getElementById('cards')
var idCliente= ""



function callFromActivity(msg){
    console.log("btn participar");
  //  AndroidFunction.showToast("desde js", "idcliente: ", msg);
    if(msg.length==0 || msg==null){
        
        AndroidFunction.showToast(idCliente)
        document.getElementById("mytext").innerHTML = "idCliente nulo. debes iniciar sesion";
        openAndroidDialog('No estas logeado', 'Para participar debes iniciar sesión. Dirigete a la sección "usuario-> iniciar sesión"')
    }else{
        idCliente=msg
        document.getElementById("mytext").innerHTML = msg+"funciona";
        AndroidFunction.showToast(idCliente)
 
    
    }
      }

function participar(){
    console.log("idCliente: ", idCliente)
    if(idCliente.length>0){
        openAndroidDialog('Felicitaciones!!!', "Ya estas participando por el sorteo. Te enviaremos una notificación si sales beneficiado.")

    }else{
        openAndroidDialog('No estas logeado', 'Para participar debes iniciar sesión. Dirigete a la sección "usuario-> iniciar sesión"')
    }
}


      function openAndroidDialog(title, msg) {
        console.log("openAndroidDialog");
        AndroidFunction.openAndroidDialog(title, msg);
    }
    function showAndroidToast(toast) {
        console.log("showAndroidToast");
        AndroidFunction.showToast(toast);
    }



