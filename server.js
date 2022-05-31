import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import getEndpoints from 'express-list-endpoints';

import dotenv from 'dotenv';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/final-project';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex'),
  },
});

const User = mongoose.model('User', UserSchema);

// Authentication
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header('Authorization');

  try {
    const user = await User.findOne({ accessToken: accessToken });

    if (user) {
      req.user = user._id;
      next();
    } else {
      res.status(401).json({
        response: 'Please log in.',
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({
      response: error,
      success: false,
    });
  }
};

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get('/', (req, res) => {
  res.send({ 'Final Project - Vanessa Hajek': getEndpoints(app) });
});

// Sign up
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const salt = bcrypt.genSaltSync();
    if (password.length < 8) {
      res.status(400).json({
        response: 'Password must be at least 8 characters long',
        success: false,
      });
    } else {
      const newUser = await new User({
        // username: username,
        email: email,
        password: bcrypt.hashSync(password, salt),
      }).save();
      res.status(201).json({
        response: {
          // username: newUser.username,
          email: newUser.email,
          userId: newUser._id,
          accessToken: newUser.accessToken,
        },
        success: true,
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        response: error,
        success: false,
        // email or username?
        message:
          'Username is already taken. Please enter a new username (or email?)',
      });
    } else {
      res.status(400).json({
        response: error,
        success: false,
        message: 'Could not create user.',
      });
    }
  }
});

// login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        email: user.email,
        userId: user._id,
        accessToken: user.accessToken,
      });
    } else {
      res.status(400).json({
        reponse: "Email and password don't match.",
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({
      response: error,
      success: false,
    });
  }
});

app.get('/profile', authenticateUser);
app.get('/profile', async (req, res) => {
  const profile = 'You are now logged in to your profile';
  try {
    res.status(200).json({
      success: true,
      response: profile,
    });
  } catch (error) {
    res.status(401).json({
      errors: error,
      response: 'Failed to display profile',
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
