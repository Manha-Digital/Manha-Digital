/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, StaffNotification } from '../types';
import { 
  BellRing, Users, CheckSquare, Square, Search, Trash2, Check, 
  AlertTriangle, FileText, X, ShieldAlert, Sparkles, Clock, UserCheck, 
  Megaphone, RefreshCw, Info, HelpCircle
} from 'lucide-react';
import { showToast } from './UIElements';

interface BroadcastCenterProps {
  currentUser: Employee;
}

const CATEGORIES = [
  { id: 'General', label: 'General Announcement', color: 'bg-blue-50 border-blue-100 text-blue-700', textLight: 'text-blue-650' },
  { id: 'Urgent', label: 'Urgent / Critical', color: 'bg-red-50 border-red-100 text-red-700', textLight: 'text-red-650' },
  { id: 'SOP', label: 'Standard Operating Procedure (SOP)', color: 'bg-emerald-50 border-emerald-100 text-emerald-700', textLight: 'text-emerald-650' },
  { id: 'Warning', label: 'Compliance Warning', color: 'bg-amber-50 border-amber-100 text-amber-700', textLight: 'text-amber-650' },
  { id: 'Event', label: 'Training & Events', color: 'bg-purple-50 border-purple-100 text-purple-700', textLight: 'text-purple-650' },
];

