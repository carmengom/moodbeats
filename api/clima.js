import fetch from 'node-fetch';

export default async function handler(req, res) {
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

    res.status(200).json(data);

  } catch (error) {
    console.error('ERROR /api/clima:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
