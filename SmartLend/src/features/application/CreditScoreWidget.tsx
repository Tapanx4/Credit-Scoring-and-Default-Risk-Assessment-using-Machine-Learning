// import React, { useState } from 'react';
// import { api } from '../../lib/api';
// import { Button } from '../../components/ui/button';
// import { Gauge, Loader2, Eye, EyeOff } from 'lucide-react';
// import { Input } from '../../components/ui/input';

// export default function CreditScoreWidget() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [score, setScore] = useState<number | null>(null);
//   const [ssn, setSsn] = useState(localStorage.getItem('applicant_ssn') || '');
//   const [showInput, setShowInput] = useState(false);

//   const checkScore = async () => {
//     if (!ssn) {
//         setShowInput(true);
//         return;
//     }
    
//     setLoading(true);
//     try {
//       // Clean SSN before sending
//       const cleanSsn = ssn.replace(/\D/g, '');
//       const res = await api.post('/scoring/peek', { ssn: cleanSsn });
//       setScore(res.data.fico);
//       // Save for future auto-fill if manually entered
//       localStorage.setItem('applicant_ssn', ssn);
//     } catch (e) {
//       console.error(e);
//       alert("Failed to fetch score. Please check the SSN.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative group">
//       <Button 
//         variant="outline" 
//         className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50"
//         onMouseEnter={() => {
//             // Optional: Auto-fetch on hover if we have SSN? 
//             // Better to wait for click to avoid spamming API.
//             setIsOpen(true);
//         }}
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <Gauge className="w-4 h-4" />
//         {score ? `FICO: ${score}` : "Check My Score"}
//       </Button>

//       {/* Popover / Tooltip Area */}
//       {isOpen && (
//         <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200">
//             <div className="flex justify-between items-start mb-2">
//                 <h3 className="font-bold text-gray-800">Credit Score Simulator</h3>
//                 <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
//             </div>
            
//             {!score ? (
//                 <div className="space-y-3">
//                     <p className="text-xs text-gray-500">
//                         Enter your SSN to instantly check your projected FICO score using our bureau simulator.
//                     </p>
                    
//                     {(!localStorage.getItem('applicant_ssn') || showInput) ? (
//                         <Input 
//                             value={ssn} 
//                             onChange={(e) => setSsn(e.target.value)} 
//                             placeholder="000-00-0000"
//                             className="text-sm"
//                         />
//                     ) : (
//                         <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm text-gray-600">
//                             <span>SSN: •••-••-{ssn.slice(-4)}</span>
//                             <button onClick={() => setShowInput(true)} className="text-xs text-brand-600 hover:underline">Change</button>
//                         </div>
//                     )}

//                     <Button className="w-full h-8 text-xs" onClick={checkScore} isLoading={loading}>
//                         Reveal Score
//                     </Button>
//                 </div>
//             ) : (
//                 <div className="text-center py-2">
//                     <div className="text-4xl font-bold text-brand-600 mb-1">{score}</div>
//                     <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
//                         {score >= 720 ? "Excellent" : score >= 680 ? "Good" : "Fair"}
//                     </p>
//                     <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
//                         <div 
//                             className={`h-2 rounded-full ${score >= 700 ? 'bg-green-500' : 'bg-yellow-500'}`} 
//                             style={{ width: `${(score - 300) / 5.5}%` }}
//                         ></div>
//                     </div>
//                     <Button variant="ghost" className="mt-2 h-6 text-xs w-full" onClick={() => setScore(null)}>Check Another</Button>
//                 </div>
//             )}
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Gauge } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useAuth } from '../auth/AuthProvider';

export default function CreditScoreWidget() {
  const { user } = useAuth(); // Get current user
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Storage key is now unique to this user
  const storageKey = user ? `applicant_ssn_${user.id}` : null;
  
  const [ssn, setSsn] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Load SSN only when user is available and widget opens
  useEffect(() => {
    if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) setSsn(saved);
    } else {
        setSsn(''); // Clear if no user (logged out)
    }
  }, [storageKey]);

  const checkScore = async () => {
    if (!ssn) {
        setShowInput(true);
        return;
    }
    
    setLoading(true);
    try {
      const cleanSsn = ssn.replace(/\D/g, '');
      const res = await api.post('/scoring/peek', { ssn: cleanSsn });
      setScore(res.data.fico);
      
      // Save specifically for this user
      if (storageKey) localStorage.setItem(storageKey, ssn);
      
    } catch (e) {
      console.error(e);
      alert("Failed to fetch score. Please check the SSN.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Don't show if not logged in

  return (
    <div className="relative group">
      <Button 
        variant="outline" 
        className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Gauge className="w-4 h-4" />
        {score ? `FICO: ${score}` : "Check Score"}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200" onMouseLeave={() => setIsOpen(false)}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">Credit Simulator</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            {!score ? (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                        Enter your SSN to simulate your bureau pull.
                    </p>
                    
                    {(!ssn || showInput) ? (
                        <Input 
                            value={ssn} 
                            onChange={(e) => setSsn(e.target.value)} 
                            placeholder="000-00-0000"
                            className="text-sm"
                        />
                    ) : (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm text-gray-600">
                            <span>SSN: •••-••-{ssn.slice(-4)}</span>
                            <button onClick={() => setShowInput(true)} className="text-xs text-brand-600 hover:underline">Change</button>
                        </div>
                    )}

                    <Button className="w-full h-8 text-xs" onClick={checkScore} isLoading={loading}>
                        Reveal Score
                    </Button>
                </div>
            ) : (
                <div className="text-center py-2">
                    <div className="text-4xl font-bold text-brand-600 mb-1">{score}</div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                        {score >= 720 ? "Excellent" : score >= 680 ? "Good" : "Fair"}
                    </p>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${score >= 700 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${(score - 300) / 5.5}%` }}
                        ></div>
                    </div>
                    <Button variant="ghost" className="mt-2 h-6 text-xs w-full" onClick={() => setScore(null)}>Reset</Button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}