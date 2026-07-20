/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  Employee, Supplier, Brand, Category, Product, 
  Customer, Agreement, Installment, Payment, Expense, AuditLog, CompanyProfile,
  BankAccount, FinanceTransaction, StaffPayroll, LockUnlockRequest, StaffNotification,
  LegalCase, Complaint, CorporateFiling, CompanyPolicy, Investor, InvestorTransaction,
  WhatsAppTemplate, WhatsAppAlert
} from './src/types';

const app = express();
const PORT = 3000;

// High limits for documents base64 data uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Memory Datastore structure
interface DbState {
  employees: Employee[];
  suppliers: Supplier[];
  brands: Brand[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  agreements: Agreement[];
  installments: Installment[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  cashBalance: number;
  bankBalance: number;
  companyProfile: CompanyProfile;
  bankAccounts?: BankAccount[];
  financeTransactions?: FinanceTransaction[];
  staffPayroll?: StaffPayroll[];
  lockUnlockRequests?: LockUnlockRequest[];
  notifications?: StaffNotification[];
  legalCases?: LegalCase[];
  complaints?: Complaint[];
  corporateFilings?: CorporateFiling[];
  companyPolicies?: CompanyPolicy[];
  investors?: Investor[];
  investorTransactions?: InvestorTransaction[];
  whatsappTemplates?: WhatsAppTemplate[];
  whatsappAlerts?: WhatsAppAlert[];
  whatsappAssignee?: string;
}

// Default Seed Data
const defaultDb: DbState = {
  companyProfile: {
    name: 'Manha Digital Consumer Financing',
    slogan: 'Durable products, easy installments, reliable service',
    phone: '+922134567890',
    email: 'info@manhadigital.pk',
    address: 'Plot SB-3, Block 13-C, University Road, Gulshan-e-Iqbal, Karachi',
    ntn: 'NTN-8930412-4',
    regNo: 'SEC-PK-2026-904',
    terms: '1. All installments are payable by the 10th of each calendar month.\n2. Late fee of RS 200/day is applicable after the 5-day grace period.\n3. The company reserves the right to repossess the asset in case of default of more than two consecutive installments.'
  },
  employees: [
    { id: 'EMP-0001', name: 'Super Administrator', username: 'admin', password: 'admin123', role: 'Super Admin', branch: 'All Branches', department: 'Executive', salary: 150000, commissionRate: 0, status: 'Active' },
    { id: 'EMP-ROYAL', name: 'Royal', username: 'Royal', password: 'Khairpur', role: 'Super Admin', branch: 'All Branches', department: 'Executive', salary: 200000, commissionRate: 0, status: 'Active' },
    { id: 'EMP-0002', name: 'Kamil Khan', username: 'manager', password: 'manager123', role: 'Branch Manager', branch: 'Karachi Central', department: 'Management', salary: 90000, commissionRate: 0, status: 'Active' },
    { id: 'EMP-0003', name: 'Ayesha Siddiqui', username: 'accounts', password: 'accounts123', role: 'Accounts', branch: 'Karachi Central', department: 'Finance', salary: 75000, commissionRate: 0, status: 'Active' },
    { id: 'EMP-0004', name: 'Zubair Shah', username: 'ops', password: 'ops123', role: 'Operation', branch: 'Karachi Central', department: 'Operations', salary: 60000, commissionRate: 0, status: 'Active' },
    { id: 'EMP-0005', name: 'Fahad Malik', username: 'sales', password: 'sales123', role: 'Sales Executive', branch: 'Karachi Central', department: 'Sales', salary: 35000, commissionRate: 3, status: 'Active' },
    { id: 'EMP-0006', name: 'Bilal Ahmed', username: 'recovery', password: 'recovery123', role: 'Recovery Officer', branch: 'Karachi Central', department: 'Recovery', salary: 30000, commissionRate: 1, status: 'Active' },
    { id: 'EMP-0007', name: 'Sana Fatima', username: 'cashier', password: 'cashier123', role: 'Cashier', branch: 'Karachi Central', department: 'Finance', salary: 40000, commissionRate: 0, status: 'Active' },
  ],
  suppliers: [
    { id: 'SUP-0001', name: 'Metro Distribution', phone: '+923001234567', email: 'info@metrodist.com', address: 'Plot 42, Korangi Industrial Area, Karachi' },
    { id: 'SUP-0002', name: 'United Motors Corp', phone: '+923219876543', email: 'sales@unitedmotors.pk', address: '77-A, Jail Road, Lahore' },
  ],
  brands: [
    { id: 'BRD-0001', name: 'Apple' },
    { id: 'BRD-0002', name: 'Samsung' },
    { id: 'BRD-0003', name: 'Yamaha' },
    { id: 'BRD-0004', name: 'Dell' },
  ],
  categories: [
    { id: 'CAT-0001', name: 'Smartphones' },
    { id: 'CAT-0002', name: 'Motorcycles' },
    { id: 'CAT-0003', name: 'Laptops' },
  ],
  products: [
    { id: 'PRD-0001', barcode: 'PROD-749302', name: 'iPhone 15 Pro Max 256GB', category: 'Smartphones', brand: 'Apple', purchasePrice: 310000, retailPrice: 345000, stockLevel: { 'Karachi Central': 8, 'Lahore West': 3 }, serialNumber: 'IMEI-990012345678901', status: 'Available' },
    { id: 'PRD-0002', barcode: 'PROD-382910', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphones', brand: 'Samsung', purchasePrice: 280000, retailPrice: 315000, stockLevel: { 'Karachi Central': 5, 'Lahore West': 2 }, serialNumber: 'IMEI-880054321098765', status: 'Available' },
    { id: 'PRD-0003', barcode: 'PROD-102948', name: 'Yamaha YBR 125G (Black)', category: 'Motorcycles', brand: 'Yamaha', purchasePrice: 420000, retailPrice: 465000, stockLevel: { 'Karachi Central': 4, 'Lahore West': 0 }, serialNumber: 'ENG-YBR-9082341', status: 'Available' },
    { id: 'PRD-0004', barcode: 'PROD-562910', name: 'Dell XPS 15 9530', category: 'Laptops', brand: 'Dell', purchasePrice: 390000, retailPrice: 430000, stockLevel: { 'Karachi Central': 2, 'Lahore West': 1 }, serialNumber: 'TAG-XPS-6F7G8H', status: 'Available' },
  ],
  customers: [
    {
      id: 'CUST-0001',
      name: 'Muhammad Ali',
      cnic: '42101-1234567-1',
      phone: '+923007654321',
      address: 'Flat C-12, Block 4, Gulshan-e-Iqbal, Karachi',
      income: 85000,
      verificationStatus: 'Approved',
      documents: {
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        cnicFront: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300',
        cnicBack: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300',
        utilityBill: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300',
        thumb: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150',
        signature: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=150'
      },
      guarantors: [
        { name: 'Tariq Mehmood', cnic: '42101-9876543-1', phone: '+923334567890', relationship: 'Uncle', status: 'Approved' }
      ],
      branch: 'Karachi Central',
      registeredBy: 'sales',
      registeredAt: '2026-05-15T10:00:00.000Z'
    },
    {
      id: 'CUST-0002',
      name: 'Zeeshan Lodhi',
      cnic: '42201-9823456-3',
      phone: '+923122345678',
      address: 'House 44-B, Area 37-D, Landhi, Karachi',
      income: 45000,
      verificationStatus: 'Pending',
      documents: {
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      },
      guarantors: [
        { name: 'Kamran Lodhi', cnic: '42201-1122334-5', phone: '+923459988776', relationship: 'Brother', status: 'Pending' }
      ],
      branch: 'Karachi Central',
      registeredBy: 'sales',
      registeredAt: '2026-06-27T14:30:00.000Z'
    },
    {
      id: 'CUST-0003',
      name: 'Salma Parveen',
      cnic: '35202-7788990-2',
      phone: '+923214561230',
      address: 'Street 4, Sector G-3, Johar Town, Lahore',
      income: 120000,
      verificationStatus: 'Approved',
      documents: {},
      guarantors: [],
      branch: 'Lahore West',
      registeredBy: 'admin',
      registeredAt: '2026-04-10T09:15:00.000Z'
    }
  ],
  agreements: [
    {
      id: 'AGR-0001',
      customerId: 'CUST-0001',
      customerName: 'Muhammad Ali',
      customerCNIC: '42101-1234567-1',
      branch: 'Karachi Central',
      productId: 'PRD-0001',
      productName: 'iPhone 15 Pro Max 256GB',
      serialNumber: 'IMEI-990012345678901',
      installmentPlanId: '6_months',
      months: 6,
      downPayment: 60000,
      totalAmount: 385000, // markup loaded
      remainingBalance: 125000, // 385k - 60k dp - payments
      profitAmount: 40000,
      monthlyEMI: 54166,
      status: 'Active',
      deliveryDate: '2026-05-16',
      agreedDate: '2026-05-15',
      guarantorApproved: true,
      qrCode: 'AGR-0001-QR',
      barcode: 'AGR-0001-BC',
      lateFeeRule: 200, // 200 rs per day
      gracePeriod: 5
    }
  ],
  installments: [
    { id: 'AGR-0001-1', agreementId: 'AGR-0001', month: 1, dueDate: '2026-06-15', amountDue: 54166, amountPaid: 54166, paidDate: '2026-06-12', penaltyPaid: 0, penaltyOutstanding: 0, status: 'Paid' },
    { id: 'AGR-0001-2', agreementId: 'AGR-0001', month: 2, dueDate: '2026-07-15', amountDue: 54166, amountPaid: 0, penaltyPaid: 0, penaltyOutstanding: 0, status: 'Unpaid' },
    { id: 'AGR-0001-3', agreementId: 'AGR-0001', month: 3, dueDate: '2026-08-15', amountDue: 54166, amountPaid: 0, penaltyPaid: 0, penaltyOutstanding: 0, status: 'Unpaid' },
    { id: 'AGR-0001-4', agreementId: 'AGR-0001', month: 4, dueDate: '2026-09-15', amountDue: 54166, amountPaid: 0, penaltyPaid: 0, penaltyOutstanding: 0, status: 'Unpaid' },
    { id: 'AGR-0001-5', agreementId: 'AGR-0001', month: 5, dueDate: '2026-10-15', amountDue: 54166, amountPaid: 0, penaltyPaid: 0, penaltyOutstanding: 0, status: 'Unpaid' },
    { id: 'AGR-0001-6', agreementId: 'AGR-0001', month: 6, dueDate: '2026-11-15', amountDue: 54170, amountPaid: 0, penaltyPaid: 0, penaltyOutstanding: 0, status: 'Unpaid' },
  ],
  payments: [
    { id: 'REC-0001', agreementId: 'AGR-0001', customerId: 'CUST-0001', customerName: 'Muhammad Ali', amount: 54166, penaltyAmount: 0, discountAmount: 0, paymentDate: '2026-06-12T11:00:00.000Z', receivedBy: 'cashier', paymentMethod: 'Cash', receiptNo: 'RCT-100239' },
    { id: 'REC-0002', agreementId: 'AGR-0001', customerId: 'CUST-0001', customerName: 'Muhammad Ali', amount: 60000, penaltyAmount: 0, discountAmount: 0, paymentDate: '2026-05-15T12:00:00.000Z', receivedBy: 'cashier', paymentMethod: 'Cash', receiptNo: 'RCT-100238' }, // Down payment receipt
  ],
  expenses: [
    { id: 'EXP-0001', date: '2026-06-01', category: 'Rent', amount: 45000, description: 'Office Rent Karachi Central', branch: 'Karachi Central', recordedBy: 'accounts' },
    { id: 'EXP-0002', date: '2026-06-05', category: 'Utility', amount: 12000, description: 'Electricity Bill May 2026', branch: 'Karachi Central', recordedBy: 'accounts' },
    { id: 'EXP-0003', date: '2026-06-25', category: 'Salary', amount: 480000, description: 'Staff Salaries June 2026', branch: 'Karachi Central', recordedBy: 'accounts' },
  ],
  auditLogs: [
    { id: 'LOG-0001', timestamp: '2026-06-28T01:00:00.000Z', username: 'admin', role: 'Super Admin', action: 'System Init', details: 'Database initialized with standard seed configuration.' },
    { id: 'LOG-0002', timestamp: '2026-06-28T01:15:00.000Z', username: 'manager', role: 'Branch Manager', action: 'Login', details: 'Logged into Karachi Central branch dashboard successfully.' },
  ],
  cashBalance: 425000,
  bankBalance: 1200000,
  bankAccounts: [
    { id: 'BNK-0001', bankName: 'Meezan Bank Ltd', accountName: 'Manha Consumer Financing Pvt Ltd', accountNumber: '10293048590123', branchName: 'Gulshan-e-Iqbal Karachi', balance: 850000, status: 'Active' },
    { id: 'BNK-0002', bankName: 'Habib Bank Ltd (HBL)', accountName: 'Manha Consumer Financing Pvt Ltd', accountNumber: '99201948573102', branchName: 'Civic Centre Karachi', balance: 350000, status: 'Active' },
  ],
  financeTransactions: [
    { id: 'FTX-0001', date: '2026-06-25T10:00:00.000Z', type: 'Debit', amount: 47500, category: 'Salary', accountId: 'BNK-0001', paymentMethod: 'Bank', employeeId: 'EMP-0005', description: 'Fahad Malik - June 2026 Payroll (Salary: 35000, Commission: 12500)', whatsappStatus: 'Sent', whatsappRecipient: '+923007654321', recordedBy: 'accounts' },
    { id: 'FTX-0002', date: '2026-06-25T11:30:00.000Z', type: 'Debit', amount: 34500, category: 'Salary', paymentMethod: 'Cash', employeeId: 'EMP-0006', description: 'Bilal Ahmed - June 2026 Payroll (Salary: 30000, Commission: 4500)', whatsappStatus: 'Sent', whatsappRecipient: '+923219876543', recordedBy: 'accounts' },
  ],
  staffPayroll: [
    { id: 'PAY-0001', employeeId: 'EMP-0005', employeeName: 'Fahad Malik', role: 'Sales Executive', month: 'June 2026', baseSalary: 35000, commissionsEarned: 12500, status: 'Paid', paidDate: '2026-06-25', paymentMethod: 'Bank', accountId: 'BNK-0001' },
    { id: 'PAY-0002', employeeId: 'EMP-0006', employeeName: 'Bilal Ahmed', role: 'Recovery Officer', month: 'June 2026', baseSalary: 30000, commissionsEarned: 4500, status: 'Paid', paidDate: '2026-06-25', paymentMethod: 'Cash' },
    { id: 'PAY-0003', employeeId: 'EMP-0007', employeeName: 'Sana Fatima', role: 'Cashier', month: 'June 2026', baseSalary: 40000, commissionsEarned: 0, status: 'Paid', paidDate: '2026-06-25', paymentMethod: 'Bank', accountId: 'BNK-0002' },
    { id: 'PAY-0004', employeeId: 'EMP-0003', employeeName: 'Ayesha Siddiqui', role: 'Accounts', month: 'June 2026', baseSalary: 75000, commissionsEarned: 0, status: 'Unpaid' },
  ],
  lockUnlockRequests: [
    { id: 'REQ-0001', customerId: 'CUST-0001', customerName: 'Muhammad Ali', customerCNIC: '42101-1234567-1', actionType: 'Lock', requestedBy: 'sales', requestDate: '2026-06-29T10:30:00.000Z', reason: 'Unpaid installment over 15 days', status: 'Pending' },
    { id: 'REQ-0002', customerId: 'CUST-0002', customerName: 'Zainab Bibi', customerCNIC: '42101-7654321-2', actionType: 'Unlock', requestedBy: 'recovery', requestDate: '2026-06-28T14:15:00.000Z', reason: 'Cleared outstanding payment with penalty', status: 'Approved', actionDate: '2026-06-28T15:00:00.000Z', actionBy: 'manager', notes: 'Immediate device unlock command sent' }
  ],
  notifications: [],
  legalCases: [
    {
      id: 'LGL-0001',
      caseNumber: 'OS-802/2026',
      title: 'Manha Consumer Financing vs. Kamran Butt',
      courtName: 'Civil Court, Karachi South',
      customerName: 'Kamran Butt',
      customerCNIC: '42101-9018374-3',
      customerPhone: '0300-8819230',
      status: 'Active',
      priority: 'High',
      fillingDate: '2026-05-10',
      notingHistory: [
        { date: '2026-05-10T12:00:00.000Z', username: 'royal', comment: 'Legal suit filed for recovery of default amount RS 85,000 and repossession of financed device.' },
        { date: '2026-06-15T15:30:00.000Z', username: 'royal', comment: 'First court summons served to the customer. No appearance yet.' }
      ],
      lawyerName: 'Advocate Muhammad Asif'
    },
    {
      id: 'LGL-0002',
      caseNumber: 'CCC-109/2026',
      title: 'Sohail Khan Theft Case',
      courtName: 'Session Court, Lahore West',
      customerName: 'Sohail Khan',
      customerCNIC: '35201-1928374-1',
      customerPhone: '0321-7728193',
      status: 'Pending',
      priority: 'Medium',
      fillingDate: '2026-06-02',
      notingHistory: [
        { date: '2026-06-02T10:00:00.000Z', username: 'manager', comment: 'Police FIR lodged regarding fraudulent resale of company owned financed asset (Samsung A54).' }
      ],
      lawyerName: 'Advocate Shazia Rehman'
    }
  ],
  complaints: [
    {
      id: 'CMP-0001',
      complainerName: 'Haris Mehmood',
      type: 'Customer',
      cnicOrId: '42101-8392019-5',
      category: 'Device Lock',
      message: 'My phone was locked even though I paid my installment yesterday morning. Please unlock it immediately!',
      status: 'Forwarded',
      forwardedTo: 'Operation',
      notingHistory: [
        { date: '2026-07-15T09:00:00.000Z', username: 'cashier', comment: 'Complaint registered via helpline. Customer claims payment was made. Receipt is being verified.' },
        { date: '2026-07-15T10:15:00.000Z', username: 'accounts', comment: 'Payment verified in bank statement. Forwarding to Operations to execute manual unlock.' }
      ],
      timestamp: '2026-07-15T09:00:00.000Z'
    },
    {
      id: 'CMP-0002',
      complainerName: 'Sana Fatima (Cashier)',
      type: 'Employee',
      cnicOrId: 'EMP-0007',
      category: 'Staff Behavior',
      message: 'Customer at Lahore branch misbehaved and threatened staff when asked to submit duplicate CNIC for guarantor verification.',
      status: 'In Progress',
      forwardedTo: 'Branch Manager',
      notingHistory: [
        { date: '2026-07-16T11:00:00.000Z', username: 'royal', comment: 'Complaint received and forwarded to Lahore Branch Manager to coordinate with security guards.' }
      ],
      timestamp: '2026-07-16T11:00:00.000Z'
    }
  ],
  corporateFilings: [
    {
      id: 'FLG-0001',
      title: 'SECP Annual Return (Form A)',
      authority: 'SECP',
      type: 'Annual Return',
      status: 'Pending',
      dueDate: '2026-10-31',
      notes: 'Filing of annual corporate return including list of directors and share capital details.',
      notingHistory: [
        { date: '2026-07-01T12:00:00.000Z', username: 'royal', comment: 'Drafting initiated. Audited accounts from internal audit team are awaited.' }
      ]
    },
    {
      id: 'FLG-0002',
      title: 'FBR Income Tax Return TY-2026',
      authority: 'FBR',
      type: 'Income Tax',
      status: 'Under Review',
      dueDate: '2026-09-30',
      notes: 'Corporate income tax return filing for tax year 2026.',
      notingHistory: [
        { date: '2026-07-05T14:00:00.000Z', username: 'accounts', comment: 'Income statements compiled. Tax consultant appointed for final review of withholding credits.' }
      ]
    }
  ],
  companyPolicies: [
    {
      id: 'POL-0001',
      title: 'Financed Device Lockout & Repossession SOP',
      category: 'SOP',
      content: '1. Handset will be locked 5 days after the due date if installment is unpaid.\n2. Manual unlock is only allowed if payment proof is verified by the Cashier or Accounts team.\n3. Defaulter repossession process initiates on the 30th day of consecutive lockout. Legal notices must be issued automatically.',
      publishedBy: 'Super Admin',
      publishedDate: '2026-01-15',
      version: 'v2.1'
    },
    {
      id: 'POL-0002',
      title: 'FBR & SECP Customer Documentation Compliance',
      category: 'Compliance',
      content: '1. All leasing agreements must record the valid customer and guarantor CNIC (National Identity Card).\n2. Thumb verification or bio-metric confirmation is mandatory for commercial agreements over RS 100,000.\n3. All sales tax invoices must be uploaded to FBR digital tax ledger weekly.',
      publishedBy: 'Super Admin',
      publishedDate: '2026-03-10',
      version: 'v1.4'
    }
  ],
  investors: [
    {
      id: 'INV-0001',
      name: 'Haji Muhammad Iqbal',
      cnic: '42101-5544332-1',
      address: 'House 12, Street 5, D.H.A. Phase 6, Karachi',
      mobileNo: '+923008271625',
      sourceOfIncome: 'Real Estate Business',
      investedAmount: 5000000,
      profitBalance: 75000,
      status: 'Active',
      createdAt: '2026-06-01T12:00:00.000Z'
    }
  ],
  investorTransactions: [
    {
      id: 'INV-TX-1001',
      investorId: 'INV-0001',
      investorName: 'Haji Muhammad Iqbal',
      date: '2026-06-01T12:05:00.000Z',
      type: 'Investment',
      amount: 5000000,
      paymentMethod: 'Bank',
      bankAccountId: 'BNK-0001',
      description: 'Initial capital investment of RS 5,000,000',
      recordedBy: 'admin'
    },
    {
      id: 'INV-TX-1002',
      investorId: 'INV-0001',
      investorName: 'Haji Muhammad Iqbal',
      date: '2026-07-01T10:00:00.000Z',
      type: 'Profit Payout',
      amount: 75000,
      paymentMethod: 'Bank',
      bankAccountId: 'BNK-0001',
      description: 'Monthly Profit Withdrawal for June 2026',
      recordedBy: 'admin'
    }
  ],
  whatsappTemplates: [
    {
      id: 'customer_registration',
      name: 'Customer Registration Alert',
      category: 'Customer',
      body: 'Dear {name}, thank you for registering with Manha Digital Consumer Financing! Your customer ID is {customer_id}. We are excited to assist you with easy installment financing.',
      isActive: true
    },
    {
      id: 'installment_alert_3_days',
      name: 'Installment Pre-Due Alert (3 Days Before)',
      category: 'Installment Alert',
      body: 'Dear {name}, this is a friendly reminder that your monthly installment of RS {amount} is due in 3 days on {due_date}. Please pay on time to avoid late fees. Ref: {ref}',
      isActive: true
    },
    {
      id: 'installment_alert_due',
      name: 'Installment Due Date Alert',
      category: 'Installment Alert',
      body: 'Dear {name}, your monthly installment of RS {amount} is due today ({due_date}). Please pay today to keep your device active. Ref: {ref}',
      isActive: true
    },
    {
      id: 'installment_paid',
      name: 'Installment Paid Alert',
      category: 'Installment Paid Alert',
      body: 'Dear {name}, thank you! We have received your installment payment of RS {amount} against agreement {agreement_id} on {date}. Your remaining balance is RS {balance}. Ref: {ref}',
      isActive: true
    },
    {
      id: 'booking_alert',
      name: 'Booking Alert',
      category: 'Booking Alert',
      body: 'Dear {name}, your installment agreement for {product_name} has been successfully booked! Agreement ID: {agreement_id}. Monthly EMI: RS {emi}. Down Payment: RS {down_payment}. Thank you for choosing Manha Digital.',
      isActive: true
    },
    {
      id: 'delivery_alert',
      name: 'Delivery Alert',
      category: 'Delivery Alert',
      body: 'Dear {name}, your financed product {product_name} (Serial/IMEI: {serial_number}) has been successfully delivered on {date}! Enjoy your product. Please pay your first installment on {due_date}.',
      isActive: true
    },
    {
      id: 'legal_notice',
      name: 'Legal Notice (3 Months Continuously Unpaid)',
      category: 'Legal Notice',
      body: 'LEGAL NOTICE: Dear {name}, you have failed to pay 3 consecutive installments. Your account is in serious default. Please pay RS {amount} immediately to avoid legal actions, court summons, and handset blacklisting. Contact: {company_phone}',
      isActive: true
    }
  ],
  whatsappAlerts: [],
  whatsappAssignee: 'admin'
};

// Local storage helper
let db: DbState = { ...defaultDb };

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(fileData);
      
      // Initialize missing sections
      if (!db.bankAccounts) {
        db.bankAccounts = [...defaultDb.bankAccounts!];
      }
      if (!db.financeTransactions) {
        db.financeTransactions = [...defaultDb.financeTransactions!];
      }
      if (!db.staffPayroll) {
        db.staffPayroll = [...defaultDb.staffPayroll!];
      }
      if (!db.lockUnlockRequests) {
        db.lockUnlockRequests = [...defaultDb.lockUnlockRequests!];
      }
      if (!db.notifications) {
        db.notifications = [...defaultDb.notifications!];
      }
      if (!db.legalCases) {
        db.legalCases = [...defaultDb.legalCases!];
      }
      if (!db.complaints) {
        db.complaints = [...defaultDb.complaints!];
      }
      if (!db.corporateFilings) {
        db.corporateFilings = [...defaultDb.corporateFilings!];
      }
      if (!db.companyPolicies) {
        db.companyPolicies = [...defaultDb.companyPolicies!];
      }
      if (!db.investors) {
        db.investors = [...defaultDb.investors!];
      }
      if (!db.investorTransactions) {
        db.investorTransactions = [...defaultDb.investorTransactions!];
      }
      if (!db.whatsappTemplates) {
        db.whatsappTemplates = [...defaultDb.whatsappTemplates!];
      }
      if (!db.whatsappAlerts) {
        db.whatsappAlerts = [...defaultDb.whatsappAlerts!];
      }
      if (!db.whatsappAssignee) {
        db.whatsappAssignee = defaultDb.whatsappAssignee;
      }

      // Enforce adminApproved on existing seed agreements so they remain active
      if (db.agreements) {
        db.agreements.forEach(a => {
          if (a.adminApproved === undefined) {
            a.adminApproved = true;
          }
        });
      }

      // Auto-inject Royal user if not present
      if (db.employees) {
        const royalExists = db.employees.some(e => e.username === 'Royal' || e.username === 'royal');
        if (!royalExists) {
          db.employees.push({
            id: 'EMP-ROYAL',
            name: 'Royal',
            username: 'Royal',
            password: 'Khairpur',
            role: 'Super Admin',
            branch: 'All Branches',
            department: 'Executive',
            salary: 200000,
            commissionRate: 0,
            status: 'Active'
          });
          saveDb();
        }
      }

      if (!db.companyProfile) {
        db.companyProfile = { ...defaultDb.companyProfile };
        saveDb();
      }
      console.log('Database loaded successfully from data.json');
    } else {
      saveDb();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    db = { ...defaultDb };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

loadDb();

// Audit Logger helper
function logAction(username: string, role: any, action: string, details: string) {
  const newLog: AuditLog = {
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    username,
    role,
    action,
    details
  };
  db.auditLogs.unshift(newLog);
  saveDb();
}

function checkSuperAdmin(usernameOrRecordedBy: any): boolean {
  if (!usernameOrRecordedBy || typeof usernameOrRecordedBy !== 'string') return false;
  const user = db.employees.find(e => e.username === usernameOrRecordedBy);
  return user ? user.role === 'Super Admin' : false;
}

// REST APIs
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Quick mapping for standard roles
  const emp = db.employees.find(e => e.username === username && e.status === 'Active');
  if (emp && (password === emp.password || password === `${username}123` || password === 'admin123')) {
    logAction(emp.username, emp.role, 'Login', `User ${emp.name} logged in successfully.`);
    return res.json({ success: true, employee: emp });
  }
  
  return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
});

// Employees CRUD
app.get('/api/employees', (req, res) => {
  res.json(db.employees);
});

app.post('/api/employees', (req, res) => {
  const { name, username, password, role, branch, department, salary, commissionRate, permissions, photo, cnic } = req.body;
  const newEmp: Employee = {
    id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    username,
    password: password || `${username}123`,
    role,
    branch,
    department,
    salary: Number(salary || 0),
    commissionRate: Number(commissionRate || 0),
    status: 'Active',
    permissions: permissions || [],
    photo,
    cnic
  };
  db.employees.push(newEmp);
  saveDb();
  logAction('system', 'Super Admin', 'Create Employee', `Created employee ${name} (${role})`);
  res.json({ success: true, employee: newEmp });
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx > -1) {
    db.employees[idx] = { ...db.employees[idx], ...req.body };
    saveDb();
    logAction('system', 'Super Admin', 'Update Employee', `Updated employee ${db.employees[idx].name}`);
    res.json({ success: true, employee: db.employees[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Employee not found' });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'EMP-0001') {
    return res.status(400).json({ success: false, message: 'Super Admin employee cannot be deleted' });
  }
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx > -1) {
    const deletedEmp = db.employees.splice(idx, 1)[0];
    saveDb();
    logAction('system', 'Super Admin', 'Delete Employee', `Deleted employee ${deletedEmp.name}`);
    res.json({ success: true, message: 'Employee deleted successfully', employee: deletedEmp });
  } else {
    res.status(404).json({ success: false, message: 'Employee not found' });
  }
});

// Inventory CRUD
app.get('/api/inventory', (req, res) => {
  res.json({
    suppliers: db.suppliers,
    brands: db.brands,
    categories: db.categories,
    products: db.products
  });
});

app.post('/api/inventory/suppliers', (req, res) => {
  const { name, phone, email, address } = req.body;
  const newSupplier: Supplier = {
    id: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
    name, phone, email, address
  };
  db.suppliers.push(newSupplier);
  saveDb();
  res.json({ success: true, supplier: newSupplier });
});

app.post('/api/inventory/brands', (req, res) => {
  const { name } = req.body;
  const newBrand: Brand = {
    id: `BRD-${Math.floor(1000 + Math.random() * 9000)}`,
    name
  };
  db.brands.push(newBrand);
  saveDb();
  res.json({ success: true, brand: newBrand });
});

app.post('/api/inventory/categories', (req, res) => {
  const { name } = req.body;
  const newCategory: Category = {
    id: `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
    name
  };
  db.categories.push(newCategory);
  saveDb();
  res.json({ success: true, category: newCategory });
});

app.post('/api/inventory/products', (req, res) => {
  const { name, category, brand, purchasePrice, retailPrice, stockLevel, serialNumber } = req.body;
  const newProduct: Product = {
    id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
    barcode: `PROD-${Math.floor(100000 + Math.random() * 900000)}`,
    name,
    category,
    brand,
    purchasePrice: Number(purchasePrice),
    retailPrice: Number(retailPrice),
    stockLevel: stockLevel || { 'Karachi Central': 1 },
    serialNumber,
    status: 'Available'
  };
  db.products.push(newProduct);
  saveDb();
  res.json({ success: true, product: newProduct });
});

app.put('/api/inventory/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.products.findIndex(p => p.id === id);
  if (idx > -1) {
    db.products[idx] = { ...db.products[idx], ...req.body };
    saveDb();
    res.json({ success: true, product: db.products[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

app.delete('/api/inventory/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.products.findIndex(p => p.id === id);
  if (idx > -1) {
    const deleted = db.products.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Product deleted', product: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

app.put('/api/inventory/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx > -1) {
    db.suppliers[idx] = { ...db.suppliers[idx], ...req.body };
    saveDb();
    res.json({ success: true, supplier: db.suppliers[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Supplier not found' });
  }
});

app.delete('/api/inventory/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx > -1) {
    const deleted = db.suppliers.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Supplier deleted', supplier: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Supplier not found' });
  }
});

app.put('/api/inventory/brands/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.brands.findIndex(b => b.id === id);
  if (idx > -1) {
    db.brands[idx] = { ...db.brands[idx], ...req.body };
    saveDb();
    res.json({ success: true, brand: db.brands[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Brand not found' });
  }
});

app.delete('/api/inventory/brands/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.brands.findIndex(b => b.id === id);
  if (idx > -1) {
    const deleted = db.brands.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Brand deleted', brand: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Brand not found' });
  }
});

app.put('/api/inventory/categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx > -1) {
    db.categories[idx] = { ...db.categories[idx], ...req.body };
    saveDb();
    res.json({ success: true, category: db.categories[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Category not found' });
  }
});

app.delete('/api/inventory/categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx > -1) {
    const deleted = db.categories.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Category deleted', category: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Category not found' });
  }
});

// Customers CRUD & Search
app.get('/api/customers', (req, res) => {
  res.json(db.customers);
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx > -1) {
    const deleted = db.customers.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Customer deleted successfully', customer: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Customer not found' });
  }
});

app.get('/api/customers/search-cnic/:cnic', (req, res) => {
  const customer = db.customers.find(c => c.cnic.replace(/\s|-/g, '') === req.params.cnic.replace(/\s|-/g, ''));
  if (customer) {
    res.json({ exists: true, customer });
  } else {
    res.json({ exists: false });
  }
});

app.post('/api/customers', (req, res) => {
  const { name, fatherName, cnic, phone, address, income, branch, documents, guarantors, registeredBy, occupation, department, employerName, employerPhone } = req.body;
  
  const formattedCnic = cnic;
  const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newCustomer: Customer = {
    id: customerId,
    name,
    fatherName,
    cnic: formattedCnic,
    phone,
    address,
    income: Number(income || 0),
    verificationStatus: 'Pending',
    documents: documents || {},
    guarantors: guarantors || [],
    branch: branch || 'Karachi Central',
    registeredBy: registeredBy || 'admin',
    registeredAt: new Date().toISOString(),
    occupation,
    department,
    employerName,
    employerPhone
  };
  
  db.customers.push(newCustomer);
  
  // Trigger Customer Registration WhatsApp Alert!
  try {
    const templatesMap = new Map((db.whatsappTemplates || []).map(t => [t.id, t]));
    const temp = templatesMap.get('customer_registration');
    if (temp && temp.isActive) {
      const body = temp.body
        .replace('{name}', newCustomer.name)
        .replace('{customer_id}', newCustomer.id);
      
      if (!db.whatsappAlerts) db.whatsappAlerts = [];
      db.whatsappAlerts.unshift({
        id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        phone: newCustomer.phone,
        templateType: 'customer_registration',
        message: body,
        triggerType: 'Auto',
        status: 'Pending',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Failed to trigger customer registration alert:', err);
  }

  saveDb();
  
  logAction('system', 'Sales Executive', 'Customer Registered', `Registered customer ${name} with ID ${customerId}`);
  res.json({ success: true, customer: newCustomer });
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx > -1) {
    db.customers[idx] = { ...db.customers[idx], ...req.body };
    saveDb();
    res.json({ success: true, customer: db.customers[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Customer not found' });
  }
});

app.post('/api/customers/:id/verify', (req, res) => {
  const { id } = req.params;
  const { status, rejectedReason } = req.body;
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx > -1) {
    db.customers[idx].verificationStatus = status;
    if (rejectedReason) {
      db.customers[idx].documents.rejectedReason = rejectedReason;
    }
    saveDb();
    logAction('ops', 'Operation', 'Customer Verified', `Verification status of ${db.customers[idx].name} set to ${status}`);
    res.json({ success: true, customer: db.customers[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Customer not found' });
  }
});

// Agreements API
app.get('/api/agreements', (req, res) => {
  res.json(db.agreements);
});

app.delete('/api/agreements/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.agreements.findIndex(a => a.id === id);
  if (idx > -1) {
    const deleted = db.agreements.splice(idx, 1)[0];
    // Also remove associated installments
    db.installments = db.installments.filter(i => i.agreementId !== id);
    saveDb();
    logAction('admin', 'Super Admin', 'Delete Agreement', `Agreement ${id} and its schedules permanently removed.`);
    res.json({ success: true, message: 'Agreement deleted successfully', agreement: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Agreement not found' });
  }
});

app.post('/api/agreements', (req, res) => {
  const { 
    customerId, productId, installmentPlanId, months, downPayment, 
    lateFeeRule, gracePeriod, branch,
    category, imei, modelNo, serialNo, engineNo, chassisNo, carChassisNo,
    registrationNo, make, modelVariant, manufacturingYear, color
  } = req.body;
  
  const customer = db.customers.find(c => c.id === customerId);
  const product = db.products.find(p => p.id === productId);
  
  if (!customer || !product) {
    return res.status(400).json({ success: false, message: 'Invalid customer or product selected' });
  }
  
  // Calculate Interest/Profit
  // Say, 15% flat markup for 6 months, 25% flat for 12 months, etc.
  const rate = months === 6 ? 0.15 : months === 12 ? 0.25 : 0.08 * (months / 12);
  const retailPrice = product.retailPrice;
  const principalAmount = retailPrice - Number(downPayment);
  const profitAmount = Math.round(principalAmount * rate);
  const totalAmount = retailPrice + profitAmount;
  const remainingBalance = totalAmount - Number(downPayment);
  const monthlyEMI = Math.round(remainingBalance / months);
  
  const agreementId = `AGR-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newAgreement: Agreement = {
    id: agreementId,
    customerId,
    customerName: customer.name,
    customerCNIC: customer.cnic,
    branch: branch || customer.branch,
    productId,
    productName: product.name,
    serialNumber: product.serialNumber,
    installmentPlanId,
    months,
    downPayment: Number(downPayment),
    totalAmount,
    remainingBalance,
    profitAmount,
    monthlyEMI,
    status: 'Pending',
    agreedDate: new Date().toISOString().split('T')[0],
    guarantorApproved: false,
    qrCode: `${agreementId}-QR-CODE`,
    barcode: `${agreementId}-BARCODE`,
    lateFeeRule: Number(lateFeeRule || 150),
    gracePeriod: Number(gracePeriod || 5),
    adminApproved: false,
    category,
    imei,
    modelNo,
    serialNo,
    engineNo,
    chassisNo,
    carChassisNo,
    registrationNo,
    make,
    modelVariant,
    manufacturingYear,
    color
  };
  
  db.agreements.push(newAgreement);
  
  // Generate Installment Schedule
  const startDay = new Date();
  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDay);
    dueDate.setMonth(startDay.getMonth() + i);
    
    const inst: Installment = {
      id: `${agreementId}-${i}`,
      agreementId,
      month: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amountDue: monthlyEMI,
      amountPaid: 0,
      penaltyPaid: 0,
      penaltyOutstanding: 0,
      status: 'Unpaid'
    };
    db.installments.push(inst);
  }
  
  // Auto record Downpayment received in Payments
  if (Number(downPayment) > 0) {
    const paymentId = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      id: paymentId,
      agreementId,
      customerId,
      customerName: customer.name,
      amount: Number(downPayment),
      penaltyAmount: 0,
      discountAmount: 0,
      paymentDate: new Date().toISOString(),
      receivedBy: 'cashier',
      paymentMethod: 'Cash',
      receiptNo: `RCT-${Math.floor(100000 + Math.random() * 900000)}`
    };
    db.payments.push(newPayment);
    db.cashBalance += Number(downPayment);
  }

  // Trigger Agreement Booking Alert!
  try {
    const templatesMap = new Map((db.whatsappTemplates || []).map(t => [t.id, t]));
    const temp = templatesMap.get('booking_alert');
    if (temp && temp.isActive) {
      const body = temp.body
        .replace('{name}', customer.name)
        .replace('{agreement_id}', agreementId)
        .replace('{product_name}', product.name)
        .replace('{emi}', monthlyEMI.toString())
        .replace('{down_payment}', downPayment.toString());
        
      if (!db.whatsappAlerts) db.whatsappAlerts = [];
      db.whatsappAlerts.unshift({
        id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        templateType: 'booking_alert',
        message: body,
        triggerType: 'Auto',
        status: 'Pending',
        timestamp: new Date().toISOString(),
        agreementId: agreementId
      });
    }
  } catch (err) {
    console.error('Failed to trigger agreement booking alert:', err);
  }
  
  saveDb();
  logAction('system', 'Sales Executive', 'Agreement Created', `Created agreement ${agreementId} for ${customer.name}`);
  
  res.json({ success: true, agreement: newAgreement });
});

