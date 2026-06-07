import express from 'express';
import User from '../models/User.js';
import { generateTokens } from '../utils/tokens.js';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();

    // Generate tokens
    const { token, refreshToken } = generateTokens(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[v0] Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'User account is not active' });
    }

    const { token, refreshToken } = generateTokens(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[v0] Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint (stateless, just returns success)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token and generate new token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { token, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.role);

    res.json({
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
