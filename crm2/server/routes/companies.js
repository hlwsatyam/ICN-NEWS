import express from 'express';
import Company from '../models/Company.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// Create company
router.post('/', async (req, res) => {
  try {
    const { name, description, industry, website, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name required' });
    }

    const company = new Company({
      name,
      description,
      industry,
      website,
      email,
      phone,
      address,
      createdBy: req.userId,
    });

    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company,
    });
  } catch (error) {
    console.error('[v0] Create company error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0, search, status } = req.query;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const companies = await Company.find(query)
      .populate('leads')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (error) {
    console.error('[v0] Get companies error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('leads');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('[v0] Get company error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company,
    });
  } catch (error) {
    console.error('[v0] Update company error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete company error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
