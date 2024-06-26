const mongoose = require('mongoose');

// on crée la structure de Todo
const TodoSchema = new mongoose.Schema({
  // key/value pair
  gender: {
    type: String,
    trim: true,
    maxlength: [20, 'Ne doit pas dépasser 20 caractères'],
  },
  prenom: {
    type: String,
    trim: true,
    maxlength: [40, 'Ne doit pas dépasser 40 caractères'],
  },
  nom: {
    type: String,
    trim: true,
    maxlength: [40, 'Ne doit pas dépasser 20 caractères'],
  },
  tel: {
    type: Number,
    trim: true,
    maxlength: [10, 'Ne doit pas dépasser 20 caractères'],
  },
  adresse: {
    type: String,
    trim: true,
    maxlength: [100, 'Ne doit pas dépasser 50 caractères'],
  },
  email: {
    type: String,
    trim: true,
  },
  pwd: {
    type: String,
    trim: true,
    minlength: [8, 'pas moins de 8 caractères'],
  },
  adjs: {
    type: [String],
    trim: true,
    // maxlength: [20, "Ne doit pas dépasser 20 caractères"],
  },
  pic2: {
    data: Buffer, // Les données binaires de l'image
    contentType: String, // Le type MIME de l'image
  },
  pic: {
    type: String,
    trim: true,
  },
  letters: {
    // type: ["Mixed"],
    type: [],
  },
  savedLetters: {
    type: [],
  },
});

module.exports = mongoose.model('Todo', TodoSchema);

// gender: string;
// prenom: string;
// nom: string;
// tel: number;
// adresse: string;
// email: string;
// pwd: string;
// adjs: [];
// letters: {
//   // type: ["Mixed"],
//   type: [
//     {
//       intitule: String,
//       societe: String,
//       contact: String,
//       adresseContact: String,
//       cpVille: String,
//     },
//   ],
// },
