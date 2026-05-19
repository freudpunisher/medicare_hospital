# Hospital Management System - Drizzle ORM Schema

## Overview
This directory contains the Drizzle ORM schema and database client setup for the Medicare Hospital Management System.

## Files
- `schema.ts` - Complete database schema with all tables, relationships, and indices
- `index.ts` - Database client initialization

## Database Tables

### Core Clinical Tables
- **departments** - Hospital departments (Cardiology, Neurology, etc.)
- **specialties** - Medical specialties within departments
- **doctors** - Physician information
- **patients** - Patient demographics and insurance info

### Services & Medical Acts
- **services** - Billable services (Consultation, Laboratory, Imaging, Surgery)
- **medical_acts** - Specific medical procedures with pricing
- **invoice_items** - Line items linking invoices to acts

### Insurance Management
- **insurances** - Insurance provider information
- **insurance_service_rules** - Coverage rates and authorizations by insurance & service

### Financial & Billing
- **invoices** - Patient invoices
- **payments** - Payment transactions
- **cash_register** - Cash point definitions
- **cash_sessions** - Daily cash session tracking
- **expenses** - Operational expenses
- **accounting_journal** - Double-entry journal for financial records

## Schema Features

### Foreign Keys & Relationships
- Cascading deletes for dependent records
- Restrict deletes for critical references
- Proper referential integrity

### Indices
- Optimized for common queries (name, status, dates)
- Indexed foreign keys for join performance
- Indexed business identifiers (codes, phone numbers)

### Data Types
- UUIDs for all primary keys
- Decimal/numeric for financial amounts
- Timestamps for audit trails
- Enum-like varchar for statuses

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Create `.env.local` with your PostgreSQL connection:
```
DATABASE_URL=postgresql://user:password@localhost:5432/medicare
```

### 3. Generate Migration
```bash
npm run db:generate
```

### 4. Push to Database
```bash
npm run db:push
```

### 5. (Optional) Launch Studio
```bash
npm run db:studio
```

## Usage in Code

### Query Data
```typescript
import { db } from '@/db'
import { patients } from '@/db/schema'

const allPatients = await db.select().from(patients)
```

### With Relations
```typescript
import { db } from '@/db'
import { patients } from '@/db/schema'

const patientsWithInsurance = await db.query.patients.findMany({
  with: {
    insurance: true,
    invoices: true,
  },
})
```

### Insert Data
```typescript
await db.insert(patients).values({
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  gender: 'Male',
  phone: '+1-555-0001',
})
```

## Next Steps
- Seed the database with mock data from `lib/mock-data.ts`
- Create API routes for CRUD operations
- Build frontend forms with validation using Zod
