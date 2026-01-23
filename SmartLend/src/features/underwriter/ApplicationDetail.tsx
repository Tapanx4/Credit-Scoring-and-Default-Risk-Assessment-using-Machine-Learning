
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft, TrendingUp, DollarSign,Clock, User, Activity, FileText, AlertCircle, ShieldAlert, CheckCircle, Upload, Download, File, Send, ExternalLink } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Function to load/reload application data
  const loadApplication = () => {
    return api.get(`/applications/${id}`)
      .then(res => setApp(res.data))
      .catch(err => toast.error("Failed to load application"));
  };

  useEffect(() => {
    loadApplication().finally(() => setLoading(false));
  }, [id]);

  const handleOverride = async (decision: 'approve' | 'decline') => {
    const action = decision === 'approve' ? 'Approve' : 'Decline';
    const inputReason = prompt(`Enter reason for ${action} override:`);
    if (!inputReason) return;

    setActionLoading(true);
    const toastId = toast.loading(`Processing ${decision} override...`);
    try {
      // FIX: Payload structure depends on the endpoint
      const payload = decision === 'approve' 
        ? { reason: inputReason, notes: `Manual Override by ${role}` }
        : { reason_code: inputReason, notes: `Manual Override by ${role}` };

      await api.post(`/overrides/${id}/${decision}`, payload);
      
      await loadApplication();
      
      toast.success(`Successfully ${decision}d application.`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object' ? JSON.stringify(detail) : (detail || "Unknown error");
      toast.error(`Override failed: ${errorMsg}`, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocs = async () => {
      const toastId = toast.loading("Sending document request...");
      try {
          await api.post(`/applications/${id}/request-documents`);
          await loadApplication(); 
          toast.success("Request sent to applicant.", { id: toastId });
      } catch (err) {
          console.error(err);
          toast.error("Failed to send request.", { id: toastId });
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!app) return <div>Application not found</div>;

  // Data Extraction
  const risk = app.risk_profile || {};
  const econ = app.economics || {};
  const decision = app.decision || {};
  const applicant = app.input_data?.applicant || {};
  const loan = app.input_data?.loan || {};
  const bureau = app.input_data?.credit_bureau || {};
  
  // Robustly find documents: Check root property first, then fallback to input_data
  const documents = app.documents || app.input_data?.documents || [];

  const status = app.status;
  const isDeclined = status === 'DECLINED' || status === 'REJECTED';
  const isReview = status === 'MANUAL_REVIEW';
  const isFinal = ['ACCEPTED', 'FUNDED'].includes(status);
  const isOffered = status === 'OFFERED';
  const isManualOverride = app.current_tier === "Manual_Override";

  const isUserDeclined = isDeclined && !decision.primary_decline_reason;
  const docStatus = app.input_data?.docs_status;
  const isDocsRequested = docStatus === 'REQUESTED';
  const isDocsReceived = docStatus === 'RECEIVED';

  const isAdmin = role === 'admin';
  const canAct = isAdmin || (!isFinal && !isOffered);
  
  // UPDATED PERMISSION LOGIC:
  // Show Approve if in Manual Review OR (Declined AND Admin)
  
  //const showApprove = canAct && (isReview || (isDeclined && !isUserDeclined && isAdmin));
  const canOverrideDecline = role === 'admin' || role === 'underwriter';

const showApprove =
  canAct &&
  (isReview || (isDeclined && !isUserDeclined && canOverrideDecline));

  const showDecline = canAct && (isReview || (isAdmin && isOffered));

  // --- DRIVERS ---
  const getKeyDrivers = () => {
    if (decision.explanations && decision.explanations.length > 0) return decision.explanations;
    const drivers = [];
    const score = risk.credit_score || bureau.fico_score;
    if (score) {
        if (score >= 720) drivers.push({ feature: "Credit Score", impact: "positive", value: `${score} (Excellent)` });
        else if (score < 660) drivers.push({ feature: "Credit Score", impact: "negative", value: `${score} (Low)` });
    }
    if (bureau.dti) {
        if (bureau.dti > 40) drivers.push({ feature: "Debt-to-Income", impact: "negative", value: `${bureau.dti}% (High)` });
        else if (bureau.dti < 20) drivers.push({ feature: "Debt-to-Income", impact: "positive", value: `${bureau.dti}% (Healthy)` });
    }
    if (drivers.length === 0) drivers.push({ feature: "Risk Model Base", impact: "neutral", value: "Standard Profile" });
    return drivers.slice(0, 4);
  };
  const drivers = getKeyDrivers();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application #{app.id.slice(0,8)}</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${isOffered ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                      isFinal ? 'bg-green-100 text-green-800 border border-green-200' : 
                      isDeclined ? 'bg-red-100 text-red-800 border border-red-200' : 
                      isReview ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    {isUserDeclined ? 'OFFER DECLINED' : app.status}
                </span>
                <span className="text-sm text-gray-500 ml-2">{new Date(app.created_at).toLocaleString()}</span>
                {isManualOverride && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 ml-2">Override Active</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
            {!canAct ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded text-gray-600 text-sm">
                    <ShieldAlert className="w-4 h-4"/> Decision Locked
                </div>
            ) : (
                <>
                    {showDecline && (
                        <Button variant="danger" onClick={() => handleOverride('decline')} disabled={actionLoading}>
                            {isOffered ? 'Revoke Offer' : 'Decline'}
                        </Button>
                    )}
                    
                    {showApprove && (
                        <Button onClick={() => handleOverride('approve')} disabled={actionLoading}>
                            {isDeclined ? 'Override & Approve' : 'Approve'}
                        </Button>
                    )}
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: The Brain */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-brand-600">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-600"/> Risk Score</h2>
            <div className="text-center py-6">
              <div className={`text-6xl font-bold mb-2 ${risk.credit_score >= 700 ? 'text-green-600' : risk.credit_score >= 600 ? 'text-yellow-600' : 'text-red-600'}`}>
                {risk.credit_score || '---'}
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Internal Score</div>
              <div className="mt-4 flex justify-center gap-2">
                 <div className="px-3 py-1 bg-gray-100 rounded text-xs font-mono">PD: {((risk.pd_raw || 0) * 100).toFixed(2)}%</div>
                 <div className="px-3 py-1 bg-gray-100 rounded text-xs font-mono">
                    {app.current_tier?.replace('TIER_', '').replace(/_/g, ' ') || 'N/A'}
                 </div>
              </div>
            </div>
            <div className="border-t pt-4">
               <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Key Risk Drivers</h3>
               <div className="space-y-2">
                 {drivers.map((exp: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{exp.feature}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{String(exp.value).slice(0,15)}</span>
                            <div className={`w-2 h-2 rounded-full ${exp.impact === 'positive' ? 'bg-green-500' : exp.impact === 'negative' ? 'bg-red-500' : 'bg-gray-300'}`} />
                        </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-gray-600"/> Decision Logic</h2>
            {isManualOverride ? (
               <div className="p-4 bg-blue-50 text-blue-800 rounded border border-blue-200">
                <div className="font-bold text-sm mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> MANUAL OVERRIDE</div>
                <div className="text-sm">Approved by Underwriter decision.</div>
              </div>
            ) : decision.primary_decline_reason ? (
              <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200">
                <div className="font-bold text-sm mb-1">DECLINED (System)</div>
                <div className="text-sm">{decision.primary_decline_reason}</div>
              </div>
            ) : isUserDeclined ? (
               <div className="p-4 bg-orange-50 text-orange-800 rounded border border-orange-200">
                <div className="font-bold text-sm mb-1">OFFER DECLINED</div>
                <div className="text-sm">Applicant rejected the terms.</div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 text-green-800 rounded border border-green-200">
                <div className="font-bold text-sm mb-1">PASSED (System)</div>
                <div className="text-sm">Meets all underwriting criteria.</div>
              </div>
            )}
          </div>
        </div>

        {/* COL 2: Applicant & Credit */}
        <div className="lg:col-span-1 space-y-6">
             <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-gray-600"/> Applicant</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Name</span><span className="font-medium">{applicant.full_name}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Income</span><span className="font-medium">${(applicant.annual_income || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Employment</span><span className="font-medium">{applicant.emp_length} Years</span></div>
                    <div className="flex justify-between pb-2"><span className="text-gray-500">Location</span><span className="font-medium">{applicant.zip_code}, {applicant.address_state}</span></div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600"/> Credit Report</h2>
                {bureau.fico_score ? (
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div><p className="text-xs text-gray-500">FICO</p><p className="font-bold">{bureau.fico_score}</p></div>
                        <div><p className="text-xs text-gray-500">DTI</p><p className="font-bold">{bureau.dti}%</p></div>
                        <div><p className="text-xs text-gray-500">Util</p><p className="font-bold">{bureau.revol_util}%</p></div>
                        <div><p className="text-xs text-gray-500">Delinq</p><p className={`font-bold ${bureau.delinq_2yrs > 0 ? 'text-red-600' : ''}`}>{bureau.delinq_2yrs}</p></div>
                    </div>
                ) : <div className="text-gray-400 text-sm">No credit data.</div>}
             </div>
        </div>

        {/* COL 3: Economics & Documents */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600"/> Unit Economics</h2>
            <div className="space-y-6 text-sm">
              <div className="relative">
                <div className="flex justify-between mb-1"><span className="font-medium text-gray-700">Projected Interest</span><span className="font-bold text-green-700">+{econ.pricing_apr}% APR</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div></div>
              </div>
              <div className="relative">
                <div className="flex justify-between mb-1"><span className="font-medium text-gray-700">Expected Loss</span><span className="font-bold text-red-600">{(risk.pd_raw * 100).toFixed(2)}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, risk.pd_raw * 300)}%` }}></div></div>
              </div>
              <div className="mt-8 p-6 bg-green-50 rounded-xl text-center border border-green-200">
                <div className="text-sm text-green-800 mb-1 uppercase tracking-wide font-bold">Net Expected Value</div>
                <div className={`text-4xl font-bold ${(econ.expected_value || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {(econ.expected_value || 0) >= 0 ? '+' : '-'}${Math.abs(Math.round(econ.expected_value)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENTS SECTION */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><File className="w-5 h-5 text-gray-600"/> Documents</h2>
             
             {documents.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {documents.map((doc: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                            <span className="truncate max-w-[150px] font-medium text-gray-700">{doc.name}</span>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800 flex items-center gap-1 text-xs font-medium">
                                <ExternalLink className="w-3 h-3"/> Open
                            </a>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="text-center py-6 text-gray-400 text-xs italic border border-dashed rounded bg-gray-50 mb-4">
                    No documents uploaded by applicant.
                </div>
             )}

             <div className="relative">
                {/* Request Documents Button: Only allowed if Rejected or Manual Review and not yet received */}
                {(isReview || isDeclined) && !isDocsReceived && (
                    <Button 
                      variant="outline" 
                      className={`w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 ${isDocsRequested ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}`} 
                      onClick={handleRequestDocs}
                      disabled={isDocsRequested}
                    >
                        {isDocsRequested ? (
                            <><Clock className="w-4 h-4 mr-2"/> Awaiting Applicant</>
                        ) : (
                            <><Send className="w-4 h-4 mr-2"/> Request Documents</>
                        )}
                    </Button>
                )}
                
                {isDocsReceived && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-medium">
                        <CheckCircle className="w-4 h-4"/> Docs Received
                    </div>
                )}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}