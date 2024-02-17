const mongoose = require('mongoose')

//const connectionString = 'mongodb+srv://sonia:12345@nodeexpressprojects.5olzi.mongodb.net/demo1363?retryWrites=true&w=majority'


const connectDB = (url) =>{
  return mongoose
      .connect(url)
      .then(()=> console.log('connecté'))
      .catch((err)=> console.log(err))
}

module.exports = connectDB;
