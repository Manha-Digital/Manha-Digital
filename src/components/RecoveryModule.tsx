/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Agreement, Installment, Payment, Employee } from '../types';
import { 
  Coins, Search, Printer, ShieldAlert, CheckCircle, Percent, AlertCircle, 
  UserX, PhoneCall, Send, MapPin, Scale, MessageSquare, History, Loader2,
  Users, FileText, Download, Image
} from 'lucide-react';
import { showToast, handlePrintLayout } from './UIElements';

interface RecoveryModuleProps {
  currentUser: Employee;
}

export const RecoveryModule: React.FC<RecoveryModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'defaulters'>('collection');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Collection states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAgreement, setActiveAgreement] = useState<Agreement | null>(null);
  const [portfolioSearch, setPortfolioSearch] = useState('');
  
  // Payment form states
  const [collectAmount, setCollectAmount] = useState('');
  const [collectPenalty, setCollectPenalty] = useState('');
  const [collectDiscount, setCollectDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
  const [bankName, setBankName] = useState('');
  const [collectDate, setCollectDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Defaulter Process tracking
  const [recoveryLogs, setRecoveryLogs] = useState<Array<{ id: string; customerId: string; type: string; details: string; date: string }>>([
    { id: 'REC-V-1', customerId: 'CUST-0001', type: 'SMS Warning', details: 'Automated 1st warning SMS sent for installment 2.', date: '2026-06-20' },
    { id: 'REC-V-2', customerId: 'CUST-0001', type: 'Recovery Visit', details: 'Visited residence. Applicant promised to pay by Tuesday.', date: '2026-06-25' }
  ]);
  const [visitText, setVisitText] = useState('');

  useEffect(() => {
    fetchCoreData();
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const res = await fetch('/api/company-profile');
      const data = await res.json();
      if (data && data.name) {
        setCompanyProfile(data);
      }
    } catch (err) {
      console.error('Error loading company profile:', err);
    }
  };

  const fetchCoreData = async () => {
    try {
      const agrRes = await fetch('/api/agreements');
      const agrData = await agrRes.json();
      setAgreements(agrData || []);

      const instRes = await fetch('/api/installments');
      const instData = await instRes.json();
      setInstallments(instData || []);

      const custRes = await fetch('/api/customers');
      const custData = await custRes.json();
      setCustomers(custData || []);

      const payRes = await fetch('/api/payments');
      const payData = await payRes.json();
      setPayments(payData || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Search customer & active agreements
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Search by CNIC, Customer Name, or Agreement ID
    const match = agreements.find(a => 
      a.id.toLowerCase() === searchQuery.toLowerCase() || 
      a.customerCNIC.replace(/\s|-/g, '') === searchQuery.replace(/\s|-/g, '') ||
      a.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (match) {
      const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
      const cust = customers.find(c => c.id === match.customerId);
      if (!isSuperOrManager && cust && cust.registeredBy !== currentUser.username) {
        showToast('This customer is assigned to another officer. Access restricted.', 'error');
        setActiveAgreement(null);
        return;
      }

      setActiveAgreement(match);
      setRecentReceipt(null);
      
      // Pre-calculate accrued penalty if any unpaid installments are overdue
      const penalty = calculateAccruedPenalty(match.id);
      setCollectPenalty(String(penalty));
      setCollectAmount(String(match.monthlyEMI)); // pre-populate standard monthly dues
      showToast('Agreement ledger loaded successfully.', 'success');
    } else {
      showToast('No active agreements found.', 'error');
    }
  };

  // Accrued penalty calculator (late fees!)
  const calculateAccruedPenalty = (agreementId: string): number => {
    const agr = agreements.find(a => a.id === agreementId);
    if (!agr) return 0;

    const today = new Date();
    const agrInstallments = installments.filter(i => i.agreementId === agreementId && i.status !== 'Paid');
    
    let totalPenalty = 0;
    agrInstallments.forEach(inst => {
      const due = new Date(inst.dueDate);
      if (due < today) {
        // Overdue! Calculate elapsed days
        const diffTime = Math.abs(today.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > agr.gracePeriod) {
          // Accrue penalty
          totalPenalty += (diffDays - agr.gracePeriod) * agr.lateFeeRule;
        }
      }
    });
    return totalPenalty;
  };

  // Submit payment
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgreement || !collectAmount) return;

    if (currentUser.role === 'Sales Executive') {
      showToast('Action Denied: Sales Executives are not authorized to collect payments.', 'error');
      return;
    }

    setSubmittingPayment(true);
    const payload = {
      agreementId: activeAgreement.id,
      amount: Number(collectAmount),
      penaltyAmount: Number(collectPenalty || 0),
      discountAmount: Number(collectDiscount || 0),
      paymentMethod,
      bankName: paymentMethod === 'Bank' ? bankName : undefined,
      collectedBy: currentUser.username,
      paymentDate: collectDate
    };

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        showToast('Installment payment registered successfully.', 'success');
        setRecentReceipt(data.payment);
        setShowReceiptModal(true);
        setCollectAmount('');
        setCollectPenalty('0');
        setCollectDiscount('');
        fetchCoreData(); // reload ledger
        
        // Refresh active agreement with updated balance
        setActiveAgreement(data.agreement);
      } else {
        showToast(data.message || 'Error processing payment.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Send warnings
  const handleSendWarning = (customerId: string, type: 'SMS' | 'WhatsApp') => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    const newLog = {
      id: `REC-V-${Math.floor(Math.random() * 10000)}`,
      customerId,
      type: `${type} Alert`,
      details: `Dispatched overdue warning to ${cust.phone}. Terms explained.`,
      date: new Date().toISOString().split('T')[0]
    };
    setRecoveryLogs([newLog, ...recoveryLogs]);
    showToast(`${type} warning alert dispatched.`, 'success');
  };

  // Add field visit log
  const handleSaveVisit = (customerId: string) => {
    if (!visitText) return;
    const newLog = {
      id: `REC-V-${Math.floor(Math.random() * 10000)}`,
      customerId,
      type: 'Recovery Visit',
      details: visitText,
      date: new Date().toISOString().split('T')[0]
    };
    setRecoveryLogs([newLog, ...recoveryLogs]);
    setVisitText('');
    showToast('Field visit logged to auditor database.', 'success');
  };

  // Blacklist
  const handleBlacklist = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: 'Rejected' }) // Rejected means blacklisted / blocks further agreements
      });
      const data = await response.json();
      if (data.success) {
        showToast('Customer blacklisted! Further credit blocked.', 'error');
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered defaulter agreements
  const activeDefaulters = agreements.filter(a => {
    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
    if (!isSuperOrManager) {
      const cust = customers.find(c => c.id === a.customerId);
      if (!cust || cust.registeredBy !== currentUser.username) {
        return false;
      }
    }
    // A defaulter has outstanding balance AND has any unpaid overdue installments
    const overdueCount = installments.filter(i => i.agreementId === a.id && i.status !== 'Paid' && new Date(i.dueDate) < new Date()).length;
    return overdueCount > 0;
  });

  // Print a past paid installment receipt dynamically
  const handlePrintPastReceipt = (inst: Installment) => {
    // Try to find matching payment
    const matchingPayment = payments.find(p => p.agreementId === inst.agreementId && Math.abs(p.amount - inst.amountPaid) < 10);
    
    if (matchingPayment) {
      setRecentReceipt(matchingPayment);
      setShowReceiptModal(true);
      showToast(`Loading receipt for Month ${inst.month}...`, 'success');
    } else {
      // Create a fallback beautiful receipt dynamically
      const fallbackReceipt: Payment = {
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        agreementId: inst.agreementId,
        customerId: activeAgreement?.customerId || '',
        customerName: activeAgreement?.customerName || '',
        amount: inst.amountPaid || inst.amountDue,
        penaltyAmount: 0,
        discountAmount: 0,
        paymentDate: inst.paidDate ? `${inst.paidDate}T12:00:00.000Z` : new Date().toISOString(),
        receivedBy: activeAgreement?.salesAgent || 'system',
        paymentMethod: 'Cash',
        receiptNo: `RCT-${Math.floor(100000 + Math.random() * 900000)}`
      };
      setRecentReceipt(fallbackReceipt);
      setShowReceiptModal(true);
      showToast(`Loading receipt for Month ${inst.month}...`, 'success');
    }
  };

  // Print draft payment slip/invoice for sales executives
  const handlePrintDraftSlip = (inst: Installment) => {
    const isOverdue = new Date(inst.dueDate) < new Date();
    const penalty = isOverdue ? (activeAgreement?.lateFeeRule || 1000) : 0;
    
    const draftSlip: Payment = {
      id: `SLIP-${Math.floor(1000 + Math.random() * 9000)}`,
      agreementId: inst.agreementId,
      customerId: activeAgreement?.customerId || '',
      customerName: activeAgreement?.customerName || '',
      amount: inst.amountDue,
      penaltyAmount: penalty,
      discountAmount: 0,
      paymentDate: new Date().toISOString(),
      receivedBy: currentUser.username,
      paymentMethod: 'Cash',
      receiptNo: `DRAFT-${Math.floor(100000 + Math.random() * 900000)}`
    };
    setRecentReceipt(draftSlip);
    setShowReceiptModal(true);
    showToast(`Loading installment slip for Month ${inst.month}...`, 'success');
  };

  // Download thermal receipt as high-fidelity image
  const downloadReceiptAsImage = () => {
    if (!recentReceipt) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background color: off-white paper receipt aesthetic
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative receipt borders
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(290, 10);
    ctx.moveTo(10, 670);
    ctx.lineTo(290, 670);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Header text
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    // Draw Title
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.fillText((companyProfile?.name || "MANHA FINANCING").toUpperCase(), 150, 45);
    
    ctx.font = '8px Courier New, monospace';
    ctx.fillText(companyProfile?.address || "Karachi Central Branch Terminal", 150, 62);
    ctx.fillText(`Phone: ${companyProfile?.phone || "+923001234567"}`, 150, 74);

    // separator dashes
    ctx.font = '10px Courier New, monospace';
    ctx.fillText('----------------------------------', 150, 92);

    const isDraft = recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-');
    ctx.font = 'bold 10px Courier New, monospace';
    // Changed OFFICIAL PAYMENT RECEIPT to PAYMENT RECEIPT
    ctx.fillText(isDraft ? 'DRAFT PAYMENT SLIP' : 'PAYMENT RECEIPT', 150, 108);
    ctx.fillText('----------------------------------', 150, 124);

    // Fetch agreement & installment info first to use in top metadata
    const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId) || activeAgreement;
    const agreementInstallments = installments.filter(i => i.agreementId === recentReceipt.agreementId);
    const matchingInst = agreementInstallments.find(i => {
      if (isDraft) {
        return i.status === 'Unpaid' || i.status === 'Overdue';
      }
      return i.status === 'Paid' && i.paidDate === recentReceipt.paymentDate.split('T')[0];
    }) || agreementInstallments.find(i => i.status === 'Paid') || agreementInstallments[0];

    const totalAmountVal = receiptAgreement ? receiptAgreement.totalAmount : 0;
    const installmentNoVal = matchingInst ? `Mo ${matchingInst.month}` : 'N/A';
    const totalPaidAmountVal = receiptAgreement ? (receiptAgreement.totalAmount - receiptAgreement.remainingBalance) : recentReceipt.amount;
    const remainingBalanceVal = receiptAgreement ? receiptAgreement.remainingBalance : 0;

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'N/A') return 'N/A';
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };
    const dueDateVal = matchingInst ? formatDate(matchingInst.dueDate) : 'N/A';
    const receivingDateVal = formatDate(recentReceipt.paymentDate);

    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'left';
    let yIdx = 145;
    ctx.fillText(`Receipt No:      ${recentReceipt.receiptNo}`, 20, yIdx); yIdx += 16;
    ctx.fillText(`Agreement No:    ${recentReceipt.agreementId}`, 20, yIdx); yIdx += 16;
    ctx.fillText(`Customer:        ${recentReceipt.customerName}`, 20, yIdx); yIdx += 16;
    ctx.fillText(`Officer:         @${recentReceipt.receivedBy}`, 20, yIdx); yIdx += 16;
    ctx.fillText(`Due Date:        ${dueDateVal}`, 20, yIdx); yIdx += 16;
    ctx.fillText(`Receiving Date:  ${receivingDateVal}`, 20, yIdx); yIdx += 16;

    ctx.textAlign = 'center';
    ctx.fillText('----------------------------------', 150, yIdx); yIdx += 16;

    // Render Installment Table
    ctx.textAlign = 'left';
    ctx.font = 'bold 8px Courier New, monospace';
    ctx.fillText('Instalment No#   Due Amount  Paid Amount  Remaining', 20, yIdx); yIdx += 12;
    ctx.font = '8px Courier New, monospace';
    ctx.fillText('----------------------------------------------------', 20, yIdx); yIdx += 12;

    const instNoStr = installmentNoVal;
    const dueAmtStr = `RS ${(receiptAgreement?.monthlyInstallment || 0).toLocaleString()}`;
    const paidAmtStr = `RS ${recentReceipt.amount.toLocaleString()}`;
    const remAmtStr = `RS ${Math.max(0, (receiptAgreement?.monthlyInstallment || 0) - recentReceipt.amount).toLocaleString()}`;

    ctx.fillText(instNoStr, 20, yIdx);
    ctx.fillText(dueAmtStr, 115, yIdx);
    ctx.fillText(paidAmtStr, 195, yIdx);
    ctx.fillText(remAmtStr, 260, yIdx);
    yIdx += 14;

    ctx.textAlign = 'center';
    ctx.fillText('----------------------------------', 150, yIdx); yIdx += 16;

    ctx.textAlign = 'left';
    ctx.fillText(`Installment Amount:`, 20, yIdx);
    ctx.textAlign = 'right';
    ctx.fillText(`RS ${recentReceipt.amount.toLocaleString()}`, 280, yIdx); yIdx += 16;

    ctx.textAlign = 'left';
    ctx.fillText(`Accrued Late Penalty:`, 20, yIdx);
    ctx.textAlign = 'right';
    ctx.fillText(`RS ${recentReceipt.penaltyAmount.toLocaleString()}`, 280, yIdx); yIdx += 16;

    if (recentReceipt.discountAmount > 0) {
      ctx.textAlign = 'left';
      ctx.fillText(`Discount Allowed:`, 20, yIdx);
      ctx.textAlign = 'right';
      ctx.fillText(`-RS ${recentReceipt.discountAmount.toLocaleString()}`, 280, yIdx); yIdx += 16;
    }

    ctx.textAlign = 'center';
    ctx.fillText('----------------------------------', 150, yIdx); yIdx += 14;

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.fillText(isDraft ? 'TOTAL ESTIMATED:' : 'TOTAL CASH RECEIVED:', 20, yIdx);
    ctx.textAlign = 'right';
    const total = recentReceipt.amount + recentReceipt.penaltyAmount - recentReceipt.discountAmount;
    ctx.fillText(`RS ${total.toLocaleString()}`, 280, yIdx); yIdx += 25;

    // Remaining & Total Amount at last (overall ledger summary)
    ctx.textAlign = 'left';
    ctx.font = '9px Courier New, monospace';
    ctx.fillText(`Total Amount:`, 20, yIdx);
    ctx.textAlign = 'right';
    ctx.fillText(`RS ${totalAmountVal.toLocaleString()}`, 280, yIdx); yIdx += 14;

    ctx.textAlign = 'left';
    ctx.fillText(`Total Paid So Far:`, 20, yIdx);
    ctx.textAlign = 'right';
    ctx.fillText(`RS ${totalPaidAmountVal.toLocaleString()}`, 280, yIdx); yIdx += 14;

    ctx.textAlign = 'left';
    ctx.font = 'bold 9px Courier New, monospace';
    ctx.fillText(`Remaining Balance:`, 20, yIdx);
    ctx.textAlign = 'right';
    ctx.fillText(`RS ${remainingBalanceVal.toLocaleString()}`, 280, yIdx); yIdx += 25;

    ctx.textAlign = 'center';
    ctx.font = '8px Courier New, monospace';
    if (isDraft) {
      ctx.fillText('DRAFT COPY ONLY - NOT A CASH RECEIPT', 150, yIdx); yIdx += 14;
      ctx.fillText('Please pay at cashier desk to seal.', 150, yIdx); yIdx += 14;
    } else {
      ctx.fillText(`Thank you for choosing ${companyProfile?.name || "Manha"}.`, 150, yIdx); yIdx += 14;
      ctx.fillText('Please clear next dues on time.', 150, yIdx); yIdx += 14;
    }

    // Space for Stamp
    yIdx += 15;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(90, yIdx, 120, 42);
    ctx.setLineDash([]);
    ctx.font = '7px Courier New, monospace';
    ctx.fillText('OFFICIAL STAMP', 150, yIdx + 20);
    ctx.fillText('Authorized Signature', 150, yIdx + 32);

    // Now trigger download
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `receipt_${recentReceipt.receiptNo}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Receipt downloaded as JPG successfully!', 'success');
    } catch (err) {
      console.error('Failed to export image:', err);
      showToast('Error exporting receipt as image.', 'error');
    }
  };

  return (
    <div id="recovery-module" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Coins className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Coins className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Collections & Recovery</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Recovery & Payments</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Steps 11 - 12 &bull; Process monthly installments, auto-penalize delays, print thermal receipts, and trace defaulters.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'collection' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-750 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-4 h-4" /> Collection Desk
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'defaulters' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-750 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Overdue Trace (Defaulters)
          </button>
        </div>
      </div>

      {/* TAB 1: COLLECTION DESK */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          {/* SEARCH & PORTFOLIO LAYOUT GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* COLUMN 1: PORTFOLIO CUSTOMERS DIRECTORY (1/4 columns on XL screens, Full-width on mobile) */}
            <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[600px]">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Portfolio Customers
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {currentUser.role === 'Sales Executive' ? 'Customers registered by you' : 'Access your active accounts directory'}
                </p>
              </div>

              {/* Local Directory Search */}
              <div className="my-3 relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, CNIC, or ID..."
                  value={portfolioSearch}
                  onChange={(e) => setPortfolioSearch(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Scrollable list of accounts */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                {(() => {
                  // Get portfolio agreements based on role permissions
                  const portfolioAgreements = agreements.filter(a => {
                    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager' || currentUser.role === 'Accounts';
                    if (!isSuperOrManager) {
                      const cust = customers.find(c => c.id === a.customerId);
                      // For Sales Executive, show ONLY their registered customers
                      if (currentUser.role === 'Sales Executive') {
                        return cust && cust.registeredBy === currentUser.username;
                      }
                      // For Recovery Officer, show their assigned customers
                      if (currentUser.role === 'Recovery Officer') {
                        return cust && cust.registeredBy === currentUser.username;
                      }
                    }
                    return true;
                  });

                  const filteredPortfolio = portfolioAgreements.filter(a => 
                    a.customerName.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
                    a.id.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
                    (a.customerCNIC && a.customerCNIC.includes(portfolioSearch))
                  );

                  if (filteredPortfolio.length === 0) {
                    return (
                      <div className="py-12 text-center text-[11px] text-slate-400 font-medium">
                        No portfolio accounts found.
                      </div>
                    );
                  }

                  return filteredPortfolio.map(agr => {
                    const isSelected = activeAgreement?.id === agr.id;
                    const nextUnpaid = installments
                      .filter(i => i.agreementId === agr.id && i.status !== 'Paid')
                      .sort((a, b) => a.month - b.month)[0];
                    const isOverdue = nextUnpaid && new Date(nextUnpaid.dueDate) < new Date();

                    return (
                      <button
                        key={agr.id}
                        onClick={() => {
                          setActiveAgreement(agr);
                          setRecentReceipt(null);
                          // Pre-fill
                          const penalty = calculateAccruedPenalty(agr.id);
                          setCollectPenalty(String(penalty));
                          setCollectAmount(String(agr.monthlyEMI));
                          setCollectDiscount('');
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-center cursor-pointer hover:scale-[1.01] ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm text-emerald-950 font-bold'
                            : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-nowrap flex-1 min-w-0 overflow-hidden">
                            <span className="font-bold text-slate-800 truncate whitespace-nowrap" title={agr.customerName}>{agr.customerName}</span>
                            <span className="text-slate-300 shrink-0">|</span>
                            <span className="text-[10px] text-slate-500 truncate whitespace-nowrap" title={agr.productName}>{agr.productName}</span>
                            <span className="text-slate-300 shrink-0">|</span>
                            {isOverdue ? (
                              <span className="text-red-600 font-extrabold bg-red-50 px-1 py-0.25 rounded text-[9px] whitespace-nowrap shrink-0">OVERDUE</span>
                            ) : (
                              <span className="text-emerald-700 font-mono font-bold whitespace-nowrap shrink-0">RS {agr.monthlyEMI.toLocaleString()}</span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold flex-shrink-0 whitespace-nowrap">
                            {agr.id}
                          </span>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* COLUMN 2, 3, 4: ACTIVE AGREEMENT WORKSPACE & CONTROLS (3/4 columns on XL screens) */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Folder Manual Search & Status Row */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight animate-fade-in">Manual File Search Desk</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Quickly type any Agreement Serial or National CNIC number to load folder.</p>
                  </div>
                  
                  <form onSubmit={handleSearch} className="flex flex-1 max-w-lg gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Agreement (e.g., AGR-0001) or CNIC..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Load Ledger
                    </button>
                  </form>
                </div>
              </div>

              {activeAgreement && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
              {/* Left Column: Agreement Schedule list */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activeAgreement.customerName}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Agreement: <span className="font-mono text-emerald-700 font-bold">{activeAgreement.id}</span> &bull; Plan: {activeAgreement.productName}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-[10px] text-slate-400">Remaining Balance</p>
                    <p className="text-sm font-bold text-emerald-600 font-display">RS {activeAgreement.remainingBalance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-500 font-semibold">
                        <th className="pb-2">Month</th>
                        <th className="pb-2">Due Date</th>
                        <th className="pb-2">Paid Date</th>
                        <th className="pb-2">Amount Due</th>
                        <th className="pb-2">Amount Paid</th>
                        <th className="pb-2">Late Fine</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {installments
                        .filter(i => i.agreementId === activeAgreement.id)
                        .map(inst => {
                          const isOverdue = new Date(inst.dueDate) < new Date() && inst.status !== 'Paid';
                          return (
                            <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 font-bold text-slate-800">Month {inst.month}</td>
                              <td className="py-2.5 font-mono text-slate-500">{inst.dueDate}</td>
                              <td className="py-2.5 font-mono text-emerald-700 font-bold">{inst.paidDate || '—'}</td>
                              <td className="py-2.5 font-mono text-slate-700">RS {inst.amountDue.toLocaleString()}</td>
                              <td className="py-2.5 font-mono text-emerald-600 font-semibold">RS {inst.amountPaid.toLocaleString()}</td>
                              <td className="py-2.5 font-mono text-red-600">RS {isOverdue ? activeAgreement.lateFeeRule : 0}</td>
                              <td className="py-2.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border ${
                                  inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {isOverdue ? 'Overdue' : inst.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-center">
                                {inst.status === 'Paid' ? (
                                  <button
                                    onClick={() => handlePrintPastReceipt(inst)}
                                    title="Print Receipt Slip"
                                    className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                                  >
                                    <Printer className="w-3 h-3" /> Slip
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Unpaid</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Collect Payment Box or Sales Executive Slip Drawer */}
              <div className="lg:col-span-1 space-y-6">
                {/* Customer Big Profile Card with Photo */}
                {(() => {
                  const customer = customers.find(c => c.id === activeAgreement.customerId);
                  if (!customer) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center space-y-3 animate-fade-in">
                      <div className="relative">
                        <img 
                          src={customer.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                          alt={customer.name} 
                          className="w-20 h-20 rounded-2xl object-cover shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-850 tracking-wide">{customer.name}</h4>
                        <p className="font-mono text-[9px] text-emerald-600 font-bold">{customer.id}</p>
                      </div>
                      <div className="w-full grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-3 text-slate-500 font-medium">
                        <div>
                          <span className="block font-bold uppercase text-slate-400 text-[8px]">CNIC Number</span>
                          <span className="text-slate-800 font-semibold">{customer.cnic}</span>
                        </div>
                        <div>
                          <span className="block font-bold uppercase text-slate-400 text-[8px]">Phone Number</span>
                          <span className="text-slate-800 font-semibold">{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {currentUser.role === 'Sales Executive' ? (
                  /* SALES EXECUTIVE SLIP VIEW - NO FINANCIAL ACTIVITY */
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 opacity-60" />
                    <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Installment Slip Folder
                    </h4>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                      <p className="text-center font-bold text-slate-500 border-b border-dashed border-slate-200 pb-1.5">DRAFT PAYMENT DETAILS</p>
                      {(() => {
                        const nextUnpaid = installments
                          .filter(i => i.agreementId === activeAgreement.id && i.status !== 'Paid')
                          .sort((a, b) => a.month - b.month)[0];

                        if (!nextUnpaid) {
                          return <p className="text-center py-4 text-emerald-600 font-sans text-xs">All installments paid! 🎉</p>;
                        }

                        const isOverdue = new Date(nextUnpaid.dueDate) < new Date();
                        const penalty = isOverdue ? (activeAgreement?.lateFeeRule || 1000) : 0;
                        const totalPayable = nextUnpaid.amountDue + penalty;

                        return (
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span>Installment:</span>
                              <span className="font-bold text-slate-800">Month {nextUnpaid.month}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Due Date:</span>
                              <span className="font-bold text-slate-800">{nextUnpaid.dueDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Base Amount:</span>
                              <span className="font-bold text-slate-800">RS {nextUnpaid.amountDue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>Late Penalty:</span>
                              <span>RS {penalty.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900">
                              <span>Total Payable:</span>
                              <span>RS {totalPayable.toLocaleString()}</span>
                            </div>

                            <button
                              onClick={() => handlePrintDraftSlip(nextUnpaid)}
                              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Printer className="w-4 h-4" /> Print Payment Slip
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-[10px] text-amber-800 font-medium leading-relaxed">
                        <span className="font-bold">Collection Locked:</span> Sales Executives can only print/issue installment request slips. Financial ledger updates are locked.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STANDARD CASHIER / RECOVERY OFFICER COLLECTOR CARD */
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Coins className="w-4.5 h-4.5 text-emerald-600" />
                      Collect Installment Dues
                    </h4>

                    <form onSubmit={handleCollectSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collect Amount (RS)</label>
                        <input
                          type="number"
                          required
                          value={collectAmount}
                          onChange={(e) => setCollectAmount(e.target.value)}
                          placeholder="e.g., 54166"
                          className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">late Fine</label>
                          <input
                            type="number"
                            value={collectPenalty}
                            onChange={(e) => setCollectPenalty(e.target.value)}
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-red-600 focus:outline-none focus:border-red-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">discount</label>
                          <input
                            type="number"
                            value={collectDiscount}
                            onChange={(e) => setCollectDiscount(e.target.value)}
                            placeholder="e.g., 1000"
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-emerald-700 focus:outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Collection method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank')}
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
                          >
                            <option value="Cash">Cash Drawer Book</option>
                            <option value="Bank">Direct Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Payment Date (Receiving)</label>
                          <input
                            type="date"
                            required
                            value={collectDate}
                            onChange={(e) => setCollectDate(e.target.value)}
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-emerald-500 transition-all font-semibold font-mono cursor-pointer"
                          />
                        </div>
                      </div>

                      {paymentMethod === 'Bank' && (
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium">Transferring Bank Name</label>
                          <input
                            type="text"
                            required
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g., HBL, Bank Alfalah"
                            className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                      >
                        {submittingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Register Payment <CheckCircle className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Unified High-Fidelity Receipt & Slip Modal */}
                {showReceiptModal && recentReceipt && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
                      {/* Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-') ? 'Draft Payment Slip' : 'Official Receipt'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReceiptModal(false);
                            setRecentReceipt(null);
                          }}
                          className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1 cursor-pointer transition-all hover:scale-105"
                        >
                          ✕ Close
                        </button>
                      </div>

                      {/* Download & Save Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintLayout('printable-thermal-receipt')}
                          className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" /> Save PDF / Print
                        </button>
                        <button
                          type="button"
                          onClick={downloadReceiptAsImage}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download JPG
                        </button>
                      </div>

                      {/* Thermal receipt preview */}
                      <div className="border border-slate-100 p-2 rounded-2xl bg-slate-50 flex justify-center">
                        <div id="printable-thermal-receipt" className="bg-white text-black p-4 rounded border border-gray-300 font-mono text-[10px] w-64 space-y-3.5 shadow-md">
                          <div className="text-center border-b border-dashed border-black pb-2 flex flex-col items-center">
                            {companyProfile?.logoUrl ? (
                              <img 
                                src={companyProfile.logoUrl} 
                                alt="Logo" 
                                className="h-10 w-auto mb-1.5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <h4 className="font-bold text-xs uppercase">{companyProfile?.name || "Manha Consumer Finance"}</h4>
                            <p>{companyProfile?.address || "Karachi Central Branch Terminal"}</p>
                            <p>Phone: {companyProfile?.phone || "+923001234567"}</p>
                          </div>

                          <div className="space-y-1 font-mono text-[9px]">
                            {(() => {
                              const isDraft = recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-');
                              const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId) || activeAgreement;
                              const agreementInstallments = installments.filter(i => i.agreementId === recentReceipt.agreementId);
                              const matchingInst = agreementInstallments.find(i => {
                                if (isDraft) {
                                  return i.status === 'Unpaid' || i.status === 'Overdue';
                                }
                                return i.status === 'Paid' && i.paidDate === recentReceipt.paymentDate.split('T')[0];
                              }) || agreementInstallments.find(i => i.status === 'Paid') || agreementInstallments[0];

                              const totalAmountVal = receiptAgreement ? receiptAgreement.totalAmount : 0;
                              const installmentNoVal = matchingInst ? `Mo ${matchingInst.month}` : 'N/A';
                              const totalPaidAmountVal = receiptAgreement ? (receiptAgreement.totalAmount - receiptAgreement.remainingBalance) : recentReceipt.amount;
                              const remainingBalanceVal = receiptAgreement ? receiptAgreement.remainingBalance : 0;

                              const formatDate = (dateStr: string) => {
                                if (!dateStr || dateStr === 'N/A') return 'N/A';
                                return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                              };
                              const dueDateVal = matchingInst ? formatDate(matchingInst.dueDate) : 'N/A';
                              const receivingDateVal = formatDate(recentReceipt.paymentDate);

                              return (
                                <>
                                  <div className="text-center font-bold text-[10px] tracking-widest border border-black p-1 mb-2 uppercase">
                                    {isDraft ? 'DRAFT PAYMENT SLIP' : 'PAYMENT RECEIPT'}
                                  </div>
                                  <div className="space-y-1 my-2">
                                    <div className="flex justify-between">
                                      <span className="font-bold">Receipt/Slip No:</span>
                                      <span>{recentReceipt.receiptNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-bold">Agreement No:</span>
                                      <span>{recentReceipt.agreementId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-bold">Customer:</span>
                                      <span>{recentReceipt.customerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-bold">Officer:</span>
                                      <span>@{recentReceipt.receivedBy}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-bold">Due Date:</span>
                                      <span>{dueDateVal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-bold">Receiving Date:</span>
                                      <span>{receivingDateVal}</span>
                                    </div>
                                  </div>

                                  <div className="border-t border-b border-dashed border-black py-1.5 my-2 font-mono text-[9px]">
                                    <p className="font-bold border-b border-dashed border-black pb-1.5 uppercase text-center">INSTALLMENT DETAILS</p>
                                    <table className="w-full text-left font-mono text-[9px] border-collapse mt-1">
                                      <thead>
                                        <tr className="border-b border-dashed border-black">
                                          <th className="py-1 font-bold">Instalment No#</th>
                                          <th className="py-1 font-bold text-right">Due Amount</th>
                                          <th className="py-1 font-bold text-right">Paid Amount</th>
                                          <th className="py-1 font-bold text-right">Remaining</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr className="border-b border-dashed border-black">
                                          <td className="py-1">{installmentNoVal}</td>
                                          <td className="py-1 text-right">RS {(receiptAgreement?.monthlyInstallment || 0).toLocaleString()}</td>
                                          <td className="py-1 text-right">RS {recentReceipt.amount.toLocaleString()}</td>
                                          <td className="py-1 text-right">RS {Math.max(0, (receiptAgreement?.monthlyInstallment || 0) - recentReceipt.amount).toLocaleString()}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="border-t border-b border-dashed border-black py-2 my-2 space-y-1 font-mono text-[9px]">
                            <p className="font-bold border-b border-dashed border-black pb-0.5 uppercase">TRANSACTION SUMMARY</p>
                            <div className="flex justify-between">
                              <span>Installment Amount:</span>
                              <span>RS {recentReceipt.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Accrued late penalty:</span>
                              <span>RS {recentReceipt.penaltyAmount.toLocaleString()}</span>
                            </div>
                            {recentReceipt.discountAmount > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>Discount Allowed:</span>
                                <span>- RS {recentReceipt.discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-[10px] border-t border-dashed border-black pt-1">
                              {(() => {
                                const isDraft = recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-');
                                return (
                                  <>
                                    <span>{isDraft ? 'TOTAL ESTIMATED:' : 'TOTAL CASH RECEIVED:'}</span>
                                    <span>RS {(recentReceipt.amount + recentReceipt.penaltyAmount - recentReceipt.discountAmount).toLocaleString()}</span>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Bottom Contract Stats */}
                            {(() => {
                              const isDraft = recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-');
                              const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId) || activeAgreement;
                              const totalAmountVal = receiptAgreement ? receiptAgreement.totalAmount : 0;
                              const totalPaidAmountVal = receiptAgreement ? (receiptAgreement.totalAmount - receiptAgreement.remainingBalance) : recentReceipt.amount;
                              const remainingBalanceVal = receiptAgreement ? receiptAgreement.remainingBalance : 0;

                              return (
                                <div className="border-t border-dashed border-black pt-1.5 mt-1.5 space-y-1 text-gray-700">
                                  <div className="flex justify-between">
                                    <span>Total Amount:</span>
                                    <span className="font-bold">RS {totalAmountVal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Paid So Far:</span>
                                    <span>RS {totalPaidAmountVal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-red-600">
                                    <span>Remaining Balance:</span>
                                    <span>RS {remainingBalanceVal.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="text-center text-[8px] text-gray-600 space-y-1 font-mono">
                            {recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-') ? (
                              <>
                                <p className="font-bold text-[9px] text-black">DRAFT COPY ONLY - NOT A CASH RECEIPT</p>
                                <p>Please pay at cashier desk to get official stamp.</p>
                              </>
                            ) : (
                              <>
                                <p>Thank you for choosing {companyProfile?.name || "Manha Financing"}.</p>
                                <p>Please clear your next dues on time.</p>
                              </>
                            )}

                            {/* Dotted Box for Physical Stamp */}
                            <div className="pt-6 pb-2 text-center border-t border-dashed border-gray-300 mt-4">
                              <div className="mx-auto w-24 h-12 border border-dashed border-gray-400 flex flex-col items-center justify-center text-[7px] text-gray-400 font-bold rounded bg-slate-50/50">
                                <span>OFFICIAL STAMP</span>
                              </div>
                              <p className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Authorized Signature</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* TAB 2: OVERDUE TRACE (DEFAULTERS) */}
      {activeTab === 'defaulters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left list: defaulters */}
          <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 h-[550px] overflow-y-auto space-y-3.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
              Active Overdue portfolios ({activeDefaulters.length} accounts)
            </span>

            {activeDefaulters.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Excellent! No overdue accounts logged in database.
              </div>
            ) : (
              activeDefaulters.map(agr => {
                const overdueDues = installments.filter(i => i.agreementId === agr.id && i.status !== 'Paid' && new Date(i.dueDate) < new Date());
                const overdueSum = overdueDues.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);
                
                return (
                  <button
                    key={agr.id}
                    onClick={() => { setActiveAgreement(agr); setRecentReceipt(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-center cursor-pointer ${
                      activeAgreement?.id === agr.id 
                        ? 'bg-red-50 border-red-200 text-red-900' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-nowrap flex-1 min-w-0 overflow-hidden">
                        <span className={`font-bold truncate whitespace-nowrap ${activeAgreement?.id === agr.id ? 'text-red-950' : 'text-slate-850'}`} title={agr.customerName}>{agr.customerName}</span>
                        <span className="text-slate-300 shrink-0">|</span>
                        <span className="text-[10px] text-slate-500 truncate whitespace-nowrap" title={agr.productName}>{agr.productName}</span>
                        <span className="text-slate-300 shrink-0">|</span>
                        <span className="text-red-600 font-mono font-bold whitespace-nowrap shrink-0">Overdue: RS {overdueSum.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-extrabold flex-shrink-0 whitespace-nowrap">
                        {overdueDues.length} Missed
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right workspace: defaulter contact logs & legal dispatch */}
          <div className="lg:col-span-2">
            {activeAgreement ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 font-display">Log recovery trace: {activeAgreement.customerName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Assigned Officer Terminal: @{currentUser.username}</p>
                  </div>
                  <button
                    onClick={() => handleBlacklist(activeAgreement.customerId)}
                    className="flex items-center gap-1 bg-red-650 hover:bg-red-600 text-xs text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <UserX className="w-4 h-4" /> Blacklist Credit
                  </button>
                </div>

                {/* Trace Actions row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleSendWarning(activeAgreement.customerId, 'SMS')}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-slate-700 cursor-pointer"
                  >
                    <Send className="w-5 h-5 text-emerald-600" />
                    Dispatch SMS warning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendWarning(activeAgreement.customerId, 'WhatsApp')}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-slate-700 cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 text-emerald-600 animate-pulse" />
                    Dispatch WhatsApp warning
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Legal Repossession notice printed on central console.', 'warning');
                    }}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-red-300 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-slate-700 cursor-pointer"
                  >
                    <Scale className="w-5 h-5 text-red-500" />
                    Generate Legal Notice
                  </button>
                </div>

                {/* Audit trail of visits */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600" />
                    Recovery visit & Dispatch logs
                  </h4>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {recoveryLogs
                      .filter(log => log.customerId === activeAgreement.customerId)
                      .map((log, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between text-xs">
                          <div>
                            <span className="font-bold text-emerald-700">{log.type}</span>
                            <p className="text-slate-600 mt-0.5">{log.details}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-4">{log.date}</span>
                        </div>
                      ))}
                  </div>

                  {/* Log new visit */}
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-700">Record Field recovery Officer Visit:</span>
                    <textarea
                      rows={2}
                      value={visitText}
                      onChange={(e) => setVisitText(e.target.value)}
                      placeholder="e.g., Visited shop. Met guarantor. They requested 2 days grace extension."
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveVisit(activeAgreement.customerId)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Save Visit Logs
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-16 text-center text-slate-400 text-xs h-96 flex flex-col justify-center items-center gap-3">
                <AlertCircle className="w-10 h-10 text-slate-300 animate-pulse" />
                <span>Select an active overdue account folder from the left queue to log recovery visits or send notifications.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
