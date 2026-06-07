import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import companiesRoutes from './routes/companies.js';
import productsRoutes from './routes/products.js';
import documentsRoutes from './routes/documents.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('server/uploads'));

// Connect to database
await connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[v0] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`);
  console.log(`[v0] API Health: http://localhost:${PORT}/api/health`);
});
