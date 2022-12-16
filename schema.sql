-- Create user table and insert a test user
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    usertype INTEGER
);

INSERT INTO users (name, email, password, usertype) VALUES ('Test', 'test@test.com', 'password', 0);

-- Create ticket table and insert a test ticket
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL
);

INSERT INTO tickets (title, description, author, priority, status) VALUES ('Test Title', 'Test desc', 'Test author', 'Low', 'Waiting');

-- Update a users usertype
UPDATE users SET usertype = 1 WHERE id = 1;

-- Delete a ticket from the db
DELETE FROM tickets WHERE id = 1;
