/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, CompanyProfile as CompanyProfileType } from '../types';
import { 
  Building2, Save, Download, Upload, Trash2, RefreshCw, 
  ShieldAlert, Landmark, FileText, Check, AlertTriangle, Loader2
} from 'lucide-react';
import { showToast, ConfirmDialog } from './UIElements';

interface CompanyProfileProps {
  currentUser: Employee;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ currentUser }) => {
  const [profile, setProfile] = useState<CompanyProfileType>({
    name: 'Manha Digital Consumer Financing',
    slogan: 'Durable products, easy installments, reliable service',
    phone: '+922134567890',
    email: 'info@manhadigital.pk',
    address: 'Plot SB-3, Block 13-C, University Road, Gulshan-e-Iqbal, Karachi',
    ntn: 'NTN-8930412-4',
    regNo: 'SEC-PK-2026-904',
    terms: '1. All installments are payable by the 10th of each calendar month.\n2. Late fee of RS 200/day is applicable after the 5-day grace period.\n3. The company reserves the right to repossess the asset in case of default of more than two consecutive installments.',
    logoUrl: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    mode: 'empty' | 'seeds' | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    mode: null
  });

  // Load active company profile
  const fetchCompanyProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/company-profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching company profile:', err);
      showToast('Error retrieving corporate profile.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showToast('Logo image must be smaller than 1MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
        showToast('Company logo attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Login background image must be smaller than 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          loginBgUrl: reader.result as string
        }));
        showToast('Login background attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSidebarBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Sidebar background image must be smaller than 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          sidebarBgUrl: reader.result as string
        }));
        showToast('Sidebar background attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Corporate Profile Changes
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Corporate profile saved successfully!', 'success');
        setProfile(data.companyProfile);
      } else {
        showToast(data.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during corporate profile update.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Export/Download JSON Database Backup
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await fetch('/api/maintenance/backup');
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        const datestring = new Date().toISOString().split('T')[0];
        a.download = `manha_erp_backup_${datestring}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Database backup archive generated and downloaded!', 'success');
      } else {
        showToast('Failed to fetch backup data.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error exporting database backup.', 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  // Import/Restore JSON Database Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoringBackup(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawText = event.target?.result as string;
          const parsedDb = JSON.parse(rawText);

          // Validation check
          if (!parsedDb || !Array.isArray(parsedDb.employees) || !Array.isArray(parsedDb.customers)) {
            showToast('Invalid backup file schema structure.', 'error');
            setRestoringBackup(false);
            return;
          }

          // POST to backend
          const res = await fetch('/api/maintenance/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rawText
          });
          const data = await res.json();
          if (data.success) {
            showToast('System backup restored successfully!', 'success');
            // Reload company profile immediately
            fetchCompanyProfile();
          } else {
            showToast(data.message || 'Restoration failed.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Could not parse backup JSON file.', 'error');
        } finally {
          setRestoringBackup(false);
          // clear input
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset Database to empty data or demo seeds
  const handleResetDatabase = (mode: 'empty' | 'seeds') => {
    const title = mode === 'empty' ? 'Wipe Database Content' : 'Reset with Demo Seeds';
    const confirmMsg = mode === 'empty' 
      ? 'WARNING: This will completely erase all registered customers, agreements, payments, expenses, brands and products. Demo login credentials will be retained so you can log back in. Are you absolutely sure you want to wipe the database?' 
      : 'This will reset the entire system to standard demonstration seed records, erasing any modifications you have made. Do you want to proceed?';
    
    setConfirmState({
      isOpen: true,
      title,
      message: confirmMsg,
      mode
    });
  };

  const executeResetDatabase = async (adminPassword?: string) => {
    const mode = confirmState.mode;
    if (!mode) return;
    if (!adminPassword) {
      showToast('Operation cancelled. Administrator password is required.', 'warning');
      return;
    }

    setResettingDb(true);
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch('/api/maintenance/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Database state initialized successfully.', 'success');
        fetchCompanyProfile(); // Refresh
        
        // Force redirect to dashboard to prevent errors from deleted items
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast(data.message || 'Database reset failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during database reset.', 'error');
    } finally {
      setResettingDb(false);
    }
  };

  return (
    <div id="company-settings-view" className="space-y-6 pb-24 font-sans text-slate-800">
      
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
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">System Configuration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Settings & Backup</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Super-Admin Module &bull; Customise corporate parameters, download encrypted database archives, or seed demo data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: Company profile form */}
        <div className="lg:col-span-2">
          {loadingProfile ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Querying corporate metadata parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Corporate Identity Configuration</h3>
              </div>

              {/* Identity fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Enterprise Corporate Name</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="e.g., Manha Consumer Financing"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Company Logo (Image URL / Base64)</label>
                    <input
                      type="text"
                      name="logoUrl"
                      value={profile.logoUrl || ''}
                      onChange={handleProfileChange}
                      placeholder="Specify absolute URL or use file selector below"
                      className="mt-1.5 w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">OR Upload File:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="text-[10px] text-slate-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 h-full min-h-[80px]">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Logo Preview</span>
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="Logo preview" className="max-h-16 max-w-[120px] object-contain rounded border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Login Background Card */}
                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Login Page Background (Image URL / Base64)</label>
                    <input
                      type="text"
                      name="loginBgUrl"
                      value={profile.loginBgUrl || ''}
                      onChange={handleProfileChange}
                      placeholder="Specify absolute URL or use file selector below"
                      className="mt-1.5 w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">OR Upload File:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLoginBgUpload}
                        className="text-[10px] text-slate-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 h-full min-h-[80px]">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Login Bg Preview</span>
                    {profile.loginBgUrl ? (
                      <img src={profile.loginBgUrl} alt="Login Bg preview" className="max-h-16 max-w-[120px] object-contain rounded border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Default (Gradient)</span>
                    )}
                  </div>
                </div>

                {/* Custom Sidebar Background Card */}
                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Sidebar Background (Image URL / Base64)</label>
                    <input
                      type="text"
                      name="sidebarBgUrl"
                      value={profile.sidebarBgUrl || ''}
                      onChange={handleProfileChange}
                      placeholder="Specify absolute URL or use file selector below"
                      className="mt-1.5 w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">OR Upload File:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSidebarBgUpload}
                        className="text-[10px] text-slate-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 h-full min-h-[80px]">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Sidebar Bg Preview</span>
                    {profile.sidebarBgUrl ? (
                      <img src={profile.sidebarBgUrl} alt="Sidebar Bg preview" className="max-h-16 max-w-[120px] object-contain rounded border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Default (Gradient)</span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Corporate Slogan / Slogan Prefix</label>
                  <input
                    type="text"
                    required
                    name="slogan"
                    value={profile.slogan}
                    onChange={handleProfileChange}
                    placeholder="e.g., Easy Installments, Flexible Terms"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Registered Mobile / Phone</label>
                  <input
                    type="text"
                    required
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="+92 21 3456789"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Registered Business Email</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="info@corporate.pk"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">National Tax Number (NTN)</label>
                  <input
                    type="text"
                    required
                    name="ntn"
                    value={profile.ntn}
                    onChange={handleProfileChange}
                    placeholder="NTN-XXXXXXX-X"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">SEC Registration Number</label>
                  <input
                    type="text"
                    required
                    name="regNo"
                    value={profile.regNo}
                    onChange={handleProfileChange}
                    placeholder="SEC-PK-XXXX-XXXX"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Headquarters / HQ Address</label>
                  <textarea
                    required
                    name="address"
                    rows={2}
                    value={profile.address}
                    onChange={handleProfileChange}
                    placeholder="Plot 42, Block 3, University Road, Karachi"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Standard Lease Terms & Agreements (Printed on Deals)</label>
                  <textarea
                    required
                    name="terms"
                    rows={4}
                    value={profile.terms}
                    onChange={handleProfileChange}
                    placeholder="1. Installments must be paid before..."
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold leading-relaxed font-mono"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer font-sans"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Corporate Settings
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

        {/* RIGHT COLUMN: Database backup, restore, reset & seeds */}
        <div className="space-y-6">
          
          {/* Export & Restore Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Download className="w-4 h-4 text-emerald-600" />
              Backup & Restoration
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Export the full local JSON database state to download. Restore previous states or transfer servers seamlessly by importing backup files.
            </p>

            {/* Export trigger */}
            <button
              onClick={handleExportBackup}
              disabled={exportingBackup}
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {exportingBackup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export JSON Backup
                </>
              )}
            </button>

            {/* Import trigger file input */}
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
              <span className="block text-[10px] font-black text-slate-500 uppercase">Restore Database Backup</span>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors relative min-h-[100px]">
                {restoringBackup ? (
                  <div className="text-center space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Restoring database archives...</span>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="block text-[10px] font-bold text-emerald-700">Select backup file (.json)</span>
                    <span className="block text-[9px] text-slate-400">Restores all ledgers in real-time</span>
                  </div>
                )}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={restoringBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Wipe Database Card */}
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-red-50 pb-2">
              <ShieldAlert className="w-4 h-4" />
              Wipe Data & Demonstration Seeds
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Erase custom test records, reset cash flow balances, or restore clean demo seeds to demonstrate system functionality.
            </p>

            <div className="space-y-3 pt-1">
              
              {/* Wipe all data except login users */}
              <button
                onClick={() => handleResetDatabase('empty')}
                disabled={resettingDb}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Empty Operations Data
              </button>

              {/* Seed/Reload Standard Demo Data */}
              <button
                onClick={() => handleResetDatabase('seeds')}
                disabled={resettingDb}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reset / Seed Demo Data
              </button>

              <span className="block text-[9px] text-slate-400 text-center leading-normal italic">
                * Note: Emptying operations keeps seeded administrators and cashier credentials so you don't lock active sessions.
              </span>

            </div>
          </div>

        </div>

      </div>

      {/* Custom Reset Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Confirm Database Action"
        isDanger={confirmState.mode === 'empty'}
        requirePassword={true}
        placeholderPassword="Type 'admin123' to confirm..."
        onConfirm={executeResetDatabase}
        onCancel={() => setConfirmState({ isOpen: false, title: '', message: '', mode: null })}
      />

    </div>
  );
};
