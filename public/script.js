import { categoriasPorClima } from './scriptSpotify.js';
import { fondosPorClima } from './scriptFondos.js';

const BASE_URL = "https://moodbeatsplayer.vercel.app";

const contenedorMensaje = document.querySelector('#mensaje');

const contenedorClima = document.querySelector('#clima');
const inputBuscar = document.querySelector("#inpBuscar");
const btnBuscar = document.querySelector('#btnBuscar');
const btnOtraPlaylist = document.querySelector("#btnOtraPlaylist");
const iframe = document.querySelector("#spotify-player");

let ultimasPlaylists = [];
let ultimaPlaylistId = null;

/* mostradores de mensajes */

export function mostrarMensaje(mensaje, tipo) {
  contenedorMensaje.innerText = mensaje;
  if (tipo === 'error') {
    contenedorMensaje.className = 'mensaje-error';
  } else {
    contenedorMensaje.className = 'mensaje-exito';
  }

  contenedorMensaje.style.display = 'block';
  setTimeout(() => {
    contenedorMensaje.style.display = 'none';
  }, 3000);
}

/* Geolocalización */

async function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const data = {
            lat: posicion.coords.latitude,
            lon: posicion.coords.longitude
          };
          console.log("Ubicación detectada:", data);
          resolve(data);
        },
        (error) => {
          alert("Hubo un error al obtener la ubicación");
          if (error.code === 1) {
            alert("Debes permitir el acceso a tu ubicación para ver el clima actual.");
          }
          reject(error);
        }
      );
    } catch (e) {
      alert("Hubo un error inesperado al intentar obtener la ubicación");
    }
  });
}

/* Clima */

/* OBTENER */
async function obtenerClima(lat, lon) {
const respuesta = await fetch(`/api/clima?lat=${lat}&lon=${lon}`);
const data = await respuesta.json();
  return await respuesta.json();
}


/* MOSTRAR */
export async function mostrarClima(clima) {
  try {
    if (!clima || !clima.sys || !clima.main || !clima.weather) {
      throw new Error('Clima inválido');
    }

    const miClima = {
      nombreCiudad: clima.name,
      pais: clima.sys.country,
      temp: clima.main.temp.toFixed(0),
      clima: clima.weather[0].main,
      iconoClima: clima.weather[0].icon
    };

    contenedorClima.innerHTML = `
      <h1 id="h1Ciudad">${miClima.nombreCiudad}, ${miClima.pais}</h1>
      <div id="imgTemp">
        <img src="http://openweathermap.org/img/wn/${miClima.iconoClima}@2x.png">
        <p>${miClima.temp}°C</p>
      </div>
      <h2>${miClima.clima}</h2>
    `;

    const categorias = categoriasPorClima[miClima.clima] || ['pop'];
    mostrarPlaylistSegunClima(categorias[0]);
    cambiarFondo(miClima.clima);

  } catch (error) {
    console.error('Clima inválido:', error);
    mostrarMensaje('No se pudo obtener el clima de esa ciudad', 'error');
  }
}


/* BUSCAR */

async function buscarClima() {
  try {
    const ciudad = inputBuscar.value.trim();
    if (!ciudad) {
      alert('Ingresa una ciudad');
      return;
    }

const respuesta = await fetch(`${BASE_URL}/api/clima?ciudad=${encodeURIComponent(ciudad)}`);
    const data = await respuesta.json();

    mostrarClima(data);
    inputBuscar.value = '';
  } catch (error) {
    console.log('Hubo un error al buscar el clima', error)
    mostrarMensaje('Hubo un error al buscar el clima.', 'error')
  }
}


inputBuscar.addEventListener('keydown', (event) => {
  if (event.key === 'Enter')
    buscarClima();
})
btnBuscar.addEventListener('click', buscarClima);


/* SE CAMBIA EL FONDO EN EL CSS */

function cambiarFondo(clima) {
  const fondo = fondosPorClima[clima] || fondosPorClima['Clear'];

  document.body.style.backgroundImage = `url('${fondo}')`;
}


/* SPOTIFY */

/* OBTENER TOKEN */

async function obtenerTokenSpotify() {
  try {
const respuesta = await fetch(`/api/spotify-token`);
    const data = await respuesta.json();
    return data.access_token;
  } catch (error) {
    alert('Error al obtener token de Spotify');
  }
}



/* BUSCA PLAYLISTS POR NOMBRE */

async function buscarPlaylistsPorNombre(nombre) {
  try {
    const token = await obtenerTokenSpotify();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(nombre)}&type=playlist&limit=20`;

    const respuesta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await respuesta.json();

    return data.playlists.items;

  } catch (error) {
    console.log('Hubo un error al buscar las playlists', error)
    alert('Hubo un error al buscar las playlists')
  }

}

async function mostrarPlaylistSegunClima(categoria) {
  try {
    const playlists = await buscarPlaylistsPorNombre(categoria)

    if (!playlists || playlists.length === 0) {
      alert("No se encontraron playlists para la categoría");
    }

    /* para filtrar las opciones que dan null en la búsqueda (usualmente tracks o albumes)*/
    const playlistsValidas = playlists.filter(playlist => playlist && playlist.id);

    if (playlistsValidas.length === 0) {
      alert("No hay playlists válidas para mostrar.");
    }

    const seleccionarPlaylist = Math.floor(Math.random() * playlistsValidas.length);
    const playlistSeleccionada = playlistsValidas[seleccionarPlaylist];

    iframe.src = `https://open.spotify.com/embed/playlist/${playlistSeleccionada.id}`;

    ultimasPlaylists = playlistsValidas;
  } catch (error) {
    console.log('Hubo un error al mostrar la playlist', error);
    mostrarMensaje('Hubo un error al mostrar la playlist.', 'error');
  }
}

/* Mostrar siguiente Playlist Random de la misma categoría */

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

async function main() {
  try {
    const ubicacion = await obtenerUbicacion();
    const clima = await obtenerClima(ubicacion.lat, ubicacion.lon);
    mostrarClima(clima);
  } catch (error) {
    console.log('Hubo un error al inicializar el código', error)
    alert('Hubo un error al inicializar el código');
  }
}


main();


