import express from 'express';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// Get all users (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { limit = 20, skip = 0, search, role, status } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (error) {
    console.error('[v0] Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/profile/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[v0] Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[v0] Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, department, bio } = req.body;

    // Users can only update their own profile, admins can update anyone
    if (req.params.id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, department, bio },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('[v0] Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    console.error('[v0] Update user role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user status (admin only)
router.put('/:id/status', requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user,
    });
  } catch (error) {
    console.error('[v0] Update user status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
