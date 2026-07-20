/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Investor, InvestorTransaction, BankAccount, Employee } from '../types';
import { 
  Users, Plus, Search, Landmark, Coins, FileText, ArrowUpRight, ArrowDownRight, 
  Trash2, Printer, Loader2, DollarSign, UserCheck, ShieldCheck, FileSpreadsheet, Calendar
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

interface InvestorManagementProps {
  currentUser: Employee;
  bankAccounts: BankAccount[];
  refreshGlobalStats: () => void;
}

export const InvestorManagement: React.FC<InvestorManagementProps> = ({ 
  currentUser, 
  bankAccounts,
  refreshGlobalStats
}) => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<InvestorTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tab within investors: 'accounts' | 'transactions'
  const [investorSubTab, setInvestorSubTab] = useState<'accounts' | 'transactions'>('accounts');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedInvestorForTx, setSelectedInvestorForTx] = useState<Investor | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<InvestorTransaction | null>(null);

  // Forms State
  const [investorForm, setInvestorForm] = useState({
    name: '',
    cnic: '',
    address: '',
    mobileNo: '',
    sourceOfIncome: ''
  });

  const [txForm, setTxForm] = useState({
    type: 'Investment' as 'Investment' | 'Profit Credit' | 'Profit Payout' | 'Withdrawal',
    amount: '',
    paymentMethod: 'Cash' as 'Cash' | 'Bank' | 'Cheque',
    bankAccountId: '',
    chequeNumber: '',
    chequeDate: '',
    description: ''
  });

  const fetchInvestorsAndTransactions = async () => {
    setLoading(true);
    try {
      const [invRes, txRes] = await Promise.all([
        fetch('/api/investors'),
        fetch('/api/investor-transactions')
      ]);
      const invData = await invRes.json();
      const txData = await txRes.json();
      setInvestors(invData || []);
      setTransactions(txData || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading investor state.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestorsAndTransactions();
  }, []);

  const handleRegisterInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorForm.name || !investorForm.cnic || !investorForm.mobileNo) {
      showToast('Please fill all required investor fields.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...investorForm,
          recordedBy: currentUser.username
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Investor account registered successfully!', 'success');
        setShowAddModal(false);
        setInvestorForm({ name: '', cnic: '', address: '', mobileNo: '', sourceOfIncome: '' });
        fetchInvestorsAndTransactions();
        refreshGlobalStats();
      } else {
        showToast(data.message || 'Error registering investor.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorForTx) return;
    if (!txForm.amount || isNaN(Number(txForm.amount)) || Number(txForm.amount) <= 0) {
      showToast('Please specify a valid transaction amount.', 'warning');
      return;
    }
    if ((txForm.paymentMethod === 'Bank' || txForm.paymentMethod === 'Cheque') && !txForm.bankAccountId) {
      showToast('Please select a reference Bank Account.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/investor-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: selectedInvestorForTx.id,
          ...txForm,
          recordedBy: currentUser.username
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Investor transaction ledger updated successfully!', 'success');
        setShowTxModal(false);
        setTxForm({
          type: 'Investment',
          amount: '',
          paymentMethod: 'Cash',
          bankAccountId: '',
          chequeNumber: '',
          chequeDate: '',
          description: ''
        });
        
        // Load the updated arrays
        await fetchInvestorsAndTransactions();
        refreshGlobalStats();

        // Automatically open the printed cheque-style receipt!
        if (data.transaction) {
          setSelectedTxForReceipt(data.transaction);
        }
      } else {
        showToast(data.message || 'Transaction rejected by server.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete and REVERT this investor ledger transaction? This will restore cash/bank balances.')) {
      return;
    }

    try {
      const res = await fetch(`/api/investor-transactions/${id}?recordedBy=${currentUser.username}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Transaction deleted & balances reverted successfully!', 'success');
        fetchInvestorsAndTransactions();
        refreshGlobalStats();
      } else {
        showToast(data.message || 'Error deleting transaction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  const handleDeleteInvestor = async (id: string) => {
    if (!window.confirm('Delete investor account? This is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/investors/${id}?recordedBy=${currentUser.username}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Investor account removed.', 'success');
        fetchInvestorsAndTransactions();
        refreshGlobalStats();
      } else {
        showToast(data.message || 'Cannot delete. Ensure accounts balances are zero.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const formattedData = filteredInvestors.map(i => ({
      'ID': i.id,
      'Investor Name': i.name,
      'CNIC No': i.cnic,
      'Mobile Number': i.mobileNo,
      'Income Source': i.sourceOfIncome,
      'Invested Principal': i.investedAmount,
      'Accrued Dividend Balance': i.profitBalance,
      'Status': i.status,
      'Registered Date': i.createdAt
    }));
    exportToCSV(formattedData, 'manha_investors_ledger');
  };

  const handlePrintReceipt = () => {
    handlePrintLayout('printable-receipt-frame');
  };

  // Filter computations
  const filteredInvestors = investors.filter(i => {
    const query = searchQuery.toLowerCase();
    return i.name.toLowerCase().includes(query) || 
           i.cnic.includes(query) || 
           i.mobileNo.includes(query);
  });

  const filteredTransactions = transactions.filter(t => {
    const query = txSearchQuery.toLowerCase();
    const matchesSearch = t.investorName.toLowerCase().includes(query) || 
                          t.investorId.toLowerCase().includes(query) ||
                          t.id.toLowerCase().includes(query) ||
                          (t.chequeNumber && t.chequeNumber.toLowerCase().includes(query));
    
    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Balance Calculations
  const totalInvestedPool = investors.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalOutstandingProfit = investors.reduce((sum, i) => sum + i.profitBalance, 0);

  return (
    <div className="space-y-6">
      {/* HEADER STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Active Investors</p>
            <p className="text-xl font-mono font-black text-slate-800">{investors.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Investment Pool</p>
            <p className="text-xl font-mono font-black text-indigo-700">RS {totalInvestedPool.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600 border border-sky-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Accrued Profit Outstanding</p>
            <p className="text-xl font-mono font-black text-sky-700">RS {totalOutstandingProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* SUB MENU NAVIGATION */}
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex gap-1">
          <button
            onClick={() => setInvestorSubTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              investorSubTab === 'accounts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Investor Accounts Ledger
          </button>
          <button
            onClick={() => setInvestorSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              investorSubTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Capital & Profit Logs
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Investor Profile
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 1. INVESTOR LEDGERS */}
      {investorSubTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Registered Investors Registry</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time ledger profiles of capital investors, principal amounts, and monthly accrued payouts.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search name, CNIC, mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white shadow-3xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-mono">Consulting investor ledgers...</p>
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No Investors Found</p>
              <p className="text-xs text-slate-400">Create profiles to log capital transactions and monthly payouts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">ID</th>
                    <th className="p-4">Investor Profile</th>
                    <th className="p-4">CNIC No</th>
                    <th className="p-4">Source of Income</th>
                    <th className="p-4 text-right">Invested Principal</th>
                    <th className="p-4 text-right">Accrued Profit</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right no-print">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvestors.map(investor => (
                    <tr key={investor.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700">{investor.id}</td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-800 text-sm">{investor.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                          <span>Phone: {investor.mobileNo}</span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]" title={investor.address}>{investor.address || 'No Address'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{investor.cnic}</td>
                      <td className="p-4 text-slate-600 italic font-medium">{investor.sourceOfIncome || 'Unspecified'}</td>
                      <td className="p-4 text-right font-mono font-black text-indigo-700">
                        RS {investor.investedAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-sky-700">
                        RS {investor.profitBalance.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 text-[9px] rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                          {investor.status}
                        </span>
                      </td>
                      <td className="p-4 text-right no-print">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvestorForTx(investor);
                              setTxForm(prev => ({ ...prev, type: 'Investment' }));
                              setShowTxModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Add Capital
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvestorForTx(investor);
                              setTxForm(prev => ({ ...prev, type: 'Profit Credit' }));
                              setShowTxModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Credit Profit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvestorForTx(investor);
                              setTxForm(prev => ({ ...prev, type: 'Profit Payout' }));
                              setShowTxModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Payout Profit
                          </button>
                          {currentUser.role === 'Super Admin' && (
                            <button
                              onClick={() => handleDeleteInvestor(investor.id)}
                              className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. CAPITAL & PROFIT TRANSACTION LOGS */}
      {investorSubTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Investor Transaction Ledger Logs</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Comprehensive audit ledger of cash injections, dividend credits, payouts, and principal refunds.</p>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-white shadow-3xs font-bold text-slate-600"
              >
                <option value="All">All Transactions</option>
                <option value="Investment">Inward Capital Deposit</option>
                <option value="Profit Credit">Profit Dividend Accrual</option>
                <option value="Profit Payout">Profit Cash Payout</option>
                <option value="Withdrawal">Capital Principal Refund</option>
              </select>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search investor, cheque..."
                  value={txSearchQuery}
                  onChange={e => setTxSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white shadow-3xs"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-mono">Summoning ledger history...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No Transactions Recorded</p>
              <p className="text-xs text-slate-400">No records found matching filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">Receipt ID</th>
                    <th className="p-4">Execution Date</th>
                    <th className="p-4">Investor Details</th>
                    <th className="p-4">Transaction Scope</th>
                    <th className="p-4">Flow Mode</th>
                    <th className="p-4 text-right">Amount (RS)</th>
                    <th className="p-4 text-center no-print">Receipt Document</th>
                    <th className="p-4 text-right no-print">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {filteredTransactions.map(tx => {
                    const isDebit = tx.type === 'Profit Payout' || tx.type === 'Withdrawal';
                    const isNonFinancial = tx.type === 'Profit Credit';
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-800">{tx.id}</td>
                        <td className="p-4 font-mono text-[11px]">
                          {new Date(tx.date).toLocaleDateString('en-PK', {
                            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800">{tx.investorName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {tx.investorId}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-extrabold">
                            {isNonFinancial ? (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            ) : isDebit ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            <span className={isNonFinancial ? 'text-blue-700' : isDebit ? 'text-rose-700' : 'text-emerald-700'}>
                              {tx.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={tx.description}>{tx.description}</div>
                        </td>
                        <td className="p-4 font-bold">
                          <span className="uppercase tracking-wider text-[10px]">{tx.paymentMethod}</span>
                          {tx.chequeNumber ? (
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Chq: {tx.chequeNumber}</span>
                          ) : null}
                        </td>
                        <td className={`p-4 text-right font-mono font-black text-md ${
                          isNonFinancial ? 'text-blue-700' : isDebit ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {isDebit ? '-' : '+'}&nbsp;RS {tx.amount.toLocaleString()}
                        </td>
                        <td className="p-4 text-center no-print">
                          {tx.type !== 'Profit Credit' ? (
                            <button
                              onClick={() => setSelectedTxForReceipt(tx)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> Cheque Slip
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic font-semibold">Ledger Credit Voucher</span>
                          )}
                        </td>
                        <td className="p-4 text-right no-print">
                          {currentUser.role === 'Super Admin' ? (
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete & Revert Ledger Balance"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400">Lock</span>
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
      )}

      {/* MODAL: 1. ADD/REGISTER INVESTOR PROFILE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-slate-850">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-emerald-600" /> Add New Investor Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleRegisterInvestor} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Investor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Haji Muhammad Iqbal"
                  required
                  value={investorForm.name}
                  onChange={e => setInvestorForm({ ...investorForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CNIC No (Pakistan) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 42101-1234567-1"
                    required
                    value={investorForm.cnic}
                    onChange={e => setInvestorForm({ ...investorForm, cnic: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. +923001234567"
                    required
                    value={investorForm.mobileNo}
                    onChange={e => setInvestorForm({ ...investorForm, mobileNo: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source of Income</label>
                <input
                  type="text"
                  placeholder="e.g. Real Estate, Textile Exports, Retired Officer"
                  value={investorForm.sourceOfIncome}
                  onChange={e => setInvestorForm({ ...investorForm, sourceOfIncome: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Residential Address</label>
                <textarea
                  placeholder="Enter complete postal street address"
                  rows={2}
                  value={investorForm.address}
                  onChange={e => setInvestorForm({ ...investorForm, address: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all resize-none shadow-3xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-2 cursor-pointer uppercase tracking-wider"
              >
                Register Account Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 2. RECORD INVESTOR TRANSACTION */}
      {showTxModal && selectedInvestorForTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-slate-850">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5 text-emerald-600" /> Record Investor Ledger Entry
              </h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="p-5 space-y-4 text-left">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-xs">
                <p className="text-[9px] font-black uppercase text-slate-400">Selected Investor</p>
                <p className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedInvestorForTx.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-slate-500 font-bold">
                  <p>Capital Bal: <strong className="text-indigo-700 font-mono">RS {selectedInvestorForTx.investedAmount.toLocaleString()}</strong></p>
                  <p>Profit Bal: <strong className="text-sky-700 font-mono">RS {selectedInvestorForTx.profitBalance.toLocaleString()}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaction Type *</label>
                  <select
                    value={txForm.type}
                    onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none shadow-3xs font-extrabold text-slate-700"
                  >
                    <option value="Investment">Capital Deposit (Credit)</option>
                    <option value="Profit Credit">Allocate Profit (Credit)</option>
                    <option value="Profit Payout">Profit Payout (Debit)</option>
                    <option value="Withdrawal">Capital Withdrawal (Debit)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Channel *</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={e => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none shadow-3xs font-extrabold text-slate-700"
                  >
                    <option value="Cash">Cash Ledger</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Physical Cheque</option>
                  </select>
                </div>
              </div>

              {/* Bank Account Selection */}
              {(txForm.paymentMethod === 'Bank' || txForm.paymentMethod === 'Cheque') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference Corporate Account *</label>
                  <select
                    required
                    value={txForm.bankAccountId}
                    onChange={e => setTxForm({ ...txForm, bankAccountId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none shadow-3xs font-bold text-slate-700"
                  >
                    <option value="">Choose Bank Account...</option>
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.bankName} - {a.accountName} (...{a.accountNumber.slice(-4)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cheque Specific Fields */}
              {txForm.paymentMethod === 'Cheque' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cheque Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-908234"
                      required
                      value={txForm.chequeNumber}
                      onChange={e => setTxForm({ ...txForm, chequeNumber: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cheque Date *</label>
                    <input
                      type="date"
                      required
                      value={txForm.chequeDate}
                      onChange={e => setTxForm({ ...txForm, chequeDate: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 shadow-3xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount (Rupees) *</label>
                <input
                  type="number"
                  placeholder="Enter exact RS amount"
                  required
                  value={txForm.amount}
                  onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs font-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaction Narrative</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Profit Payout for June 2026 or Cash Inflow"
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all shadow-3xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-2 cursor-pointer uppercase tracking-wider"
              >
                Log Entry & Generate Slip
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 3. HIGH-FIDELITY CHEQUE-STYLE RECEIPT & PRINT SLIP */}
      {selectedTxForReceipt && (() => {
        const matchingBank = bankAccounts.find(b => b.id === selectedTxForReceipt.bankAccountId);
        const amountWords = numberToWords(selectedTxForReceipt.amount);
        const qrValue = `MANHA-INV-TX|ID:${selectedTxForReceipt.id}|INVESTOR:${selectedTxForReceipt.investorName}|TYPE:${selectedTxForReceipt.type}|AMOUNT:${selectedTxForReceipt.amount}`;
        const isPayout = selectedTxForReceipt.type === 'Profit Payout' || selectedTxForReceipt.type === 'Withdrawal';
        
        return (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
            <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn my-8 flex flex-col max-h-[95vh]">
              
              {/* Modal Top Header (Close Option at Top) */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center text-slate-800 no-print">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-600" /> Investor Voucher Receipt
                </h3>
                <button
                  onClick={() => setSelectedTxForReceipt(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer p-1"
                  title="Close Modal"
                >
                  ✕ Close
                </button>
              </div>

              {/* Scrollable Receipt Area */}
              <div className="overflow-y-auto flex-1">
                {/* Receipt Body Frame */}
                <div id="printable-receipt-frame" className="p-6 bg-slate-50 text-left relative min-h-[350px]">
                
                {/* Visual Cheque Container */}
                <div className="w-full bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border-2 border-emerald-800/20 p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
                  
                  {/* Decorative Background Lines */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#047857_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                  
                  <div>
                    {/* Top Row: Brand & Serial Header */}
                    <div className="flex justify-between items-start border-b border-emerald-800/10 pb-4">
                      <div>
                        <h2 className="text-emerald-800 font-extrabold text-lg uppercase tracking-wider font-sans">
                          Manha Digital Consumer Financing
                        </h2>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                          Treasury Division • Capital & Dividends Remittance
                        </p>
                      </div>
                      
                      <div className="text-right flex items-center gap-6">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-800/15 text-center shadow-3xs">
                          <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">TRANSACTION REFERENCE</p>
                          <p className="font-mono text-[11px] font-bold text-slate-700">{selectedTxForReceipt.id}</p>
                        </div>
                        
                        <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-800/15 text-center shadow-3xs">
                          <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">TRANSACTION DATE</p>
                          <p className="font-mono text-[11px] font-bold text-slate-700">
                            {new Date(selectedTxForReceipt.date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Voucher Title Banner */}
                    <div className="my-3 py-1 px-3.5 bg-emerald-900/10 border border-emerald-900/15 rounded-lg inline-block">
                      <span className="text-[10px] font-black text-emerald-850 uppercase tracking-widest">
                        {isPayout ? 'PROFIT PAYOUT CHEQUE VOUCHER' : 'CAPITAL INFLOW RECEIPT REGISTER'}
                      </span>
                    </div>

                    {/* Pay To Row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-black text-slate-700 text-xs tracking-wider uppercase whitespace-nowrap">
                        {isPayout ? 'PAY TO THE ORDER OF:' : 'CAPITAL RECEIVED FROM:'}
                      </span>
                      <div className="flex-1 border-b-2 border-dashed border-slate-400 pb-0.5 px-3">
                        <span className="font-serif italic font-extrabold text-slate-800 text-base">
                          {selectedTxForReceipt.investorName}
                        </span>
                      </div>
                      <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">OR BEARER</span>
                    </div>

                    {/* Amount In Words Row */}
                    <div className="flex items-start gap-4 mt-3">
                      <span className="font-black text-slate-700 text-xs tracking-wider uppercase whitespace-nowrap mt-1">
                        THE SUM OF RUPEES:
                      </span>
                      <div className="flex-1 border-b-2 border-dashed border-slate-400 pb-0.5 px-3 leading-relaxed">
                        <span className="font-serif italic font-bold text-slate-800 text-sm">
                          {amountWords}
                        </span>
                      </div>
                    </div>

                    {/* Details Box & Figures Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">
                      <div className="md:col-span-8 grid grid-cols-2 gap-4 text-[10px] bg-white/70 p-3 rounded-xl border border-emerald-800/10 backdrop-blur-xs">
                        <div>
                          <p className="text-slate-500 font-semibold">Investor ID: <strong className="text-slate-800 font-mono">{selectedTxForReceipt.investorId}</strong></p>
                          <p className="text-slate-500 font-semibold">Voucher Type: <strong className="text-emerald-800 uppercase">{selectedTxForReceipt.type}</strong></p>
                          <p className="text-slate-500 font-semibold">Channel: <strong className="text-slate-800 uppercase">{selectedTxForReceipt.paymentMethod}</strong></p>
                          {selectedTxForReceipt.chequeNumber && (
                            <p className="text-slate-500 font-semibold">Cheque No: <strong className="text-slate-800 font-mono">{selectedTxForReceipt.chequeNumber}</strong></p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold">Narrative: <strong className="text-slate-700 italic">{selectedTxForReceipt.description}</strong></p>
                          {matchingBank && (
                            <p className="text-slate-500 font-semibold">Reference Bank: <strong className="text-slate-700">{matchingBank.bankName} (...{matchingBank.accountNumber.slice(-4)})</strong></p>
                          )}
                          <p className="text-slate-500 font-semibold">Recorded By: <strong className="text-slate-800 uppercase font-mono">{selectedTxForReceipt.recordedBy}</strong></p>
                        </div>
                      </div>

                      <div className="md:col-span-4 flex justify-end">
                        <div className="bg-emerald-950 text-white p-4 px-6 rounded-xl border-2 border-emerald-900 shadow-xs flex items-center gap-3 w-full justify-between">
                          <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase">AMOUNT FIGURE</span>
                          <span className="text-lg font-mono font-black text-white">
                            RS {selectedTxForReceipt.amount.toLocaleString()}/=
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code and Signatures Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 pt-4 border-t border-emerald-800/10 items-end">
                      {/* QR */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <QRCode value={qrValue} />
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Digital Ledger Stamp</span>
                          <span className="block text-[9px] font-extrabold text-emerald-800 uppercase">Treasury Cleared</span>
                          <span className="block text-[8px] text-slate-500 leading-tight">Digital seal confirms this capital movement was successfully cleared.</span>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="md:col-span-8 grid grid-cols-2 gap-6 text-center text-[10px]">
                        <div className="space-y-1">
                          <div className="border-b border-slate-350 h-10 flex items-end justify-center pb-1">
                            <span className="font-mono text-[9px] text-slate-400">Digitally Approved</span>
                          </div>
                          <p className="font-black text-slate-700 uppercase tracking-wider">Treasury Officer</p>
                          <p className="text-[8px] text-slate-400">Authorized Sign & Seal</p>
                        </div>
                        <div className="space-y-1">
                          <div className="border-b border-slate-350 h-10 flex items-end justify-center pb-1">
                            {/* Handdrawn line */}
                          </div>
                          <p className="font-black text-slate-700 uppercase tracking-wider">Investor Acknowledgment</p>
                          <p className="text-[8px] text-slate-400">Receiver / Depositor Sign</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM MICR LINE */}
                  <div className="mt-5 pt-3 border-t-2 border-dashed border-slate-350 text-center">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-slate-600">
                      ⑈ {String(selectedTxForReceipt.id.replace(/\D/g, '')).padStart(6, '0')} ⑈ 440360429 ⑆ {selectedTxForReceipt.investorId.slice(0, 8)} ⑈ 45
                    </p>
                  </div>

                </div>

              </div>

              </div>

              {/* Actions */}
              <div className="bg-slate-100 border-t border-slate-200 p-4 flex justify-end gap-3 no-print">
                <button
                  onClick={() => setSelectedTxForReceipt(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close Receipt
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Cheque Receipt
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
