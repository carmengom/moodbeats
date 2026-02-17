import fetch from 'node-fetch';

export default async function handler(req, res) {
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
    res.status(200).json({ access_token: data.access_token });

  } catch (error) {
    console.error('ERROR /api/spotify-token:', error);
    res.status(500).json({ error: 'Error al obtener token de Spotify' });
  }
}
