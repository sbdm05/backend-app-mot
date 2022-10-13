const express = require('express');
// nécessaire pour faire des appels
const cors = require("cors");
const todosRoutes = require('./routes/todos')
const LoginRoutes = require("./routes/login");

// require db
const connectDB = require('./db/connect')
require('dotenv').config()
const jwt = require("jsonwebtoken");



const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/reset-password', express.static('./reset-password'));


app.use(cors());

app.use('/api/v1/letters', todosRoutes )
// app.use('/', LoginRoutes)

// adresse à utiliser en local =>  localhost:4000
 const port = process.env.PORT || 4000;
// const port = process.env.PORT;

const start = async()=>{
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, ()=> console.log('app listening'))
    } catch (error) {
        console.log(error)
    }
}

start()
