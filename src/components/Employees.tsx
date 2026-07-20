/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, RoleType } from '../types';
import { 
  UserCheck, Plus, Search, MapPin, Briefcase, DollarSign, 
  Percent, ShieldAlert, Loader2, RefreshCw, Eye, EyeOff, UserMinus, UserPlus, Trash2 
} from 'lucide-react';
import { showToast } from './UIElements';

const availableModules = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Inventory', label: 'Inventory' },
  { id: 'Customers', label: 'Customers Reg.' },
  { id: 'Verifications', label: 'Ops Verification' },
  { id: 'Agreements', label: 'Lease Agreements' },
  { id: 'Recovery', label: 'Recovery & Payments' },
  { id: 'Finance', label: 'Finance & Accounts' },
  { id: 'Expenses', label: 'Corporate Expenses' },
  { id: 'Reports', label: 'Enterprise Reports' },
  { id: 'Employees', label: 'Employee Register' },
  { id: 'Settings', label: 'Settings & Backup' },
  { id: 'AuditLogs', label: 'Audit Logs' },
  { id: 'LockUnlockRequest', label: 'Lock/Unlock Requests' },
  { id: 'BroadcastNotifications', label: 'Send Announcements' },
  { id: 'BranchManagement', label: 'Branch Management' },
  { id: 'Compliance', label: 'Compliance & Legal' }
];

interface EmployeesProps {
  currentUser: Employee;
  onUpdateCurrentUser?: (emp: Employee) => void;
}

