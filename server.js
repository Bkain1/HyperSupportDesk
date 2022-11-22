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

app.use(express.static('public'));

express()
    .use(express.static(path.join(__dirname, "public")))
    .use(express.json())
    .use(express.urlencoded({ extended: true}))
    .set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .get("/", async(req, res) => {

        try {
            const client = await pool.connect();
            const usersSql = "SELECT * FROM users ORDER BY id ASC;";
            const users = await client.query(usersSql);
            const response = {
                "users": users ? users.rows : null
            };
            res.render("pages/index.ejs", response);

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

    .post("/log", async(req, res) => {
        res.set({
            "Content-Type": "application/json"
        });
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

    .get("/register", async (req, res) => {
        res.render("pages/register.ejs");
    })

    .post("/register", async (req, res) => {
            
        // Connect our client to the db
        const client = await pool.connect();

        // Get the variables from the Register form
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        const confirm = req.body.confirm;

        const selectEmailSql = "SELECT * FROM users WHERE email = $1;";
        client.query(selectEmailSql, [email], async(error, result) => {
            if (error) {
                console.error(error);
            }

            // Test if the email is already in the database
            if (result.rows.length > 0) {
                return res.render('pages/register.ejs', {
                    message: 'This email is already in use.'
                })

            } else if (password !== confirm) {
                return res.render('pages/register.ejs', {
                    message: 'Passwords do not match.'
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
    })

    .get("/welcome", async (req, res) => {
        res.render("pages/welcome.ejs");
    })

    .post("/welcome", async (req, res) => {
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));