import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    let query = { recipient: req.userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('lead', 'firstName lastName')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.userId, isRead: false });

    res.json({
      notifications,
      unreadCount,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (error) {
    console.error('[v0] Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('[v0] Mark notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[v0] Mark all notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
