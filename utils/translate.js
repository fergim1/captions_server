
const { Translate } = require('@google-cloud/translate').v2;

// Verifica que la variable de entorno esté configurada correctamente
console.log('Ruta de credenciales:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

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
