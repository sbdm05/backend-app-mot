const Todo = require('../models/Todo');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// obtenir tous les utilisateurs
const getTodos = async (req, res) => {
  console.log('test depuis getTodos');
  // utiliser la méthode Model.find({})
  try {
    const todos = await Todo.find({});

    return res.json({ success: true, users: todos });
  } catch (error) {
    console.log('erreur dans get');
    res.status(500).json({ msg: error });
  }
};

// créer un utilisateur
const createTodo = async (req, res) => {
  console.log(req.body, 'body');
  // création d'un document de type Todo
  try {
    const { email, pwd } = req.body;
    // hasher le password

    const alreadyExist = await Todo.findOne({ email });

    if (alreadyExist) {
      return res
        .status(409)
        .json({ success: false, msg: 'user already exists' });
    }

    const hashedPassword = await bcrypt.hash(pwd, 10);
    console.log(hashedPassword, 'test');

    const sanitizedEmail = email.toLowerCase();
    console.log(sanitizedEmail, 'email sanitized');

    // if does not exist
    const data = {
      email: sanitizedEmail,
      pwd: hashedPassword,
    };

    // rebuild the object with email et hashedpassword et envoyer

    const addedUser = await Todo.create(data);
    // console.log(addedUser, "added user");

    // generate a token
    // besoin d'envoyer un objet!!!!
    const token = jwt.sign({ addedUser }, process.env.JWT_KEY, {
      expiresIn: '20 days',
    });

    console.log(token, 'token');

    res.status(201).json({ userId: addedUser._id, token, addedUser });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

// Logger un utilisateur
const login = async (req, res) => {
  console.log('test', req.body);
  const { email, pwd } = req.body;
  console.log(req.headers, 'req.headers');

  try {
    // find the usereaders
    const user = await Todo.findOne({ email: email });
    console.log(user);

    if (user && (await bcrypt.compare(pwd, user.pwd))) {
      //     // generate a token
      // besoin d'envoyer un objet!!!!
      const token = jwt.sign({ user }, process.env.JWT_KEY, {
        expiresIn: '7 days',
      });

      return res.status(201).json({ token, user: user });
    }
    res.status(400).json({ status: 'Erreur de credentials' });
  } catch (error) {
    console.log(error, 'erreur');
  }
};

//forgot-password d'un utilisateur
const forgotPassword = async (req, res) => {
  // récupérer l'email
  const { email } = req.body;
  console.log(email, 'email');


  try {
    const oldUser = await Todo.findOne({ email });
    console.log(oldUser, 'oldUser');
    if (!oldUser) {
      return res.status(404).json({ status: 'User Not Exists!!' });
    }
    // si email existe
    // créer un token
    const token = jwt.sign({ id: oldUser._id }, process.env.JWT_KEY, {
      expiresIn: '5m',
    });
    console.log(token, 'token');
    // lien unique
    // ici on crée une adresse unique en passant des parametres.
    // ces paramètres nous permettent de retrouver le user et set up un nouveau password
    // const link = `http://localhost:8100/reset-password/${oldUser._id}/${token}`;
    const link = 'https://www.google.fr'
    //const link = `https://guarded-fortress-84785.herokuapp.com/reset-password/?id=${oldUser._id}&token=${token}`;
    console.log('link');

    // créer un transporteur
    const transporter = nodemailer.createTransport({
      host: 'SSL0.OVH.NET',
      port: 587,
      auth: {
        user: 'contact@ohmycode.io',
        pass: 'soniadm05',
      },
    });

    const mailOptions = {
      from: {
        name: 'Lettres De Motivation',
        address: 'contact@ohmycode.io',
      },
      to: oldUser.email,
      subject: 'Mot de passe oublié',
      html:
        '<p>Pour réinitialiser votre mot de passe, merci de cliquer sur le lien suivant</p>' +
        link,
    };

    // const mailOptions = {
    //   from: {
    //     name: "Lettres De Motivation",
    //     address: "contact@ohmycode.io",
    //   },
    //   to: "s.baibou@gmail.com",
    //   subject: "Mot de passe oublié",
    //   html: "hello",
    // };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.log(err, 'erreur du transporteur');
      console.log(info, 'info erreur');
    });
  } catch (e) {
    return res.status(400).json({ status: 'erreur', msg: e });
  }

  return res.status(201).json({ msg: 'OK' });
};

// reset password - step 1 - vérification du lien envoyé par emamil
const resetPassword = async (req, res) => {
  console.log(req.body, 'body');
  const { obj } = req.body;
  const { id, token } = obj;

  const oldUser = await Todo.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: 'User Not Exists!!' });
  }

  try {
    const verifiedUser = jwt.verify(token, process.env.JWT_KEY);
    console.log(verifiedUser, 'user vérifié');
    res.status(201).json({ msg: 'user verified', user: verifiedUser });
  } catch (error) {
    res.status(500).json({ status: 'User Not Exists!!' });
  }
};

