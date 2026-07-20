/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, Customer, LockUnlockRequest, Agreement } from '../types';
import { 
  Smartphone, Lock, Unlock, Search, Send, Clock, CheckCircle2, 
  XCircle, Filter, Loader2, RefreshCw, ShieldAlert, ShieldCheck, FileText, UserCheck
} from 'lucide-react';
import { showToast } from './UIElements';

interface MobileLockProps {
  currentUser: Employee;
}

export const MobileLock: React.FC<MobileLockProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'submit' | 'monitor'>('requests');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<LockUnlockRequest[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [actionType, setActionType] = useState<'Lock' | 'Unlock'>('Lock');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorSearchQuery, setMonitorSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
  const canSendRequest = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager' || (currentUser.permissions && currentUser.permissions.includes('LockUnlockRequest'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, reqsRes, agrRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/lock-unlock-requests'),
        fetch('/api/agreements')
      ]);
      const custData = await custRes.json();
      const reqsData = await reqsRes.json();
      const agrData = await agrRes.json();
      setCustomers(custData || []);
      setRequests(reqsData || []);
      setAgreements(agrData || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading device lock registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer first.', 'warning');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a detailed reason for request.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/lock-unlock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          actionType,
          requestedBy: currentUser.username,
          reason: reason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Request sent successfully for customer ${data.request.customerName}!`, 'success');
        setSelectedCustomerId('');
        setReason('');
        setActiveTab('requests');
        fetchData();
      } else {
        showToast(data.message || 'Failed to submit request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
      setActionLoading(requestId);
      const res = await fetch(`/api/lock-unlock-requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actionBy: currentUser.username,
          notes: notes.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Request has been ${status.toLowerCase()} successfully!`, 'success');
        setNotes('');
        fetchData();
      } else {
        showToast(data.message || 'Error processing action.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network connection failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
    if (!isSuperOrManager) {
      const cust = customers.find(c => c.id === req.customerId);
      const isAssigned = cust && cust.registeredBy === currentUser.username;
      const isRequestedByMe = req.requestedBy === currentUser.username;
      if (!isAssigned && !isRequestedByMe) {
        return false;
      }
    }
    const query = searchQuery.toLowerCase();
    const matchSearch = req.customerName.toLowerCase().includes(query) || 
                        req.customerCNIC.toLowerCase().includes(query) || 
                        req.id.toLowerCase().includes(query) || 
                        req.requestedBy.toLowerCase().includes(query);
    const matchStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filter customer list for monitor
  const monitoredCustomers = customers.filter(cust => {
    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
    if (!isSuperOrManager && cust.registeredBy !== currentUser.username) {
      return false;
    }
    const query = monitorSearchQuery.toLowerCase();
    return cust.name.toLowerCase().includes(query) || 
           cust.cnic.toLowerCase().includes(query) || 
           cust.id.toLowerCase().includes(query) ||
           (cust.deviceStatus || 'Normal').toLowerCase().includes(query);
  });

  return (
    <div id="mobilock-module" className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Smartphone className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Device Securing Gateway</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Mobile Lock & Unlock</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Submit lock/unlock commands for delinquent installment plans. Staff submit authorizations, and managers trigger immediate secure device network lockouts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px no-print">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📝 Pending & Past Requests ({requests.length})
        </button>
        {canSendRequest && (
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'submit'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Send New Lock / Unlock Request
          </button>
        )}
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'monitor'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📱 Real-time Device Monitor
        </button>
      </div>

      {/* TAB 1: REQUESTS LOG */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Filters Area */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests by ID, Customer Name, CNIC, or Staff Username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <span className="text-xs text-slate-500 whitespace-nowrap">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved / Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-450 mt-2 font-mono">Loading request history...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No requests registered</p>
              <p className="text-xs text-slate-400">Try changing your search filters or send a brand-new request.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'Pending';
                const customerAgreement = agreements.find(a => a.customerId === req.customerId);
                const prodName = req.productName || customerAgreement?.productName || "Standard Financed Phone";
                const imeiVal = req.serialNumber || customerAgreement?.serialNumber || "Linked IMEI";
                
                return (
                  <div 
                    key={req.id} 
                    className={`bg-white p-5 rounded-2xl border transition-all ${
                      req.status === 'Approved' 
                        ? 'border-emerald-100 shadow-sm hover:border-emerald-200' 
                        : req.status === 'Rejected' 
                          ? 'border-red-100 shadow-sm hover:border-red-200' 
                          : 'border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Left: ID and action label */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-450">{req.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            req.actionType === 'Lock' 
                              ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                              : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                          }`}>
                            {req.actionType === 'Lock' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {req.actionType} COMMAND
                          </span>
                          
                          <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider border ${
                            req.status === 'Approved' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : req.status === 'Rejected' 
                                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500">
                          <h4 className="text-sm font-extrabold text-slate-800">
                            {req.customerName}
                          </h4>
                          <span className="text-slate-300">|</span>
                          <span>CNIC: <strong>{req.customerCNIC}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>CustomerID: <strong>{req.customerId}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1">
                            📱 {prodName} (IMEI: {imeiVal})
                          </span>
                        </div>
                      </div>

                      {/* Right: Request timestamp & sender */}
                      <div className="text-left md:text-right text-xs space-y-1">
                        <p className="text-slate-500">
                          Requested by: <strong className="font-mono text-slate-700">@{req.requestedBy}</strong>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.requestDate).toLocaleDateString()} at {new Date(req.requestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Reason Column */}
                      <div className="md:col-span-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Reason for request</p>
                        <p className="text-xs font-semibold text-slate-700 mt-1 italic">
                          "{req.reason}"
                        </p>
                      </div>

                      {/* Admin actions / feedback Column */}
                      <div className="md:col-span-6 flex flex-col justify-center space-y-2">
                        {isPending ? (
                          isAdmin ? (
                            <div className="space-y-3">
                              <textarea
                                placeholder="Enter admin execution notes or system remarks..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={1}
                                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAdminAction(req.id, 'Approved')}
                                  disabled={actionLoading === req.id}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {actionLoading === req.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Approve & Lockout
                                </button>
                                <button
                                  onClick={() => handleAdminAction(req.id, 'Rejected')}
                                  disabled={actionLoading === req.id}
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {actionLoading === req.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  Reject Request
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                              <p className="font-medium">Awaiting action by branch manager or super admin.</p>
                            </div>
                          )
                        ) : (
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                              Resolution by @{req.actionBy} on {req.actionDate ? new Date(req.actionDate).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-xs font-bold text-slate-700 mt-1">
                              {req.notes ? `"${req.notes}"` : 'No additional executive remarks provided.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMIT REQUEST */}
      {activeTab === 'submit' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-5 h-5 text-emerald-600" /> Dispatch Authorization Command
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an active customer, choose action, and submit reasons to the system queue for instant locking/unlocking permissions.
            </p>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Select Customer */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select Delinquent Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-white transition-all font-semibold"
              >
                <option value="">-- Choose Customer from Active Register --</option>
                {customers.filter(cust => {
                  const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
                  return isSuperOrManager || cust.registeredBy === currentUser.username;
                }).map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} (CNIC: {cust.cnic}) - Current State: {cust.deviceStatus || 'Normal'}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Action */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select Lockout Action
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionType('Lock')}
                  className={`p-3.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    actionType === 'Lock'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="w-4 h-4" /> LOCKOUT DEVICE
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('Unlock')}
                  className={`p-3.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    actionType === 'Unlock'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Unlock className="w-4 h-4" /> UNLOCK DEVICE
                </button>
              </div>
            </div>

            {/* Detailed Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Detailed Reason & Portfolio Context
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Example: Installment of RS 8,500 overdue by 18 days. Client is not responding to calls."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold tracking-wide shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              SEND LOCKOUT REQUEST TO MANAGER
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REAL-TIME MONITOR */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Device Connectivity Registry</h3>
              <p className="text-xs text-slate-500">Live operational grid of all financed devices across regional nodes and their active remote hardware lock states.</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers by name, CNIC, or status (Locked, Unlocked, Normal)..."
                value={monitorSearchQuery}
                onChange={e => setMonitorSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-450 mt-2 font-mono">Loading telemetry database...</p>
            </div>
          ) : monitoredCustomers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 font-medium text-slate-500">
              No matching customers found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monitoredCustomers.map(cust => {
                const status = cust.deviceStatus || 'Normal';
                const agreement = agreements.find(a => a.customerId === cust.id);
                const prodName = agreement?.productName || "Financed Phone";
                const imeiVal = agreement?.serialNumber || "Linked IMEI";
                
                return (
                  <div key={cust.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-800">{cust.name}</h4>
                        <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black">{cust.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5">
                        <span>CNIC: <strong className="font-mono text-slate-700">{cust.cnic}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>{cust.branch}</span>
                      </div>
                      <div className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold text-[9px] inline-flex items-center gap-1">
                        📱 {prodName} (IMEI: {imeiVal})
                      </div>
                    </div>

                    <div className="text-right">
                      {status === 'Locked' ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-rose-200">
                            <Lock className="w-3.5 h-3.5" /> LOCKED
                          </span>
                          <span className="text-[9px] text-rose-400 font-bold font-mono">LTE/Wi-Fi Restricted</span>
                        </div>
                      ) : status === 'Unlocked' ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-amber-200">
                            <Unlock className="w-3.5 h-3.5" /> UNLOCKED
                          </span>
                          <span className="text-[9px] text-amber-500 font-bold font-mono">Approved Over-the-air</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Normal
                          </span>
                          <span className="text-[9px] text-emerald-450 font-bold font-mono">Secure Connection</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
