import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'Credenciales de Spotify no definidas' });
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const texto = await response.text();
      console.error('Error Spotify:', texto);
      return res.status(response.status).json({ error: 'Error al obtener token Spotify' });
    }

    const data = await response.json();
    res.status(200).json({ access_token: data.access_token });

  } catch (error) {
    console.error('ERROR /spotify-token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
