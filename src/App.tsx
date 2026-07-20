/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee } from './types';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { CustomerRegistration } from './components/CustomerRegistration';
import { CustomerVerification } from './components/CustomerVerification';
import { AgreementModule } from './components/AgreementModule';
import { RecoveryModule } from './components/RecoveryModule';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { Employees } from './components/Employees';
import { AuditLogs } from './components/AuditLogs';
import { CompanyProfile } from './components/CompanyProfile';
import { Finance } from './components/Finance';
import { WhatsAppPortal } from './components/WhatsAppPortal';
import { MobileLock } from './components/MobileLock';
import { BranchManagement } from './components/BranchManagement';
import { Compliance } from './components/Compliance';
import { BroadcastCenter } from './components/BroadcastCenter';
import { ToastContainer } from './components/UIElements';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Check for active login session in localStorage
  useEffect(() => {
    const cached = localStorage.getItem('erp_session_employee');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCurrentUser(parsed);
      } catch (e) {
        console.error('Session restore failed:', e);
      }
    }
  }, []);

  const handleLoginSuccess = (employee: Employee) => {
    setCurrentUser(employee);
    localStorage.setItem('erp_session_employee', JSON.stringify(employee));
    setActiveView('Dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('erp_session_employee');
  };

  // Check if session exists
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 text-slate-800">
        <Login onLoginSuccess={handleLoginSuccess} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#f4f7f6] to-[#edf3f1] text-slate-800 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-x-hidden">
      
      {/* Ambient dynamic background glow objects - Light elegant wealth theme */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[5%] left-[20%] w-[550px] h-[550px] rounded-full bg-emerald-400/10 blur-[130px] animate-float-1" />
        <div className="absolute bottom-[15%] right-[10%] w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[140px] animate-float-2" />
        <div className="absolute top-[50%] left-[2%] w-[400px] h-[400px] rounded-full bg-teal-400/5 blur-[110px] animate-float-3" />
        
        {/* Subtle high-class futuristic grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:5rem_5rem]" />
      </div>

      {/* Dynamic Nav System (Includes Sidebar + Top headers) */}
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        currentView={activeView} 
        setCurrentView={setActiveView}
      />

      {/* Main Viewport Content Block Wrapper */}
      <div className="flex-1 md:pl-64 min-h-0 w-full">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 w-full">
          {activeView === 'Dashboard' && <Dashboard currentUser={currentUser} setCurrentView={setActiveView} />}
          {activeView === 'Inventory' && <Inventory currentUser={currentUser} />}
          {activeView === 'Customers' && <CustomerRegistration currentUser={currentUser} />}
          {activeView === 'Verifications' && <CustomerVerification currentUser={currentUser} />}
          {activeView === 'Agreements' && <AgreementModule currentUser={currentUser} />}
          {activeView === 'Recovery' && <RecoveryModule currentUser={currentUser} />}
          {activeView === 'Finance' && <Finance currentUser={currentUser} />}
          {activeView === 'WhatsApp' && <WhatsAppPortal currentUser={currentUser} />}
          {activeView === 'MobileLock' && <MobileLock currentUser={currentUser} />}
          {activeView === 'Expenses' && <Expenses currentUser={currentUser} />}
          {activeView === 'Reports' && <Reports currentUser={currentUser} />}
          {activeView === 'Employees' && (
            <Employees 
              currentUser={currentUser} 
              onUpdateCurrentUser={(emp) => {
                setCurrentUser(emp);
                localStorage.setItem('erp_session_employee', JSON.stringify(emp));
              }} 
            />
          )}
          {activeView === 'Settings' && <CompanyProfile currentUser={currentUser} />}
          {activeView === 'BranchManagement' && <BranchManagement currentUser={currentUser} />}
          {activeView === 'Compliance' && <Compliance currentUser={currentUser} />}
          {activeView === 'BroadcastNotifications' && <BroadcastCenter currentUser={currentUser} />}
          {activeView === 'AuditLogs' && <AuditLogs currentUser={currentUser} />}
        </main>
      </div>

      {/* Global Notifications system wrapper */}
      <ToastContainer />
    </div>
  );
}
