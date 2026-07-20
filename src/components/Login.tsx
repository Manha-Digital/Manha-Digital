/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, User, ArrowRight, Loader2 } from 'lucide-react';
import { Employee } from '../types';
import { showToast } from './UIElements';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (employee: Employee) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<{ name: string; slogan?: string; logoUrl?: string; loginBgUrl?: string; sidebarBgUrl?: string } | null>(null);

  useEffect(() => {
    fetch('/api/company-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCompanyProfile(data);
        }
      })
      .catch((err) => console.error('Error fetching company profile on login:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Welcome back, ${data.employee.name}!`, 'success');
        onLoginSuccess(data.employee);
      } else {
        showToast(data.message || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection to server failed. Booting fallback state...', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen flex flex-col justify-center items-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-gradient-to-br from-slate-50 via-[#f4f8f6] to-slate-100">
      
      {/* Dynamic Animated Background Mesh & Glowing Orbs - Light mode */}
      <div 
        className="absolute inset-0 overflow-hidden z-0 pointer-events-none bg-cover bg-center transition-all duration-700"
        style={companyProfile?.loginBgUrl ? { backgroundImage: `url(${companyProfile.loginBgUrl})` } : {}}
      >
        {companyProfile?.loginBgUrl ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
        ) : (
          <>
            {/* Subtle radial ambient gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[130px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[130px]" />
            
            {/* Glowing floating orbs that gently drift */}
            <div className="absolute top-[15%] left-[20%] w-72 h-72 rounded-full bg-emerald-400/10 blur-[100px] animate-float-1" />
            <div className="absolute bottom-[20%] right-[25%] w-80 h-80 rounded-full bg-amber-400/10 blur-[110px] animate-float-2" />
            <div className="absolute top-[50%] left-[60%] w-64 h-64 rounded-full bg-teal-400/5 blur-[90px] animate-float-3" />
            
            {/* Tech Grid Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
          </>
        )}
      </div>
 
      {/* Main Form Area */}
      <div className="z-10 flex flex-col items-center justify-center w-full max-w-md">
        {/* Header Block with Logo & Slogan */}
        <motion.div 
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="sm:mx-auto sm:w-full text-center px-4"
        >
          {companyProfile?.logoUrl ? (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center justify-center mb-3.5 max-w-[200px] sm:max-w-[240px]"
            >
              <img 
                src={companyProfile.logoUrl} 
                alt="Company Logo" 
                className="h-16 sm:h-20 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ) : (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex flex-col items-center justify-center mb-5 relative group cursor-default"
            >
              {/* Outer decorative glowing ring */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Main Emblem Box */}
              <div className="relative h-18 w-18 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-xl overflow-hidden transition-all duration-300 group-hover:border-emerald-500/30">
                {/* Tech microgrid overlay */}
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:0.25rem_0.25rem]" />
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-emerald-500/20 rounded-full blur-lg" />
                
                <div className="relative z-10 h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
                </div>
              </div>
              
              {/* Secure indicator tag */}
              <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-slate-900 border border-emerald-500/40 text-[8px] font-black uppercase tracking-widest text-emerald-400 shadow-md">
                SECURE ACCESS
              </div>
            </motion.div>
          )}
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wider uppercase text-emerald-500 [-webkit-text-stroke:1px_#000000]">
            {companyProfile?.name || 'Manha Digital'}
          </h2>
          <p className="mt-1.5 text-[10px] sm:text-[11px] text-slate-950 font-display font-extrabold tracking-widest uppercase">
            {companyProfile?.slogan || 'Your Dreams, Our Deals.'}
          </p>
        </motion.div>
 
        {/* Card Block */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-5 sm:mt-8 sm:mx-auto sm:w-full px-4 w-full"
        >
          <div className="bg-white/95 border border-slate-200/80 backdrop-blur-3xl py-6 px-5 sm:py-10 sm:px-8 shadow-2xl rounded-[32px] relative overflow-hidden group">
            {/* Soft border gold-emerald line */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500" />
            
            <form id="login-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
              {/* Username field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label htmlFor="username" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Username / Employee ID
                </label>
                <div className="mt-2 relative rounded-2xl shadow-sm group-focus-within:scale-[1.01] transition-transform">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans font-medium"
                    placeholder="Enter Username"
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label htmlFor="password" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Security Password
                </label>
                <div className="mt-2 relative rounded-2xl shadow-sm group-focus-within:scale-[1.01] transition-transform">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-5 w-5 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="pt-2"
              >
                <motion.button
                  id="login-btn"
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center items-center py-4 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 text-xs font-black uppercase tracking-widest text-white rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white transition-all group cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <>
                      Authenticate Access
                      <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* Footer Block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 text-center text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 font-sans px-4 select-none"
        >
          <p className="hover:text-emerald-600 transition-colors duration-350">
            All rights reserved by Manha Digital Pvt
          </p>
          <p className="text-[7.5px] text-slate-500 font-mono mt-1.5 tracking-wider uppercase">
            Authorized Personnel Access Only • Secure Session Gateway
          </p>
        </motion.div>
      </div>
    </div>
  );
};
