// // // import React, { useEffect, useState } from 'react';
// // // import { useForm } from 'react-hook-form';
// // // import { zodResolver } from '@hookform/resolvers/zod';
// // // import * as z from 'zod';
// // // import { api } from '../../lib/api';
// // // import { supabase } from '../../lib/supabase';
// // // import { Button } from '../../components/ui/button';
// // // import { Input } from '../../components/ui/input';
// // // import { useAuth } from '../auth/AuthProvider';
// // // import { CheckCircle, AlertTriangle, LogOut, PlusCircle, List, Lock, Eye, XCircle, Check, Clock, Loader2, Upload, File } from 'lucide-react';
// // // import { useNavigate } from 'react-router-dom';
// // // import { toast } from 'sonner';
// // // import CreditScoreWidget from './CreditScoreWidget';

// // // /* ---------------- CONSTANTS ---------------- */

// // // const US_STATES = [
// // //   "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
// // //   "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", 
// // //   "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", 
// // //   "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", 
// // //   "UT", "VT", "VA", "WA", "WV", "WI", "WY"
// // // ];

// // // const EMP_CATEGORIES = [
// // //   'Management', 'Healthcare', 'Education', 'Sales/Marketing', 
// // //   'Engineering/IT', 'Trades/Construction', 'Administrative', 
// // //   'Self-Employed', 'Retired', 'Other',
// // // ] as const;

// // // const PURPOSE_OPTIONS = [
// // //   { value: "debt_consolidation", label: "Debt Consolidation" },
// // //   { value: "credit_card", label: "Credit Card Refinance" },
// // //   { value: "home_improvement", label: "Home Improvement" },
// // //   { value: "major_purchase", label: "Major Purchase" },
// // //   { value: "medical_expenses", label: "Medical Expenses" },
// // //   { value: "moving", label: "Moving and Relocation" },
// // //   { value: "vacation", label: "Vacation" },
// // //   { value: "car_financing", label: "Car Financing" },
// // //   { value: "small_business", label: "Business" },
// // //   { value: "other", label: "Other" }
// // // ];

// // // /* ---------------- ZOD SCHEMAS ---------------- */

// // // const step1Schema = z.object({
// // //   full_name: z.string().min(2, 'Name required'),
// // //   email: z.string().email('Invalid email'),
// // //   ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN'),
// // //   address_state: z.string().length(2, 'Select a state'),
// // //   zip_code: z.string().length(5, 'ZIP must be 5 digits'),
// // // });

// // // const step2Schema = z.object({
// // //   annual_income: z.coerce.number().min(10000, 'Income too low'),
// // //   emp_length: z.coerce.number().min(0).max(40),
// // //   home_ownership: z.enum(['RENT', 'OWN', 'MORTGAGE']),
// // //   emp_category: z.enum(EMP_CATEGORIES),
// // // });

// // // const step3Schema = z.object({
// // //   amount: z.coerce.number().min(1000, 'Minimum $1,000'),
// // //   term: z.coerce.number().refine(v => v === 36 || v === 60, {
// // //     message: 'Term must be 36 or 60 months',
// // //   }),
// // //   purpose: z.string().min(3, "Select a purpose"),
// // // });

// // // const finalSchema = step1Schema.merge(step2Schema).merge(step3Schema);
// // // type FormData = z.infer<typeof finalSchema>;

// // // /* ---------------- COMPONENT ---------------- */

// // // export default function ApplicationWizard() {
// // //   const { signOut } = useAuth();
// // //   const navigate = useNavigate();

// // //   const [view, setView] = useState<'list' | 'new'>('list');
// // //   const [applications, setApplications] = useState<any[]>([]);
// // //   const [step, setStep] = useState(1);
// // //   const [decision, setDecision] = useState<any>(null);
// // //   const [submitting, setSubmitting] = useState(false);
// // //   const [actionLoading, setActionLoading] = useState(false);
// // //   const [uploading, setUploading] = useState(false);

// // //   /* ---------------- FORM ---------------- */

// // //   const {
// // //     register,
// // //     handleSubmit,
// // //     trigger,
// // //     setValue,
// // //     formState: { errors },
// // //   } = useForm<FormData>({
// // //     resolver: zodResolver(finalSchema),
// // //     mode: 'onChange',
// // //     defaultValues: {
// // //       term: 36,
// // //       home_ownership: 'RENT',
// // //       emp_length: 0,
// // //       emp_category: 'Other',
// // //       purpose: '',
// // //     },
// // //   });

// // //   /* ---------------- LOAD DATA & AUTOFILL ---------------- */

// // //   const fetchApplications = (autoSwitchView = false) => {
// // //     api.get('/applications/')
// // //       .then(res => {
// // //         setApplications(res.data);
// // //         if (autoSwitchView && res.data.length === 0) {
// // //           setView('new');
// // //         }
// // //       })
// // //       .catch(console.error);
// // //   };

// // //   useEffect(() => {
// // //     fetchApplications(true);
// // //     const savedSSN = localStorage.getItem('applicant_ssn');
// // //     if (savedSSN) setValue('ssn', savedSSN);
// // //   }, [setValue]);

// // //   /* ---------------- ACTIONS ---------------- */

// // //   const handleDecisionAction = async (action: 'ACCEPT' | 'DECLINE') => {
// // //     if (!decision) return;
// // //     if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this offer?`)) return;

// // //     setActionLoading(true);
// // //     const toastId = toast.loading("Processing decision...");

// // //     try {
// // //         const endpointAction = action.toLowerCase(); 
// // //         await api.post(`/applications/${decision.id}/${endpointAction}`);
        
// // //         const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
        
// // //         setDecision((prev: any) => ({ ...prev, status: newStatus }));
// // //         fetchApplications(); 

// // //         if (action === 'DECLINE') {
// // //             setDecision(null);
// // //             setView('list');
// // //             toast.success("Offer declined.", { id: toastId });
// // //         } else {
// // //              toast.success("Offer accepted successfully!", { id: toastId });
// // //         }
// // //     } catch (e) {
// // //         toast.error("Action failed. Please try again.", { id: toastId });
// // //     } finally {
// // //         setActionLoading(false);
// // //     }
// // //   };

// // //   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
// // //     if (!event.target.files || event.target.files.length === 0) return;
// // //     const file = event.target.files[0];
    
// // //     setUploading(true);
// // //     const toastId = toast.loading("Uploading document...");

// // //     try {
// // //         const fileExt = file.name.split('.').pop();
// // //         const filePath = `${decision.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;

// // //         // 1. Upload to Supabase Storage
// // //         const { error: uploadError } = await supabase.storage
// // //             .from('loan-documents')
// // //             .upload(filePath, file);

// // //         if (uploadError) throw uploadError;

// // //         // 2. Get Public URL
// // //         const { data: { publicUrl } } = supabase.storage
// // //             .from('loan-documents')
// // //             .getPublicUrl(filePath);

// // //         // 3. Save Metadata to Backend
// // //         await api.post(`/applications/${decision.id}/documents`, {
// // //             name: file.name,
// // //             url: publicUrl,
// // //             type: file.type
// // //         });

// // //         // 4. Refresh decision data to show new doc (if we were displaying list)
// // //         // For now just alert success
// // //         toast.success("Document uploaded successfully", { id: toastId });

// // //     } catch (error: any) {
// // //         console.error(error);
// // //         toast.error(`Upload failed: ${error.message}`, { id: toastId });
// // //     } finally {
// // //         setUploading(false);
// // //         event.target.value = '';
// // //     }
// // //   };

// // //   const getStatusStyle = (status: string) => {
// // //     switch (status) {
// // //       case 'ACCEPTED':
// // //       case 'FUNDED':
// // //         return 'bg-green-100 text-green-800 border border-green-200';
// // //       case 'OFFERED':
// // //       case 'APPROVED':
// // //         return 'bg-blue-100 text-blue-800 border border-blue-200';
// // //       case 'DECLINED':
// // //       case 'REJECTED':
// // //         return 'bg-red-100 text-red-800 border border-red-200';
// // //       case 'MANUAL_REVIEW':
// // //         return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
// // //       default:
// // //         return 'bg-gray-100 text-gray-800 border border-gray-200';
// // //     }
// // //   };

// // //   /* ---------------- SUBMIT ---------------- */

// // //   const onSubmit = async (data: FormData) => {
// // //     setSubmitting(true);
// // //     const toastId = toast.loading("Submitting application...");

// // //     try {
// // //       if (data.ssn) localStorage.setItem('applicant_ssn', data.ssn);

// // //       const payload = {
// // //         applicant: {
// // //           full_name: data.full_name,
// // //           email: data.email,
// // //           ssn: data.ssn.replace(/\D/g, ''),
// // //           annual_income: data.annual_income,
// // //           emp_length: data.emp_length,
// // //           home_ownership: data.home_ownership,
// // //           emp_category: data.emp_category,
// // //           zip_code: data.zip_code,
// // //           address_state: (data.address_state || '').toUpperCase(),
// // //         },
// // //         loan: {
// // //           amount: data.amount,
// // //           term: data.term,
// // //           purpose: data.purpose,
// // //         },
// // //       };

// // //       const res = await api.post('/applications/', payload);
// // //       setDecision(res.data);
// // //       setApplications(prev => [res.data, ...prev]);
      
// // //       const outcome = res.data.decision?.outcome;
// // //       if (outcome === 'APPROVED') {
// // //           toast.success("Application Pre-Approved!", { id: toastId });
// // //       } else if (outcome === 'DECLINE') {
// // //           toast.error("Application Declined.", { id: toastId });
// // //       } else {
// // //           toast.info("Application under review.", { id: toastId });
// // //       }

// // //     } catch (e) {
// // //       console.error(e);
// // //       toast.error('Submission failed. Please try again.', { id: toastId });
// // //     } finally {
// // //       setSubmitting(false);
// // //     }
// // //   };

// // //   const nextStep = async () => {
// // //     const fields = step === 1 
// // //         ? ['full_name', 'email', 'ssn', 'address_state', 'zip_code'] 
// // //         : step === 2 
// // //         ? ['annual_income', 'emp_length', 'home_ownership', 'emp_category'] 
// // //         : ['amount', 'term', 'purpose'];
        