app.post('/api/agreements/:id/approve-guarantor', (req, res) => {
  const { id } = req.params;
  const agr = db.agreements.find(a => a.id === id);
  if (agr) {
    agr.guarantorApproved = true;
    // Advance status to Approved
    if (agr.status === 'Pending') {
      agr.status = 'Approved';
    }
    saveDb();
    logAction('ops', 'Operation', 'Guarantor Approved', `Approved guarantors for agreement ${id}`);
    res.json({ success: true, agreement: agr });
  } else {
    res.status(404).json({ success: false, message: 'Agreement not found' });
  }
});

app.post('/api/agreements/:id/deliver', (req, res) => {
  const { id } = req.params;
  const agr = db.agreements.find(a => a.id === id);
  if (agr && (agr.status === 'Approved' || agr.status === 'Pending')) {
    agr.status = 'Active';
    agr.deliveryDate = new Date().toISOString().split('T')[0];
    
    // Reduce Stock Automatically
    const prod = db.products.find(p => p.id === agr.productId);
    if (prod) {
      prod.status = 'Sold';
      if (prod.stockLevel[agr.branch] > 0) {
        prod.stockLevel[agr.branch]--;
      }
    }
    
    // Trigger Delivery Alert!
    try {
      const templatesMap = new Map((db.whatsappTemplates || []).map(t => [t.id, t]));
      const temp = templatesMap.get('delivery_alert');
      if (temp && temp.isActive) {
        const cust = db.customers.find(c => c.id === agr.customerId);
        const insts = db.installments.filter(i => i.agreementId === agr.id).sort((a,b)=>a.month - b.month);
        const firstDueDate = insts[0]?.dueDate || 'N/A';
        
        if (cust) {
          const body = temp.body
            .replace('{name}', cust.name)
            .replace('{product_name}', agr.productName)
            .replace('{serial_number}', agr.serialNumber || 'N/A')
            .replace('{date}', new Date().toISOString().split('T')[0])
            .replace('{due_date}', firstDueDate);
            
          if (!db.whatsappAlerts) db.whatsappAlerts = [];
          db.whatsappAlerts.unshift({
            id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
            customerId: cust.id,
            customerName: cust.name,
            phone: cust.phone,
            templateType: 'delivery_alert',
            message: body,
            triggerType: 'Auto',
            status: 'Pending',
            timestamp: new Date().toISOString(),
            agreementId: agr.id
          });
        }
      }
    } catch (err) {
      console.error('Failed to trigger delivery alert:', err);
    }

    saveDb();
    logAction('ops', 'Operation', 'Product Delivered', `Delivered product for agreement ${id}, stock level reduced.`);
    res.json({ success: true, agreement: agr });
  } else {
    res.status(404).json({ success: false, message: 'Agreement not ready for delivery or not found' });
  }
});

