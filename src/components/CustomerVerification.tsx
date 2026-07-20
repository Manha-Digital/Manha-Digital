/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Employee } from '../types';
import { 
  ShieldAlert, Check, X, FileSearch, Scale, AlertTriangle, 
  MapPin, Landmark, Phone, CreditCard, ExternalLink, HelpCircle
} from 'lucide-react';
import { showToast } from './UIElements';

interface CustomerVerificationProps {
  currentUser: Employee;
}

export const CustomerVerification: React.FC<CustomerVerificationProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeFilter, setActiveFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [reviewingCustomer, setReviewingCustomer] = useState<Customer | null>(null);
  
  // Rejection/Need More Docs explanation
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'Reject' | 'MoreDocs' | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading customer list.', 'error');
    }
  };

  const handleVerification = async (id: string, status: Customer['verificationStatus']) => {
    try {
      const response = await fetch(`/api/customers/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          rejectedReason: remarks 
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Verification status set to: ${status}`, 'success');
        fetchCustomers();
        setReviewingCustomer(null);
        setRemarks('');
        setActionType(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with operations node.', 'error');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const isSuperOrManager = currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager';
    if (!isSuperOrManager && c.registeredBy !== currentUser.username) {
      return false;
    }
    if (activeFilter === 'All') return true;
    return c.verificationStatus === activeFilter;
  });

  return (
    <div id="verification-view" className="space-y-6 pb-24 font-sans text-slate-800">
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldAlert className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Operations Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Operations Verification</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            Step 5 &bull; Audit demographic documentation, residential utility bills, verified salaries, and guarantor relationships.
          </p>
        </div>
      </div>

      {/* Filter and overview deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm text-slate-700">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setReviewingCustomer(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === f 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {f} Reviews
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Terminal ID: <span className="font-mono text-emerald-700 font-bold">OPS-LOCK-229B</span> &bull; Security Level: 3
        </div>
      </div>

      {/* Main Grid Layout: left list, right detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Review Queue list */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 h-[550px] overflow-y-auto space-y-3 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Verification Queue ({filteredCustomers.length} records)
          </span>

          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-normal">
              No applicant folders found in this section.
            </div>
          ) : (
            filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => { setReviewingCustomer(c); setActionType(null); setRemarks(''); }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                  reviewingCustomer?.id === c.id 
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                }`}
              >
                <div className="flex justify-between items-center w-full gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-nowrap flex-1 min-w-0 overflow-hidden">
                    <span className="font-bold text-slate-800 truncate whitespace-nowrap" title={c.name}>{c.name}</span>
                    <span className="text-slate-300 shrink-0">|</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate whitespace-nowrap shrink-0" title={c.cnic}>{c.cnic}</span>
                    <span className="text-slate-300 shrink-0">|</span>
                    <span className="text-emerald-700 font-mono font-bold whitespace-nowrap shrink-0">RS {c.income.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded flex-shrink-0 whitespace-nowrap">
                    {c.id}
                  </span>
                </div>

                <div className="flex justify-between items-center w-full pt-1.5 border-t border-slate-100 text-[9px] text-slate-450 font-semibold">
                  <span>Branch: {c.branch}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] border uppercase font-black tracking-wider ${
                    c.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    c.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>{c.verificationStatus}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Side: Detailed Document review workspace */}
        <div className="lg:col-span-2">
          {reviewingCustomer ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm animate-fade-in text-slate-800">
              {/* Header card info */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex gap-4 items-center">
                  <img 
                    src={reviewingCustomer.documents.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                    alt="applicant" 
                    className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-md font-bold text-slate-800 font-display">{reviewingCustomer.name}</h3>
                    <p className="text-xs text-emerald-700 font-mono font-bold mt-0.5">National CNIC: {reviewingCustomer.cnic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Lease Profile Auditor
                  </span>
                </div>
              </div>

              {/* Verified fields checking checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Telephonic Phone Status</p>
                    <p className="text-xs font-bold text-slate-800">{reviewingCustomer.phone}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Verified Salary Income</p>
                    <p className="text-xs font-bold text-emerald-700 font-mono">RS {reviewingCustomer.income.toLocaleString()}/month</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Registered Address Integrity</p>
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{reviewingCustomer.address}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center gap-3">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Required Guarantor Status</p>
                    <p className="text-xs font-bold text-slate-800">
                      {reviewingCustomer.guarantors.length > 0 ? `${reviewingCustomer.guarantors.length} Attached` : 'No Guarantors Added'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents checking panels */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Audited Digital Artifacts Attachments
                </span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-center">
                  {/* Photo attachment preview */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col items-center justify-between gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">User Photo</span>
                    {reviewingCustomer.documents.photo ? (
                      <img src={reviewingCustomer.documents.photo} className="w-11 h-11 rounded border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-red-500 font-semibold italic">Missing File</span>
                    )}
                  </div>

                  {/* CNIC Front preview */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col items-center justify-between gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">CNIC Front</span>
                    {reviewingCustomer.documents.cnicFront ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <CreditCard className="w-6 h-6 text-emerald-600" />
                        <span className="text-[9px] text-emerald-700 font-bold">Auditable</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-500 font-semibold italic">Missing File</span>
                    )}
                  </div>

                  {/* Utility bill verification */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col items-center justify-between gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Utility Bill</span>
                    {reviewingCustomer.documents.utilityBill ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="text-[9px] text-emerald-700 font-bold">Attached</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-500 font-semibold italic">Missing File</span>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col items-center justify-between gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Signature</span>
                    {reviewingCustomer.documents.signature ? (
                      <img src={reviewingCustomer.documents.signature} className="h-6 w-16 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-red-500 font-semibold italic">Missing File</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION AUDIT BLOCK */}
              {reviewingCustomer.verificationStatus === 'Pending' && (
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  {actionType === null ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleVerification(reviewingCustomer.id, 'Approved')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Approve Applicant
                      </button>
                      <button
                        onClick={() => setActionType('Reject')}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Reject Applicant
                      </button>
                      <button
                        onClick={() => setActionType('MoreDocs')}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" /> Need More Documents
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="text-xs font-bold text-slate-700">
                        Provide Action Remarks / Explanations:
                      </span>
                      <textarea
                        required
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g., CNIC back image uploaded is completely blurred."
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setActionType(null); setRemarks(''); }}
                          className="bg-white border border-slate-200 text-[10px] text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer font-bold"
                        >
                          Cancel Remarks
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!remarks) {
                              showToast('Please specify explanation remarks.', 'warning');
                              return;
                            }
                            handleVerification(
                              reviewingCustomer.id, 
                              actionType === 'Reject' ? 'Rejected' : 'Need More Documents'
                            );
                          }}
                          className={`text-xs font-bold text-white px-4 py-1.5 rounded-lg cursor-pointer ${
                            actionType === 'Reject' ? 'bg-red-650 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
                          }`}
                        >
                          Confirm {actionType === 'Reject' ? 'Rejection' : 'Deficiency Status'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-16 text-center text-slate-400 text-xs h-96 flex flex-col justify-center items-center gap-3">
              <FileSearch className="w-10 h-10 text-slate-300" />
              <span>Select an applicant folder from the verification queue to begin document audit checks.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
