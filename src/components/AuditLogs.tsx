/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuditLog, Employee } from '../types';
import { 
  History, ShieldAlert, Search, RefreshCw, Loader2, Calendar, 
  Terminal, ShieldCheck, Filter, Download 
} from 'lucide-react';
import { showToast, exportToCSV } from './UIElements';

interface AuditLogsProps {
  currentUser: Employee;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedAction, setSelectedAction] = useState<string>('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch security audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get distinct roles and actions for filters
  const distinctRoles = ['All', ...new Set(logs.map(l => l.role))];
  const distinctActions = ['All', ...new Set(logs.map(l => l.action))];

  // Filters
  const filteredLogs = logs.filter(log => {
    const searchStr = `${log.id} ${log.username} ${log.action} ${log.details}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === 'All' || log.role === selectedRole;
    const matchAction = selectedAction === 'All' || log.action === selectedAction;
    return matchSearch && matchRole && matchAction;
  });

  // KPI Calculations
  const totalEvents = logs.length;
  const uniqueUsersCount = new Set(logs.map(l => l.username)).size;
  const loginEventsCount = logs.filter(l => l.action.toLowerCase() === 'login').length;
  const financialEventsCount = logs.filter(l => 
    ['installment collection', 'record expense', 'customer registered', 'agreement created']
      .includes(l.action.toLowerCase())
  ).length;

  return (
    <div id="auditlogs-view" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <History className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <History className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Operations Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Audit Trails</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Cryptographically sequenced system events logs to trace role elevation, user sign-ins, and cash operations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportToCSV(logs, 'manha_erp_security_audit_logs')}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total SysEvents</p>
            <h4 className="text-xl font-black text-slate-800 font-mono mt-1">{totalEvents} Logs</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Stored in persistent cache</p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Unique Active Handles</p>
            <h4 className="text-xl font-black text-slate-800 font-mono mt-1">{uniqueUsersCount} Operators</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Terminals authorized</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Terminal Accesses</p>
            <h4 className="text-xl font-black text-slate-800 font-mono mt-1">{loginEventsCount} Sign-ins</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Since system initializing</p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
            <Terminal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Financial Modifications</p>
            <h4 className="text-xl font-black text-slate-800 font-mono mt-1">{financialEventsCount} Entries</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ All audits balanced</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search details, usernames..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full font-bold cursor-pointer"
            >
              {distinctRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full font-bold cursor-pointer"
            >
              {distinctActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Reading system security event trails...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-normal text-xs">
                No system logs match the active filters.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans transition-all hover:bg-slate-100/40"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {log.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          @{log.username}
                        </span>
                        <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-100">
                          {log.role}
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                          &bull; {log.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-normal pl-0.5">
                        {log.details}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 sm:text-right font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