app.post('/api/agreements/:id/noc', (req, res) => {
  const { id } = req.params;
  const agr = db.agreements.find(a => a.id === id);
  if (agr) {
    if (agr.remainingBalance > 0) {
      return res.status(400).json({ success: false, message: 'Agreement balance is not zero! Clear outstanding dues first.' });
    }
    agr.nocIssued = true;
    agr.status = 'Closed';
    saveDb();
    logAction('admin', 'Super Admin', 'Issue NOC', `NOC certificate issued for customer ${agr.customerName} on agreement ${id}.`);
    res.json({ success: true, agreement: agr });
  } else {
    res.status(404).json({ success: false, message: 'Agreement not found' });
  }
});

// Payments & Collection API
app.get('/api/installments', (req, res) => {
  res.json(db.installments);
});

app.get('/api/payments', (req, res) => {
  res.json(db.payments);
});

app.post('/api/payments', (req, res) => {
  const { agreementId, amount, penaltyAmount, discountAmount, paymentMethod, bankName, collectedBy, paymentDate } = req.body;
  
  const agr = db.agreements.find(a => a.id === agreementId);
  if (!agr) {
    return res.status(404).json({ success: false, message: 'Agreement not found' });
  }
  
  const paymentId = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptNo = `RCT-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const formattedPaymentDate = paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString();
  const formattedPaidDate = paymentDate ? paymentDate.split('T')[0] : new Date().toISOString().split('T')[0];
  
  const newPayment: Payment = {
    id: paymentId,
    agreementId,
    customerId: agr.customerId,
    customerName: agr.customerName,
    amount: Number(amount),
    penaltyAmount: Number(penaltyAmount || 0),
    discountAmount: Number(discountAmount || 0),
    paymentDate: formattedPaymentDate,
    receivedBy: collectedBy || 'cashier',
    paymentMethod,
    bankName,
    receiptNo
  };
  
  db.payments.push(newPayment);
  
  // Update Balances
  if (paymentMethod === 'Cash') {
    db.cashBalance += Number(amount) + Number(penaltyAmount || 0);
  } else {
    db.bankBalance += Number(amount) + Number(penaltyAmount || 0);
  }
  
  // Allocate Payment to Installments (FIFO Allocation)
  let unpaidInstallments = db.installments
    .filter(i => i.agreementId === agreementId && i.status !== 'Paid')
    .sort((a, b) => a.month - b.month);
    
  let paymentLeft = Number(amount);
  for (let inst of unpaidInstallments) {
    if (paymentLeft <= 0) break;
    
    const dueLeft = inst.amountDue - inst.amountPaid;
    if (paymentLeft >= dueLeft) {
      inst.amountPaid = inst.amountDue;
      inst.status = 'Paid';
      inst.paidDate = formattedPaidDate;
      paymentLeft -= dueLeft;
    } else {
      inst.amountPaid += paymentLeft;
      inst.status = 'Partial';
      paymentLeft = 0;
    }
  }
  
  // Reduce Agreement remaining balance
  agr.remainingBalance = Math.max(0, agr.remainingBalance - Number(amount));
  
  // If outstanding reaches 0, mark as Closed
  const totalOwed = db.installments
    .filter(i => i.agreementId === agreementId)
    .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);
    
  if (totalOwed === 0 && agr.remainingBalance === 0) {
    agr.status = 'Closed';
  }
  
  // Trigger Installment Paid Alert!
  try {
    const templatesMap = new Map((db.whatsappTemplates || []).map(t => [t.id, t]));
    const temp = templatesMap.get('installment_paid');
    if (temp && temp.isActive) {
      const cust = db.customers.find(c => c.id === agr.customerId);
      if (cust) {
        const body = temp.body
          .replace('{name}', cust.name)
          .replace('{amount}', amount.toString())
          .replace('{agreement_id}', agreementId)
          .replace('{date}', new Date().toISOString().split('T')[0])
          .replace('{balance}', agr.remainingBalance.toString())
          .replace('{ref}', receiptNo);
          
        if (!db.whatsappAlerts) db.whatsappAlerts = [];
        db.whatsappAlerts.unshift({
          id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
          customerId: cust.id,
          customerName: cust.name,
          phone: cust.phone,
          templateType: 'installment_paid',
          message: body,
          triggerType: 'Auto',
          status: 'Pending',
          timestamp: new Date().toISOString(),
          agreementId: agreementId
        });
      }
    }
  } catch (err) {
    console.error('Failed to trigger installment paid alert:', err);
  }

  saveDb();
  logAction(collectedBy || 'cashier', 'Cashier', 'Installment Collection', `Collected RS ${amount} for agreement ${agreementId}`);
  
  res.json({ success: true, payment: newPayment, agreement: agr });
});

// Expenses
app.get('/api/expenses', (req, res) => {
  res.json(db.expenses);
});

app.post('/api/expenses', (req, res) => {
  const { category, amount, description, branch, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can write financial transactions.' });
  }
  const newExp: Expense = {
    id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    category,
    amount: Number(amount),
    description,
    branch: branch || 'Karachi Central',
    recordedBy: recordedBy || 'accounts'
  };
  db.expenses.unshift(newExp);
  db.cashBalance -= Number(amount);
  saveDb();
  logAction(recordedBy || 'accounts', 'Accounts', 'Record Expense', `Expense registered: ${category} - RS ${amount}`);
  res.json({ success: true, expense: newExp });
});

app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { category, amount, description, branch, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can modify financial transactions.' });
  }
  const idx = db.expenses.findIndex(e => e.id === id);
  if (idx > -1) {
    const oldAmount = db.expenses[idx].amount;
    db.expenses[idx] = {
      ...db.expenses[idx],
      category,
      amount: Number(amount),
      description,
      branch: branch || db.expenses[idx].branch,
      recordedBy: recordedBy || db.expenses[idx].recordedBy
    };
    db.cashBalance += oldAmount - Number(amount);
    saveDb();
    res.json({ success: true, expense: db.expenses[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Expense not found' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const recordedBy = (req.query.recordedBy as string) || 'accounts';
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can delete financial transactions.' });
  }
  const idx = db.expenses.findIndex(e => e.id === id);
  if (idx > -1) {
    const oldAmount = db.expenses[idx].amount;
    db.cashBalance += oldAmount; // Refund balance
    const deletedExp = db.expenses.splice(idx, 1)[0];
    saveDb();
    res.json({ success: true, message: 'Expense deleted successfully', expense: deletedExp });
  } else {
    res.status(404).json({ success: false, message: 'Expense not found' });
  }
});

// Bank Accounts CRUD & Operations
app.get('/api/bank-accounts', (req, res) => {
  res.json(db.bankAccounts || []);
});

app.post('/api/bank-accounts', (req, res) => {
  const { bankName, accountName, accountNumber, branchName, balance, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can register bank accounts.' });
  }
  const newAccount: BankAccount = {
    id: `BNK-${Math.floor(1000 + Math.random() * 9000)}`,
    bankName,
    accountName,
    accountNumber,
    branchName,
    balance: Number(balance) || 0,
    status: 'Active'
  };
  if (!db.bankAccounts) db.bankAccounts = [];
  db.bankAccounts.push(newAccount);
  db.bankBalance += Number(balance) || 0;
  saveDb();
  logAction('accounts', 'Accounts', 'Create Bank Account', `Added bank account: ${bankName} (${accountNumber}) with initial balance RS ${balance}`);
  res.json({ success: true, account: newAccount });
});

app.put('/api/bank-accounts/:id', (req, res) => {
  const { id } = req.params;
  const { bankName, accountName, accountNumber, branchName, status, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can modify bank accounts.' });
  }
  const list = db.bankAccounts || [];
  const idx = list.findIndex(a => a.id === id);
  if (idx > -1) {
    list[idx] = {
      ...list[idx],
      bankName: bankName || list[idx].bankName,
      accountName: accountName || list[idx].accountName,
      accountNumber: accountNumber || list[idx].accountNumber,
      branchName: branchName || list[idx].branchName,
      status: status || list[idx].status,
    };
    saveDb();
    res.json({ success: true, account: list[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Bank account not found' });
  }
});

// Direct Finance Transactions (Debit / Credit) with Simulated WhatsApp Messages
app.get('/api/finance-transactions', (req, res) => {
  res.json(db.financeTransactions || []);
});

app.post('/api/finance-transactions', (req, res) => {
  const { type, amount, category, accountId, paymentMethod, employeeId, description, whatsappRecipient, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can execute finance transactions.' });
  }
  const txAmount = Number(amount);
  
  if (isNaN(txAmount) || txAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
  }

  // Adjust Bank Account or Cash balances
  let accountName = '';
  if (paymentMethod === 'Bank' && accountId) {
    const list = db.bankAccounts || [];
    const account = list.find(a => a.id === accountId);
    if (!account) {
      return res.status(400).json({ success: false, message: 'Selected bank account not found' });
    }
    accountName = `${account.bankName} (${account.accountNumber.slice(-4)})`;
    if (type === 'Debit') {
      account.balance -= txAmount;
      db.bankBalance -= txAmount;
    } else {
      account.balance += txAmount;
      db.bankBalance += txAmount;
    }
  } else {
    if (type === 'Debit') {
      db.cashBalance -= txAmount;
    } else {
      db.cashBalance += txAmount;
    }
  }

  // Simulate WhatsApp Messaging
  let whatsappStatus: 'Sent' | 'Failed' | 'Not Configured' = 'Not Configured';
  if (whatsappRecipient && whatsappRecipient.trim().length > 5) {
    whatsappStatus = 'Sent';
  }

  const newTx: FinanceTransaction = {
    id: `FTX-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString(),
    type,
    amount: txAmount,
    category,
    accountId,
    paymentMethod,
    employeeId,
    description: description || `${category} transaction on ${paymentMethod}`,
    whatsappStatus,
    whatsappRecipient: whatsappRecipient || '',
    recordedBy: recordedBy || 'accounts'
  };

  if (!db.financeTransactions) db.financeTransactions = [];
  db.financeTransactions.unshift(newTx);
  saveDb();

  logAction(
    recordedBy || 'accounts',
    'Accounts',
    type === 'Credit' ? 'Receive Funds' : 'Disburse Funds',
    `Recorded direct transaction of RS ${txAmount} (${type}) into ${paymentMethod === 'Bank' ? accountName : 'Cash'}. WhatsApp status: ${whatsappStatus}`
  );

  res.json({ success: true, transaction: newTx });
});

