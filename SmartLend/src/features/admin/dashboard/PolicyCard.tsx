
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { ShieldCheck, AlertTriangle, Layers } from 'lucide-react';

export const PolicyCard = () => {
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    api.get('/policies/current')
       .then(res => setPolicy(res.data))
       .catch(err => console.error("Failed to load policy", err));
  }, []);

  if (!policy) return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
                <div className="h-4 w-36 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
      </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-600"/> Active Policy
        </h3>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded border border-blue-100">
          {policy.policy_id}
        </span>
      </div>
      
      <div className="space-y-5">
        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-sm text-gray-500">Max Risk Cap (PD)</span>
          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
            {(policy.thresholds.max_pd_cutoff * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-sm text-gray-500">Min Profit Floor (EV)</span>
          <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
            ${policy.thresholds.min_profit_buffer}
          </span>
        </div>
        
        <div className="flex justify-between items-center pb-1">
          <span className="text-sm text-gray-500">Stress Test LGD</span>
          <span className="font-bold text-gray-900 flex items-center gap-1">
            <Layers className="w-3 h-3 text-gray-400"/>
            {(policy.thresholds.lgd_assumption + 0.2).toFixed(2)} 
            <span className="text-xs text-gray-400 font-normal">(Base + 20%)</span>
          </span>
        </div>
        
        <div className="mt-6 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex gap-2 items-start">
           <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
           <span className="leading-relaxed">{policy.description}</span>
        </div>
      </div>
    </div>
  );
};