
import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Professional Palette: Emerald (Safe), Blue (Prime), Amber (Review), Red (Reject), Violet (Override)
const COLORS_MAP: Record<string, string> = {
  'Super Prime': '#10B981', // Emerald-500
  'Prime': '#3B82F6',       // Blue-500
  'Manual Review': '#F59E0B', // Amber-500
  'Auto-Decline': '#EF4444',  // Red-500
  'Override': '#8B5CF6'       // Violet-500
};

export const TierDistributionChart = ({ data }: { data: Record<string, number> }) => {
  // 1. Group Raw Tiers into Business Categories
  const groups = {
    'Super Prime': (data['A_AutoApprove_Prime'] || 0) + (data['TIER_AA'] || 0),
    'Prime': (data['B_AutoApprove_NearPrime'] || 0) + (data['TIER_AB'] || 0),
    'Manual Review': (data['M1_ManualReview_EV_Positive'] || 0) + (data['M2_ManualReview_EV_Marginal'] || 0) + (data['TIER_M1'] || 0) + (data['TIER_M2'] || 0),
    'Auto-Decline': (data['R1_Reject_HighRisk'] || 0) + (data['R2_Reject_NegativeEV'] || 0) + (data['R3_Reject_Policy'] || 0) + (data['TIER_R1'] || 0) + (data['TIER_R2'] || 0) + (data['TIER_R3'] || 0),
    'Override': (data['Manual_Override'] || 0) + (data['TIER_MANUAL_OVERRIDE'] || 0)
  };

  // 2. Format for Recharts
  const chartData = Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0); // Hide empty slices

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col justify-center items-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p className="text-sm">No tier data available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#94A3B8'} strokeWidth={1} />
            ))}
          </Pie>
          <ReTooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${value} Apps`, 'Count']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-sm font-medium text-gray-600 ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const VolumeTrendChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <EmptyState label="No volume data" />;

  return (
    <div className="h-80 w-full flex justify-center items-center overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#64748B', fontSize: 12}} 
            dy={10}
            tickFormatter={(str) => {
                const date = new Date(str);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#0F172A', fontSize: 12}} unit="$" />
          <ReTooltip 
            cursor={{fill: '#F8FAFC'}}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar yAxisId="left" dataKey="applications" name="Applications" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar yAxisId="right" dataKey="funded_volume" name="Funded Volume ($)" fill="#0F172A" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- NEW CHARTS ---

export const ScoreDistributionChart = ({ data }: { data: { range: string, count: number }[] }) => {
  if (!data || data.length === 0) return <EmptyState label="No score data" />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
          <ReTooltip
            cursor={{fill: '#F8FAFC'}}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
          />
          <Bar dataKey="count" name="Applicants" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StateDistributionChart = ({ data }: { data: { state: string, count: number }[] }) => {
  if (!data || data.length === 0) return <EmptyState label="No geo data" />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" hide />
          <YAxis dataKey="state" type="category" width={30} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} />
          <ReTooltip
            cursor={{fill: '#F8FAFC'}}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
          />
          <Bar dataKey="count" name="Applicants" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ConversionFunnelChart = ({ data }: { data: { stage: string, count: number, fill: string }[] }) => {
    if (!data || data.length === 0) return <EmptyState label="No funnel data" />;
    
    return (
        <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                    <YAxis hide />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <ReTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
             </ResponsiveContainer>
        </div>
    )
}

const EmptyState = ({ label }: { label: string }) => (
  <div className="h-64 w-full flex flex-col justify-center items-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
    <p className="text-sm">{label}</p>
  </div>
);