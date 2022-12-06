CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    usertype INTEGER
);

INSERT INTO users (name, email, password, usertype) VALUES ('Test', 'test@test.com', 'password', 0);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL
);

INSERT INTO tickets (title, description, author, priority, status) VALUES ('Test Title', 'Test desc', 'Test author', 'Low', 'Waiting');
