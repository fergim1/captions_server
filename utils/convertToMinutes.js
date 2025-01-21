function convertToMinutes (seconds) {
  const minutes = Math.floor(seconds / 60); // Obtiene los minutos completos
  const remainingSeconds = Math.round(seconds % 60); // Redondea los segundos restantes
  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = {
  convertToMinutes
} 