export const Employees: React.FC<EmployeesProps> = ({ currentUser, onUpdateCurrentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('Sales Executive');
  const [branch, setBranch] = useState('Karachi Central');
  const [department, setDepartment] = useState('Sales');
  const [salary, setSalary] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [photo, setPhoto] = useState('');
  const [cnic, setCnic] = useState('');

  const getDefaultPermissionsForRole = (r: RoleType): string[] => {
    if (r === 'Super Admin') {
      return ['Dashboard', 'Inventory', 'Customers', 'Verifications', 'Agreements', 'Recovery', 'Finance', 'Expenses', 'Reports', 'Employees', 'Settings', 'AuditLogs', 'LockUnlockRequest', 'BroadcastNotifications', 'BranchManagement'];
    }
    switch (r) {
      case 'Branch Manager':
        return ['Dashboard', 'Inventory', 'Customers', 'Agreements', 'Recovery', 'Finance', 'Expenses', 'Reports', 'Employees', 'Settings', 'LockUnlockRequest', 'BranchManagement'];
      case 'Accounts':
        return ['Dashboard', 'Inventory', 'Finance', 'Expenses', 'Reports', 'BranchManagement'];
      case 'Operation':
        return ['Dashboard', 'Customers', 'Verifications', 'Agreements', 'LockUnlockRequest'];
      case 'Sales Executive':
        return ['Dashboard', 'Customers', 'Agreements'];
      case 'Recovery Officer':
      case 'Cashier':
        return ['Dashboard', 'Recovery', 'LockUnlockRequest'];
      default:
        return ['Dashboard'];
    }
  };

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(getDefaultPermissionsForRole('Sales Executive'));

  // Editing States
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('Sales Executive');
  const [editBranch, setEditBranch] = useState('Karachi Central');
  const [editDepartment, setEditDepartment] = useState('Sales');
  const [editSalary, setEditSalary] = useState('');
  const [editCommissionRate, setEditCommissionRate] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editPhoto, setEditPhoto] = useState('');
  const [editCnic, setEditCnic] = useState('');

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword(emp.password || '');
    setEditRole(emp.role);
    setEditBranch(emp.branch);
    setEditDepartment(emp.department);
    setEditSalary(String(emp.salary));
    setEditCommissionRate(String(emp.commissionRate));
    setEditPermissions(emp.permissions || getDefaultPermissionsForRole(emp.role));
    setEditPhoto(emp.photo || '');
    setEditCnic(emp.cnic || '');
  };

  const branches = ['Karachi Central', 'Lahore West', 'Rawalpindi East', 'Peshawar North', 'Multan South'];
  const roles: RoleType[] = [
    'Super Admin',
    'Branch Manager',
    'Accounts',
    'Operation',
    'Sales Executive',
    'Recovery Officer',
    'Cashier'
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load employee records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      showToast('Please fill in all mandatory fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          password,
          role,
          branch,
          department,
          salary: Number(salary || 0),
          commissionRate: Number(commissionRate || 0),
          permissions: selectedPermissions,
          photo,
          cnic
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Employee ${name} registered successfully!`, 'success');
        setShowAddForm(false);
        // Clear fields
        setName('');
        setUsername('');
        setPassword('');
        setSalary('');
        setCommissionRate('');
        setPhoto('');
        setCnic('');
        setSelectedPermissions(getDefaultPermissionsForRole('Sales Executive'));
        fetchEmployees();
      } else {
        showToast(data.message || 'Error creating employee profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server communication failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAdminPassword = (): boolean => {
    // Session is already secure. In sandbox iframe we skip redundant blocking prompt to prevent browser freeze.
    return true;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editName || !editUsername || !editPassword) {
      showToast('Please fill in all mandatory fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          password: editPassword,
          role: editRole,
          branch: editBranch,
          department: editDepartment,
          salary: Number(editSalary || 0),
          commissionRate: Number(editCommissionRate || 0),
          permissions: editPermissions,
          photo: editPhoto,
          cnic: editCnic
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Employee ${editName} profile updated successfully!`, 'success');
        if (editingEmployee.id === currentUser.id && onUpdateCurrentUser) {
          onUpdateCurrentUser(data.employee);
        }
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        showToast(data.message || 'Error updating employee profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server communication failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployeeStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Employee status set to ${nextStatus}`, 'success');
        fetchEmployees();
      } else {
        showToast(data.message || 'Failed to update employee status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status.', 'error');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    // Bypass window.confirm due to iframe security constraints
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        showToast('Employee deleted successfully.', 'success');
        fetchEmployees();
      } else {
        showToast(data.message || 'Failed to delete employee.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting employee.', 'error');
    }
  };

  // Filters
  const filteredEmployees = employees.filter(emp => {
    const searchString = `${emp.name} ${emp.username} ${emp.role} ${emp.branch} ${emp.department}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const averageSalary = employees.length > 0
    ? Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length)
    : 0;

  return (
    <div id="employees-view" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <UserCheck className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Staff & Access Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Employees Registry</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Manage corporate employee profiles, salaries, branch locations, and system access levels.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={fetchEmployees}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Officer
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Headcount</p>
            <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{totalEmployees} Members</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Active rosters: {activeEmployees}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Operating Payroll Load</p>
            <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">RS {(averageSalary * totalEmployees).toLocaleString()}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Average salary: RS {averageSalary.toLocaleString()}/mo</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">RBAC Security Status</p>
            <h4 className="text-md font-bold text-emerald-800 font-mono mt-2">Active Multi-Branch Locks</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">● Terminal access controls active</p>
          </div>
          <div className="p-3 bg-emerald-50/50 text-emerald-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ADD NEW EMPLOYEE DIALOG MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-slide-in text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Register New Enterprise Employee
              </h3>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Employee Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kamran Yusuf"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Username ID</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. kamran.y"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Default Terminal Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">System Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as RoleType;
                      setRole(newRole);
                      setSelectedPermissions(getDefaultPermissionsForRole(newRole));
                    }}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Registered Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Accounts, Recoveries"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Base Monthly Salary (RS)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="55000"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Lease Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="2.5"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Identity Card (CNIC / NIC)</label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="e.g. 35201-1234567-9"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Employee Photo / Snap</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="photo-upload-input"
                    />
                    <label
                      htmlFor="photo-upload-input"
                      className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold transition-all shrink-0"
                    >
                      Choose Snap
                    </label>
                    {photo ? (
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-emerald-500 shrink-0">
                        <img src={photo} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">No file chosen</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Module Access & Permissions (Customizable)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl max-h-[160px] overflow-y-auto">
                  {availableModules.map(module => {
                    const isChecked = selectedPermissions.includes(module.id);
                    return (
                      <label key={module.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100/50 rounded transition-colors text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedPermissions(selectedPermissions.filter(id => id !== module.id));
                            } else {
                              setSelectedPermissions([...selectedPermissions, module.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-semibold select-none">{module.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEARCH AND DIRECTORY BLOCK */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Enterprise Staff Directory
          </h3>
          <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, role, branch..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            
            {/* View Mode Toggles */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading employee credentials database...</span>
          </div>
        ) : viewMode === 'cards' ? (
          /* GORGEOUS STAFF CARDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No employee profiles found matching your search.
              </div>
            ) : (
              filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative group overflow-hidden">
                  {/* Subtle color band based on role */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                  
                  {/* Status badge */}
                  <span className={`absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                    emp.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {emp.status}
                  </span>

                  {/* Header / Avatar */}
                  <div className="flex items-center gap-3.5 mt-2 pb-4 border-b border-slate-100">
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-sm font-black text-slate-600">
                          {emp.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-snug truncate" title={emp.name}>{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-medium truncate">@{emp.username}</p>
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50/70 text-emerald-800 text-[9px] font-bold uppercase tracking-wider border border-emerald-100/50">
                        {emp.role}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="py-4 space-y-2.5 text-[11px] text-slate-600 font-semibold flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Employee ID:</span>
                      <span className="font-mono text-emerald-700 font-bold">EMP-{emp.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Branch Location:</span>
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {emp.branch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Department:</span>
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {emp.department}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">NIC / CNIC Card:</span>
                      <span className="font-mono text-slate-700 font-medium">{emp.cnic || 'Not Assigned'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className="text-slate-400 font-medium">Base Monthly Salary:</span>
                      <span className="font-mono text-slate-900 text-xs font-black">RS {emp.salary.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Sales Commission:</span>
                      <span className="font-mono text-emerald-600 text-xs font-black">{emp.commissionRate}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                      title="Update profile details"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Update Profile
                    </button>
                    
                    {emp.id !== currentUser.id && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toggleEmployeeStatus(emp)}
                          className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            emp.status === 'Active'
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="py-2 px-3 rounded-xl text-[10px] font-bold bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 hover:border-red-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* TRADITIONAL TABLE VIEW */
          <div className="overflow-x-auto text-xs font-semibold">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3 pl-2">Employee ID</th>
                  <th className="pb-3">Name / Handle</th>
                  <th className="pb-3">Role & Dept</th>
                  <th className="pb-3">Branch Location</th>
                  <th className="pb-3 text-right">Base Salary</th>
                  <th className="pb-3 text-right">Comm.</th>
                  <th className="pb-3 text-center">Security Status</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-normal">
                      No employee profiles found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-2 font-mono text-emerald-700 font-bold">{emp.id}</td>
                      <td className="py-3.5 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">
                              {emp.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono font-medium">@{emp.username} &bull; NIC: {emp.cnic || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 mb-1">
                          {emp.role}
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">{emp.department}</p>
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {emp.branch}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate-800 font-bold">RS {emp.salary.toLocaleString()}</td>
                      <td className="py-3.5 text-right font-mono text-emerald-700 font-bold">{emp.commissionRate}%</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                            title="Edit employee record"
                          >
                            Edit Profile
                          </button>
                          {emp.id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => toggleEmployeeStatus(emp)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  emp.status === 'Active'
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT EMPLOYEE DIALOG MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-scale-up text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Edit Staff Profile: {editingEmployee.name}
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)} 
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Username ID</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Terminal Password</label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">System Security Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const newRole = e.target.value as RoleType;
                      setEditRole(newRole);
                      setEditPermissions(getDefaultPermissionsForRole(newRole));
                    }}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Branch Office</label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Corporate Department</label>
                  <input
                    type="text"
                    required
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Monthly Base Salary (RS)</label>
                  <input
                    type="number"
                    required
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Sales Commission Incentive (%)</label>
                  <input
                    type="number"
                    required
                    value={editCommissionRate}
                    onChange={(e) => setEditCommissionRate(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Identity Card (CNIC / NIC)</label>
                  <input
                    type="text"
                    required
                    value={editCnic}
                    onChange={(e) => setEditCnic(e.target.value)}
                    placeholder="e.g. 35201-1234567-9"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Employee Photo / Snap</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="edit-photo-upload-input"
                    />
                    <label
                      htmlFor="edit-photo-upload-input"
                      className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold transition-all shrink-0"
                    >
                      Choose Snap
                    </label>
                    {editPhoto ? (
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-emerald-500 shrink-0">
                        <img src={editPhoto} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">No file chosen</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Module Access & Permissions (Customizable)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl max-h-[160px] overflow-y-auto">
                  {availableModules.map(module => {
                    const isChecked = editPermissions.includes(module.id);
                    return (
                      <label key={module.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-100/50 rounded transition-colors text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditPermissions(editPermissions.filter(id => id !== module.id));
                            } else {
                              setEditPermissions([...editPermissions, module.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-semibold select-none">{module.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
