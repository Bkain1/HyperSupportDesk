require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 5163;
const crypto = require("crypto");
const { Pool } = require("pg");
const { execArgv } = require("process");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
const { check, validationResult } = require("express-validator");

app.use(express.static('public'));

express()
    .use(express.static(path.join(__dirname, "public")))
    .use(express.json())
    .use(express.urlencoded({ extended: true}))
    .set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .get("/", async(req, res) => {
        res.render("pages/index.ejs");
    })

    .get("/login", (req, res) => {
        res.render("pages/login.ejs")
    })

    .post("/login", async (req, res) => {
        try {
            // Connect our client to the db
            const client = await pool.connect();
            // Get the credentials from the Login form
            const email = req.body.email;
            const password = req.body.password;

            const selectEmailSql = "SELECT password FROM users WHERE email = $1;";
            const selectEmail = await client.query(selectEmailSql, [email]);
            
            // Check if password mathces with database
            if (selectEmail.rows[0].password == password) {
                // Redirect to the welcome screen

                res.redirect("/welcome");
            } else {
                // document.write("Email and Password do not match! Please try again.");
                res.redirect("/login");

                var popup = require('popups');

                popup.alert({
                    content: 'Hello!'
                });

            }

            client.release();
            
        } catch (err) {

            console.error(err);
            res.set({
                "Content-Type": "application/json"
            });
            res.json({
                error: err
            });
        }
    })

    .get("/register", async(req, res) => {
        res.render("pages/register.ejs");
    })

    .post("/register", [
        check('name', 'Please enter a valid name with only letters.')
            .matches('[a-zA-Z]+')
            .trim()
            .escape(),
        check('email', 'Please enter a valid email address.')
            .isEmail()
            .normalizeEmail()
            .trim()
            .escape(),
        check('password')
            .isLength({ min: 8 })
            .withMessage('Please enter a password at least 8 digits long.')
            .matches('[A-Z]')
            .withMessage('Please enter a password with at least 1 capital letter.')
            .matches('[0-9]')
            .withMessage('Please enter a password with at least 1 number.')
            .matches('[^A-Za-z0-9]')
            .withMessage('Please enter a password with at least 1 special character.')
            .trim()
            .escape(),
        check('confirm')
            .trim()
            .escape()
    ], (req, res) => {

        const errorFormatter = ({ msg }) => {
            return `${msg}`;
        };

        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {

            return res.render('pages/register.ejs', {
                errors: errors.mapped()
            })

        }

        // Get the variables from the Register form
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        const confirm = req.body.confirm;

        (async () => {

            // Connect our client to the db
            const client = await pool.connect();
            
            const selectEmailSql = "SELECT * FROM users WHERE email = $1;";
            client.query(selectEmailSql, [email], async (error, result) => {
                if (error) {
                    console.error(error);
                }

                // Test if the email is already in the database
                if (result.rows.length > 0) {
                    return res.render('pages/register.ejs', {
                        message: 'This email is already in use.',
                        name: name
                    })

                } else if (password !== confirm) {
                    return res.render('pages/register.ejs', {
                        message: 'Passwords do not match.',
                        name: name,
                        email: email
                    })
                }

                // Create hash
                const hash = crypto.createHash('sha256');
                hash.update(password);

                const insertSql = `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id as newId;`;

                // Insert into database
                client.query(insertSql, [name, email, hash.digest('hex')], (err, result) => {
                    if (error) {
                        console.log(error)
                    } else {
                        res.render('pages/register.ejs', {
                            message: 'User registered!'
                        })
                    }
                });
                
                client.release();
            });
        })();
    })

    .get("/welcome", async (req, res) => {
        res.render("pages/welcome.ejs");
    })

    .post("/welcome", async (req, res) => {
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));