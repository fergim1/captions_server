// @ts-nocheck

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const { getSubtitles } = require("./utils/subtitles")
const { translateText } = require('./utils/translate');
const { oxford } = require('./utils/oxford');
const loadAgent = require('./utils/agentLoader');

const cache = new Map(); // Crear un objeto de caché en memoria

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
          // console.log(totalText)
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



//////////////////////////////////////////////
// API route to fetch subtitles
// app.get('/api/transcript', async (req, res) => {
//   const { videoId } = req.query;
//   const { englishLevel } = req.query;
//   console.log("videoId: ", videoId)
//   console.log("englishLevel: ", englishLevel)

//   if (!videoId) {
//     return res.status(400).json({ error: 'Video ID is required' });
//   }

//   try {
//     const data = await subtitlesAndText(videoId);
//     const { subtitles, totalText, durationOfVideo } = data
//     // const textTranslated = await translateText(totalText, "es")
//     const textTranslated = "Descomentar linea 85 si quieres traducir todo el texto con google translate"

//     // 1. Cargar agente del nivel requerido
//     const agent = loadAgent(englishLevel);

//     // 2. Reemplazar variables en el template
//     const prompt_template = `
//   Eres un profesor de inglés especializado en nivel {{englishLevel}}.
//   A partir del contenido de estos subtitulos: {{totalText}}, debes generar:
//   1) Resumen del contenido, minimo 3000 caracteres (summary)
//   2) 10 puntos principales (main_points)
//   3) 20 preguntas múltiple choice (4 opciones, 1 correcta y las otras opciones incorrectas tienen que ser creibles)
//   4) 20 preguntas verdadero/falso (true_false).
//   Tanto el resumen, los 10 puntos principales, preguntas multiple choice y las verdadero/falso deben tener
//   el vocabulario adecuado para que el alumno pueda entenderlas segun su nivel de ingles ({{englishLevel}}).
//   Ademas, para las preguntas se debe indicar el texto donde hace referencia a la respuesta correcta.

//   **Reglas estrictas para generar el resumen, los puntos principales y las preguntas segun el nivel del alumno:**
//   - Descripcion del alumno: {{description}}
//   - Objectivos: {{objectives}}
//   - Gramática permitida: {{grammar}}
//   - Vocabulario: {{vocabulary}}
//   - Functions: {{functions}}

//   **Formato requerido de la respuesta (JSON):**
//   {
//     "status": "ok",
//     "summary": "resumen del texto analizado",
//     "main_points": ["primero punto", "segundo punto", "tercer punto", "cuarto punto", "quinto punto", "sexto punto", "septimo punto", "octavo punto", "noveno punto", "decimo punto"],
//     "exercises":
//     {
//       "multiple_choice": [
//         {
//           "question": "What is the ultimate goal for Neo's learning process?",
//           "options": [
//               "To become a chef",
//               "To replace all human jobs",
//               "To achieve true intelligence",
//               "To win a robot competition"
//           ],
//           "correct_answer": 2,
//           "text_reference": "for robots to become truly intelligent, they must learn from diverse data in real-world settings"
//       }
//       ],
//       "true_false": [
//         {
//           "statement": "Neo can cook perfectly without human help.",
//           "correct_answer": false,
//           "text_reference": "it might be a few more years before robots can handle full cooking duties..."
//         }
//       ]
//     }
//   }
//   **Reglas estrictas para la respuesta en formato JSON **
//   - summary contendra un mínimo de 3000 caracteres y debe contener todas las partes importantes del texto a analizar.
//   - en summary cada parrafo tiene que terminarcon un salto de linea.
//   - main_points contentra los 10 puntos mas importantes del video.
//   - multiple_choice debe contener 20 elementos (1 para cada pregunta).
//   - options debe contener la opcion correcta y las otras opciones deben ser creibles, no debe ser facil de adivinar cual es la respuesta correcta, por lo tanto las opciones incorrectas deben estar relacionadas con el contenido, con el texto, no tienen que ser facil de descartar.
//   - options debe contener elementos que serán string aproximadamente del mismo tamaño.
//   - correct_answer no debe ser siempre el mismo, por lo tanto la respuesta correcta que se encuentra dentro de options, no debe estar siempre en el mismo indice.
//   - true_false debe contener 20 elementos.
//   - Todo debe estar en un vocabulario que sea capas de entender el alumno, acorde a su nivel {{englishLevel}} de ingles
//  `
//     const prompt = prompt_template
//       .replace('{{englishLevel}}', englishLevel)
//       .replace('{{totalText}}', totalText)
//       .replace('{{description}}', agent.description)
//       .replace('{{objectives}}', agent.objectives)
//       .replace('{{grammar}}', agent.grammar.join(', '))
//       .replace('{{vocabulary}}', agent.vocabulary.join(', '))
//       .replace('{{functions}}', agent.functions.join(', '));


//     // 3. Llamar a DeepSeek
//     const responseDeepseek = await axios.post(
//       process.env.DEEPSEEK_URL_API,
//       {
//         model: "deepseek-chat",
//         messages: [{ role: "user", content: prompt }],
//         response_format: { type: "json_object" }
//       },
//       {
//         headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
//         timeout: 300000  // ⬅️ 5 minutos (en milisegundos)
//       }

//     );

//     console.log("Deepseek")
//     // 4. Validar y devolver respuesta
//     const deepseekResponse = JSON.parse(responseDeepseek.data.choices[0].message.content);
//     const totalTokens = JSON.parse(responseDeepseek.data.usage.total_tokens);
//     console.log({ totalTokens })
//     console.log({ deepseekResponse })
//     //////////////// Fin de Deepseek



