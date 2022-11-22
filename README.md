# HyperSupportDesk
This is the repository for [HyperSupportDesk]([url](https://hypersupportdesk.onrender.com/)). It is a IT support ticketing solution for smaller organizations. Normal  users will able to create a ticket with the title and description to the issue they are having. Supportive users will be able to view the ticket on a dashboard once they have been created where they can open it and see the description. They can then begin solving the issue and set the ticket to "completed" once the ticket has been resolved. Administrative users will be able to manage the roles of accounts and edit tickets once they have been created, they will also be able to create tickets on their own.

## Installation
When creating HyperSupportDesk, we created a Node.js application, with the following dependencies:
- dotenv
- ejs
- express
- path
- pg

We used postgreSQL to create a database, and used Render to host our website.
To create the database needed for HyperSupportDesk, reference <code>schema.sql</code>.
This schema creates tables for storing user data.