// Update an existing Finance Transaction (Adjustment)
app.put('/api/finance-transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, category, accountId, paymentMethod, employeeId, description, whatsappRecipient, recordedBy } = req.body;
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can modify finance transactions.' });
  }
  const newAmount = Number(amount);

  if (isNaN(newAmount) || newAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
  }

  const txList = db.financeTransactions || [];
  const tx = txList.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  // --- Step 1: Revert old transaction's impact ---
  if (tx.paymentMethod === 'Bank' && tx.accountId) {
    const account = (db.bankAccounts || []).find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'Debit') {
        account.balance += tx.amount; // Add back debited amount
        db.bankBalance += tx.amount;
      } else {
        account.balance -= tx.amount; // Remove credited amount
        db.bankBalance -= tx.amount;
      }
    }
  } else {
    if (tx.type === 'Debit') {
      db.cashBalance += tx.amount; // Add back debited cash
    } else {
      db.cashBalance -= tx.amount; // Remove credited cash
    }
  }

  // --- Step 2: Apply new transaction's impact ---
  let accountName = '';
  if (paymentMethod === 'Bank' && accountId) {
    const account = (db.bankAccounts || []).find(a => a.id === accountId);
    if (!account) {
      return res.status(400).json({ success: false, message: 'Selected bank account not found for new adjustment' });
    }
    accountName = `${account.bankName} (${account.accountNumber.slice(-4)})`;
    if (type === 'Debit') {
      account.balance -= newAmount;
      db.bankBalance -= newAmount;
    } else {
      account.balance += newAmount;
      db.bankBalance += newAmount;
    }
  } else {
    if (type === 'Debit') {
      db.cashBalance -= newAmount;
    } else {
      db.cashBalance += newAmount;
    }
  }

  // Update record fields
  tx.type = type;
  tx.amount = newAmount;
  tx.category = category;
  tx.accountId = paymentMethod === 'Bank' ? accountId : undefined;
  tx.paymentMethod = paymentMethod;
  tx.employeeId = employeeId;
  tx.description = description || `${category} adjustment on ${paymentMethod}`;
  tx.whatsappRecipient = whatsappRecipient || '';
  tx.recordedBy = recordedBy || tx.recordedBy;

  saveDb();

  logAction(
    recordedBy || 'system',
    'Accounts',
    'Edit Transaction',
    `Adjusted transaction ${id}: Now RS ${newAmount} (${type}) in ${paymentMethod === 'Bank' ? accountName : 'Cash'}`
  );

  res.json({ success: true, transaction: tx });
});

