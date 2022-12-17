# HyperSupportDesk
This is the repository for [HyperSupportDesk]([url](https://hypersupportdesk.onrender.com/)). It is a IT support ticketing solution for smaller organizations. Normal  users will able to create a ticket with the title and description to the issue they are having. Supportive users will be able to view the ticket on a dashboard once they have been created where they can open it and see the description. They can then begin solving the issue and set the ticket to "completed" once the ticket has been resolved. Administrative users will be able to manage the roles of accounts and edit tickets once they have been created, they will also be able to create tickets on their own.

## Installation
When creating HyperSupportDesk, we created a Node.js application, with the following dependencies:
- dotenv
- ejs
- express
- express-session
- express-validator
- path
- pg

We used postgreSQL to create a database, and used Render to host our website.
To create the database needed for HyperSupportDesk, reference <code>schema.sql</code>.
This schema creates tables for storing user data.

## User Instructions
<ol>
  <li>Go to [HyperSupportDesk](http://hypersupportdesk.onrender.com/).</li>
  <li>Navigate to the login page and click "Don't have an account?".</li>
  <li>Create an account by filling out the name, email, and password fields, then hit the register button.</li>
  <li>Navigate to the dashboard after seeing the welcome screen.</li>
  <li>Create a new ticket or view any previous tickets on the dashboard.</li>
</ol>

## Roles
<ol>
  <li>Administrators and supporters can both currently view all tickets. They are able to mark tickets as complete but cannot create new tickets. They are also able to delete tickets. They can also access the admin page where they can change a users role.</li>
  <li>Standard Users can create and edit previous tickets. They are only allowed to access their own tickets.</li>
</ol>

## About The Project
This project was made as a capstone project to demonstrate course competencies.
The participants are all IT - Software Development students who got a taste of real world development over the span of this project. At the time of starting this assignment, all of the students only had two weeks of prior experience with Node.js.

[HyperSupportDesk]: https://hypersupportdesk.onrender.com