export const BroadcastCenter: React.FC<BroadcastCenterProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form States
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // History Filter State
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');

  const canBroadcast = currentUser.role === 'Super Admin' || 
    (currentUser.permissions && currentUser.permissions.includes('BroadcastNotifications'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifRes, empRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/employees')
      ]);
      const notifData = await notifRes.json();
      const empData = await empRes.json();

      setNotifications(notifData || []);
      // Filter out current user from the list if desired, but keep all for selection
      setEmployees(empData || []);
    } catch (e) {
      console.error(e);
      showToast('Error loading Broadcast Center data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please type an announcement message.', 'warning');
      return;
    }

    if (targetType === 'specific' && selectedEmployees.length === 0) {
      showToast('Please select at least one employee recipient.', 'warning');
      return;
    }

    setSending(true);
    try {
      const recipients = targetType === 'all' ? ['all'] : selectedEmployees;
      
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          sender: currentUser.name || currentUser.username,
          category,
          recipients
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Notification successfully published & broadcasted!', 'success');
        setMessage('');
        setSelectedEmployees([]);
        setTargetType('all');
        fetchData();
      } else {
        showToast(data.message || 'Failed to publish notification.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while publishing notification.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to retract/delete this announcement?')) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Announcement retracted successfully.', 'success');
        fetchData();
      } else {
        showToast(data.message || 'Failed to retract announcement.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error retracting announcement.', 'error');
    }
  };

  const handleToggleEmployeeSelection = (username: string) => {
    if (selectedEmployees.includes(username)) {
      setSelectedEmployees(selectedEmployees.filter(u => u !== username));
    } else {
      setSelectedEmployees([...selectedEmployees, username]);
    }
  };

  const handleSelectAllFiltered = (filteredList: Employee[]) => {
    const filteredUsernames = filteredList.map(emp => emp.username);
    const allSelected = filteredUsernames.every(u => selectedEmployees.includes(u));
    
    if (allSelected) {
      // Remove all filtered from selected
      setSelectedEmployees(selectedEmployees.filter(u => !filteredUsernames.includes(u)));
    } else {
      // Add all filtered that are not already selected
      const toAdd = filteredUsernames.filter(u => !selectedEmployees.includes(u));
      setSelectedEmployees([...selectedEmployees, ...toAdd]);
    }
  };

  // Filtered employees for recipient multi-select
  const filteredEmployeesList = employees.filter(emp => {
    const search = employeeSearch.toLowerCase().trim();
    if (!search) return true;
    return (
      emp.name.toLowerCase().includes(search) ||
      emp.username.toLowerCase().includes(search) ||
      emp.role.toLowerCase().includes(search) ||
      emp.branch.toLowerCase().includes(search)
    );
  });

  // Filter notifications based on chosen list filter (All or specific category)
  const filteredNotificationsList = notifications.filter(notif => {
    if (selectedFilterCategory === 'All') return true;
    return notif.category === selectedFilterCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER ELEMENT */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BellRing className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Megaphone className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Executive Communications</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Executive Broadcast</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Publish company directives, SOP updates, compliance notices, and urgent warnings to all active personnel or precisely targeted individuals with real-time audit ledger.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COMPOSE SECTION */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">Compose New Directives</h3>
            </div>

            {canBroadcast ? (
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* CATEGORY SELECTOR */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">
                    Announcement Category
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TARGETING TOGGLE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">
                    Recipient Group Target
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setTargetType('all')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                        targetType === 'all'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>All Employees</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('specific')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                        targetType === 'specific'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Specific Select</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* RECIPIENT MULTI-SELECTOR (IF SPECIFIC IS SELECTED) */}
                {targetType === 'specific' && (
                  <div className="space-y-2 animate-slide-in border border-slate-150 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 font-mono">Select Recipients</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllFiltered(filteredEmployeesList)}
                        className="text-[9px] font-bold text-emerald-600 hover:underline"
                      >
                        {filteredEmployeesList.every(u => selectedEmployees.includes(u.username)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Employee Search box */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search employee, branch, or role..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                      {employeeSearch && (
                        <button
                          type="button"
                          onClick={() => setEmployeeSearch('')}
                          className="absolute right-2.5 top-2 hover:text-slate-600"
                        >
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Checkbox selector list */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-150 rounded-lg bg-white">
                      {filteredEmployeesList.length === 0 ? (
                        <p className="text-center text-[10px] text-slate-400 py-4">No matching employees found.</p>
                      ) : (
                        filteredEmployeesList.map(emp => {
                          const isSelected = selectedEmployees.includes(emp.username);
                          return (
                            <div
                              key={emp.id}
                              onClick={() => handleToggleEmployeeSelection(emp.username)}
                              className={`p-2 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{emp.name}</p>
                                  <p className="text-[9px] text-slate-500 font-medium truncate">
                                    @{emp.username} · {emp.role} · {emp.branch}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected badge count */}
                    <div className="flex flex-wrap gap-1 items-center pt-1">
                      <span className="text-[9px] font-extrabold text-slate-400 font-mono">Selected:</span>
                      {selectedEmployees.length === 0 ? (
                        <span className="text-[9px] text-red-500 font-bold font-mono">None selected yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto w-full mt-1">
                          {selectedEmployees.map(u => {
                            const emp = employees.find(e => e.username === u);
                            return (
                              <span
                                key={u}
                                className="inline-flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold"
                              >
                                {emp ? emp.name : u}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEmployeeSelection(u);
                                  }}
                                  className="hover:text-red-600"
                                >
                                  <X className="w-2.5 h-2.5 ml-0.5 shrink-0" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MESSAGE TEXTAREA */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">
                    Urgent Directive Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type urgent directive text or corporate SOP announcement here (e.g., 'All branches must sync daily collections ledger by 4:00 PM starting Monday. Please ensure strict compliance.')..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition-all resize-none leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BellRing className="w-4 h-4 animate-bounce" />
                  {sending ? 'Publishing Broadcast...' : 'Broadcast Directive'}
                </button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-3">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Your employee profile does not hold explicit authorization to compose and broadcast announcements.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left">
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    <Info className="w-3 h-3 inline mr-1 text-amber-600 shrink-0" />
                    <strong>Request Authorization:</strong> You can request the "BroadcastNotifications" permission inside the Employee register page, or contact the Super Admin to elevate your authorization matrix.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LEDGER & AUDIT TRAIL */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">Broadcast Audit Ledger</h3>
              </div>

              {/* History categories filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold font-mono">Filter:</span>
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold font-mono">Syncing broadcast registry...</p>
                </div>
              ) : filteredNotificationsList.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <BellRing className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">No executive broadcasts found.</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                    All published alerts, directives, and notifications appear here in chronological order with audit tracking.
                  </p>
                </div>
              ) : (
                filteredNotificationsList.map(notif => {
                  const categoryInfo = CATEGORIES.find(c => c.id === notif.category) || CATEGORIES[0];
                  // Determine recipients label
                  const isAll = !notif.recipients || notif.recipients.length === 0 || notif.recipients.includes('all');
                  
                  // Total targeted employees count
                  const targetCount = isAll ? employees.length : (notif.recipients ? notif.recipients.length : 0);
                  const readCount = notif.readBy.length;
                  const percentRead = targetCount > 0 ? Math.round((readCount / targetCount) * 100) : 0;

                  return (
                    <div key={notif.id} className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Category Badge */}
                            <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md border ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            {/* Date Time */}
                            <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-semibold font-mono">
                              <Clock className="w-3 h-3 text-slate-350" />
                              {new Date(notif.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          
                          {/* Sender Info */}
                          <p className="text-[10px] font-bold text-slate-500">
                            Published by: <span className="text-slate-800">@{notif.sender}</span>
                          </p>
                        </div>

                        {/* RETRACT / DELETE FOR SUPER ADMIN OR SENDER */}
                        {canBroadcast && (
                          <button
                            onClick={() => handleDelete(notif.id)}
                            title="Retract / Delete Announcement"
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Announcement Message Content */}
                      <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl">
                        <p className="text-xs text-slate-800 leading-relaxed font-semibold break-words whitespace-pre-line">
                          {notif.message}
                        </p>
                      </div>

                      {/* RECIPIENT INFORMATION & AUDIT RECEIPTS */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[10px] font-mono border-t border-slate-100">
                        {/* Target List */}
                        <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-extrabold uppercase shrink-0 text-slate-400 tracking-wider">Target:</span>
                          {isAll ? (
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">All Employees</span>
                          ) : (
                            <div className="truncate max-w-[200px] sm:max-w-[300px]" title={notif.recipients?.join(', ')}>
                              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] mr-1 inline-block">
                                Specific ({notif.recipients?.length})
                              </span>
                              <span className="text-slate-600 font-bold">{notif.recipients?.map(u => `@${u}`).join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Read Receipts Progress Bar & Stats */}
                        <div className="shrink-0 space-y-1.5">
                          <div className="flex items-center justify-between sm:justify-end gap-2 text-[9px] text-slate-400 font-extrabold tracking-wider">
                            <span>READ RECEIPTS:</span>
                            <span className="text-slate-700">
                              {readCount} / {targetCount} ({percentRead}%)
                            </span>
                          </div>
                          
                          {/* Miniature Progress Bar */}
                          <div className="w-full sm:w-32 bg-slate-100 rounded-full h-1 overflow-hidden border border-slate-200">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, percentRead)}%` }}
                            />
                          </div>

                          {/* Tooltip detail lists */}
                          {readCount > 0 && (
                            <p className="text-[9px] text-slate-400 text-right truncate max-w-[150px]" title={`Read by: ${notif.readBy.join(', ')}`}>
                              Seen by: {notif.readBy.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
