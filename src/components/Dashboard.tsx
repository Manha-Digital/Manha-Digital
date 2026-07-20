/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Receipt, Award, AlertCircle, 
  Clock, Calendar, ArrowUpRight, Activity, BellRing, ChevronRight,
  Users, Filter, CheckCircle2, XCircle, MapPin, Phone, Coins, FileText, Search,
  RefreshCw, Play, Pause, Radio, Sparkles, Database
} from 'lucide-react';
import { DashboardStats, Employee, AuditLog, Agreement, Installment, StaffNotification } from '../types';
import { showToast } from './UIElements';

interface DashboardProps {
  currentUser: Employee;
  setCurrentView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, setCurrentView }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branchPerf, setBranchPerf] = useState<any[]>([]);
  const [salesPerf, setSalesPerf] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [pendingAgreements, setPendingAgreements] = useState<Agreement[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  
  // Custom Customer Analytics States
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Personal Staff Dashboard States
  const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'global' | 'personal'>(
    currentUser.role === 'Super Admin' ? 'global' : 'personal'
  );

  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Advanced Dynamic Live Update State Engine
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const hasAccess = (module: string): boolean => {
    if (currentUser.role === 'Super Admin') return true;
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      if (currentUser.permissions.includes(module)) return true;
    }
    switch (module) {
      case 'Customers':
        return ['Branch Manager', 'Sales Executive', 'Operation'].includes(currentUser.role);
      case 'Agreements':
        return ['Branch Manager', 'Sales Executive', 'Operation'].includes(currentUser.role);
      case 'BroadcastNotifications':
        return ['Super Admin'].includes(currentUser.role) || (currentUser.permissions && currentUser.permissions.includes('BroadcastNotifications'));
      default:
        return false;
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      
      // Filter so that employee only sees notifications intended for them
      const list = data || [];
      const filtered = list.filter((n: any) => {
        const isAll = !n.recipients || n.recipients.length === 0 || n.recipients.includes('all');
        const isTarget = n.recipients && n.recipients.includes(currentUser.username);
        const isSender = n.sender === currentUser.username || n.sender === currentUser.name;
        return isAll || isTarget || isSender;
      });
      
      setNotifications(filtered);
    } catch (e) {
      console.error('Error fetching notifications inside Dashboard:', e);
    }
  };

  const triggerLiveSync = async () => {
    setIsHighlighting(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchLogs(),
        fetchAgreements(),
        fetchCustomers(),
        fetchInstallments(),
        fetchNotifications()
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error auto-syncing dashboard stats:', err);
    } finally {
      setTimeout(() => setIsHighlighting(false), 800);
    }
  };

  useEffect(() => {
    // Dynamic Clock matching local time
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    fetchStats();
    fetchLogs();
    fetchAgreements();
    fetchCustomers();
    fetchInstallments();
    fetchNotifications();

    return () => clearInterval(timer);
  }, []);

  // Countdown timer for automatic digital live updates
  useEffect(() => {
    if (!isLiveEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerLiveSync();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveEnabled]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats({
        todayCollection: data.todayCollection,
        pendingRecovery: data.pendingRecovery,
        upcomingInstallmentsCount: data.upcomingInstallmentsCount,
        todayExpenses: data.todayExpenses,
        todayProfit: data.todayProfit,
        totalCashBalance: data.totalCashBalance,
        totalBankBalance: data.totalBankBalance,
      });
      setBranchPerf(data.branchPerformance);
      setSalesPerf(data.salesPerformance);
    } catch (err) {
      console.error(err);
      showToast('Error loading stats from server.', 'error');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setRecentLogs(data.slice(0, 5)); // show top 5 logs
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgreements = async () => {
    try {
      const res = await fetch('/api/agreements');
      const data = await res.json();
      setAllAgreements(data || []);
      setPendingAgreements(data.filter((a: Agreement) => a.status === 'Pending'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInstallments = async () => {
    try {
      const res = await fetch('/api/installments');
      const data = await res.json();
      setInstallments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customer list on dashboard:', err);
    }
  };

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-400 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4" />
        Synchronizing Enterprise Nodes...
      </div>
    );
  }

  // Helper for responsive custom SVG charts calculations
  const maxSales = Math.max(...salesPerf.map(s => s.sales), 1);
  const maxRecovery = Math.max(...branchPerf.map(b => b.recovery), 1);

  // Staff customer portfolio calculation
  const myCustomers = customers.filter(c => c.registeredBy === currentUser.username);
  const myCustomerIds = myCustomers.map(c => c.id);
  const myAgreements = allAgreements.filter(a => myCustomerIds.includes(a.customerId));
  const myAgreementIds = myAgreements.map(a => a.id);
  const myInstallments = installments.filter(inst => myAgreementIds.includes(inst.agreementId));

  // Staff specific metrics calculations
  const myTotalCustomers = myCustomers.length;
  
  // Total recovery amount (total outstanding balance to recover)
  const myTotalRecoveryAmount = myAgreements.reduce((sum, a) => sum + (a.remainingBalance || 0), 0);
  
  // Total recovered amount (total amount actually collected/paid)
  const myTotalRecoveredAmount = myInstallments.reduce((sum, i) => sum + (i.amountPaid || 0), 0) + myInstallments.reduce((sum, i) => sum + (i.penaltyPaid || 0), 0);
  
  // Success rate
  const totalMyPortfolio = myTotalRecoveryAmount + myTotalRecoveredAmount;
  const myRecoveryRate = totalMyPortfolio > 0 ? Math.round((myTotalRecoveredAmount / totalMyPortfolio) * 100) : 0;

  // Defaulter customer count (number of customers with at least one unpaid overdue installment)
  const myDefaulterAgreements = myAgreements.filter(a => {
    const overdueCount = myInstallments.filter(
      i => i.agreementId === a.id && i.status !== 'Paid' && new Date(i.dueDate) < new Date()
    ).length;
    return overdueCount > 0;
  });
  const myDefaulterCustomersCount = new Set(myDefaulterAgreements.map(a => a.customerId)).size;

  // Find upcoming or overdue installments of assigned agreements
  const myUrgentInstallments = myInstallments
    .filter(i => i.status !== 'Paid')
    .map(inst => {
      const agr = myAgreements.find(a => a.id === inst.agreementId);
      const cust = myCustomers.find(c => c.id === agr?.customerId);
      const isOverdue = new Date(inst.dueDate) < new Date();
      return {
        ...inst,
        customerName: cust?.name || 'Unknown',
        customerPhone: cust?.phone || 'N/A',
        productName: agr?.productName || 'Product',
        isOverdue
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5); // show top 5 urgent ones

  // --- DYNAMIC DASHBOARD METRIC CALCULATIONS FILTERED BY MASTER BRANCH ---
  const defaultBranches = ['Karachi Central', 'Lahore West', 'Rawalpindi East', 'Peshawar North', 'Multan South'];
  const allBranchesList = Array.from(new Set([
    ...defaultBranches,
    ...customers.map(c => c.branch),
    ...allAgreements.map(a => a.branch)
  ])).filter(Boolean) as string[];

  const activeBranchCustomers = selectedBranch === 'All' 
    ? customers 
    : customers.filter(c => c.branch === selectedBranch);
  const dashboardTotalCustomers = activeBranchCustomers.length;

  const activeBranchAgreements = selectedBranch === 'All'
    ? allAgreements
    : allAgreements.filter(a => a.branch === selectedBranch);

  const dashboardTotalInvestAmount = activeBranchAgreements.reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const dashboardTotalPendingAmount = activeBranchAgreements.reduce((sum, a) => sum + (a.remainingBalance || 0), 0);

  const allowedStatuses = ['Approved', 'Delivered', 'Active', 'Defaulter'];
  const dashboardActiveAgreements = activeBranchAgreements.filter(a => allowedStatuses.includes(a.status));
  const dashboardPerMonthRecoverable = dashboardActiveAgreements.reduce((sum, a) => sum + (a.monthlyEMI || 0), 0);

  const activeBranchAgreementIds = new Set(activeBranchAgreements.map(a => a.id));
  const activeBranchInstallments = installments.filter(i => activeBranchAgreementIds.has(i.agreementId));

  const dashboardPendingRecoverable = activeBranchInstallments
    .filter(i => i.status !== 'Paid')
    .reduce((sum, i) => sum + ((i.amountDue || 0) - (i.amountPaid || 0)), 0);

  const localNow = new Date();
  const dashboardOverdueInstallments = activeBranchInstallments.filter(i => {
    return i.status !== 'Paid' && new Date(i.dueDate) < localNow;
  });
  const dashboardOverdueAmount = dashboardOverdueInstallments.reduce((sum, i) => sum + ((i.amountDue || 0) - (i.amountPaid || 0)), 0);

  const defaulterAgrIds = new Set(dashboardOverdueInstallments.map(i => i.agreementId));
  const defaulterBranchAgreements = activeBranchAgreements.filter(a => defaulterAgrIds.has(a.id));
  const defaulterCustIds = new Set(defaulterBranchAgreements.map(a => a.customerId));
  const dashboardDefaulterCustomers = defaulterCustIds.size;

  const dashboardDefaulterAmount = defaulterBranchAgreements.reduce((sum, a) => sum + (a.remainingBalance || 0), 0);

  // Filter pending agreements based on selected branch
  const displayedPendingAgreements = selectedBranch === 'All'
    ? pendingAgreements
    : pendingAgreements.filter(a => a.branch === selectedBranch);
  // -----------------------------------------------------------------------

  return (
    <div id="dashboard-view" className="space-y-8 pb-24 font-sans text-slate-800">
      {/* Upper Dashboard Banner Header - RESTORED BLACK & GREEN GRADIENT SINGLE-LINE LAYOUT */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <TrendingUp className="w-40 h-40 text-slate-900" />
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 shrink-0">
            {dashboardMode === 'personal' 
              ? (currentUser.role === 'Sales Executive' ? 'Sales Executive Portfolio' : `${currentUser.role} Dashboard`)
              : 'Operational Dashboard'
            }
          </h2>
          <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-extrabold uppercase tracking-widest shadow-xs shrink-0">
            {dashboardMode === 'personal' ? 'Personal Desk' : 'Enterprise Global'}
          </span>
          <span className="hidden lg:inline text-slate-300 shrink-0">|</span>
          <p className="text-xs text-slate-500 font-medium truncate">
            {dashboardMode === 'personal'
              ? `Real-time statistics for @${currentUser.username}.`
              : `Welcome back, ${currentUser.name}.`
            }
          </p>
        </div>

          {/* Super Admin Dashboard Mode Toggle */}
          {currentUser.role === 'Super Admin' && (
            <div className="mt-4 flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setDashboardMode('global')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  dashboardMode === 'global'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Global View
              </button>
              <button
                type="button"
                onClick={() => setDashboardMode('personal')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  dashboardMode === 'personal'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Assigned Staff View
              </button>
            </div>
          )}
        
        {/* Real-time terminal clock & Dynamic Live Sync widgets - polished */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl shadow-sm shrink-0 relative z-10 self-stretch lg:self-auto justify-between lg:justify-start">
          {/* Clock and Date stacked */}
          <div className="flex flex-col justify-center gap-2 pl-2">
            <div className="flex items-center gap-3 text-emerald-600 font-mono text-4xl sm:text-5xl font-black tracking-wider leading-none">
              <Clock className="w-8 h-8 text-emerald-600 shrink-0" />
              <span>{currentTime || '02:05 AM'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold pl-1">
              <Calendar className="w-4 h-4 text-emerald-500/80 shrink-0" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Branch Controller Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/80">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Operational Node</h3>
            <p className="text-sm font-black text-slate-800">
              {selectedBranch === 'All' ? '🌐 All Enterprise Branches (Consolidated view)' : `📍 ${selectedBranch} Active Ledger`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">Select Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedBranchFilter(e.target.value);
            }}
            className="flex-1 sm:flex-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-xs"
          >
            <option value="All">🌐 All Branches (Global Consolidated)</option>
            {allBranchesList.map(br => (
              <option key={br} value={br}>📍 {br}</option>
            ))}
          </select>
        </div>
      </div>

      {dashboardMode === 'global' ? (
        <>
          {/* 8-Card Master KPI Performance Widgets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* Stat Card 1: Total Customer */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Total Customer</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1 sm:mt-2 tracking-tight">
                    {dashboardTotalCustomers.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Registered accounts</span>
              </div>
            </div>

            {/* Stat Card 2: Total Invest Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Total Invest Amount</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-emerald-700 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardTotalInvestAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Total financing capital</span>
              </div>
            </div>

            {/* Stat Card 3: Total Pending Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Total Pending Amount</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-amber-600 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardTotalPendingAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl border border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Lease outstanding balance</span>
              </div>
            </div>

            {/* Stat Card 4: Per Month Recoverable Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Per Month Recoverable</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardPerMonthRecoverable.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-sky-50 text-sky-600 rounded-lg sm:rounded-xl border border-sky-100 group-hover:bg-sky-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-sky-700 bg-sky-50 border border-sky-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Active EMI target</span>
              </div>
            </div>

            {/* Stat Card 5: Pending Recoverable Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Pending Recoverable</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-violet-700 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardPendingRecoverable.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-violet-50 text-violet-600 rounded-lg sm:rounded-xl border border-violet-100 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Receipt className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-violet-700 bg-violet-50 border border-violet-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Unpaid installments</span>
              </div>
            </div>

            {/* Stat Card 6: Overdue Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Overdue Amount</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-red-600 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardOverdueAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-red-50 text-red-600 rounded-lg sm:rounded-xl border border-red-100 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-red-700 bg-red-50 border border-red-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Past due unpaid total</span>
              </div>
            </div>

            {/* Stat Card 7: Defaulter Customer */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Defaulter Customer</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1 sm:mt-2 tracking-tight">
                    {dashboardDefaulterCustomers.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl border border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <XCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>With overdue balances</span>
              </div>
            </div>

            {/* Stat Card 8: Defaulter Amount */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30 hover:shadow-md relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-x-1">
                    <span>Defaulter Amount</span>
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black font-mono text-rose-700 mt-1 sm:mt-2 tracking-tight">
                    RS {dashboardDefaulterAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-1.5 sm:p-2.5 bg-red-100 text-red-700 rounded-xl border border-red-200 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0">
                  <Activity className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 flex items-center gap-1 text-[8px] sm:text-[10px] text-red-800 bg-red-100 border border-red-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Defaulted outstanding</span>
              </div>
            </div>
          </div>

          {/* Quick Cash Flow & Daily Ledger Inflows */}
          <div className="bg-slate-50 border border-slate-200/85 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-6 shadow-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Today's Inflow</span>
                <span className="text-emerald-700 font-black font-mono text-sm">RS {stats.todayCollection.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Today's Outflow</span>
                <span className="text-red-600 font-black font-mono text-sm">RS {stats.todayExpenses.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Cash Ledger</span>
                <span className="text-slate-800 font-black font-mono text-sm">RS {stats.totalCashBalance.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Bank Ledger</span>
                <span className="text-slate-800 font-black font-mono text-sm">RS {stats.totalBankBalance.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-emerald-800 bg-emerald-100/60 border border-emerald-200/50 px-3 py-1.5 rounded-lg font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
              <span>Real-time ERP cash flow metrics synchronized</span>
            </div>
          </div>

      {/* CUSTOMER ANALYTICS & REGISTRATION INSIGHTS PANEL (DYNAMIC DUAL FILTERABLE METRICS) */}
      {hasAccess('Customers') ? (() => {
        // Compute dynamic filters
        const dynamicBranches: string[] = Array.from(new Set(customers.map(c => c.branch))).filter(Boolean) as string[];
        
        // Filter customers
        const filteredCustomersForStats = customers.filter(c => {
          if (selectedBranchFilter !== 'All' && c.branch !== selectedBranchFilter) {
            return false;
          }
          if (c.registeredAt) {
            const regDate = new Date(c.registeredAt);
            if (startDate) {
              const start = new Date(startDate);
              start.setHours(0,0,0,0);
              if (regDate < start) return false;
            }
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23,59,59,999);
              if (regDate > end) return false;
            }
          }
          return true;
        });

        // Compute verification status breakdown
        const approvedCount = filteredCustomersForStats.filter(c => c.verificationStatus === 'Approved').length;
        const pendingCount = filteredCustomersForStats.filter(c => c.verificationStatus === 'Pending' || !c.verificationStatus).length;
        const rejectedCount = filteredCustomersForStats.filter(c => c.verificationStatus === 'Rejected' || c.verificationStatus === 'Need More Documents').length;

        // Compute branch counts for the filtered list
        const branchCounts = dynamicBranches.reduce((acc, bName) => {
          acc[bName] = filteredCustomersForStats.filter(c => c.branch === bName).length;
          return acc;
        }, {} as Record<string, number>);

        const maxBranchVal = Math.max(...Object.values(branchCounts), 1);

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Demographic Customer Analytics</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Configure date intervals and enterprise branch filters dynamically.</p>
                </div>
              </div>
              
              {/* Reset filter indicator if anything is active */}
              {(selectedBranchFilter !== 'All' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSelectedBranchFilter('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Clear Active Filters
                </button>
              )}
            </div>

            {/* Filter controls row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              {/* Branch Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Branch filter
                </label>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="All">All Branches (Global Accounts)</option>
                  {dynamicBranches.map(brName => (
                    <option key={brName} value={brName}>{brName}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Registration Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> End Registration Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Metrics visualizer split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
              
              {/* Massive aggregate display */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 flex flex-col justify-center items-center text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Customers Listed</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">{filteredCustomersForStats.length}</span>
                  <span className="text-xs font-bold text-emerald-700">Records</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Matching selected branch and registration intervals.</p>
              </div>

              {/* Verification statuses chart */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Audit Status Breakdown</span>
                <div className="space-y-2.5">
                  {/* Approved */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approved</span>
                      <span>{approvedCount} ({filteredCustomersForStats.length > 0 ? Math.round((approvedCount / filteredCustomersForStats.length) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${filteredCustomersForStats.length > 0 ? (approvedCount / filteredCustomersForStats.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {/* Pending */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Review</span>
                      <span>{pendingCount} ({filteredCustomersForStats.length > 0 ? Math.round((pendingCount / filteredCustomersForStats.length) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${filteredCustomersForStats.length > 0 ? (pendingCount / filteredCustomersForStats.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {/* Rejected */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Disapproved</span>
                      <span>{rejectedCount} ({filteredCustomersForStats.length > 0 ? Math.round((rejectedCount / filteredCustomersForStats.length) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${filteredCustomersForStats.length > 0 ? (rejectedCount / filteredCustomersForStats.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Branch Distribution Bars */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-2.5 max-h-[140px] overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Branch-Wise Registration Volume</span>
                {dynamicBranches.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No registrations cataloged in branches.</p>
                ) : (
                  dynamicBranches.map(brName => {
                    const count = branchCounts[brName] || 0;
                    const pct = Math.round((count / maxBranchVal) * 100);
                    return (
                      <div key={brName} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                          <span>{brName}</span>
                          <span>{count} Accounts</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        );
      })() : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
          <h4 className="text-sm font-bold text-slate-700">Demographic Customer Analytics Restricted</h4>
          <p className="text-xs text-slate-500">Only authorized staff can view complete company demographics and customer databases.</p>
        </div>
      )}

      {/* Interactive Custom SVG Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line/Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Monthly Sales Growth Trend</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Lease volume matching dynamic portfolio</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              YTD +42%
            </span>
          </div>

          {/* SVG Line / Area Plotter */}
          <div className="relative h-60 w-full flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

              {/* Area path */}
              <path
                d={`
                  M 10 180 
                  L 10 ${160 - (salesPerf[0]?.sales / maxSales) * 120} 
                  L 90 ${160 - (salesPerf[1]?.sales / maxSales) * 120} 
                  L 170 ${160 - (salesPerf[2]?.sales / maxSales) * 120} 
                  L 250 ${160 - (salesPerf[3]?.sales / maxSales) * 120} 
                  L 330 ${160 - (salesPerf[4]?.sales / maxSales) * 120} 
                  L 410 ${160 - (salesPerf[5]?.sales / maxSales) * 120} 
                  L 490 ${160 - (salesPerf[5]?.sales / maxSales) * 120} 
                  L 490 180 Z
                `}
                fill="url(#chartGrad)"
              />

              {/* Line path */}
              <path
                d={`
                  M 10 ${160 - (salesPerf[0]?.sales / maxSales) * 120} 
                  L 90 ${160 - (salesPerf[1]?.sales / maxSales) * 120} 
                  L 170 ${160 - (salesPerf[2]?.sales / maxSales) * 120} 
                  L 250 ${160 - (salesPerf[3]?.sales / maxSales) * 120} 
                  L 330 ${160 - (salesPerf[4]?.sales / maxSales) * 120} 
                  L 410 ${160 - (salesPerf[5]?.sales / maxSales) * 120} 
                  L 490 ${160 - (salesPerf[5]?.sales / maxSales) * 120}
                `}
                fill="none"
                stroke="#047857"
                strokeWidth="2.5"
              />

              {/* Data circles */}
              {salesPerf.map((s, idx) => {
                const cx = 10 + idx * 80;
                const cy = 160 - (s.sales / maxSales) * 120;
                return (
                  <g key={idx} className="group">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="#ffffff"
                      stroke="#047857"
                      strokeWidth="2"
                    />
                    {/* Tooltip hover trigger */}
                    <text x={cx} y={cy - 12} textAnchor="middle" className="text-[9px] font-mono fill-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 shadow border border-slate-100">
                      {(s.sales / 100000).toFixed(1)}L
                    </text>
                  </g>
                );
              })}
            </svg>
            
            {/* X-Axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] font-mono text-slate-500 pt-1">
              {salesPerf.map((s, idx) => <span key={idx}>{s.month}</span>)}
            </div>
          </div>
        </div>

        {/* Branch Recovery Side Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Branch Portfolio Standings</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Recovery collections compared to target</p>
          </div>

          <div className="mt-6 space-y-4">
            {branchPerf.map((branch, idx) => {
              const percentage = Math.round((branch.recovery / maxRecovery) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{branch.name}</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      RS {(branch.recovery / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-emerald-600 animate-pulse" />
            <p className="text-[10px] text-emerald-800 leading-normal font-medium">
              Karachi Central leads in recovering overdue balances, recording 94% targets this fiscal week.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Tasks, Active Logs, Pending Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Agreements Module Tracker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {hasAccess('Agreements') ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 underline decoration-emerald-500 decoration-2 underline-offset-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Agreements Pending Ops Approval
                </h4>
                <button 
                  onClick={() => setCurrentView('Verifications')}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-0.5"
                >
                  Verify Now <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {displayedPendingAgreements.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  All agreements verified. Operations queue clean.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedPendingAgreements.map(agr => (
                    <div key={agr.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 flex-nowrap min-w-0 overflow-hidden">
                          <span className="font-bold text-slate-800 truncate whitespace-nowrap">{agr.customerName}</span>
                          <span className="text-slate-300 shrink-0">|</span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold truncate whitespace-nowrap">{agr.productName}</span>
                          <span className="text-slate-300 shrink-0">|</span>
                          <span className="text-emerald-700 font-bold whitespace-nowrap shrink-0">EMI: RS {agr.monthlyEMI.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                          Pending
                        </span>
                        <button
                          onClick={() => setCurrentView('Verifications')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[10px] font-bold"
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h5 className="text-xs font-bold text-slate-700 font-sans">Agreement Approval Queue Gated</h5>
              <p className="text-[10px] text-slate-500 font-sans">Only authorized personnel can process or review client agreements.</p>
            </div>
          )}
        </div>

        {/* Security Audit Log Activity Feed (Highly Polished Light Style) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Live Security Audits & Activity Log
            </h4>
          </div>

          <div className="space-y-3 max-h-[185px] overflow-y-auto pr-1">
            {recentLogs.map((log, idx) => (
              <div key={log.id || idx} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-lg flex justify-between items-start text-[11px] transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-850">@{log.username}</span>
                    <span className="text-[9px] bg-slate-200/60 text-slate-700 border border-slate-300 px-1.5 py-0.2 rounded font-bold uppercase">
                      {log.role}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{log.details}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4 font-mono text-[9px] text-slate-400 font-bold">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      ) : (
        <>
          {/* PERSONAL STAFF DASHBOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Stat Card 1: My Total Assigned Customers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between hover:border-emerald-500/35 hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)] hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">My Total Customers</p>
                  <h3 className="text-2xl font-black font-mono text-slate-900 mt-2 tracking-tight">
                    {myTotalCustomers} Accounts
                  </h3>
                </div>
                <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Users className="w-4.5 h-4.5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50/70 border border-emerald-100/50 px-2.5 py-1 rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Directly assigned to you</span>
              </div>
            </div>

            {/* Stat Card 2: Total Recovery Amount */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between hover:border-amber-500/35 hover:shadow-[0_8px_30px_rgb(245,158,11,0.06)] hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">To Be Recovered</p>
                  <h3 className="text-2xl font-black font-mono text-amber-600 mt-2 tracking-tight">
                    RS {myTotalRecoveryAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Wallet className="w-4.5 h-4.5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/70 border border-amber-100/50 px-2.5 py-1 rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Outstanding lease balance</span>
              </div>
            </div>

            {/* Stat Card 3: Total Recovered Amount */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between hover:border-emerald-500/35 hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)] hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Recovered</p>
                  <h3 className="text-2xl font-black font-mono text-emerald-600 mt-2 tracking-tight">
                    RS {myTotalRecoveredAmount.toLocaleString()}
                  </h3>
                </div>
                <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Coins className="w-4.5 h-4.5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50/70 border border-emerald-100/50 px-2.5 py-1 rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Payments collected successfully</span>
              </div>
            </div>

            {/* Stat Card 4: Defaulters Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between hover:border-red-500/35 hover:shadow-[0_8px_30px_rgb(239,68,68,0.06)] hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Defaulter Customers</p>
                  <h3 className="text-2xl font-black font-mono text-red-600 mt-2 tracking-tight">
                    {myDefaulterCustomersCount} Accounts
                  </h3>
                </div>
                <span className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100 group-hover:bg-red-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <AlertCircle className="w-4.5 h-4.5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-red-700 bg-red-50/70 border border-red-100/50 px-2.5 py-1 rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Overdue installments pending</span>
              </div>
            </div>

            {/* Stat Card 5: My Recovery Success Rate */}
            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-100" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">My Recovery Rate</p>
                  <h3 className="text-2xl font-black font-mono text-emerald-700 mt-2 tracking-tight">
                    {myRecoveryRate}%
                  </h3>
                </div>
                <span className="p-2.5 bg-emerald-100 text-emerald-850 rounded-xl border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Award className="w-4.5 h-4.5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-200/50 px-2.5 py-1 rounded-lg w-fit font-extrabold uppercase tracking-wide">
                <span>Collected vs Portfolio</span>
              </div>
            </div>
          </div>

          {/* Personalized Portfolio grid & call queues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Customer Portfolio List */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">My Customer Portfolio</h4>
                  <p className="text-[10px] text-slate-500 font-medium">List of accounts registered or assigned to your workspace.</p>
                </div>
                {currentUser.role !== 'Sales Executive' && (
                  <button
                    onClick={() => setCurrentView('Customers')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Search className="w-3.5 h-3.5" /> Customer Register
                  </button>
                )}
              </div>

              {myCustomers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                  No customers currently assigned to @{currentUser.username}.
                  <p className="text-xs text-slate-400 mt-1 font-normal">Create or assign customers inside the Customer Register module.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">CNIC / Contact</th>
                        <th className="p-3">Outstanding Balance</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myCustomers.map(cust => {
                        const custAgreements = myAgreements.filter(a => a.customerId === cust.id);
                        const custBalance = custAgreements.reduce((sum, a) => sum + (a.remainingBalance || 0), 0);
                        const hasOverdue = myUrgentInstallments.some(i => i.customerId === cust.id && i.isOverdue);
                        
                        return (
                          <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-mono font-semibold text-slate-500">{cust.id}</td>
                            <td className="p-3 font-semibold text-slate-800">{cust.name}</td>
                            <td className="p-3">
                              <span className="font-semibold block text-slate-700">{cust.cnic}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{cust.phone}</span>
                            </td>
                            <td className="p-3 font-bold font-mono text-slate-900">
                              RS {custBalance.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              {hasOverdue ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 rounded">
                                  Defaulter
                                </span>
                              ) : custAgreements.length > 0 ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                  Active Lease
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border border-slate-200 rounded">
                                  No Lease
                                </span>
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

            {/* Right Column: Collection Task & Urgent Contact Queues */}
            <div className="space-y-6">
              {/* Urgent Collections Caller List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Urgent Recovery Queue
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">Overdue or upcoming installments requiring immediate contact.</p>
                </div>

                {myUrgentInstallments.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                    No pending recoveries found! Great job.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myUrgentInstallments.map(inst => (
                      <div key={inst.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-1.5 flex-nowrap min-w-0 overflow-hidden">
                              <span className="font-bold text-slate-800 text-xs truncate whitespace-nowrap">{inst.customerName}</span>
                              <span className="text-slate-300 shrink-0">|</span>
                              <span className="text-[10px] text-slate-500 font-mono truncate whitespace-nowrap">{inst.productName} (EMI {inst.month})</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase shrink-0 ${
                            inst.isOverdue 
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {inst.isOverdue ? 'Overdue' : 'Due Soon'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">Amount Due</p>
                            <p className="text-xs font-black font-mono text-slate-900">RS {inst.amountDue.toLocaleString()}</p>
                          </div>
                          <a
                            href={`tel:${inst.customerPhone}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Customer
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recovery Quick Access Actions */}
              {currentUser.role !== 'Sales Executive' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" /> Quick Cashier Actions
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Process recoveries or register collections directly into ERP.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCurrentView('Recovery')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
                    >
                      <Coins className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-800">Receive Installment</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Record instant receipt</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('Agreements')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
                    >
                      <FileText className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-800">Create Agreement</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Launch new lease</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
