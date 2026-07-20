/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, Box, Users, ShieldAlert, FileText, 
  Coins, Receipt, BarChart3, UserCheck, History, LogOut, 
  Bell, ChevronDown, User, Shield, Briefcase, MapPin, Settings, Landmark,
  Smartphone, Building, Check, Scale, MessageSquareCode, Menu, X
} from 'lucide-react';
import { Employee, RoleType, StaffNotification } from '../types';
import { motion } from 'motion/react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: Employee;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, currentUser, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<{ name: string; logoUrl?: string; sidebarBgUrl?: string; loginBgUrl?: string } | null>(null);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [whatsappAssignee, setWhatsappAssignee] = useState<string>('admin');

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      
      // Filter so that employee only gets notifications intended for them
      const list = data || [];
      const filtered = list.filter((n: any) => {
        const isAll = !n.recipients || n.recipients.length === 0 || n.recipients.includes('all');
        const isTarget = n.recipients && n.recipients.includes(currentUser.username);
        const isSender = n.sender === currentUser.username || n.sender === currentUser.name;
        return isAll || isTarget || isSender;
      });
      
      setNotifications(filtered);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetch('/api/company-profile')
      .then(res => res.json())
      .then(data => setCompanyProfile(data))
      .catch(err => console.error('Error loading corporate identity in Navbar:', err));

    fetch('/api/whatsapp-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.assignee) {
          setWhatsappAssignee(data.assignee);
        }
      })
      .catch(err => console.error('Error loading WhatsApp assignee:', err));

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentView]);

  // Helper to check RBAC permissions
  const hasAccess = (module: string): boolean => {
    const role: RoleType = currentUser.role;
    if (role === 'Super Admin') return true;

    // Support customized module permissions if present
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      if (currentUser.permissions.length > 0) {
        const targetPermission = module === 'MobileLock' ? 'LockUnlockRequest' : module;
        return currentUser.permissions.includes(targetPermission);
      }
    }

    switch (module) {
      case 'Dashboard':
        return true; // Everyone sees dashboard home, but content adapts
      case 'Inventory':
        return ['Branch Manager', 'Accounts'].includes(role);
      case 'Customers':
        return ['Branch Manager', 'Sales Executive', 'Operation'].includes(role);
      case 'Verifications':
        return ['Operation'].includes(role);
      case 'Agreements':
        return ['Branch Manager', 'Sales Executive', 'Operation'].includes(role);
      case 'Recovery':
        return ['Branch Manager', 'Recovery Officer', 'Cashier', 'Sales Executive'].includes(role);
      case 'Expenses':
        return ['Accounts', 'Branch Manager'].includes(role);
      case 'Finance':
        return ['Accounts', 'Branch Manager'].includes(role);
      case 'Reports':
        return ['Branch Manager', 'Accounts'].includes(role);
      case 'Employees':
        return ['Branch Manager'].includes(role);
       case 'Settings':
        return ['Branch Manager'].includes(role);
      case 'MobileLock':
        return ['Branch Manager', 'Operation', 'Recovery Officer', 'Cashier'].includes(role) || (currentUser.permissions && currentUser.permissions.includes('LockUnlockRequest'));
      case 'WhatsApp':
        // Accessible by Super Admin, Branch Manager, Accounts, and the specifically assigned operator
        return currentUser.role === 'Super Admin' || ['Branch Manager', 'Accounts'].includes(role) || currentUser.username.toLowerCase() === 'royal' || currentUser.username.toLowerCase() === whatsappAssignee.toLowerCase();
      case 'BranchManagement':
        return ['Branch Manager', 'Accounts'].includes(role);
      case 'Compliance':
        return ['Branch Manager', 'Accounts'].includes(role);
      case 'BroadcastNotifications':
        return true; // Allow all staff to view the announcements center
      case 'AuditLogs':
        return false; // Only Super Admin
      default:
        return false;
    }
  };

  const navItems = [
    { id: 'Dashboard', label: 'Operational Dashboard', icon: LayoutDashboard },
    { id: 'BroadcastNotifications', label: 'Executive Broadcast', icon: Bell },
    { id: 'Inventory', label: 'Inventory & Stock', icon: Box },
    { id: 'Customers', label: 'Customer Registration', icon: Users },
    { id: 'Verifications', label: 'Operations Verification', icon: ShieldAlert },
    { id: 'Agreements', label: 'Lease Agreements', icon: FileText },
    { id: 'Recovery', label: 'Recovery & Payments', icon: Coins },
    { id: 'Finance', label: 'Finance & Accounts', icon: Landmark },
    { id: 'WhatsApp', label: 'WhatsApp Alerts Wing', icon: MessageSquareCode },
    { id: 'MobileLock', label: 'Mobile Lock & Unlock', icon: Smartphone },
    { id: 'BranchManagement', label: 'Branch Management', icon: Building },
    { id: 'Compliance', label: 'Compliance & Legal Wing', icon: Scale },
    { id: 'Expenses', label: 'Corporate Expenses', icon: Receipt },
    { id: 'Reports', label: 'Enterprise Reports', icon: BarChart3 },
    { id: 'Employees', label: 'Employee Register', icon: UserCheck },
    { id: 'Settings', label: 'Company Settings', icon: Settings },
    { id: 'AuditLogs', label: 'Security Audit Logs', icon: History }
  ].filter(item => hasAccess(item.id));

  return (
    <>
      {/* Horizontal Upper Header Bar - ELITE PRIVATE WEALTH TERMINAL (LIGHT THEME) */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 py-3 h-16 flex items-center justify-between no-print font-sans shadow-xs relative text-slate-900">
        {/* Dynamic liquid gold-emerald premium brand line */}
        <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600" />
        
        <div className="flex items-center gap-2 relative z-10 min-w-0">
          {/* Mobile Hamburger / Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 -ml-1 md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5.5 h-5.5 text-slate-700" /> : <Menu className="w-5.5 h-5.5 text-slate-600" />}
          </button>

          {/* Brand Label */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {companyProfile?.logoUrl ? (
              <img 
                src={companyProfile.logoUrl} 
                alt="Logo" 
                className="h-9 sm:h-12 md:h-15 w-auto max-w-[100px] sm:max-w-[180px] object-contain transition-all duration-300" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-emerald-600 shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base md:text-xl font-black tracking-tight font-display text-slate-950 block leading-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {companyProfile?.name || "Manha Consumer Financing"}
              </h1>
              <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest font-mono hidden sm:block">Future Wealth Terminal v1.5</p>
            </div>
          </div>
        </div>

        {/* User Session Quick Info */}
        <div className="flex items-center gap-4">
          {/* Branch & Role badges */}
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-50 border border-slate-200 text-slate-600 font-mono">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {currentUser.branch}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] bg-emerald-50 border border-emerald-100/80 text-emerald-800 font-bold uppercase tracking-wider">
              <Briefcase className="w-3 h-3 text-emerald-600" />
              {currentUser.role}
            </span>
          </div>

          {/* Notifications Trigger - Visible to all staff EXCEPT Super Admin */}
          {currentUser.role !== 'Super Admin' && (
            <div className="relative">
              <button
                id="notifications-bell"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all relative border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.readBy.includes(currentUser.username)) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 animate-slide-in text-slate-800">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">Company Announcements</span>
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {notifications.filter(n => !n.readBy.includes(currentUser.username)).length} New
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-[11px] text-slate-400 py-6">No announcements broadcasted yet.</p>
                    ) : (
                      notifications.map(n => {
                        const isRead = n.readBy.includes(currentUser.username);
                        return (
                          <div 
                            key={n.id} 
                            onClick={() => !isRead && handleMarkRead(n.id)}
                            className={`p-3 transition-colors flex gap-2.5 cursor-pointer ${
                              isRead ? 'bg-white hover:bg-slate-50/30' : 'bg-emerald-50/20 hover:bg-emerald-50/45'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                              isRead ? 'bg-slate-300' : 'bg-emerald-500 animate-ping'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <p className="text-[10px] font-bold text-slate-400">@{n.sender}</p>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className={`text-xs mt-0.5 leading-relaxed break-words ${isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                                {n.message}
                              </p>
                              {!isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkRead(n.id);
                                  }}
                                  className="mt-1.5 text-[9px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <Check className="w-2.5 h-2.5" /> Mark as Read
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company Settings Quick Access on Top */}
          {hasAccess('Settings') && (
            <button
              onClick={() => {
                setCurrentView('Settings');
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'Settings'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-extrabold shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Company Profile & Settings"
            >
              <Settings className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black hidden lg:inline">Settings</span>
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              id="user-profile-menu"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 pl-1.5 pr-3 py-1 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-emerald-500/30 rounded-2xl text-left transition-all duration-300 shadow-sm cursor-pointer relative group text-slate-800"
            >
              <div className="relative h-8 w-8 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                {currentUser.photo ? (
                  <img 
                    src={currentUser.photo} 
                    alt={currentUser.name} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-4.5 h-4.5 text-emerald-600" />
                )}
                {/* Active pulse dot indicator */}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none tracking-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                  <span className="text-[9px] text-slate-400 font-mono">@{currentUser.username}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">{currentUser.role}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-450 group-hover:text-slate-600 transition-colors" />
            </button>

             {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-80 rounded-[24px] bg-white border border-slate-200/95 shadow-2xl z-50 overflow-hidden animate-slide-in text-slate-800">
                {/* Micro ID Card Premium Layout inside Top Bar Dropdown */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 text-white relative overflow-hidden border-b border-slate-800">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:0.5rem_0.5rem] opacity-[0.05]" />
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl" />
                  
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
                      {currentUser.photo ? (
                        <img 
                          src={currentUser.photo} 
                          alt={currentUser.name} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-7 h-7 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-xs">
                        OFFICIAL PORTAL ID
                      </span>
                      <h4 className="text-sm font-black text-white mt-1.5 tracking-tight truncate leading-none">
                        {currentUser.name}
                      </h4>
                      <p className="text-[10px] text-slate-300 font-mono mt-1">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2.5 text-xs bg-slate-50/50 text-slate-600">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Employee ID</span>
                    <span className="text-slate-800 font-black font-mono">{currentUser.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">NIC Number</span>
                    <span className="text-slate-800 font-black font-mono">{currentUser.cnic || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Registered Branch</span>
                    <span className="text-emerald-700 font-black font-mono uppercase text-[10px]">{currentUser.branch || 'Main Branch'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Designation / Role</span>
                    <span className="text-slate-800 font-black font-mono uppercase text-[10px]">{currentUser.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Department</span>
                    <span className="text-slate-800 font-black font-mono uppercase text-[10px]">{currentUser.department || 'Operations Team'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200/60 flex flex-col gap-2">
                  {hasAccess('Settings') && (
                    <button
                      onClick={() => {
                        setCurrentView('Settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-center px-4 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-slate-200/80"
                    >
                      <Settings className="w-4 h-4 shrink-0 text-slate-550" />
                      Company Profile Settings
                    </button>
                  )}
                  <button
                    id="navbar-logout-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-center px-4 py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-xs text-red-600 hover:text-red-700 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-red-100"
                  >
                    <LogOut className="w-4 h-4 shrink-0 text-red-500" />
                    Sign Out of Terminal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. Desktop Persistent Left Sidebar (Visible only on md: screens and up) */}
      <nav 
        id="app-sidebar" 
        className="hidden md:flex fixed top-16 bottom-0 left-0 w-64 bg-white bg-gradient-to-b from-white via-[#fbfdfc] to-[#f4f9f7] border-r border-slate-200/90 z-30 flex-col py-6 no-print font-sans text-slate-700 overflow-y-auto no-scrollbar shadow-xs select-none"
        style={companyProfile?.sidebarBgUrl ? {
          backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.97)), url(${companyProfile.sidebarBgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {/* Animated glowing orbs and mesh for Desktop - Light mode */}
        {!companyProfile?.sidebarBgUrl && (
          <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-500/5 blur-[50px]" />
            <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-emerald-400/5 blur-[40px] animate-float-1" />
            <div className="absolute bottom-[20%] right-[10%] w-40 h-40 rounded-full bg-teal-400/5 blur-[45px] animate-float-2" />
            <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:2rem_2rem]" />
          </div>
        )}

        <div className="px-4.5 mb-2.5 mt-1 relative z-10">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">
            Modules Navigator
          </span>
        </div>
        
        <div className="flex flex-col gap-1 w-full px-3 relative z-10">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                id={`nav-${item.id}`}
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-300 w-full group cursor-pointer border ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-50/75 via-[#f2faf5] to-white border-emerald-500/25 text-emerald-900 font-black shadow-xs relative before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:bg-emerald-600 before:rounded-r-full' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-150/40 border-transparent font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-110 text-emerald-600' : 'text-slate-450 group-hover:scale-105 group-hover:text-slate-750'}`} />
                <span className="text-xs tracking-wide group-hover:translate-x-0.5 transition-transform">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-col mt-auto px-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 gap-1 select-none relative z-10">
          <p>Logged in as: <span className="text-slate-600 font-semibold">{currentUser.name}</span></p>
          <p className="font-mono text-[9px] text-slate-400">IP Secure Terminal Gateway</p>
        </div>
      </nav>

      {/* 2. Mobile Off-Canvas Slide Drawer Navigation Menu (Visible only on mobile screens) */}
      <div id="mobile-nav-overlay" className="no-print">
        {/* Backdrop overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sliding Menu Drawer */}
        <div 
          className={`fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white border-r border-slate-200 z-50 p-5 flex flex-col shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={companyProfile?.sidebarBgUrl ? {
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98)), url(${companyProfile.sidebarBgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}}
        >
          {/* Header of Mobile Drawer */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              {companyProfile?.logoUrl ? (
                <img 
                  src={companyProfile.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-auto max-w-[120px] object-contain" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <span className="font-bold text-slate-900 text-xs truncate max-w-[120px]">
                {companyProfile?.name || "Manha Consumer"}
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Module Links List with Independent Scroll */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-scrollbar">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
              Select Module
            </p>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-500/25 text-emerald-950 font-black shadow-xs' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 border-transparent font-medium'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-600 scale-110' : 'text-slate-400'}`} />
                  <span className="text-xs leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer of Mobile Drawer */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
              {currentUser.photo ? (
                <img 
                  src={currentUser.photo} 
                  alt={currentUser.name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4.5 h-4.5 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 font-mono truncate mt-1">
                @{currentUser.username} • {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Bottom Toolbar / Navigation Dock (Always anchored at bottom of mobile screen) */}
      <nav 
        id="mobile-bottom-dock" 
        className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 px-2 flex items-center justify-around z-30 shadow-2xl md:hidden no-print select-none"
      >
        {/* Dynamic primary quick navigation keys */}
        {['Dashboard', 'Recovery', 'WhatsApp', 'Customers']
          .filter(id => hasAccess(id))
          .slice(0, 3)
          .map(id => {
            const item = navItems.find(x => x.id === id);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = currentView === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setCurrentView(id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 cursor-pointer flex-1 py-1 h-full transition-all duration-200 ${
                  isActive ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5.5 h-5.5 transition-all ${isActive ? 'scale-110 text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[9px] font-semibold tracking-tight truncate max-w-[85px] leading-none">
                  {id === 'Dashboard' ? 'Home' : id === 'WhatsApp' ? 'Alerts' : id}
                </span>
              </button>
            );
          })}

        {/* More Options / Hamburger Drawer Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer flex-1 py-1 h-full transition-all duration-200 ${
            isMobileMenuOpen ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {isMobileMenuOpen ? <X className="w-5.5 h-5.5 text-emerald-600 scale-110" /> : <Menu className="w-5.5 h-5.5 text-slate-400" />}
          <span className="text-[9px] font-semibold tracking-tight leading-none">Menu</span>
        </button>
      </nav>
    </>
  );
};