// reset password - step 2 - saveNewPassword
const saveNewPassword = async (req, res) => {
  // ici il faut aussi passer l'id pour retrouver le user
  // d'abord on recherche le user avec l'id
  try {
    console.log(req.body);

    // extraire le mot de passe
    const { user, newPwd } = req.body;

    console.log(user, newPwd);
    const currentUser = await Todo.findOne({ _id: user.id });
    if (!currentUser) {
      return res.json({ status: 'User Not Exists!!' });
    }

    // on encrypte le mot de passe
    const encryptedPwd = await bcrypt.hash(newPwd, 10);

    const updatedUser = await Todo.findOneAndUpdate(
      { _id: user.id },
      {
        $set: {
          pwd: encryptedPwd,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res
        .status(400)
        .json({ msg: 'Echec modification du mot de passe' });
    }
    res.json({ success: true, msg: updatedUser });
  } catch (error) {
    console.log(error, 'erreur');
  }
};

// identifier un utilisateur par le token
const getUser = async (req, res) => {
  // récupérer le header avec token
  console.log(req.headers.authorization);
  if (req.headers.authorization) {
    const auth = req.headers.authorization.split(' ')[1];
    console.log(auth);

    try {
      const decoded = jwt.verify(auth, process.env.JWT_KEY);
      console.log(decoded, 'decoded');
      const { user } = decoded;
      //console.log(user);
      const { _id } = user;
      console.log(_id, 'id');
      // const { email } = user;
      // // send back the user
      if (decoded) {
        const user = await Todo.findOne({ _id });
        console.log(user, 'user');
        return res.status(201).json({ msg: 'successTrue', user: user });
      }
    } catch (e) {
      console.log(e, 'error');
    }
  }

  // faire vérif
  // et retourner user
  // res.status(201).json({ msg: "success" });
};

// créer un contact dans >letters
const createApplication = async (req, res) => {
  console.log(req.body, 'req.body');

  try {
    const { _id, pwd } = req.body;
    console.log(req.body, 'req.body');

    const todo = await Todo.findOneAndUpdate({ pwd: pwd }, req.body, {
      new: true,
      runValidators: true,
    });
    // gérer le cas ou pas de todo
    if (!todo) {
      return res.status(400).json({ msg: 'pas de todos avec cette id' });
    }
    res.json({ success: true, msg: todo });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

const savedApplication = async (req, res) => {
  try {
    console.log(req.body);
    const { user, newValue } = req.body;
    const { email } = user;
    const date = new Date().toLocaleDateString('fr');

    // find the user &update
    const response = await Todo.findOneAndUpdate(
      { email: email },
      {
        $push: {
          savedLetters: {
            newValue,
            date: date,
            _id: uuidv4(),
          },
        },
      }
    );

    if (!response) {
      return res.status(400).json({ status: 'error' });
    }
    return res.status(201).json({ status: 'success', msg: response });
  } catch (error) {
    console.log(error, 'error');
  }

  res.status(200).json({ msg: 'ok depuis saved application' });
};

const deleteApplication = async (req, res) => {
  try {
    console.log(req.body);
    const { user, toRemove } = req.body;
    const { email } = user;

    // find the user &update
    const response = await Todo.findOneAndUpdate(
      { email: email },
      {
        $pull: {
          savedLetters: {
            _id: toRemove._id,
          },
        },
      }
    );

    if (!response) {
      return res.status(400).json({ status: 'error' });
    }
    return res.status(201).json({ status: 'success', msg: response });
  } catch (error) {
    console.log(error, 'error');
  }

  res.status(200).json({ msg: 'ok depuis saved application' });
};

// permet de compléter les infos du user
const editTodo = async (req, res) => {
  console.log(req.body, 'req.body');
  // res.json({ success: true, msg: 'editTodo work' });
  // req.body
  // findOneAndUpdate({_id: id}, body)
  try {
    const { gender, prenom, nom, adresse, tel, email, adjs } = req.body;

    const todo = await Todo.findOneAndUpdate({ email: email }, req.body, {
      new: true,
      runValidators: true,
    });
    // gérer le cas ou pas de todo
    if (!todo) {
      return res.status(400).json({ msg: 'pas de todos avec cette id' });
    }
    res.json({ success: true, msg: todo });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

const getSingleTodo = async (req, res) => {
  // récupérer id de req.params
  // utiliser Model.findOne({_id: id})
  // mettre dans bloc try/Catch
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id });
    // gérer le cas ou pas de todo
    if (!todo) {
      return res.status(400).json({ msg: 'pas de todos avec cette id' });
    }
    res.json({ success: true, msg: todo });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

const deleteTodo = async (req, res) => {
  // utilisation de findOneAndDelete({_id: id})
  // gérer les erreurs si pas de todo correspondante
  try {
    const { id } = req.params;
    const todo = await Todo.findOneAndDelete({ _id: id });
    // gérer le cas ou pas de todo
    if (!todo) {
      return res.status(400).json({ msg: 'pas de todos avec cette id' });
    }
    res.json({ success: true, msg: todo });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

module.exports = {
  getTodos,
  createTodo,
  createApplication,
  savedApplication,
  deleteApplication,
  getSingleTodo,
  editTodo,
  deleteTodo,
  login,
  forgotPassword,
  resetPassword,
  saveNewPassword,
  getUser,
};

// je garde pour référence la méthode pour mettre à jour une partie seulement de l'objet
// const createApplication = async (req, res) => {
//   try {
//     const { intitule, societe, contact, adresseSociete, cpVille, email } =
//       req.body;

//     const todo = await Todo.findOneAndUpdate(
//       { email: email },
//       {
//         $set: {
//           "letters.intitule": intitule,
//           "letters.societe": societe,
//           "letters.contact": contact,
//           "letters.adresseSociete": adresseSociete,
//           "letters.cpVille": cpVille,
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     // gérer le cas ou pas de todo
//     if (!todo) {
//       return res.status(400).json({ msg: "pas de todos avec cette id" });
//     }
//     res.json({ success: true, msg: todo });
//   } catch (error) {
//     res.status(500).json({ msg: error });
//   }
// };
