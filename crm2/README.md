# Enterprise CRM SaaS Application

A full-stack multi-user CRM system with lead management, company tracking, product catalog, document uploads, and real-time notifications.

## 🚀 Architecture

### Backend (Node.js/Express)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing
- **File Storage**: Multer with local filesystem
- **Real-time**: Socket.io for notifications (ready for integration)
- **API**: RESTful endpoints with role-based access control

### Frontend (Next.js 16)
- **Framework**: Next.js App Router
- **UI**: Shadcn/UI components + Tailwind CSS
- **State**: React Context for authentication, API hooks for data fetching
- **Pages**: Dashboard, Leads, Companies, Products

## 📁 Project Structure

```
/
├── server/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification & role-based access
│   │   └── upload.js                # Multer configuration
│   ├── models/
│   │   ├── User.js                  # User schema with bcrypt
│   │   ├── Company.js               # Company/organization schema
│   │   ├── Lead.js                  # Lead schema with status tracking
│   │   ├── Product.js               # Product schema
│   │   ├── Timeline.js              # Activity timeline schema
│   │   ├── Document.js              # Document metadata schema
│   │   └── Notification.js          # Notification schema
│   ├── routes/
│   │   ├── auth.js                  # Register, login, logout, refresh
│   │   ├── leads.js                 # Lead CRUD, filtering, timeline
│   │   ├── companies.js             # Company CRUD
│   │   ├── products.js              # Product CRUD
│   │   ├── documents.js             # Document upload, retrieve, delete
│   │   ├── users.js                 # User management (admin only)
│   │   └── notifications.js         # Notification management
│   ├── uploads/                     # File storage directories
│   │   ├── documents/
│   │   ├── avatars/
│   │   └── products/
│   └── server.js                    # Express app setup & routes
├── scripts/
│   └── seed.js                      # Database seeding with demo data
├── app/
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state management
│   ├── hooks/
│   │   └── useApi.js                # API call utilities
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── dashboard/
│   │   └── page.tsx                 # Main dashboard
│   ├── leads/
│   │   ├── page.tsx                 # Leads list
│   │   └── [id]/page.tsx            # Lead detail
│   ├── companies/
│   │   └── page.tsx                 # Companies list
│   ├── products/
│   │   └── page.tsx                 # Products catalog
│   ├── layout.tsx                   # Root layout with AuthProvider
│   ├── page.tsx                     # Root page (redirects to dashboard/login)
│   └── globals.css                  # Global styles
└── .env.local                       # Environment variables
```

## 🔐 Authentication

### User Roles
- **Admin**: Full system access, user management
- **Manager**: Lead and team management, reporting
- **User**: Basic CRM access, assigned leads

### Authentication Flow
1. Register → Create user → Hash password → Generate JWT
2. Login → Verify credentials → Return JWT + refresh token
3. Protected routes → Verify JWT middleware → Role-based access

## 📊 Database Schema

### User
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'admin' | 'manager' | 'user',
  status: 'active' | 'inactive' | 'suspended',
  phone: String,
  department: String,
}
```

### Lead
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  company: ObjectId (Company),
  status: 'new' | 'contacted' | 'qualified' | ... | 'closed-lost',
  source: 'website' | 'referral' | 'email' | 'phone' | 'trade-show' | 'other',
  value: Number,
  assignedTo: ObjectId (User),
  documents: [ObjectId] (Document),
  timeline: [ObjectId] (Timeline),
}
```

### Company
```javascript
{
  name: String,
  industry: String,
  email: String,
  website: String,
  status: 'prospect' | 'customer' | 'inactive',
  leads: [ObjectId] (Lead),
}
```

### Timeline
- Tracks all lead changes: status, assignment, documents, notes
- Triggers notifications when relevant

### Document
- Stores file metadata (not the file itself)
- Links to leads/companies
- Supports multiple file types

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- pnpm (or npm/yarn)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Create/update `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/crm-saas
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

### 3. Seed Database (Optional)
```bash
pnpm seed
```

This creates:
- 5 demo users (admin, manager, sales users)
- 3 companies
- 10 leads with various statuses
- 4 products
- Timeline entries and notifications

**Demo Credentials:**
- Email: admin@crm.com
- Password: Admin123!

### 4. Start Backend Server
In one terminal:
```bash
pnpm server:dev
```

### 5. Start Frontend (Next.js)
In another terminal:
```bash
pnpm dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/refresh` - Refresh token

### Leads
- `GET /api/leads` - List leads (filterable)
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/leads/:id/timeline` - Get lead timeline

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Documents
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/:id` - Get document
- `GET /api/documents/file/:id` - Download file
- `DELETE /api/documents/:id` - Delete document

### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/role` - Change role (admin only)
- `PUT /api/users/:id/status` - Change status (admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔄 Data Flow

### Lead Lifecycle
1. Lead Created → Timeline entry created
2. Lead Status Changed → Timeline entry + Notification to assignee
3. Document Uploaded to Lead → Timeline entry + Notification to assignee
4. Lead Assigned → Timeline entry + Notification to new assignee

### Notifications Triggered On
- Lead assigned to user
- Lead status changed
- Document uploaded to assigned lead
- User mentioned in notes

## 📝 Features Implemented

✅ Multi-user authentication with role-based access
✅ Lead management with full CRUD operations
✅ Lead filtering by status, source, assignee, company
✅ Activity timeline tracking all lead changes
✅ Company management and lead-company relationships
✅ Product catalog management
✅ Document upload with file type validation
✅ Notification system with read/unread status
✅ User management (admin panel)
✅ Dashboard with statistics and recent activity
✅ Responsive UI with Tailwind CSS
✅ Database seeding with demo data
✅ Pagination on list views
✅ Search functionality

## 🚀 Future Enhancements

- [ ] Real-time updates with Socket.io
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] CSV import/export for leads
- [ ] Custom fields for leads
- [ ] Activity feed with timestamps
- [ ] Sales pipeline visualization
- [ ] Forecasting and quota tracking
- [ ] Integration with email/calendar
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Dark mode UI

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env.local
- Verify connection string format

### API 401 Unauthorized
- Token may have expired
- Check Authorization header format: `Bearer <token>`
- Re-login to get new token

### File Upload Not Working
- Ensure `server/uploads/` directories exist
- Check file size limit (50MB default)
- Verify file type is allowed

### Next.js Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Technology Stack

**Backend:**
- Express.js 5.2.1
- MongoDB 9.6.2
- Mongoose 9.6.2
- JWT (jsonwebtoken 9.0.3)
- bcryptjs 3.0.3
- Multer 2.1.1

**Frontend:**
- Next.js 16.2.6
- React 19
- Tailwind CSS 4.2.0
- Shadcn/UI
- TypeScript 5.7.3

## 📄 License

This project is provided as-is for educational and development purposes.
