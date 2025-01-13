
const { Translate } = require('@google-cloud/translate').v2;

// Configura el cliente
const translate = new Translate();

async function translateText (text, targetLanguage) {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error('Error al traducir:', error);
  }
}

module.exports = { translateText };
