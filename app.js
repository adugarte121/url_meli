//jshint esversion:9
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const shortid = require('shortid');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Conexion con mongoDB
const connectDB = async () =>{
try{
  await mongoose.connect(process.env.MONGODB_URI,{
    useNewUrlParser: true,
  });
} catch(err){
console.log(err);
}
};
connectDB();

//Creo esquema y modelo
const urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  codeUrl: String
});
const Url = mongoose.model('Url', urlSchema);


//Genero la URL nueva por el objeto enviado por json
app.post('/api/shorten', async (req, res) => {
const baseUrl = 'https://a0quostvyg.execute-api.us-east-1.amazonaws.com/dev';
const { longUrl } = req.body;
const codeUrl = shortid.generate();

//¿es una url valida?
if(validUrl.isUri(longUrl)){
  //¿existe la URL?
let url = await Url.findOne({longUrl});
      if(url){
        //publico la URL corta
        res.send(url.shortUrl);
      }
      else{
const shortUrl = baseUrl + '/' + codeUrl;
let url = new Url({
  longUrl,
  shortUrl,
  codeUrl
});
//guardo y publico la URL corta
await url.save();
res.send(url.shortUrl);
}
}else{
    res.status(401).json("URL invalida");
  }
});

//Buscar URL existente y redirigir al sitio indicado.
app.get('/:codeUrl', async (req, res) => {
  try {
    const url = await Url.findOne({ codeUrl: req.params.codeUrl });
    console.log(url);
    if (url) {
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json('No se encontró la URL solicitada');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

//Eliminar URL
app.delete('/:codeUrl', async(req, res) =>{
  try {
    const url = await Url.deleteOne({codeUrl: req.params.codeUrl});
    console.log(url);
    if(url){
      return res.status(200).json('Se eliminó el registro solicitado');
    }else{
      return res.status(404).json('No se encontró la URL solicitada');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

module.exports.handler = serverless(app);
