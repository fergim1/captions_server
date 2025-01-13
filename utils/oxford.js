const axios = require('axios');

async function oxford (word) {

  let language = "en-gb"
  console.log("dentro de la funcion oxford, word: ", word)
  try {
    const url = `${process.env.API_OXFORD}/entries/${language}/${word}?fields=definitions%2Cexamples%2Cpronunciations`

    // let originalLanguage = "en"
    // let targetLanguage = "es"
    // const url_translations = `${process.env.API_OXFORD}/translations/${originalLanguage}/${targetLanguage}/${word}?fields=definitions%2Cexamples%2Cpronunciations%2Ctranslations`

    const response = await axios.get(url, {
      headers: {
        app_id: process.env.OXFORD_APPLICATION_ID,
        app_key: process.env.OXFORD_APPLICATION_KEY,
        Accept: 'application/json'
      }
    });
    console.log(response.data)
    return response
  } catch (error) {
    console.error('Error al consultar la API de Oxford:', error.message);
  }
}

module.exports = { oxford };