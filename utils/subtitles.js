const { Buffer } = require('buffer');
const protobuf = require('protobufjs');
const axios = require('axios');



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

async function getSubtitles ({ videoId, trackKind, language }) {
  const message = {
    param1: videoId,
    param2: getBase64Protobuf({
      param1: trackKind === 'asr' ? trackKind : null,
      param2: language,
    }),
  };

  const params = getBase64Protobuf(message);


  const API_YOUTUBE = process.env.API_YOUTUBE;
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

  const response = await axios.post(API_YOUTUBE, data, { headers });

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
  let totalTextOfVideo = "";
  const subtitlesWithTimestamp = initialSegments.map((segment) => {
    const line =
      segment.transcriptSectionHeaderRenderer ||
      segment.transcriptSegmentRenderer;

    const { endMs, startMs, snippet } = line;

    const text = snippet.simpleText || snippet.runs?.map((run) => run.text).join('');

    totalTextOfVideo += text + " ";

    return {
      start: (parseInt(startMs) / 1000).toFixed(2), // Start time in seconds
      dur: ((parseInt(endMs) - parseInt(startMs)) / 1000).toFixed(2), // Duration in seconds
      text,
    };
  });



  // TODO: devolver tambien "totalText" que es el texto completo de todos los subtitulos
  // console.log({ totalTextOfVideo })
  // console.log({ subtitlesWithTimestamp })
  return { subtitlesWithTimestamp, totalTextOfVideo };
}

module.exports = { getSubtitles };
