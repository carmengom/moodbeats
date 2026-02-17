import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

/* MIDDLEWARES */
app.use(cors({
  origin: '*'
}));
app.use(express.json());

/* RUTAS */
app.get('/', (req, res) => {
  res.send('Server OK');
});

app.get('/clima', async (req, res) => {
  try {
    const { ciudad, lat, lon } = req.query;

    if (!process.env.API_KEY) {
      throw new Error('API_KEY no definida');
    }

    let url = '';

    if (ciudad) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        ciudad
      )}&units=metric&lang=es&appid=${process.env.API_KEY}`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${process.env.API_KEY}`;
    } else {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    if (!respuesta.ok || !data.sys) {
      console.error('Respuesta inválida de OpenWeather:', data);
      return res.status(400).json({ error: 'Clima inválido' });
    }

    res.json(data);

  } catch (error) {
    console.error('ERROR /clima:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



app.get('/spotify-token', async (req, res) => {
  try {
    const auth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    res.json({ access_token: data.access_token });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener token de Spotify' });
  }
});

/* SERVER */
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
