// @ts-nocheck

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const { getSubtitles } = require("./utils/subtitles")
const { translateText } = require('./utils/translate');
const { oxford } = require('./utils/oxford');



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: process.env.DOMAIN,
  AccessControlAllowOrigin: process.env.DOMAIN,
}))




async function subtitlesAndText (videoId) {
  try {
    // Priority order: 'standard', fallback to 'asr'
    const trackKinds = ['standard', 'asr'];
    let subtitles = '';
    let = totalText = "";
    let durationOfVideo = 0

    for (const trackKind of trackKinds) {
      try {
        // Attempt to get subtitles
        const subtitlesAndTotalText = await getSubtitles({
          videoId,
          /* TODO: Agregarle el language dinamico, que desde el front se eliga el idioma original del video  */
          language: 'en',
          trackKind
        });

        const { subtitlesWithTimestamp, totalTextOfVideo, videoDuration } = subtitlesAndTotalText
        subtitles = subtitlesWithTimestamp
        totalText = totalTextOfVideo
        durationOfVideo = videoDuration

        if (subtitles) {
          console.log(totalText)
          console.log(`Subtitles retrieved with trackKind: ${trackKind}`);
          break; // Exit loop if subtitles are found
        }
      } catch (error) {
        console.warn(`No subtitles found with trackKind: ${trackKind}`);
      }
    }

    if (!subtitles) {
      throw new Error('No subtitles available for the specified video.');
    }


    return { subtitles, totalText, durationOfVideo };
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}




// API route to fetch subtitles
app.get('/api/transcript', async (req, res) => {
  const { videoId } = req.query;
  console.log("videoId: ", videoId)

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const data = await subtitlesAndText(videoId);
    const { subtitles, totalText, durationOfVideo } = data
    // const textTranslated = await translateText(totalText, "es")
    const textTranslated = "Descomentar linea 85 si quieres traducir todo el texto con google translate"
    res.json({ subtitles, totalText, textTranslated, durationOfVideo });

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});


// const subtitles = async () => {
//   const sub = await   subtitlesAndText("K7hU_z9X4Kk")
//   console.log(sub)
//   return sub
// };

// subtitles()



// Endpoint Oxford
app.get('/api/oxford', async (req, res) => {
  const word = req.query.word;
  console.log(word)
  if (!word) return res.status(400).json({ error: 'Se requiere una palabra para la consulta.' });

  try {
    const resonseOxford = await oxford(word)
    res.json(resonseOxford.data);
  } catch (error) {
    console.error('Error al consultar la API de Oxford:', error.message);
    res.status(500).json({ error: 'Error al consultar la API de Oxford' });
  }
});

// Endpoint Google Translate
app.get('/api/google', async (req, res) => {
  const word = req.query.word;
  const language = req.query.language;

  if (!word) return res.status(400).json({ error: 'Se requiere una palabra para la consulta.' });

  try {
    const wordTranslated = await translateText(word, language)
    res.json(wordTranslated);
  }
  catch (error) {
    console.error('Error al consultar la API de Google Translate:', error.message);
    res.status(500).json({ error: 'Error al consultar la API de Google Translate' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});