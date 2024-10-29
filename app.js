const express = require('express');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Sample data stores
let listings = [];
let users = [];

// Middleware to parse JSON requests
app.use(express.json());

// Configure session middleware
app.use(session({ secret: 'your_session_secret', resave: false, saveUninitialized: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Community Resource Sharing API!');
});

// Local Registration Route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, email, password: hashedPassword, role: 'user' };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Local Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(user => user.email === email);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = user;
    res.json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Analytics logging function
const logAnalytics = (action) => {
  console.log(`Action Logged: ${action}`);
};

// Listings routes
app.get('/api/listings', (req, res) => res.json(listings));

app.post('/api/listings', (req, res) => {
  const { title, description, category, location } = req.body;
  const newListing = { id: listings.length + 1, title, description, category, location };
  listings.push(newListing);
  logAnalytics('New Listing Created'); // Log when a new listing is created
  res.status(201).json(newListing);
});

// Function to send email notifications
const sendNotification = (to, subject, text) => {
  const msg = {
    to,
    from: 'your_email@example.com',
    subject,
    text,
  };
  sgMail.send(msg).then(() => {
    console.log('Email sent');
  }).catch((error) => {
    console.error(error);
  });
};

// Example route to demonstrate sending notifications
app.post('/api/messages', (req, res) => {
  const { recipientEmail, message } = req.body;
  sendNotification(recipientEmail, 'New Message', message);
  logAnalytics('Message Sent'); // Log when a message is sent
  res.status(200).json({ message: 'Notification sent' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
