// Your web app's Firebase configuration
import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


//loginForm.style.display = 'none';




/* 


document.getElementById("nombrecompleto").style.display = "block";
document.getElementById("dni").style.display = "block";
document.getElementById("direccion").style.display = "block"; */


// Connect application with firebase
const form = document.forms['loginForm'];
firebase.auth().onAuthStateChanged(handleAuthState);
form.addEventListener('submit', handleFormSubmit);


// Application defs
function handleAuthState(user) {
  if (user) {
    showPrivateInfo()
    return console.log('Habemus user 🎉');
  }

  showLoginForm()
  return console.log('No habemus user 😭');
}

function handleFormSubmit(event) {
  event.preventDefault();

  const email = form['email'].value;
  const password = form['password'].value;
  const nombrecompleto = form['nombrecompleto'].value;
  const direccion = form['direccion'].value;
  const telefono = form['telefono'].value;
  const dni = form['dni'].value;
  const isLoginOrSignup = form['isLoginOrSignup'].value;

  if (isLoginOrSignup === 'isLogin') {
    return loginUser({ email, password });
  }

  return createUser({ email, password, nombrecompleto, direccion, telefono, dni });
}


// Application Utils
function showPrivateInfo(user) {
  const loginForm = document.getElementById('loginFormUI');
  loginForm.style.display = 'none';

  const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo');
  hiddenPrivateInfo.style.display = 'block';
  hiddenPrivateInfo.innerHTML = `
    <p> <b></b> Estas logeado</p>
    <button id="btnLogout" class="button">Cerrar sesión</button>
  `;

  const btnLogout = document.getElementById('btnLogout');
  btnLogout.addEventListener('click', signoutUser);
}

function showLoginForm() {
  const loginForm = document.getElementById('loginFormUI');
  loginForm.style.display = 'block';

  const hiddenPrivateInfo = document.getElementById('hiddenPrivateInfo');
  hiddenPrivateInfo.style.display = 'none';
  hiddenPrivateInfo.innerHTML = `
    <p>Nada que mostrar, tenes que logearte, bro...</p>
  `;

  elemento = document.getElementById("radioIsLogin");
  if( !elemento.checked ) {
    mostrarCampos()
  }else{
    ocultarCampos()
  }

  document.getElementById("radioIsLogin").addEventListener('click', e => { console.log("login selected") , ocultarCampos() });
  document.getElementById("radioIsSignup").addEventListener('click', e => { console.log("Registrar selected"), mostrarCampos() });

  function mostrarCampos(){
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
    hiddenPrivateInfo2.style.display= "none"
  }

}


// Firebase defs
function createUser({ email, password, nombrecompleto, direccion, telefono, dni }) {
  console.log('Creating user ' + email);

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function (user) {

      // guardamos el usuario en firestore
      db.collection("usuarios").doc(email).set({
        email,
        password,
        nombrecompleto,
        direccion,
        telefono,
        dni

        
     })




    })
    .catch(function (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Ya existe el usuario');
        const soLogin = confirm(
          `Ya estás registrado con este email.
          ¿Quieres iniciar sesión ✨?`
        );
        return !!soLogin ? loginUser({ email, password }) : alertTryAgain(error);;
      }

      return alertTryAgain(error);
    });
}

function loginUser({ email, password }) {
  console.log('Loging user ' + email);

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function (user) {
      console.log('Credenciales correctas, brother, bienvenido.');
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