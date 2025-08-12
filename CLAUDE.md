# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aero HR (formerly Garuda HR) is an MVP web application focused on accurate payroll, BPJS, and PPh 21 calculation for Indonesian SMEs. The application aims to replace error-prone spreadsheet-based payroll processing with a robust, compliant system.

**Core Modules:**
- Employee Management: Master database for employee profiles, employment data, and salary components
- Payroll Processing: Core calculation engine for gross income, BPJS contributions, PPh 21 tax, and take-home pay
- Tax Management: PPh 21 calculation logic and tax reporting outputs

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Shadcn/ui with Tailwind CSS ("new-york" style)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with CSS variables for theming
- **Type Safety**: TypeScript with strict mode enabled
- **Planned Backend**: Supabase (PostgreSQL, Storage, Edge Functions)
- **Planned Authentication**: Supabase Auth with RBAC

## Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Code Architecture

### Project Structure
- `app/` - Next.js 14 App Router pages and layouts
- `components/` - Reusable React components (Shadcn/ui structure)
- `lib/` - Utility functions and shared logic
- `lib/utils.ts` - Contains `cn()` utility for merging Tailwind classes

### Styling Conventions
- Uses Tailwind CSS with CSS variables defined in `app/globals.css`
- Shadcn/ui components follow "new-york" style variant
- Color system based on HSL variables for light/dark mode support
- Font variables: `--font-geist-sans` and `--font-geist-mono`

### Path Aliases
- `@/*` - Root directory
- `@/components` - Components directory
- `@/lib` - Library/utilities directory
- `@/lib/utils` - Utils file specifically

## Business Logic Requirements

### Indonesian Payroll Compliance
- PPh 21 calculation must match official government calculators (e.g., Ortax)
- BPJS Health & Manpower contribution calculations with official salary caps
- PTKP (Non-Taxable Income) status handling (TK/0, K/0, K/1, etc.)
- Occupational Cost Deduction (Biaya Jabatan) - 5% of gross, max IDR 500k/month
- Progressive PPh 21 tax brackets/rates

### Key Data Models (Planned)
- `employees` - Master employee data with NPWP, PTKP status, bank info
- `salary_components` - Recurring salary components per employee  
- `payrolls` - Master table for payroll periods
- `payroll_items` - Calculated results for employees in each payroll run
- `app_configuration` - Global updatable variables (PTKP amounts, etc.)

### Critical Calculation Sequence
1. Calculate Gross Income (Basic + Allowances + Bonus/Overtime)
2. Calculate BPJS contributions (company & employee portions)
3. Calculate PPh 21 tax using Tax Module logic
4. Calculate Take-Home Pay (Gross - Employee BPJS - PPh 21 - Deductions)

## Development Notes

- This is currently a fresh Next.js project - most business logic is yet to be implemented
- The app uses Geist fonts (Sans and Mono) loaded locally
- Dark mode support is configured via Tailwind CSS classes
- Component library setup uses Shadcn/ui with Lucide icons