import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Building2, Landmark, Filter, FileSpreadsheet, Activity, ChevronDown, 
  ChevronUp, Search, RefreshCw, Eye, IndianRupee, Calendar, CheckCircle, ShieldAlert,
  UserCheck, UserX, Users
} from 'lucide-react';

// Helper to generate a dynamic list of financial years
export function generateFinancialYears(pastCount = 2, futureCount = 5) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (Jan is 0, Apr is 3)
  
  // Financial year runs from April 1st to March 31st
  const baseYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  
  const years = [];
  for (let i = -pastCount; i <= futureCount; i++) {
    const startYear = baseYear + i;
    const endYearString = String(startYear + 1).slice(-2);
    years.push(`${startYear}-${endYearString}`);
  }
  return years;
}

export default function DCEDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'requests' | 'audits'
  
  // Pending signup requests states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Master console state
  const [approvedEntries, setApprovedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  // Metadata dropdowns
  const [circles, setCircles] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Filter values
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [schemeQuery, setSchemeQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [stageQuery, setStageQuery] = useState('');

  // Audits state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [error, setError] = useState('');

  // Fetch pending registrations queue
  const fetchPendingUsers = () => {
    setPendingLoading(true);
    fetch('/api/auth/users/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load pending requests');
        return res.json();
      })
      .then(data => {
        setPendingUsers(data);
        setPendingCount(data.length);
      })
      .catch(err => console.error(err))
      .finally(() => setPendingLoading(false));
  };

  // Fetch count of pending requests
  const fetchPendingCount = () => {
    fetch('/api/auth/users/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPendingCount(data.length))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPendingCount();
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPendingUsers();
    }
  }, [token, activeTab]);

  const handleApproveUser = (id, userEmail) => {
    if (!window.confirm(`Are you sure you want to approve portal credentials for ${userEmail}?`)) return;
    
    fetch(`/api/auth/users/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to approve user');
        return res.json();
      })
      .then(() => {
        alert(`Account successfully approved for ${userEmail}`);
        fetchPendingUsers();
        fetchPendingCount();
      })
      .catch(err => alert(err.message));
  };

  const handleRejectUser = (id, userEmail) => {
    if (!window.confirm(`Are you sure you want to REJECT and delete portal signup request for ${userEmail}?`)) return;
    
    fetch(`/api/auth/users/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to reject user');
        return res.json();
      })
      .then(() => {
        alert(`Account signup request successfully rejected and deleted for ${userEmail}`);
        fetchPendingUsers();
        fetchPendingCount();
      })
      .catch(err => alert(err.message));
  };

  // Load circles list
  useEffect(() => {
    fetch('/api/circles', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCircles(data))
      .catch(err => console.error(err));
  }, [token]);

  // Load divisions list when circle changes
  useEffect(() => {
    if (!selectedCircle) {
      setDivisions([]);
      setSelectedDivision('');
      return;
    }
    fetch(`/api/divisions?circle_id=${selectedCircle}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDivisions(data))
      .catch(err => console.error(err));
  }, [token, selectedCircle]);

  // Fetch approved project entries
  const fetchApprovedEntries = () => {
    setLoading(true);
    let url = '/api/entries?status_filter=APPROVED';
    if (selectedCircle) url += `&circle_id=${selectedCircle}`;
    if (selectedDivision) url += `&division_id=${selectedDivision}`;
    if (schemeQuery) url += `&scheme=${encodeURIComponent(schemeQuery)}`;
    if (selectedYear) url += `&year=${selectedYear}`;
    if (stageQuery) url += `&stage=${encodeURIComponent(stageQuery)}`;

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load approved entries');
        return res.json();
      })
      .then(data => setApprovedEntries(data))
      .catch(err => {
        console.error(err);
        setError('Could not retrieve approved records.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApprovedEntries();
  }, [token, selectedCircle, selectedDivision, selectedYear, schemeQuery, stageQuery]);

  // Fetch audit logs
  const fetchLogs = () => {
    setLogsLoading(true);
    fetch('/api/audit-logs?limit=150', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load logs');
        return res.json();
      })
      .then(data => setLogs(data))
      .catch(err => console.error(err))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'audits') {
      fetchLogs();
    }
  }, [token, activeTab]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCircle('');
    setSelectedDivision('');
    setSelectedYear('');
    setSchemeQuery('');
    setStageQuery('');
  };

  // Export to Excel handler
  const handleExport = () => {
    let url = '/api/reports/export?status_filter=APPROVED';
    if (selectedCircle) url += `&circle_id=${selectedCircle}`;
    if (selectedDivision) url += `&division_id=${selectedDivision}`;
    if (schemeQuery) url += `&scheme=${encodeURIComponent(schemeQuery)}`;
    if (selectedYear) url += `&year=${selectedYear}`;
    
    window.open(url, '_blank');
  };

  const toggleRowExpand = (id) => {
    setExpandedEntryId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Centrally Approved Works
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {approvedEntries.length}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1.5 inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Direct Circle Validations
            </span>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-emerald-600">
            <Landmark className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Active Circle Domains
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              10 Circles
            </span>
            <span className="text-[10px] text-teal-600 font-semibold mt-1.5 inline-block">
              Guindy HQ oversight active
            </span>
          </div>
          <div className="bg-teal-50 p-3.5 rounded-2xl border border-teal-100 text-teal-600">
            <Building2 className="w-7 h-7" />
          </div>
        </div>

        {/* Global actions */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-center gap-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <button
              onClick={() => setActiveTab('master')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
                activeTab === 'master'
                  ? 'bg-[#0f766e] text-white shadow-sm glow-teal'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Master Console
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'bg-[#0f766e] text-white shadow-sm glow-teal'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Registration Requests</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
                activeTab === 'audits'
                  ? 'bg-[#0f766e] text-white shadow-sm glow-teal'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Audit Logs
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* ==========================================
          TAB 1: MASTER CONSOLE
         ========================================== */}
      {activeTab === 'master' && (
        <div className="space-y-4">
          
          {/* Dynamic Filtering Console */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Oversight Filter Console
                </h3>
              </div>
              <button 
                onClick={resetFilters}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Circle Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Circle Domain</label>
                <select
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                >
                  <option value="">All Circles</option>
                  {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Division Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Division Domain</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  disabled={!selectedCircle}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold disabled:opacity-40"
                >
                  <option value="">All Divisions</option>
                  {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Financial Year */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Financial Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                >
                  <option value="">All Years</option>
                  {generateFinancialYears().map(fy => (
                    <option key={fy} value={fy}>{fy}</option>
                  ))}
                </select>
              </div>

              {/* Scheme Search */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Scheme Code</label>
                <input
                  type="text"
                  value={schemeQuery}
                  onChange={(e) => setSchemeQuery(e.target.value)}
                  placeholder="e.g. CRIDP..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold placeholder-slate-400"
                />
              </div>

              {/* Work Stage Search */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Progress Stage</label>
                <input
                  type="text"
                  value={stageQuery}
                  onChange={(e) => setStageQuery(e.target.value)}
                  placeholder="e.g. Survey..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold placeholder-slate-400"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                * Approved records can be extracted directly into a formatted report.
              </span>
              <button
                onClick={handleExport}
                disabled={approvedEntries.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-600 border border-emerald-250 hover:border-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Approved Report
              </button>
            </div>
          </div>

          {/* Master Approved Works Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            {loading ? (
              <div className="p-20 text-center text-slate-500 text-sm">
                Compiling approved highway tenders...
              </div>
            ) : approvedEntries.length === 0 ? (
              <div className="p-20 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">No approved work records match the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-5 w-8"></th>
                      <th className="py-4 px-5">Circle & Division</th>
                      <th className="py-4 px-5">Name of Work</th>
                      <th className="py-4 px-5">Scheme & Year</th>
                      <th className="py-4 px-5">Admin Value</th>
                      <th className="py-4 px-5">Contract Value</th>
                      <th className="py-4 px-5">Present Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {approvedEntries.map((entry) => {
                      const isExpanded = expandedEntryId === entry.id;
                      return (
                        <React.Fragment key={entry.id}>
                          <tr 
                            onClick={() => toggleRowExpand(entry.id)}
                            className="hover:bg-slate-50/80 transition-all cursor-pointer border-b border-slate-100"
                          >
                            <td className="py-4 px-5 text-center">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </td>
                            <td className="py-4 px-5">
                              <div className="text-slate-900 font-bold">{entry.circle?.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold mt-0.5">{entry.division?.name}</div>
                            </td>
                            <td className="py-4 px-5 max-w-sm">
                              <div className="text-slate-900 truncate leading-relaxed font-bold">{entry.name_of_work}</div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="text-slate-800">{entry.scheme}</div>
                              <div className="text-[10px] text-slate-500 font-bold mt-0.5">{entry.year}</div>
                            </td>
                            <td className="py-4 px-5 text-teal-600 font-bold">
                              <div className="flex items-center gap-0.5">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {entry.admin_sanction_value || '0.00'} L
                              </div>
                            </td>
                            <td className="py-4 px-5 text-indigo-600 font-bold">
                              <div className="flex items-center gap-0.5">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {entry.contract_value || '0.00'} L
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600">
                                {entry.present_stage || 'Not Started'}
                              </span>
                            </td>
                          </tr>

                          {/* Expandable row: Displays full details of the 21 columns */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30 border-b border-slate-100">
                              <td colSpan={7} className="py-5 px-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
                                  
                                  {/* Administrative Detail Cards */}
                                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h5 className="font-bold text-teal-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1.5">
                                      1. Administrative Credentials
                                    </h5>
                                    <div>
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">G.O. Details:</span>
                                      <span className="text-slate-800 font-semibold">{entry.go_details || 'Not Specified'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Technical Sanction Reference:</span>
                                      <span className="text-slate-800 font-semibold">{entry.technical_sanction || 'Not Specified'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Technical Sanction Value:</span>
                                      <span className="text-slate-800 font-bold text-teal-600 flex items-center gap-0.5">
                                        <IndianRupee className="w-3 h-3" />
                                        {entry.tech_sanction_value || '0.00'} Lakhs
                                      </span>
                                    </div>
                                  </div>

                                  {/* Tender details cards */}
                                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h5 className="font-bold text-teal-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1.5">
                                      2. Tender & Acceptance Details
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Notice No:</span>
                                        <span className="text-slate-800 font-semibold">{entry.tender_notice_no || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Notice Date:</span>
                                        <span className="text-slate-800 font-semibold">{entry.tender_notice_date || 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Accepting Authority:</span>
                                        <span className="text-slate-800 font-bold">{entry.tender_accepting_authority || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Tender Approved on:</span>
                                        <span className="text-slate-800 font-bold">{entry.tender_approved_on || 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Bid Submission:</span>
                                        <span className="text-slate-800 font-semibold">{entry.bid_submission_date || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Bid Opening:</span>
                                        <span className="text-slate-800 font-semibold">{entry.bid_opening_date || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress & Auditing details cards */}
                                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h5 className="font-bold text-teal-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1.5">
                                      3. Work Order & Compliance Audit
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Work Order Issued:</span>
                                        <span className="text-slate-800 font-semibold">{entry.work_order_issued_on || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[9px]">Agreement Executed:</span>
                                        <span className="text-slate-800 font-semibold">{entry.agreement_executed_on || 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Additional Office Remarks:</span>
                                      <span className="text-slate-700 font-semibold italic">"{entry.remarks || 'No remarks recorded.'}"</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                                      <span>AUDITED RECORD: #{entry.id}</span>
                                      <span className="text-emerald-600">APPROVED SECURELY</span>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: REGISTRATION APPROVAL REQUESTS
         ========================================== */}
      {activeTab === 'requests' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm bg-white animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                Administrative Registration Approvals
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Review, approve, or reject new credentials requests from Circle Superintendent Engineers and Divisional Engineers.
              </p>
            </div>
            <button 
              onClick={fetchPendingUsers}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Queue
            </button>
          </div>

          {pendingLoading ? (
            <div className="p-20 text-center text-slate-500 text-sm font-semibold">
              Scanning security registers...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-20 text-center text-slate-500 text-xs font-semibold leading-relaxed border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2.5 opacity-90 animate-bounce" />
              <div className="text-slate-800 font-black">All Registration Requests Cleared</div>
              <div className="text-slate-400 mt-1">No pending engineer accounts are waiting in the validation queue.</div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Sl.No</th>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Official Email</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Circle oversight</th>
                    <th className="py-3.5 px-4">Division branch</th>
                    <th className="py-3.5 px-4">Requested On</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pendingUsers.map((req, index) => (
                    <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">{req.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{req.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          req.role === 'DSE' 
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                            : 'bg-teal-50 border-teal-100 text-teal-700'
                        }`}>
                          {req.role === 'DSE' ? 'Superintendent Engineer (DSE)' : 'Divisional Engineer (DE)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{req.circle?.name || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{req.division?.name || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {new Date(req.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveUser(req.id, req.email)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[9px] shadow-sm inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectUser(req.id, req.email)}
                            className="bg-red-550 hover:bg-red-650 text-red-600 border border-red-205 hover:border-red-600 rounded-xl font-bold uppercase tracking-wider text-[9px] inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <UserX className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: AUDIT LOGS
         ========================================== */}
      {activeTab === 'audits' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Live System Audit Trail Logs
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Monitors security-sensitive events including logins, team modifications, submissions, and approvals.
              </p>
            </div>
            <button 
              onClick={fetchLogs}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Logs
            </button>
          </div>

          {logsLoading ? (
            <div className="p-20 text-center text-slate-500 text-sm">
              Analyzing system journal...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center text-slate-500 text-sm font-medium">
              No audit logs captured.
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 pr-2">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        log.action.includes('APPROVED') || log.action.includes('ADD')
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                          : log.action.includes('REJECTED') || log.action.includes('REMOVE')
                          ? 'bg-red-50 border-red-200 text-red-750'
                          : 'bg-slate-50 border-slate-200 text-slate-655'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-slate-800 font-bold">{log.user?.name || 'SYSTEM'}</span>
                      <span className="text-[10px] text-slate-500">({log.user?.role || 'Service'})</span>
                    </div>
                    <p className="text-slate-600 mt-1 font-semibold">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-semibold self-start sm:self-center">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
