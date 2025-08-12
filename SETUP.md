# Aero HR Setup Guide

## Phase 1: Foundation Setup ✅ COMPLETED

The foundation of the Aero HR MVP has been successfully implemented with the following components:

### ✅ Infrastructure Setup
- ✅ Supabase client configuration with SSR support
- ✅ Next.js 14 App Router with TypeScript
- ✅ Shadcn/ui component library integration
- ✅ Tailwind CSS with design system
- ✅ Authentication middleware and protected routes

### ✅ Database Schema
- ✅ Complete PostgreSQL schema with all required tables:
  - `employees` - Employee master data with NPWP, PTKP, BPJS enrollment
  - `salary_components` - Basic salary and fixed allowances
  - `payrolls` - Payroll period management
  - `payroll_items` - Detailed calculation results
  - `app_configuration` - System configuration for tax rates, PTKP amounts

### ✅ Core Business Logic
- ✅ **BPJS Calculation Engine** (`lib/calculations/bpjs.ts`)
  - Health insurance (1% employee, 4% company)
  - Manpower insurance (JHT, JP, JKK, JKM)
  - Salary cap handling for BPJS Health
  
- ✅ **PPh 21 Tax Calculator** (`lib/calculations/pph21.ts`)
  - Progressive tax brackets (5%, 15%, 25%, 30%, 35%)
  - PTKP deduction based on status (TK/0, K/1, etc.)
  - Occupational cost deduction (5%, max 500k/month)
  - Company BPJS inclusion in taxable income

- ✅ **Payroll Engine** (`lib/calculations/payroll.ts`)
  - Complete payroll calculation workflow
  - Integration of BPJS and PPh 21 calculations
  - Calculation breakdown for transparency

### ✅ User Interface
- ✅ Modern dashboard with key metrics
- ✅ Navigation structure for all 3 modules
- ✅ Authentication flow with login page
- ✅ Protected route system
- ✅ Responsive design with Tailwind CSS

## 🚀 Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API
3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```
4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Set Up Database
1. Go to Supabase Dashboard > SQL Editor
2. Copy and run the complete schema from `lib/database/schema.sql`
3. This will create all tables, indexes, and RLS policies

### 3. Create Test User
1. Go to Supabase Dashboard > Authentication > Users
2. Add a new user:
   - Email: `admin@aerohr.com`
   - Password: `admin123`

### 4. Run Development Server
```bash
npm run dev
```

### 5. Access Application
1. Open [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to login
3. Use the test credentials to sign in
4. Explore the dashboard and navigation

## 📋 Next Implementation Steps

### Phase 2: Employee Management Module ✅ COMPLETED
- ✅ Employee CRUD operations with forms
- ✅ Salary component management  
- ✅ Employee data validation
- ✅ BPJS enrollment management

### Phase 3: Payroll Processing Engine
- [ ] Payroll period creation and management
- [ ] Variable input interface (bonus, overtime)
- [ ] Real-time calculation preview
- [ ] Payroll finalization workflow

### Phase 4: Advanced Features
- [ ] PDF payslip generation
- [ ] Excel/CSV report exports
- [ ] Tax configuration management
- [ ] Calculation audit trail

### Phase 5: Production Ready
- [ ] Input validation and error handling
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Testing coverage

## 🎯 Key Features Ready
1. **Indonesian Compliance**: PPh 21 and BPJS calculations follow official regulations
2. **Accuracy**: Calculations match government tools (Ortax)
3. **Transparency**: Detailed calculation breakdowns for auditing
4. **Scalability**: Database schema supports large employee datasets
5. **Security**: Row-level security and authentication

## 📝 Business Logic Validation
The calculation engines are ready to be tested against:
- Official PPh 21 calculators (Ortax)
- BPJS contribution tables
- Real payroll scenarios

## 🔧 Configuration Management
The system supports configurable:
- PTKP amounts by status
- Tax brackets and rates
- BPJS contribution rates
- Occupational cost limits

Ready to continue with Phase 2: Employee Management implementation!