
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, Users, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { TierDistributionChart, VolumeTrendChart, ScoreDistributionChart, StateDistributionChart, ConversionFunnelChart } from './dashboard/Charts';
import { PolicyCard } from './dashboard/PolicyCard';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [tiers, setTiers] = useState<any>({});
  
  const [metrics, setMetrics] = useState({
    offeredVol: 0,
    acceptedVol: 0,
    fundedVol: 0,
    expectedRoi: 0,
    avgScore: 0,
    volumeTrend: [] as any[],
    scoreDist: [] as any[],
    stateDist: [] as any[],
    funnelData: [] as any[]
  });

  useEffect(() => {
    // 1. Fetch Overview & Tiers
    api.get('/portfolio/overview').then(res => setStats(res.data)).catch(console.error);
    api.get('/portfolio/tiers').then(res => setTiers(res.data)).catch(console.error);

    // 2. Fetch Activity for detailed calcs
    api.get('/portfolio/activity?limit=1000').then(res => {
        const apps = res.data;
        
        let offered = 0;
        let accepted = 0; // Distinct from funded
        let funded = 0;
        
        let totalEv = 0;
        let totalFundedLoanAmt = 0;
        let totalScore = 0;
        let scoreCount = 0;

        const dailyStats: Record<string, { apps: number, funded: number }> = {};
        const stateCounts: Record<string, number> = {};
        const scoreBuckets = { '<600': 0, '600-660': 0, '660-720': 0, '720-780': 0, '>780': 0 };
        const funnelCounts = { CREATED: 0, SUBMITTED: 0, OFFERED: 0, FUNDED: 0 };

        apps.forEach((app: any) => {
            const amt = app.approved_amount || app.input_data?.loan?.amount || 0;
            const status = app.status;
            const dateKey = new Date(app.created_at).toISOString().split('T')[0];
            const state = app.input_data?.applicant?.address_state || 'Unknown';
            
            if (!dailyStats[dateKey]) dailyStats[dateKey] = { apps: 0, funded: 0 };
            dailyStats[dateKey].apps += 1;
            
            stateCounts[state] = (stateCounts[state] || 0) + 1;

            // --- Funnel Logic ---
            funnelCounts.CREATED += 1;
            if (status !== 'CREATED') funnelCounts.SUBMITTED += 1;

            // Offered: Any state >= OFFERED
            if (['OFFERED', 'ACCEPTED', 'FUNDED', 'ACTIVE', 'CLOSED'].includes(status) || app.decision?.outcome === 'APPROVED') {
                funnelCounts.OFFERED += 1;
                offered += amt;
            }
            
            // Accepted: Any state >= ACCEPTED
            if (['ACCEPTED', 'FUNDED', 'ACTIVE', 'CLOSED'].includes(status)) {
                accepted += amt;
            }

            // Funded: Only strictly funded states
            if (['FUNDED', 'ACTIVE', 'CLOSED'].includes(status)) {
                funnelCounts.FUNDED += 1;
                funded += amt;
                dailyStats[dateKey].funded += amt;
                
                // ROI calc: EV sum only for funded loans
                // Check if EV exists to avoid NaN
                const ev = app.economics?.expected_value ?? app.expected_value ?? 0;
                totalEv += ev;
                totalFundedLoanAmt += amt;
            }

            // Scores
            const score = app.risk_profile?.credit_score || app.credit_score;
            if (score) {
                totalScore += score;
                scoreCount++;
                if (score < 600) scoreBuckets['<600']++;
                else if (score < 660) scoreBuckets['600-660']++;
                else if (score < 720) scoreBuckets['660-720']++;
                else if (score < 780) scoreBuckets['720-780']++;
                else scoreBuckets['>780']++;
            }
        });

        // ROI Calculation (Weighted Average)
        const roi = totalFundedLoanAmt > 0 ? (totalEv / totalFundedLoanAmt) * 100 : 0;
        const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

        const trendData = Object.entries(dailyStats)
            .map(([date, val]) => ({ date, applications: val.apps, funded_volume: val.funded }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-14);

        const scoreDistData = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }));
        const stateDistData = Object.entries(stateCounts)
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const funnelData = [
            { stage: 'Started', count: funnelCounts.CREATED, fill: '#94A3B8' },
            { stage: 'Submitted', count: funnelCounts.SUBMITTED, fill: '#64748B' },
            { stage: 'Approved', count: funnelCounts.OFFERED, fill: '#3B82F6' },
            { stage: 'Funded', count: funnelCounts.FUNDED, fill: '#10B981' }
        ];

        setMetrics({
            offeredVol: offered,
            acceptedVol: accepted,
            fundedVol: funded,
            expectedRoi: roi,
            avgScore: avgScore,
            volumeTrend: trendData,
            scoreDist: scoreDistData,
            stateDist: stateDistData,
            funnelData: funnelData
        });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Command Center</h1>
          <p className="text-sm text-gray-500">Admin: {user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/create-user')}>
            <Users className="w-4 h-4 mr-2"/>Create Staff
          </Button>
          <Button variant="outline" onClick={() => navigate('/update-password')}>
            <Lock className="w-4 h-4 mr-2"/>Password
          </Button>
          <Button variant="secondary" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2"/>Sign Out
          </Button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total_applications || 0}</p>
             </div>
             <Activity className="w-6 h-6 text-blue-100" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 font-medium">Approval Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.approval_rate}%</p>
             </div>
             <TrendingUp className="w-6 h-6 text-purple-100" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 font-medium">Expected ROI</p>
                <p className="text-3xl font-bold text-green-600">{metrics.expectedRoi.toFixed(2)}%</p>
                <p className="text-xs text-gray-400 mt-1">Projected on Funded</p>
             </div>
             <DollarSign className="w-6 h-6 text-green-100" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-500">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 font-medium">Avg Credit Score</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.avgScore}</p>
             </div>
             <div className="p-3 bg-gray-100 rounded-full text-gray-600 text-sm font-bold">FICO</div>
           </div>
        </div>
      </div>

      {/* Trends & Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Volume Trends (14 Days)</h2>
             <VolumeTrendChart data={metrics.volumeTrend} />
          </div>
          <div className="lg:col-span-1">
             <PolicyCard />
          </div>
      </div>

      {/* Distributions & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Risk Tier Distribution</h2>
             <TierDistributionChart data={tiers} />
          </div>
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Credit Score Bands</h2>
             <ScoreDistributionChart data={metrics.scoreDist} />
          </div>
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h2>
             <ConversionFunnelChart data={metrics.funnelData} />
          </div>
      </div>

      {/* Geo & Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Top 5 States</h2>
             <StateDistributionChart data={metrics.stateDist} />
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
             <div>
                 <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Performance</h2>
                 <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Offered</p>
                        <p className="text-2xl font-bold text-gray-800">${metrics.offeredVol.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-2">Accepted</p>
                        <p className="text-2xl font-bold text-blue-700">${metrics.acceptedVol.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider mb-2">Funded</p>
                        <p className="text-2xl font-bold text-green-700">${metrics.fundedVol.toLocaleString()}</p>
                    </div>
                 </div>
             </div>
             <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <Button onClick={() => navigate('/underwriter')} className="bg-brand-600 hover:bg-brand-700">
                    Open Underwriter Queue →
                </Button>
             </div>
          </div>
      </div>
    </div>
  );
}