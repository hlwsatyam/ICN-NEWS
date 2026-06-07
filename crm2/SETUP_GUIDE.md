# Advanced Lead & Sales CRM - Setup & Deployment Guide

## Project Overview
A complete enterprise-grade CRM SaaS application with MongoDB, Express, Next.js, featuring advanced lead management, product sales, task tracking, and automatic timeline generation.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Multer (Local uploads)
- **Authentication**: JWT + bcryptjs
- **UI Components**: Shadcn UI
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Prerequisites
- Node.js 18+ 
- pnpm or npm
- MongoDB Atlas account (or local MongoDB)
- Git

## Installation

### 1. Clone and Install Dependencies
```bash
# Install dependencies
pnpm install
```

### 2. Setup Environment Variables
Create/update `.env.local`:
```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

# JWT Secrets
JWT_SECRET=your-ultra-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-ultra-secure-refresh-token-secret-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
NEXT_PUBLIC_APP_NAME=Advanced Lead CRM
```

### 3. Create Upload Directories
```bash
mkdir -p uploads/profile uploads/team uploads/products uploads/documents uploads/organization
```

## Running the Application

### Development Mode (Terminal 1 - Frontend)
```bash
pnpm dev
# Runs on http://localhost:3000
```

### Development Mode (Terminal 2 - Backend)
```bash
pnpm server:dev
# Runs on http://localhost:5000
# Uses nodemon for hot reload
```

### Seed Demo Data
```bash
pnpm seed
# Creates demo users, leads, products, tasks, and timeline entries
```

## Demo Login Credentials

### Admin Account
- **Email**: admin@crm.com
- **Password**: Admin@123
- **Access**: Full system access

### Team Leader Account
- **Email**: leader@crm.com  
- **Password**: Leader@123
- **Access**: Lead management, assigned leads only

### Additional Team Leaders
- **Email**: teamlead@crm.com
- **Password**: TeamLead@123
- **Email**: sales@crm.com
- **Password**: Sales@123

## Project Structure

```
├── app/                          # Next.js pages and layouts
│   ├── (auth)/                   # Auth pages (login, splash)
│   ├── dashboard/                # Dashboard pages
│   ├── leads/                    # Lead pages (list, details)
│   ├── products/                 # Product pages
│   ├── tasks/                    # Task pages
│   ├── companies/                # Company pages
│   ├── notifications/            # Notification pages
│   ├── settings/                 # Settings pages
│   ├── profile/                  # User profile pages
│   ├── context/                  # React Context (Auth)
│   └── hooks/                    # Custom React hooks
│
├── server/                       # Express backend
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Task.js
│   │   ├── LeadTimeline.js
│   │   ├── Organization.js
│   │   ├── Product.js
│   │   ├── ProductSale.js
│   │   ├── Document.js
│   │   ├── Company.js
│   │   └── Notification.js
│   │
│   ├── routes/                   # API endpoints
│   │   ├── auth.js               # Authentication
│   │   ├── leads.js              # Lead CRUD & operations
│   │   ├── tasks.js              # Task CRUD
│   │   ├── products.js           # Product CRUD
│   │   ├── documents.js          # File upload/download
│   │   ├── companies.js          # Company CRUD
│   │   ├── users.js              # User management
│   │   ├── notifications.js      # Notifications
│   │   └── organization.js       # Organization settings
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT verification
│   │   ├── upload.js             # Multer configuration
│   │   └── roleCheck.js          # Role-based access
│   │
│   ├── config/                   # Configuration
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── utils/                    # Utility functions
│   │   ├── tokens.js             # JWT helpers
│   │   └── validation.js         # Input validation
│   │
│   └── server.js                 # Express app entry point
│
├── config/                       # Centralized config files
│   ├── leadStatuses.ts           # Lead status options
│   ├── loanTypes.ts              # Loan type options
│   ├── priorities.ts             # Priority levels
│   ├── documentTypes.ts          # Document type options
│   ├── productCategories.ts      # Product categories
│   ├── productUnits.ts           # Product units
│   └── taskStatuses.ts           # Task status options
│
├── components/                   # Reusable React components
│   ├── ui/                       # Shadcn UI components
│   ├── Sidebar.tsx               # Main sidebar
│   ├── Header.tsx                # Header component
│   ├── Dashboard.tsx             # Dashboard wrapper
│   └── ...                       # Other components
│
├── lib/                          # Library utilities
│   └── utils.ts                  # Common utilities
│
├── uploads/                      # File storage
│   ├── profile/                  # User profiles
│   ├── team/                     # Team assets
│   ├── products/                 # Product images
│   ├── documents/                # Lead documents
│   └── organization/             # Organization assets
│
├── scripts/                      # Utility scripts
│   └── seed.js                   # Database seeding
│
└── types/                        # TypeScript interfaces
    └── index.ts                  # Type definitions
```

