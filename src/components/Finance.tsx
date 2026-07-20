/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, FinanceTransaction, StaffPayroll, Employee } from '../types';
import { InvestorManagement } from './InvestorManagement';
import { 
  Landmark, Plus, Search, Wallet, ArrowDownRight, ArrowUpRight, 
  MessageSquare, Phone, Users, Calendar, Coins, Loader2, CheckCircle2, 
  Send, Printer, FileSpreadsheet, Settings, RefreshCw, Smartphone, 
  Percent, Edit3, Trash2, Eye, FileText, CheckCircle, XCircle
} from 'lucide-react';
import { showToast, exportToCSV, handlePrintLayout, QRCode } from './UIElements';

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const g = ['', 'Thousand', 'Million', 'Billion'];
  
  const helper = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let word = '';
  let i = 0;
  let temp = num;
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk !== 0) {
      const chunkStr = helper(chunk);
      word = chunkStr + (g[i] ? ' ' + g[i] : '') + (word ? ' ' + word : '');
    }
    temp = Math.floor(temp / 1000);
    i++;
  }
  return word.trim() + ' Rupees Only';
};

interface FinanceProps {
  currentUser: Employee;
}

export const Finance: React.FC<FinanceProps> = ({ currentUser }) => {
  // Tabs: 'accounts' | 'transactions' | 'payroll' | 'bank-history' | 'investors'
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'payroll' | 'bank-history' | 'investors'>('accounts');
  
  // Data States
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [payrollList, setPayrollList] = useState<StaffPayroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  
  // Loading & UX
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('June 2026');
  
  // Modals & Form states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedPayrollForSlip, setSelectedPayrollForSlip] = useState<StaffPayroll | null>(null);
  
  // Filtering states for main transaction log
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStaff, setFilterStaff] = useState<string>('All');
  const [filterBankHistoryId, setFilterBankHistoryId] = useState<string>('All');
  
  // Form bodies
  const [accountForm, setAccountForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    balance: ''
  });
  
  const [txForm, setTxForm] = useState({
    type: 'Credit' as 'Credit' | 'Debit',
    amount: '',
    category: 'Deposit',
    accountId: '',
    paymentMethod: 'Cash' as 'Cash' | 'Bank',
    employeeId: '',
    description: '',
    whatsappRecipient: '',
    triggerWhatsapp: true
  });

  const [editTxForm, setEditTxForm] = useState({
    id: '',
    type: 'Credit' as 'Credit' | 'Debit',
    amount: '',
    category: 'Deposit',
    accountId: '',
    paymentMethod: 'Cash' as 'Cash' | 'Bank',
    employeeId: '',
    description: '',
    whatsappRecipient: ''
  });

  const [disburseForm, setDisburseForm] = useState({
    payrollId: '',
    employeeName: '',
    baseSalary: 0,
    commissionsEarned: 0,
    allowance: 0,
    totalAmount: 0,
    paymentMethod: 'Cash' as 'Cash' | 'Bank',
    accountId: ''
  });

  // WhatsApp simulation state
  const [customPhone, setCustomPhone] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    "Dear {name}, your transaction of RS {amount} ({type}) was successful on {date}. Ref: {ref}. Thank you for banking with Manha Digital Consumer Financing."
  );
  
  // Simulated chat bubbles
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'me' | 'them'; text: string; time: string }>>([
    { id: '1', sender: 'them', text: 'Salam! Can I get my salary receipt via WhatsApp?', time: '09:12 AM' },
    { id: '2', sender: 'me', text: 'Sure! All debit and credit alerts are now sent instantly using our WhatsApp Integration engine.', time: '09:15 AM' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, txRes, payrollRes, employeesRes, statsRes] = await Promise.all([
        fetch('/api/bank-accounts'),
        fetch('/api/finance-transactions'),
        fetch('/api/staff-payroll'),
        fetch('/api/employees'),
        fetch('/api/dashboard/stats')
      ]);

      const accountsData = await accountsRes.json();
      const txData = await txRes.json();
      const payrollData = await payrollRes.json();
      const employeesData = await employeesRes.json();
      const statsData = await statsRes.json();

      setBankAccounts(accountsData || []);
      setTransactions(txData || []);
      setPayrollList(payrollData || []);
      setEmployees(employeesData || []);
      setCashBalance(statsData.totalCashBalance || 0);
      setBankBalance(statsData.totalBankBalance || 0);
    } catch (err) {
      console.error(err);
      showToast('Error fetching financial records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1. Add Bank Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.bankName || !accountForm.accountName || !accountForm.accountNumber) {
      showToast('Please fill all required account fields.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountForm, recordedBy: currentUser.username })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Bank Account registered successfully!', 'success');
        setShowAccountModal(false);
        setAccountForm({ bankName: '', accountName: '', accountNumber: '', branchName: '', balance: '' });
        fetchData();
      } else {
        showToast(data.message || 'Failed to save account.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  // 2. Add Direct Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || isNaN(Number(txForm.amount)) || Number(txForm.amount) <= 0) {
      showToast('Please enter a valid amount.', 'warning');
      return;
    }
    if (txForm.paymentMethod === 'Bank' && !txForm.accountId) {
      showToast('Please select a Bank Account.', 'warning');
      return;
    }

    // Auto-fill description based on category if empty
    const txDescription = txForm.description.trim() || `${txForm.category} transaction recorded via ${txForm.paymentMethod}`;
    const txPayload = {
      ...txForm,
      description: txDescription,
      recordedBy: currentUser.username,
      whatsappRecipient: txForm.triggerWhatsapp ? txForm.whatsappRecipient : ''
    };

    try {
      const res = await fetch('/api/finance-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txPayload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Transaction registered successfully!', 'success');
        setShowTxModal(false);
        
        // Push a simulated message to whatsapp screen chat if trigger option was on
        if (txForm.triggerWhatsapp && txForm.whatsappRecipient) {
          const matchedAccount = bankAccounts.find(a => a.id === txForm.accountId);
          const acctString = txForm.paymentMethod === 'Bank' && matchedAccount 
            ? `${matchedAccount.bankName} (${matchedAccount.accountNumber.slice(-4)})` 
            : 'Cash Wallet';
          
          const formattedMsg = whatsappTemplate
            .replace('{name}', txForm.employeeId ? (employees.find(em => em.id === txForm.employeeId)?.name || 'Recipient') : 'Customer/Partner')
            .replace('{amount}', Number(txForm.amount).toLocaleString())
            .replace('{type}', txForm.type === 'Credit' ? 'CREDITED' : 'DEBITED')
            .replace('{date}', new Date().toLocaleDateString())
            .replace('{ref}', data.transaction?.id || 'FTX-MOCK')
            .replace('{balance}', acctString);

          setChatMessages(prev => [
            ...prev,
            { id: Date.now().toString(), sender: 'me', text: formattedMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        }

        // Reset
        setTxForm({
          type: 'Credit',
          amount: '',
          category: 'Deposit',
          accountId: '',
          paymentMethod: 'Cash',
          employeeId: '',
          description: '',
          whatsappRecipient: '',
          triggerWhatsapp: true
        });
        fetchData();
      } else {
        showToast(data.message || 'Error executing transaction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  // 2b. Edit Transaction Entry (Debit/Credit Edit)
  const openEditTxModal = (tx: FinanceTransaction) => {
    setEditTxForm({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
      accountId: tx.accountId || '',
      paymentMethod: tx.paymentMethod,
      employeeId: tx.employeeId || '',
      description: tx.description,
      whatsappRecipient: tx.whatsappRecipient || ''
    });
    setShowEditTxModal(true);
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTxForm.amount || isNaN(Number(editTxForm.amount)) || Number(editTxForm.amount) <= 0) {
      showToast('Please enter a valid amount.', 'warning');
      return;
    }
    if (editTxForm.paymentMethod === 'Bank' && !editTxForm.accountId) {
      showToast('Please select a Bank Account.', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/finance-transactions/${editTxForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editTxForm,
          recordedBy: currentUser.username
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Transaction ${editTxForm.id} updated & balances adjusted!`, 'success');
        setShowEditTxModal(false);
        fetchData();
      } else {
        showToast(data.message || 'Error updating transaction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating entry.', 'error');
    }
  };

  // 2c. Delete Transaction Entry
  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete transaction ${txId}? This will automatically restore or deduct the corresponding Cash or Bank Account registers.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/finance-transactions/${txId}?recordedBy=${currentUser.username}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Transaction ${txId} successfully deleted & balances re-adjusted.`, 'success');
        fetchData();
      } else {
        showToast(data.message || 'Error deleting transaction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during deletion.', 'error');
    }
  };

  // 3. Generate Payroll Ledger
  const handleGeneratePayroll = async () => {
    try {
      const res = await fetch('/api/staff-payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: payrollMonth, recordedBy: currentUser.username })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully generated payroll for ${payrollMonth}!`, 'success');
        fetchData();
      } else {
        showToast(data.message || 'Could not generate payroll.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  // 4. Open Disburse Modal
  const openDisburseModal = (payroll: StaffPayroll) => {
    const total = payroll.baseSalary + payroll.commissionsEarned;
    // Find employee phone
    const matchedEmp = employees.find(e => e.id === payroll.employeeId);
    const empPhone = matchedEmp?.username === 'sales' ? '+923001234567' : '+923219876543';

    setDisburseForm({
      payrollId: payroll.id,
      employeeName: payroll.employeeName,
      baseSalary: payroll.baseSalary,
      commissionsEarned: payroll.commissionsEarned,
      allowance: 0,
      totalAmount: total,
      paymentMethod: 'Cash',
      accountId: bankAccounts[0]?.id || ''
    });
    
    // Autofill tx recipient fields if user moves to other forms
    setTxForm(prev => ({
      ...prev,
      whatsappRecipient: empPhone,
      employeeId: payroll.employeeId
    }));

    setShowDisburseModal(true);
  };

  // 5. Submit Disbursement (Salary / Commission debit)
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff-payroll/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollId: disburseForm.payrollId,
          paymentMethod: disburseForm.paymentMethod,
          accountId: disburseForm.paymentMethod === 'Bank' ? disburseForm.accountId : undefined,
          allowance: disburseForm.allowance,
          recordedBy: currentUser.username
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Disbursed salary to ${disburseForm.employeeName}!`, 'success');
        setShowDisburseModal(false);
        
        // Send a message to WhatsApp live simulator automatically
        const formattedMsg = `*Salary Credit Alert*\n\nDear ${disburseForm.employeeName}, your payroll for ${payrollMonth} has been processed.\n\n*Base Salary:* RS ${disburseForm.baseSalary.toLocaleString()}\n*Commission:* RS ${disburseForm.commissionsEarned.toLocaleString()}\n*Allowance:* RS ${disburseForm.allowance.toLocaleString()}\n*Total Net Credit:* RS ${disburseForm.totalAmount.toLocaleString()}\n*Paid Via:* ${disburseForm.paymentMethod}\n*Date:* ${new Date().toLocaleDateString()}\n\nManha Digital Consumer Financing System.`;
        
        setChatMessages(prev => [
          ...prev,
          { id: Date.now().toString(), sender: 'me', text: formattedMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);

        fetchData();
      } else {
        showToast(data.message || 'Error disbursing salary.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  // WhatsApp trigger simulator manually
  const triggerManualMockWhatsapp = () => {
    if (!customPhone || customPhone.length < 5) {
      showToast('Please specify a valid mobile number.', 'warning');
      return;
    }
    
    const alertMsg = `*Direct Ledger Notification*\n\nTransaction processed successfully.\n*Type:* Credit / Credit Ledger\n*Amount:* RS 120,000\n*Sent To:* ${customPhone}\n\nProcessed in real-time by ERP FinTech Integration Gateway.`;
    
    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'me', text: alertMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    
    showToast('Mock WhatsApp message pushed to active queue!', 'success');
  };

  // Launch real WhatsApp web redirection link helper
  const openWhatsAppWebLink = (tx: FinanceTransaction) => {
    const defaultNum = tx.whatsappRecipient || '+923001234567';
    const cleanNum = defaultNum.replace(/[^0-9]/g, '');
    
    const matchedAccount = bankAccounts.find(a => a.id === tx.accountId);
    const acctStr = tx.paymentMethod === 'Bank' && matchedAccount 
      ? `${matchedAccount.bankName} (Acct: ...${matchedAccount.accountNumber.slice(-4)})` 
      : 'Cash Vault';

    const text = `*Transaction Alert*\n\nRef ID: ${tx.id}\nDate: ${new Date(tx.date).toLocaleDateString()}\nType: *${tx.type === 'Credit' ? 'CREDIT 🟢' : 'DEBIT 🔴'}*\nAmount: *RS ${tx.amount.toLocaleString()}*\nCategory: ${tx.category}\nPayment Channel: ${acctStr}\nDescription: ${tx.description}\n\n_Thank you for banking with Manha Consumer Financing Pvt Ltd._`;
    
    const url = `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast('Redirecting to WhatsApp Web Portal...', 'info');
  };

  // Print voucher utility
  const handlePrintPaySlip = () => {
    handlePrintLayout('salary-slip-printout');
  };

  // Filter transaction records by search and advanced options (Type, Category, Staff)
  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.toLowerCase();
    const matchedAccount = bankAccounts.find(a => a.id === tx.accountId);
    const accountName = matchedAccount ? matchedAccount.bankName : 'Cash';
    const empName = employees.find(e => e.id === tx.employeeId)?.name || '';
    
    const matchesSearch = (
      tx.id.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      accountName.toLowerCase().includes(query) ||
      empName.toLowerCase().includes(query)
    );

    const matchesType = filterType === 'All' || tx.type === filterType;
    const matchesCategory = filterCategory === 'All' || tx.category === filterCategory;
    const matchesStaff = filterStaff === 'All' || tx.employeeId === filterStaff;

    return matchesSearch && matchesType && matchesCategory && matchesStaff;
  });

  // Filter bank-only transactions
  const bankTransactions = transactions.filter(tx => {
    if (tx.paymentMethod !== 'Bank') return false;
    const query = bankSearchQuery.toLowerCase();
    const matchedAccount = bankAccounts.find(a => a.id === tx.accountId);
    const accountName = matchedAccount ? matchedAccount.bankName : 'Unknown';
    const matchesSearch = (
      tx.id.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      accountName.toLowerCase().includes(query)
    );
    const matchesAccountFilter = filterBankHistoryId === 'All' || tx.accountId === filterBankHistoryId;
    return matchesSearch && matchesAccountFilter;
  });

  return (
    <div id="finance-module" className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Landmark className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Landmark className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Corporate Ledger</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Finance & Accounts</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Manage corporate bank registers, record instant debits/credits, disburse monthly payrolls, and trigger instant WhatsApp alerts with real-time balance adjustments.
          </p>
        </div>
        
        {/* Rapid Vault Balance Widgets */}
        <div className="flex items-center gap-4 relative z-10 shrink-0">
          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl min-w-[140px] shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Cash Balance
            </p>
            <p className="text-lg font-black font-mono text-emerald-700 mt-1">
              RS {cashBalance.toLocaleString()}
            </p>
          </div>
          <div className="bg-sky-50/50 border border-sky-100 p-3.5 rounded-xl min-w-[140px] shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Bank Balance
            </p>
            <p className="text-lg font-black font-mono text-sky-700 mt-1">
              RS {bankBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🏦 Bank Accounts Register
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Debit/Credit Adjustments Log
        </button>
        <button
          onClick={() => setActiveTab('bank-history')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'bank-history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Bank Payment History
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💼 Staff Payroll & Pay Slips
        </button>
        <button
          onClick={() => setActiveTab('investors')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'investors'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📈 Investor & Capital Accounts
        </button>
      </div>

      {/* TAB CONTENT: 1. BANK ACCOUNTS REGISTER */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Corporate Bank Registrars</h3>
              <p className="text-xs text-slate-500">Active bank accounts used for corporate deposits, client installment clearances, and salary disbursements.</p>
            </div>
            {currentUser.role === 'Super Admin' && (
              <button
                onClick={() => setShowAccountModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Bank Account
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-mono">Loading corporate registers...</p>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No Corporate Bank Accounts Registered</p>
              <p className="text-xs text-slate-400">Add HBL, Meezan, Bank Alfalah etc. to process lease down payments and EMI transactions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankAccounts.map(account => (
                <div key={account.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-slate-600">
                        <Landmark className="w-6 h-6" />
                      </span>
                      <span className={`px-2.5 py-0.5 text-[9px] rounded-md font-bold uppercase tracking-wider ${
                        account.status === 'Active' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'
                      }`}>
                        {account.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-md text-slate-800">{account.bankName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">Account Title: {account.accountName}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-mono space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-sans font-black">Account Number</p>
                      <p className="text-xs font-bold text-slate-700">{account.accountNumber}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-sans font-black pt-1">Branch</p>
                      <p className="text-xs font-medium text-slate-600">{account.branchName || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Ledger Balance</p>
                      <p className="text-md font-black font-mono text-emerald-700">RS {account.balance.toLocaleString()}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setTxForm(prev => ({
                          ...prev,
                          paymentMethod: 'Bank',
                          accountId: account.id,
                          category: 'Deposit'
                        }));
                        setShowTxModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer transition-all"
                    >
                      Instant Adj.
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. FINANCIAL TRANSACTION LOGS WITH EDIT/DELETE ACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Debit & Credit Adjustments Register</h3>
              <p className="text-xs text-slate-500">Every single debit, credit, corporate deposit, or withdrawal registered in the database. Use Edit/Delete controls to adjust ledger errors.</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => exportToCSV(filteredTransactions, 'Finance_Transactions_Ledger')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </button>
              
              {currentUser.role === 'Super Admin' && (
                <button
                  onClick={() => setShowTxModal(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Credit / Debit Ledger
                </button>
              )}
            </div>
          </div>

          {/* Advanced Search and Filters Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by transaction ID, description, bank name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type Filter */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Type</span>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none bg-slate-50"
                >
                  <option value="All">All Types (Credit + Debit)</option>
                  <option value="Credit">Credit (Funds In) 🟢</option>
                  <option value="Debit">Debit (Funds Out) 🔴</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none bg-slate-50"
                >
                  <option value="All">All Categories</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Salary">Salary</option>
                  <option value="Commission">Commission</option>
                  <option value="Expense">Expense</option>
                  <option value="Customer Collection">Customer Collection</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Staff Filter */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Staff Member</span>
                <select
                  value={filterStaff}
                  onChange={e => setFilterStaff(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none bg-slate-50"
                >
                  <option value="All">All Associated Staff</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Reading transactions index...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-2xl">
              <Coins className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500 mt-2">No matching transactions found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Type / Category</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Narrative</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-center">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(tx => {
                      const matchedAccount = bankAccounts.find(a => a.id === tx.accountId);
                      const accountLabel = tx.paymentMethod === 'Bank' && matchedAccount 
                        ? `${matchedAccount.bankName} (...${matchedAccount.accountNumber.slice(-4)})` 
                        : 'Cash Vault';
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-500">{tx.id}</td>
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(tx.date).toLocaleDateString()} <br />
                            <span className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              tx.type === 'Credit' 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-red-50 border border-red-100 text-red-700'
                            }`}>
                              {tx.type === 'Credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {tx.type}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1 font-mono">{tx.category}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{tx.paymentMethod}</span>
                            <span className="block text-[10px] text-slate-400">{accountLabel}</span>
                          </td>
                          <td className="p-3">
                            <p className="text-slate-800 font-medium">{tx.description}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Logged by: @{tx.recordedBy}</p>
                          </td>
                          <td className="p-3 font-black font-mono text-slate-900 text-sm">
                            RS {tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {currentUser.role === 'Super Admin' && (
                                <>
                                  {/* Edit Button */}
                                  <button
                                    onClick={() => openEditTxModal(tx)}
                                    className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 rounded transition-all cursor-pointer"
                                    title="Edit Transaction"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 rounded transition-all cursor-pointer"
                                    title="Delete/Revert Transaction"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Whatsapp trigger link */}
                              {tx.whatsappRecipient && (
                                <button
                                  onClick={() => openWhatsAppWebLink(tx)}
                                  className="p-1.5 bg-slate-50 hover:bg-teal-50 text-emerald-600 hover:text-emerald-700 border border-slate-200 rounded transition-all cursor-pointer"
                                  title="Send Alerts Link"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2b. BANK PAYMENT HISTORY */}
      {activeTab === 'bank-history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bank Payment History Logs</h3>
              <p className="text-xs text-slate-500">Dedicated operational ledger of funds moving through corporate bank accounts. Reconcile deposits and dispatches with real-time balance metrics.</p>
            </div>
            
            <button
              onClick={() => exportToCSV(bankTransactions, 'Bank_Only_Payments_Ledger')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Bank CSV
            </button>
          </div>

          {/* Bank Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bank payments by ID, Category, Description, Bank Name..."
                value={bankSearchQuery}
                onChange={e => setBankSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-slate-500">Select Bank Register:</span>
              <select
                value={filterBankHistoryId}
                onChange={e => setFilterBankHistoryId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 border-none outline-none cursor-pointer"
              >
                <option value="All">All Registers</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} (...{b.accountNumber.slice(-4)})</option>
                ))}
              </select>
            </div>
          </div>

          {bankTransactions.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-2xl">
              <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500 mt-2">No bank-based payments found matching filter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Bank Register Source/Target</th>
                      <th className="p-3">Direction</th>
                      <th className="p-3">Type Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Transmitted Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bankTransactions.map(bt => {
                      const matchedAccount = bankAccounts.find(a => a.id === bt.accountId);
                      
                      return (
                        <tr key={bt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-400">{bt.id}</td>
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(bt.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800">{matchedAccount ? matchedAccount.bankName : 'Direct Bank'}</span>
                            <span className="block text-[10px] text-slate-400">Title: {matchedAccount?.accountName}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                              bt.type === 'Credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {bt.type === 'Credit' ? '🟢 FUNDS RECEIVED' : '🔴 DISPATCHED'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-500 font-mono uppercase text-[10px]">{bt.category}</span>
                          </td>
                          <td className="p-3">
                            <p className="text-slate-800">{bt.description}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Operator: @{bt.recordedBy}</span>
                          </td>
                          <td className="p-3 font-black font-mono text-slate-900 text-sm">
                            RS {bt.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. STAFF PAYROLL & PAY SLIPS */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" /> Monthly Payroll Engine
              </h3>
              <p className="text-xs text-slate-500">Calculate base salaries and auto-compute commissions based on sales portfolios registered to representatives.</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-xl text-xs">
                <span className="font-semibold text-slate-500 pl-1.5">Month:</span>
                <select
                  value={payrollMonth}
                  onChange={e => setPayrollMonth(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 border-none outline-none cursor-pointer"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>

              {currentUser.role === 'Super Admin' && (
                <button
                  onClick={handleGeneratePayroll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow"
                >
                  <RefreshCw className="w-4 h-4" /> Generate Payroll
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Computing salaries and commission ratios...</p>
            </div>
          ) : payrollList.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No payroll generated for {payrollMonth}</p>
              <p className="text-xs text-slate-400">Click the "Generate Payroll" button to compute salaries & active sales commission ledgers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-3">Staff ID</th>
                        <th className="p-3">Staff Name / Role</th>
                        <th className="p-3">Month</th>
                        <th className="p-3">Base Salary</th>
                        <th className="p-3">Commissions</th>
                        <th className="p-3">Total Net Payable</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payrollList.filter(p => p.month === payrollMonth).map(payroll => (
                        <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-500">{payroll.employeeId}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800 text-sm">{payroll.employeeName}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase font-bold mt-0.5">{payroll.role}</p>
                          </td>
                          <td className="p-3 font-medium text-slate-600">{payroll.month}</td>
                          <td className="p-3 font-bold font-mono text-slate-900">
                            RS {payroll.baseSalary.toLocaleString()}
                          </td>
                          <td className="p-3 font-semibold font-mono text-emerald-600">
                            + RS {payroll.commissionsEarned.toLocaleString()}
                          </td>
                          <td className="p-3 font-black font-mono text-slate-900 text-sm">
                            RS {(payroll.baseSalary + payroll.commissionsEarned).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              payroll.status === 'Paid' 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-red-50 border border-red-100 text-red-700'
                            }`}>
                              {payroll.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print Voucher / Salary certificate button */}
                              {payroll.status === 'Paid' && (
                                <button
                                  onClick={() => setSelectedPayrollForSlip(payroll)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Pay Slip
                                </button>
                              )}

                              {payroll.status === 'Unpaid' && currentUser.role === 'Super Admin' ? (
                                <button
                                  onClick={() => openDisburseModal(payroll)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow transition-all cursor-pointer"
                                >
                                  Disburse Salary
                                </button>
                              ) : payroll.status === 'Unpaid' ? (
                                <span className="text-[10px] text-slate-400 font-medium">Unpaid (Admin Only)</span>
                              ) : (
                                <div className="text-[10px] text-slate-400 font-medium text-left bg-slate-50 p-1.5 rounded border border-slate-100">
                                  Paid via <span className="font-bold">{payroll.paymentMethod}</span> <br />
                                  {payroll.paidDate && new Date(payroll.paidDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 5. INVESTOR MANAGEMENT PORTAL */}
      {activeTab === 'investors' && (
        <InvestorManagement 
          currentUser={currentUser} 
          bankAccounts={bankAccounts} 
          refreshGlobalStats={fetchData} 
        />
      )}

      {/* MODAL 1: ADD BANK ACCOUNT */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 text-slate-850 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">Add Bank Register</h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-all text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank, HBL, Al-Falah"
                  required
                  value={accountForm.bankName}
                  onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Account Name / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Manha Consumer Financing Pvt Ltd"
                  required
                  value={accountForm.accountName}
                  onChange={e => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Account / IBAN Number *</label>
                <input
                  type="text"
                  placeholder="e.g. PK00HABB00120349581023"
                  required
                  value={accountForm.accountNumber}
                  onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Branch Name & City</label>
                <input
                  type="text"
                  placeholder="e.g. Gulshan-e-Iqbal Branch, Karachi"
                  value={accountForm.branchName}
                  onChange={e => setAccountForm({ ...accountForm, branchName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Balance (RS) *</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  required
                  value={accountForm.balance}
                  onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer mt-2"
              >
                Register Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREDIT / DEBIT DIRECT TRANSACTION */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 text-slate-850 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">Debit / Credit Transaction Ledger</h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-all text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'Credit' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txForm.type === 'Credit' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🟢 Credit (Funds In)
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'Debit' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txForm.type === 'Debit' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🔴 Debit (Funds Out)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Channel</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={e => setTxForm({ ...txForm, paymentMethod: e.target.value as 'Cash' | 'Bank' })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Cash">Cash Vault</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>

                {txForm.paymentMethod === 'Bank' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account *</label>
                    <select
                      value={txForm.accountId}
                      onChange={e => setTxForm({ ...txForm, accountId: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Select Account...</option>
                      {bankAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.bankName} (Acct: ...{a.accountNumber.slice(-4)})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (RS) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    required
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Transaction Category</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Salary">Salary</option>
                    <option value="Commission">Commission</option>
                    <option value="Expense">Expense</option>
                    <option value="Customer Collection">Customer Collection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Narrative / Description</label>
                <input
                  type="text"
                  placeholder="Enter details about this cash-flow ledger adjustment"
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Simulate WhatsApp Transaction Alert</span>
                  <input
                    type="checkbox"
                    checked={txForm.triggerWhatsapp}
                    onChange={e => setTxForm({ ...txForm, triggerWhatsapp: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                </div>
                
                {txForm.triggerWhatsapp && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">WhatsApp Recipient Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +923001234567"
                      value={txForm.whatsappRecipient}
                      onChange={e => setTxForm({ ...txForm, whatsappRecipient: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow mt-2"
              >
                Post Transaction Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2b: EDIT/ADJUST AN EXISTING TRANSACTION */}
      {showEditTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 text-slate-850 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">Adjust/Edit Transaction: {editTxForm.id}</h3>
              <button
                onClick={() => setShowEditTxModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-all text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleEditTransactionSubmit} className="p-5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTxForm({ ...editTxForm, type: 'Credit' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editTxForm.type === 'Credit' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🟢 Credit (Funds In)
                </button>
                <button
                  type="button"
                  onClick={() => setEditTxForm({ ...editTxForm, type: 'Debit' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editTxForm.type === 'Debit' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🔴 Debit (Funds Out)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Channel</label>
                  <select
                    value={editTxForm.paymentMethod}
                    onChange={e => setEditTxForm({ ...editTxForm, paymentMethod: e.target.value as 'Cash' | 'Bank' })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Cash">Cash Vault</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>

                {editTxForm.paymentMethod === 'Bank' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account *</label>
                    <select
                      value={editTxForm.accountId}
                      onChange={e => setEditTxForm({ ...editTxForm, accountId: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Select Account...</option>
                      {bankAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.bankName} (Acct: ...{a.accountNumber.slice(-4)})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (RS) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    required
                    value={editTxForm.amount}
                    onChange={e => setEditTxForm({ ...editTxForm, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Transaction Category</label>
                  <select
                    value={editTxForm.category}
                    onChange={e => setEditTxForm({ ...editTxForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Salary">Salary</option>
                    <option value="Commission">Commission</option>
                    <option value="Expense">Expense</option>
                    <option value="Customer Collection">Customer Collection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Narrative / Description</label>
                <input
                  type="text"
                  placeholder="Enter details about this cash-flow ledger adjustment"
                  value={editTxForm.description}
                  onChange={e => setEditTxForm({ ...editTxForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow mt-2"
              >
                Apply Adjusted Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISBURSE SALARY / PAYROLL */}
      {showDisburseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 text-slate-850 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider">Disburse Salary & Commission</h3>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-all text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="p-5 space-y-4 text-left">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-extrabold text-slate-800">{disburseForm.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Month:</span>
                  <span className="font-bold text-slate-700">{payrollMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Salary:</span>
                  <span className="font-bold text-slate-700">RS {disburseForm.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commission:</span>
                  <span className="font-semibold text-emerald-700">+ RS {disburseForm.commissionsEarned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-800">Net Payable Amount:</span>
                  <span className="font-black font-mono text-emerald-700">RS {disburseForm.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Pay & Allowance (RS)</label>
                <input
                  type="number"
                  placeholder="Enter custom pay / allowance amount"
                  value={disburseForm.allowance || ''}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setDisburseForm(prev => ({
                      ...prev,
                      allowance: val,
                      totalAmount: prev.baseSalary + prev.commissionsEarned + val
                    }));
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Disbursement Channel</label>
                <select
                  value={disburseForm.paymentMethod}
                  onChange={e => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value as 'Cash' | 'Bank' })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Cash">Cash Vault</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              {disburseForm.paymentMethod === 'Bank' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Debit Bank Account *</label>
                  <select
                    value={disburseForm.accountId}
                    onChange={e => setDisburseForm({ ...disburseForm, accountId: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="">Select Account...</option>
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.bankName} (Avail: RS {a.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow mt-2"
              >
                Approve & Transmit Payroll
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADVANCED PRINTABLE SALARY SLIP & COMMISSION VOUCHER */}
      {selectedPayrollForSlip && (() => {
        const totalSalary = selectedPayrollForSlip.baseSalary + selectedPayrollForSlip.commissionsEarned + (selectedPayrollForSlip.allowance || 0);
        const totalInWords = numberToWords(totalSalary);
        
        const d = new Date();
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const yearStr = String(d.getFullYear());
        const dateDigits = (dayStr + monthStr + yearStr).split('');

        const qrValue = `MCF-PAYROLL-VERIFY\nVoucher ID: MCF-PAY-${selectedPayrollForSlip.id}\nEmployee: ${selectedPayrollForSlip.employeeName} (${selectedPayrollForSlip.employeeId})\nMonth: ${selectedPayrollForSlip.month}\nBase Salary: RS ${selectedPayrollForSlip.baseSalary}\nCommissions: RS ${selectedPayrollForSlip.commissionsEarned}\nAllowance: RS ${selectedPayrollForSlip.allowance || 0}\nNet Remitted: RS ${totalSalary}\nStatus: Cleared & Disbursed`;

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              
              {/* Modal Header */}
              <div className="bg-slate-50 text-slate-850 p-4 border-b border-slate-200 flex justify-between items-center no-print">
                <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> OFFICIAL STAFF REMITTANCE CHEQUE & PAYSLIP
                </span>
                <button
                  onClick={() => setSelectedPayrollForSlip(null)}
                  className="text-slate-400 hover:text-slate-700 transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Printable Voucher Canvas */}
              <div id="salary-slip-printout" className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white font-sans flex-1">
                
                {/* CHEQUE BACKDROP WRAPPER */}
                <div className="border-[3px] border-double border-emerald-800 p-6 rounded-xl relative shadow-md bg-emerald-50/20 bg-[radial-gradient(#10b981_0.7px,transparent_0.7px)] [background-size:12px_12px] overflow-hidden">
                  
                  {/* Background Watermark Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] rotate-[-15deg]">
                    <span className="text-6xl font-black tracking-widest text-emerald-950">MANHA FINANCING BANK</span>
                  </div>

                  {/* Cheque Header row */}
                  <div className="flex justify-between items-start pb-4 border-b border-emerald-800/30">
                    <div>
                      <h1 className="text-lg font-black tracking-wider text-emerald-900 uppercase">
                        Manha Digital Financing
                      </h1>
                      <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                        Staff Remittance & Salary Disbursement
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        Central Treasury Office • Voucher Ref: <span className="font-mono font-bold text-slate-800">MCF-PAY-{selectedPayrollForSlip.id}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {/* Date Grid */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-600 uppercase mr-1">DATE:</span>
                        {dateDigits.map((digit, idx) => (
                          <div 
                            key={idx} 
                            className="w-5 h-6 bg-white border border-slate-400 flex items-center justify-center font-mono text-xs font-black text-slate-800 rounded"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono">DD | MM | YYYY</span>
                    </div>
                  </div>

                  {/* Cheque Body Grid */}
                  <div className="mt-6 space-y-4 text-sm relative z-10">
                    
                    {/* Pay To Row */}
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-700 whitespace-nowrap tracking-wide uppercase text-xs">Pay To The Order Of:</span>
                      <div className="flex-1 border-b-2 border-dashed border-slate-400 pb-1 px-4">
                        <span className="font-serif italic font-extrabold text-slate-900 text-base">
                          {selectedPayrollForSlip.employeeName}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-500 text-xs">OR BEARER</span>
                    </div>

                    {/* Amount In Words Row */}
                    <div className="flex items-start gap-3">
                      <span className="font-extrabold text-slate-700 whitespace-nowrap tracking-wide uppercase text-xs mt-1">The Sum Of Rupees:</span>
                      <div className="flex-1 border-b-2 border-dashed border-slate-400 pb-1 px-4 leading-relaxed">
                        <span className="font-serif italic font-bold text-slate-800 text-sm">
                          {totalInWords}
                        </span>
                      </div>
                    </div>

                    {/* Meta Info & Amount Figures box Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 items-center">
                      <div className="md:col-span-8 grid grid-cols-2 gap-4 text-[11px] bg-white/60 p-2.5 rounded-lg border border-emerald-800/10 backdrop-blur-xs">
                        <div>
                          <p className="text-slate-500 font-semibold">Employee ID: <strong className="text-slate-800 font-mono">{selectedPayrollForSlip.employeeId}</strong></p>
                          <p className="text-slate-500 font-semibold">Designation: <strong className="text-slate-800 uppercase">{selectedPayrollForSlip.role}</strong></p>
                          <p className="text-slate-500 font-semibold">Salary Month: <strong className="text-slate-800">{selectedPayrollForSlip.month}</strong></p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold">Base Remittance: <strong className="text-slate-800">RS {selectedPayrollForSlip.baseSalary.toLocaleString()}</strong></p>
                          <p className="text-slate-500 font-semibold">Commission Payout: <strong className="text-emerald-700 font-extrabold">+ RS {selectedPayrollForSlip.commissionsEarned.toLocaleString()}</strong></p>
                          {selectedPayrollForSlip.allowance && selectedPayrollForSlip.allowance > 0 ? (
                            <p className="text-slate-500 font-semibold">Custom Pay & Allowance: <strong className="text-blue-700 font-extrabold">+ RS {selectedPayrollForSlip.allowance.toLocaleString()}</strong></p>
                          ) : null}
                          <p className="text-slate-500 font-semibold">Method: <strong className="text-slate-800 uppercase">{selectedPayrollForSlip.paymentMethod || 'Cash'}</strong></p>
                        </div>
                      </div>

                      <div className="md:col-span-4 flex justify-end">
                        <div className="bg-emerald-900 text-white p-3.5 px-6 rounded-lg border-2 border-emerald-950 shadow-sm flex items-center gap-3 w-full justify-between">
                          <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">AMOUNT</span>
                          <span className="text-lg font-mono font-black tracking-tight text-white">
                            RS {totalSalary.toLocaleString()}/=
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code, Signatures, and Verification Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 items-end border-t border-emerald-800/20">
                      {/* Left: QR Code Verification */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <QRCode value={qrValue} />
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Secure Verification</span>
                          <span className="block text-[9px] font-bold text-emerald-800 uppercase">Scan to Verify</span>
                          <span className="block text-[8px] text-slate-500 font-medium">This cheque is digitally verified and cleared by central treasury.</span>
                        </div>
                      </div>

                      {/* Right: Signature Lines */}
                      <div className="md:col-span-8 grid grid-cols-2 gap-6 text-center text-[10px]">
                        <div className="space-y-1">
                          <div className="border-b border-slate-400 h-10 flex items-end justify-center pb-1">
                            {/* Space for authorized disbursing officer signature */}
                          </div>
                          <p className="font-black text-slate-700 uppercase tracking-wide">Disbursing Officer</p>
                          <p className="text-[8px] text-slate-400">Official Stamp & Signature</p>
                        </div>
                        <div className="space-y-1">
                          <div className="border-b border-slate-400 h-10 flex items-end justify-center pb-1">
                            {/* Empty space for staff hand-drawn signature on paper */}
                          </div>
                          <p className="font-black text-slate-700 uppercase tracking-wide">Receiver's Signature</p>
                          <p className="text-[8px] text-slate-400">Employee Acknowledgment Sign</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM MICR LINE */}
                  <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-300 text-center">
                    <p className="font-mono text-xs tracking-[0.25em] text-slate-600 uppercase">
                      ⑈ {String(selectedPayrollForSlip.id).padStart(6, '0')} ⑈ 440360429 ⑆ {selectedPayrollForSlip.employeeId.slice(0, 8)} ⑈ 12
                    </p>
                  </div>

                </div>

              </div>

              {/* Modal Actions */}
              <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-end gap-3 no-print">
                <button
                  onClick={() => setSelectedPayrollForSlip(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Close Window
                </button>
                <button
                  onClick={handlePrintPaySlip}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Cheque Remittance
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
