require("dotenv").config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5163;
const crypto = require("crypto");
const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

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

    .post("/login", (req, res) => {

    })

    .get("/register", async (req, res) => {
        res.render("pages/register.ejs");
    })

    .post("/register", async (req, res) => {
        try {

            // Create hash
            const hash = crypto.createHash('sha256');
            hash.update(req.body.password);

            // Connect our client to the db
            const client = await pool.connect();

            // Get the variables from the Register form
            const name = req.body.name;
            const email = req.body.email;

            const selectEmailSql = "SELECT * FROM users WHERE email = $1;";
            const selectEmail = await client.query(selectEmailSql, [email]);

            // Test if the email is already in the database
            if (selectEmail.rows.length == 0) {
                const insertSql = `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id as newId;`;

                // Insert into database
                await client.query(insertSql, [name, email, hash.digest('hex')]);
                
                // Redirect to the login page
                res.redirect("/login");

            } else {
                // document.getElementById("errorMessage").innerHTML = `<p>The email "${email}" is already in use.<br>Please enter a new email address.</p>`;
                res.redirect("/register");
            }

            const response = {
                newId: selectEmail
            };

            client.release();
            
        } catch (err) {

            console.error(err);

        }
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));