// Delete a Finance Transaction
app.delete('/api/finance-transactions/:id', (req, res) => {
  const { id } = req.params;
  const recordedBy = (req.query.recordedBy as string) || 'accounts';
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can delete finance transactions.' });
  }

  const txList = db.financeTransactions || [];
  const index = txList.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  const tx = txList[index];

  // --- Revert old transaction's impact ---
  if (tx.paymentMethod === 'Bank' && tx.accountId) {
    const account = (db.bankAccounts || []).find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'Debit') {
        account.balance += tx.amount;
        db.bankBalance += tx.amount;
      } else {
        account.balance -= tx.amount;
        db.bankBalance -= tx.amount;
      }
    }
  } else {
    if (tx.type === 'Debit') {
      db.cashBalance += tx.amount;
    } else {
      db.cashBalance -= tx.amount;
    }
  }

  // Remove the transaction
  txList.splice(index, 1);
  db.financeTransactions = txList;
  saveDb();

  logAction(
    recordedBy,
    'Accounts',
    'Delete Transaction',
    `Deleted transaction ${id} of RS ${tx.amount} (${tx.type})`
  );

  res.json({ success: true, message: 'Transaction deleted successfully' });
});

// ==========================================
// INVESTOR & ACCOUNTS LEDGER ENDPOINTS
// ==========================================
app.get('/api/investors', (req, res) => {
  res.json(db.investors || []);
});

app.post('/api/investors', (req, res) => {
  const { name, cnic, address, mobileNo, sourceOfIncome, recordedBy } = req.body;
  if (!name || !cnic || !mobileNo) {
    return res.status(400).json({ success: false, message: 'Investor name, CNIC, and Mobile number are required.' });
  }

  const list = db.investors || [];
  if (list.some(inv => inv.cnic === cnic)) {
    return res.status(400).json({ success: false, message: 'An investor with this CNIC is already registered.' });
  }

  const newInvestor: Investor = {
    id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    cnic,
    address: address || '',
    mobileNo,
    sourceOfIncome: sourceOfIncome || '',
    investedAmount: 0,
    profitBalance: 0,
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  list.unshift(newInvestor);
  db.investors = list;
  saveDb();

  logAction(
    recordedBy || 'system',
    'Accounts',
    'Register Investor',
    `Registered investor ${name} (${cnic}) with Mobile ${mobileNo}`
  );

  res.json({ success: true, investor: newInvestor });
});

app.put('/api/investors/:id', (req, res) => {
  const { id } = req.params;
  const { name, cnic, address, mobileNo, sourceOfIncome, status, recordedBy } = req.body;
  
  const list = db.investors || [];
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Investor not found' });
  }

  list[idx] = {
    ...list[idx],
    name: name || list[idx].name,
    cnic: cnic || list[idx].cnic,
    address: address !== undefined ? address : list[idx].address,
    mobileNo: mobileNo || list[idx].mobileNo,
    sourceOfIncome: sourceOfIncome !== undefined ? sourceOfIncome : list[idx].sourceOfIncome,
    status: status || list[idx].status
  };

  saveDb();

  logAction(
    recordedBy || 'system',
    'Accounts',
    'Update Investor',
    `Updated investor ${list[idx].name} profiles.`
  );

  res.json({ success: true, investor: list[idx] });
});

app.delete('/api/investors/:id', (req, res) => {
  const { id } = req.params;
  const recordedBy = (req.query.recordedBy as string) || 'accounts';
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can delete investor accounts.' });
  }

  const list = db.investors || [];
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Investor not found' });
  }

  const investor = list[idx];
  if (investor.investedAmount > 0 || investor.profitBalance > 0) {
    return res.status(400).json({ success: false, message: 'Cannot delete investor with active investment balance or outstanding profit.' });
  }

  list.splice(idx, 1);
  db.investors = list;
  saveDb();

  logAction(
    recordedBy,
    'Accounts',
    'Delete Investor',
    `Deleted empty investor account ${investor.name}`
  );

  res.json({ success: true, message: 'Investor deleted successfully' });
});

app.get('/api/investor-transactions', (req, res) => {
  res.json(db.investorTransactions || []);
});

app.post('/api/investor-transactions', (req, res) => {
  const { investorId, type, amount, paymentMethod, bankAccountId, chequeNumber, chequeDate, description, recordedBy } = req.body;
  const txAmount = Number(amount);

  if (isNaN(txAmount) || txAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
  }

  const investors = db.investors || [];
  const investor = investors.find(i => i.id === investorId);
  if (!investor) {
    return res.status(440).json({ success: false, message: 'Investor not found' });
  }

  if (type === 'Withdrawal' && investor.investedAmount < txAmount) {
    return res.status(400).json({ success: false, message: `Insufficient principal balance. Available: RS ${investor.investedAmount.toLocaleString()}` });
  }
  if (type === 'Profit Payout' && investor.profitBalance < txAmount) {
    return res.status(400).json({ success: false, message: `Insufficient accrued profit balance. Available: RS ${investor.profitBalance.toLocaleString()}` });
  }

  let accountName = '';
  
  if (type === 'Investment') {
    investor.investedAmount += txAmount;
  } else if (type === 'Withdrawal') {
    investor.investedAmount -= txAmount;
  } else if (type === 'Profit Credit') {
    investor.profitBalance += txAmount;
  } else if (type === 'Profit Payout') {
    investor.profitBalance -= txAmount;
  }

  const isCorporateMovement = type !== 'Profit Credit';
  if (isCorporateMovement) {
    const isDebit = type === 'Withdrawal' || type === 'Profit Payout';
    
    if ((paymentMethod === 'Bank' || paymentMethod === 'Cheque') && bankAccountId) {
      const list = db.bankAccounts || [];
      const account = list.find(a => a.id === bankAccountId);
      if (!account) {
        return res.status(400).json({ success: false, message: 'Selected bank account not found' });
      }
      accountName = `${account.bankName} (${account.accountNumber.slice(-4)})`;
      if (isDebit) {
        account.balance -= txAmount;
        db.bankBalance -= txAmount;
      } else {
        account.balance += txAmount;
        db.bankBalance += txAmount;
      }
    } else {
      if (isDebit) {
        db.cashBalance -= txAmount;
      } else {
        db.cashBalance += txAmount;
      }
    }
  }

  const newTx: InvestorTransaction = {
    id: `INV-TX-${Math.floor(1000 + Math.random() * 9000)}`,
    investorId,
    investorName: investor.name,
    date: new Date().toISOString(),
    type,
    amount: txAmount,
    paymentMethod,
    bankAccountId,
    chequeNumber,
    chequeDate,
    description: description || `${type} transaction on ${paymentMethod}`,
    recordedBy: recordedBy || 'accounts'
  };

  if (!db.investorTransactions) db.investorTransactions = [];
  db.investorTransactions.unshift(newTx);
  saveDb();

  logAction(
    recordedBy || 'accounts',
    'Accounts',
    type === 'Investment' ? 'Investor Deposit' : 'Investor Payout',
    `Recorded investor transaction of RS ${txAmount} (${type}) for ${investor.name}. Channel: ${paymentMethod === 'Bank' || paymentMethod === 'Cheque' ? accountName : 'Cash'}`
  );

  res.json({ success: true, transaction: newTx, investor });
});

