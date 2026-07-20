/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleType =
  | 'Super Admin'
  | 'Branch Manager'
  | 'Accounts'
  | 'Operation'
  | 'Sales Executive'
  | 'Recovery Officer'
  | 'Cashier';

export interface Employee {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: RoleType;
  branch: string;
  department: string;
  salary: number;
  commissionRate: number; // percentage
  status: 'Active' | 'Inactive';
  permissions?: string[];
  photo?: string; // base64 representation or path/url
  cnic?: string; // National Identity Card number
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  purchasePrice: number;
  retailPrice: number;
  stockLevel: { [branch: string]: number };
  serialNumber: string; // IMEI / Serial
  status: 'Available' | 'Sold' | 'Reserved';
}

export interface CustomerDocuments {
  photo?: string; // base64 representation or path
  cnicFront?: string;
  cnicBack?: string;
  utilityBill?: string;
  thumb?: string;
  signature?: string;
  rejectedReason?: string;
}

export interface Guarantor {
  name: string;
  fatherName?: string;
  cnic: string;
  phone: string;
  relationship: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  address?: string;
  occupation?: string;
  department?: string;
  signature?: string;
}

export interface Customer {
  id: string;
  name: string;
  fatherName?: string;
  cnic: string;
  phone: string;
  address: string;
  income: number;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected' | 'Need More Documents';
  documents: CustomerDocuments;
  guarantors: Guarantor[];
  branch: string;
  registeredAt: string;
  registeredBy?: string;
  deviceStatus?: 'Locked' | 'Unlocked' | 'Normal';
  occupation?: string;
  department?: string;
  employerName?: string;
  employerPhone?: string;
}

export interface InstallmentPlan {
  id: string;
  months: number;
  interestRate: number; // yearly or total markup
  name: string;
}

export interface Agreement {
  id: string;
  customerId: string;
  customerName: string;
  customerCNIC: string;
  branch: string;
  productId: string;
  productName: string;
  serialNumber: string;
  installmentPlanId: string;
  months: number;
  downPayment: number;
  totalAmount: number; // principal + interest
  remainingBalance: number;
  profitAmount: number;
  monthlyEMI: number;
  status: 'Pending' | 'Approved' | 'Delivered' | 'Active' | 'Defaulter' | 'Closed';
  deliveryDate?: string;
  agreedDate: string;
  guarantorApproved: boolean;
  qrCode: string;
  barcode: string;
  lateFeeRule: number; // Fixed rupees penalty per day or percentage
  gracePeriod: number; // Days before penalty kicks in
  nocIssued?: boolean;
  adminApproved?: boolean;
  category?: string;
  imei?: string;
  modelNo?: string;
  serialNo?: string;
  engineNo?: string;
  chassisNo?: string;
  carChassisNo?: string;
  registrationNo?: string;
  make?: string;
  modelVariant?: string;
  manufacturingYear?: string;
  color?: string;
}

export interface Installment {
  id: string; // agreementId-month
  agreementId: string;
  month: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  paidDate?: string;
  penaltyPaid: number;
  penaltyOutstanding: number;
  status: 'Unpaid' | 'Paid' | 'Partial' | 'Overdue';
}

export interface Payment {
  id: string;
  agreementId: string;
  customerId: string;
  customerName: string;
  amount: number;
  penaltyAmount: number;
  discountAmount: number;
  paymentDate: string;
  receivedBy: string;
  paymentMethod: 'Cash' | 'Bank';
  bankName?: string;
  receiptNo: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  branch: string;
  recordedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  role: RoleType;
  action: string;
  details: string;
}

export interface CompanyProfile {
  name: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  ntn: string;
  regNo: string;
  terms: string;
  logoUrl?: string;
  loginBgUrl?: string;
  sidebarBgUrl?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'Credit' | 'Debit';
  amount: number;
  category: 'Deposit' | 'Withdrawal' | 'Salary' | 'Commission' | 'Other' | 'Customer Collection' | 'Expense';
  accountId?: string;
  paymentMethod: 'Cash' | 'Bank';
  employeeId?: string;
  description: string;
  whatsappStatus?: 'Sent' | 'Failed' | 'Not Configured';
  whatsappRecipient?: string;
  recordedBy: string;
}

