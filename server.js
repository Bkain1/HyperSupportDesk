require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 5163;
const crypto = require("crypto");
const { Pool } = require("pg");
const session = require("express-session");
const { execArgv } = require("process");
const { response } = require("express");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
function escapeCharacters(string) {
    return string.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
}

function unescapeCharacters(string) {
    return string.replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x5C;/g, '\\')
    .replace(/&#96;/g, '`')
    .replace(/&amp;/g, '&');
}

async function fetchTickets(client, user) {
    
    const usertype = user.usertype;
    var ticketsSql;
    var tickets;

    // Check user's id
    if (usertype >= 1) {

        // Select all tickets
        ticketsSql = "SELECT * FROM tickets ORDER BY priority, id ASC;";
        tickets = await client.query(ticketsSql);

    } else {
    
        // Select all tickets sent from the user
        ticketsSql = "SELECT * FROM tickets WHERE author = $1 ORDER BY priority, id ASC;";
        tickets = await client.query(ticketsSql, [escapeCharacters(user.email).trim()]);
        
    }

    var result = {
        "tickets": tickets.rows,
        "usertype": usertype
    }

    // Return the list of tickets
    return result;
}

app.use(express.static('public'));

express()
    .use(express.static(path.join(__dirname, "public")))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(session({
        // Don't store a secret like this EVER in code. This should
        // be something kept safe, but because we are using this only for
        // a class, this is fine.
        secret: "DontDoThisInProductionCode",
        cookie: {
            sameSite: "strict"
        },
        resave: false,
        saveUninitialized: true
    }))
    .use(function(req, res, next) {
        res.locals.user = req.session.user;
        next();
    })
    .set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .get("/", async(req, res) => {
        res.render("pages/index.ejs");
    })

    .post("/", async(req, res) => {

        if (req.session.user) { //Check if logged in
           req.session.destroy();
           res.redirect("/login");

           } else {
            // Redirect the user
            res.render("pages/login.ejs", {
                message: "You are logged out."
            });
           }
    })
    
    .get("/login", (req, res) => {
        res.render("pages/login.ejs")
    })

    .post("/login", async (req, res) => {
        try {
            // Connect our client to the db
            const client = await pool.connect();

            // Get the credentials from the Login form
            //
            // escape the characters so they are the same as
            // those in the database.
            const email = req.body.email;
            const password = req.body.password;

            // hash the password being taken in
            const hash = crypto.createHash('sha256');
            hash.update(password);

            const selectEmailSql = "SELECT name, password, usertype FROM users WHERE email = $1;";
            const selectEmail = await client.query(selectEmailSql, [escapeCharacters(email).trim()]);
            
            // Check if password matches with database
            // Note: Database stored the user's HASHED password.
            if (selectEmail.rows[0] && selectEmail.rows[0].password == hash.digest('hex')) {

                // Un-escape characters when retrieving...
                req.session.user = {
                    name: unescapeCharacters(selectEmail.rows[0].name),
                    email: unescapeCharacters(email),
                    usertype: selectEmail.rows[0].usertype
                }

                // Redirect to the welcome screen
                res.redirect("/welcome");
            } else {
                
                res.render("pages/login.ejs", {
                    message: "Email or password is incorrect.",
                    retry: "Please try again!",
                    email: email
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

    .post("/register", async (req, res) => {

        // Get the variables from the Register form
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        const confirm = req.body.confirm;

        // Test if name is only letters
        if (!/[a-zA-Z]+/.test(name)) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a valid name with only letters.'
            })
        }

        // Test if email address is valid
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(email)) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a valid email address.',
                name: name
            })
        }

        // check if password is valid length
        if (password.length < 8) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a password at least 8 characters long.',
                name: name,
                email: email
            })
        }

        // Check if password contains a capital letter
        if (!/[A-Z]/.test(password)) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a password with at least 1 capital letter.',
                name: name,
                email: email
            })
        }

        if (!/[0-9]/.test(password)) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a password with at least 1 number.',
                name: name,
                email: email
            })
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return res.render('pages/register.ejs', {
                message: 'Please enter a password with at least 1 special character.',
                name: name,
                email: email
            })
        }

        // check if passwords match
        if (password !== confirm) {
            return res.render('pages/register.ejs', {
                message: 'Passwords do not match.',
                name: name,
                email: email
            })
        }

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
            }

            // If testing passes, make sure the database is getting safe input

            name = escapeCharacters(name).trim();
            email = escapeCharacters(email).trim();
            // Password shouldn't need to be escaped, as SHA-256
            // uses database safe characters

            // Create hash
            const hash = crypto.createHash('sha256');
            hash.update(password);

            const insertSql = `INSERT INTO users (name, email, password, usertype)
            VALUES ($1, $2, $3, 0)
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

        if (req.session.user) {
        
        // Test if the user is logged in and what their usertype is

        const usertype = req.session.user.usertype;
        if (usertype >= 1) {

            // Redirect the admin console

            res.redirect("/admin");
        
        } else {

        // Render the page with the user information
        res.render("pages/welcome.ejs", {
            user: req.session.user
        });

       }
        
        } else {
    
        // Redirect the user
        res.render("pages/login.ejs", {
            message: "Please login first."
        });
       }



    })

    .post("/welcome", async (req, res) => {

    })

    .get("/dashboard", async (req, res) => {
       
        // Test if the user is not logged in
        if (req.session.user) {

            const user = req.session.user;
            const client = await pool.connect();

            // Return the list of tickets
            res.render("pages/dashboard.ejs", await fetchTickets(client, user));
            client.release();
            
        } else {

            // User is not logged in, redirect
            return res.render("pages/login.ejs", {
                message: "Please login first."
            });
        }
    })
    
    
    .post("/dashboard", async (req, res) => {
        res.set({
            "Content-Type": "application/json"
        });

        const viewTicket = req.body.viewTicket;
        const removeTicket = req.body.removeTicket;
        const saveTicket = req.body.saveTicket;
        const markComplete = req.body.markComplete;
        const back = req.body.back;
        
        if (viewTicket !== undefined) {
        // user is currently viewing a ticket.

            const client = await pool.connect();
                
            // Pull the ticket they want to view
            const ticketsSql = "SELECT * FROM tickets WHERE id = $1;";
            await client.query(ticketsSql, [viewTicket.id], async (error, result) => {
                if (error) {
                    console.error(error);
                }
                
                // Return the ticket info
                return res.json({
                    ticket: {
                        id: result.rows[0].id,
                        author: unescapeCharacters(result.rows[0].author),
                        title: unescapeCharacters(result.rows[0].title),
                        description: unescapeCharacters(result.rows[0].description),
                        priority: unescapeCharacters(result.rows[0].priority),
                        status: unescapeCharacters(result.rows[0].status)
                    }
                });
            });
            client.release();

        } else if (saveTicket !== undefined) {
        // user is saving the ticket they are editing.

            try {

                id = saveTicket.id;
                title = escapeCharacters(saveTicket.title).trim();
                description = escapeCharacters(saveTicket.description).trim();
                priority = escapeCharacters(saveTicket.priority).trim();

                if (title == "" || description == "" || priority == "") {
                    return res.json({
                        saveEmpty: "saveEmpty"
                    });
                }

                const client = await pool.connect();

                // Save the changes to the database
                ticketsSql = "UPDATE tickets SET title = $2, description = $3, priority = $4 WHERE id = $1;";
                await client.query(ticketsSql, [id, title, description, priority]);

                // Check if the user is logged in
                if (req.session.user) {

                    const user = req.session.user;

                    res.json(await fetchTickets(client, user));

                } else {

                    // User is not logged in, redirect
                    return res.render("pages/login.ejs", {
                        message: "Please login first."
                    });
                }
                client.release();
            

            } catch (err) {

                console.error(err);

            }

        } else if (markComplete !== undefined) {
        // Ticket is being marked as completed

            const user = req.session.user;
            const client = await pool.connect();

            // Update the status of the ticket
            sql = "UPDATE tickets SET status = 'Completed' WHERE id = $1";
            client.query(sql, [markComplete.id]);

            res.json(await fetchTickets(client, user));
            client.release();


        }else if (removeTicket !== undefined) {
        //Ticket is being removed

        const user = req.session.user;
        const client = await pool.connect();

        // Update the status of the ticket
        sql = "DELETE FROM tickets WHERE id = $1";
        client.query(sql, [removeTicket.id]);

        res.json(await fetchTickets(client, user));
        client.release();
        



        } else if (back !== undefined) {
        // Fetch tickets from database and display

            const user = req.session.user;
            const client = await pool.connect();

            res.json(await fetchTickets(client, user));
            
        } else {
        // User is creating a ticket
          
            try {

                const client = await pool.connect();

                // Pull the information the user has input, sanitizing for the db
                const title = escapeCharacters(req.body.title).trim();
                const description = escapeCharacters(req.body.description).trim();
                const author = escapeCharacters(req.session.user.email).trim();
                const priority = escapeCharacters(req.body.priority).trim();

                // Create new ticket in db
                const insertSql = `INSERT INTO tickets (title, description, author, priority, status)
                    VALUES ($1, $2, $3, $4, 'Waiting')
                    RETURNING id as newTicket;`;

                await client.query(insertSql, [title, description, author, priority]);

                res.redirect("/dashboard");
                client.release();
                
            } catch (err) {

                console.error(err);

            }
        }
    })

    .get("/admin", async (req, res) => {

        if (req.session.user) {

            const usertype = req.session.user.usertype;
            if (usertype >= 1) {
    
                // They have access
    
                try {
                    const client = await pool.connect();
                    const usersSql = "SELECT * FROM users ORDER BY id ASC;";
                    const users = await client.query(usersSql);
                    const response = {
                        "users":users ? users.rows : null
                    };
                    res.render("pages/admin.ejs", response);
        
                } catch (err) {
                    console.error(err);
                    res.set({
                        "Content-Type": "application/json"
                    });
                    res.json({
                        error: err
                    });
                }
            
            } else {
    
            // Redirect the user
            return res.render("pages/login.ejs", {
                message: "You do not have access to the Admin page!"
            });
           }

        } else {

            // User is not logged in, redirect
            return res.render("pages/login.ejs", {
                message: "Please login first."
            });
        }

    })

    .post("/admin", async (req, res) => {
        try {
    
            const client = await pool.connect();
            const id = req.body.id;
            const usertype = req.body.usertype;
            const updateSql = `UPDATE users SET usertype = $2 WHERE email = $1;`;
    
            const update = await client.query(updateSql, [id, usertype]);

            client.release();
            res.redirect("/admin");

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

    .get("/quickFixes", async (req, res) => {
        res.render("pages/quickFixes.ejs");
    })

    .post("/quickFixes", async (req, res) => {
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));