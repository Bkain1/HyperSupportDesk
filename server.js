require("dotenv").config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5163;

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
        res.render("pages/index", args);
    })
    .post("/log", async(req, res) => {
        res.set({
            "Content-Type": "application/json"
        });
        res.json({
            time: Date.now()
        });
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));