export interface StaffPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  month: string;
  baseSalary: number;
  commissionsEarned: number;
  allowance?: number;
  status: 'Paid' | 'Unpaid';
  paidDate?: string;
  paymentMethod?: 'Cash' | 'Bank';
  accountId?: string;
}

export interface LockUnlockRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerCNIC: string;
  actionType: 'Lock' | 'Unlock';
  requestedBy: string;
  requestDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  actionDate?: string;
  actionBy?: string;
  notes?: string;
  productName?: string;
  serialNumber?: string;
}

export interface DashboardStats {
  todayCollection: number;
  pendingRecovery: number;
  upcomingInstallmentsCount: number;
  todayExpenses: number;
  todayProfit: number;
  totalCashBalance: number;
  totalBankBalance: number;
}

export interface StaffNotification {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  readBy: string[];
  recipients?: string[];
  category?: string;
}

export interface LegalCaseNote {
  date: string;
  username: string;
  comment: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  courtName: string;
  customerName: string;
  customerCNIC: string;
  customerPhone: string;
  status: 'Active' | 'Pending' | 'Resolved' | 'Appealed';
  priority: 'High' | 'Medium' | 'Low';
  fillingDate: string;
  notingHistory: LegalCaseNote[];
  lawyerName: string;
  assignedTo?: string;
}

export interface ComplaintNote {
  date: string;
  username: string;
  comment: string;
}

export interface Complaint {
  id: string;
  complainerName: string;
  type: 'Customer' | 'Employee';
  cnicOrId: string;
  category: 'Billing' | 'Device Lock' | 'Staff Behavior' | 'Service' | 'General';
  message: string;
  status: 'Received' | 'Forwarded' | 'In Progress' | 'Resolved';
  forwardedTo: string;
  notingHistory: ComplaintNote[];
  timestamp: string;
  assignedTo?: string;
}

export interface FilingNote {
  date: string;
  username: string;
  comment: string;
}

export interface CorporateFiling {
  id: string;
  title: string;
  authority: 'FBR' | 'SECP' | 'PRA' | 'SRB' | 'Other';
  type: 'Annual Return' | 'Income Tax' | 'Sales Tax' | 'Withholding' | 'Other';
  status: 'Pending' | 'Filed' | 'Under Review' | 'Delayed';
  dueDate: string;
  filingDate?: string;
  amountPaid?: number;
  notes: string;
  notingHistory: FilingNote[];
  assignedTo?: string;
}

export interface CompanyPolicy {
  id: string;
  title: string;
  category: 'SOP' | 'HR' | 'Legal' | 'Compliance' | 'Operations';
  content: string;
  publishedBy: string;
  publishedDate: string;
  version: string;
}

export interface Investor {
  id: string;
  name: string;
  cnic: string;
  address: string;
  mobileNo: string;
  sourceOfIncome: string;
  investedAmount: number;
  profitBalance: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface InvestorTransaction {
  id: string;
  investorId: string;
  investorName: string;
  date: string;
  type: 'Investment' | 'Profit Payout' | 'Withdrawal' | 'Profit Credit';
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque';
  bankAccountId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  description: string;
  recordedBy: string;
}

export interface WhatsAppTemplate {
  id: string; // 'customer_registration' | 'installment_alert_3_days' | 'installment_alert_due' | 'installment_paid' | 'booking_alert' | 'delivery_alert' | 'legal_notice'
  name: string;
  category: string;
  body: string;
  isActive: boolean;
}

export interface WhatsAppAlert {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  templateType: string;
  message: string;
  triggerType: 'Auto' | 'Manual';
  status: 'Pending' | 'Sent' | 'Failed';
  timestamp: string;
  sentAt?: string;
  assignedTo?: string; // Username of employee assigned to it
  installmentId?: string;
  agreementId?: string;
}



