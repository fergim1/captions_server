// @ts-nocheck

const express = require('express');
const cors = require('cors');
require('dotenv').config();
/* const { youtube_v3 } = require('@googleapis/youtube');*/
const axios = require('axios');
const { Buffer } = require('buffer');
const protobuf = require('protobufjs');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());

app.use(cors({
  origin: process.env.DOMAIN,
  AccessControlAllowOrigin: process.env.DOMAIN,
}))


/* const youtubeClient = new youtube_v3.Youtube({
  auth: process.env.YOUTUBE_API_KEY,
});
 */
/**
 * Helper function to encode a message into a base64-encoded protobuf
 * to be used with the YouTube InnerTube API.
 * @param {Object} message - The message to encode
 * @returns {String} - The base64-encoded protobuf message
 */
function getBase64Protobuf (message) {
  const root = protobuf.Root.fromJSON({
    nested: {
      Message: {
        fields: {
          param1: { id: 1, type: 'string' },
          param2: { id: 2, type: 'string' },
        },
      },
    },
  });
  const MessageType = root.lookupType('Message');

  const buffer = MessageType.encode(message).finish();

  return Buffer.from(buffer).toString('base64');
}

/**
 * Function to retrieve subtitles for a given YouTube video.
 * @param {Object} options - The options for retrieving subtitles
 * @param {String} options.videoId - The ID of the video
 * @param {String} options.trackKind - The track kind of the subtitles (e.g., 'asr' or 'standard')
 * @param {String} options.language - The language of the subtitles
 * @returns {Promise<String>} - The concatenated subtitles of the video
 */

async function getSubtitles ({ videoId, trackKind, language }) {
  const message = {
    param1: videoId,
    param2: getBase64Protobuf({
      param1: trackKind === 'asr' ? trackKind : null,
      param2: language,
    }),
  };

  const params = getBase64Protobuf(message);

  const url = 'https://www.youtube.com/youtubei/v1/get_transcript';
  const headers = { 'Content-Type': 'application/json' };
  const data = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240826.01.00',
      },
    },
    params,
  };

  const response = await axios.post(url, data, { headers });

  const initialSegments =
    response.data.actions[0].updateEngagementPanelAction.content
      .transcriptRenderer.content.transcriptSearchPanelRenderer.body
      .transcriptSegmentListRenderer.initialSegments;

  if (!initialSegments) {
    throw new Error(
      `Requested transcript does not exist for video: ${videoId}`,
    );
  }

  // Map subtitles to JSON format with timestamps
  const subtitles = initialSegments.map((segment) => {
    const line =
      segment.transcriptSectionHeaderRenderer ||
      segment.transcriptSegmentRenderer;

    const { endMs, startMs, snippet } = line;

    const text = snippet.simpleText || snippet.runs?.map((run) => run.text).join('');

    return {
      start: (parseInt(startMs) / 1000).toFixed(2), // Start time in seconds
      dur: ((parseInt(endMs) - parseInt(startMs)) / 1000).toFixed(2), // Duration in seconds
      text,
    };
  });

  return subtitles;
}

/**
 * Main function to get subtitles with known settings.
 * Assumes the default language of the video is English ('en') and prioritizes standard subtitles.
 * Falls back to 'asr' if standard is not available.
 * @param {String} videoId - The ID of the video
 */
async function main (videoId) {
  try {
    // Priority order: 'standard', fallback to 'asr'
    const trackKinds = ['standard', 'asr'];
    let subtitles = '';

    for (const trackKind of trackKinds) {
      try {
        // Attempt to get subtitles
        subtitles = await getSubtitles({
          videoId,
          language: 'en',
          trackKind: "asr",
        });

        if (subtitles) {
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

    console.log('Subtitles:', subtitles);
    return subtitles;
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
    const subtitles = await main(videoId);

    res.json(subtitles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* const subtitles = async () => {
  const sub = await main("F1uTdbv9ur8")
  console.log(sub)
  return sub
};

subtitles()
 */

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});