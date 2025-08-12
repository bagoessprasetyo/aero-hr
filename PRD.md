Product Requirements Document: Garuda HR (MVP Core)
Document Title	PRD: Garuda HR (MVP - Core Payroll & Tax Engine)
Version	1.1 (EN)
Date	October 26, 2023
Author	[Your Name/Team]
Status	Scoped for MVP Development
1. Introduction & Vision
Garuda HR (MVP) is a web application with a singular focus: to be the most accurate and efficient payroll, BPJS, and PPh 21 calculation engine for Indonesian SMEs. By abstracting away the complexity of manual processing, this MVP will serve as a robust and trustworthy foundation.

Long-term Vision: To evolve into a full-featured Human Resource Information System (HRIS) by adding attendance, leave, and claims management modules in subsequent releases.

2. Problem Statement
Indonesian SMEs commonly rely on spreadsheets for payroll processing. This method is highly susceptible to human error, difficult to audit, and inefficient, especially when adapting to frequent changes in tax (PPh 21) and social security (BPJS) regulations. This creates significant compliance risks and a heavy administrative burden.

3. Target Audience & Personas
HR Admin / Payroll Specialist (Primary Persona): The main user responsible for data entry, execution, and verification of the payroll process. Their primary needs are accuracy, speed, and ease of reporting.
Company Owner / Finance Manager (Secondary Persona): Requires concise and accurate summary reports of payroll costs, taxes, and BPJS contributions for budgeting and financial reporting purposes.
4. Goals & Success Metrics (MVP)
Goal	Success Metrics
Deliver 100% Accurate Calculations	PPh 21 and BPJS calculation results in Garuda HR match official government calculators (e.g., Ortax) with zero deviation.
Dramatically Reduce Reporting Time	The time required to generate monthly payroll summaries, PPh 21, and BPJS reports is reduced from hours to minutes.
Establish a Single Source of Truth	All employee master data and salary components are stored centrally and securely, eliminating reliance on scattered Excel files.
5. Technical Stack
Frontend Framework: Next.js 14 (App Router)
UI Components: Shadcn/ui, Tailwind CSS
Backend & Database: Supabase (PostgreSQL, Storage, Edge Functions)
Authentication: Supabase Auth (with Role-Based Access Control)
6. MVP Feature Requirements
Development will focus on these three tightly integrated modules.

Module 1: Employee Management
This is the master database that feeds all calculations.

User Stories:
As an HR Admin, I want to be able to add, view, edit, and deactivate employee profiles to ensure the data is always up-to-date.
As an HR Admin, I want to store employment history, contract details, and employee status (Permanent, Contract, Active, Resigned) for administrative purposes.
Required Data Fields per Employee:
Personal Data: Full Name, National ID (NIK), Tax ID (NPWP), Address.
Employment Data: Employee ID, Position/Title, Department, Join Date, Employment Status.
Financial Data (CRITICAL):
Bank Account Number & Bank Name.
PTKP Status (Non-Taxable Income): Dropdown (e.g., TK/0, K/0, K/1).
BPJS Enrollment: Checkboxes for BPJS Health & BPJS Manpower.
Salary Components (CRITICAL):
Basic Salary: Numeric input.
Fixed Allowances: The ability to add multiple named, fixed allowances with their corresponding amounts (e.g., Position Allowance - IDR 1,000,000).
Module 2: Payroll Processing
This is the core engine of the application. It pulls data from the Employee Module and uses logic from the Tax Module.

User Stories:
As an HR Admin, I want to initiate a new payroll run for a specific month and year.
As an HR Admin, I want to input variable components for each employee for the current month, such as Bonus, Incentives, Overtime Pay, and Other Deductions.
As the System, I must automatically calculate each employee's payslip in the correct sequence:
Calculate Gross Income (Basic Salary + All Allowances + Bonus/Overtime).
Calculate BPJS Health & Manpower contributions (both company and employee portions), respecting official salary caps.
Invoke the logic from the Tax Module to calculate the monthly PPh 21 tax.
Calculate the final Take-Home Pay (Gross Income - Employee BPJS Contributions - PPh 21 - Other Deductions).
As an HR Admin, I want to view a detailed calculation breakdown for any employee before approving the payroll.
As an HR Admin, I want to generate a clean and clear Payslip in PDF format.
Module 3 (6): Tax Management
This module contains the PPh 21 calculation logic and is responsible for tax reporting outputs.

User Stories:
As the System, I must contain accurate PPh 21 calculation logic, which includes:
Adding company-paid JKK, JKM, and BPJS Health contributions to the taxable gross income.
Calculating the Occupational Cost Deduction (Biaya Jabatan - 5% of gross, max IDR 500k/month).
Subtracting employee-paid JHT & JP contributions.
Calculating the Annual Taxable Income (PKP) by subtracting the correct PTKP amount.
Applying the progressive PPh 21 tax brackets/rates.
As an HR Admin, I want to generate a Monthly PPh 21 Report as a summary (Excel/CSV) containing employee name, NPWP, gross income, and PPh 21 withheld, ready for input into e-SPT / e-Bupot.
As an HR Admin, I want to be able to generate the annual Form 1721-A1 tax slip for each employee at year-end.
7. User Flow: Monthly Payroll Execution (MVP)
Login: The HR Admin logs in using Supabase Auth.
Verify Employee Data: The HR Admin confirms that the data in the Employee Management module is complete, especially NPWP and PTKP status.
Initiate Payroll Run: Navigate to "Payroll," click "Create New Payroll," and select the period (e.g., "November 2023").
Input Variables: The system displays a list of all active employees. The HR Admin inputs variable data like bonuses or overtime pay into the designated fields for specific employees.
Calculate: The HR Admin clicks the "Calculate Payroll" button. A Supabase Edge Function executes the calculation logic for all employees. The UI updates to display the results (BPJS details, PPh 21, and Net Pay).
Review & Finalize: The HR Admin reviews a few sample calculations for accuracy. Once confident, they click "Finalize Payroll." This locks the data for the period, making it read-only.
Generate Reports: After finalization, the report download buttons become active. The HR Admin can now download:
Payslips (individually or in bulk).
The monthly PPh 21 summary report (for e-SPT).
The BPJS contribution summary report.
The bank transfer report (CSV).
8. Initial Database Schema (Supabase PostgreSQL)
employees: Stores all employee master data (name, ID, NPWP, PTKP, status, bank info, etc.).
salary_components: Table to store an employee's recurring salary components (e.g., employee_id, component_name: 'Basic Salary', amount: 10000000).
payrolls: A master table for each payroll period (e.g., id, period: '2023-11-01', status: 'finalized').
payroll_items: The detail table storing the calculated results for each employee within a payroll run (e.g., payroll_id, employee_id, gross_salary, pph21_amount, net_salary, etc.).
app_configuration: A key-value table to store global, updatable variables (e.g., key: 'ptkp_tk0', value: '54000000'; key: 'occupational_cost_max_yearly', value: '6000000').
9. Out of Scope (For Future Releases)
To maintain focus for the MVP, the following features are explicitly excluded from this initial release:

Attendance Management Module & Biometric Machine Integration.
Leave Management Module.
Claims & Reimbursement Module.
Employee Self-Service (ESS) Portal.
Direct API integration with accounting software or e-SPT. All reports will be file-based (CSV/Excel) for manual upload/entry.
Multi-Branch Management.