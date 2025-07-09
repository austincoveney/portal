# DigiGrow Client Portal

A secure, modern client portal for DigiGrow's digital marketing services, built with Next.js and Supabase.

## 🚀 Features

- **Secure Authentication**: Supabase Auth with role-based access control
- **Multi-tenant Architecture**: Support for multiple businesses and user roles
- **Real-time Data**: Live updates using Supabase real-time subscriptions
- **Role Management**: Admin, Agent, Primary Client, and Employee roles
- **Audit Logging**: Comprehensive security and compliance tracking
- **Responsive Design**: Modern UI that works on all devices
- **GDPR Compliant**: Built-in data protection and consent management

## 🏗️ Architecture

### Database Schema
The portal uses a carefully designed PostgreSQL schema with:
- **Users Table**: Extended user profiles linked to Supabase Auth
- **Businesses Table**: Client business information and settings
- **Connections Table**: Many-to-many user-business relationships
- **Invitations Table**: Secure token-based user invitations
- **Audit Logs**: Security and compliance tracking
- **User Sessions**: Active session management

### Security Features
- Row Level Security (RLS) policies on all tables
- JWT-based authentication via Supabase
- Role-based access control (RBAC)
- Secure invitation system with expiring tokens
- Audit logging for compliance

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Row Level Security

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Git for version control

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd portal

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# The file already contains the correct values from your setup
```

### 3. Database Setup

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the SQL files in this order:
   - `database/sql/reset.sql` (if needed)
   - `database/sql/main.sql` (core schema)
   - `database/sql/admin-setup.sql` (admin user)
   - `database/sql/setup_missing_tables.sql` (dashboard fixes)
4. Verify all tables are created successfully

For detailed instructions, see: `docs/DASHBOARD_COMPLETE_GUIDE.md`

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
portal/
├── docs/                       # 📚 All project documentation
│   ├── README.md              # Documentation index
│   ├── DASHBOARD_COMPLETE_GUIDE.md  # Master dashboard setup guide
│   ├── DASHBOARD_FIX_INSTRUCTIONS.md # Previous fix instructions
│   ├── FINAL_DASHBOARD_FIX.md # RLS policy fixes
│   └── monitor_demo.md        # Monitoring demo
├── database/                   # 🗄️ Database files
│   ├── sql/                   # All SQL files organized
│   │   ├── README.md          # SQL files documentation
│   │   ├── main.sql           # Core database schema
│   │   ├── admin-setup.sql    # Admin user setup
│   │   ├── reset.sql          # Database reset script
│   │   ├── setup_missing_tables.sql # Dashboard fix script
│   │   ├── fix_rls_policies.sql     # RLS policy fixes
│   │   ├── force_cleanup_rls.sql    # RLS cleanup
│   │   └── add_email_column.sql     # Email column addition
│   ├── monitoring/            # PowerShell monitoring scripts
│   ├── ADMIN_SETUP.md         # Admin setup guide
│   ├── SECURITY_CHECKLIST.md  # Security guidelines
│   ├── SETUP_GUIDE.md         # Database setup guide
│   └── supabase-config.js     # Supabase configuration
├── src/
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Next.js pages
│   ├── lib/                   # Utility functions and configs
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles
├── public/                    # Static assets
├── Resorses/                  # Project resources
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 🔐 User Roles & Permissions

### Admin
- Full system access
- Manage all users and businesses
- System configuration

### Agent (DigiGrow Staff)
- Manage assigned client businesses
- View and update client data
- Send invitations to clients

### Primary Client
- Full access to their business data
- Manage team members
- Download reports and analytics

### Employee
- Limited access to business data
- View assigned services only
- Basic reporting access

## 🔧 Development Guidelines

### Database Changes
1. Always test schema changes on a development database first
2. Use migrations for production deployments
3. Follow the existing naming conventions
4. Ensure RLS policies are updated for new tables

### Security Best Practices
1. Never expose service role keys on the client-side
2. Always use RLS policies for data access control
3. Validate user permissions on both client and server
4. Log security-relevant events in audit_logs

### Code Style
1. Use TypeScript for type safety
2. Follow ESLint and Prettier configurations
3. Write meaningful commit messages
4. Add JSDoc comments for complex functions

## 🚀 Deployment

### Environment Setup
1. Create production Supabase project
2. Run database schema in production
3. Update environment variables
4. Configure domain and SSL

### Recommended Platforms
- **Frontend**: Vercel, Netlify
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Sentry, LogRocket

## 📊 Database Schema Overview

### Core Tables
- `public.users` - Extended user profiles
- `public.businesses` - Client business information
- `public.user_business_connections` - User-business relationships
- `public.invitations` - Secure user invitations
- `public.audit_logs` - Security and compliance logs
- `public.user_sessions` - Active session tracking

### Key Features
- Automatic timestamp updates
- UUID primary keys
- Foreign key constraints
- Row Level Security (RLS)
- Audit trail for compliance

## 🔍 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify Supabase URL and keys in `.env.local`
- Check if database schema has been executed
- Ensure RLS policies are properly configured

**Authentication Problems**
- Confirm Supabase Auth is enabled
- Check user roles are properly assigned
- Verify RLS policies allow user access

**Permission Errors**
- Review user role assignments
- Check business-user connections
- Verify RLS policy conditions

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Complete Dashboard Guide](./docs/DASHBOARD_COMPLETE_GUIDE.md)
- [Database Setup Guide](./database/SETUP_GUIDE.md)
- [All Documentation](./docs/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software for DigiGrow.

## 📞 Support

For technical support or questions, please contact the development team.

---

**Built with ❤️ for DigiGrow's clients**