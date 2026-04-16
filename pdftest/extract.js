const fs = require('fs');
const pdf = require('pdf-parse');
const path = 'C:/Users/joaov/OneDrive/Documentos/FIRECRAL/taste-skill/NOVO LOGO 2026/CATALOGO-LINHA651-ORAFOL.pdf';

try {
  let dataBuffer = fs.readFileSync(path);
  pdf(dataBuffer).then(function(data) {
      console.log(data.text);
  }).catch(console.error);
} catch(e) {
  console.error("Read file error:", e);
}