//     res.json({ subtitles, totalText, textTranslated, durationOfVideo, deepseekResponse });

//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ error: error.message });
//   }
// });
//////////////////////////////////////////////

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

// Aumentar timeout a 5 minutos (300,000 ms)
app.timeout = 300000; 

////////////// Nuevo codigo de aca para abajo
// API route to fetch subtitles New to test send only subtitle
app.get('/api/transcript', async (req, res) => {
  const { videoId, englishLevel } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    // Obtener subtítulos y enviarlos inmediatamente
    const data = await subtitlesAndText(videoId);
    const { subtitles, totalText, durationOfVideo } = data;


      
          // Guardar totalText en memoria o base de datos
          cache.set("totalText",  totalText );
    res.json({ subtitles, durationOfVideo }); // Respuesta rápida con subtítulos


  } catch (error) {
    // console.error("Detalles del error:", error.response.data);
    console.error("Error al obtener los subtitulos:", error);
  }
});


app.get('/api/transcript/result', async (req, res) => {
  const { videoId, englishLevel } = req.query;
  console.log({videoId})
  console.log({englishLevel})
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }
  
  const totalText = cache.get("totalText"); // Obtener el resultado del caché o base de datos

    // Procesar el resto de la información en segundo plano
    const agent = loadAgent(englishLevel);
    const prompt_template = `
 Eres un profesor de inglés especializado en nivel {{englishLevel}}.
  A partir del contenido de estos subtitulos: {{totalText}}, debes generar:
  1) Resumen del contenido, minimo 3000 caracteres (summary)
  2) 10 puntos principales (main_points)
  3) 20 preguntas múltiple choice (4 opciones, 1 correcta y las otras opciones incorrectas tienen que ser creibles)
  4) 20 preguntas verdadero/falso (true_false).
  Tanto el resumen, los 10 puntos principales, preguntas multiple choice y las verdadero/falso deben tener
  el vocabulario adecuado para que el alumno pueda entenderlas segun su nivel de ingles ({{englishLevel}}).
  Ademas, para las preguntas se debe indicar el texto donde hace referencia a la respuesta correcta.

  **Reglas estrictas para generar el resumen, los puntos principales y las preguntas segun el nivel del alumno:**
  - Descripcion del alumno: {{description}}
  - Objectivos: {{objectives}}
  - Gramática permitida: {{grammar}}
  - Vocabulario: {{vocabulary}}
  - Functions: {{functions}}


  **Formato requerido de la respuesta (JSON):**
  {
    "status": "ok",
    "summary": "resumen del texto analizado",
    "main_points": ["primero punto", "segundo punto", "tercer punto", "cuarto punto", "quinto punto", "sexto punto", "septimo punto", "octavo punto", "noveno punto", "decimo punto"],
    "exercises":
    {
      "multiple_choice": [
        {
          "question": "What is the ultimate goal for Neo's learning process?",
          "options": [
              "To become a chef",
              "To replace all human jobs",
              "To achieve true intelligence",
              "To win a robot competition"
          ],
          "correct_answer": 2,
          "text_reference": "for robots to become truly intelligent, they must learn from diverse data in real-world settings"
      }
      ],
      "true_false": [
        {
          "statement": "Neo can cook perfectly without human help.",
          "correct_answer": false,
          "text_reference": "it might be a few more years before robots can handle full cooking duties..."
        }
      ]
    }
  }
  **Reglas estrictas para la respuesta en formato JSON **
  - summary contendra un mínimo de 3000 caracteres y debe contener todas las partes importantes del texto a analizar.
  - en summary cada parrafo tiene que terminarcon un salto de linea.
  - main_points contentra los 10 puntos mas importantes del video.
  - multiple_choice debe contener 20 elementos (1 para cada pregunta).
  - options debe contener la opcion correcta y las otras opciones deben ser creibles, no debe ser facil de adivinar cual es la respuesta correcta, por lo tanto las opciones incorrectas deben estar relacionadas con el contenido, con el texto, no tienen que ser facil de descartar.
  - options debe contener elementos que serán string aproximadamente del mismo tamaño.
  - correct_answer no debe ser siempre el mismo, por lo tanto la respuesta correcta que se encuentra dentro de options, no debe estar siempre en el mismo indice.
  - true_false debe contener 20 elementos.
  - Todo debe estar en un vocabulario que sea capas de entender el alumno, acorde a su nivel {{englishLevel}} de ingle
    `;
    const prompt = prompt_template
      .replace('{{englishLevel}}', englishLevel)
      .replace('{{totalText}}', totalText)
      .replace('{{description}}', agent.description)
      .replace('{{objectives}}', agent.objectives)
      .replace('{{grammar}}', agent.grammar.join(', '))
      .replace('{{vocabulary}}', agent.vocabulary.join(', '))
      .replace('{{functions}}', agent.functions.join(', '));

      const responseDeepseek = await axios.post(
      process.env.DEEPSEEK_URL_API,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      },
      {
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        timeout: 300000
      }
    );
    console.log("Respuesta de DeepSeek, responseDeepseek.data:", responseDeepseek.data.choices[0].message.content);

    const deepseekResponse = JSON.parse(responseDeepseek.data.choices[0].message.content);
    console.log("Respuesta procesada de DeepSeek:", deepseekResponse);

    const totalTokens = JSON.parse(responseDeepseek.data.usage.total_tokens);
    console.log({ totalTokens })

      

  if (!deepseekResponse) {
    return res.status(404).json({ error: 'Result not ready yet. Please try again later.' });
  }

  res.json(deepseekResponse);
});