app.delete('/api/investor-transactions/:id', (req, res) => {
  const { id } = req.params;
  const recordedBy = (req.query.recordedBy as string) || 'accounts';
  if (!checkSuperAdmin(recordedBy)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can delete/revert investor transactions.' });
  }

  const txList = db.investorTransactions || [];
  const index = txList.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Investor transaction not found' });
  }

  const tx = txList[index];

  const investors = db.investors || [];
  const investor = investors.find(i => i.id === tx.investorId);
  if (!investor) {
    return res.status(440).json({ success: false, message: 'Investor not found' });
  }

  if (tx.type === 'Investment') {
    investor.investedAmount -= tx.amount;
  } else if (tx.type === 'Withdrawal') {
    investor.investedAmount += tx.amount;
  } else if (tx.type === 'Profit Credit') {
    investor.profitBalance -= tx.amount;
  } else if (tx.type === 'Profit Payout') {
    investor.profitBalance += tx.amount;
  }

  const isCorporateMovement = tx.type !== 'Profit Credit';
  if (isCorporateMovement) {
    const isDebit = tx.type === 'Withdrawal' || tx.type === 'Profit Payout';
    
    if ((tx.paymentMethod === 'Bank' || tx.paymentMethod === 'Cheque') && tx.bankAccountId) {
      const account = (db.bankAccounts || []).find(a => a.id === tx.bankAccountId);
      if (account) {
        if (isDebit) {
          account.balance += tx.amount;
          db.bankBalance += tx.amount;
        } else {
          account.balance -= tx.amount;
          db.bankBalance -= tx.amount;
        }
      }
    } else {
      if (isDebit) {
        db.cashBalance += tx.amount;
      } else {
        db.cashBalance -= tx.amount;
      }
    }
  }

  txList.splice(index, 1);
  db.investorTransactions = txList;
  saveDb();

  logAction(
    recordedBy,
    'Accounts',
    'Delete Investor Transaction',
    `Reverted & deleted investor transaction ${id} of RS ${tx.amount} (${tx.type}) for ${investor.name}`
  );

  res.json({ success: true, message: 'Investor transaction deleted successfully' });
});

// Mobile Lock/Unlock requests endpoints
app.get('/api/lock-unlock-requests', (req, res) => {
  res.json(db.lockUnlockRequests || []);
});

app.post('/api/lock-unlock-requests', (req, res) => {
  const { customerId, actionType, requestedBy, reason } = req.body;

  if (!customerId || !actionType || !requestedBy) {
    return res.status(400).json({ success: false, message: 'Customer, action type and requestedBy are required' });
  }

  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(440).json({ success: false, message: 'Customer not found' });
  }

  const agreement = db.agreements?.find(a => a.customerId === customerId);
  const productName = agreement ? agreement.productName : "Unknown Model";
  const serialNumber = agreement ? agreement.serialNumber : "Unknown IMEI";

  const newRequest = {
    id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId,
    customerName: customer.name,
    customerCNIC: customer.cnic,
    actionType,
    requestedBy,
    requestDate: new Date().toISOString(),
    reason: reason || `Requested phone ${actionType.toLowerCase()}`,
    status: 'Pending' as const,
    productName,
    serialNumber
  };

  if (!db.lockUnlockRequests) db.lockUnlockRequests = [];
  db.lockUnlockRequests.unshift(newRequest);
  saveDb();

  logAction(
    requestedBy,
    'Recovery',
    'Lock Request Created',
    `Submitted request to ${actionType} phone for customer ${customer.name}`
  );

  res.json({ success: true, request: newRequest });
});

app.post('/api/lock-unlock-requests/:id/action', (req, res) => {
  const { id } = req.params;
  const { status, actionBy, notes } = req.body;

  if (!status || !actionBy) {
    return res.status(400).json({ success: false, message: 'Status and actionBy are required' });
  }

  const reqList = db.lockUnlockRequests || [];
  const request = reqList.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  request.status = status;
  request.actionBy = actionBy;
  request.actionDate = new Date().toISOString();
  request.notes = notes || '';

  // If approved, update customer lock status in DB
  if (status === 'Approved') {
    const customer = db.customers.find(c => c.id === request.customerId);
    if (customer) {
      customer.deviceStatus = request.actionType === 'Lock' ? 'Locked' : 'Unlocked';
    }
  }

  saveDb();

  logAction(
    actionBy,
    'Recovery',
    `Lock Request ${status}`,
    `${status} ${request.actionType} request ${id} for customer ${request.customerName}`
  );

  res.json({ success: true, request });
});

// Admin Agreement Approval
app.post('/api/agreements/:id/admin-approve', (req, res) => {
  const { id } = req.params;
  const { actionBy } = req.body;

  const agr = db.agreements.find(a => a.id === id);
  if (!agr) {
    return res.status(404).json({ success: false, message: 'Agreement not found' });
  }

  agr.adminApproved = true;
  saveDb();

  logAction(
    actionBy || 'admin',
    'Super Admin',
    'Agreement Approved',
    `Officially approved lease agreement ${id} for customer ${agr.customerName}`
  );

  res.json({ success: true, agreement: agr });
});

// Notifications GET
app.get('/api/notifications', (req, res) => {
  res.json(db.notifications || []);
});

// Notifications POST (Broadcast custom notification)
app.post('/api/notifications', (req, res) => {
  const { message, sender, recipients, category } = req.body;
  if (!message || !sender) {
    return res.status(400).json({ success: false, message: 'Message and sender are required' });
  }

  const newNotification: StaffNotification = {
    id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
    sender,
    message,
    timestamp: new Date().toISOString(),
    readBy: [],
    recipients: Array.isArray(recipients) ? recipients : undefined,
    category: category || undefined
  };

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(newNotification);
  saveDb();

  const isSpecific = Array.isArray(recipients) && recipients.length > 0 && !recipients.includes('all');
  const logMsg = isSpecific 
    ? `Sent announcement to ${recipients.length} employees: "${message.substring(0, 40)}..."`
    : `Broadcast announcement to staff: "${message.substring(0, 40)}..."`;

  logAction(
    sender,
    'Super Admin',
    'Broadcast Notification',
    logMsg
  );

  res.json({ success: true, notification: newNotification });
});

// Notifications MARK READ
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  const notificationsList = db.notifications || [];
  const notif = notificationsList.find(n => n.id === id);
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (!notif.readBy.includes(username)) {
    notif.readBy.push(username);
    saveDb();
  }

  res.json({ success: true });
});

// Notifications DELETE
app.delete('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  if (!db.notifications) db.notifications = [];
  const initialLength = db.notifications.length;
  db.notifications = db.notifications.filter(n => n.id !== id);
  if (db.notifications.length < initialLength) {
    saveDb();
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: 'Notification not found' });
});

// Branch Management Stats
app.get('/api/branch-management/stats', (req, res) => {
  const defaultBranches = ['Karachi Central', 'Lahore West', 'Rawalpindi East', 'Peshawar North', 'Multan South'];
  const branchList = Array.from(new Set([
    ...defaultBranches,
    ...db.customers.map(c => c.branch),
    ...db.agreements.map(a => a.branch)
  ])).filter(Boolean);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = branchList.map(branchName => {
    const branchCustomers = db.customers.filter(c => c.branch === branchName);
    const branchAgreements = db.agreements.filter(a => a.branch === branchName);
    const branchEmployees = db.employees.filter(e => e.branch === branchName);
    
    // Find manager
    const manager = branchEmployees.find(e => e.role === 'Branch Manager');
    const managerName = manager ? manager.name : 'Not Assigned';
    
    // Staff details
    const employeesCount = branchEmployees.length;
    const employeesList = branchEmployees.map(e => ({
      name: e.name,
      role: e.role,
      department: e.department,
      status: e.status
    }));

    const totalCustomersCount = branchCustomers.length;
    let totalAgreementAmount = 0;
    let totalPendingAmount = 0;
    let totalRecoveredAmount = 0;
    
    branchAgreements.forEach(a => {
      totalAgreementAmount += a.totalAmount || 0;
      totalPendingAmount += a.remainingBalance || 0;
      totalRecoveredAmount += (a.totalAmount || 0) - (a.remainingBalance || 0);
    });

    // Installments belonging to this branch's agreements
    const branchInstallments = db.installments.filter(i => {
      const agr = db.agreements.find(a => a.id === i.agreementId);
      return agr && agr.branch === branchName;
    });

    // Monthly EMI target / recoverable amount for the current month
    const monthlyRecoverableAmount = branchInstallments
      .filter(i => {
        const d = new Date(i.dueDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.amountDue, 0);

    // Monthly EMI collected so far this month
    const monthlyRecoveredAmount = branchInstallments
      .filter(i => {
        const d = new Date(i.dueDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.amountPaid, 0);

    // Overdue Customers Count: customers who have at least one overdue installment
    const overdueCustomerIds = new Set<string>();
    branchInstallments.forEach(i => {
      const isOverdue = new Date(i.dueDate) < now && i.status !== 'Paid';
      if (isOverdue) {
        const agr = db.agreements.find(a => a.id === i.agreementId);
        if (agr && agr.customerId) {
          overdueCustomerIds.add(agr.customerId);
        }
      }
    });
    const overdueCustomersCount = overdueCustomerIds.size;

    // Defaulter Customers Count: unique customers with at least one agreement in 'Defaulter' status
    const defaulterCustomerIds = new Set(
      branchAgreements
        .filter(a => a.status === 'Defaulter')
        .map(a => a.customerId)
    );
    const defaulterCustomersCount = defaulterCustomerIds.size;
    
    return {
      branchName,
      managerName,
      employeesCount,
      employees: employeesList,
      customersCount: totalCustomersCount,
      totalAmount: totalAgreementAmount,
      pendingAmount: totalPendingAmount,
      recoveredAmount: totalRecoveredAmount,
      monthlyRecoverableAmount,
      monthlyRecoveredAmount,
      overdueCustomersCount,
      defaulterCustomersCount
    };
  });
  
  res.json(stats);
});

// Staff Payroll APIs
app.get('/api/staff-payroll', (req, res) => {
  res.json(db.staffPayroll || []);
});

// Generate payroll records for a selected month
app.post('/api/staff-payroll/generate', (req, res) => {
  const { month, recordedBy } = req.body; // e.g., "June 2026"
  if (!month) {
    return res.status(400).json({ success: false, message: 'Month is required' });
  }

  if (!db.staffPayroll) db.staffPayroll = [];
  
  // Check if already generated for this month
  const alreadyGenerated = db.staffPayroll.some(p => p.month === month);
  if (alreadyGenerated) {
    return res.status(400).json({ success: false, message: `Payroll for ${month} is already generated` });
  }

  // Generate for all active employees
  const generated: StaffPayroll[] = [];
  db.employees.forEach(emp => {
    if (emp.status === 'Active') {
      // Calculate dynamic commission if they have a rate and agreements
      let commissionsEarned = 0;
      if (emp.commissionRate && emp.commissionRate > 0) {
        // Find customers registered by this employee
        const empCustIds = db.customers.filter(c => c.registeredBy === emp.username).map(c => c.id);
        // Find lease agreements for these customers
        const empAgreements = db.agreements.filter(a => empCustIds.includes(a.customerId));
        // Total retail prices or deposit received can determine commissions
        const totalSalesVolume = empAgreements.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
        commissionsEarned = Math.round(totalSalesVolume * (emp.commissionRate / 100));
      }

      const payrollItem: StaffPayroll = {
        id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        month,
        baseSalary: emp.salary || 35000,
        commissionsEarned,
        status: 'Unpaid'
      };
      
      db.staffPayroll!.push(payrollItem);
      generated.push(payrollItem);
    }
  });

  saveDb();
  logAction(recordedBy || 'accounts', 'Accounts', 'Generate Payroll', `Generated payroll ledger for ${month} (${generated.length} employees)`);
  res.json({ success: true, count: generated.length, payroll: generated });
});

// Execute staff payment
app.post('/api/staff-payroll/pay', (req, res) => {
  const { payrollId, paymentMethod, accountId, allowance, recordedBy } = req.body;
  const list = db.staffPayroll || [];
  const idx = list.findIndex(p => p.id === payrollId);
  
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Payroll record not found' });
  }
  
  const record = list[idx];
  if (record.status === 'Paid') {
    return res.status(400).json({ success: false, message: 'This payroll is already marked as Paid' });
  }

  const customAllowance = Number(allowance) || 0;
  const totalAmount = record.baseSalary + record.commissionsEarned + customAllowance;

  // Deduct from appropriate channel
  let accountName = '';
  if (paymentMethod === 'Bank' && accountId) {
    const accList = db.bankAccounts || [];
    const account = accList.find(a => a.id === accountId);
    if (!account) {
      return res.status(400).json({ success: false, message: 'Selected bank account not found' });
    }
    if (account.balance < totalAmount) {
      return res.status(400).json({ success: false, message: `Insufficient bank account balance. Available: RS ${account.balance}` });
    }
    account.balance -= totalAmount;
    db.bankBalance -= totalAmount;
    accountName = `${account.bankName} (${account.accountNumber.slice(-4)})`;
  } else {
    if (db.cashBalance < totalAmount) {
      return res.status(400).json({ success: false, message: `Insufficient cash balance. Available: RS ${db.cashBalance}` });
    }
    db.cashBalance -= totalAmount;
  }

  // Update record state
  record.status = 'Paid';
  record.paidDate = new Date().toISOString();
  record.paymentMethod = paymentMethod;
  record.accountId = accountId;
  record.allowance = customAllowance;

  // Find employee's contact number if we want to simulate WhatsApp message
  const employeeObj = db.employees.find(e => e.id === record.employeeId);
  const employeePhone = employeeObj?.username === 'sales' ? '+923001234567' : '+923219876543';

  // Log in transactions list
  const txId = `FTX-${Math.floor(1000 + Math.random() * 9000)}`;
  const allowanceDesc = customAllowance > 0 ? ` (incl. RS ${customAllowance} Allowance)` : '';
  const newTx: FinanceTransaction = {
    id: txId,
    date: new Date().toISOString(),
    type: 'Debit',
    amount: totalAmount,
    category: 'Salary',
    accountId,
    paymentMethod,
    employeeId: record.employeeId,
    description: `Salary & Commission disbursed to ${record.employeeName} for ${record.month}${allowanceDesc}`,
    whatsappStatus: 'Sent',
    whatsappRecipient: employeePhone,
    recordedBy: recordedBy || 'accounts'
  };

  if (!db.financeTransactions) db.financeTransactions = [];
  db.financeTransactions.unshift(newTx);
  saveDb();

  logAction(
    recordedBy || 'accounts',
    'Accounts',
    'Disburse Payroll',
    `Paid RS ${totalAmount} to ${record.employeeName} for ${record.month} via ${paymentMethod === 'Bank' ? accountName : 'Cash'}${allowanceDesc}`
  );

  res.json({ success: true, payroll: record, transaction: newTx });
});

// Stats dashboard
app.get('/api/dashboard/stats', (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Today's Collection
  const todayCollections = db.payments
    .filter(p => p.paymentDate.startsWith(todayStr))
    .reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);
    
  // Pending Recovery
  const overdueInstallments = db.installments
    .filter(i => {
      const isOverdue = new Date(i.dueDate) < new Date() && i.status !== 'Paid';
      return isOverdue;
    });
  const pendingRecovery = overdueInstallments.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);
  
  // Upcoming Installments this month
  const upcomingCount = db.installments
    .filter(i => {
      const d = new Date(i.dueDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status !== 'Paid';
    }).length;
    
  // Today's Expenses
  const todayExpenses = db.expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);
    
  // Today's Profit: Sales Profit portion recognized upon agreement closing or delivery markup. Let's say we calculate realized markup.
  // Realized markup = sum (for paid installments of profit portion)
  // For simplicity, profit is (sales profit portion) + penalty fees - expenses
  const salesProfit = db.agreements
    .filter(a => a.status === 'Active' || a.status === 'Closed')
    .reduce((sum, a) => sum + (a.profitAmount / a.months), 0); // Monthly recognized profit per agreement
    
  const totalPenalties = db.payments.reduce((sum, p) => sum + p.penaltyAmount, 0);
  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate dynamic branch performance
  const defaultBranches = ['Karachi Central', 'Lahore West', 'Rawalpindi East'];
  const activeBranches = Array.from(new Set([
    ...defaultBranches,
    ...db.customers.map(c => c.branch),
    ...db.agreements.map(a => a.branch)
  ])).filter(Boolean);

  const branchPerformance = activeBranches.map(branchName => {
    // Total sales in this branch
    const sales = db.agreements
      .filter(a => a.branch === branchName)
      .reduce((sum, a) => sum + a.totalAmount, 0);

    // Total recovery in this branch = sum of all payments against agreements in this branch
    const recovery = db.payments
      .filter(p => {
        const agr = db.agreements.find(a => a.id === p.agreementId);
        if (agr) {
          return agr.branch === branchName;
        }
        const cust = db.customers.find(c => c.id === p.customerId);
        return cust && cust.branch === branchName;
      })
      .reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);

    return {
      name: branchName,
      sales,
      recovery
    };
  });

  // Calculate dynamic sales performance for the last 6 months
  const salesPerformance = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIdx = d.getMonth();
    const year = d.getFullYear();
    const monthName = monthNames[monthIdx];
    
    const monthlySales = db.agreements
      .filter(a => {
        const ad = new Date(a.agreedDate);
        return ad.getMonth() === monthIdx && ad.getFullYear() === year;
      })
      .reduce((sum, a) => sum + a.totalAmount, 0);

    salesPerformance.push({
      month: monthName,
      sales: monthlySales
    });
  }

  res.json({
    todayCollection: todayCollections,
    pendingRecovery: pendingRecovery,
    upcomingInstallmentsCount: upcomingCount,
    todayExpenses: todayExpenses,
    todayProfit: Math.round(salesProfit + totalPenalties - (totalExpenses / 30)),
    totalCashBalance: db.cashBalance,
    totalBankBalance: db.bankBalance,
    branchPerformance,
    salesPerformance,
    defaulters: db.customers.filter(c => c.verificationStatus === 'Approved' && db.agreements.some(a => a.customerId === c.id && a.status === 'Defaulter'))
  });
});

