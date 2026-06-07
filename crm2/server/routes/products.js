import express from 'express';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, description, category, price, currency, stock, sku, features } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = new Product({
      name,
      description,
      category,
      price,
      currency: currency || 'USD',
      stock: stock || 0,
      sku,
      features: features || [],
      createdBy: req.userId,
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('[v0] Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0, search, category, status } = req.query;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (error) {
    console.error('[v0] Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('[v0] Get product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('[v0] Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