// // //     // @ts-ignore
// // //     const valid = await trigger(fields);
// // //     if (valid) setStep(s => s + 1);
// // //   };

// // //   /* ---------------- HEADER ---------------- */

// // //   const Header = (
// // //     <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
// // //       <div><h1 className="text-xl font-bold text-gray-900">Applicant Portal</h1></div>
// // //       <div className="flex flex-wrap gap-2 items-center justify-center">
// // //         <CreditScoreWidget />
// // //         <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
// // //         <Button variant="outline" onClick={() => { setView('list'); setDecision(null); }}><List className="w-4 h-4 mr-2" /> My Loans</Button>
// // //         <Button onClick={() => { setView('new'); setDecision(null); setStep(1); }}><PlusCircle className="w-4 h-4 mr-2" /> New Application</Button>
// // //         <Button variant="outline" onClick={() => navigate('/update-password')}><Lock className="w-4 h-4 mr-2" /> Password</Button>
// // //         <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
// // //       </div>
// // //     </header>
// // //   );

// // //   /* ---------------- DECISION VIEW ---------------- */

// // //   if (decision) {
// // //     const status = decision.status;
// // //     const outcome = decision.decision?.outcome;

// // //     const isApprovedState = ['OFFERED', 'ACCEPTED', 'FUNDED', 'APPROVED'].includes(status);
// // //     const isDeclined = !isApprovedState && (status === 'DECLINED' || status === 'REJECTED' || outcome === 'DECLINE');
// // //     const isAccepted = status === 'ACCEPTED' || status === 'FUNDED';
// // //     const isReview = status === 'MANUAL_REVIEW' || outcome === 'MANUAL_REVIEW';
// // //     const isOffered = status === 'OFFERED' || (outcome === 'APPROVE' && !isAccepted && !isDeclined && !isReview);
// // //     const isProcessing = status === 'CREATED' || status === 'SUBMITTED' || status === 'SCORED';

// // //     return (
// // //       <div className="min-h-screen bg-gray-50 p-8">
// // //         {Header}
// // //         <div className="flex justify-center mt-10">
// // //           <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
            
// // //             {isProcessing && (
// // //                <div className="py-10">
// // //                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4"/>
// // //                    <h2 className="text-xl font-bold text-gray-800">Processing Application...</h2>
// // //                    <p className="text-gray-500 mt-2">Analyzing credit profile and eligibility.</p>
// // //                </div>
// // //             )}

// // //             {isReview && !isApprovedState && (
// // //                <div className="py-6">
// // //                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                        <Clock className="w-8 h-8 text-yellow-600" />
// // //                    </div>
// // //                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
// // //                    <p className="text-gray-600 mb-4">
// // //                        Your application requires manual review. We will notify you shortly.
// // //                    </p>
// // //                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded text-yellow-800 text-sm">
// // //                        Status: <strong>Pending Review</strong>
// // //                    </div>
                   
// // //                    {/* Upload Area for Manual Review */}
// // //                    <div className="mt-6 pt-6 border-t border-gray-100">
// // //                         <p className="text-sm text-gray-600 mb-3">Supporting Documents (Optional)</p>
// // //                         <div className="relative">
// // //                             <input 
// // //                                 type="file" 
// // //                                 id="doc-upload" 
// // //                                 className="hidden" 
// // //                                 onChange={handleFileUpload}
// // //                                 disabled={uploading}
// // //                             />
// // //                             <label htmlFor="doc-upload" className={`flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}>
// // //                                 {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
// // //                                 <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Paystub / ID'}</span>
// // //                             </label>
// // //                         </div>
// // //                    </div>
// // //                </div>
// // //             )}

// // //             {isDeclined && (
// // //               <>
// // //                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                   <AlertTriangle className="w-8 h-8 text-red-600" />
// // //                 </div>
// // //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">
// // //                    {decision.decision?.primary_decline_reason ? "Application Declined" : "Offer Declined"}
// // //                 </h2>
// // //                 <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 text-sm mt-4">
// // //                   <strong>Reason:</strong> {decision.decision?.primary_decline_reason || "Offer declined by applicant."}
// // //                 </div>
// // //               </>
// // //             )}

// // //             {isOffered && (
// // //               <>
// // //                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                   <CheckCircle className="w-8 h-8 text-green-600" />
// // //                 </div>
// // //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Approved!</h2>
// // //                 <div className="grid grid-cols-2 gap-4 mt-6 mb-6 text-left">
// // //                   <div className="bg-gray-50 p-4 rounded-lg">
// // //                     <p className="text-xs text-gray-500 uppercase">APR</p>
// // //                     <p className="text-xl font-bold text-gray-900">{decision.economics?.pricing_apr}%</p>
// // //                   </div>
// // //                   <div className="bg-gray-50 p-4 rounded-lg">
// // //                     <p className="text-xs text-gray-500 uppercase">Amount</p>
// // //                     <p className="text-xl font-bold text-gray-900">
// // //                       ${decision.approved_amount?.toLocaleString() ?? decision.economics?.approved_amount?.toLocaleString() ?? '0'}
// // //                     </p>
// // //                   </div>
// // //                 </div>

// // //                 <div className="flex gap-3 mt-6">
// // //                     <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecisionAction('DECLINE')} disabled={actionLoading}>
// // //                         <XCircle className="w-4 h-4 mr-2"/> Decline
// // //                     </Button>
// // //                     <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecisionAction('ACCEPT')} disabled={actionLoading}>
// // //                         <Check className="w-4 h-4 mr-2"/> Accept
// // //                     </Button>
// // //                 </div>
// // //               </>
// // //             )}

// // //             {isAccepted && (
// // //                <>
// // //                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                   <CheckCircle className="w-8 h-8 text-blue-600" />
// // //                 </div>
// // //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Accepted!</h2>
// // //                 <p className="text-gray-600 mb-4">Your funds are being processed.</p>
// // //                 <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm font-medium">
// // //                     Loan ID: {decision.id.slice(0, 8)}
// // //                 </div>
// // //                </>
// // //             )}

// // //             <Button variant="outline" className="w-full mt-6" onClick={() => { setDecision(null); setView('list'); }}>
// // //               Return to Dashboard
// // //             </Button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   /* ---------------- LIST VIEW ---------------- */

// // //   if (view === 'list') {
// // //     return (
// // //       <div className="min-h-screen bg-gray-50 p-8">
// // //         <div className="max-w-5xl mx-auto">
// // //           {Header}
// // //           <div className="bg-white rounded-lg shadow overflow-hidden">
// // //             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h2 className="font-semibold text-gray-700">My Applications</h2></div>
// // //             {applications.length === 0 ? (
// // //               <div className="p-10 text-center text-gray-500">No applications found. Start a new one!</div>
// // //             ) : (
// // //               <div className="overflow-x-auto">
// // //                 <table className="w-full text-sm text-left">
// // //                   <thead className="bg-gray-50 text-gray-500 font-medium">
// // //                     <tr>
// // //                       <th className="px-6 py-3">Date</th>
// // //                       <th className="px-6 py-3">Status</th>
// // //                       <th className="px-6 py-3">Amount</th>
// // //                       <th className="px-6 py-3 text-right">Action</th>
// // //                     </tr>
// // //                   </thead>
// // //                   <tbody className="divide-y divide-gray-100">
// // //                     {applications.map(app => {
// // //                         const statusStyle = getStatusStyle(app.status);
// // //                         const displayAmount = app.approved_amount ?? app.input_data?.loan?.amount ?? 0;

// // //                         return (
// // //                         <tr key={app.id} className="hover:bg-gray-50">
// // //                           <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
// // //                           <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>{app.status}</span></td>
// // //                           <td className="px-6 py-4 font-medium text-gray-900">${displayAmount.toLocaleString()}</td>
// // //                           <td className="px-6 py-4 text-right"><Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setDecision(app)}><Eye className="w-3 h-3 mr-1"/> View</Button></td>
// // //                         </tr>
// // //                     )})}
// // //                   </tbody>
// // //                 </table>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   /* ---------------- WIZARD FORM ---------------- */
// // //   // ... (Keep existing Wizard Form code same as previous) ...
// // //   return (
// // //     <div className="min-h-screen bg-gray-50 p-8">
// // //       <div className="max-w-2xl mx-auto">
// // //         {Header}
// // //         <div className="bg-white rounded-xl shadow overflow-hidden">
// // //           <div className="h-2 bg-gray-100 mb-6"><div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${step * 33.33}%` }} /></div>
// // //           <form onSubmit={handleSubmit(onSubmit)} className="p-8">
// // //             <h2 className="text-xl font-bold text-gray-900 mb-6">{step === 1 ? 'Identity' : step === 2 ? 'Financials' : 'Loan Details'}</h2>
            
