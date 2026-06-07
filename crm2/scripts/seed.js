import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Lead from '../models/Lead.js';
import Product from '../models/Product.js';
import Timeline from '../models/Timeline.js';
import Notification from '../models/Notification.js';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[v0] Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Lead.deleteMany({});
    await Product.deleteMany({});
    await Timeline.deleteMany({});
    await Notification.deleteMany({});

    console.log('[v0] Cleared existing data');

    // Create users
    const users = await User.create([
      {
        email: 'admin@crm.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        phone: '+1-555-0101',
        department: 'Management',
      },
      {
        email: 'manager@crm.com',
        password: 'Manager123!',
        firstName: 'Jane',
        lastName: 'Manager',
        role: 'manager',
        status: 'active',
        phone: '+1-555-0102',
        department: 'Sales',
      },
      {
        email: 'sales1@crm.com',
        password: 'Sales123!',
        firstName: 'John',
        lastName: 'Sales',
        role: 'user',
        status: 'active',
        phone: '+1-555-0103',
        department: 'Sales',
      },
      {
        email: 'sales2@crm.com',
        password: 'Sales123!',
        firstName: 'Sarah',
        lastName: 'Smith',
        role: 'user',
        status: 'active',
        phone: '+1-555-0104',
        department: 'Sales',
      },
      {
        email: 'support@crm.com',
        password: 'Support123!',
        firstName: 'Mike',
        lastName: 'Support',
        role: 'user',
        status: 'active',
        phone: '+1-555-0105',
        department: 'Support',
      },
    ]);

    console.log('[v0] Created 5 users');

    // Create companies
    const companies = await Company.create([
      {
        name: 'Tech Innovations Inc',
        description: 'Leading technology solutions provider',
        industry: 'Technology',
        website: 'https://techinnovations.com',
        email: 'info@techinnovations.com',
        phone: '+1-555-1001',
        employees: 250,
        status: 'customer',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
        createdBy: users[0]._id,
      },
      {
        name: 'Global Solutions Ltd',
        description: 'Enterprise software consulting',
        industry: 'Consulting',
        website: 'https://globalsolutions.com',
        email: 'contact@globalsolutions.com',
        phone: '+1-555-1002',
        employees: 500,
        status: 'customer',
        address: {
          street: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        createdBy: users[0]._id,
      },
      {
        name: 'StartUp Ventures',
        description: 'Innovative startup funding platform',
        industry: 'Finance',
        website: 'https://startupventures.com',
        email: 'hello@startupventures.com',
        phone: '+1-555-1003',
        employees: 50,
        status: 'prospect',
        address: {
          street: '789 Innovation Drive',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'USA',
        },
        createdBy: users[0]._id,
      },
    ]);

    console.log('[v0] Created 3 companies');

    // Create leads
    const leadData = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@email.com', company: companies[0]._id, status: 'qualified', source: 'website' },
      { firstName: 'Bob', lastName: 'Williams', email: 'bob.williams@email.com', company: companies[0]._id, status: 'contacted', source: 'referral' },
      { firstName: 'Carol', lastName: 'Davis', email: 'carol.davis@email.com', company: companies[1]._id, status: 'opportunity', source: 'email' },
      { firstName: 'David', lastName: 'Miller', email: 'david.miller@email.com', company: companies[1]._id, status: 'negotiation', source: 'phone' },
      { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@email.com', company: companies[2]._id, status: 'new', source: 'social-media' },
      { firstName: 'Frank', lastName: 'Moore', email: 'frank.moore@email.com', company: companies[0]._id, status: 'closed-won', source: 'trade-show' },
      { firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@email.com', company: companies[2]._id, status: 'closed-lost', source: 'website' },
      { firstName: 'Henry', lastName: 'Anderson', email: 'henry.anderson@email.com', company: companies[1]._id, status: 'contacted', source: 'referral' },
      { firstName: 'Iris', lastName: 'Thomas', email: 'iris.thomas@email.com', company: companies[0]._id, status: 'qualified', source: 'email' },
      { firstName: 'Jack', lastName: 'Jackson', email: 'jack.jackson@email.com', company: companies[2]._id, status: 'new', source: 'phone' },
    ];

    const leads = await Lead.create(
      leadData.map((lead, index) => ({
        ...lead,
        value: Math.floor(Math.random() * 50000) + 5000,
        assignedTo: users[index % (users.length - 1) + 1]._id, // Assign to sales users
        notes: `Lead notes for ${lead.firstName}`,
        createdBy: users[0]._id,
        tags: ['potential', 'follow-up'],
      }))
    );

    console.log('[v0] Created 10 leads');

    // Update companies with leads
    for (let i = 0; i < companies.length; i++) {
      const companyLeads = leads.filter((lead) => lead.company.toString() === companies[i]._id.toString());
      companies[i].leads = companyLeads.map((l) => l._id);
      await companies[i].save();
    }

    // Create products
    const products = await Product.create([
      {
        name: 'Enterprise CRM Pro',
        description: 'Full-featured CRM for enterprises',
        category: 'Software',
        price: 9999,
        currency: 'USD',
        stock: 100,
        sku: 'CRM-PRO-001',
        status: 'active',
        features: ['Lead Management', 'Sales Pipeline', 'Analytics', 'API Access'],
        createdBy: users[0]._id,
      },
      {
        name: 'CRM Basic',
        description: 'Essential CRM for small teams',
        category: 'Software',
        price: 2999,
        currency: 'USD',
        stock: 200,
        sku: 'CRM-BASIC-001',
        status: 'active',
        features: ['Lead Tracking', 'Email Integration', 'Basic Reports'],
        createdBy: users[0]._id,
      },
      {
        name: 'Implementation Service',
        description: 'Professional CRM implementation',
        category: 'Service',
        price: 15000,
        currency: 'USD',
        stock: 50,
        sku: 'IMPL-SERVICE-001',
        status: 'active',
        features: ['Setup', 'Training', 'Migration', 'Support'],
        createdBy: users[0]._id,
      },
      {
        name: 'CRM Training Course',
        description: 'Online training for CRM usage',
        category: 'Training',
        price: 799,
        currency: 'USD',
        stock: 1000,
        sku: 'TRAIN-COURSE-001',
        status: 'active',
        features: ['Video Lessons', 'Certification', 'Support'],
        createdBy: users[0]._id,
      },
    ]);

    console.log('[v0] Created 4 products');

    // Create timeline entries
    for (const lead of leads.slice(0, 5)) {
      await Timeline.create({
        lead: lead._id,
        type: 'status_change',
        title: 'Lead created',
        description: `Lead ${lead.firstName} ${lead.lastName} created`,
        newValue: lead.status,
        user: users[0]._id,
      });

      if (lead.assignedTo) {
        await Timeline.create({
          lead: lead._id,
          type: 'assignment',
          title: 'Lead assigned',
          description: 'Lead assigned to sales representative',
          newValue: lead.assignedTo.toString(),
          user: users[0]._id,
        });
      }
    }

    console.log('[v0] Created timeline entries');

    // Create notifications
    await Notification.create([
      {
        recipient: users[1]._id,
        type: 'lead_assigned',
        title: 'New Lead Assigned',
        message: 'You have been assigned 3 new leads',
      },
      {
        recipient: users[2]._id,
        type: 'lead_assigned',
        title: 'Lead Assigned',
        message: 'Alice Johnson has been assigned to you',
      },
      {
        recipient: users[3]._id,
        type: 'status_changed',
        title: 'Lead Status Updated',
        message: 'Carol Davis status changed to Opportunity',
      },
    ]);

    console.log('[v0] Created notifications');

    console.log('[v0] Database seeding completed successfully!');
    console.log('[v0] Admin login: admin@crm.com / Admin123!');
    console.log('[v0] Manager login: manager@crm.com / Manager123!');
    console.log('[v0] Sales login: sales1@crm.com / Sales123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[v0] Seeding error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
