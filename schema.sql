CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    usertype INTEGER
);

INSERT INTO users (name, email, password, usertype) VALUES ('Test', 'test@test.com', 'password', 0);