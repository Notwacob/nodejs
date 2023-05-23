require('dotenv').config();

// Importing Libraries that we installed using npm
const express = require('express')
const app = express()

const mongoose = require("mongoose");
const bcrypt = require('bcrypt') // Importing bcrypt package
const passport = require('passport')
const initializePassport = require("./passport-config")

const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(
    MONGODB_URL, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);

const usersSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    password: String
});

const users = mongoose.model('users', usersSchema);

app.use(express.urlencoded({extended: false}))

app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new users({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        await user.save()
        res.redirect("/login")
    } catch(e) {
        console.log(e)
        res.redirect("/register")
    }
})

// Routes
app.get('/', (req, res) => {
    res.render("index.ejs")
})

app.get('/login', (req, res) => {
    res.render("login.ejs")
})

app.get('/register', (req, res) => {
    res.render("register.ejs")
})
// End Routes

app.listen(3000, () => console.log("Server is running"));