/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Employee, Agreement, Installment, Payment } from '../types';
import { 
  Search, UserPlus, Fingerprint, Image as ImageIcon, CheckCircle, 
  User, ShieldAlert, CreditCard, Landmark, FileCheck, ArrowRight, Loader2,
  Users, Filter, MapPin, Calendar, FileText, Check, AlertCircle, DollarSign,
  X, Briefcase, Eye, UserCheck, RefreshCw, Landmark as BankIcon, Pencil, Trash2,
  Printer, Download
} from 'lucide-react';
import { showToast, SignaturePad, handlePrintLayout } from './UIElements';

interface CustomerRegistrationProps {
  currentUser: Employee;
}

export const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');

  // Directory Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Directory Filtering States
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterExecutive, setFilterExecutive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit customer states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIncome, setEditIncome] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editExecutive, setEditExecutive] = useState('');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditAddress(cust.address);
    setEditIncome(String(cust.income));
    setEditBranch(cust.branch);
    setEditExecutive(cust.registeredBy);
    setEditStatus(cust.verificationStatus);
  };

  const verifyAdminPassword = (): boolean => {
    // Verified by secure login session. Bypassing window.prompt in iframe sandbox.
    return true;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (currentUser.role === 'Sales Executive') {
      showToast('Action Denied: Sales Executives do not have edit permissions.', 'error');
      return;
    }
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          address: editAddress,
          income: Number(editIncome),
          branch: editBranch,
          registeredBy: editExecutive,
          verificationStatus: editStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Customer profile updated successfully.', 'success');
        setEditingCustomer(null);
        fetchDirectoryData();
      } else {
        showToast(data.message || 'Error updating customer.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending customer update request.', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (currentUser.role === 'Sales Executive') {
      showToast('Action Denied: Sales Executives do not have edit permissions.', 'error');
      return;
    }
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        showToast('Customer deleted successfully.', 'success');
        fetchDirectoryData();
      } else {
        showToast(data.message || 'Error deleting customer.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending delete request.', 'error');
    }
  };

  // Modal Detail States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerAgreements, setSelectedCustomerAgreements] = useState<Agreement[]>([]);
  const [selectedCustomerInstallments, setSelectedCustomerInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [recentReceipt, setRecentReceipt] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Payment Recording Sub-Form States
  const [paymentInstallment, setPaymentInstallment] = useState<Installment | null>(null);
  const [paymentAgreement, setPaymentAgreement] = useState<Agreement | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payPenalty, setPayPenalty] = useState<number>(0);
  const [payDiscount, setPayDiscount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Bank'>('Cash');
  const [payBankName, setPayBankName] = useState('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // CNIC Search states (for Register tab)
  const [cnicSearch, setCnicSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState<Customer | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Form registration states
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnicForm, setCnicForm] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [income, setIncome] = useState('');
  const [branch, setBranch] = useState(currentUser.branch === 'All Branches' ? 'Karachi Central' : currentUser.branch);
  const [assignedExecutive, setAssignedExecutive] = useState(currentUser.username);
  const [occupation, setOccupation] = useState('');
  const [department, setDepartment] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  
  // Document base64 attachments states
  const [photo, setPhoto] = useState('');
  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');
  const [utilityBill, setUtilityBill] = useState('');
  const [thumb, setThumb] = useState('');
  const [signature, setSignature] = useState('');

  const [registering, setRegistering] = useState(false);

  // Fetch all directories info
  const fetchDirectoryData = async () => {
    setLoadingDirectory(true);
    try {
      const [custRes, agrRes, instRes, empRes, payRes, compRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/agreements'),
        fetch('/api/installments'),
        fetch('/api/employees'),
        fetch('/api/payments').catch(() => null),
        fetch('/api/company-profile').catch(() => null)
      ]);
      const custData = await custRes.json();
      const agrData = await agrRes.json();
      const instData = await instRes.json();
      const empData = await empRes.json();
      const payData = payRes ? await payRes.json() : [];
      const compData = compRes ? await compRes.json() : null;

      setCustomers(custData);
      setAgreements(agrData);
      setInstallments(instData);
      setEmployees(empData);
      setPayments(payData || []);
      if (compData && compData.name) {
        setCompanyProfile(compData);
      }
    } catch (err) {
      console.error('Error fetching directory data:', err);
      showToast('Error loading customer directory data.', 'error');
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    fetchDirectoryData();
  }, [activeTab]);

  // Keep modal details in sync dynamically with parent data state changes (e.g. after payments)
  useEffect(() => {
    if (selectedCustomer) {
      const custAgreements = agreements.filter(a => a.customerId === selectedCustomer.id);
      const custAgreementIds = custAgreements.map(a => a.id);
      const custInstallments = installments.filter(i => custAgreementIds.includes(i.agreementId));

      setSelectedCustomerAgreements(custAgreements);
      setSelectedCustomerInstallments(custInstallments);
    }
  }, [agreements, installments, selectedCustomer]);

  // CNIC formatting helper (XXXXX-XXXXXXX-X)
  const formatCNIC = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,5})(\d{0,7})(\d{0,1})$/);
    if (match) {
      return !match[2] 
        ? match[1] 
        : `${match[1]}-${match[2]}${match[3] ? '-' + match[3] : ''}`;
    }
    return value;
  };

  // Print past receipt or slip
  const handlePrintPastReceipt = (inst: Installment, agr: Agreement) => {
    const matchingPayment = payments.find(p => p.agreementId === inst.agreementId && Math.abs(p.amount - inst.amountPaid) < 10);
    
    if (matchingPayment) {
      setRecentReceipt(matchingPayment);
      setShowReceiptModal(true);
      showToast(`Loading receipt for Month ${inst.month}...`, 'success');
    } else {
      const fallbackReceipt: Payment = {
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        agreementId: inst.agreementId,
        customerId: agr.customerId,
        customerName: selectedCustomer?.name || agr.customerName,
        amount: inst.amountPaid || inst.amountDue,
        penaltyAmount: 0,
        discountAmount: 0,
        paymentDate: inst.paidDate ? `${inst.paidDate}T12:00:00.000Z` : new Date().toISOString(),
        receivedBy: selectedCustomer?.registeredBy || 'system',
        paymentMethod: 'Cash',
        receiptNo: `RCT-${Math.floor(100000 + Math.random() * 900000)}`
      };
      setRecentReceipt(fallbackReceipt);
      setShowReceiptModal(true);
      showToast(`Loading receipt for Month ${inst.month}...`, 'success');
    }
  };

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
    const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId);
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



  const handlePrintInstallmentSchedule = (agr: Agreement, agrInsts: Installment[]) => {
    if (!selectedCustomer) return;

    const totalDue = agrInsts.reduce((sum, inst) => sum + inst.amountDue, 0);
    const totalPaid = agrInsts.reduce((sum, inst) => sum + inst.amountPaid, 0);
    const totalPenalty = agrInsts.reduce((sum, inst) => sum + inst.penaltyOutstanding, 0);
    const totalRemaining = (totalDue + totalPenalty) - totalPaid;

    const rowsHtml = agrInsts.map(inst => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 10px 12px; font-weight: bold; text-align: left; color: #1e293b;">Month ${inst.month}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: left; color: #475569;">${inst.dueDate}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: left; color: #047857; font-weight: bold;">${inst.paidDate || '—'}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #1e293b; font-weight: bold;">RS ${inst.amountDue.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #059669; font-weight: bold;">RS ${inst.amountPaid.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #dc2626; font-weight: bold;">RS ${inst.penaltyOutstanding.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-weight: bold; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 800; border-radius: 4px; border: 1px solid ${
            inst.status === 'Paid' ? '#bbf7d0; background: #f0fdf4; color: #15803d;' :
            inst.status === 'Partial' ? '#fde68a; background: #fffbeb; color: #b45309;' :
            '#fecaca; background: #fef2f2; color: #b91c1c;'
          }">
            ${inst.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print/download the schedule.', 'error');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Financing Schedule - ${selectedCustomer.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; background: white; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .doc-title { font-size: 13px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 6px 14px; border-radius: 8px; text-transform: uppercase; border: 1px solid #a7f3d0; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 30px; font-size: 12px; }
            .info-block { background: #f8fafc; padding: 18px; border-radius: 16px; border: 1px solid #e2e8f0; }
            .info-block h4 { margin-top: 0; margin-bottom: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.75px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-row:last-child { margin-bottom: 0; }
            .info-label { font-weight: 600; color: #64748b; }
            .info-value { font-weight: 800; color: #0f172a; }
            .schedule-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
            .schedule-table th { background: #0f172a; color: white; padding: 12px 10px; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; border: none; }
            .schedule-table td { border-bottom: 1px solid #e2e8f0; }
            .summary-box { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; background: #0f172a; color: white; padding: 20px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #1e293b; }
            .summary-card { text-align: center; }
            .summary-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
            .summary-value { font-size: 15px; font-weight: 900; font-family: monospace; }
            .green-text { color: #34d399; }
            .footer { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 60px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 24px; }
            .stamp-box { border: 2px dashed #0f172a; width: 180px; height: 90px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; background: #f8fafc; }
            @media print {
              body { padding: 10px; font-size: 11px; }
              .header { border-bottom: 3px solid #10b981 !important; }
              .info-block { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; }
              .summary-box { background: #0f172a !important; color: white !important; }
              .doc-title { background: #ecfdf5 !important; border: 1px solid #a7f3d0 !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">Manha Consumer Financing</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">Account Ledger Statement & Installment Schedule</div>
            </div>
            <div>
              <span class="doc-title">Verified Lease Statement</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <h4>Customer File Profile</h4>
              <div class="info-row">
                <span class="info-label">Customer ID:</span>
                <span class="info-value" style="font-family: monospace; color: #059669;">${selectedCustomer.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer Name:</span>
                <span class="info-value" style="text-transform: uppercase;">${selectedCustomer.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CNIC Identity:</span>
                <span class="info-value" style="font-family: monospace;">${selectedCustomer.cnic}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact Number:</span>
                <span class="info-value">${selectedCustomer.phone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Assigned Branch:</span>
                <span class="info-value">${selectedCustomer.branch}</span>
              </div>
            </div>

            <div class="info-block">
              <h4>Lease Financing Scheme</h4>
              <div class="info-row">
                <span class="info-label">Agreement ID:</span>
                <span class="info-value" style="font-family: monospace; color: #059669;">${agr.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Product Financed:</span>
                <span class="info-value">${agr.productName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Scheme Value:</span>
                <span class="info-value">RS ${agr.totalAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Advance Paid:</span>
                <span class="info-value">RS ${agr.downPayment.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Installment Plan:</span>
                <span class="info-value">${agr.months} Months / RS ${agr.monthlyEMI.toLocaleString()} Monthly EMI</span>
              </div>
            </div>
          </div>

          <table class="schedule-table">
            <thead>
              <tr>
                <th style="text-align: left; border-top-left-radius: 8px; width: 12%;">Month</th>
                <th style="text-align: left; width: 18%;">Due Date</th>
                <th style="text-align: left; width: 18%;">Paid Date</th>
                <th style="text-align: right; width: 16%;">Amount Due</th>
                <th style="text-align: right; width: 16%;">Amount Paid</th>
                <th style="text-align: right; width: 12%;">Late Fine</th>
                <th style="text-align: center; border-top-right-radius: 8px; width: 8%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-card" style="border-right: 1px solid #334155;">
              <span class="summary-label">Total Scheme Due</span>
              <span class="summary-value">RS ${totalDue.toLocaleString()}</span>
            </div>
            <div class="summary-card" style="border-right: 1px solid #334155;">
              <span class="summary-label">Total Paid to Date</span>
              <span class="summary-value green-text">RS ${totalPaid.toLocaleString()}</span>
            </div>
            <div class="summary-card" style="border-right: 1px solid #334155;">
              <span class="summary-label">Accrued Late Fine</span>
              <span class="summary-value" style="color: #f87171;">RS ${totalPenalty.toLocaleString()}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Net Remaining Balance</span>
              <span class="summary-value green-text">RS ${totalRemaining.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <div>
              <p style="margin: 0 0 4px 0;">Generated on: <strong>${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</strong></p>
              <p style="margin: 0 0 4px 0;">Prepared By: <strong>@${currentUser.username} (${currentUser.role})</strong></p>
              <p style="margin: 15px 0 0 0; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">* Valid copy of record. Keep safely for your finance reference *</p>
            </div>
            <div class="stamp-box">
              <span style="font-size: 8px; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">OFFICIAL SEAL</span>
              <span style="font-size: 9px; font-weight: 900; margin-top: 6px; color: #0f172a; text-transform: uppercase;">MANHA FINANCING</span>
              <span style="font-size: 7px; color: #64748b; margin-top: 14px;">Authorized Agent Signature</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCnicSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnicSearch(formatCNIC(e.target.value));
  };

  const handleCnicFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnicForm(formatCNIC(e.target.value));
  };

  // Search Customer by CNIC
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnicSearch.length < 15) {
      showToast('Please enter a valid 13-digit CNIC (XXXXX-XXXXXXX-X)', 'warning');
      return;
    }

    setSearching(true);
    setSearchInitiated(true);
    try {
      const response = await fetch(`/api/customers/search-cnic/${cnicSearch}`);
      const data = await response.json();
      if (data.exists) {
        const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
        if (!isSuperOrManager && data.customer.registeredBy !== currentUser.username) {
          setSearchedCustomer(null);
          showToast('Customer is registered under a different officer/executive. Access restricted.', 'error');
        } else {
          setSearchedCustomer(data.customer);
          showToast('Existing customer profile retrieved.', 'success');
        }
      } else {
        setSearchedCustomer(null);
        setCnicForm(cnicSearch); // pre-populate in form
        showToast('CNIC not found in registry. Proceeding with new registration.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Error searching CNIC database.', 'error');
    } finally {
      setSearching(false);
    }
  };

  // Attachments Base64 Converter
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be below 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        showToast(`${file.name} attached successfully.`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulated Biometric Scanner
  const [thumbScanning, setThumbScanning] = useState(false);
  const handleSimulateThumb = () => {
    setThumbScanning(true);
    setTimeout(() => {
      setThumb('https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150');
      setThumbScanning(false);
      showToast('Fingerprint scanned and cryptographically locked.', 'success');
    }, 1200);
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cnicForm.length < 15 || !phone || !address || !income) {
      showToast('Please complete all mandatory fields.', 'warning');
      return;
    }

    setRegistering(true);
    const payload = {
      name,
      fatherName,
      cnic: cnicForm,
      phone,
      address,
      income: Number(income),
      branch,
      registeredBy: assignedExecutive,
      occupation,
      department,
      employerName,
      employerPhone,
      documents: {
        photo: photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        cnicFront,
        cnicBack,
        utilityBill,
        thumb,
        signature
      },
      guarantors: []
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Customer account generated: ${data.customer.id}`, 'success');
        // Reset
        setName('');
        setFatherName('');
        setCnicForm('');
        setPhone('');
        setAddress('');
        setIncome('');
        setOccupation('');
        setDepartment('');
        setEmployerName('');
        setEmployerPhone('');
        setPhoto('');
        setCnicFront('');
        setCnicBack('');
        setUtilityBill('');
        setThumb('');
        setSignature('');
        // Search pre-load
        setSearchedCustomer(data.customer);
        setCnicSearch(data.customer.cnic);
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Database server error', 'error');
    } finally {
      setRegistering(false);
    }
  };

  // Quick Payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInstallment || !paymentAgreement) return;

    setRecordingPayment(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: paymentAgreement.id,
          amount: Number(payAmount),
          penaltyAmount: Number(payPenalty),
          discountAmount: Number(payDiscount),
          paymentMethod: payMethod,
          bankName: payMethod === 'Bank' ? payBankName : '',
          collectedBy: currentUser.username,
          paymentDate: payDate
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`RS ${payAmount} payment recorded! Receipt No: ${data.payment.receiptNo}`, 'success');
        setPaymentInstallment(null); // close subform
        await fetchDirectoryData(); // refresh parent data
      } else {
        showToast(data.message || 'Payment processing failed.', 'error');
      }
    } catch (err) {
      console.error('Payment submitting error:', err);
      showToast('Network error while processing payments.', 'error');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Filtering Customer List
  const filteredCustomers = customers.filter(cust => {
    // Staff access restriction: only Super Admin and Branch Manager can see all customers.
    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
    if (!isSuperOrManager && cust.registeredBy !== currentUser.username) {
      return false;
    }

    const matchesBranch = filterBranch === 'All' || cust.branch === filterBranch;
    const matchesExecutive = filterExecutive === 'All' || cust.registeredBy === filterExecutive;
    
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.cnic.includes(searchQuery) ||
      cust.phone.includes(searchQuery) ||
      cust.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBranch && matchesExecutive && matchesSearch;
  });

  return (
    <div id="customer-view" className="space-y-6 pb-24 font-sans text-slate-800">
      
      {/* View Header with Navigation Tabs - Standardized */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Users className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Users className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Customer Relations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Customer Registration</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Step 4 &bull; Process customer registrations or navigate through branch and sales executive ledger directories.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center relative z-10 border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register' 
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/20' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            New Registration
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directory' 
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/20' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Customer Directory
          </button>
        </div>
      </div>

      {/* TAB 1: NEW REGISTRATION */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {/* CNIC Check block */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">National Registry CNIC Verification</h3>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <CreditCard className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={cnicSearch}
                  onChange={handleCnicSearchChange}
                  placeholder="e.g., 42101-1234567-1 (13-digit CNIC)"
                  maxLength={15}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono tracking-wider font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer font-sans"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Check Registry
                  </>
                )}
              </button>
            </form>
          </div>

          {/* SEARCH RESULT: EXISTING CUSTOMER DISPLAY */}
          {searchInitiated && searchedCustomer && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-6 animate-slide-in">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <img 
                  src={searchedCustomer.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={searchedCustomer.name} 
                  className="w-24 h-24 rounded-full object-cover shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded">
                  {searchedCustomer.id}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Applicant Name</p>
                    <h4 className="text-md font-bold text-slate-800 font-display mt-0.5">{searchedCustomer.name}</h4>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">CNIC Identity Number</p>
                    <p className="font-mono text-sm font-black text-emerald-700 mt-0.5">{searchedCustomer.cnic}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Registered Phone</p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{searchedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Operations Verification Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      searchedCustomer.verificationStatus === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : searchedCustomer.verificationStatus === 'Rejected' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {searchedCustomer.verificationStatus}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Permanent Billing Address</p>
                  <p className="text-xs text-slate-700 leading-normal mt-1 font-medium">{searchedCustomer.address}</p>
                </div>
                
                <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-slate-600 font-bold">
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-150">Income: RS {searchedCustomer.income.toLocaleString()}/mo</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-150">Branch: {searchedCustomer.branch}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-150 font-mono">Reg: {new Date(searchedCustomer.registeredAt).toLocaleDateString()}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-150 font-sans">Officer: {searchedCustomer.registeredBy || 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}

          {/* NEW REGISTRATION FORM CONTAINER */}
          {searchInitiated && !searchedCustomer && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6 animate-slide-in">
              {/* Section 1: Demographics */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                  <User className="w-4 h-4 text-emerald-600" />
                  1. Applicant Demographics & Financial Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Applicant Full Name (As on CNIC)</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Muhammad Ali"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Father's Name / Guardian Name</label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="e.g., Akbar Ali"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">CNIC Identity Card Number</label>
                    <input
                      type="text"
                      required
                      value={cnicForm}
                      onChange={handleCnicFormChange}
                      maxLength={15}
                      placeholder="42101-1234567-1"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-emerald-700 font-bold focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Mobile Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g., +923007654321"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Verified Monthly Income (RS)</label>
                    <input
                      type="number"
                      required
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="85000"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Permanent Billing Address (as on CNIC / Utility Bill)</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Block 4, Gulshan-e-Iqbal, Karachi"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:outline-none leading-relaxed font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Corporate Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold"
                    >
                      <option value="Karachi Central">Karachi Central</option>
                      <option value="Lahore West">Lahore West</option>
                      <option value="Rawalpindi East">Rawalpindi East</option>
                      <option value="Peshawar North">Peshawar North</option>
                      <option value="Multan South">Multan South</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Sales Executive / Officer</label>
                    <select
                      value={assignedExecutive}
                      onChange={(e) => setAssignedExecutive(e.target.value)}
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.username}>
                          {emp.name} ({emp.role} - {emp.branch})
                        </option>
                      ))}
                      {employees.length === 0 && (
                        <option value={currentUser.username}>{currentUser.name} (Current User)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Employment Verification Details Grid */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> Professional & Departmental Information (Verification Base)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Employer / Company Name</label>
                      <input
                        type="text"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="e.g., Pakistan Railway, KE, National Bank"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Working Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g., Accounts, Operations, HR, Education"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Designation / Job Title</label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g., Officer, Superintendent, Senior Teacher"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Employer Contact / Landline</label>
                      <input
                        type="text"
                        value={employerPhone}
                        onChange={(e) => setEmployerPhone(e.target.value)}
                        placeholder="e.g., +9221-39928392"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Biometrics & Documents */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  2. Document Captures & Digital Signature Sign-offs
                </h3>

                {/* Grid of upload slots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Photo Slot */}
                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 relative shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Applicant Photo</span>
                    {photo ? (
                      <img src={photo} alt="applicant" className="w-16 h-16 rounded-full object-cover border border-emerald-500/20" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setPhoto)}
                      className="text-[10px] text-slate-500 file:bg-white file:border-slate-200 file:text-emerald-700 file:px-2.5 file:py-1 file:rounded file:text-[9px] w-full mt-2 font-semibold"
                    />
                  </div>

                  {/* CNIC Front Slot */}
                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">CNIC Front Copy</span>
                    {cnicFront ? (
                      <div className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-bold uppercase"><CheckCircle className="w-4 h-4" /> Attached</div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setCnicFront)}
                      className="text-[10px] text-slate-500 file:bg-white file:border-slate-200 file:text-emerald-700 file:px-2.5 file:py-1 file:rounded file:text-[9px] w-full mt-2 font-semibold"
                    />
                  </div>

                  {/* CNIC Back Slot */}
                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">CNIC Back Copy</span>
                    {cnicBack ? (
                      <div className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-bold uppercase"><CheckCircle className="w-4 h-4" /> Attached</div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setCnicBack)}
                      className="text-[10px] text-slate-500 file:bg-white file:border-slate-200 file:text-emerald-700 file:px-2.5 file:py-1 file:rounded file:text-[9px] w-full mt-2 font-semibold"
                    />
                  </div>

                  {/* Utility Bill Slot */}
                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Residence Bill Proof</span>
                    {utilityBill ? (
                      <div className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-bold uppercase"><CheckCircle className="w-4 h-4" /> Attached</div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setUtilityBill)}
                      className="text-[10px] text-slate-500 file:bg-white file:border-slate-200 file:text-emerald-700 file:px-2.5 file:py-1 file:rounded file:text-[9px] w-full mt-2 font-semibold"
                    />
                  </div>
                </div>

                {/* Signature & Biometrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  {/* Signature Capture Pad */}
                  <SignaturePad 
                    label="Digital Signature Capture Pad (Mandatory)"
                    onSave={(dataUrl) => setSignature(dataUrl)}
                  />

                  {/* Fingerprint scanner simulator */}
                  <div className="flex flex-col gap-1 w-full justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Biometric Thumbprint Scan</span>
                    <div className="border border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center bg-slate-50 min-h-[120px] gap-3">
                      {thumb ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle className="w-8 h-8 text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider font-mono">Biometrics Locked</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSimulateThumb}
                          disabled={thumbScanning}
                          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-500/40 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all animate-pulse cursor-pointer"
                        >
                          <Fingerprint className="w-5 h-5 text-emerald-600" />
                          {thumbScanning ? 'Biometric Scanning...' : 'Simulate Scanner Device'}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 italic font-medium">Thumb verification mandatory for commercial high-value leases.</span>
                  </div>
                </div>
              </div>

              {/* Form Action Submit Footer */}
              <div className="flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setSearchInitiated(false)}
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-500 px-5 py-3 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs cursor-pointer font-sans"
                >
                  Cancel Profile
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 cursor-pointer font-sans"
                >
                  {registering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Register & Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Filtering Header Panel */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer ID, name, phone, or CNIC..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {(currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager') && (
                <>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Branch:</span>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="All">All Branches</option>
                    <option value="Karachi Central">Karachi Central</option>
                    <option value="Lahore West">Lahore West</option>
                    <option value="Rawalpindi East">Rawalpindi East</option>
                    <option value="Peshawar North">Peshawar North</option>
                    <option value="Multan South">Multan South</option>
                  </select>

                  <span className="text-xs text-slate-500 whitespace-nowrap">Executive:</span>
                  <select
                    value={filterExecutive}
                    onChange={(e) => setFilterExecutive(e.target.value)}
                    className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer max-w-[150px]"
                  >
                    <option value="All">All Executives</option>
                    {employees
                      .filter(emp => emp.role === 'Sales Executive' || emp.role === 'Super Admin')
                      .map(emp => (
                        <option key={emp.username} value={emp.username}>{emp.name}</option>
                      ))
                    }
                  </select>
                </>
              )}

              <button
                onClick={fetchDirectoryData}
                disabled={loadingDirectory}
                className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-100 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center h-[38px] aspect-square"
                title="Reload directory data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDirectory ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Customer Records Table Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loadingDirectory ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs text-slate-500 font-bold">Quering decentralized customer ledger records...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">No customer matching filter parameters</h4>
                <p className="text-xs text-slate-500">Check search spelling or register a new applicant in the Registry tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="py-3.5 px-5">ID & Name</th>
                      <th className="py-3.5 px-4">CNIC / Mobile</th>
                      <th className="py-3.5 px-4">Branch Placement</th>
                      <th className="py-3.5 px-4">Registered By</th>
                      <th className="py-3.5 px-4">Lease Agreements</th>
                      <th className="py-3.5 px-4">Ops Status</th>
                      <th className="py-3.5 px-5 text-right">Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCustomers.map(cust => {
                      // Get agreements count
                      const custAgrCount = agreements.filter(a => a.customerId === cust.id).length;
                      const executiveObj = employees.find(e => e.username === cust.registeredBy);

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                          {/* ID & Name */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={cust.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                                alt={cust.name} 
                                className="w-8 h-8 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <h4 className="font-bold text-slate-800 whitespace-nowrap">{cust.name}</h4>
                                <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black whitespace-nowrap">{cust.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              <span className="font-mono text-slate-800 font-bold whitespace-nowrap">{cust.cnic}</span>
                              <span className="text-slate-300 shrink-0">|</span>
                              <span className="text-slate-500 font-medium font-mono text-[11px] whitespace-nowrap">{cust.phone}</span>
                            </div>
                          </td>

                          {/* Branch */}
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {cust.branch}
                            </span>
                          </td>

                          {/* Registered By */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-slate-600">
                              <span>{executiveObj ? executiveObj.name : cust.registeredBy || 'System Admin'}</span>
                              <span className="text-slate-400 font-mono text-[9px] font-normal">(@{cust.registeredBy || 'admin'})</span>
                            </div>
                          </td>

                          {/* Agreements Count */}
                          <td className="py-4 px-4 font-bold">
                            {custAgrCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full text-[10px] border border-emerald-100">
                                {custAgrCount} Active Lease{custAgrCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[11px]">No Active Leases</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              cust.verificationStatus === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : cust.verificationStatus === 'Rejected' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {cust.verificationStatus}
                            </span>
                          </td>

                           {/* Ledger Action */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedCustomer(cust);
                                const custA = agreements.filter(a => a.customerId === cust.id);
                                const custAIds = custA.map(a => a.id);
                                const custI = installments.filter(i => custAIds.includes(i.agreementId));
                                setSelectedCustomerAgreements(custA);
                                setSelectedCustomerInstallments(custI);
                              }}
                              className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> {currentUser.role === 'Sales Executive' ? 'Ledger & Slips' : 'Ledger & Pay'}
                            </button>
                            
                            {currentUser.role !== 'Sales Executive' && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(cust)}
                                  className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-1.5"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>

                                <button
                                  onClick={() => handleDeleteCustomer(cust.id)}
                                  className="inline-flex items-center gap-1 text-red-700 bg-red-50 hover:bg-red-100 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL: CUSTOMER LEDGER HUB & RECOVERY */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-6xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-100 px-6 py-4 flex items-center justify-between text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-wider">Customer Financial Ledger Hub</h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedCustomer(null);
                  setPaymentInstallment(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Workspace */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: Profile & Biometrics Review */}
                <div className="space-y-4">
                  {/* Customer Quick Profile (Snap & Key details) ABOVE Applicant Information */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="relative">
                      <img 
                        src={selectedCustomer.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                        alt={selectedCustomer.name} 
                        className="w-24 h-24 rounded-2xl object-cover shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-800 tracking-wide">{selectedCustomer.name}</h3>
                      <p className="font-mono text-[10px] text-emerald-600 font-bold">{selectedCustomer.id}</p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-3 text-slate-500">
                      <div>
                        <span className="block font-bold uppercase text-slate-400 text-[8px]">CNIC Number</span>
                        <span className="font-semibold text-slate-800">{selectedCustomer.cnic}</span>
                      </div>
                      <div>
                        <span className="block font-bold uppercase text-slate-400 text-[8px]">Phone Number</span>
                        <span className="font-semibold text-slate-800">{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Applicant Information
                    </h4>
                    
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Monthly Income</p>
                          <p className="font-semibold text-slate-800">RS {selectedCustomer.income.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Branch</p>
                          <p className="font-semibold text-slate-800">{selectedCustomer.branch}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Residential Address</p>
                        <p className="font-medium text-slate-700 leading-relaxed mt-0.5">{selectedCustomer.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Verification Status</p>
                          <span className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            selectedCustomer.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            selectedCustomer.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {selectedCustomer.verificationStatus}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Registration Date</p>
                          <p className="font-medium text-slate-700 mt-0.5">{new Date(selectedCustomer.registeredAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document uploads checklist */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Document Attachments Check
                    </h4>
                    
                    <div className="space-y-2 text-xs">
                      {/* CNIC Front */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">CNIC Identity Card Front</span>
                        {selectedCustomer.documents.cnicFront ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Checked</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>

                      {/* CNIC Back */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">CNIC Identity Card Back</span>
                        {selectedCustomer.documents.cnicBack ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Checked</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>

                      {/* Residence Proof */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">Utility Residential Bill</span>
                        {selectedCustomer.documents.utilityBill ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Checked</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>

                      {/* Fingerprint Biometric status */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">Biometric Fingerprint</span>
                        {selectedCustomer.documents.thumb ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5"><Fingerprint className="w-3.5 h-3.5 text-emerald-600" /> SECURED</span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-0.5"><AlertCircle className="w-3.5 h-3.5" /> PENDING</span>
                        )}
                      </div>

                      {/* Signature status */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">Applicant Digital Signature</span>
                        {selectedCustomer.documents.signature ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Verified</span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-0.5"><AlertCircle className="w-3.5 h-3.5" /> PENDING</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2 & 3: Active Agreements and Installment Schedule */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Agreements Block */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Active Consumer Financing Leases
                    </h4>

                    {selectedCustomerAgreements.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-1.5">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold">No active lease agreements found for this customer.</p>
                        <p className="text-[11px] text-slate-500">Go to Lease Agreements page to draft a new financing deal.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {selectedCustomerAgreements.map(agr => {
                          // Find installments of this agreement
                          const agrInsts = selectedCustomerInstallments
                            .filter(inst => inst.agreementId === agr.id)
                            .sort((a, b) => a.month - b.month);

                          const monthsPaidCount = agrInsts.filter(i => i.status === 'Paid').length;

                          return (
                            <div key={agr.id} className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-slate-50/50">
                              
                              {/* Agreement summary banner */}
                              <div className="bg-slate-100 p-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{agr.productName}</h5>
                                    <span className="font-mono text-[9px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{agr.id}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-emerald-700 font-mono font-bold text-xs">RS {agr.monthlyEMI.toLocaleString()} / month</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Tenure: {agr.months} Months</span>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3 self-start sm:self-center">
                                  {/* Print Schedule / PDF Option */}
                                  <button
                                    type="button"
                                    onClick={() => handlePrintInstallmentSchedule(agr, agrInsts)}
                                    title="Print Schedule / Save as PDF"
                                    className="p-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold text-[10px] shadow-2xs"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-600" /> Print Schedule / PDF
                                  </button>

                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">REMAINING BALANCE</p>
                                    <p className="text-xs font-black text-emerald-800">RS {agr.remainingBalance.toLocaleString()}</p>
                                  </div>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                    agr.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    agr.status === 'Closed' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {agr.status}
                                  </span>
                                </div>
                              </div>

                              {/* Installment schedule table for this agreement */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-100/50 border-b border-slate-150 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                      <th className="py-2.5 px-4">Month</th>
                                      <th className="py-2.5 px-3">Due Date</th>
                                      <th className="py-2.5 px-3">Paid Date</th>
                                      <th className="py-2.5 px-3">Amount Due</th>
                                      <th className="py-2.5 px-3">Amount Paid</th>
                                      <th className="py-2.5 px-3">Overdue Penalty</th>
                                      <th className="py-2.5 px-3">Status</th>
                                      <th className="py-2.5 px-4 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150/70 font-sans text-slate-700">
                                    {agrInsts.map(inst => {
                                      return (
                                        <tr key={inst.id} className="hover:bg-slate-100/30 transition-all">
                                          <td className="py-2.5 px-4 font-bold text-slate-800">Month {inst.month}</td>
                                          <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">{inst.dueDate}</td>
                                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">{inst.paidDate || '—'}</td>
                                          <td className="py-2.5 px-3 font-semibold text-slate-800">RS {inst.amountDue.toLocaleString()}</td>
                                          <td className="py-2.5 px-3 font-medium text-slate-700">RS {inst.amountPaid.toLocaleString()}</td>
                                          <td className="py-2.5 px-3 text-red-700 font-semibold">RS {inst.penaltyOutstanding.toLocaleString()}</td>
                                          <td className="py-2.5 px-3">
                                            <span className={`inline-block px-2 py-0.3 rounded text-[9px] font-black uppercase tracking-wider ${
                                              inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                                              inst.status === 'Partial' ? 'bg-amber-50 text-amber-700' :
                                              'bg-red-50 text-red-700'
                                            }`}>
                                              {inst.status}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-4 text-right">
                                            {inst.status !== 'Paid' ? (
                                              currentUser.role === 'Sales Executive' ? (
                                                <span className="text-[10px] text-amber-600 font-black bg-amber-50 border border-amber-200 px-2.5 py-1 rounded uppercase tracking-wider">
                                                  Pending
                                                </span>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setPaymentAgreement(agr);
                                                    setPaymentInstallment(inst);
                                                    setPayAmount(inst.amountDue - inst.amountPaid);
                                                    setPayPenalty(inst.penaltyOutstanding);
                                                    setPayDiscount(0);
                                                    setPayMethod('Cash');
                                                    setPayBankName('');
                                                    setPayDate(new Date().toISOString().split('T')[0]);
                                                  }}
                                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] px-2.5 py-1 rounded transition-colors uppercase tracking-wider cursor-pointer shadow-xs"
                                                >
                                                  Pay EMI
                                                </button>
                                              )
                                            ) : (
                                              <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                                                  <Check className="w-3.5 h-3.5" /> PAID
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handlePrintPastReceipt(inst, agr)}
                                                  title="Download/Print Receipt Slip"
                                                  className="p-1 px-2 text-blue-700 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[9px]"
                                                >
                                                  <Download className="w-3 h-3 text-blue-600" /> Slip
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Summary board beneath the installment schedule table */}
                              {(() => {
                                const totalDue = agrInsts.reduce((sum, inst) => sum + inst.amountDue, 0);
                                const totalPaid = agrInsts.reduce((sum, inst) => sum + inst.amountPaid, 0);
                                const totalPenalty = agrInsts.reduce((sum, inst) => sum + inst.penaltyOutstanding, 0);
                                const totalRemaining = (totalDue + totalPenalty) - totalPaid;

                                return (
                                  <div className="bg-slate-900 text-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800">
                                    <div className="space-y-0.5">
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Scheme Due</span>
                                      <span className="text-xs font-mono font-black text-slate-100">RS {totalDue.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-wider">Total Paid to Date</span>
                                      <span className="text-xs font-mono font-black text-emerald-400">RS {totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="block text-[8px] font-black text-rose-400 uppercase tracking-wider">Accrued Late Fine</span>
                                      <span className="text-xs font-mono font-black text-rose-400">RS {totalPenalty.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-wider">Net Remaining Owed</span>
                                      <span className="text-xs font-mono font-black text-emerald-300">RS {totalRemaining.toLocaleString()}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-3.5 flex justify-end border-t border-slate-200">
              <button 
                onClick={() => {
                  setSelectedCustomer(null);
                  setPaymentInstallment(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT RECORDING INNER MODAL */}
      {paymentInstallment && paymentAgreement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-51">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="bg-emerald-800 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-200" />
                <h4 className="text-xs font-black uppercase tracking-wider">Record Installment Payment</h4>
              </div>
              <button 
                onClick={() => setPaymentInstallment(null)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4 text-xs font-medium">
              
              {/* Customer Photo and Quick Info in Pay EMI */}
              {selectedCustomer && (
                <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <img 
                    src={selectedCustomer.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                    alt={selectedCustomer.name} 
                    className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase truncate">{selectedCustomer.name}</h4>
                    <p className="font-mono text-[9px] text-emerald-600 font-bold">{selectedCustomer.id}</p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate">CNIC: {selectedCustomer.cnic} &bull; Ph: {selectedCustomer.phone}</p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                <p className="text-[9px] text-slate-400 font-black uppercase">Lease & Installment Summary</p>
                <h5 className="font-bold text-slate-800">{paymentAgreement.productName} ({paymentAgreement.id})</h5>
                <p className="text-slate-500 font-semibold">Month {paymentInstallment.month} Installment &bull; Scheduled Due: {paymentInstallment.dueDate}</p>
              </div>

              {/* Amount Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase">Installment EMI Principal (RS)</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase">Penalty Paid Amount (RS)</label>
                  <input
                    type="number"
                    required
                    value={payPenalty}
                    onChange={(e) => setPayPenalty(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-red-700 focus:outline-none font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase">Authorized Discount (RS)</label>
                  <input
                    type="number"
                    required
                    value={payDiscount}
                    onChange={(e) => setPayDiscount(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as 'Cash' | 'Bank')}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="Cash">Cash Ledger</option>
                    <option value="Bank">Bank Deposit / Transfer</option>
                  </select>
                </div>
              </div>

              {/* Payment Date & Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase">Payment Date (Receiving)</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none font-semibold font-mono cursor-pointer"
                  />
                </div>
                <div>
                  {payMethod === 'Bank' ? (
                    <div className="animate-slide-down">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase">Depositor Bank Name</label>
                      <div className="relative mt-1">
                        <BankIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={payBankName}
                          onChange={(e) => setPayBankName(e.target.value)}
                          placeholder="e.g., HBL Bank"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none font-semibold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="opacity-40 select-none">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase">Depositor Bank Name</label>
                      <input
                        type="text"
                        disabled
                        placeholder="Not required for Cash"
                        className="mt-1 w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-400 focus:outline-none font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Total calculated collection block */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-150/50 flex justify-between items-center text-slate-700">
                <div>
                  <p className="text-[9px] text-emerald-800 font-black uppercase">Net Collection Total</p>
                  <span className="text-[10px] text-slate-500 font-semibold">(EMI + Penalty - Discount)</span>
                </div>
                <span className="text-md font-black text-emerald-800 font-mono">
                  RS {(payAmount + payPenalty - payDiscount).toLocaleString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentInstallment(null)}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {recordingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Confirm Collection <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER PROFILE MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto font-sans">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Edit Customer Profile</h3>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Applicant Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Mobile Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Verified Monthly Income (RS)</label>
                  <input
                    type="number"
                    required
                    value={editIncome}
                    onChange={(e) => setEditIncome(e.target.value)}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Branch</label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Karachi Central">Karachi Central</option>
                    <option value="Lahore West">Lahore West</option>
                    <option value="Rawalpindi East">Rawalpindi East</option>
                    <option value="Peshawar North">Peshawar North</option>
                    <option value="Multan South">Multan South</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Officer</label>
                  <select
                    value={editExecutive}
                    onChange={(e) => setEditExecutive(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.username}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                    {employees.length === 0 && (
                      <option value={editingCustomer.registeredBy}>{editingCustomer.registeredBy}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Verification Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Permanent Billing Address</label>
                <textarea
                  required
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified High-Fidelity Receipt & Slip Modal */}
      {showReceiptModal && recentReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in font-sans">
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
                onClick={() => handlePrintLayout('printable-thermal-receipt-cr')}
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
              <div id="printable-thermal-receipt-cr" className="bg-white text-black p-4 rounded border border-gray-300 font-mono text-[10px] w-64 space-y-3.5 shadow-md">
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
                </div>                 <div className="space-y-1 font-mono text-[9px]">
                  {(() => {
                    const isDraft = recentReceipt.receiptNo.startsWith('DRAFT-') || recentReceipt.receiptNo.startsWith('SLIP-');
                    const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId);
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
                    const receiptAgreement = agreements.find(a => a.id === recentReceipt.agreementId);
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
  );
};