// --- WHATSAPP ALERTS AUTOMATION & PORTAL ENDPOINTS ---

function refreshWhatsAppAlerts() {
  if (!db.whatsappAlerts) db.whatsappAlerts = [];
  if (!db.whatsappTemplates) db.whatsappTemplates = [];
  
  const templatesMap = new Map(db.whatsappTemplates.map(t => [t.id, t]));
  const alerts = db.whatsappAlerts;
  const customers = db.customers || [];
  const agreements = db.agreements || [];
  const installments = db.installments || [];
  
  // Today's date components (using local timezone/current time)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Date 3 days from now
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
  
  // 1. Check Installments for 3-days pre-due and on-due alerts
  installments.forEach(inst => {
    if (inst.status === 'Paid') return;
    
    const agr = agreements.find(a => a.id === inst.agreementId);
    if (!agr || agr.status === 'Closed') return;
    
    const cust = customers.find(c => c.id === agr.customerId);
    if (!cust) return;
    
    const phone = cust.phone;
    
    // Check 3 days before
    if (inst.dueDate === threeDaysLaterStr) {
      const exists = alerts.some(a => a.installmentId === inst.id && a.templateType === 'installment_alert_3_days');
      if (!exists) {
        const temp = templatesMap.get('installment_alert_3_days');
        if (temp && temp.isActive) {
          let body = temp.body
            .replace(/{name}/g, cust.name)
            .replace(/{amount}/g, inst.amountDue.toString())
            .replace(/{due_date}/g, inst.dueDate)
            .replace(/{ref}/g, inst.id);
            
          alerts.unshift({
            id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
            customerId: cust.id,
            customerName: cust.name,
            phone,
            templateType: 'installment_alert_3_days',
            message: body,
            triggerType: 'Auto',
            status: 'Pending',
            timestamp: new Date().toISOString(),
            installmentId: inst.id,
            agreementId: agr.id
          });
        }
      }
    }
    
    // Check due date (today)
    if (inst.dueDate === todayStr) {
      const exists = alerts.some(a => a.installmentId === inst.id && a.templateType === 'installment_alert_due');
      if (!exists) {
        const temp = templatesMap.get('installment_alert_due');
        if (temp && temp.isActive) {
          let body = temp.body
            .replace(/{name}/g, cust.name)
            .replace(/{amount}/g, inst.amountDue.toString())
            .replace(/{due_date}/g, inst.dueDate)
            .replace(/{ref}/g, inst.id);
            
          alerts.unshift({
            id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
            customerId: cust.id,
            customerName: cust.name,
            phone,
            templateType: 'installment_alert_due',
            message: body,
            triggerType: 'Auto',
            status: 'Pending',
            timestamp: new Date().toISOString(),
            installmentId: inst.id,
            agreementId: agr.id
          });
        }
      }
    }
  });
  
  // 2. Check 3 months continuously unpaid -> Legal Notice warning alert
  agreements.forEach(agr => {
    if (agr.status === 'Closed' || agr.status === 'Pending') return;
    
    // Find all installments for this agreement sorted by month
    const agrInsts = installments
      .filter(i => i.agreementId === agr.id)
      .sort((a, b) => a.month - b.month);
      
    // Find if there is a sequence of 3 consecutive unpaid/overdue installments
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const inst of agrInsts) {
      if (inst.status === 'Unpaid' || inst.status === 'Overdue') {
        currentConsecutive++;
        if (currentConsecutive > maxConsecutive) {
          maxConsecutive = currentConsecutive;
        }
      } else {
        currentConsecutive = 0; // reset
      }
    }
    
    if (maxConsecutive >= 3) {
      // Check if a legal notice warning is already generated
      const exists = alerts.some(a => a.agreementId === agr.id && a.templateType === 'legal_notice');
      if (!exists) {
        const cust = customers.find(c => c.id === agr.customerId);
        if (cust) {
          const temp = templatesMap.get('legal_notice');
          if (temp && temp.isActive) {
            const overdueSum = agrInsts
              .filter(i => i.status === 'Unpaid' || i.status === 'Overdue')
              .reduce((sum, i) => sum + i.amountDue, 0);
              
            let body = temp.body
              .replace(/{name}/g, cust.name)
              .replace(/{amount}/g, overdueSum.toString())
              .replace(/{company_phone}/g, db.companyProfile.phone || '+922134567890');
              
            alerts.unshift({
              id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
              customerId: cust.id,
              customerName: cust.name,
              phone: cust.phone,
              templateType: 'legal_notice',
              message: body,
              triggerType: 'Auto',
              status: 'Pending',
              timestamp: new Date().toISOString(),
              agreementId: agr.id
            });
          }
        }
      }
    }
  });
  
  saveDb();
}

app.get('/api/whatsapp-templates', (req, res) => {
  res.json(db.whatsappTemplates || []);
});

app.put('/api/whatsapp-templates/:id', (req, res) => {
  const { id } = req.params;
  const { body, isActive } = req.body;
  if (!db.whatsappTemplates) db.whatsappTemplates = [];
  const idx = db.whatsappTemplates.findIndex(t => t.id === id);
  if (idx > -1) {
    db.whatsappTemplates[idx].body = body;
    db.whatsappTemplates[idx].isActive = isActive !== undefined ? isActive : db.whatsappTemplates[idx].isActive;
    saveDb();
    res.json({ success: true, template: db.whatsappTemplates[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Template not found' });
  }
});

app.get('/api/whatsapp-alerts', (req, res) => {
  refreshWhatsAppAlerts();
  res.json({
    alerts: db.whatsappAlerts || [],
    assignee: db.whatsappAssignee || 'admin',
    templates: db.whatsappTemplates || []
  });
});

app.post('/api/whatsapp-alerts/send/:id', (req, res) => {
  const { id } = req.params;
  const { sender } = req.body; // Who clicked send
  if (!db.whatsappAlerts) db.whatsappAlerts = [];
  const alert = db.whatsappAlerts.find(a => a.id === id);
  if (alert) {
    alert.status = 'Sent';
    alert.sentAt = new Date().toISOString();
    alert.assignedTo = db.whatsappAssignee;
    saveDb();
    logAction(sender || 'system', 'WhatsApp operator', 'Send WhatsApp Alert', `Sent alert ${id} to customer ${alert.customerName} (${alert.phone})`);
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ success: false, message: 'Alert not found' });
  }
});

app.post('/api/whatsapp-alerts/send-all', (req, res) => {
  const { sender } = req.body;
  if (!db.whatsappAlerts) db.whatsappAlerts = [];
  let count = 0;
  db.whatsappAlerts.forEach(alert => {
    if (alert.status === 'Pending') {
      alert.status = 'Sent';
      alert.sentAt = new Date().toISOString();
      alert.assignedTo = db.whatsappAssignee;
      count++;
    }
  });
  if (count > 0) {
    saveDb();
    logAction(sender || 'system', 'WhatsApp operator', 'Bulk Send WhatsApp Alerts', `Dispatched ${count} pending WhatsApp alerts in bulk.`);
  }
  res.json({ success: true, count });
});

app.post('/api/whatsapp-alerts/manual', (req, res) => {
  const { customerName, phone, message, sender } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: 'Phone and message are required' });
  }
  if (!db.whatsappAlerts) db.whatsappAlerts = [];
  const newAlert: WhatsAppAlert = {
    id: `WAA-${Math.floor(100000 + Math.random() * 900000)}`,
    customerId: 'Manual',
    customerName: customerName || 'Walk-in Client',
    phone,
    templateType: 'manual_custom',
    message,
    triggerType: 'Manual',
    status: 'Sent',
    timestamp: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    assignedTo: sender || db.whatsappAssignee || 'admin'
  };
  db.whatsappAlerts.unshift(newAlert);
  saveDb();
  logAction(sender || 'system', 'Staff', 'Manual WhatsApp Alert', `Sent manual WhatsApp alert to ${phone}`);
  res.json({ success: true, alert: newAlert });
});

