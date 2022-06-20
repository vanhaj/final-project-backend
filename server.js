import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import getEndpoints from 'express-list-endpoints';
import { isEmail } from 'validator';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/final-project';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [isEmail, 'invalid email'],
  },
});

const User = mongoose.model('User', UserSchema);

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
  res.send({
    'Final Project - Vanessa Hajek: https://final-project-vanhaj.herokuapp.com/':
      getEndpoints(app),
  });
});

// Sign up
app.post('/signup', async (req, res) => {
  const { email } = req.body;

  try {
    const newUser = await new User({
      email: email,
    }).save();
    res.status(201).json({
      response: {
        email: newUser.email,
        userId: newUser._id,
      },
      success: true,
    });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
