/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Agreement, Payment, Expense, AuditLog, Employee } from '../types';
import { 
  FileCheck, ShieldCheck, Printer, BarChart3, TrendingUp, 
  DollarSign, FileSpreadsheet, Lock, AlertTriangle, Scale, Loader2, RefreshCw, Search
} from 'lucide-react';
import { showToast, exportToCSV, handlePrintLayout } from './UIElements';

interface ReportsProps {
  currentUser: Employee;
}

export const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'noc' | 'intelligence'>('intelligence');
  
  // NOC Search states
  const [nocSearch, setNocSearch] = useState('');
  const [nocAgreement, setNocAgreement] = useState<Agreement | null>(null);
  const [issuingNoc, setIssuingNoc] = useState(false);
  const [certifiedAgreement, setCertifiedAgreement] = useState<Agreement | null>(null);

  // Intelligence state
  const [reportType, setReportType] = useState<'p_l' | 'sales' | 'collection' | 'defaulters' | 'audits'>('p_l');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchAnalyticalData();
  }, []);

  const fetchAnalyticalData = async () => {
    try {
      const agrRes = await fetch('/api/agreements');
      const agrData = await agrRes.json();
      setAgreements(agrData || []);

      const payRes = await fetch('/api/payments');
      const payData = await payRes.json();
      setPayments(payData || []);

      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      setExpenses(expData || []);

      const auditRes = await fetch('/api/audit-logs');
      const auditData = await auditRes.json();
      setAudits(auditData || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Search agreement for NOC
  const handleNocSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const match = agreements.find(a => a.id.toLowerCase() === nocSearch.toLowerCase());
    if (match) {
      setNocAgreement(match);
      setCertifiedAgreement(null);
      showToast('Agreement record loaded for clearance audit.', 'success');
    } else {
      showToast('Agreement file not found.', 'error');
    }
  };

  // Issue Clearance NOC
  const handleIssueNoc = async (id: string) => {
    if (!nocAgreement) return;
    if (nocAgreement.remainingBalance > 0) {
      showToast('Agreement balance is not zero! Clear outstanding dues first.', 'warning');
      return;
    }

    setIssuingNoc(true);
    try {
      const response = await fetch(`/api/agreements/${id}/noc`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        showToast('NOC Approved & Clearance certificate issued.', 'success');
        setCertifiedAgreement(data.agreement);
        setNocAgreement(data.agreement);
        fetchAnalyticalData(); // refresh
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIssuingNoc(false);
    }
  };

  // Profit and Loss calculations
  const totalDownPayments = agreements.reduce((sum, a) => sum + a.downPayment, 0);
  const totalInstallmentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPenaltiesCollected = payments.reduce((sum, p) => sum + p.penaltyAmount, 0);
  const totalRevenue = totalDownPayments + totalInstallmentsCollected + totalPenaltiesCollected;

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenseAmount;

  return (
    <div id="reports-view" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BarChart3 className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Business Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Step 13 & 14 &bull; Generate official NOC clearance certificates and view dynamic corporate Profit & Loss audits.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'intelligence' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-xs' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Reports & BI Ledger
          </button>
          <button
            onClick={() => setActiveTab('noc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'noc' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-xs' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-4 h-4" /> NOC Center
          </button>
        </div>
      </div>

      {/* TAB 1: INTEGRATED BI INTELLIGENCE REPORTS */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Sub menu selectors */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700 shadow-sm">
            {[
              { type: 'p_l', label: 'Profit & Loss Sheet' },
              { type: 'sales', label: 'Sales & Lease Reports' },
              { type: 'collection', label: 'Collection Registers' },
              { type: 'defaulters', label: 'Overdue Defaulters' },
              { type: 'audits', label: 'System Audit Trails' }
            ].map(r => (
              <button
                key={r.type}
                onClick={() => setReportType(r.type as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  reportType === r.type 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* REPORT WORKSPACE CONTAINER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 text-slate-800">
            
            {/* SUB REPORT 1: CORPORATE P&L SHEET */}
            {reportType === 'p_l' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Corporate Profit & Loss Balance Sheet
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Calculated across cash flow drawers, down payments, installments, and operating debit expenses.</p>
                  </div>
                  <button
                    onClick={() => handlePrintLayout('printable-pl-statement')}
                    className="flex items-center gap-1.5 bg-white text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-350 text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Statement
                  </button>
                </div>

                {/* Print Sheet wrap */}
                <div id="printable-pl-statement" className="space-y-6">
                  <div className="print-only header text-center mb-6 text-black">
                    <h2>Manha Consumer Financing Corporation</h2>
                    <h3>Official Audit Statement of Accounts</h3>
                    <p>Financial Year: 2026-2027 &bull; Created: {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-sans uppercase text-[10px] font-bold tracking-wider">Total Revenue Collected</p>
                      <h4 className="text-lg font-bold text-emerald-700 mt-1">RS {totalRevenue.toLocaleString()}</h4>
                      <div className="mt-2 text-[10px] text-slate-500 space-y-1 font-sans">
                        <p>&bull; Down Payments: RS {totalDownPayments.toLocaleString()}</p>
                        <p>&bull; Installments EMI: RS {totalInstallmentsCollected.toLocaleString()}</p>
                        <p>&bull; Late Penalties: RS {totalPenaltiesCollected.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-sans uppercase text-[10px] font-bold tracking-wider">Operating Debit Expenses</p>
                      <h4 className="text-lg font-bold text-red-600 mt-1">RS {totalExpenseAmount.toLocaleString()}</h4>
                      <p className="text-[10px] text-slate-500 mt-2 font-sans">Deducted from general cash journals for salaries, rent, utility, and operating costs.</p>
                    </div>

                    <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
                      <p className="text-emerald-800 font-sans uppercase text-[10px] font-bold tracking-wider">Net Operating Profit</p>
                      <h4 className={`text-lg font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        RS {netProfit.toLocaleString()}
                      </h4>
                      <p className="text-[10px] text-emerald-800 mt-2 font-sans">Calculated margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}% Net margins.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB REPORT 2: LEASE SALES */}
            {reportType === 'sales' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">Active Leases & Sales Book</h3>
                    <p className="text-xs text-slate-500">Review all active consumer installment leases filed in company databases.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV(agreements, 'sales_leases_report')}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Spreadsheet
                  </button>
                </div>

                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-bold uppercase tracking-wider">Agreement ID</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Customer Name</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Item Leased</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Branch Location</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Down Payment</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Plan Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {agreements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">No agreement files registered in the system database.</td>
                        </tr>
                      ) : (
                        agreements.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 text-emerald-700 font-bold">{a.id}</td>
                            <td className="py-2.5 text-slate-800 font-bold font-sans">{a.customerName}</td>
                            <td className="py-2.5 font-sans text-slate-600">{a.productName}</td>
                            <td className="py-2.5 font-sans">{a.branch}</td>
                            <td className="py-2.5 text-right">RS {a.downPayment.toLocaleString()}</td>
                            <td className="py-2.5 text-right font-bold text-slate-800">RS {a.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB REPORT 3: PAYMENTS RECEIVED */}
            {reportType === 'collection' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">Corporate Collection Journal</h3>
                    <p className="text-xs text-slate-500">Real-time ledger logs of installment receipts recorded across all branches.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV(payments, 'collections_journal')}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Spreadsheet
                  </button>
                </div>

                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-bold uppercase tracking-wider">Receipt ID</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Date & Time</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Agreement File</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Method</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Branch Node</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Penalty</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">No receipt entries cataloged in collection journals.</td>
                        </tr>
                      ) : (
                        payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 text-slate-500">#{p.id}</td>
                            <td className="py-2.5 text-slate-600 font-sans">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="py-2.5 text-emerald-700 font-bold">{p.agreementId}</td>
                            <td className="py-2.5 font-sans"><span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">{p.paymentMethod}</span></td>
                            <td className="py-2.5 font-sans">{p.branch}</td>
                            <td className="py-2.5 text-right text-red-600">RS {p.penaltyAmount.toLocaleString()}</td>
                            <td className="py-2.5 text-right text-emerald-700 font-bold">RS {p.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB REPORT 4: OVERDUE DEFAULTERS */}
            {reportType === 'defaulters' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">Delinquent Defaulters Directory</h3>
                    <p className="text-xs text-slate-500">Live operational review of active agreements flagged with outstanding overdue installment schedules.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV(agreements.filter(a => a.remainingBalance > 0), 'overdue_liabilities')}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Spreadsheet
                  </button>
                </div>

                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-bold uppercase tracking-wider">File ID</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Guarantor Name</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Contact Phone</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Branch Area</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Recovered</th>
                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Overdue Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {agreements.filter(a => a.remainingBalance > 0).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">Clear Slate: Zero overdue customer files flagged.</td>
                        </tr>
                      ) : (
                        agreements.filter(a => a.remainingBalance > 0).map(a => {
                          const paid = a.totalAmount - a.remainingBalance;
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 text-emerald-700 font-bold">{a.id}</td>
                              <td className="py-2.5 font-sans text-slate-800 font-bold">{a.customerName}</td>
                              <td className="py-2.5 font-sans text-slate-600">{a.customerPhone}</td>
                              <td className="py-2.5 font-sans">{a.branch}</td>
                              <td className="py-2.5 text-right text-slate-500">RS {paid.toLocaleString()}</td>
                              <td className="py-2.5 text-right text-red-600 font-bold">RS {a.remainingBalance.toLocaleString()}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB REPORT 5: SYSTEM SECURITY AUDITS */}
            {reportType === 'audits' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">Corporate Activity Logs</h3>
                    <p className="text-xs text-slate-500">Centralized database audit trails tracking critical terminal transactions and maintenance events.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV(audits, 'security_audit_trail')}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Spreadsheet
                  </button>
                </div>

                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-bold uppercase tracking-wider">Timestamp</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">User Account</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Action Type</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Activity Description</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Terminal Node</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {audits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">No audit events logged in active cycle journals.</td>
                        </tr>
                      ) : (
                        audits.map(au => (
                          <tr key={au.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 text-slate-500 font-sans">{new Date(au.timestamp).toLocaleString()}</td>
                            <td className="py-2.5 text-slate-800 font-bold font-sans">@{au.username}</td>
                            <td className="py-2.5"><span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold tracking-wider uppercase border border-emerald-100">{au.action}</span></td>
                            <td className="py-2.5 font-sans text-slate-600">{au.details}</td>
                            <td className="py-2.5 font-sans">{au.ipAddress}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFICATE GENERATION WORKSPACE */}
      {activeTab === 'noc' && nocAgreement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up font-sans text-xs text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-5 h-5 text-emerald-600" /> Clearance NOC Workspace
              </h3>
              <button 
                onClick={() => setNocAgreement(null)} 
                className="text-slate-450 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono text-slate-700 font-semibold">
              <p><span className="text-slate-400">Agreement Folder:</span> {nocAgreement.id}</p>
              <p><span className="text-slate-400">Customer Name:</span> {nocAgreement.customerName} ({nocAgreement.customerCNIC})</p>
              <p><span className="text-slate-400">Leased Product:</span> {nocAgreement.productName}</p>
              <p><span className="text-slate-400">Total Plan Value:</span> RS {nocAgreement.totalAmount.toLocaleString()}</p>
              <p className={nocAgreement.remainingBalance === 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                <span className="text-slate-400 font-medium">Outstanding Dues:</span> RS {nocAgreement.remainingBalance.toLocaleString()}
              </p>
            </div>

            {nocAgreement.remainingBalance === 0 ? (
              <div className="space-y-4">
                {nocAgreement.nocIssued ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 animate-pulse" /> Official Clearance NOC Issued. Ready for Print distribution.
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handlePrintLayout('printable-noc-document')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print Certificate
                      </button>
                      <button
                        onClick={() => setNocAgreement(null)}
                        className="bg-white border border-slate-200 text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                      >
                        Exit Workspace
                      </button>
                    </div>

                    {/* PRINTABLE NOC CERTIFICATE LAYOUT */}
                    <div className="border border-slate-200 rounded-xl p-4 overflow-y-auto max-h-[350px]">
                      <div id="printable-noc-document" className="bg-white text-black p-8 rounded-2xl border-4 border-double border-black max-w-2xl mx-auto shadow-sm space-y-6 text-center font-serif">
                        <div className="border-b border-black pb-3">
                          <h2 className="text-xl font-black uppercase tracking-wider">Manha Consumer Financing Corporation</h2>
                          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Official Clearance & Release Board</p>
                        </div>

                        <div className="py-6 space-y-4 text-slate-850">
                          <h3 className="text-lg font-bold italic">No Objection Certificate (NOC)</h3>
                          <p className="text-xs leading-relaxed text-justify px-4">
                            This is to formally certify and declare that <strong>{nocAgreement.customerName}</strong> (carrying National Identity CNIC card <strong>{nocAgreement.customerCNIC}</strong>) has fully cleared and liquidated all outstanding liabilities and monthly payments against agreement ID <strong>{nocAgreement.id}</strong> concerning 1 unit of <strong>{nocAgreement.productName}</strong>.
                          </p>
                          <p className="text-xs leading-relaxed text-justify px-4">
                            All financial registers are now marked at exactly zero balance. The company relinquishes all asset re-possession rights. The customer accounts are closed in perfect standing order. No objection is held by this corporation.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-12 border-t border-gray-300 text-[10px] text-gray-600 font-sans">
                          <div className="text-left">
                            <p><strong>NOC Issue Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p><strong>Certificate ID:</strong> NOC-{nocAgreement.id}</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-700 font-black border-2 border-emerald-700 uppercase tracking-widest px-2.5 py-0.5 text-[8px] rotate-[-4deg] mb-1 font-mono">
                              RELEASE SEAL
                            </span>
                            <strong>Board of Audits Director</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => setNocAgreement(null)}
                      className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                    >
                      Cancel NOC
                    </button>
                    <button
                      onClick={() => handleIssueNoc(nocAgreement.id)}
                      disabled={issuingNoc}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      {issuingNoc ? <Loader2 className="animate-spin w-4 h-4" /> : 'Approve & Issue Certificate'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> NOC Issuance Blocked: Agreement is active with outstanding cash dues.
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setNocAgreement(null)}
                    className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                  >
                    Close Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOC Search Form when NOC tab is active */}
      {activeTab === 'noc' && !nocAgreement && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm animate-slide-in text-slate-800">
          <h3 className="text-sm font-bold text-slate-850 mb-3">Auditable NOC Search Center</h3>
          <form onSubmit={handleNocSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={nocSearch}
                onChange={(e) => setNocSearch(e.target.value)}
                placeholder="Enter Agreement ID (e.g., AGR-0001)"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
            >
              Load NOC Folder
            </button>
          </form>
          <span className="text-[10px] text-slate-400 italic mt-1.5 block font-semibold">Search for completed installment contracts to approve clearance.</span>
        </div>
      )}
    </div>
  );
};
