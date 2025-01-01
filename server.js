const express = require('express');
const cors = require('cors'); // Importa el middleware CORS

require('dotenv').config(); // Carga las variables de entorno desde .env

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());

app.use(cors({
  origin: process.env.DOMAIN,
  AccessControlAllowOrigin: process.env.DOMAIN,
}))

var getSubtitles = require('youtube-captions-scraper').getSubtitles;


app.get('/api/transcript', async (req, res) => {

  console.log(req.query)

  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere el parámetro videoId' });
  }

  try {
    const subtitles = await getSubtitles({
      videoID: videoId,
      //lang: language,
      lang: "en",
    });
    console.log("Subtítulos obtenidos:", subtitles);
    res.json(subtitles)

  } catch (error) {
    console.error('Error al obtener subtitulos.', error);
    res.status(500).json({ error: 'Error al obtener subtitulos.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});