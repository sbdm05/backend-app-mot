const Todo = require('../models/Todo');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// obtenir tous les utilisateurs
const getTodos = async (req, res) => {
  console.log('test depuis getTodos');

  // extraire l'api key
  console.log(req.query, 'reqquery');
  const { API_KEY } = req.query;
  console.log(process.env.PRIVATE_KEY_ADMIN, 'private');
  // vérifier l'api
  if (API_KEY == process.env.PRIVATE_KEY_ADMIN) {
    console.log('oui');
    try {
      // utiliser la méthode Model.find({})
      const todos = await Todo.find({});

      return res.json({ success: true, users: todos });
    } catch (error) {
      console.log('erreur dans get');
      res.status(500).json({ msg: error });
    }
  } else {
    console.log('non');
    res.status(500).json({ msg: 'Accès non autorisé' });
  }
};

// créer un utilisateur
const createTodo = async (req, res) => {
  console.log(req.body, 'body');
  // création d'un document de type Todo
  try {
    const { email, pwd } = req.body;
    // attention cette méthode est indispensable sinon findOne ne retrouve pas un email existant
    const sanitizedEmail = email.toLowerCase();
    console.log(sanitizedEmail, 'email sanitized');

    const alreadyExist = await Todo.findOne({ email: sanitizedEmail });

    if (alreadyExist) {
      console.log('dans already exists');
      return res
        .status(409)
        .json({ success: false, msg: 'user already exists' });
    }

    // hasher le password
    const hashedPassword = await bcrypt.hash(pwd, 10);
    console.log(hashedPassword, 'test');

    // const sanitizedEmail = email.toLowerCase();
    // console.log(sanitizedEmail, 'email sanitized');

    // if does not exist
    const data = {
      email: sanitizedEmail,
      pwd: hashedPassword,
    };

    // rebuild the object with email et hashedpassword et envoyer

    const addedUser = await Todo.create(data);
    console.log(addedUser, 'added user');

    // generate a token
    // besoin d'envoyer un objet!!!!
    const token = jwt.sign(addedUser.toObject(), process.env.JWT_KEY, {
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
  console.log(email, pwd);
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  try {
    // find the user
    const user = await Todo.findOne({ email: email });
    console.log(user, 'user depuis ligne 77');

    if (!user) {
      return res
        .status(409)
        .json({ success: false, msg: 'Pas de compte avec cet e-mail' });
    }

    if (user && (await bcrypt.compare(pwd, user.pwd))) {
      //     // generate a token
      // besoin d'envoyer un objet!!!!
      const token = jwt.sign({ user }, process.env.JWT_KEY, {
        expiresIn: '7 days',
      });

      return res.status(201).json({ token, user: user });
    }
    res.status(400).json({
      success: false,
      msg: "L'email et le mot de passe ne correspondent pas",
    });
  } catch (error) {
    console.log(error, 'erreur');
  }
};

//forgot-password d'un utilisateur
const forgotPassword = async (req, res) => {
  console.log('depuis forgot password');
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
    const link = `https://mes-lettres.vercel.app/reset-password/?id=${oldUser._id}&token=${token}`;
    // const link = `https://guarded-fortress-84785.herokuapp.com/reset-password/?id=${oldUser._id}&token=${token}`;
    console.log(link, 'link');

    // créer un transporteur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST_OVH,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER_OVH,
        pass: process.env.SMTP_PWD_OVH,
      },
    });

    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PWD,
    //   },
    // });

    const mailOptions = {
      from: {
        name: 'Lettres De Motivation',
        address: process.env.SMTP_USER_OVH,
      },
      to: oldUser.email,
      subject: 'Mot de passe oublié',
      html: `<p>Pour réinitialiser votre mot de passe, merci de cliquer sur le lien suivant</p>
        <a href='${link}'>Réinitialiser votre mot de passe</a>`,
    };

    // const mailOptions = {
    //   from: {
    //     name: "Lettres De Motivation",
    //     address: "test@ohmycode.io",
    //   },
    //   to: "test@gmail.com",
    //   subject: "Mot de passe oublié",
    //   html: "hello",
    // };

    // await transporter.sendMail(mailOptions, (err, info) => {
    //   if (err) console.log(err, 'erreur du transporteur');
    //   console.log(info, 'envoyé ok');
    // });

    const success = await new Promise((resolve, reject) => {
      // send mail
      transporter.sendMail(mailOptions).then((info, err) => {
        if (info.response.includes('250')) {
          resolve(true);
        }
        reject(err);
      });
    });

    if (!success) {
      res.status(500).json({ error: 'Error sending email' });
    }
  } catch (e) {
    return res.status(400).json({ status: 'erreur', msg: e });
  }

  return res.status(201).json({ msg: 'OK' });
};

// reset password - step 1 - vérification du lien envoyé par email
const resetPassword = async (req, res) => {
  console.log(req.body, 'body');
  // const { obj } = req.body;
  // const { id, token } = obj;
  const { id, token } = req.body;
  console.log(id, token, 'a t on quelque chose ?');

  const oldUser = await Todo.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: 'User Not Exists!!' });
  }

  try {
    const verifiedUser = jwt.verify(token, process.env.JWT_KEY);

    console.log(verifiedUser, 'user vérifié');

    res.status(201).json({ success: true, user: verifiedUser });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Echec de l'authentification" });
  }
};

// reset password - step 2 - saveNewPassword
const saveNewPassword = async (req, res) => {
  // ici il faut aussi passer l'id pour retrouver le user
  // d'abord on recherche le user avec l'id
  try {
    console.log(req.body, 'depuis save new password');

    // extraire le mot de passe
    const { _id, newPwd } = req.body;
    console.log(typeof _id, _id, 'depuis save new password ligne 195');

    const currentUser = await Todo.findOne({ _id: _id }); // besoin de _id ?
    if (!currentUser) {
      return res
        .status(400)
        .json({ success: false, msg: 'Une erreur est apparue avec ce lien.' });
    }

    // on encrypte le mot de passe
    const encryptedPwd = await bcrypt.hash(newPwd, 10);

    const updatedUser = await Todo.findOneAndUpdate(
      { _id: _id },
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
        .json({ success: false, msg: 'Echec modification du mot de passe' });
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
    console.log(auth, 'auth');

    try {
      const decoded = jwt.verify(auth, process.env.JWT_KEY);
      console.log(decoded, 'decoded');
      // si {user{}}
      // const { _id } = decoded;
      // console.log(_id, 'id');
      // const { email } = user;
      // // send back the user
      if (decoded.user) {
        const { user } = decoded;
        const { _id } = user;
        const currentUser = await Todo.findOne({ _id: _id });
        console.log(currentUser, 'currentUser');
        return res.status(201).json({ msg: 'successTrue', user: currentUser });
      } else {
        const { _id } = decoded;
        const user = await Todo.findOne({ _id: _id });
        console.log(user, 'user');
        return res.status(201).json({ msg: 'successTrue', user: user });
      }
    } catch (error) {
      res.status(500).json({ msg: error });
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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
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
    res.status(500).json({ msg: error });
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
    res.status(500).json({ msg: error });
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
  try {
    const { id } = req.params;
    console.log(id, 'depuis controllers');
    const deletedUser = await Todo.findOneAndDelete({ _id: id });

    // // gérer le cas ou pas de user
    if (!deletedUser) {
      return res
        .status(400)
        .json({ success: false, msg: 'no user with specified id' });
    }
    res.json({ success: true, msg: 'user deleted' });
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
