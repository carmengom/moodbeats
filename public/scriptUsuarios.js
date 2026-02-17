import { mostrarClima } from './script.js';
import { mostrarMensaje } from './script.js';

const BASE_URL = "https://moodbeatsplayer.vercel.app"; 


let data = null;

/* =========================
   ELEMENTOS
========================= */
const inpUsuario = document.querySelector("#inpUsuario");
const inpEmail = document.querySelector("#inpEmail");
const btnIngresar = document.querySelector("#btnIngresar");
const btnRegistrar = document.querySelector("#btnRegistrar");
const sectionLogin = document.querySelector("#login");
const nombreUsuario = document.querySelector('#nombreUsuario');

const usuario = document.querySelector('#usuario');
const opcionesUsuario = document.querySelector('#opcionesUsuario');
const btnEditar = document.querySelector('#editarPerfil');
const btnBorrar = document.querySelector('#borrarUsuario');
const formEditar = document.querySelector('#formEditar');
const formBorrar = document.querySelector('#formBorrar');
const btnRegresar = document.querySelector('#btnRegresar');
const inpNuevoNombre = document.querySelector('#inpNuevoNombre');
const btnCambiar = document.querySelector('#btnCambiar');
const btnSiBorrar = document.querySelector('#btnSiBorrar');
const btnNoBorrar = document.querySelector('#btnNoBorrar');

const atajosContainer = document.querySelector('#atajosContainer');
const btnAgregarAtajo = document.querySelector('#btnAgregarAtajo');

/* =========================
   EVENTOS INICIALES
========================= */
btnRegistrar.addEventListener('click', crearUsuario);
btnIngresar.addEventListener('click', ingresarUsuario);

usuario.addEventListener('mouseover', () => opcionesUsuario.style.display = "block");
usuario.addEventListener('mouseout', () => opcionesUsuario.style.display = "none");

btnEditar.addEventListener('click', () => formEditar.style.display = "block");
btnRegresar.addEventListener('click', () => {
  formEditar.style.display = "none";
  inpNuevoNombre.value = '';
});

btnCambiar.addEventListener('click', cambiarNombre);

btnBorrar.addEventListener('click', () => formBorrar.style.display = "block");
btnNoBorrar.addEventListener('click', () => formBorrar.style.display = "none");
btnSiBorrar.addEventListener('click', borrarUsuario);

btnAgregarAtajo.addEventListener('click', agregarAtajo);

/* =========================
   LOCAL STORAGE HELPERS
========================= */
function guardarUsuarioLS(usuario) {
  localStorage.setItem(`usuario_${usuario.username}`, JSON.stringify(usuario));
  localStorage.setItem('usuario_actual', usuario.username);
}

function obtenerUsuarioLS(username) {
  const user = localStorage.getItem(`usuario_${username}`);
  return user ? JSON.parse(user) : null;
}

function eliminarUsuarioLS(username) {
  localStorage.removeItem(`usuario_${username}`);
  localStorage.removeItem('usuario_actual');
}

/* =========================
   REGISTRAR USUARIO
========================= */
function crearUsuario() {
  const username = inpUsuario.value.trim();
  const email = inpEmail.value.trim();

  if (!username || !email) {
    mostrarMensaje('Completá usuario y email', 'error');
    return;
  }

  if (obtenerUsuarioLS(username)) {
    mostrarMensaje('Ese usuario ya existe', 'error');
    return;
  }

  const nuevoUsuario = {
    username,
    email,
    data: { atajos: [] }
  };

  guardarUsuarioLS(nuevoUsuario);

  mostrarMensaje('Usuario creado correctamente', 'exito');
  inpUsuario.value = '';
  inpEmail.value = '';
}

/* =========================
   INGRESAR USUARIO
========================= */
function ingresarUsuario() {
  const username = inpUsuario.value.trim();
  const email = inpEmail.value.trim();

  const usuario = obtenerUsuarioLS(username);

  if (!usuario || usuario.email !== email) {
    mostrarMensaje('Usuario o email incorrectos', 'error');
    return;
  }

  data = usuario;
  localStorage.setItem('usuario_actual', username);

  sectionLogin.style.display = "none";
  nombreUsuario.innerText = username;
  nombreUsuario.style.display = "inline-block";

  mostrarAtajos();
}

/* =========================
   EDITAR NOMBRE
========================= */
function cambiarNombre() {
  const nuevoNombre = inpNuevoNombre.value.trim();
  if (!nuevoNombre) return;

  eliminarUsuarioLS(data.username);
  data.username = nuevoNombre;
  guardarUsuarioLS(data);

  nombreUsuario.innerText = nuevoNombre;
  formEditar.style.display = "none";
  inpNuevoNombre.value = '';

  mostrarMensaje('Nombre actualizado', 'exito');
}

/* =========================
   BORRAR USUARIO
========================= */
function borrarUsuario() {
  eliminarUsuarioLS(data.username);
  data = null;

  nombreUsuario.style.display = "none";
  sectionLogin.style.display = "block";
  formBorrar.style.display = "none";

  mostrarMensaje('Usuario eliminado', 'exito');
}

/* =========================
   ATAJOS
========================= */
function agregarAtajo() {
  const h1Ciudad = document.querySelector('#h1Ciudad');
  if (!h1Ciudad) {
    mostrarMensaje('Buscá una ciudad primero', 'error');
    return;
  }

  const ciudad = h1Ciudad.innerText;

  if (!data.data.atajos.includes(ciudad)) {
    data.data.atajos.push(ciudad);
    guardarUsuarioLS(data);
    mostrarAtajos();
  }
}

function mostrarAtajos() {
  atajosContainer.innerHTML = '';

  if (!data) return;

  data.data.atajos.forEach(ciudad => {
    const atajo = document.createElement('div');
    atajo.classList.add('atajoPill');

    atajo.innerHTML = `
      <p class="pAtajo">${ciudad}</p>
      <button class="btnEliminar">✕</button>
    `;

    atajo.querySelector('.pAtajo').onclick = async () => {
      const clima = await buscarClimaAtajo(ciudad);
      if (clima) mostrarClima(clima);
    };

    atajo.querySelector('.btnEliminar').onclick = () => {
      data.data.atajos = data.data.atajos.filter(c => c !== ciudad);
      guardarUsuarioLS(data);
      mostrarAtajos();
    };

    atajosContainer.appendChild(atajo);
  });
}

/* =========================
   CLIMA ATAJO
========================= */
async function buscarClimaAtajo(ciudad) {
  try {
    const respuesta = await fetch(`${BASE_URL}/clima?ciudad=${encodeURIComponent(ciudad)}`);
    const data = await respuesta.json();
    return data;
  } catch (error) {
    mostrarMensaje("No se encontró la ciudad.", 'error');
    return null;
  }
}


/* =========================
   AUTO LOGIN (si hay usuario en LS)
========================= */
document.addEventListener('DOMContentLoaded', () => {
  const usuarioActual = localStorage.getItem('usuario_actual');
  if (usuarioActual) {
    const usuarioLS = obtenerUsuarioLS(usuarioActual);
    if (usuarioLS) {
      data = usuarioLS;
      nombreUsuario.innerText = data.username;
      nombreUsuario.style.display = "inline-block";
      sectionLogin.style.display = "none";
      mostrarAtajos();
    }
  }
});

/* =========================
   LOGOUT
========================= */
const btnLogout = document.querySelector('#logout'); 

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('usuario_actual'); 
  
  nombreUsuario.style.display = "none";
  sectionLogin.style.display = "block";

  mostrarMensaje('Cerraste sesión', 'exito');
});

