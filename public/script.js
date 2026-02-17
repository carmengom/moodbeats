import { categoriasPorClima } from './scriptSpotify.js';
import { fondosPorClima } from './scriptFondos.js';

const contenedorMensaje = document.querySelector('#mensaje');
const contenedorClima = document.querySelector('#clima');
const inputBuscar = document.querySelector("#inpBuscar");
const btnBuscar = document.querySelector('#btnBuscar');
const btnOtraPlaylist = document.querySelector("#btnOtraPlaylist");
const iframe = document.querySelector("#spotify-player");

let ultimasPlaylists = [];
let ultimaPlaylistId = null;

/* =========================
   MOSTRAR MENSAJES
========================= */
export function mostrarMensaje(mensaje, tipo) {
  contenedorMensaje.innerText = mensaje;
  contenedorMensaje.className = tipo === 'error' ? 'mensaje-error' : 'mensaje-exito';
  contenedorMensaje.style.display = 'block';
  setTimeout(() => contenedorMensaje.style.display = 'none', 3000);
}

/* =========================
   TOKEN SPOTIFY
========================= */
async function obtenerTokenSpotify() {
  try {
    const respuesta = await fetch(`/api/spotify-token`);
    const data = await respuesta.json();
    return data.access_token;
  } catch (error) {
    alert('Error al obtener token de Spotify');
  }
}

/* =========================
   PLAYLISTS
========================= */
async function buscarPlaylistsPorNombre(nombre) {
  try {
    const token = await obtenerTokenSpotify();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(nombre)}&type=playlist&limit=20`;
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await respuesta.json();
    return data.playlists.items;
  } catch (error) {
    console.log('Error al buscar playlists', error);
    alert('Error al buscar playlists');
  }
}

async function mostrarPlaylistSegunClima(categoria) {
  try {
    const playlists = await buscarPlaylistsPorNombre(categoria);
    if (!playlists || playlists.length === 0) {
      alert("No se encontraron playlists para la categoría");
      return;
    }

    const playlistsValidas = playlists.filter(p => p && p.id);
    if (playlistsValidas.length === 0) return;

    let indice = Math.floor(Math.random() * playlistsValidas.length);
    let playlist = playlistsValidas[indice];

    if (playlist.id === ultimaPlaylistId && playlistsValidas.length > 1) {
      indice = (indice + 1) % playlistsValidas.length;
      playlist = playlistsValidas[indice];
    }

    ultimaPlaylistId = playlist.id;
    iframe.src = `https://open.spotify.com/embed/playlist/${playlist.id}`;
    ultimasPlaylists = playlistsValidas;

  } catch (error) {
    console.log('Error mostrando playlist', error);
    mostrarMensaje('Error al mostrar playlist', 'error');
  }
}

function mostrarPlaylistRandom() {
  if (!ultimasPlaylists?.length) return;
  let indice = Math.floor(Math.random() * ultimasPlaylists.length);
  let playlist = ultimasPlaylists[indice];

  if (playlist.id === ultimaPlaylistId && ultimasPlaylists.length > 1) {
    indice = (indice + 1) % ultimasPlaylists.length;
    playlist = ultimasPlaylists[indice];
  }

  ultimaPlaylistId = playlist.id;
  iframe.src = `https://open.spotify.com/embed/playlist/${playlist.id}`;
}

btnOtraPlaylist.addEventListener('click', mostrarPlaylistRandom);

/* =========================
   GEOLOCALIZACIÓN
========================= */
async function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        alert("Debes permitir acceso a tu ubicación.");
        reject(err);
      }
    );
  });
}

/* =========================
   CLIMA
========================= */
async function obtenerClima(lat, lon) {
  try {
    const respuesta = await fetch(`/api/clima?lat=${lat}&lon=${lon}`);
    return await respuesta.json();
  } catch (error) {
    mostrarMensaje("Error obteniendo clima", 'error');
  }
}

export async function mostrarClima(clima) {
  try {
    if (!clima || !clima.sys || !clima.main || !clima.weather) throw new Error('Clima inválido');

    const miClima = {
      nombreCiudad: clima.name,
      pais: clima.sys.country,
      temp: clima.main.temp.toFixed(0),
      clima: clima.weather[0].main,
      iconoClima: clima.weather[0].icon
    };

    // Usamos HTTPS para las imágenes del clima
    contenedorClima.innerHTML = `
      <h1 id="h1Ciudad">${miClima.nombreCiudad}, ${miClima.pais}</h1>
      <div id="imgTemp">
        <img src="https://openweathermap.org/img/wn/${miClima.iconoClima}@2x.png">
        <p>${miClima.temp}°C</p>
      </div>
      <h2>${miClima.clima}</h2>
    `;

    const categorias = categoriasPorClima[miClima.clima] || ['pop'];
    mostrarPlaylistSegunClima(categorias[0]);
    cambiarFondo(miClima.clima);

  } catch (error) {
    console.log('Clima inválido:', error);
    mostrarMensaje('No se pudo obtener el clima', 'error');
  }
}

/* =========================
   BUSCAR CIUDAD
========================= */
async function buscarClima() {
  try {
    const ciudad = inputBuscar.value.trim();
    if (!ciudad) return alert('Ingresa una ciudad');
    const respuesta = await fetch(`/api/clima?ciudad=${encodeURIComponent(ciudad)}`);
    const data = await respuesta.json();
    mostrarClima(data);
    inputBuscar.value = '';
  } catch (error) {
    console.log('Error buscando ciudad', error);
    mostrarMensaje('Error buscando ciudad', 'error');
  }
}

inputBuscar.addEventListener('keydown', e => { if (e.key === 'Enter') buscarClima(); });
btnBuscar.addEventListener('click', buscarClima);

/* =========================
   FONDO
========================= */
function cambiarFondo(clima) {
  const fondo = fondosPorClima[clima] || fondosPorClima['Clear'];
  document.body.style.backgroundImage = `url('${fondo}')`;
}

/* =========================
   INICIO
========================= */
async function main() {
  try {
    const ubicacion = await obtenerUbicacion();
    const clima = await obtenerClima(ubicacion.lat, ubicacion.lon);
    mostrarClima(clima);
  } catch (error) {
    console.log('Error al iniciar app', error);
    mostrarMensaje('Error al inicializar la app', 'error');
  }
}

main();
