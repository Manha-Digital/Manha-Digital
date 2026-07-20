/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { 
  Building2, Users, Coins, AlertCircle, CheckCircle, ArrowUpRight, 
  MapPin, Loader2, RefreshCw, BarChart2, TrendingUp, HelpCircle, X, ShieldAlert
} from 'lucide-react';
import { showToast } from './UIElements';

interface BranchEmployee {
  name: string;
  role: string;
  department: string;
  status: string;
}

interface BranchStats {
  branchName: string;
  managerName: string;
  employeesCount: number;
  employees: BranchEmployee[];
  customersCount: number;
  totalAmount: number;
  pendingAmount: number;
  recoveredAmount: number;
  monthlyRecoverableAmount: number;
  monthlyRecoveredAmount: number;
  overdueCustomersCount: number;
  defaulterCustomersCount: number;
}

interface BranchManagementProps {
  currentUser: Employee;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<BranchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<BranchStats | null>(null);

  const fetchBranchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branch-management/stats');
      const data = await res.json();
      setStats(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading branch stats.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchStats();
  }, []);

  const filteredStats = stats.filter(s => 
    s.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregates
  const totalCustomers = stats.reduce((acc, curr) => acc + curr.customersCount, 0);
  const totalPortfolio = stats.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPending = stats.reduce((acc, curr) => acc + curr.pendingAmount, 0);
  const totalRecovered = stats.reduce((acc, curr) => acc + curr.recoveredAmount, 0);
  const overallRecoveryRate = totalPortfolio > 0 ? Math.round((totalRecovered / totalPortfolio) * 100) : 0;

  return (
    <div id="branch-management-module" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Building2 className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Branch Registry & Performance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Branch Management</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Real-time stats of active customer accounts, overall investment portfolio, recovery rates, and pending liabilities across enterprise locations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={fetchBranchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            )}
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Overview Aggregates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Portfolio */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Investment Portfolio</p>
              <h3 className="text-lg font-black font-mono text-slate-800 mt-1">
                RS {totalPortfolio.toLocaleString()}
              </h3>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
            <TrendingUp className="w-3 h-3" /> Cumulative Value
          </div>
        </div>

        {/* Total Recovered */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Recovered Amount</p>
              <h3 className="text-lg font-black font-mono text-emerald-700 mt-1">
                RS {totalRecovered.toLocaleString()}
              </h3>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded w-fit">
            Recovery Efficiency: {overallRecoveryRate}%
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Outstanding Pending</p>
              <h3 className="text-lg font-black font-mono text-amber-700 mt-1">
                RS {totalPending.toLocaleString()}
              </h3>
            </div>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded w-fit">
            Active Collection Dues
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Customers across Branches</p>
              <h3 className="text-lg font-black font-mono text-slate-800 mt-1">
                {totalCustomers} Accounts
              </h3>
            </div>
            <span className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[9px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded w-fit">
            Verified Customer Files
          </div>
        </div>

        {/* Overall recovery percentage */}
        <div className="bg-emerald-800 text-white p-4 rounded-xl flex flex-col justify-between shadow-sm border border-emerald-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-emerald-250 font-bold uppercase tracking-wider">Average Recovery Rate</p>
              <h3 className="text-2xl font-black font-mono text-emerald-300 mt-1">
                {overallRecoveryRate}%
              </h3>
            </div>
            <span className="p-2 bg-emerald-750 text-emerald-300 rounded-lg border border-emerald-700">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-emerald-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${overallRecoveryRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Stats Ledger Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-800">Branch Ledger Breakdown</span>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Branch Location</th>
                <th className="p-4">Branch Manager</th>
                <th className="p-4 text-center">Customers Count</th>
                <th className="p-4 text-right">Total Agreement Value</th>
                <th className="p-4 text-right">Recovered Payment</th>
                <th className="p-4 text-right">Pending Outstanding</th>
                <th className="p-4 text-center w-40">Recovery Progress</th>
                <th className="p-4 text-center">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading operational branch registers...
                    </div>
                  </td>
                </tr>
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching branch registers found.
                  </td>
                </tr>
              ) : (
                filteredStats.map(branch => {
                  const recoveryRate = branch.totalAmount > 0 
                    ? Math.round((branch.recoveredAmount / branch.totalAmount) * 100) 
                    : 0;

                  return (
                    <tr 
                      key={branch.branchName} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedBranch(branch)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{branch.branchName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider">Active</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{branch.managerName || 'Not Assigned'}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{branch.employeesCount || 0} Employees</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200/50 font-mono font-bold">
                          {branch.customersCount}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-850">
                        RS {branch.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">
                        RS {branch.recoveredAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-amber-700">
                        RS {branch.pendingAmount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono">
                            <span>{recoveryRate}% Recovered</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className={`h-full ${
                                recoveryRate >= 80 ? 'bg-emerald-500' :
                                recoveryRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${recoveryRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBranch(branch);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/50 rounded-lg text-[10px] font-bold tracking-tight transition-all shadow-sm cursor-pointer inline-flex items-center gap-1 animate-all"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED SEPARATE BRANCH PERFORMANCE MODAL */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedBranch.branchName}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Branch Active</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Branch Manager: <span className="text-slate-800 font-bold">{selectedBranch.managerName}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBranch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              
              {/* Performance Indicator Notice */}
              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Branch Performance Report Overview</h4>
                  <p className="text-[11px] text-emerald-800 font-medium">This comprehensive diagnostic is calculated from verified agreements, staff registry profiles, and dynamic payment schedules.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 font-bold block">RECOVERY RATE</span>
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    {selectedBranch.totalAmount > 0 ? Math.round((selectedBranch.recoveredAmount / selectedBranch.totalAmount) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* SECTION 1: CORE PORTFOLIO STATS (4 GRID CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Portfolio */}
                <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Agreement Value</span>
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-base font-black font-mono text-slate-800">RS {selectedBranch.totalAmount.toLocaleString()}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total sales financed</p>
                  </div>
                </div>

                {/* Card 2: Recovered */}
                <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Recovered</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-base font-black font-mono text-emerald-700">RS {selectedBranch.recoveredAmount.toLocaleString()}</h5>
                    <p className="text-[10px] text-emerald-500 font-semibold uppercase font-sans">Cleared payments</p>
                  </div>
                </div>

                {/* Card 3: Remaining Balance */}
                <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Remaining Balance</span>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="text-base font-black font-mono text-amber-700">RS {selectedBranch.pendingAmount.toLocaleString()}</h5>
                    <p className="text-[10px] text-amber-500 font-semibold uppercase font-sans">Remaining portfolio</p>
                  </div>
                </div>

                {/* Card 4: Customers Count */}
                <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Customers</span>
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h5 className="text-base font-black font-mono text-slate-800">{selectedBranch.customersCount} Files</h5>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Active customer base</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: MONTHLY RECOVERY DEMANDS & COLLECTION TARGETS */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Current Month Collection target & EMIs</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recoverable target */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Recoverable Amount</span>
                    <h5 className="text-lg font-black font-mono text-slate-800">RS {selectedBranch.monthlyRecoverableAmount.toLocaleString()}</h5>
                    <p className="text-[9px] text-slate-450 font-medium">Sum of all EMI installments demanded in current month.</p>
                  </div>

                  {/* Recovered so far */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Recovered Amount</span>
                    <h5 className="text-lg font-black font-mono text-emerald-700">RS {selectedBranch.monthlyRecoveredAmount.toLocaleString()}</h5>
                    <p className="text-[9px] text-slate-450 font-medium">Payments collected against this month's installments.</p>
                  </div>

                  {/* Recovery achievement progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-500 uppercase">MONTHLY COLLECTION RATE</span>
                      <span className="text-emerald-700 font-mono">
                        {selectedBranch.monthlyRecoverableAmount > 0 
                          ? Math.round((selectedBranch.monthlyRecoveredAmount / selectedBranch.monthlyRecoverableAmount) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div 
                        className="h-full bg-emerald-600"
                        style={{ 
                          width: `${selectedBranch.monthlyRecoverableAmount > 0 
                            ? Math.min(100, Math.round((selectedBranch.monthlyRecoveredAmount / selectedBranch.monthlyRecoverableAmount) * 100))
                            : 0}%` 
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">Target progress should exceed 90% by month end.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RISK & HEALTH ASSESSMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Overdue Customers */}
                <div className={`p-4 border rounded-xl flex items-start gap-3 shadow-sm ${
                  selectedBranch.overdueCustomersCount > 0 
                    ? 'bg-amber-50/55 border-amber-200/70 text-amber-950' 
                    : 'bg-emerald-50/40 border-emerald-200/50 text-emerald-950'
                }`}>
                  <div className={`p-1.5 rounded-lg border ${
                    selectedBranch.overdueCustomersCount > 0 
                      ? 'bg-amber-100/75 border-amber-200 text-amber-600' 
                      : 'bg-emerald-100 border-emerald-200 text-emerald-600'
                  }`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Overdue Accounts Risk</h4>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-black font-mono">{selectedBranch.overdueCustomersCount}</span>
                      <span className="text-xs font-semibold text-slate-500">Overdue Customers</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      {selectedBranch.overdueCustomersCount > 0 
                        ? 'Immediate follow-up calls and recovery officer visits must be dispatched.' 
                        : 'Outstanding installment portfolio is healthy. No immediate threats.'}
                    </p>
                  </div>
                </div>

                {/* Defaulter Customers */}
                <div className={`p-4 border rounded-xl flex items-start gap-3 shadow-sm ${
                  selectedBranch.defaulterCustomersCount > 0 
                    ? 'bg-rose-50/55 border-rose-200/70 text-rose-950' 
                    : 'bg-emerald-50/40 border-emerald-200/50 text-emerald-950'
                }`}>
                  <div className={`p-1.5 rounded-lg border ${
                    selectedBranch.defaulterCustomersCount > 0 
                      ? 'bg-rose-100 border-rose-200 text-rose-600' 
                      : 'bg-emerald-100 border-emerald-200 text-emerald-600'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Critical Default / Defaulters</h4>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-black font-mono">{selectedBranch.defaulterCustomersCount}</span>
                      <span className="text-xs font-semibold text-slate-500">Defaulter Customers</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      {selectedBranch.defaulterCustomersCount > 0 
                        ? 'Guarantors must be legally notified and consumer devices locked automatically.' 
                        : 'Perfect clean ledger. No branch accounts currently designated in Default.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BRANCH MANAGER & EMPLOYEES REGISTER */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Branch Personnel Register ({selectedBranch.employeesCount} Staff)</h4>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Staff Database
                  </span>
                </div>

                {selectedBranch.employees && selectedBranch.employees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="p-2.5">Staff Name</th>
                          <th className="p-2.5">Designated Role</th>
                          <th className="p-2.5">Department</th>
                          <th className="p-2.5 text-center">Operational Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                        {selectedBranch.employees.map((emp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2.5 font-bold text-slate-800">{emp.name}</td>
                            <td className="p-2.5">{emp.role}</td>
                            <td className="p-2.5">{emp.department}</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                emp.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-slate-150 text-slate-500'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-4">No employees registered for this branch location.</p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-slate-200 rounded-b-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t sticky bottom-0 z-10">
              <span className="text-[10px] text-slate-400 font-medium">
                System Certified Branch Audit Report • Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </span>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  Print Report
                </button>
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  Close Report
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
