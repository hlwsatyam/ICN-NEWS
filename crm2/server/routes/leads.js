import express from 'express';
import Lead from '../models/Lead.js';
import Timeline from '../models/Timeline.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check auth on all routes
router.use(auth);

// Create lead
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, companyId, source, value, notes } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lead = new Lead({
      firstName,
      lastName,
      email,
      phone,
      company: companyId,
      source,
      value: value || 0,
      notes,
      createdBy: req.userId,
    });

    await lead.save();

    // Create timeline entry
    await Timeline.create({
      lead: lead._id,
      type: 'status_change',
      title: 'Lead created',
      description: `Lead ${firstName} ${lastName} created`,
      newValue: 'new',
      user: req.userId,
    });

    res.status(201).json({
      message: 'Lead created successfully',
      lead,
    });
  } catch (error) {
    console.error('[v0] Create lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all leads with filters
router.get('/', async (req, res) => {
  try {
    const { status, source, assignedTo, company, search, limit = 20, skip = 0, sort = '-createdAt' } = req.query;

    let query = {};

    if (status) query.status = status;
    if (source) query.source = source;
    if (assignedTo) query.assignedTo = assignedTo;
    if (company) query.company = company;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('company', 'name industry')
      .populate('assignedTo', 'firstName lastName email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Lead.countDocuments(query);

    res.json({
      leads,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[v0] Get leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('company')
      .populate('assignedTo', 'firstName lastName email')
      .populate('documents');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('[v0] Get lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, status, source, value, assignedTo, notes } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Track status changes
    if (status && status !== lead.status) {
      await Timeline.create({
        lead: lead._id,
        type: 'status_change',
        title: 'Status updated',
        description: `Status changed from ${lead.status} to ${status}`,
        oldValue: lead.status,
        newValue: status,
        user: req.userId,
      });
    }

    // Track assignment changes and create notification
    if (assignedTo && assignedTo !== lead.assignedTo?.toString()) {
      await Timeline.create({
        lead: lead._id,
        type: 'assignment',
        title: 'Lead assigned',
        description: `Lead assigned to user`,
        newValue: assignedTo,
        user: req.userId,
      });

      // Create notification for assigned user
      await Notification.create({
        recipient: assignedTo,
        type: 'lead_assigned',
        title: 'Lead Assigned',
        message: `Lead ${firstName} ${lastName} has been assigned to you`,
        lead: lead._id,
      });
    }

    // Update lead
    Object.assign(lead, {
      firstName: firstName || lead.firstName,
      lastName: lastName || lead.lastName,
      email: email || lead.email,
      phone: phone || lead.phone,
      company: company || lead.company,
      status: status || lead.status,
      source: source || lead.source,
      value: value !== undefined ? value : lead.value,
      assignedTo: assignedTo || lead.assignedTo,
      notes: notes !== undefined ? notes : lead.notes,
    });

    await lead.save();

    res.json({
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error) {
    console.error('[v0] Update lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await Lead.deleteOne({ _id: req.params.id });
    await Timeline.deleteMany({ lead: req.params.id });
    await Notification.deleteMany({ lead: req.params.id });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get lead timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const timeline = await Timeline.find({ lead: req.params.id })
      .populate('user', 'firstName lastName email')
      .sort('-createdAt');

    res.json(timeline);
  } catch (error) {
    console.error('[v0] Get timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
