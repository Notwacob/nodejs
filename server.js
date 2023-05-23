if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

// Import all necessary packages
const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const initializePassport = require("./passport-config");

const app = express();

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    password: String,
});

const users = mongoose.model('users', userSchema);

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected...'))

async function getUserByEmail(email) {
    return await users.findOne({ email: email }).catch(err => {
        console.error('Error occurred:', err);
    });
}

async function getUserById(id) {
    return await users.findOne({ id: id });
}

initializePassport(passport, getUserByEmail, getUserById, users);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // make sure your EJS templates are in a directory named "views" in the same directory as your server.js file

app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            url: process.env.MONGODB_URL,
            collection: "sessions",
        }),
    })
);
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))

// Configuring the register post functionality
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

// Configuring the register post functionality
app.post("/register", checkNotAuthenticated, async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        // Create a new user
        const user = new users({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        // Save the user to the database
        await user.save()

        console.log(users); // Display newly registered in the console
        res.redirect("/login")

    } catch (e) {
        console.log(e);
        res.redirect("/register")
    }
})

// Routes
app.get('/', checkAuthenticated, (req, res) => {
    res.render("index.ejs", { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})
// End Routes

app.delete("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/")
    }
    next()
}

app.listen(3000, () => console.log("Server is running"));