## Key Features

### Lead Management
- Create, edit, and delete leads
- Update lead status with automatic timeline tracking
- Add notes with edit/delete capability
- Upload multiple documents
- Assign tasks to leads
- Sell products through leads
- Add followup reminders

### Timeline Engine
Automatically tracks all lead activities:
- Lead creation and edits
- Status changes
- Product sales
- Notes added/edited
- Tasks created/updated
- Documents uploaded
- Followups added

### Dashboard
**Admin View**:
- Total leads count
- Total sales value
- Revenue metrics
- Product sales overview
- Active team leaders
- Recent activities
- Charts: Lead growth, Sales analytics, Product performance

**Team Leader View**:
- Assigned leads
- Personal sales
- Pending tasks
- Upcoming followups
- Recent activities

### Advanced Filtering
- Filter by loan type
- Filter by lead status
- Filter by priority
- Filter by date range
- Filter by product category
- Filter by assigned team leader

### Global Search
- Search across leads
- Search across products
- Search across tasks
- Search across notes
- Search across documents
- Full pagination support

### Mobile Responsive
- Fully responsive on mobile (320px+)
- Tablet layout optimization (768px+)
- Desktop layout (1024px+)
- Responsive tables, forms, and charts
- Mobile drawer navigation

### Dark Mode Support
- Light theme
- Dark theme
- System theme detection
- Smooth transitions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout user

### Leads
- `GET /api/leads` - Get all leads (with filters)
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PUT /api/leads/:id/status` - Change lead status
- `GET /api/leads/:id/timeline` - Get lead timeline

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/leads/:id/tasks` - Create task for lead
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Notes
- `POST /api/leads/:id/notes` - Add note
- `PUT /api/leads/:id/notes/:noteId` - Update note
- `DELETE /api/leads/:id/notes/:noteId` - Delete note

### Documents
- `POST /api/leads/:id/documents` - Upload document
- `GET /api/documents/:id` - Download document
- `DELETE /api/documents/:id` - Delete document

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/leads/:id/products` - Sell product to lead

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user (Admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Organization Settings
- `GET /api/organization` - Get organization details
- `PUT /api/organization` - Update organization settings
- `POST /api/organization/branding` - Update branding

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Build for Production

### Frontend Build
```bash
pnpm build
pnpm start
```

### Environment Variables for Production
```
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/crm-prod
JWT_SECRET=generate-a-strong-random-string
JWT_REFRESH_SECRET=generate-another-strong-random-string
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NODE_ENV=production
PORT=5000
```

## Security Checklist
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcryptjs
- ✅ Input validation with Joi/Zod
- ✅ CORS configuration
- ✅ Multer file validation
- ✅ Rate limiting middleware ready
- ✅ XSS protection
- ✅ MongoDB injection prevention
- ✅ Environment variable protection

## Performance Optimization
- ✅ Mongoose indexes on frequently queried fields
- ✅ Pagination on all list endpoints
- ✅ Image optimization
- ✅ Code splitting with Next.js
- ✅ Lazy loading components
- ✅ Efficient data fetching with TanStack Query
- ✅ Caching strategies

## Deployment Options

### Vercel (Recommended for Next.js Frontend)
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Railway / Render (Backend)
1. Create new service
2. Connect GitHub repo
3. Set environment variables
4. Deploy

### Docker Deployment
```dockerfile
# Create Dockerfile for containerization
# Uses Node.js as base image
# Installs dependencies
# Builds frontend
# Runs backend server
```

## Troubleshooting

### MongoDB Connection Issues
```
Error: The `uri` parameter to `openUri()` must be a string
- Ensure MONGODB_URI is set in .env.local
- Verify connection string format
- Check MongoDB Atlas whitelist IP
```

### Port Already in Use
```bash
# Kill process on port 3000
kill -9 $(lsof -t -i :3000)

# Kill process on port 5000
kill -9 $(lsof -t -i :5000)
```

### File Upload Issues
```bash
# Ensure upload directories exist
mkdir -p uploads/{profile,team,products,documents,organization}

# Check file permissions
chmod 755 uploads
```

### JWT Token Expired
- Refresh token is automatically handled
- If issues persist, clear browser cache and re-login

## Support & Documentation

See `FEATURE_CHECKLIST.md` for complete feature list
See `README.md` for additional documentation

## License
Private / Proprietary

## Version
1.0.0 - Production Ready
