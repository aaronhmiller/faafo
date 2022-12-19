CREATE TABLE users (
ID SERIAL PRIMARY KEY,
name VARCHAR(30),
email VARCHAR(30)
);

INSERT INTO users (name, email)
VALUES ('Marcia', 'marcia@example.edu'), ('Amy', 'amy@example.com'), ('Gerry', 'gerry@example.com');
