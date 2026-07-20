import React, { useState, useEffect } from 'react';
import { Employee, LegalCase, Complaint, CorporateFiling, CompanyPolicy } from '../types';
import { 
  Scale, Plus, Search, ShieldCheck, FileText, Landmark, Users, Gavel, 
  Calendar, MessageSquare, ArrowRight, BookOpen, Trash2, CheckCircle2, 
  AlertTriangle, User, Clipboard, Clock, ChevronRight, Check
} from 'lucide-react';
import { showToast } from './UIElements';

interface ComplianceProps {
  currentUser: Employee;
}

export const Compliance: React.FC<ComplianceProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'complaints' | 'filings' | 'policies'>('cases');

  // Core Data States
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filings, setFilings] = useState<CorporateFiling[]>([]);
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Selected details
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedFiling, setSelectedFiling] = useState<CorporateFiling | null>(null);

  // Search & Filters
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('All');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintFilter, setComplaintFilter] = useState('All');
  const [filingFilter, setFilingFilter] = useState('All');

  // Modals & Forms
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Form States - Legal Case
  const [caseNum, setCaseNum] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCNIC, setCustomerCNIC] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [casePriority, setCasePriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [lawyerName, setLawyerName] = useState('');
  const [caseAssignedTo, setCaseAssignedTo] = useState('');
  const [complaintAssignedTo, setComplaintAssignedTo] = useState('');
  const [filingAssignedTo, setFilingAssignedTo] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form States - Complaint
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'Customer' | 'Employee'>('Customer');
  const [compCnicId, setCompCnicId] = useState('');
  const [compCategory, setCompCategory] = useState<'Billing' | 'Device Lock' | 'Staff Behavior' | 'Service' | 'General'>('General');
  const [compMessage, setCompMessage] = useState('');

  // Form States - Filing
  const [filingTitle, setFilingTitle] = useState('');
  const [filingAuthority, setFilingAuthority] = useState<'FBR' | 'SECP' | 'PRA' | 'SRB' | 'Other'>('FBR');
  const [filingType, setFilingType] = useState<'Annual Return' | 'Income Tax' | 'Sales Tax' | 'Withholding' | 'Other'>('Annual Return');
  const [filingDueDate, setFilingDueDate] = useState('');
  const [filingNotes, setFilingNotes] = useState('');

  // Form States - Policy
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyCategory, setPolicyCategory] = useState<'SOP' | 'HR' | 'Legal' | 'Compliance' | 'Operations'>('SOP');
  const [policyContent, setPolicyContent] = useState('');
  const [policyVersion, setPolicyVersion] = useState('v1.0');

  // Note/Noting Form Inputs
  const [caseNote, setCaseNote] = useState('');
  const [complaintNote, setComplaintNote] = useState('');
  const [filingNote, setFilingNote] = useState('');

  // Forwarding States
  const [forwardDept, setForwardDept] = useState('Operation');
  const [forwardComment, setForwardComment] = useState('');

  // SECP/FBR Action States
  const [fileDate, setFileDate] = useState('');
  const [fileAmt, setFileAmt] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, [activeTab]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const casesRes = await fetch('/api/compliance/legal-cases');
      const compRes = await fetch('/api/compliance/complaints');
      const filingsRes = await fetch('/api/compliance/corporate-filings');
      const policiesRes = await fetch('/api/compliance/company-policies');
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData || []);
      }

      if (casesRes.ok && compRes.ok && filingsRes.ok && policiesRes.ok) {
        const cData = await casesRes.json();
        const cpData = await compRes.json();
        const fData = await filingsRes.json();
        const pData = await policiesRes.json();

        setCases(cData || []);
        setComplaints(cpData || []);
        setFilings(fData || []);
        setPolicies(pData || []);

        // Refresh currently active detail screens if open
        if (selectedCase) {
          const freshCase = cData.find((c: LegalCase) => c.id === selectedCase.id);
          if (freshCase) setSelectedCase(freshCase);
        }
        if (selectedComplaint) {
          const freshComp = cpData.find((c: Complaint) => c.id === selectedComplaint.id);
          if (freshComp) setSelectedComplaint(freshComp);
        }
        if (selectedFiling) {
          const freshFiling = fData.find((f: CorporateFiling) => f.id === selectedFiling.id);
          if (freshFiling) setSelectedFiling(freshFiling);
        }
      }
    } catch (e) {
      console.error('Error fetching compliance module data:', e);
      showToast('Network error loading compliance files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check write/management rights for compliance settings
  const canModifyCompliance = (): boolean => {
    return currentUser.role === 'Super Admin' || currentUser.role === 'Branch Manager' || (currentUser.permissions && currentUser.permissions.includes('Compliance'));
  };

  // Submit handlers
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNum || !caseTitle || !courtName || !customerName || !customerCNIC) {
      showToast('Please fill all mandatory fields.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/compliance/legal-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseNumber: caseNum,
          title: caseTitle,
          courtName,
          customerName,
          customerCNIC,
          customerPhone,
          priority: casePriority,
          lawyerName,
          username: currentUser.username,
          assignedTo: caseAssignedTo
        })
      });
      if (res.ok) {
        showToast(`Legal Case ${caseNum} registered successfully!`, 'success');
        setShowCaseModal(false);
        // Reset states
        setCaseNum('');
        setCaseTitle('');
        setCourtName('');
        setCustomerName('');
        setCustomerCNIC('');
        setCustomerPhone('');
        setLawyerName('');
        setCasePriority('Medium');
        setCaseAssignedTo('');
        fetchComplianceData();
      } else {
        showToast('Failed to create legal case.', 'error');
      }
    } catch (err) {
      showToast('Network error submitting case.', 'error');
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compCnicId || !compMessage) {
      showToast('Please complete the complaint fields.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/compliance/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainerName: compName,
          type: compType,
          cnicOrId: compCnicId,
          category: compCategory,
          message: compMessage,
          username: currentUser.username,
          assignedTo: complaintAssignedTo
        })
      });
      if (res.ok) {
        showToast('Complaint logged and queued successfully.', 'success');
        setShowComplaintModal(false);
        setCompName('');
        setCompCnicId('');
        setCompMessage('');
        setCompCategory('General');
        setComplaintAssignedTo('');
        fetchComplianceData();
      } else {
        showToast('Failed to log complaint.', 'error');
      }
    } catch (err) {
      showToast('Server communication failure.', 'error');
    }
  };

  const handleCreateFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filingTitle || !filingDueDate) {
      showToast('Title and Due Date are mandatory.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/compliance/corporate-filings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: filingTitle,
          authority: filingAuthority,
          type: filingType,
          dueDate: filingDueDate,
          notes: filingNotes,
          username: currentUser.username,
          assignedTo: filingAssignedTo
        })
      });
      if (res.ok) {
        showToast('Filing schedule established.', 'success');
        setShowFilingModal(false);
        setFilingTitle('');
        setFilingDueDate('');
        setFilingNotes('');
        setFilingAssignedTo('');
        fetchComplianceData();
      } else {
        showToast('Failed to create filing schedule.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyTitle || !policyContent) {
      showToast('Title and Policy content cannot be empty.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/compliance/company-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: policyTitle,
          category: policyCategory,
          content: policyContent,
          version: policyVersion,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast('SOP Policy published successfully.', 'success');
        setShowPolicyModal(false);
        setPolicyTitle('');
        setPolicyContent('');
        setPolicyVersion('v1.0');
        fetchComplianceData();
      } else {
        showToast('Failed to publish company policy.', 'error');
      }
    } catch (err) {
      showToast('Network error publishing SOP.', 'error');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm('Are you sure you want to retire this company policy document?')) return;
    try {
      const res = await fetch(`/api/compliance/company-policies/${policyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      if (res.ok) {
        showToast('SOP Policy retired and deleted from registers.', 'success');
        fetchComplianceData();
      } else {
        showToast('Failed to retire policy.', 'error');
      }
    } catch (err) {
      showToast('Network communication error.', 'error');
    }
  };

  // Noting and Progress Handlers
  const submitCaseNote = async () => {
    if (!selectedCase || !caseNote.trim()) return;
    try {
      const res = await fetch(`/api/compliance/legal-cases/${selectedCase.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: caseNote,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast('Legal Case noting trail appended.', 'success');
        setCaseNote('');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Failed to append noting comments.', 'error');
    }
  };

  const updateCaseStatus = async (status: LegalCase['status']) => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`/api/compliance/legal-cases/${selectedCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast(`Case status updated to ${status}.`, 'success');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Failed to update status.', 'error');
    }
  };

  const submitComplaintNote = async () => {
    if (!selectedComplaint || !complaintNote.trim()) return;
    try {
      const res = await fetch(`/api/compliance/complaints/${selectedComplaint.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: complaintNote,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast('Complaint tracking note saved.', 'success');
        setComplaintNote('');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Failed to save tracking note.', 'error');
    }
  };

  const handleForwardComplaint = async () => {
    if (!selectedComplaint || !forwardComment.trim()) {
      showToast('Please write a routing explanation note.', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/compliance/complaints/${selectedComplaint.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Forwarded',
          forwardedTo: forwardDept,
          username: currentUser.username
        })
      });
      if (res.ok) {
        // Now append the note to history as a routing record
        await fetch(`/api/compliance/complaints/${selectedComplaint.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: `FORWARDED Complaint to [${forwardDept} Department]. Reason/Task: ${forwardComment}`,
            username: currentUser.username
          })
        });

        showToast(`Complaint routed to ${forwardDept} successfully.`, 'success');
        setForwardComment('');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Error during complaint routing.', 'error');
    }
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    const closureNote = window.prompt('Enter final resolution notes to close this complaint:');
    if (closureNote === null) return;
    if (!closureNote.trim()) {
      showToast('Resolution closure note is required.', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/compliance/complaints/${selectedComplaint.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Resolved',
          username: currentUser.username
        })
      });
      if (res.ok) {
        await fetch(`/api/compliance/complaints/${selectedComplaint.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: `CLOSED COMPLAINT - RESOLVED. Final Outcome: ${closureNote}`,
            username: currentUser.username
          })
        });
        showToast('Complaint marked as Resolved and Archived.', 'success');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Error resolving complaint.', 'error');
    }
  };

  const submitFilingNote = async () => {
    if (!selectedFiling || !filingNote.trim()) return;
    try {
      const res = await fetch(`/api/compliance/corporate-filings/${selectedFiling.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: filingNote,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast('Filing progress comment saved.', 'success');
        setFilingNote('');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Failed to save comment.', 'error');
    }
  };

  const handleMarkAsFiled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiling || !fileDate) {
      showToast('Filing completion date is required.', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/compliance/corporate-filings/${selectedFiling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Filed',
          filingDate: fileDate,
          amountPaid: fileAmt ? Number(fileAmt) : 0,
          username: currentUser.username
        })
      });
      if (res.ok) {
        await fetch(`/api/compliance/corporate-filings/${selectedFiling.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: `COMPLETED FILING with ${selectedFiling.authority}. Date Filed: ${fileDate}. Total fees paid: RS ${Number(fileAmt).toLocaleString()}`,
            username: currentUser.username
          })
        });
        showToast('Filing verified and status set to FILED.', 'success');
        setFileDate('');
        setFileAmt('');
        fetchComplianceData();
      }
    } catch (err) {
      showToast('Failed to update filing state.', 'error');
    }
  };

  const handleSetFilingStatus = async (status: CorporateFiling['status']) => {
    if (!selectedFiling) return;
    try {
      const res = await fetch(`/api/compliance/corporate-filings/${selectedFiling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          username: currentUser.username
        })
      });
      if (res.ok) {
        showToast(`Filing status shifted to ${status}`, 'success');
        fetchComplianceData();
      }
    } catch (e) {
      showToast('Error changing filing status.', 'error');
    }
  };

  // Filter by user assignment first if they are not a Super Admin
  const userCases = currentUser.role === 'Super Admin' ? cases : cases.filter(c => c.assignedTo === currentUser.username);
  const userComplaints = currentUser.role === 'Super Admin' ? complaints : complaints.filter(c => c.assignedTo === currentUser.username);
  const userFilings = currentUser.role === 'Super Admin' ? filings : filings.filter(f => f.assignedTo === currentUser.username);

  // Filter lists
  const filteredCases = userCases.filter(c => {
    const matchesSearch = c.caseNumber.toLowerCase().includes(caseSearch.toLowerCase()) || 
                          c.customerName.toLowerCase().includes(caseSearch.toLowerCase()) || 
                          c.customerCNIC.includes(caseSearch) || 
                          c.id.toLowerCase().includes(caseSearch.toLowerCase());
    const matchesStatus = caseStatusFilter === 'All' || c.status === caseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredComplaints = userComplaints.filter(c => {
    const matchesSearch = c.complainerName.toLowerCase().includes(complaintSearch.toLowerCase()) || 
                          c.cnicOrId.includes(complaintSearch) || 
                          c.message.toLowerCase().includes(complaintSearch.toLowerCase()) || 
                          c.id.toLowerCase().includes(complaintSearch.toLowerCase());
    const matchesStatus = complaintFilter === 'All' || c.status === complaintFilter || c.type === complaintFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFilings = userFilings.filter(f => {
    if (filingFilter === 'All') return true;
    return f.status === filingFilter || f.authority === filingFilter;
  });

  return (
    <div id="compliance-legal-view" className="space-y-6 pb-24 font-sans text-slate-800">
      
      {/* Standardized Header Element */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Scale className="w-40 h-40 text-slate-900" />
        </div>
        <div className="space-y-1 relative z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Scale className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Corporate Governance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Compliance & Legal</h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium font-sans">
            Enterprise regulatory registers, active litigation court cases noting, SECP/FBR filing timelines, customer-staff complaints, and SOP policies.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap shadow-xs">
            ⚖️ Operational Safe Mode
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('cases'); setSelectedCase(null); }}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'cases' 
              ? 'border-emerald-600 text-emerald-700 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Gavel className="w-4 h-4" />
          Active Legal Cases ({userCases.filter(c => c.status === 'Active').length})
        </button>
        <button
          onClick={() => { setActiveTab('complaints'); setSelectedComplaint(null); }}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'complaints' 
              ? 'border-emerald-600 text-emerald-700 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Complaints Registry ({userComplaints.filter(c => c.status !== 'Resolved').length} Active)
        </button>
        <button
          onClick={() => { setActiveTab('filings'); setSelectedFiling(null); }}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'filings' 
              ? 'border-emerald-600 text-emerald-700 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4" />
          FBR & SECP Filings
        </button>
        <button
          onClick={() => { setActiveTab('policies'); }}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'policies' 
              ? 'border-emerald-600 text-emerald-700 font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Corporate SOPs & Policies
        </button>
      </div>

      {/* CORE DISPLAY MODULES */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Retrieving compliance ledgers and notary comments...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: LEGAL CASES */}
          {activeTab === 'cases' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Cases List Left (Columns: 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={caseSearch}
                        onChange={(e) => setCaseSearch(e.target.value)}
                        placeholder="Search cases, court, CNIC, customer..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <select
                      value={caseStatusFilter}
                      onChange={(e) => setCaseStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Case Statuses</option>
                      <option value="Active">Active Cases</option>
                      <option value="Pending">Pending Cases</option>
                      <option value="Resolved">Resolved Cases</option>
                      <option value="Appealed">Appealed Cases</option>
                    </select>

                    {canModifyCompliance() && (
                      <button
                        onClick={() => setShowCaseModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Register Legal Case
                      </button>
                    )}
                  </div>

                  {/* List Container */}
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                    {filteredCases.length === 0 ? (
                      <div className="text-center py-12">
                        <Gavel className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">No litigation records match current filter coordinates.</p>
                      </div>
                    ) : (
                      filteredCases.map(c => {
                        const isSelected = selectedCase?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            className={`p-4 rounded-2xl transition-all cursor-pointer flex justify-between items-start gap-4 mt-1 border ${
                              isSelected 
                                ? 'bg-slate-50/80 border-slate-300' 
                                : 'bg-white border-transparent hover:bg-slate-50/40'
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  {c.id}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  c.status === 'Active' ? 'bg-red-50 text-red-700 border border-red-100' :
                                  c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {c.status}
                                </span>
                                <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                                  c.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                                  c.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {c.priority} Priority
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                {c.title}
                              </h4>
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                🏛️ {c.courtName} <span className="text-slate-300">|</span> Case: <strong className="font-mono">{c.caseNumber}</strong>
                              </p>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                                <span>Customer: <strong className="font-semibold text-slate-600">{c.customerName}</strong> ({c.customerCNIC})</span>
                                <span>&bull; Filed: {c.fillingDate}</span>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 mt-1 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Case Noting Details Right (Columns: 5) */}
              <div className="lg:col-span-5">
                {selectedCase ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">OFFICIAL NOTING REGISTER</span>
                        <h3 className="font-black text-slate-900 text-md leading-tight mt-0.5">
                          {selectedCase.caseNumber}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedCase.title}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                        {selectedCase.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Corporate Lawyer</p>
                        <p className="font-bold text-slate-700 mt-0.5">👨‍💼 {selectedCase.lawyerName || 'In House Legal Dept'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Staff Member</p>
                        <p className="font-bold text-slate-700 mt-0.5">👤 {selectedCase.assignedTo ? `@${selectedCase.assignedTo}` : 'Unassigned'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Phone</p>
                        <p className="font-mono text-slate-700 mt-0.5">📞 {selectedCase.customerPhone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Status Modifiers */}
                    {canModifyCompliance() && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Update Suit Status</span>
                        <div className="flex flex-wrap gap-1">
                          {['Active', 'Pending', 'Resolved', 'Appealed'].map((st) => (
                            <button
                              key={st}
                              onClick={() => updateCaseStatus(st as LegalCase['status'])}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer border ${
                                selectedCase.status === st
                                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chronological Noting History */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Chronological Case Noting Trail
                      </span>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto bg-slate-50/30 rounded-2xl p-3 border border-slate-100/60 divide-y divide-slate-100">
                        {selectedCase.notingHistory && selectedCase.notingHistory.length > 0 ? (
                          selectedCase.notingHistory.map((note, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span className="font-black text-emerald-800">@{note.username}</span>
                                <span>{new Date(note.date).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                {note.comment}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[10px] text-slate-400 py-4 italic">No legal comments added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Add Suit Noting */}
                    {canModifyCompliance() && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <textarea
                          rows={2}
                          value={caseNote}
                          onChange={(e) => setCaseNote(e.target.value)}
                          placeholder="Type case progression, court hearing remarks, or next dates..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                        <button
                          onClick={submitCaseNote}
                          disabled={!caseNote.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Append Official Suit Note
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs space-y-2">
                    <Gavel className="w-8 h-8 mx-auto text-slate-300" />
                    <p>Select a legal litigation case record from the registry to view official court noting comments history.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: COMPLAINTS BOX */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Complaints List Left */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={complaintSearch}
                        onChange={(e) => setComplaintSearch(e.target.value)}
                        placeholder="Search complainer, CNIC, message content..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <select
                      value={complaintFilter}
                      onChange={(e) => setComplaintFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Items</option>
                      <option value="Customer">Customer Complaints</option>
                      <option value="Employee">Employee Grievances</option>
                      <option value="Received">Received State</option>
                      <option value="Forwarded">Forwarded State</option>
                      <option value="In Progress">In Progress State</option>
                      <option value="Resolved">Resolved Closed</option>
                    </select>

                    <button
                      onClick={() => setShowComplaintModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Log Complaint
                    </button>
                  </div>

                  {/* List Container */}
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                    {filteredComplaints.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">No registered complaints or employee grievances found.</p>
                      </div>
                    ) : (
                      filteredComplaints.map(c => {
                        const isSelected = selectedComplaint?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedComplaint(c)}
                            className={`p-4 rounded-2xl transition-all cursor-pointer flex justify-between items-start gap-4 mt-1 border ${
                              isSelected 
                                ? 'bg-slate-50/80 border-slate-300' 
                                : 'bg-white border-transparent hover:bg-slate-50/40'
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  {c.id}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                  c.type === 'Customer' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                  {c.type}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                  {c.category}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                                  c.status === 'Forwarded' ? 'bg-indigo-50 text-indigo-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                From: {c.complainerName}
                              </h4>
                              <p className="text-xs font-semibold text-slate-600 truncate max-w-[420px]" title={c.message}>
                                &ldquo;{c.message}&rdquo;
                              </p>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-2 items-center">
                                <span>ID/CNIC: <strong className="font-mono text-slate-600">{c.cnicOrId}</strong></span>
                                <span>&bull;</span>
                                <span>Submitted: {new Date(c.timestamp).toLocaleString()}</span>
                                {c.forwardedTo && c.forwardedTo !== 'General Support' && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="text-indigo-600 font-bold bg-indigo-50/50 px-1 py-0.2 rounded text-[9px]">➡️ Routed To: {c.forwardedTo}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 mt-1 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Complaint Forwarding & Noting Right */}
              <div className="lg:col-span-5">
                {selectedComplaint ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">COMPLAINT INVESTIGATION OFFICE</span>
                        <h3 className="font-black text-slate-900 text-md leading-tight mt-0.5">
                          {selectedComplaint.complainerName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Type: {selectedComplaint.type} &bull; Cnic: {selectedComplaint.cnicOrId}
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                        {selectedComplaint.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Complaint Status</p>
                        <p className="font-bold text-slate-700 mt-0.5">{selectedComplaint.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Staff Member</p>
                        <p className="font-bold text-slate-700 mt-0.5">👤 {selectedComplaint.assignedTo ? `@${selectedComplaint.assignedTo}` : 'Unassigned'}</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-3 text-xs leading-relaxed font-semibold text-slate-700">
                      <p className="text-[10px] text-amber-800 font-black uppercase mb-1">Grievance / Complaint Message:</p>
                      &ldquo;{selectedComplaint.message}&rdquo;
                    </div>

                    {/* Action buttons (Resolve) */}
                    {selectedComplaint.status !== 'Resolved' && canModifyCompliance() && (
                      <button
                        onClick={handleResolveComplaint}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Complaint as Resolved
                      </button>
                    )}

                    {/* Complaint Routing / Forwarding Panel */}
                    {selectedComplaint.status !== 'Resolved' && canModifyCompliance() && (
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">➡️ Forward / Route Complaint to Department</span>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Target Department/Manager</label>
                            <select
                              value={forwardDept}
                              onChange={(e) => setForwardDept(e.target.value)}
                              className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                            >
                              <option value="Operation">Operation Department</option>
                              <option value="Accounts">Accounts & Finance</option>
                              <option value="Recovery">Recovery Wing</option>
                              <option value="Branch Manager">Branch Manager Office</option>
                              <option value="Cashier">Cashier Desk</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Noting Remark / Instructions</label>
                            <textarea
                              rows={2}
                              value={forwardComment}
                              onChange={(e) => setForwardComment(e.target.value)}
                              placeholder="Describe actions required by target dept..."
                              className="mt-1 w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none font-semibold"
                            />
                          </div>

                          <button
                            onClick={handleForwardComplaint}
                            disabled={!forwardComment.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            Route and Log noting
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Forwarding Log */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Action & Forwarding Trail
                      </span>

                      <div className="space-y-3 max-h-[160px] overflow-y-auto bg-slate-50/30 rounded-2xl p-3 border border-slate-100/60 divide-y divide-slate-100">
                        {selectedComplaint.notingHistory && selectedComplaint.notingHistory.length > 0 ? (
                          selectedComplaint.notingHistory.map((note, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span className="font-black text-indigo-700">@{note.username}</span>
                                <span>{new Date(note.date).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                {note.comment}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[10px] text-slate-400 py-4 italic">No history logged.</p>
                        )}
                      </div>
                    </div>

                    {/* Manual general note */}
                    {selectedComplaint.status !== 'Resolved' && canModifyCompliance() && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <textarea
                          rows={1}
                          value={complaintNote}
                          onChange={(e) => setComplaintNote(e.target.value)}
                          placeholder="Add general investigative remarks..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none font-semibold"
                        />
                        <button
                          onClick={submitComplaintNote}
                          disabled={!complaintNote.trim()}
                          className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Append Investigation Note
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p>Select a complaint or staff grievance record to inspect the forwarding trail and noting history.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: REGULATORY FILINGS (SECP & FBR) */}
          {activeTab === 'filings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Filings Timeline Left */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  
                  {/* Filters Header */}
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={filingFilter}
                        onChange={(e) => setFilingFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="All">All Authorities</option>
                        <option value="FBR">Federal Board of Revenue (FBR)</option>
                        <option value="SECP">Securities & Exchange Commission (SECP)</option>
                        <option value="Pending">Pending Status</option>
                        <option value="Filed">Filed Status</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>

                    {canModifyCompliance() && (
                      <button
                        onClick={() => setShowFilingModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Schedule New Filing
                      </button>
                    )}
                  </div>

                  {/* Filings List */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredFilings.length === 0 ? (
                      <div className="text-center py-12">
                        <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">No regulatory filing timelines scheduled.</p>
                      </div>
                    ) : (
                      filteredFilings.map(f => {
                        const isSelected = selectedFiling?.id === f.id;
                        return (
                          <div
                            key={f.id}
                            onClick={() => setSelectedFiling(f)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                              isSelected 
                                ? 'bg-slate-50/80 border-slate-300 shadow-xs' 
                                : 'bg-white border-slate-200/60 hover:bg-slate-50/30'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  {f.id}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  f.authority === 'FBR' ? 'bg-red-50 text-red-700' :
                                  f.authority === 'SECP' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {f.authority}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                  {f.type}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                {f.title}
                              </h4>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5 font-semibold">
                                <span className="text-red-500">📅 Due Date: {f.dueDate}</span>
                                {f.filingDate && <span className="text-emerald-600">Filing Date: {f.filingDate}</span>}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                f.status === 'Filed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                f.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {f.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>

              {/* Filing Detail Panel Right */}
              <div className="lg:col-span-5">
                {selectedFiling ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">REGULATORY COMPLIANCE TARGET</span>
                        <h3 className="font-black text-slate-900 text-md leading-tight mt-0.5">
                          {selectedFiling.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Authority: {selectedFiling.authority} &bull; Type: {selectedFiling.type}
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                        {selectedFiling.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Filing Status</p>
                        <p className="font-bold text-slate-700 mt-0.5">{selectedFiling.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Staff Member</p>
                        <p className="font-bold text-slate-700 mt-0.5">👤 {selectedFiling.assignedTo ? `@${selectedFiling.assignedTo}` : 'Unassigned'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-2xl text-xs space-y-1.5 font-semibold">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Corporate Notes / Scope:</p>
                      <p className="text-slate-700">{selectedFiling.notes || 'No description recorded.'}</p>
                      <p className="text-red-500 font-bold mt-1">📌 Deadline Target: {selectedFiling.dueDate}</p>
                      {selectedFiling.filingDate && (
                        <div className="pt-1.5 border-t border-slate-150 text-emerald-700 space-y-0.5 font-bold">
                          <p>✅ Completed Filing Date: {selectedFiling.filingDate}</p>
                          {selectedFiling.amountPaid !== undefined && (
                            <p>💰 Fees / Tax Paid: RS {selectedFiling.amountPaid.toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Change status buttons */}
                    {canModifyCompliance() && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Modify Filing Status</span>
                        <div className="flex gap-1">
                          {['Pending', 'Under Review', 'Delayed'].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleSetFilingStatus(st as CorporateFiling['status'])}
                              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                                selectedFiling.status === st
                                  ? 'bg-slate-800 text-white border-slate-800'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MARK AS FILED FORM */}
                    {selectedFiling.status !== 'Filed' && canModifyCompliance() && (
                      <form onSubmit={handleMarkAsFiled} className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">📝 Mark filing as completed (Filer Form)</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Filing Date</label>
                            <input
                              type="date"
                              required
                              value={fileDate}
                              onChange={(e) => setFileDate(e.target.value)}
                              className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Amount Paid (RS)</label>
                            <input
                              type="number"
                              value={fileAmt}
                              onChange={(e) => setFileAmt(e.target.value)}
                              placeholder="e.g. 15000"
                              className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Submit Verification to Ledger
                        </button>
                      </form>
                    )}

                    {/* Chronological Progress Log */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Progression Noting Log
                      </span>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto bg-slate-50/30 rounded-2xl p-3 border border-slate-100/60 divide-y divide-slate-100">
                        {selectedFiling.notingHistory && selectedFiling.notingHistory.length > 0 ? (
                          selectedFiling.notingHistory.map((note, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span className="font-black text-emerald-800">@{note.username}</span>
                                <span>{new Date(note.date).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                {note.comment}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[10px] text-slate-400 py-4 italic">No logs found.</p>
                        )}
                      </div>
                    </div>

                    {/* Manual Progression Comment */}
                    {canModifyCompliance() && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <textarea
                          rows={1}
                          value={filingNote}
                          onChange={(e) => setFilingNote(e.target.value)}
                          placeholder="Add filing progression remark..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none font-semibold"
                        />
                        <button
                          onClick={submitFilingNote}
                          disabled={!filingNote.trim()}
                          className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Append Progress Remark
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs space-y-2">
                    <Landmark className="w-8 h-8 mx-auto text-slate-300" />
                    <p>Select a corporate filing timeline to log tax or registration payments and view compliance progress comments.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: COMPANY POLICIES & SOPS */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center gap-4">
                <h3 className="font-black text-slate-800 text-md tracking-tight">Active Company Policies & SOP Rules</h3>
                {canModifyCompliance() && (
                  <button
                    onClick={() => setShowPolicyModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Publish SOP/Policy
                  </button>
                )}
              </div>

              {/* Grid of Policies */}
              {policies.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No policy or SOP documents have been published in the registers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policies.map(p => (
                    <div key={p.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-all gap-4">
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {p.id}
                            </span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                              {p.category}
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">
                              {p.version}
                            </span>
                          </div>
                          {canModifyCompliance() && (
                            <button
                              onClick={() => handleDeletePolicy(p.id)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer shrink-0"
                              title="Retire/Delete Policy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {p.title}
                        </h4>

                        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line font-medium">
                          {p.content}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                        <span>Published by: <strong className="text-slate-600">@{p.publishedBy}</strong></span>
                        <span>Date: {p.publishedDate}</span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* MODAL 1: REGISTER LEGAL LITIGATION CASE */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-slide-in">
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm tracking-tight text-slate-800">Register New Court Litigation</h3>
              </div>
              <button onClick={() => setShowCaseModal(false)} className="text-slate-400 hover:text-slate-700 font-extrabold text-sm p-1 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Litigation Case / Suit Number *</label>
                  <input
                    type="text"
                    required
                    value={caseNum}
                    onChange={(e) => setCaseNum(e.target.value)}
                    placeholder="e.g. OS-802/2026"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Case Suit Priority</label>
                  <select
                    value={casePriority}
                    onChange={(e) => setCasePriority(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-bold"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🔵 Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Suit Title Description *</label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Manha Consumer Financing vs. Kamran Butt (Default)"
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Court & Session Name *</label>
                <input
                  type="text"
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. Session Court, Lahore West"
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Defendant Customer Details</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter defendant name"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer CNIC Number *</label>
                    <input
                      type="text"
                      required
                      value={customerCNIC}
                      onChange={(e) => setCustomerCNIC(e.target.value)}
                      placeholder="35201-XXXXXXXX-X"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Phone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0300-XXXXXXX"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Assigned Advocate Lawyer</label>
                    <input
                      type="text"
                      value={lawyerName}
                      onChange={(e) => setLawyerName(e.target.value)}
                      placeholder="e.g. Advocate Muhammad Asif"
                      className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Assign Internal Staff Member</label>
                  <select
                    value={caseAssignedTo}
                    onChange={(e) => setCaseAssignedTo(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none text-slate-700 font-bold"
                  >
                    <option value="">-- No Internal Assignment --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.username}>{emp.name} (@{emp.username} - {emp.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl cursor-pointer"
                >
                  Verify & Register Suit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG COMPLAINT */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-slide-in">
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm tracking-tight text-slate-800">Log Customer / Employee Grievance</h3>
              </div>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-700 font-extrabold text-sm p-1 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleCreateComplaint} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Sender Category</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option value="Customer">👤 Customer Complaint</option>
                    <option value="Employee">💼 Employee Grievance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Grievance Category</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option value="General">General Matter</option>
                    <option value="Device Lock">Device Lock/Unlock Issue</option>
                    <option value="Billing">Billing & Installments</option>
                    <option value="Staff Behavior">Staff Behavior/Misbehavior</option>
                    <option value="Service">Service Quality</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Complainer Name *</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Haris Mehmood"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Complainer CNIC / Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={compCnicId}
                    onChange={(e) => setCompCnicId(e.target.value)}
                    placeholder="CNIC number or Employee Code"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Assign Internal Staff Member</label>
                <select
                  value={complaintAssignedTo}
                  onChange={(e) => setComplaintAssignedTo(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none text-slate-700 font-bold"
                >
                  <option value="">-- No Internal Assignment --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.username}>{emp.name} (@{emp.username} - {emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Grievance / Issue Message Description *</label>
                <textarea
                  rows={4}
                  required
                  value={compMessage}
                  onChange={(e) => setCompMessage(e.target.value)}
                  placeholder="Provide precise details of the complaint. Mention customer installment records or device locks details if relevant..."
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl cursor-pointer"
                >
                  Route Complaint to Inbox
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCHEDULE FILING */}
      {showFilingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-slide-in">
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm tracking-tight text-slate-800">Schedule Regulatory Corporate Filing</h3>
              </div>
              <button onClick={() => setShowFilingModal(false)} className="text-slate-400 hover:text-slate-700 font-extrabold text-sm p-1 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleCreateFiling} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Authority</label>
                  <select
                    value={filingAuthority}
                    onChange={(e) => setFilingAuthority(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option value="FBR">Federal Board of Revenue (FBR)</option>
                    <option value="SECP">Securities & Exchange Commission (SECP)</option>
                    <option value="PRA">Punjab Revenue Authority (PRA)</option>
                    <option value="SRB">Sindh Revenue Board (SRB)</option>
                    <option value="Other">Other Authority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Filing Type Category</label>
                  <select
                    value={filingType}
                    onChange={(e) => setFilingType(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option value="Annual Return">Annual Return Filing</option>
                    <option value="Income Tax">Income Tax Statement</option>
                    <option value="Sales Tax">Sales Tax Return</option>
                    <option value="Withholding">Withholding Statements</option>
                    <option value="Other">Other Regulatory Filing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Filing Task Title *</label>
                  <input
                    type="text"
                    required
                    value={filingTitle}
                    onChange={(e) => setFilingTitle(e.target.value)}
                    placeholder="e.g. FBR Sales Tax Monthly Return - July 2026"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Filing Due Date Target *</label>
                <input
                  type="date"
                  required
                  value={filingDueDate}
                  onChange={(e) => setFilingDueDate(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Assign Internal Staff Member</label>
                <select
                  value={filingAssignedTo}
                  onChange={(e) => setFilingAssignedTo(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none text-slate-700 font-bold"
                >
                  <option value="">-- No Internal Assignment --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.username}>{emp.name} (@{emp.username} - {emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Instructions & Notes</label>
                <textarea
                  rows={3}
                  value={filingNotes}
                  onChange={(e) => setFilingNotes(e.target.value)}
                  placeholder="Enter details of files, audits, or tax forms required for this filing sequence..."
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFilingModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl cursor-pointer"
                >
                  Schedule Target Filing
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PUBLISH POLICY */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-slide-in">
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-slate-850 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm tracking-tight text-slate-800">Publish Corporate SOP / Company Policy</h3>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="text-slate-400 hover:text-slate-700 font-extrabold text-sm p-1 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Policy Category</label>
                  <select
                    value={policyCategory}
                    onChange={(e) => setPolicyCategory(e.target.value as any)}
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option value="SOP">SOP Guideline</option>
                    <option value="HR">HR & Employees Policy</option>
                    <option value="Legal">Legal & Courts Mandates</option>
                    <option value="Compliance">Regulatory Compliance</option>
                    <option value="Operations">Operations Policy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Policy Version</label>
                  <input
                    type="text"
                    required
                    value={policyVersion}
                    onChange={(e) => setPolicyVersion(e.target.value)}
                    placeholder="e.g. v1.0"
                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Policy Document Title *</label>
                <input
                  type="text"
                  required
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  placeholder="e.g. Field Officer Repossession SOP"
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Policy Document Content (Rules & SOP clauses) *</label>
                <textarea
                  rows={6}
                  required
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  placeholder="Enter standard operating clauses and policy text clearly..."
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none font-mono whitespace-pre-wrap"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl cursor-pointer"
                >
                  Publish & Broadcast SOP
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