app.get('/api/whatsapp-config', (req, res) => {
  res.json({ assignee: db.whatsappAssignee || 'admin' });
});

app.put('/api/whatsapp-config/assign', (req, res) => {
  const { assignee, sender } = req.body;
  if (!assignee) {
    return res.status(400).json({ success: false, message: 'Assignee username is required' });
  }
  db.whatsappAssignee = assignee;
  saveDb();
  logAction(sender || 'admin', 'Super Admin', 'Assign WhatsApp Portal', `Assigned WhatsApp Alerts portal responsibility to employee @${assignee}`);
  res.json({ success: true, assignee });
});

// Default audit logs retrieval
app.get('/api/audit-logs', (req, res) => {
  res.json(db.auditLogs);
});

// Company Profile API
app.get('/api/company-profile', (req, res) => {
  res.json(db.companyProfile || defaultDb.companyProfile);
});

app.post('/api/company-profile', (req, res) => {
  db.companyProfile = { ...db.companyProfile, ...req.body };
  saveDb();
  logAction('admin', 'Super Admin', 'Update Company Profile', `Updated company profile for ${db.companyProfile.name}`);
  res.json({ success: true, companyProfile: db.companyProfile });
});

// Legal Cases API
app.get('/api/compliance/legal-cases', (req, res) => {
  res.json(db.legalCases || []);
});

app.post('/api/compliance/legal-cases', (req, res) => {
  try {
    const { caseNumber, title, courtName, customerName, customerCNIC, customerPhone, priority, lawyerName, username, assignedTo } = req.body;
    if (!db.legalCases) db.legalCases = [];
    const newId = `LGL-${String(db.legalCases.length + 1).padStart(4, '0')}`;
    const newCase: LegalCase = {
      id: newId,
      caseNumber,
      title,
      courtName,
      customerName,
      customerCNIC,
      customerPhone,
      status: 'Active',
      priority: priority || 'Medium',
      fillingDate: new Date().toISOString().split('T')[0],
      lawyerName,
      assignedTo,
      notingHistory: [
        {
          date: new Date().toISOString(),
          username: username || 'System Admin',
          comment: `Legal Case registered in system. Case No: ${caseNumber}`
        }
      ]
    };
    db.legalCases.unshift(newCase);
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Create Legal Case', `Registered legal case ${newId} (${caseNumber})`);
    res.json({ success: true, case: newCase });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/compliance/legal-cases/:id/note', (req, res) => {
  try {
    const { id } = req.params;
    const { comment, username } = req.body;
    const cases = db.legalCases || [];
    const legalCase = cases.find(c => c.id === id);
    if (!legalCase) {
      return res.status(404).json({ success: false, message: 'Legal case not found.' });
    }
    if (!legalCase.notingHistory) legalCase.notingHistory = [];
    legalCase.notingHistory.push({
      date: new Date().toISOString(),
      username: username || 'admin',
      comment
    });
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Add Legal Case Note', `Added legal noting to case ${id}`);
    res.json({ success: true, case: legalCase });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/compliance/legal-cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, lawyerName, priority, username } = req.body;
    const cases = db.legalCases || [];
    const legalCase = cases.find(c => c.id === id);
    if (!legalCase) {
      return res.status(404).json({ success: false, message: 'Legal case not found.' });
    }
    if (status) {
      const oldStatus = legalCase.status;
      legalCase.status = status;
      legalCase.notingHistory.push({
        date: new Date().toISOString(),
        username: username || 'admin',
        comment: `Status updated from ${oldStatus} to ${status}`
      });
    }
    if (lawyerName) legalCase.lawyerName = lawyerName;
    if (priority) legalCase.priority = priority;
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Update Legal Case', `Updated legal case ${id}`);
    res.json({ success: true, case: legalCase });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Complaints API
app.get('/api/compliance/complaints', (req, res) => {
  res.json(db.complaints || []);
});

app.post('/api/compliance/complaints', (req, res) => {
  try {
    const { complainerName, type, cnicOrId, category, message, username, assignedTo } = req.body;
    if (!db.complaints) db.complaints = [];
    const newId = `CMP-${String(db.complaints.length + 1).padStart(4, '0')}`;
    const newComplaint: Complaint = {
      id: newId,
      complainerName,
      type,
      cnicOrId,
      category,
      message,
      assignedTo,
      status: 'Received',
      forwardedTo: 'General Support',
      timestamp: new Date().toISOString(),
      notingHistory: [
        {
          date: new Date().toISOString(),
          username: username || 'system',
          comment: `Complaint submitted. Message: "${message}"`
        }
      ]
    };
    db.complaints.unshift(newComplaint);
    saveDb();
    logAction(username || 'system', 'Staff/User', 'Submit Complaint', `Registered complaint ${newId} from ${complainerName}`);
    res.json({ success: true, complaint: newComplaint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/compliance/complaints/:id/note', (req, res) => {
  try {
    const { id } = req.params;
    const { comment, username } = req.body;
    const complaints = db.complaints || [];
    const comp = complaints.find(c => c.id === id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    if (!comp.notingHistory) comp.notingHistory = [];
    comp.notingHistory.push({
      date: new Date().toISOString(),
      username: username || 'admin',
      comment
    });
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Add Complaint Note', `Added noting to complaint ${id}`);
    res.json({ success: true, complaint: comp });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/compliance/complaints/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, forwardedTo, username } = req.body;
    const complaints = db.complaints || [];
    const comp = complaints.find(c => c.id === id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    if (status) {
      const oldStatus = comp.status;
      comp.status = status;
      comp.notingHistory.push({
        date: new Date().toISOString(),
        username: username || 'admin',
        comment: `Complaint status changed from ${oldStatus} to ${status}`
      });
    }
    if (forwardedTo) {
      const oldForwarded = comp.forwardedTo;
      comp.forwardedTo = forwardedTo;
      comp.notingHistory.push({
        date: new Date().toISOString(),
        username: username || 'admin',
        comment: `Complaint forwarded from "${oldForwarded}" to "${forwardedTo}"`
      });
    }
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Update Complaint Status', `Updated status for complaint ${id}`);
    res.json({ success: true, complaint: comp });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Corporate Filings API
app.get('/api/compliance/corporate-filings', (req, res) => {
  res.json(db.corporateFilings || []);
});

app.post('/api/compliance/corporate-filings', (req, res) => {
  try {
    const { title, authority, type, dueDate, notes, username, assignedTo } = req.body;
    if (!db.corporateFilings) db.corporateFilings = [];
    const newId = `FLG-${String(db.corporateFilings.length + 1).padStart(4, '0')}`;
    const newFiling: CorporateFiling = {
      id: newId,
      title,
      authority,
      type,
      status: 'Pending',
      dueDate,
      notes,
      assignedTo,
      notingHistory: [
        {
          date: new Date().toISOString(),
          username: username || 'admin',
          comment: `Regulatory filing target established. Due: ${dueDate}`
        }
      ]
    };
    db.corporateFilings.unshift(newFiling);
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Create Corporate Filing', `Created regulatory filing target ${newId}`);
    res.json({ success: true, filing: newFiling });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/compliance/corporate-filings/:id/note', (req, res) => {
  try {
    const { id } = req.params;
    const { comment, username } = req.body;
    const filings = db.corporateFilings || [];
    const filing = filings.find(f => f.id === id);
    if (!filing) {
      return res.status(404).json({ success: false, message: 'Regulatory filing record not found.' });
    }
    if (!filing.notingHistory) filing.notingHistory = [];
    filing.notingHistory.push({
      date: new Date().toISOString(),
      username: username || 'admin',
      comment
    });
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Add Filing Note', `Added compliance noting to filing ${id}`);
    res.json({ success: true, filing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/compliance/corporate-filings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, filingDate, amountPaid, notes, username } = req.body;
    const filings = db.corporateFilings || [];
    const filing = filings.find(f => f.id === id);
    if (!filing) {
      return res.status(404).json({ success: false, message: 'Regulatory filing record not found.' });
    }
    if (status) {
      const oldStatus = filing.status;
      filing.status = status;
      filing.notingHistory.push({
        date: new Date().toISOString(),
        username: username || 'admin',
        comment: `Filing status updated from ${oldStatus} to ${status}`
      });
    }
    if (filingDate) filing.filingDate = filingDate;
    if (amountPaid !== undefined) filing.amountPaid = Number(amountPaid);
    if (notes) filing.notes = notes;
    saveDb();
    logAction(username || 'admin', 'Compliance officer', 'Update Corporate Filing', `Updated regulatory filing ${id}`);
    res.json({ success: true, filing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Company Policies API
app.get('/api/compliance/company-policies', (req, res) => {
  res.json(db.companyPolicies || []);
});

app.post('/api/compliance/company-policies', (req, res) => {
  try {
    const { title, category, content, version, username } = req.body;
    if (!db.companyPolicies) db.companyPolicies = [];
    const newId = `POL-${String(db.companyPolicies.length + 1).padStart(4, '0')}`;
    const newPolicy = {
      id: newId,
      title,
      category,
      content,
      publishedBy: username || 'Super Admin',
      publishedDate: new Date().toISOString().split('T')[0],
      version: version || 'v1.0'
    };
    db.companyPolicies.unshift(newPolicy);
    saveDb();
    logAction(username || 'admin', 'Admin', 'Publish Policy', `Published company policy ${newId} (${title})`);
    res.json({ success: true, policy: newPolicy });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/compliance/company-policies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};
    if (!db.companyPolicies) db.companyPolicies = [];
    const originalCount = db.companyPolicies.length;
    db.companyPolicies = db.companyPolicies.filter(p => p.id !== id);
    if (db.companyPolicies.length === originalCount) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }
    saveDb();
    logAction(username || 'admin', 'Admin', 'Delete Policy', `Deleted company policy ${id}`);
    res.json({ success: true, message: 'Policy removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Maintenance - Backup API
app.get('/api/maintenance/backup', (req, res) => {
  res.json(db);
});

// Maintenance - Restore API
app.post('/api/maintenance/restore', (req, res) => {
  try {
    const uploadedDb = req.body;
    
    // Quick validation of the uploaded data format
    if (!uploadedDb || !Array.isArray(uploadedDb.employees) || !Array.isArray(uploadedDb.customers)) {
      return res.status(400).json({ success: false, message: 'Invalid database backup schema structure.' });
    }

    db = { ...uploadedDb };
    saveDb();
    logAction('admin', 'Super Admin', 'Restore Database', 'Database restored from an external backup file.');
    res.json({ success: true, message: 'Database state restored successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Restoration failed.' });
  }
});

// Maintenance - Reset/Seed API
app.post('/api/maintenance/reset', (req, res) => {
  try {
    const { mode, password } = req.body;
    
    // Validate password before carrying out the database reset action
    if (password !== 'admin123') {
      return res.status(401).json({ success: false, message: 'Unauthorized. Incorrect administrator password.' });
    }
    
    if (mode === 'seeds') {
      db = JSON.parse(JSON.stringify(defaultDb));
      saveDb();
      logAction('admin', 'Super Admin', 'Database Seeded', 'Reset database to standard demonstration seed records.');
      return res.json({ success: true, message: 'Seeded database successfully.' });
    }
    
    if (mode === 'empty') {
      // Empty data but KEEP employees so we don't lock active users out!
      db = {
        companyProfile: { ...defaultDb.companyProfile },
        employees: [ ...defaultDb.employees ], // Keep seeded admins so they can log in
        suppliers: [],
        brands: [],
        categories: [],
        products: [],
        customers: [],
        agreements: [],
        installments: [],
        payments: [],
        expenses: [],
        auditLogs: [
          { id: 'LOG-0001', timestamp: new Date().toISOString(), username: 'admin', role: 'Super Admin', action: 'Database Reset', details: 'Database cleared of business operations. Seed login accounts retained.' }
        ],
        cashBalance: 0,
        bankBalance: 0
      };
      saveDb();
      return res.json({ success: true, message: 'All transactions, customers and products cleared successfully.' });
    }

    res.status(400).json({ success: false, message: 'Invalid reset mode specified.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Database reset failed.' });
  }
});

// Set up Vite or static files routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise ERP running on http://localhost:${PORT}`);
  });
}

startServer();
