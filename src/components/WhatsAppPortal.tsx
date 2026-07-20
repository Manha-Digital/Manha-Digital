/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquareCode, Settings, RefreshCw, Send, 
  ExternalLink, Lock, UserCheck, Search, Check, 
  Loader2, ToggleLeft, ToggleRight, AlertTriangle, MessageCircle, ArrowRight
} from 'lucide-react';
import { Employee, WhatsAppTemplate, WhatsAppAlert } from '../types';
import { showToast } from './UIElements';

interface WhatsAppPortalProps {
  currentUser: Employee;
}

export const WhatsAppPortal: React.FC<WhatsAppPortalProps> = ({ currentUser }) => {
  const [alerts, setAlerts] = useState<WhatsAppAlert[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignee, setAssignee] = useState<string>('admin');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Tab within WhatsApp Portal: 'queue' | 'templates' | 'manual' | 'settings'
  const [subTab, setSubTab] = useState<'queue' | 'templates' | 'manual' | 'settings'>('queue');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  
  // Manual form
  const [manualForm, setManualForm] = useState({
    customerName: '',
    phone: '',
    message: ''
  });
  
  // Delegate Form
  const [selectedAssignee, setSelectedAssignee] = useState<string>('admin');
  
  // Edit template body state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateBody, setEditingTemplateBody] = useState<string>('');

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp-alerts');
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts || []);
        setTemplates(data.templates || []);
        setAssignee(data.assignee || 'admin');
        setSelectedAssignee(data.assignee || 'admin');
      } else {
        showToast('Error loading WhatsApp portal data', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection failure to WhatsApp backend service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (res.ok) {
        setEmployees(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPortalData();
    fetchEmployees();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp-alerts');
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts || []);
        setTemplates(data.templates || []);
        setAssignee(data.assignee || 'admin');
        showToast('WhatsApp alert queue updated with live entries.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Network timeout trying to sync logs.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateAssignee = async () => {
    try {
      const res = await fetch('/api/whatsapp-config/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee: selectedAssignee, sender: currentUser.username })
      });
      const data = await res.json();
      if (res.ok) {
        setAssignee(selectedAssignee);
        showToast(`WhatsApp portal assignment updated to @${selectedAssignee}`, 'success');
      } else {
        showToast(data.message || 'Failed to update assignee', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error updating setting', 'error');
    }
  };

  const handleSaveTemplateBody = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editingTemplateBody })
      });
      const data = await res.json();
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, body: editingTemplateBody } : t));
        setEditingTemplateId(null);
        showToast('WhatsApp template modified successfully!', 'success');
      } else {
        showToast('Failed to modify template content.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving template edits.', 'error');
    }
  };

  const handleToggleTemplate = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/whatsapp-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentActive } : t));
        showToast(`Template ${!currentActive ? 'Enabled 🟢' : 'Disabled 🔴'}`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAlert = async (alert: WhatsAppAlert) => {
    try {
      const res = await fetch(`/api/whatsapp-alerts/send/${alert.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser.username })
      });
      if (res.ok) {
        // Redirection to WhatsApp Web or API Link
        const cleanPhone = alert.phone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(alert.message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Update state locally
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'Sent', sentAt: new Date().toISOString() } : a));
        showToast(`Logged sent status and redirected to WhatsApp for Ref ${alert.id}`, 'success');
      } else {
        showToast('Failed to update alert dispatch log.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during dispatch.', 'error');
    }
  };

  const handleBulkSendAll = async () => {
    const pendingCount = alerts.filter(a => a.status === 'Pending').length;
    if (pendingCount === 0) {
      showToast('No pending WhatsApp messages in active queue.', 'warning');
      return;
    }

    if (!window.confirm(`This will mark all ${pendingCount} pending notifications as dispatched. Continue?`)) {
      return;
    }

    try {
      const res = await fetch('/api/whatsapp-alerts/send-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser.username })
      });
      const data = await res.json();
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.status === 'Pending' ? { ...a, status: 'Sent', sentAt: new Date().toISOString() } : a));
        showToast(`Successfully registered ${data.count} alerts as dispatched!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error doing bulk dispatch.', 'error');
    }
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.phone || !manualForm.message) {
      showToast('Please specify phone and message text.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/whatsapp-alerts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualForm,
          sender: currentUser.username
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect
        const cleanPhone = manualForm.phone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(manualForm.message)}`;
        window.open(whatsappUrl, '_blank');

        setAlerts(prev => [data.alert, ...prev]);
        setManualForm({ customerName: '', phone: '', message: '' });
        showToast('Manual alert dispatched & logged!', 'success');
      } else {
        showToast(data.message || 'Error executing manual dispatch', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error sending manual message.', 'error');
    }
  };

  // Filter queue alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.phone.includes(searchQuery) ||
      (alert.agreementId && alert.agreementId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || alert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Authorization Shield Check: Is current user allowed to operate?
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isBranchManager = currentUser.role === 'Branch Manager';
  const isAccounts = currentUser.role === 'Accounts';
  const isRoyal = currentUser.username.toLowerCase() === 'royal';
  const isAssigned = currentUser.username.toLowerCase() === assignee.toLowerCase();
  const hasOperationAccess = isSuperAdmin || isRoyal || isAssigned;
  const canAssignPrivileges = isSuperAdmin || isBranchManager || isAccounts;

  useEffect(() => {
    if (!hasOperationAccess && canAssignPrivileges) {
      setSubTab('settings');
    }
  }, [hasOperationAccess, canAssignPrivileges]);

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      {/* Standard Header Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <MessageSquareCode className="w-40 h-40 text-emerald-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <MessageSquareCode className="w-4.5 h-4.5 text-emerald-600" />
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest font-mono">ERP Automation Wing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">WhatsApp Alerts Portal</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Configure automated message triggers, modify broadcast templates, and securely dispatch customer receipts, pre-due reminders, and legal warning notices.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 shrink-0 relative z-10">
          <div className="bg-emerald-50/50 border border-emerald-100 px-4 py-2.5 rounded-xl text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Operator</span>
            <span className="text-xs font-black font-mono text-emerald-800 flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              @{assignee}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Sync Queue
          </button>
        </div>
      </div>

      {/* Security Warning If Not Authorized */}
      {!hasOperationAccess && !canAssignPrivileges && (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto space-y-4 shadow-xs mt-6">
          <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">Restricted Operator Access Blocked</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            This module is currently assigned exclusively to operator <span className="font-bold text-slate-800">@{assignee}</span>. Your employee profile does not have privilege overrides to manage, edit, or dispatch WhatsApp alerts.
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            IP Terminal ID: SEC-LOCK-WA10 &bull; Authorized Operator Role Required
          </p>
        </div>
      )}

      {/* Main Panel Content (Only operable/visible if authorized) */}
      {(hasOperationAccess || canAssignPrivileges) && (
        <div className="space-y-6">
          {!hasOperationAccess && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 mb-4 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">🔒 Restricted Operation Access Blocked</p>
                <p className="mt-1 font-medium leading-relaxed">
                  This panel is assigned to operator <span className="font-bold">@{assignee}</span>. You can configure and delegate settings in the Security Delegation tab below, but you are strictly blocked from dispatching messages or managing active templates.
                </p>
              </div>
            </div>
          )}
          
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto">
            {hasOperationAccess && (
              <>
                <button
                  onClick={() => setSubTab('queue')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    subTab === 'queue' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📬 Pending Alerts Queue
                </button>
                <button
                  onClick={() => setSubTab('templates')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    subTab === 'templates' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📋 Message Templates Manager
                </button>
                <button
                  onClick={() => setSubTab('manual')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    subTab === 'manual' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ✍️ Manual Custom Broadcaster
                </button>
              </>
            )}
            {canAssignPrivileges && (
              <button
                onClick={() => setSubTab('settings')}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  subTab === 'settings' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚙️ Security Delegation
              </button>
            )}
          </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="py-24 text-center bg-white border border-slate-200 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-mono">Synchronizing telemetry data...</p>
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: PENDING ALERTS QUEUE */}
            {subTab === 'queue' && (
              <div className="space-y-6">
                
                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search queue by Customer Name, Phone, Agreement Ref..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setStatusFilter('Pending')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'Pending' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-550'
                        }`}
                      >
                        Pending Queue ({alerts.filter(a => a.status === 'Pending').length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('Sent')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'Sent' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-550'
                        }`}
                      >
                        Sent History ({alerts.filter(a => a.status === 'Sent').length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('All')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'All' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-550'
                        }`}
                      >
                        All logs
                      </button>
                    </div>

                    {statusFilter === 'Pending' && (
                      <button
                        onClick={handleBulkSendAll}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Dispatch All Pending
                      </button>
                    )}
                  </div>
                </div>

                {/* Queue Table Card */}
                {filteredAlerts.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                    <MessageSquareCode className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">No logs match your filters</p>
                    <p className="text-xs text-slate-400">All alerts have been dispatched or no events have occurred yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold uppercase tracking-wider">
                            <th className="p-3.5">Ref ID</th>
                            <th className="p-3.5">Customer & Phone</th>
                            <th className="p-3.5">Alert Category</th>
                            <th className="p-3.5">Formatted Message Content</th>
                            <th className="p-3.5">Mode</th>
                            <th className="p-3.5">Timestamp</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAlerts.map(alert => (
                            <tr key={alert.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-slate-550">{alert.id}</td>
                              <td className="p-3.5">
                                <p className="font-bold text-slate-850 text-xs">{alert.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{alert.phone}</p>
                                {alert.agreementId && (
                                  <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200/60 font-mono">
                                    Ref: {alert.agreementId}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-block px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-wide border ${
                                  alert.templateType === 'legal_notice' 
                                    ? 'bg-red-50 border-red-200 text-red-700' 
                                    : alert.templateType === 'installment_paid'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : alert.templateType === 'customer_registration'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                  {alert.templateType.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3.5 max-w-[280px]">
                                <div className="text-[11px] leading-relaxed text-slate-650 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 font-mono select-all truncate hover:whitespace-normal transition-all" title={alert.message}>
                                  {alert.message}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  alert.triggerType === 'Auto' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {alert.triggerType}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-[10px] text-slate-500">
                                {new Date(alert.timestamp).toLocaleString()}
                                {alert.sentAt && (
                                  <div className="mt-1 text-[9px] text-emerald-600 font-bold uppercase">
                                    Dispatched: {new Date(alert.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                {alert.status === 'Pending' ? (
                                  <button
                                    onClick={() => handleSendAlert(alert)}
                                    className="px-3 py-1.5 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" /> Dispatch API
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200 font-mono">
                                    <Check className="w-3 h-3 text-emerald-600" /> SENT
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: MESSAGE TEMPLATES MANAGER */}
            {subTab === 'templates' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configure System Automation Alerts</h3>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                    Toggle automatic message generation for critical customer lifecycle events. Edit template variables. Dynamic bracket tags will be replaced with real-time transactional variables at runtime.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map(tmpl => {
                    const isEditing = editingTemplateId === tmpl.id;
                    return (
                      <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-500 uppercase">
                              {tmpl.category}
                            </span>
                            <button
                              onClick={() => handleToggleTemplate(tmpl.id, tmpl.isActive)}
                              className="flex items-center gap-1 text-xs cursor-pointer focus:outline-none"
                            >
                              {tmpl.isActive ? (
                                <>
                                  <span className="text-emerald-700 font-bold text-[11px] uppercase">Active</span>
                                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-400 font-bold text-[11px] uppercase">Disabled</span>
                                  <ToggleLeft className="w-6 h-6 text-slate-350" />
                                </>
                              )}
                            </button>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight">{tmpl.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Template ID: {tmpl.id}</p>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingTemplateBody}
                                onChange={e => setEditingTemplateBody(e.target.value)}
                                rows={5}
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-sans bg-slate-50/50"
                              />
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => setEditingTemplateId(null)}
                                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveTemplateBody(tmpl.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Save Template
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/60 font-mono text-[11px] leading-relaxed text-slate-700 break-words select-all">
                              {tmpl.body}
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setEditingTemplateId(tmpl.id);
                                setEditingTemplateBody(tmpl.body);
                              }}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              Edit Template Content
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Brackets help guide */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquareCode className="w-4.5 h-4.5 text-emerald-600" />
                    How Template Variables Function
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                    The ERP auto-compiler scan engine automatically interpolates fields enclosed in double curly brackets with contextual record data:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-emerald-850 font-mono">
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{name}`}</strong>: Client Name</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{customer_id}`}</strong>: Cust ID</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{amount}`}</strong>: Value/Installment Due</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{due_date}`}</strong>: Expiration Date</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{agreement_id}`}</strong>: Agr Ref</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{product_name}`}</strong>: Asset Type</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{balance}`}</strong>: Total Outstanding</div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200/50"><strong>{`{ref}`}</strong>: Receipt Ref / Serial</div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: MANUAL CUSTOM BROADCASTER */}
            {subTab === 'manual' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Mobile Mockup view */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[320px] bg-slate-100 rounded-[36px] p-3 border-4 border-slate-300 shadow-xl relative overflow-hidden flex flex-col h-[500px]">
                    {/* Notch */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-200 rounded-full z-20 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5" />
                      <span className="w-10 h-1 bg-slate-300 rounded-full" />
                    </div>

                    {/* Chat screen header */}
                    <div className="bg-[#075e54] text-white pt-6 pb-2.5 px-3 flex items-center justify-between rounded-t-2xl">
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[#075e54] font-bold text-xs shadow-sm">
                          MD
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold leading-tight">Manha ERP Messenger</h4>
                          <span className="text-[8px] opacity-80 flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
                          </span>
                        </div>
                      </div>
                      <MessageCircle className="w-4 h-4 opacity-75" />
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-[#ece5dd] p-3 overflow-y-auto flex flex-col space-y-3">
                      <div className="max-w-[85%] p-2 rounded-lg text-[10px] shadow-xs bg-white text-slate-800 self-start rounded-tl-none leading-relaxed">
                        Assalam o Alaikum! This is the instant client communication console. Type a message on the right to preview.
                      </div>

                      {manualForm.message && (
                        <div className="max-w-[85%] p-2.5 rounded-lg text-[10px] shadow-xs bg-[#dcf8c6] text-slate-800 self-end rounded-tr-none leading-relaxed animate-fadeIn">
                          <p className="whitespace-pre-wrap font-mono">{manualForm.message}</p>
                          <span className="block text-[7px] text-right text-slate-400 mt-1 font-mono font-bold">
                            PREVIEW
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer Input mockup */}
                    <div className="bg-slate-50 p-2.5 border-t border-slate-200 flex items-center gap-1.5 rounded-b-2xl">
                      <div className="bg-white text-[9px] px-3 py-2 rounded-full flex-1 border border-slate-200 text-slate-400 font-medium">
                        Previewing system payload...
                      </div>
                      <div className="p-2 bg-[#128c7e] text-white rounded-full">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual form input */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-left">
                    <div>
                      <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Manual SMS & WhatsApp Broadcast Console</h3>
                      <p className="text-xs text-slate-400">Directly construct a custom SMS notification and trigger dispatch. This event will log in the secure communications history.</p>
                    </div>

                    <form onSubmit={handleSendManual} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name / Reference</label>
                        <input
                          type="text"
                          placeholder="e.g. Muhammad Kashif (Walk-in)"
                          value={manualForm.customerName}
                          onChange={e => setManualForm({ ...manualForm, customerName: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number (Country Code prefix required) *</label>
                        <input
                          type="text"
                          placeholder="e.g. +923008271625"
                          required
                          value={manualForm.phone}
                          onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Message Text Payload *</label>
                        <textarea
                          placeholder="Type custom notification content here..."
                          required
                          rows={6}
                          value={manualForm.message}
                          onChange={e => setManualForm({ ...manualForm, message: e.target.value })}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Dispatch WhatsApp Broadcast
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 4: SECURITY DELEGATION */}
            {subTab === 'settings' && canAssignPrivileges && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Authorized Operator Assignment
                    </h3>
                    <p className="text-xs text-slate-400">
                      Specify which system operator/clerk account is delegated with legal authority to dispatch WhatsApp Alerts. Non-assigned staff will be strictly blocked from viewing queues or templates.
                    </p>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Authorized Operator</label>
                      <select
                        value={selectedAssignee}
                        onChange={e => setSelectedAssignee(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                      >
                        <option value="admin">System Admin (@admin)</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.username}>{emp.name} (@{emp.username}) - {emp.role}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleUpdateAssignee}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1 cursor-pointer"
                    >
                      Update Assignment Privilege
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-bold">Administrative Note:</p>
                      <p className="mt-0.5">
                        Assigning privilege restricts the entire panel. However, the ERP super administrator profile <span className="font-semibold">@admin</span> and Super Admin profile <span className="font-semibold">@royal</span> will always preserve backup override bypass capabilities to ensure continuity during operator absences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        </div>
      )}

    </div>
  );
};
