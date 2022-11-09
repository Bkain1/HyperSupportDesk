require("dotenv").config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5163;
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
        const args = {
            time: Date.now()
        };
        res.render("pages/index.ejs", args);
    })
    .post("/log", async(req, res) => {
        res.set({
            "Content-Type": "application/json"
        });
        res.json({
            time: Date.now()
        });
    })

    .get("/login", (req, res) => {
        res.render("pages/login.ejs")
    })

    .post("/login", (req, res) => {

    })

    .get("/register", (req, res) => {
        res.render("pages/register.ejs")
    })

    .post("/register", (req, res) => {
        res.body.name
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));