// // //             {step === 1 && (
// // //               <div className="space-y-4">
// // //                 <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
// // //                 <Input label="Email" {...register('email')} error={errors.email?.message} />
// // //                 <Input label="SSN" {...register('ssn')} error={errors.ssn?.message} placeholder="000-00-0000" />
// // //                 <div className="grid grid-cols-2 gap-4">
// // //                   <div>
// // //                     <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
// // //                     <select {...register('address_state')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// // //                       <option value="">Select State</option>
// // //                       {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
// // //                     </select>
// // //                     {errors.address_state && <p className="text-red-500 text-sm mt-1">{errors.address_state.message}</p>}
// // //                   </div>
// // //                   <Input label="ZIP" {...register('zip_code')} error={errors.zip_code?.message} maxLength={5} />
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {step === 2 && (
// // //               <div className="space-y-4">
// // //                 <Input label="Annual Income" type="number" {...register('annual_income', { valueAsNumber: true })} error={errors.annual_income?.message} />
                
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-1">Employment Length</label>
// // //                   <select {...register('emp_length', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// // //                     <option value={0}>Less than 1 year</option>
// // //                     {[...Array(10)].map((_, i) => (
// // //                       <option key={i+1} value={i+1}>{i+1} year{i !== 0 ? 's' : ''}</option>
// // //                     ))}
// // //                     <option value={10}>10+ years</option>
// // //                   </select>
// // //                 </div>

// // //                 <div className="grid grid-cols-2 gap-4">
// // //                   <div>
// // //                     <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
// // //                     <select {...register('emp_category')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// // //                       <option value="">Select</option>
// // //                       {EMP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
// // //                     </select>
// // //                     {errors.emp_category && <p className="text-red-500 text-sm mt-1">{errors.emp_category.message}</p>}
// // //                   </div>
// // //                   <div>
// // //                     <label className="block text-sm font-medium text-gray-700 mb-1">Housing</label>
// // //                     <select {...register('home_ownership')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// // //                       <option value="RENT">Rent</option>
// // //                       <option value="OWN">Own</option>
// // //                       <option value="MORTGAGE">Mortgage</option>
// // //                     </select>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {step === 3 && (
// // //               <div className="space-y-4">
// // //                 <Input label="Loan Amount" type="number" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
                
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
// // //                   <select {...register('purpose')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// // //                     <option value="">Select Purpose</option>
// // //                     {PURPOSE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
// // //                   </select>
// // //                   {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>}
// // //                 </div>

// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
// // //                   <div className="grid grid-cols-2 gap-4">
// // //                     <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
// // //                       <input type="radio" value={36} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
// // //                       <span className="font-medium">36 Months</span>
// // //                     </label>
// // //                     <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
// // //                       <input type="radio" value={60} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
// // //                       <span className="font-medium">60 Months</span>
// // //                     </label>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             )}

// // //             <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
// // //               {step > 1 ? <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
// // //               {step < 3 ? <Button type="button" onClick={nextStep}>Next</Button> : <Button type="submit" isLoading={submitting}>Submit</Button>}
// // //             </div>
// // //           </form>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // import React, { useEffect, useState } from 'react';
// // import { useForm } from 'react-hook-form';
// // import { zodResolver } from '@hookform/resolvers/zod';
// // import * as z from 'zod';
// // import { api } from '../../lib/api';
// // import { supabase } from '../../lib/supabase'; // Import Supabase client
// // import { Button } from '../../components/ui/button';
// // import { Input } from '../../components/ui/input';
// // import { useAuth } from '../auth/AuthProvider';
// // import { CheckCircle, AlertTriangle, LogOut, PlusCircle, List, Lock, Eye, XCircle, Check, Clock, Loader2, Upload, FileText, Send } from 'lucide-react';
// // import { useNavigate } from 'react-router-dom';
// // import { toast } from 'sonner';
// // import CreditScoreWidget from './CreditScoreWidget';

// // /* ---------------- CONSTANTS ---------------- */

// // const US_STATES = [
// //   "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
// //   "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", 
// //   "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", 
// //   "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", 
// //   "UT", "VT", "VA", "WA", "WV", "WI", "WY"
// // ];

// // const EMP_CATEGORIES = [
// //   'Management', 'Healthcare', 'Education', 'Sales/Marketing', 
// //   'Engineering/IT', 'Trades/Construction', 'Administrative', 
// //   'Self-Employed', 'Retired', 'Other',
// // ] as const;

// // const PURPOSE_OPTIONS = [
// //   { value: "debt_consolidation", label: "Debt Consolidation" },
// //   { value: "credit_card", label: "Credit Card Refinance" },
// //   { value: "home_improvement", label: "Home Improvement" },
// //   { value: "major_purchase", label: "Major Purchase" },
// //   { value: "medical_expenses", label: "Medical Expenses" },
// //   { value: "moving", label: "Moving and Relocation" },
// //   { value: "vacation", label: "Vacation" },
// //   { value: "car_financing", label: "Car Financing" },
// //   { value: "small_business", label: "Business" },
// //   { value: "other", label: "Other" }
// // ];

// // /* ---------------- ZOD SCHEMAS ---------------- */

// // const step1Schema = z.object({
// //   full_name: z.string().min(2, 'Name required'),
// //   email: z.string().email('Invalid email'),
// //   ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN'),
// //   address_state: z.string().length(2, 'Select a state'),
// //   zip_code: z.string().length(5, 'ZIP must be 5 digits'),
// // });

// // const step2Schema = z.object({
// //   annual_income: z.coerce.number().min(10000, 'Income too low'),
// //   emp_length: z.coerce.number().min(0).max(40),
// //   home_ownership: z.enum(['RENT', 'OWN', 'MORTGAGE']),
// //   emp_category: z.enum(EMP_CATEGORIES),
// // });

// // const step3Schema = z.object({
// //   amount: z.coerce.number().min(1000, 'Minimum $1,000'),
// //   term: z.coerce.number().refine(v => v === 36 || v === 60, {
// //     message: 'Term must be 36 or 60 months',
// //   }),
// //   purpose: z.string().min(3, "Select a purpose"),
// // });

// // const finalSchema = step1Schema.merge(step2Schema).merge(step3Schema);
// // type FormData = z.infer<typeof finalSchema>;

// // /* ---------------- COMPONENT ---------------- */

// // export default function ApplicationWizard() {
// //   const { signOut } = useAuth();
// //   const navigate = useNavigate();

// //   const [view, setView] = useState<'list' | 'new' | 'upload'>('list');
// //   const [applications, setApplications] = useState<any[]>([]);
// //   const [step, setStep] = useState(1);
// //   const [decision, setDecision] = useState<any>(null);
// //   const [submitting, setSubmitting] = useState(false);
// //   const [actionLoading, setActionLoading] = useState(false);
// //   const [uploading, setUploading] = useState(false);

// //   /* ---------------- FORM ---------------- */

// //   const {
// //     register,
// //     handleSubmit,
// //     trigger,
// //     setValue,
// //     formState: { errors },
// //   } = useForm<FormData>({
// //     resolver: zodResolver(finalSchema),
// //     mode: 'onChange',
// //     defaultValues: {
// //       term: 36,
// //       home_ownership: 'RENT',
// //       emp_length: 0,
// //       emp_category: 'Other',
// //       purpose: '',
// //     },
// //   });

// //   /* ---------------- LOAD DATA & AUTOFILL ---------------- */

// //   const fetchApplications = (autoSwitchView = false) => {
// //     api.get('/applications/')
// //       .then(res => {
// //         setApplications(res.data);
// //         if (autoSwitchView && res.data.length === 0) {
// //           setView('new');
// //         }
// //       })
// //       .catch(console.error);
// //   };

// //   useEffect(() => {
// //     fetchApplications(true);
// //     const savedSSN = localStorage.getItem('applicant_ssn');
// //     if (savedSSN) setValue('ssn', savedSSN);
// //   }, [setValue]);

// //   /* ---------------- ACTIONS ---------------- */

// //   const handleDecisionAction = async (action: 'ACCEPT' | 'DECLINE') => {
// //     if (!decision) return;
// //     if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this offer?`)) return;

// //     setActionLoading(true);
// //     const toastId = toast.loading("Processing decision...");

// //     try {
// //         const endpointAction = action.toLowerCase(); 
// //         await api.post(`/applications/${decision.id}/${endpointAction}`);
        
// //         const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
        
// //         setDecision((prev: any) => ({ ...prev, status: newStatus }));
// //         fetchApplications(); 

// //         if (action === 'DECLINE') {
// //             setDecision(null);
// //             setView('list');
// //             toast.success("Offer declined.", { id: toastId });
// //         } else {
// //              toast.success("Offer accepted successfully!", { id: toastId });
// //         }
// //     } catch (e) {
// //         toast.error("Action failed. Please try again.", { id: toastId });
// //     } finally {
// //         setActionLoading(false);
// //     }
// //   };

// //   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
// //     if (!event.target.files || event.target.files.length === 0) return;
// //     const file = event.target.files[0];
    
// //     setUploading(true);
// //     const toastId = toast.loading("Uploading document...");

// //     try {
// //         const fileExt = file.name.split('.').pop();
// //         // Path: app_id/random.ext
// //         const filePath = `${decision.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;

// //         // 1. Upload to Supabase Storage
// //         const { error: uploadError } = await supabase.storage
// //             .from('loan-documents')
// //             .upload(filePath, file);

// //         if (uploadError) throw uploadError;

// //         // 2. Get Public URL
// //         const { data: { publicUrl } } = supabase.storage
// //             .from('loan-documents')
// //             .getPublicUrl(filePath);

// //         // 3. Save Metadata to Backend
// //         await api.post(`/applications/${decision.id}/documents`, {
// //             name: file.name,
// //             url: publicUrl,
// //             type: file.type
// //         });

// //         // 4. Update Local State (Optimistic)
// //         const updatedDecision = {
// //             ...decision,
// //             input_data: { 
// //                 ...decision.input_data, 
// //                 docs_status: 'RECEIVED' 
// //             }
// //         };
// //         setDecision(updatedDecision);
// //         fetchApplications(); // Background refresh

// //         toast.success("Document uploaded successfully. The underwriter has been notified.", { id: toastId });
        
// //         // Return to Decision View after a moment
// //         setTimeout(() => setView('list'), 1500);

// //     } catch (error: any) {
// //         console.error(error);
// //         toast.error(`Upload failed: ${error.message}`, { id: toastId });
// //     } finally {
// //         setUploading(false);
// //         event.target.value = '';
// //     }
// //   };

// //   const getStatusStyle = (status: string) => {
// //     switch (status) {
// //       case 'ACCEPTED':
// //       case 'FUNDED':
// //         return 'bg-green-100 text-green-800 border border-green-200';
// //       case 'OFFERED':
// //       case 'APPROVED':
// //         return 'bg-blue-100 text-blue-800 border border-blue-200';
// //       case 'DECLINED':
// //       case 'REJECTED':
// //         return 'bg-red-100 text-red-800 border border-red-200';
// //       case 'MANUAL_REVIEW':
// //         return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
// //       default:
// //         return 'bg-gray-100 text-gray-800 border border-gray-200';
// //     }
// //   };

// //   /* ---------------- SUBMIT ---------------- */

// //   const onSubmit = async (data: FormData) => {
// //     setSubmitting(true);
// //     const toastId = toast.loading("Submitting application...");

// //     try {
// //       if (data.ssn) localStorage.setItem('applicant_ssn', data.ssn);

// //       const payload = {
// //         applicant: {
// //           full_name: data.full_name,
// //           email: data.email,
// //           ssn: data.ssn.replace(/\D/g, ''),
// //           annual_income: data.annual_income,
// //           emp_length: data.emp_length,
// //           home_ownership: data.home_ownership,
// //           emp_category: data.emp_category,
// //           zip_code: data.zip_code,
// //           address_state: (data.address_state || '').toUpperCase(),
// //         },
// //         loan: {
// //           amount: data.amount,
// //           term: data.term,
// //           purpose: data.purpose,
// //         },
// //       };

// //       const res = await api.post('/applications/', payload);
// //       setDecision(res.data);
// //       setApplications(prev => [res.data, ...prev]);
      
// //       // Determine message based on outcome
// //       const outcome = res.data.decision?.outcome;
// //       if (outcome === 'APPROVED') {
// //           toast.success("Application Pre-Approved!", { id: toastId });
// //       } else if (outcome === 'DECLINE') {
// //           toast.error("Application Declined.", { id: toastId });
// //       } else {
// //           toast.info("Application under review.", { id: toastId });
// //       }

// //     } catch (e) {
// //       console.error(e);
// //       toast.error('Submission failed. Please try again.', { id: toastId });
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   const nextStep = async () => {
// //     const fields = step === 1 
// //         ? ['full_name', 'email', 'ssn', 'address_state', 'zip_code'] 
// //         : step === 2 
// //         ? ['annual_income', 'emp_length', 'home_ownership', 'emp_category'] 
// //         : ['amount', 'term', 'purpose'];
        
// //     // @ts-ignore
// //     const valid = await trigger(fields);
// //     if (valid) setStep(s => s + 1);
// //   };

// //   /* ---------------- HEADER ---------------- */

// //   const Header = (
// //     <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
// //       <div><h1 className="text-xl font-bold text-gray-900">Applicant Portal</h1></div>
// //       <div className="flex flex-wrap gap-2 items-center justify-center">
// //         <CreditScoreWidget />
// //         <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
// //         <Button variant="outline" onClick={() => { setView('list'); setDecision(null); }}><List className="w-4 h-4 mr-2" /> My Loans</Button>
// //         <Button onClick={() => { setView('new'); setDecision(null); setStep(1); }}><PlusCircle className="w-4 h-4 mr-2" /> New Application</Button>
// //         <Button variant="outline" onClick={() => navigate('/update-password')}><Lock className="w-4 h-4 mr-2" /> Password</Button>
// //         <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
// //       </div>
// //     </header>
// //   );

// //   /* ---------------- UPLOAD DOCUMENTS VIEW ---------------- */

// //   if (view === 'upload' && decision) {
// //       return (
// //         <div className="min-h-screen bg-gray-50 p-8">
// //             {Header}
// //             <div className="flex justify-center mt-10">
// //                 <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
// //                     <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                         <Upload className="w-8 h-8 text-blue-600" />
// //                     </div>
// //                     <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
// //                     <p className="text-gray-600 mb-6">
// //                         Please upload proof of income (e.g., Paystub, W2) or Identity (Driver's License).
// //                     </p>
                    
// //                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 transition cursor-pointer relative">
// //                         <input 
// //                             type="file" 
// //                             id="upload-page-input" 
// //                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
// //                             onChange={handleFileUpload}
// //                             disabled={uploading}
// //                         />
// //                         <div className="flex flex-col items-center">
// //                             {uploading ? (
// //                                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
// //                             ) : (
// //                                 <FileText className="w-10 h-10 text-gray-400 mb-2" />
// //                             )}
// //                             <span className="text-sm text-gray-500 font-medium">
// //                                 {uploading ? 'Uploading...' : 'Click to select file'}
// //                             </span>
// //                         </div>
// //                     </div>

// //                     <Button variant="outline" className="w-full mt-6" onClick={() => setView('list')}>
// //                         Cancel / Return to Dashboard
// //                     </Button>
// //                 </div>
// //             </div>
// //         </div>
// //       );
// //   }

// //   /* ---------------- DECISION VIEW ---------------- */

// //   if (decision) {
// //     const status = decision.status;
// //     const outcome = decision.decision?.outcome;

// //     const isApprovedState = ['OFFERED', 'ACCEPTED', 'FUNDED', 'APPROVED'].includes(status);
// //     const isDeclined = !isApprovedState && (status === 'DECLINED' || status === 'REJECTED' || outcome === 'DECLINE');
// //     const isAccepted = status === 'ACCEPTED' || status === 'FUNDED';
// //     const isReview = status === 'MANUAL_REVIEW' || outcome === 'MANUAL_REVIEW';
// //     const isOffered = status === 'OFFERED' || (outcome === 'APPROVE' && !isAccepted && !isDeclined && !isReview);
// //     const isProcessing = status === 'CREATED' || status === 'SUBMITTED' || status === 'SCORED';

// //     // Document Status
// //     const docStatus = decision.input_data?.docs_status;
// //     const isDocsRequested = docStatus === 'REQUESTED';
// //     const isDocsReceived = docStatus === 'RECEIVED';

// //     return (
// //       <div className="min-h-screen bg-gray-50 p-8">
// //         {Header}
// //         <div className="flex justify-center mt-10">
// //           <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
            
// //             {/* --- STATE: PROCESSING --- */}
// //             {isProcessing && (
// //                <div className="py-10">
// //                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4"/>
// //                    <h2 className="text-xl font-bold text-gray-800">Processing Application...</h2>
// //                    <p className="text-gray-500 mt-2">Analyzing credit profile and eligibility.</p>
// //                </div>
// //             )}

// //             {/* --- STATE: MANUAL REVIEW --- */}
// //             {isReview && !isApprovedState && (
// //                <div className="py-6">
// //                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                        <Clock className="w-8 h-8 text-yellow-600" />
// //                    </div>
// //                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
// //                    <p className="text-gray-600 mb-4">
// //                        Your application requires manual review. We will notify you shortly.
// //                    </p>
// //                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded text-yellow-800 text-sm mb-4">
// //                        Status: <strong>Pending Review</strong>
// //                    </div>

// //                    {/* Docs Requested Button */}
// //                    {isDocsRequested && (
// //                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mb-4" onClick={() => setView('upload')}>
// //                            <Upload className="w-4 h-4"/> Upload Requested Documents
// //                        </Button>
// //                    )}
// //                    {isDocsReceived && (
// //                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200 mb-4 flex items-center justify-center gap-2">
// //                            <CheckCircle className="w-4 h-4"/> Documents Submitted
// //                        </div>
// //                    )}
// //                </div>
// //             )}

// //             {/* --- STATE: DECLINED --- */}
// //             {isDeclined && (
// //               <>
// //                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <AlertTriangle className="w-8 h-8 text-red-600" />
// //                 </div>
// //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">
// //                    {decision.decision?.primary_decline_reason ? "Application Declined" : "Offer Declined"}
// //                 </h2>
// //                 <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 text-sm mt-4">
// //                   <strong>Reason:</strong> {decision.decision?.primary_decline_reason || "Offer declined by applicant."}
// //                 </div>
// //               </>
// //             )}

// //             {/* --- STATE: OFFERED (PRE-APPROVED) --- */}
// //             {isOffered && (
// //               <>
// //                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <CheckCircle className="w-8 h-8 text-green-600" />
// //                 </div>
// //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Approved!</h2>
// //                 <div className="grid grid-cols-2 gap-4 mt-6 mb-6 text-left">
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="text-xs text-gray-500 uppercase">APR</p>
// //                     <p className="text-xl font-bold text-gray-900">{decision.economics?.pricing_apr}%</p>
// //                   </div>
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="text-xs text-gray-500 uppercase">Amount</p>
// //                     <p className="text-xl font-bold text-gray-900">
// //                       ${decision.approved_amount?.toLocaleString() ?? decision.economics?.approved_amount?.toLocaleString() ?? '0'}
// //                     </p>
// //                   </div>
// //                 </div>

// //                 <div className="flex gap-3 mt-6">
// //                     <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecisionAction('DECLINE')} disabled={actionLoading}>
// //                         <XCircle className="w-4 h-4 mr-2"/> Decline
// //                     </Button>
// //                     <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecisionAction('ACCEPT')} disabled={actionLoading}>
// //                         <Check className="w-4 h-4 mr-2"/> Accept
// //                     </Button>
// //                 </div>
// //               </>
// //             )}

// //             {/* --- STATE: ACCEPTED --- */}
// //             {isAccepted && (
// //                <>
// //                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <CheckCircle className="w-8 h-8 text-blue-600" />
// //                 </div>
// //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Accepted!</h2>
// //                 <p className="text-gray-600 mb-4">Your funds are being processed.</p>
// //                 <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm font-medium">
// //                     Loan ID: {decision.id.slice(0, 8)}
// //                 </div>
// //                </>
// //             )}

// //             <Button variant="outline" className="w-full mt-6" onClick={() => { setDecision(null); setView('list'); }}>
// //               Return to Dashboard
// //             </Button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   /* ---------------- LIST VIEW ---------------- */

// //   if (view === 'list') {
// //     return (
// //       <div className="min-h-screen bg-gray-50 p-8">
// //         <div className="max-w-5xl mx-auto">
// //           {Header}
// //           <div className="bg-white rounded-lg shadow overflow-hidden">
// //             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h2 className="font-semibold text-gray-700">My Applications</h2></div>
// //             {applications.length === 0 ? (
// //               <div className="p-10 text-center text-gray-500">No applications found. Start a new one!</div>
// //             ) : (
// //               <div className="overflow-x-auto">
// //                 <table className="w-full text-sm text-left">
// //                   <thead className="bg-gray-50 text-gray-500 font-medium">
// //                     <tr>
// //                       <th className="px-6 py-3">Date</th>
// //                       <th className="px-6 py-3">Status</th>
// //                       <th className="px-6 py-3">Amount</th>
// //                       <th className="px-6 py-3 text-right">Action</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody className="divide-y divide-gray-100">
// //                     {applications.map(app => {
// //                         const statusStyle = getStatusStyle(app.status);
// //                         const displayAmount = app.approved_amount ?? app.input_data?.loan?.amount ?? 0;
// //                         const docStatus = app.input_data?.docs_status;

// //                         return (
// //                         <tr key={app.id} className="hover:bg-gray-50">
// //                           <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
// //                           <td className="px-6 py-4">
// //                             <div className="flex items-center gap-2">
// //                                 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>{app.status}</span>
// //                                 {docStatus === 'REQUESTED' && (
// //                                     <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold border border-orange-200 whitespace-nowrap">Docs Req</span>
// //                                 )}
// //                                 {docStatus === 'RECEIVED' && (
// //                                     <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200 whitespace-nowrap">Sent</span>
// //                                 )}
// //                             </div>
// //                           </td>
// //                           <td className="px-6 py-4 font-medium text-gray-900">${displayAmount.toLocaleString()}</td>
// //                           <td className="px-6 py-4 text-right"><Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setDecision(app)}><Eye className="w-3 h-3 mr-1"/> View</Button></td>
// //                         </tr>
// //                     )})}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   /* ---------------- WIZARD FORM ---------------- */
// //   return (
// //     <div className="min-h-screen bg-gray-50 p-8">
// //       <div className="max-w-2xl mx-auto">
// //         {Header}
// //         <div className="bg-white rounded-xl shadow overflow-hidden">
// //           <div className="h-2 bg-gray-100 mb-6"><div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${step * 33.33}%` }} /></div>
// //           <form onSubmit={handleSubmit(onSubmit)} className="p-8">
// //             <h2 className="text-xl font-bold text-gray-900 mb-6">{step === 1 ? 'Identity' : step === 2 ? 'Financials' : 'Loan Details'}</h2>
            
// //             {step === 1 && (
// //               <div className="space-y-4">
// //                 <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
// //                 <Input label="Email" {...register('email')} error={errors.email?.message} />
// //                 <Input label="SSN" {...register('ssn')} error={errors.ssn?.message} placeholder="000-00-0000" />
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
// //                     <select {...register('address_state')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
// //                       <option value="">Select State</option>
// //                       {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
// //                     </select>
// //                     {errors.address_state && <p className="text-red-500 text-sm mt-1">{errors.address_state.message}</p>}
// //                   </div>
// //                   <Input label="ZIP" {...register('zip_code')} error={errors.zip_code?.message} maxLength={5} />
// //                 </div>
// //               </div>
// //             )}

// //             {step === 2 && (
// //               <div className="space-y-4">
// //                 <Input label="Annual Income" type="number" {...register('annual_income', { valueAsNumber: true })} error={errors.annual_income?.message} />
// //                 <Input label="Years Employed" type="number" {...register('emp_length', { valueAsNumber: true })} error={errors.emp_length?.message} />
// //                 <div className="grid grid-cols-2 gap-4">
// //                     <select {...register('home_ownership')} className="border p-2 rounded w-full"><option value="RENT">Rent</option><option value="OWN">Own</option><option value="MORTGAGE">Mortgage</option></select>
// //                     <select {...register('emp_category')} className="border p-2 rounded w-full"><option value="Other">Other</option><option value="Management">Management</option><option value="Healthcare">Healthcare</option></select>
// //                 </div>
// //               </div>
// //             )}

// //             {step === 3 && (
// //               <div className="space-y-4">
// //                 <Input label="Loan Amount" type="number" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
// //                 <Input label="Purpose" {...register('purpose')} error={errors.purpose?.message} />
// //                 <div className="flex gap-4">
// //                     <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value={36} {...register('term', { valueAsNumber: true })} /> 36 Months</label>
// //                     <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value={60} {...register('term', { valueAsNumber: true })} /> 60 Months</label>
// //                 </div>
// //               </div>
// //             )}

// //             <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
// //               {step > 1 ? <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
// //               {step < 3 ? <Button type="button" onClick={nextStep}>Next</Button> : <Button type="submit" isLoading={submitting}>Submit</Button>}
// //             </div>
// //           </form>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// import React, { useEffect, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { api } from '../../lib/api';
// import { supabase } from '../../lib/supabase';
// import { Button } from '../../components/ui/button';
// import { Input } from '../../components/ui/input';
// import { useAuth } from '../auth/AuthProvider';
// import { CheckCircle, AlertTriangle, LogOut, PlusCircle, List, Lock, Eye, XCircle, Check, Clock, Loader2, Upload, FileText } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import CreditScoreWidget from './CreditScoreWidget';

// /* ---------------- CONSTANTS ---------------- */

// const US_STATES = [
//   "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
//   "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", 
//   "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", 
//   "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", 
//   "UT", "VT", "VA", "WA", "WV", "WI", "WY"
// ];

// const EMP_CATEGORIES = [
//   'Management', 'Healthcare', 'Education', 'Sales/Marketing', 
//   'Engineering/IT', 'Trades/Construction', 'Administrative', 
//   'Self-Employed', 'Retired', 'Other',
// ] as const;

// const PURPOSE_OPTIONS = [
//   { value: "debt_consolidation", label: "Debt Consolidation" },
//   { value: "credit_card", label: "Credit Card Refinance" },
//   { value: "home_improvement", label: "Home Improvement" },
//   { value: "major_purchase", label: "Major Purchase" },
//   { value: "medical_expenses", label: "Medical Expenses" },
//   { value: "moving", label: "Moving and Relocation" },
//   { value: "vacation", label: "Vacation" },
//   { value: "car_financing", label: "Car Financing" },
//   { value: "small_business", label: "Business" },
//   { value: "other", label: "Other" }
// ];

// /* ---------------- ZOD SCHEMAS ---------------- */

// const step1Schema = z.object({
//   full_name: z.string().min(2, 'Name required'),
//   email: z.string().email('Invalid email'),
//   ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN'),
//   address_state: z.string().length(2, 'Select a state'),
//   zip_code: z.string().length(5, 'ZIP must be 5 digits'),
// });

// const step2Schema = z.object({
//   annual_income: z.coerce.number().min(10000, 'Income too low'),
//   emp_length: z.coerce.number().min(0).max(40),
//   home_ownership: z.enum(['RENT', 'OWN', 'MORTGAGE']),
//   emp_category: z.enum(EMP_CATEGORIES),
// });

// const step3Schema = z.object({
//   amount: z.coerce.number().min(1000, 'Minimum $1,000'),
//   term: z.coerce.number().refine(v => v === 36 || v === 60, {
//     message: 'Term must be 36 or 60 months',
//   }),
//   purpose: z.string().min(3, "Select a purpose"),
// });

// const finalSchema = step1Schema.merge(step2Schema).merge(step3Schema);
// type FormData = z.infer<typeof finalSchema>;

// /* ---------------- COMPONENT ---------------- */

// export default function ApplicationWizard() {
//   const { signOut } = useAuth();
//   const navigate = useNavigate();

//   const [view, setView] = useState<'list' | 'new' | 'upload'>('list');
//   const [applications, setApplications] = useState<any[]>([]);
//   const [step, setStep] = useState(1);
//   const [decision, setDecision] = useState<any>(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
  
//   // Track upload status per document type
//   const [uploadedState, setUploadedState] = useState({
//       identity: false,
//       income: false
//   });

//   const {
//     register,
//     handleSubmit,
//     trigger,
//     setValue,
//     formState: { errors },
//   } = useForm<FormData>({
//     resolver: zodResolver(finalSchema),
//     mode: 'onChange',
//     defaultValues: {
//       term: 36,
//       home_ownership: 'RENT',
//       emp_length: 0,
//       emp_category: 'Other',
//       purpose: '',
//     },
//   });

//   const fetchApplications = (autoSwitchView = false) => {
//     api.get('/applications/')
//       .then(res => {
//         setApplications(res.data);
//         if (autoSwitchView && res.data.length === 0) {
//           setView('new');
//         }
//       })
//       .catch(console.error);
//   };

//   useEffect(() => {
//     fetchApplications(true);
//     const savedSSN = localStorage.getItem('applicant_ssn');
//     if (savedSSN) setValue('ssn', savedSSN);
//   }, [setValue]);

//   const handleDecisionAction = async (action: 'ACCEPT' | 'DECLINE') => {
//     if (!decision) return;
//     if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this offer?`)) return;

//     setActionLoading(true);
//     const toastId = toast.loading("Processing decision...");

//     try {
//         const endpointAction = action.toLowerCase(); 
//         await api.post(`/applications/${decision.id}/${endpointAction}`);
        
//         const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
//         setDecision((prev: any) => ({ ...prev, status: newStatus }));
//         fetchApplications(); 

//         if (action === 'DECLINE') {
//             setDecision(null);
//             setView('list');
//             toast.success("Offer declined.", { id: toastId });
//         } else {
//              toast.success("Offer accepted successfully!", { id: toastId });
//         }
//     } catch (e) {
//         toast.error("Action failed. Please try again.", { id: toastId });
//     } finally {
//         setActionLoading(false);
//     }
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: 'identity' | 'income') => {
//     if (!event.target.files || event.target.files.length === 0) return;
//     const file = event.target.files[0];
    
//     setUploading(true);
//     const toastId = toast.loading(`Uploading ${docType}...`);

//     try {
//         const fileExt = file.name.split('.').pop();
//         const filePath = `${decision.id}/${docType}_${Math.random().toString(36).substring(7)}.${fileExt}`;

//         const { error: uploadError } = await supabase.storage
//             .from('loan-documents')
//             .upload(filePath, file);

//         if (uploadError) throw uploadError;

//         const { data: { publicUrl } } = supabase.storage
//             .from('loan-documents')
//             .getPublicUrl(filePath);

//         await api.post(`/applications/${decision.id}/documents`, {
//             name: `${docType} - ${file.name}`,
//             url: publicUrl,
//             type: file.type
//         });

//         setUploadedState(prev => ({ ...prev, [docType]: true }));
//         toast.success(`${docType} uploaded successfully.`, { id: toastId });

//     } catch (error: any) {
//         console.error(error);
//         toast.error(`Upload failed: ${error.message}`, { id: toastId });
//     } finally {
//         setUploading(false);
//         event.target.value = '';
//     }
//   };

//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'ACCEPTED':
//       case 'FUNDED': return 'bg-green-100 text-green-800 border border-green-200';
//       case 'OFFERED':
//       case 'APPROVED': return 'bg-blue-100 text-blue-800 border border-blue-200';
//       case 'DECLINED':
//       case 'REJECTED': return 'bg-red-100 text-red-800 border border-red-200';
//       case 'MANUAL_REVIEW': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
//       default: return 'bg-gray-100 text-gray-800 border border-gray-200';
//     }
//   };

//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     const toastId = toast.loading("Submitting application...");
//     try {
//       if (data.ssn) localStorage.setItem('applicant_ssn', data.ssn);
//       const payload = {
//         applicant: {
//           full_name: data.full_name,
//           email: data.email,
//           ssn: data.ssn.replace(/\D/g, ''),
//           annual_income: data.annual_income,
//           emp_length: data.emp_length,
//           home_ownership: data.home_ownership,
//           emp_category: data.emp_category,
//           zip_code: data.zip_code,
//           address_state: (data.address_state || '').toUpperCase(),
//         },
//         loan: {
//           amount: data.amount,
//           term: data.term,
//           purpose: data.purpose,
//         },
//       };
//       const res = await api.post('/applications/', payload);
//       setDecision(res.data);
//       setApplications(prev => [res.data, ...prev]);
//       const outcome = res.data.decision?.outcome;
//       if (outcome === 'APPROVED') {
//           toast.success("Application Pre-Approved!", { id: toastId });
//       } else if (outcome === 'DECLINE') {
//           toast.error("Application Declined.", { id: toastId });
//       } else {
//           toast.info("Application under review.", { id: toastId });
//       }
//     } catch (e) {
//       console.error(e);
//       toast.error('Submission failed. Please try again.', { id: toastId });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const nextStep = async () => {
//     const fields = step === 1 
//         ? ['full_name', 'email', 'ssn', 'address_state', 'zip_code'] 
//         : step === 2 
//         ? ['annual_income', 'emp_length', 'home_ownership', 'emp_category'] 
//         : ['amount', 'term', 'purpose'];
    
//     // @ts-ignore
//     if (await trigger(fields)) setStep(s => s + 1);
//   };

//   const Header = (
//     <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
//       <div><h1 className="text-xl font-bold text-gray-900">Applicant Portal</h1></div>
//       <div className="flex flex-wrap gap-2 items-center justify-center">
//         <CreditScoreWidget />
//         <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
//         <Button variant="outline" onClick={() => { setView('list'); setDecision(null); }}><List className="w-4 h-4 mr-2" /> My Loans</Button>
//         <Button onClick={() => { setView('new'); setDecision(null); setStep(1); }}><PlusCircle className="w-4 h-4 mr-2" /> New Application</Button>
//         <Button variant="outline" onClick={() => navigate('/update-password')}><Lock className="w-4 h-4 mr-2" /> Password</Button>
//         <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
//       </div>
//     </header>
//   );

//   // --- Views ---

//   if (view === 'upload' && decision) {
//       const allDone = uploadedState.identity && uploadedState.income;
//       return (
//         <div className="min-h-screen bg-gray-50 p-8">
//             {Header}
//             <div className="flex justify-center mt-10">
//                 <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
//                     <div className="text-center mb-8">
//                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                             <Upload className="w-8 h-8 text-blue-600" />
//                         </div>
//                         <h2 className="text-2xl font-bold text-gray-900">Upload Requested Documents</h2>
//                         <p className="text-gray-600">Please provide the documents requested by our underwriting team.</p>
//                     </div>
//                     <div className="grid gap-6">
//                         {/* 1. Identity */}
//                         <div className={`border-2 border-dashed rounded-lg p-5 transition-colors ${uploadedState.identity ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
//                             <div className="flex justify-between items-center mb-2">
//                                 <h3 className="font-semibold text-gray-800">1. Proof of Identity</h3>
//                                 {uploadedState.identity && <CheckCircle className="w-5 h-5 text-green-600"/>}
//                             </div>
//                             {uploadedState.identity ? (
//                                 <p className="text-sm text-green-700 font-medium">Upload Complete</p>
//                             ) : (
//                                 <div className="relative group mt-2">
//                                     <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'identity')} disabled={uploading} />
//                                     <div className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-md shadow-sm group-hover:border-blue-400">
//                                         {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-gray-500"/>}
//                                         <span className="text-sm font-medium text-gray-600">Select ID File</span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                         {/* 2. Income */}
//                         <div className={`border-2 border-dashed rounded-lg p-5 transition-colors ${uploadedState.income ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
//                             <div className="flex justify-between items-center mb-2">
//                                 <h3 className="font-semibold text-gray-800">2. Proof of Income</h3>
//                                 {uploadedState.income && <CheckCircle className="w-5 h-5 text-green-600"/>}
//                             </div>
//                             {uploadedState.income ? (
//                                 <p className="text-sm text-green-700 font-medium">Upload Complete</p>
//                             ) : (
//                                 <div className="relative group mt-2">
//                                     <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'income')} disabled={uploading} />
//                                     <div className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-md shadow-sm group-hover:border-blue-400">
//                                         {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4 text-gray-500"/>}
//                                         <span className="text-sm font-medium text-gray-600">Select Paystub/W2</span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                     <div className="mt-8 flex justify-center">
//                         <Button variant={allDone ? "primary" : "outline"} className={`w-full ${allDone ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} onClick={() => setView('list')}>
//                             {allDone ? "Submit & Return to Dashboard" : "I'll do this later"}
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//       );
//   }

//   // --- Reuse existing Decision, List, and Wizard Form views ---
//   if (decision) {
//       const status = decision.status;
//       const outcome = decision.decision?.outcome;
//       const isApprovedState = ['OFFERED', 'ACCEPTED', 'FUNDED', 'APPROVED'].includes(status);
//       const isDeclined = !isApprovedState && (status === 'DECLINED' || status === 'REJECTED' || outcome === 'DECLINE');
//       const isAccepted = status === 'ACCEPTED' || status === 'FUNDED';
//       const isReview = status === 'MANUAL_REVIEW' || outcome === 'MANUAL_REVIEW';
//       const isOffered = status === 'OFFERED' || (outcome === 'APPROVE' && !isAccepted && !isDeclined && !isReview);
//       const isProcessing = status === 'CREATED' || status === 'SUBMITTED' || status === 'SCORED';
//       const docStatus = decision.input_data?.docs_status;
//       const isDocsRequested = docStatus === 'REQUESTED';
//       const isDocsReceived = docStatus === 'RECEIVED';

//       return (
//       <div className="min-h-screen bg-gray-50 p-8">
//         {Header}
//         <div className="flex justify-center mt-10">
//           <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
//             {isProcessing && (
//                <div className="py-10">
//                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4"/>
//                    <h2 className="text-xl font-bold text-gray-800">Processing...</h2>
//                </div>
//             )}
//             {isReview && !isApprovedState && (
//                <div className="py-6">
//                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                        <Clock className="w-8 h-8 text-yellow-600" />
//                    </div>
//                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
//                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded text-yellow-800 text-sm mb-4">
//                        Status: <strong>Pending Review</strong>
//                    </div>
//                    {isDocsRequested && (
//                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mb-4" onClick={() => setView('upload')}>
//                            <Upload className="w-4 h-4"/> Upload Requested Documents
//                        </Button>
//                    )}
//                    {isDocsReceived && (
//                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200 mb-4 flex items-center justify-center gap-2">
//                            <CheckCircle className="w-4 h-4"/> Documents Submitted
//                        </div>
//                    )}
//                </div>
//             )}
//             {isDeclined && (
//               <>
//                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <AlertTriangle className="w-8 h-8 text-red-600" />
//                 </div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                    {decision.decision?.primary_decline_reason ? "Application Declined" : "Offer Declined"}
//                 </h2>
//                 <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 text-sm mt-4">
//                   <strong>Reason:</strong> {decision.decision?.primary_decline_reason || "Offer declined by applicant."}
//                 </div>
//               </>
//             )}
//             {isOffered && (
//               <>
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <CheckCircle className="w-8 h-8 text-green-600" />
//                 </div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Approved!</h2>
//                 <div className="grid grid-cols-2 gap-4 mt-6 mb-6 text-left">
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <p className="text-xs text-gray-500 uppercase">APR</p>
//                     <p className="text-xl font-bold text-gray-900">{decision.economics?.pricing_apr}%</p>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <p className="text-xs text-gray-500 uppercase">Amount</p>
//                     <p className="text-xl font-bold text-gray-900">
//                       ${decision.approved_amount?.toLocaleString() ?? decision.economics?.approved_amount?.toLocaleString() ?? '0'}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex gap-3 mt-6">
//                     <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecisionAction('DECLINE')} disabled={actionLoading}>
//                         <XCircle className="w-4 h-4 mr-2"/> Decline
//                     </Button>
//                     <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecisionAction('ACCEPT')} disabled={actionLoading}>
//                         <Check className="w-4 h-4 mr-2"/> Accept
//                     </Button>
//                 </div>
//               </>
//             )}
//             {isAccepted && (
//                <>
//                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <CheckCircle className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Accepted!</h2>
//                 <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm font-medium">
//                     Loan ID: {decision.id.slice(0, 8)}
//                 </div>
//                </>
//             )}
//             <Button variant="outline" className="w-full mt-6" onClick={() => { setDecision(null); setView('list'); }}>
//               Return to Dashboard
//             </Button>
//           </div>
//         </div>
//       </div>
//       );
//   }

//   if (view === 'list') {
//       return (
//       <div className="min-h-screen bg-gray-50 p-8">
//         <div className="max-w-5xl mx-auto">
//           {Header}
//           <div className="bg-white rounded-lg shadow overflow-hidden">
//             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h2 className="font-semibold text-gray-700">My Applications</h2></div>
//             {applications.length === 0 ? (
//               <div className="p-10 text-center text-gray-500">No applications found. Start a new one!</div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 text-gray-500 font-medium">
//                     <tr>
//                       <th className="px-6 py-3">Date</th>
//                       <th className="px-6 py-3">Status</th>
//                       <th className="px-6 py-3">Amount</th>
//                       <th className="px-6 py-3 text-right">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {applications.map(app => {
//                         const statusStyle = getStatusStyle(app.status);
//                         const displayAmount = app.approved_amount ?? app.input_data?.loan?.amount ?? 0;
//                         const docStatus = app.input_data?.docs_status;
//                         return (
//                         <tr key={app.id} className="hover:bg-gray-50">
//                           <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
//                           <td className="px-6 py-4">
//                             <div className="flex items-center gap-2">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>{app.status}</span>
//                                 {docStatus === 'REQUESTED' && (
//                                     <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold border border-orange-200 whitespace-nowrap">Docs Req</span>
//                                 )}
//                                 {docStatus === 'RECEIVED' && (
//                                     <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200 whitespace-nowrap">Sent</span>
//                                 )}
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 font-medium text-gray-900">${displayAmount.toLocaleString()}</td>
//                           <td className="px-6 py-4 text-right"><Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setDecision(app)}><Eye className="w-3 h-3 mr-1"/> View</Button></td>
//                         </tr>
//                     )})}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       );
//   }

//   // --- WIZARD FORM (Step 1, 2, 3) ---
//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-2xl mx-auto">
//         {Header}
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <div className="h-2 bg-gray-100 mb-6"><div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${step * 33.33}%` }} /></div>
//           <form onSubmit={handleSubmit(onSubmit)} className="p-8">
//             <h2 className="text-xl font-bold text-gray-900 mb-6">{step === 1 ? 'Identity' : step === 2 ? 'Financials' : 'Loan Details'}</h2>
            
//             {step === 1 && (
//               <div className="space-y-4">
//                 <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
//                 <Input label="Email" {...register('email')} error={errors.email?.message} />
//                 <Input label="SSN" {...register('ssn')} error={errors.ssn?.message} placeholder="000-00-0000" />
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
//                     <select {...register('address_state')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
//                       <option value="">Select State</option>
//                       {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
//                     </select>
//                     {errors.address_state && <p className="text-red-500 text-sm mt-1">{errors.address_state.message}</p>}
//                   </div>
//                   <Input label="ZIP" {...register('zip_code')} error={errors.zip_code?.message} maxLength={5} />
//                 </div>
//               </div>
//             )}

//             {step === 2 && (
//               <div className="space-y-4">
//                 <Input label="Annual Income" type="number" {...register('annual_income', { valueAsNumber: true })} error={errors.annual_income?.message} />
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Employment Length</label>
//                   <select {...register('emp_length', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
//                     <option value={0}>Less than 1 year</option>
//                     {[...Array(10)].map((_, i) => (
//                       <option key={i+1} value={i+1}>{i+1} year{i !== 0 ? 's' : ''}</option>
//                     ))}
//                     <option value={10}>10+ years</option>
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
//                     <select {...register('emp_category')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
//                       <option value="">Select</option>
//                       {EMP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
//                     </select>
//                     {errors.emp_category && <p className="text-red-500 text-sm mt-1">{errors.emp_category.message}</p>}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Housing</label>
//                     <select {...register('home_ownership')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
//                       <option value="RENT">Rent</option>
//                       <option value="OWN">Own</option>
//                       <option value="MORTGAGE">Mortgage</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {step === 3 && (
//               <div className="space-y-4">
//                 <Input label="Loan Amount" type="number" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
//                   <select {...register('purpose')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
//                     <option value="">Select Purpose</option>
//                     {PURPOSE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
//                   </select>
//                   {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
//                   <div className="grid grid-cols-2 gap-4">
//                     <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
//                       <input type="radio" value={36} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
//                       <span className="font-medium">36 Months</span>
//                     </label>
//                     <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
//                       <input type="radio" value={60} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
//                       <span className="font-medium">60 Months</span>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
//               {step > 1 ? <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
//               {step < 3 ? <Button type="button" onClick={nextStep}>Next</Button> : <Button type="submit" isLoading={submitting}>Submit</Button>}
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase'; // Added
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../auth/AuthProvider';
import { CheckCircle, AlertTriangle, LogOut, PlusCircle, List, Lock, Eye, XCircle, Check, Clock, Loader2, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Added
import CreditScoreWidget from './CreditScoreWidget';

/* ---------------- CONSTANTS ---------------- */

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", 
  "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", 
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", 
  "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const EMP_CATEGORIES = [
  'Management', 'Healthcare', 'Education', 'Sales/Marketing', 
  'Engineering/IT', 'Trades/Construction', 'Administrative', 
  'Self-Employed', 'Retired', 'Other',
] as const;

const PURPOSE_OPTIONS = [
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "credit_card", label: "Credit Card Refinance" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "major_purchase", label: "Major Purchase" },
  { value: "medical_expenses", label: "Medical Expenses" },
  { value: "moving", label: "Moving and Relocation" },
  { value: "vacation", label: "Vacation" },
  { value: "car_financing", label: "Car Financing" },
  { value: "small_business", label: "Business" },
  { value: "other", label: "Other" }
];

/* ---------------- ZOD SCHEMAS ---------------- */

const step1Schema = z.object({
  full_name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN'),
  address_state: z.string().length(2, 'Select a state'),
  zip_code: z.string().length(5, 'ZIP must be 5 digits'),
});

const step2Schema = z.object({
  annual_income: z.coerce.number().min(10000, 'Income too low'),
  emp_length: z.coerce.number().min(0).max(40),
  home_ownership: z.enum(['RENT', 'OWN', 'MORTGAGE']),
  emp_category: z.enum(EMP_CATEGORIES),
});

const step3Schema = z.object({
  amount: z.coerce.number().min(1000, 'Minimum $1,000'),
  term: z.coerce.number().refine(v => v === 36 || v === 60, {
    message: 'Term must be 36 or 60 months',
  }),
  purpose: z.string().min(3, "Select a purpose"),
});

const finalSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormData = z.infer<typeof finalSchema>;

/* ---------------- COMPONENT ---------------- */

export default function ApplicationWizard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<'list' | 'new' | 'upload'>('list');
  const [applications, setApplications] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Track upload status
  const [uploadedState, setUploadedState] = useState({
      identity: false,
      income: false
  });

  /* ---------------- FORM ---------------- */

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(finalSchema),
    mode: 'onChange',
    defaultValues: {
      term: 36,
      home_ownership: 'RENT',
      emp_length: 0,
      emp_category: 'Other',
      purpose: '',
    },
  });

  /* ---------------- LOAD DATA & AUTOFILL ---------------- */

  const fetchApplications = (autoSwitchView = false) => {
    api.get('/applications/')
      .then(res => {
        setApplications(res.data);
        if (autoSwitchView && res.data.length === 0) {
          setView('new');
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchApplications(true);
    const savedSSN = localStorage.getItem('applicant_ssn');
    if (savedSSN) setValue('ssn', savedSSN);
  }, [setValue]);

  /* ---------------- ACTIONS ---------------- */

  const handleDecisionAction = async (action: 'ACCEPT' | 'DECLINE') => {
    if (!decision) return;
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this offer?`)) return;

    setActionLoading(true);
    const toastId = toast.loading("Processing decision...");

    try {
        const endpointAction = action.toLowerCase(); 
        await api.post(`/applications/${decision.id}/${endpointAction}`);
        
        const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
        setDecision((prev: any) => ({ ...prev, status: newStatus }));
        fetchApplications(); 

        if (action === 'DECLINE') {
            setDecision(null);
            setView('list');
            toast.success("Offer declined.", { id: toastId });
        } else {
             toast.success("Offer accepted successfully!", { id: toastId });
        }
    } catch (e) {
        toast.error("Action failed. Please try again.", { id: toastId });
    } finally {
        setActionLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: 'identity' | 'income') => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    
    setUploading(true);
    const toastId = toast.loading(`Uploading ${docType}...`);

    try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${decision.id}/${docType}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('loan-documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('loan-documents')
            .getPublicUrl(filePath);

        // 3. Save Metadata to Backend
        await api.post(`/applications/${decision.id}/documents`, {
            name: `${docType} - ${file.name}`,
            url: publicUrl,
            type: file.type
        });

        // 4. Update Local State (Optimistic)
        const updatedDecision = {
            ...decision,
            input_data: { 
                ...decision.input_data, 
                docs_status: 'RECEIVED' 
            }
        };
        setDecision(updatedDecision);
        
        // Mark specific doc as done
        setUploadedState(prev => ({ ...prev, [docType]: true }));

        toast.success(`${docType} uploaded successfully.`, { id: toastId });

    } catch (error: any) {
        console.error(error);
        toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
        setUploading(false);
        event.target.value = '';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'FUNDED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'OFFERED':
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DECLINED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'MANUAL_REVIEW':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const toastId = toast.loading("Submitting application...");

    try {
      if (data.ssn) localStorage.setItem('applicant_ssn', data.ssn);

      const payload = {
        applicant: {
          full_name: data.full_name,
          email: data.email,
          ssn: data.ssn.replace(/\D/g, ''),
          annual_income: data.annual_income,
          emp_length: data.emp_length,
          home_ownership: data.home_ownership,
          emp_category: data.emp_category,
          zip_code: data.zip_code,
          address_state: (data.address_state || '').toUpperCase(),
        },
        loan: {
          amount: data.amount,
          term: data.term,
          purpose: data.purpose,
        },
      };

      const res = await api.post('/applications/', payload);
      setDecision(res.data);
      setApplications(prev => [res.data, ...prev]);
      
      const outcome = res.data.decision?.outcome;
      if (outcome === 'APPROVED') {
          toast.success("Application Pre-Approved!", { id: toastId });
      } else if (outcome === 'DECLINE') {
          toast.error("Application Declined.", { id: toastId });
      } else {
          toast.info("Application under review.", { id: toastId });
      }

    } catch (e) {
      console.error(e);
      toast.error('Submission failed. Please try again.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = step === 1 
        ? ['full_name', 'email', 'ssn', 'address_state', 'zip_code'] 
        : step === 2 
        ? ['annual_income', 'emp_length', 'home_ownership', 'emp_category'] 
        : ['amount', 'term', 'purpose'];
        
    // @ts-ignore
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  /* ---------------- HEADER ---------------- */

  const Header = (
    <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
      <div><h1 className="text-xl font-bold text-gray-900">Applicant Portal</h1></div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        <CreditScoreWidget />
        <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
        <Button variant="outline" onClick={() => { setView('list'); setDecision(null); }}><List className="w-4 h-4 mr-2" /> My Loans</Button>
        <Button onClick={() => { setView('new'); setDecision(null); setStep(1); }}><PlusCircle className="w-4 h-4 mr-2" /> New Application</Button>
        <Button variant="outline" onClick={() => navigate('/update-password')}><Lock className="w-4 h-4 mr-2" /> Password</Button>
        <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </div>
    </header>
  );

  /* ---------------- UPLOAD DOCUMENTS VIEW ---------------- */

  if (view === 'upload' && decision) {
      const allDone = uploadedState.identity && uploadedState.income;
      return (
        <div className="min-h-screen bg-gray-50 p-8">
            {Header}
            <div className="flex justify-center mt-10">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Upload Requested Documents</h2>
                        <p className="text-gray-600">Please provide the documents requested by our underwriting team.</p>
                    </div>
                    
                    <div className="grid gap-6">
                        {/* 1. Identity */}
                        <div className={`border-2 border-dashed rounded-lg p-5 transition-colors ${uploadedState.identity ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-800">1. Proof of Identity</h3>
                                {uploadedState.identity && <CheckCircle className="w-5 h-5 text-green-600"/>}
                            </div>
                            
                            {uploadedState.identity ? (
                                <p className="text-sm text-green-700 font-medium">Upload Complete</p>
                            ) : (
                                <div className="relative group mt-2">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'identity')}
                                        disabled={uploading}
                                    />
                                    <div className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-md shadow-sm group-hover:border-blue-400">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-gray-500"/>}
                                        <span className="text-sm font-medium text-gray-600">Select ID File</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Income */}
                        <div className={`border-2 border-dashed rounded-lg p-5 transition-colors ${uploadedState.income ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-800">2. Proof of Income</h3>
                                {uploadedState.income && <CheckCircle className="w-5 h-5 text-green-600"/>}
                            </div>
                            
                            {uploadedState.income ? (
                                <p className="text-sm text-green-700 font-medium">Upload Complete</p>
                            ) : (
                                <div className="relative group mt-2">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'income')}
                                        disabled={uploading}
                                    />
                                    <div className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-md shadow-sm group-hover:border-blue-400">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4 text-gray-500"/>}
                                        <span className="text-sm font-medium text-gray-600">Select Paystub/W2</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Button 
                            variant={allDone ? "primary" : "outline"} 
                            className={`w-full ${allDone ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                            onClick={() => setView('list')}
                        >
                            {allDone ? "Submit & Return to Dashboard" : "I'll do this later"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  /* ---------------- DECISION VIEW ---------------- */

  if (decision) {
    const status = decision.status;
    const outcome = decision.decision?.outcome;

    const isApprovedState = ['OFFERED', 'ACCEPTED', 'FUNDED', 'APPROVED'].includes(status);
    const isDeclined = !isApprovedState && (status === 'DECLINED' || status === 'REJECTED' || outcome === 'DECLINE');
    const isAccepted = status === 'ACCEPTED' || status === 'FUNDED';
    const isReview = status === 'MANUAL_REVIEW' || outcome === 'MANUAL_REVIEW';
    const isOffered = status === 'OFFERED' || (outcome === 'APPROVE' && !isAccepted && !isDeclined && !isReview);
    const isProcessing = status === 'CREATED' || status === 'SUBMITTED' || status === 'SCORED';

    // Document Status
    const docStatus = decision.input_data?.docs_status;
    const isDocsRequested = docStatus === 'REQUESTED';
    const isDocsReceived = docStatus === 'RECEIVED';

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        {Header}
        <div className="flex justify-center mt-10">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
            
            {/* --- STATE: PROCESSING --- */}
            {isProcessing && (
               <div className="py-10">
                   <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4"/>
                   <h2 className="text-xl font-bold text-gray-800">Processing Application...</h2>
                   <p className="text-gray-500 mt-2">Analyzing credit profile and eligibility.</p>
               </div>
            )}

            {/* --- STATE: MANUAL REVIEW --- */}
            {isReview && !isApprovedState && (
               <div className="py-6">
                   <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Clock className="w-8 h-8 text-yellow-600" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
                   <p className="text-gray-600 mb-4">
                       Your application requires manual review. We will notify you shortly.
                   </p>
                   <div className="bg-yellow-50 border border-yellow-100 p-3 rounded text-yellow-800 text-sm mb-4">
                       Status: <strong>Pending Review</strong>
                   </div>

                   {/* Docs Requested Button */}
                   {isDocsRequested && (
                       <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mb-4" onClick={() => setView('upload')}>
                           <Upload className="w-4 h-4"/> Upload Requested Documents
                       </Button>
                   )}
                   {isDocsReceived && (
                       <div className="p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200 mb-4 flex items-center justify-center gap-2">
                           <CheckCircle className="w-4 h-4"/> Documents Submitted
                       </div>
                   )}
               </div>
            )}

            {/* --- STATE: DECLINED --- */}
            {isDeclined && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                   {decision.decision?.primary_decline_reason ? "Application Declined" : "Offer Declined"}
                </h2>
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 text-sm mt-4">
                  <strong>Reason:</strong> {decision.decision?.primary_decline_reason || "Offer declined by applicant."}
                </div>

                {/* ADDED: Upload Button for Declined Apps (Appeal Logic) */}
                {isDocsRequested && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-2">The underwriter has requested documents for review:</p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2" onClick={() => setView('upload')}>
                            <Upload className="w-4 h-4"/> Upload Appeal Documents
                        </Button>
                    </div>
                )}
                {isDocsReceived && (
                    <div className="mt-6 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4"/> Documents Submitted for Appeal
                    </div>
                )}
              </>
            )}

            {/* --- STATE: OFFERED (PRE-APPROVED) --- */}
            {isOffered && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Approved!</h2>
                <div className="grid grid-cols-2 gap-4 mt-6 mb-6 text-left">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">APR</p>
                    <p className="text-xl font-bold text-gray-900">{decision.economics?.pricing_apr}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${decision.approved_amount?.toLocaleString() ?? decision.economics?.approved_amount?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecisionAction('DECLINE')} disabled={actionLoading}>
                        <XCircle className="w-4 h-4 mr-2"/> Decline
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecisionAction('ACCEPT')} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-2"/> Accept
                    </Button>
                </div>
              </>
            )}

            {/* --- STATE: ACCEPTED --- */}
            {isAccepted && (
               <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Accepted!</h2>
                <p className="text-gray-600 mb-4">Your funds are being processed.</p>
                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm font-medium">
                    Loan ID: {decision.id.slice(0, 8)}
                </div>
               </>
            )}

            <Button variant="outline" className="w-full mt-6" onClick={() => { setDecision(null); setView('list'); }}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- LIST VIEW ---------------- */

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {Header}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h2 className="font-semibold text-gray-700">My Applications</h2></div>
            {applications.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No applications found. Start a new one!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map(app => {
                        const statusStyle = getStatusStyle(app.status);
                        const displayAmount = app.approved_amount ?? app.input_data?.loan?.amount ?? 0;
                        const docStatus = app.input_data?.docs_status;

                        return (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>{app.status}</span>
                                {docStatus === 'REQUESTED' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold border border-orange-200 whitespace-nowrap">Docs Req</span>
                                )}
                                {docStatus === 'RECEIVED' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200 whitespace-nowrap">Sent</span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">${displayAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right"><Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setDecision(app)}><Eye className="w-3 h-3 mr-1"/> View</Button></td>
                        </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- WIZARD FORM ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {Header}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="h-2 bg-gray-100 mb-6"><div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${step * 33.33}%` }} /></div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{step === 1 ? 'Identity' : step === 2 ? 'Financials' : 'Loan Details'}</h2>
            
            {step === 1 && (
              <div className="space-y-4">
                <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
                <Input label="Email" {...register('email')} error={errors.email?.message} />
                <Input label="SSN" {...register('ssn')} error={errors.ssn?.message} placeholder="000-00-0000" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select {...register('address_state')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                      <option value="">Select State</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.address_state && <p className="text-red-500 text-sm mt-1">{errors.address_state.message}</p>}
                  </div>
                  <Input label="ZIP" {...register('zip_code')} error={errors.zip_code?.message} maxLength={5} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Input label="Annual Income" type="number" {...register('annual_income', { valueAsNumber: true })} error={errors.annual_income?.message} />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Length</label>
                  <select {...register('emp_length', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                    <option value={0}>Less than 1 year</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} year{i !== 0 ? 's' : ''}</option>
                    ))}
                    <option value={10}>10+ years</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select {...register('emp_category')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                      <option value="">Select</option>
                      {EMP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.emp_category && <p className="text-red-500 text-sm mt-1">{errors.emp_category.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Housing</label>
                    <select {...register('home_ownership')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                      <option value="RENT">Rent</option>
                      <option value="OWN">Own</option>
                      <option value="MORTGAGE">Mortgage</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Input label="Loan Amount" type="number" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <select {...register('purpose')} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                    <option value="">Select Purpose</option>
                    {PURPOSE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                      <input type="radio" value={36} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
                      <span className="font-medium">36 Months</span>
                    </label>
                    <label className="flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                      <input type="radio" value={60} {...register('term', { valueAsNumber: true })} className="accent-brand-600" /> 
                      <span className="font-medium">60 Months</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
              {step > 1 ? <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
              {step < 3 ? <Button type="button" onClick={nextStep}>Next</Button> : <Button type="submit" isLoading={submitting}>Submit</Button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}