import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  ClipboardList, PlusCircle, Calendar, IndianRupee, Send, Edit3, Trash2, 
  CheckCircle, AlertCircle, FileText, ChevronRight, XCircle, Info 
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

export function getCurrentFinancialYear() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const baseYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYearString = String(baseYear + 1).slice(-2);
  return `${baseYear}-${endYearString}`;
}

export default function DEDashboard() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Form Fields State
  const initialFormState = {
    scheme: '',
    year: getCurrentFinancialYear(),
    go_details: '',
    technical_sanction: '',
    admin_sanction_value: '',
    tech_sanction_value: '',
    tender_notice_no: '',
    tender_notice_date: '',
    name_of_work: '',
    contract_value: '',
    bid_submission_date: '',
    bid_opening_date: '',
    tender_accepting_authority: 'DE',
    tender_approved_on: '',
    work_order_issued_on: '',
    agreement_executed_on: '',
    present_stage: '',
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load DE's own project entries
  const fetchEntries = () => {
    setLoading(true);
    fetch('/api/entries', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch project entries');
        return res.json();
      })
      .then(data => {
        setEntries(data);
      })
      .catch(err => {
        console.error(err);
        setError('Could not retrieve your previous submissions.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEntries();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingEntryId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Pre-process numeric inputs
    const parsedData = {
      ...formData,
      admin_sanction_value: formData.admin_sanction_value ? parseFloat(formData.admin_sanction_value) : null,
      tech_sanction_value: formData.tech_sanction_value ? parseFloat(formData.tech_sanction_value) : null,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
      // Date formatting fallback
      tender_notice_date: formData.tender_notice_date || null,
      bid_submission_date: formData.bid_submission_date || null,
      bid_opening_date: formData.bid_opening_date || null,
      tender_approved_on: formData.tender_approved_on || null,
      work_order_issued_on: formData.work_order_issued_on || null,
      agreement_executed_on: formData.agreement_executed_on || null,
    };

    const isEdit = editingEntryId !== null;
    const url = isEdit ? `/api/entries/${editingEntryId}` : '/api/entries';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(parsedData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Could not save project entry');
        }
        return data;
      })
      .then(() => {
        setSuccessMsg(isEdit ? 'Project details updated successfully!' : 'Project entry submitted for circle DSE review!');
        resetForm();
        fetchEntries();
        setActiveTab('list');
      })
      .catch(err => {
        setError(err.message);
      });
  };

  const handleEdit = (entry) => {
    setEditingEntryId(entry.id);
    setFormData({
      scheme: entry.scheme,
      year: entry.year,
      go_details: entry.go_details || '',
      technical_sanction: entry.technical_sanction || '',
      admin_sanction_value: entry.admin_sanction_value !== null ? String(entry.admin_sanction_value) : '',
      tech_sanction_value: entry.tech_sanction_value !== null ? String(entry.tech_sanction_value) : '',
      tender_notice_no: entry.tender_notice_no || '',
      tender_notice_date: entry.tender_notice_date || '',
      name_of_work: entry.name_of_work,
      contract_value: entry.contract_value !== null ? String(entry.contract_value) : '',
      bid_submission_date: entry.bid_submission_date || '',
      bid_opening_date: entry.bid_opening_date || '',
      tender_accepting_authority: entry.tender_accepting_authority || 'DE',
      tender_approved_on: entry.tender_approved_on || '',
      work_order_issued_on: entry.work_order_issued_on || '',
      agreement_executed_on: entry.agreement_executed_on || '',
      present_stage: entry.present_stage || '',
      remarks: entry.remarks || ''
    });
    setActiveTab('new');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this project draft? This action is tracked.')) return;
    
    fetch(`/api/entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Deletion failed');
        setSuccessMsg('Project entry removed.');
        fetchEntries();
      })
      .catch(err => {
        setError(err.message);
      });
  };

  return (
    <div className="space-y-6">
      {/* Banner / Info Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Welcome, Engineer!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            You represent the <span className="text-teal-600 font-bold">{user.division?.name || 'Assigned'} Division</span> under the <span className="text-teal-600 font-bold">{user.circle?.name || 'Assigned'} Circle</span>.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
              activeTab === 'list' 
                ? 'bg-teal-600 text-white shadow-sm glow-teal' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            My Submissions ({entries.length})
          </button>
          <button
            onClick={() => { setActiveTab('new'); resetForm(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
              activeTab === 'new' 
                ? 'bg-teal-600 text-white shadow-sm glow-teal' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {editingEntryId ? 'Edit Draft Work' : 'Submit New Project'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Tab Content 1: SUBMISSIONS LIST */}
      {activeTab === 'list' && (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Project Submissions History
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              DE View Own Submissions Only
            </span>
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-500 text-sm">
              Loading submissions history...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-20 text-center space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-slate-500 text-sm font-semibold">No project entries submitted yet.</p>
              <button 
                onClick={() => setActiveTab('new')} 
                className="text-xs text-teal-600 hover:text-teal-700 font-bold underline"
              >
                Click here to submit your first entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5">Sl.No</th>
                    <th className="py-4 px-5">Name of Work</th>
                    <th className="py-4 px-5">Scheme & Year</th>
                    <th className="py-4 px-5">Sanction Value</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Submitted At</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-5 text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-4 px-5 max-w-sm">
                        <div className="text-slate-900 font-bold leading-relaxed">{entry.name_of_work}</div>
                        {entry.status === 'REJECTED' && entry.rejection_reason && (
                          <div className="mt-1.5 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] flex gap-1.5 items-start">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold uppercase tracking-wider">DSE Correction Required:</strong> "{entry.rejection_reason}"
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-slate-800">{entry.scheme}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold">{entry.year}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-teal-600 font-bold flex items-center gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {entry.admin_sanction_value || '0.00'} L
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Admin Value</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          entry.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                            : entry.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border-red-200/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200/60'
                        }`}>
                          {entry.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {entry.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {entry.status === 'PENDING' && <AlertCircle className="w-3 h-3" />}
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500">
                        {new Date(entry.submitted_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            disabled={entry.status === 'APPROVED'}
                            className={`p-2 rounded-xl transition-all ${
                              entry.status === 'APPROVED'
                                ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-200'
                                : 'text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200'
                            }`}
                            title={entry.status === 'APPROVED' ? 'Approved works cannot be edited' : 'Edit work details'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={entry.status === 'APPROVED'}
                            className={`p-2 rounded-xl transition-all ${
                              entry.status === 'APPROVED'
                                ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-200'
                                : 'text-red-500 bg-red-50 hover:bg-red-100 border border-red-200'
                            }`}
                            title={entry.status === 'APPROVED' ? 'Approved works cannot be deleted' : 'Soft-delete work draft'}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Tab Content 2: NEW / EDIT FORM */}
      {/* Tab Content 2: NEW / EDIT FORM */}
      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingEntryId ? 'Correct & Resubmit Project Record' : 'Submit New Project Work Record'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Fill out the standard NHRS Chennai highway tender project entry format below. All values in Lakhs where applicable.
              </p>
            </div>
            {editingEntryId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-red-500 hover:text-red-650 font-bold underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ==========================================
                SECTION 1: GENERAL PROJECT DETAILS
               ========================================== */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
                  1. General Project Details
                </h4>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Scheme Code *
                </label>
                <input
                  type="text"
                  name="scheme"
                  value={formData.scheme}
                  onChange={handleInputChange}
                  placeholder="e.g. CRIDP, NH(O), State Funded"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Financial Year *
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  required
                >
                  {generateFinancialYears().map(fy => (
                    <option key={fy} value={fy}>{fy}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Full Name of Work / Project description *
                </label>
                <textarea
                  name="name_of_work"
                  value={formData.name_of_work}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide details about the stretch, length (km), drainage structures, etc."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 leading-relaxed"
                  required
                ></textarea>
              </div>
            </div>

            {/* ==========================================
                SECTION 2: SANCTIONS & VALUES
               ========================================== */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <IndianRupee className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
                  2. Sanctions & Approvals
                </h4>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Government Order (G.O.) Details
                </label>
                <input
                  type="text"
                  name="go_details"
                  value={formData.go_details}
                  onChange={handleInputChange}
                  placeholder="G.O. (Ms) No. & Date details"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Administrative Sanction (A.S.) Value (in Lakhs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="admin_sanction_value"
                  value={formData.admin_sanction_value}
                  onChange={handleInputChange}
                  placeholder="e.g. 650.00"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Technical Sanction (T.S.) Reference Details
                </label>
                <input
                  type="text"
                  name="technical_sanction"
                  value={formData.technical_sanction}
                  onChange={handleInputChange}
                  placeholder="CE/SE reference proc. No."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Technical Sanction (T.S.) Value (in Lakhs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="tech_sanction_value"
                  value={formData.tech_sanction_value}
                  onChange={handleInputChange}
                  placeholder="e.g. 650.00"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
            </div>

            {/* ==========================================
                SECTION 3: TENDER DETAILS
               ========================================== */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
                  3. Tender & Award details
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Tender Notice No.
                  </label>
                  <input
                    type="text"
                    name="tender_notice_no"
                    value={formData.tender_notice_no}
                    onChange={handleInputChange}
                    placeholder="e.g. 10/2026"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Tender Notice Date
                  </label>
                  <input
                    type="date"
                    name="tender_notice_date"
                    value={formData.tender_notice_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Contract Value (in Lakhs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="contract_value"
                    value={formData.contract_value}
                    onChange={handleInputChange}
                    placeholder="e.g. 584.60"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Accepting Authority
                  </label>
                  <select
                    name="tender_accepting_authority"
                    value={formData.tender_accepting_authority}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  >
                    <option value="DE">Divisional Engineer (DE)</option>
                    <option value="SE">Superintendent Engineer (SE)</option>
                    <option value="CE">Chief Engineer (CE)</option>
                    <option value="COT">Committee of Tenders (COT)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Tender Approved On
                </label>
                <input
                  type="date"
                  name="tender_approved_on"
                  value={formData.tender_approved_on}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
            </div>

            {/* ==========================================
                SECTION 4: DATES & MILESTONES
               ========================================== */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
                  4. Progress & Milestones
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Bid Submission Date
                  </label>
                  <input
                    type="date"
                    name="bid_submission_date"
                    value={formData.bid_submission_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Bid Opening Date
                  </label>
                  <input
                    type="date"
                    name="bid_opening_date"
                    value={formData.bid_opening_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Work Order Issued On
                  </label>
                  <input
                    type="date"
                    name="work_order_issued_on"
                    value={formData.work_order_issued_on}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Agreement Executed On
                  </label>
                  <input
                    type="date"
                    name="agreement_executed_on"
                    value={formData.agreement_executed_on}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Present Stage of Work
                </label>
                <input
                  type="text"
                  name="present_stage"
                  value={formData.present_stage}
                  onChange={handleInputChange}
                  placeholder="e.g. Survey Completed, Pavement Laying, 35% Progress"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Remarks / Additional Notes
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Any delays, site constraints, or positive milestones"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
            </div>

          </div>

          <div className="border-t border-slate-200 pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-700 transition-all"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              {editingEntryId ? 'Submit Corrections' : 'Submit Project Record'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
