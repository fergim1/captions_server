var getSubtitles = require('youtube-captions-scraper').getSubtitles;


const fetchSubtitles = async (videoId, language = "en") => {
  try {
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: language,
    });
    console.log("Subtítulos obtenidos:", subtitles);
  } catch (error) {
    console.error("Error al obtener subtítulos:", error);
  }
};

fetchSubtitles("F1uTdbv9ur8", "en");
