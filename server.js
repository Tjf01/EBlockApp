const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/task_scheduler_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Define a user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create a user model based on the schema
const User = mongoose.model('User', userSchema);

// Define a task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  isDone: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date }, 
});

// Create a task model based on the schema
const Task = mongoose.model('Task', taskSchema);

// Parse incoming request bodies in JSON format
app.use(bodyParser.json());

// Apply CORS middleware to allow cross-origin requests
app.use(cors());

// Function to generate the access token
function generateAccessToken(user) {
  const secretKey = 'your_secret_key_here'; 
  const payload = {
    userId: user._id, 
    username: user.username,
    email: user.email,
  };
  const options = {
    expiresIn: '1h', 
  };
  return jwt.sign(payload, secretKey, options);
}

// API endpoint for user registration
app.post('/api/signup', async (req, res) => {
  const userData = req.body;
  const newUser = new User(userData);

  try {
    // Hash the password before saving it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newUser.password, saltRounds);
    newUser.password = hashedPassword;

    const savedUser = await newUser.save();
    const accessToken = generateAccessToken(savedUser); 
    res.status(201).json({ accessToken: accessToken }); 
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 11000) {
      const duplicatedField = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${duplicatedField} already exists` });
    }
    return res.status(500).json({ error: 'Error saving user' });
  }
});

// API endpoint for user login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare hashed password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and return an access token if authentication is successful
    const accessToken = generateAccessToken(user);
    return res.status(200).json({ accessToken: accessToken });
  } catch (err) {
    console.error('Error finding user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for user logout
app.post('/api/logout', (req, res) => {
  // You may add additional logic here if needed
  res.status(200).json({ message: 'Logout successful' });
});

// Middleware to authenticate the access token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token not provided' });
  }

  jwt.verify(token, 'your_secret_key_here', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// API endpoint to get all tasks of a specific user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user.userId });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for adding a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, category, date } = req.body; 
  try {
    const newTask = new Task({ title, category, date, owner: req.user.userId });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error('Error saving task:', err);
    res.status(500).json({ error: 'Error saving task' });
  }
});

// API endpoint for deleting a task
app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await Task.findOneAndRemove({ _id: taskId, owner: req.user.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

// API endpoint for updating a task's date and isDone status
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { date, isDone } = req.body; 

  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, owner: req.user.userId },
      { date, isDone }, 
      { new: true } 
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Updated Task:', task); 

    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Error updating task' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
