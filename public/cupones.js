import { iniciarFirebase } from "./funciones.js";
firebase.initializeApp(iniciarFirebase());


// El evento DOMContentLoaded es disparado cuando el documento HTML ha sido completamente cargado y parseado
document.addEventListener('DOMContentLoaded', e => {

  });




console.log("login")

const taskForm = document.getElementById("task-form");

taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const buscador = taskForm["buscador"].value;

    console.log("buscar", buscador)
    return filtrar(buscador.toLowerCase())

 
});