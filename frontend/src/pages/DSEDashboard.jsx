import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Users, Layers, Award, CheckSquare, XSquare, Edit3, Save, Search, 
  UserPlus, UserMinus, Eye, FileSpreadsheet, ClipboardList, Info, AlertTriangle, 
  IndianRupee, Calendar, Check, X, Shield 
} from 'lucide-react';

export default function DSEDashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'team'
  
  // Pipeline state
  const [entries, setEntries] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null); // For review modal
  const [reviewForm, setReviewForm] = useState(null); // Holds draft edits during review
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Team state
  const [teamMembers, setTeamMembers] = useState([]);
  const [unassignedDEs, setUnassignedDEs] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load submissions within circle team
  const fetchPipeline = () => {
    setPipelineLoading(true);
    fetch(`/api/entries?status_filter=${statusFilter}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load review pipeline');
        return res.json();
      })
      .then(data => {
        setEntries(data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load submissions.');
      })
      .finally(() => {
        setPipelineLoading(false);
      });
  };

  // Load team members and unassigned pool
  const fetchTeam = () => {
    setTeamLoading(true);
    // Fetch active team members
    fetch('/api/team', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTeamMembers(data))
      .catch(err => console.error(err));

    // Fetch unassigned pool
    fetch('/api/users/unassigned', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUnassignedDEs(data))
      .catch(err => console.error(err))
      .finally(() => {
        setTeamLoading(false);
      });
  };

  useEffect(() => {
    fetchPipeline();
  }, [token, statusFilter]);

  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeam();
    }
  }, [token, activeTab]);

  // Handle member addition
  const handleAddMember = (deId) => {
    setError('');
    setSuccess('');
    fetch('/api/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ de_id: deId })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Could not add DE to team');
        return data;
      })
      .then((data) => {
        setSuccess(`Divisional Engineer ${data.name} successfully added to your team.`);
        fetchTeam();
      })
      .catch(err => setError(err.message));
  };

  // Handle member removal
  const handleRemoveMember = (deId) => {
    if (!window.confirm('Are you sure you want to release this Divisional Engineer from your team? Any data they submit will no longer be visible to you.')) return;
    setError('');
    setSuccess('');
    fetch(`/api/team/${deId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error('Could not release DE');
        return data;
      })
      .then((data) => {
        setSuccess(`Released Divisional Engineer ${data.name} from team.`);
        fetchTeam();
      })
      .catch(err => setError(err.message));
  };

  // Open review details modal
  const handleOpenReview = (entry) => {
    setSelectedEntry(entry);
    setReviewForm({ ...entry }); // Create draft clone
    setRejectionReason('');
    setShowRejectBox(false);
  };

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes to project details (DSE edit authority)
  const handleSaveReviewEdits = () => {
    setError('');
    setSuccess('');
    
    // Parse values
    const parsedEdits = {
      ...reviewForm,
      admin_sanction_value: reviewForm.admin_sanction_value ? parseFloat(reviewForm.admin_sanction_value) : null,
      tech_sanction_value: reviewForm.tech_sanction_value ? parseFloat(reviewForm.tech_sanction_value) : null,
      contract_value: reviewForm.contract_value ? parseFloat(reviewForm.contract_value) : null,
    };

    fetch(`/api/entries/${reviewForm.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(parsedEdits)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to save changes');
        return data;
      })
      .then((data) => {
        setSuccess('Project details updated successfully.');
        setSelectedEntry(data); // Refresh active view
        setReviewForm({ ...data });
        fetchPipeline();
      })
      .catch(err => setError(err.message));
  };

  // Review action: Approve or Reject
  const handleReviewAction = (statusValue) => {
    setError('');
    setSuccess('');

    if (statusValue === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please provide a correction reason for rejection.');
      return;
    }

    fetch(`/api/entries/${selectedEntry.id}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: statusValue,
        rejection_reason: statusValue === 'REJECTED' ? rejectionReason : null
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Review process failed');
        return data;
      })
      .then(() => {
        setSuccess(statusValue === 'APPROVED' 
          ? 'Project approved successfully! Record is now centrally visible to DCE.' 
          : 'Project returned to DE for corrections.'
        );
        setSelectedEntry(null);
        fetchPipeline();
      })
      .catch(err => setError(err.message));
  };

  const filteredUnassignedPool = unassignedDEs.filter(de => 
    de.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    de.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (de.division?.name && de.division.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Circle Stats Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Circle Operations Cockpit
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Managing <span className="text-teal-600 font-bold">{user.circle?.name || 'Assigned'} Circle</span>. You have direct editing, audit, and approval rights.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
              activeTab === 'pipeline' 
                ? 'bg-[#0f766e] text-white shadow-sm glow-teal' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Review Pipeline ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
              activeTab === 'team' 
                ? 'bg-[#0f766e] text-white shadow-sm glow-teal' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Team Assignment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-550/10 border border-red-200 text-red-600 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      {/* ==========================================
          TAB 1: REVIEW PIPELINE
         ========================================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
                Filter Status:
              </span>
              {['PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all border ${
                    statusFilter === filter
                      ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchPipeline}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1.5"
            >
              Refresh Queue
            </button>
          </div>

          {/* Submissions Pipeline Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            {pipelineLoading ? (
              <div className="p-20 text-center text-slate-500 text-sm">
                Loading review queue...
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">No projects in this queue status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-5">DE Division</th>
                      <th className="py-4 px-5">Name of Work</th>
                      <th className="py-4 px-5">Scheme & Year</th>
                      <th className="py-4 px-5">Sanction Value</th>
                      <th className="py-4 px-5">Submitted At</th>
                      <th className="py-4 px-5 text-center">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-4 px-5">
                          <div className="text-slate-900 font-bold">{entry.division?.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5">{entry.creator?.name}</div>
                        </td>
                        <td className="py-4 px-5 max-w-md">
                          <div className="text-slate-900 leading-relaxed font-bold">{entry.name_of_work}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-800">{entry.scheme}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5">{entry.year}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-teal-600 font-bold flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {entry.admin_sanction_value || '0.00'} L
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-500">
                          {new Date(entry.submitted_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleOpenReview(entry)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-[#0f766e] text-teal-700 hover:text-white rounded-lg border border-teal-200 hover:border-[#0f766e] font-bold text-xs transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==========================================
          TAB 2: TEAM MANAGEMENT
         ========================================== */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 2A: Current Active Team */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                Active Circle Division Engineers ({teamMembers.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                You have visibility and review authority over works filled by these Engineers.
              </p>
            </div>

            {teamLoading ? (
              <div className="p-10 text-center text-slate-500 text-xs">Loading team roster...</div>
            ) : teamMembers.length === 0 ? (
              <div className="p-16 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Users className="w-8 h-8 text-slate-350 mx-auto" />
                <p className="text-slate-500 text-xs font-semibold">Your team roster is currently empty.</p>
                <p className="text-[10px] text-slate-400">Search and add unassigned engineers in the right panel.</p>
              </div>
            ) : (
               <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                 {teamMembers.map((member) => (
                   <div key={member.id} className="py-3 flex items-center justify-between group">
                     <div>
                       <div className="text-xs font-bold text-slate-800">{member.name}</div>
                       <div className="text-[10px] text-slate-500 mt-0.5">{member.email}</div>
                       <div className="mt-1 flex items-center gap-1.5">
                         <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200/60 px-2 py-0.5 rounded-full font-bold">
                           {member.division?.name || 'Assigned'} DE
                         </span>
                       </div>
                     </div>
                     <button
                       onClick={() => handleRemoveMember(member.id)}
                       className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 hover:border-red-200 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                       title="Remove from your team"
                     >
                       <UserMinus className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
 
           {/* Section 2B: Unassigned DE Pool Directory */}
           <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
             <div className="border-b border-slate-100 pb-3">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                 <UserPlus className="w-4 h-4 text-teal-600" />
                 Search Unassigned Engineers
               </h3>
               <p className="text-[11px] text-slate-500 mt-1">
                 Only unassigned engineers belonging to the {user.circle?.name || 'Chennai'} Circle are visible here.
               </p>
             </div>
 
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                 <Search className="w-3.5 h-3.5" />
               </div>
               <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search DE by name, email, or division..."
                 className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 font-semibold"
               />
             </div>
 
             {teamLoading ? (
               <div className="p-10 text-center text-slate-500 text-xs">Loading directory...</div>
             ) : filteredUnassignedPool.length === 0 ? (
               <div className="p-16 text-center space-y-1.5 border border-dashed border-slate-200 rounded-xl text-slate-500">
                 <Info className="w-6 h-6 mx-auto text-slate-300" />
                 <p className="text-xs font-semibold">No unassigned circle DEs found.</p>
               </div>
             ) : (
               <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                 {filteredUnassignedPool.map((de) => (
                   <div key={de.id} className="py-3.5 flex items-center justify-between group">
                     <div>
                       <div className="text-xs font-bold text-slate-800">{de.name}</div>
                       <div className="text-[10px] text-slate-500 mt-0.5">{de.email}</div>
                       <div className="mt-1 flex items-center gap-1.5">
                         <span className="text-[9px] bg-indigo-50 text-indigo-750 border border-indigo-200/60 px-2 py-0.5 rounded-full font-bold">
                           {de.division?.name || 'Unassigned'} DE
                         </span>
                       </div>
                     </div>
                     <button
                       onClick={() => handleAddMember(de.id)}
                       className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200/60 hover:border-teal-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                     >
                       <UserPlus className="w-3.5 h-3.5" />
                       Add DE
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}

      {/* ==========================================
          MODAL: PROJECT REVIEW PANEL
         ========================================== */}
      {selectedEntry && reviewForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-teal-50 p-2 rounded-lg border border-teal-100">
                  <Shield className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wide">
                    Review Tender Submission #{selectedEntry.id}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Created by {selectedEntry.creator?.name} ({selectedEntry.division?.name} Division)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              
              {/* Form editing sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General & Sanction details */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-widest border-b border-slate-200 pb-1">
                    1. Administration & Work Details
                  </h4>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-600 block">Name of Work</label>
                    <textarea
                      name="name_of_work"
                      value={reviewForm.name_of_work}
                      onChange={handleReviewInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Scheme</label>
                      <input
                        type="text"
                        name="scheme"
                        value={reviewForm.scheme}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Year</label>
                      <input
                        type="text"
                        name="year"
                        value={reviewForm.year}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-600 block">G.O. Details</label>
                    <input
                      type="text"
                      name="go_details"
                      value={reviewForm.go_details}
                      onChange={handleReviewInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Admin Sanction (Lakhs)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="admin_sanction_value"
                        value={reviewForm.admin_sanction_value}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Tech Sanction (Lakhs)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="tech_sanction_value"
                        value={reviewForm.tech_sanction_value}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Tender & Award details */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-widest border-b border-slate-200 pb-1">
                    2. Tender Notice & Milestones
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Tender Notice No.</label>
                      <input
                        type="text"
                        name="tender_notice_no"
                        value={reviewForm.tender_notice_no}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Tender Notice Date</label>
                      <input
                        type="date"
                        name="tender_notice_date"
                        value={reviewForm.tender_notice_date || ''}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Contract Value (Lakhs)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="contract_value"
                        value={reviewForm.contract_value}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Accepting Authority</label>
                      <select
                        name="tender_accepting_authority"
                        value={reviewForm.tender_accepting_authority}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      >
                        <option value="DE">DE</option>
                        <option value="SE">SE</option>
                        <option value="CE">CE</option>
                        <option value="COT">COT</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Work Order Issued</label>
                      <input
                        type="date"
                        name="work_order_issued_on"
                        value={reviewForm.work_order_issued_on || ''}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-600 block">Agreement Executed</label>
                      <input
                        type="date"
                        name="agreement_executed_on"
                        value={reviewForm.agreement_executed_on || ''}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-600 block">Present Work Stage</label>
                    <input
                      type="text"
                      name="present_stage"
                      value={reviewForm.present_stage}
                      onChange={handleReviewInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 font-semibold"
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons to save edits */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-auto flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  DSE can edit incorrect fields before approval
                </span>
                <button
                  type="button"
                  onClick={handleSaveReviewEdits}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Save className="w-4 h-4 text-teal-600" />
                  Save Draft Changes
                </button>
              </div>

              {/* Rejection comment box */}
              {showRejectBox && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="text-xs font-bold text-red-700 uppercase tracking-wide">
                    Provide Correction / Rejection Comments
                  </div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Provide detailed instructions on what dates or sanction values the DE must fix before resubmitting."
                    className="w-full p-3 bg-white border border-red-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 leading-relaxed font-semibold"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReviewAction('REJECTED')}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm"
                    >
                      Confirm Rejection & Release
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer (Approve / Reject Action buttons) */}
            {selectedEntry.status === 'PENDING' && !showRejectBox && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-650 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <X className="w-4 h-4" />
                  Reject & Return
                </button>
                <button
                  onClick={() => handleReviewAction('APPROVED')}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm glow-teal transition-all"
                >
                  <Check className="w-4 h-4" />
                  Approve Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
