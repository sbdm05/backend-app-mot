const Todo = require("../models/Todo");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const resetPassword = async (req, res) => {
  try{
    console.log(req.params, "params");

  }catch(e){
    console.log(e, 'error')
  }
};

module.exports = {
  resetPassword,
};
