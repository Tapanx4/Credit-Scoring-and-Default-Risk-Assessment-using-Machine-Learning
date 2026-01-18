
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, LayoutDashboard, Search, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';

export default function UnderwriterDashboard() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [queue, setQueue] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const [filter, setFilter] = useState<'ALL' | 'MANUAL_REVIEW' | 'DECLINED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search input to avoid API spam
  const [debouncedSearch] = useDebounce(searchTerm, 600);

  // --- FETCH DATA ---
  const fetchQueue = (searchQuery = '', pageNum = 1) => {
    setLoading(true);
    const offset = (pageNum - 1) * PAGE_SIZE;

    const params = new URLSearchParams();
    params.append('limit', PAGE_SIZE.toString());
    params.append('offset', offset.toString());
    if (searchQuery) params.append('search', searchQuery);
    
    api.get(`/portfolio/activity?${params.toString()}`)
       .then(res => {
         const data = res.data;
         
         let items = [];
         let total = 0;

         if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
             items = data.items;
             total = data.total || 0;
         } else if (Array.isArray(data)) {
             items = data;
             total = data.length;
         }
         
         setQueue(items);
         setTotalItems(total);
         setPage(pageNum);
       })
       .catch(err => {
           console.error("Failed to fetch queue:", err);
           setQueue([]);
       })
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue(debouncedSearch, 1);
  }, [debouncedSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        fetchQueue(searchTerm, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    fetchQueue(searchTerm, newPage);
  };

  // --- ACTIONS ---
  const handleFund = async (appId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click
      if (!window.confirm("Confirm funding for this loan? This action is irreversible.")) return;
      
      setActionLoading(appId);
      const toastId = toast.loading("Processing disbursement...");
      
      try {
          await api.post(`/applications/${appId}/fund`);
          toast.success("Loan funded successfully!", { id: toastId });
          fetchQueue(searchTerm, page); // Refresh list
      } catch (err: any) {
          const msg = err.response?.data?.detail;
          const displayMsg = typeof msg === 'object' ? JSON.stringify(msg) : (msg || "Fund failed");
          toast.error(displayMsg, { id: toastId });
      } finally {
          setActionLoading(null);
      }
  };

  // --- FILTERING ---
  const filteredQueue = queue.filter(app => {
    if (app.status === 'CREATED') return false;
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Underwriter Queue</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            Staff: {user?.email} 
            <span className="uppercase text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-bold">
              {role}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
            {role === 'admin' && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100">
                    <LayoutDashboard className="w-4 h-4 mr-2"/> Admin Dashboard
                </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/update-password')}>
                <Lock className="w-4 h-4 mr-2"/>Password
            </Button>
            <Button variant="secondary" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2"/>Sign Out
            </Button>
        </div>
      </header>

      {/* --- CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2">
            {['ALL', 'MANUAL_REVIEW', 'DECLINED'].map((f) => (
                <Button 
                    key={f}
                    variant={filter === f ? 'primary' : 'outline'} 
                    onClick={() => setFilter(f as any)}
                    className={filter === f && f === 'DECLINED' ? 'bg-red-600 hover:bg-red-700 text-white' : 
                               filter === f && f === 'MANUAL_REVIEW' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                >
                    {f.replace('_', ' ')}
                </Button>
            ))}
          </div>
          
          <div className="relative flex gap-2 w-full md:w-auto">
             <div className="relative w-72">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                 <Input 
                    placeholder="Search Name, ID, or Email..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                 />
             </div>
             <Button onClick={() => fetchQueue(searchTerm, 1)}>Search</Button>
          </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col min-h-[600px]">
         <div className="flex-grow">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EV</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
           <tbody className="bg-white divide-y divide-gray-200">
            {filteredQueue.map((app) => {
                const score = app.risk_profile?.credit_score ?? app.credit_score;
                const ev = app.economics?.expected_value ?? app.expected_value;
                const tierName = app.current_tier?.replace('TIER_', '').replace(/_/g, ' ') || '-';
                const name = app.input_data?.applicant?.full_name || "Unknown";
                
                const docStatus = app.input_data?.docs_status;
                const isPendingDecision = ['MANUAL_REVIEW', 'SUBMITTED', 'SCORED'].includes(app.status);
                const showDocsBubble = isPendingDecision && docStatus;
                
                const isFundable = app.status === 'ACCEPTED' && role === 'admin';

                return (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {app.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        {name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold
                            ${app.status === 'OFFERED' ? 'bg-blue-100 text-blue-800' : 
                              app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                              app.status === 'FUNDED' ? 'bg-emerald-100 text-emerald-800' :
                              app.status === 'DECLINED' ? 'bg-red-100 text-red-800' : 
                              app.status === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {app.status}
                          </span>
                          
                          {showDocsBubble === 'REQUESTED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 font-bold border border-orange-200 w-fit">
                                🟠 Docs Req
                            </span>
                          )}
                          {showDocsBubble === 'RECEIVED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 w-fit">
                                🔵 Docs Ready
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{tierName}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={score >= 700 ? 'text-green-600' : score < 660 ? 'text-red-600' : 'text-yellow-600'}>
                            {score || 'N/A'}
                        </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                         <span className={(ev || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {(ev || 0) >= 0 ? '+' : '-'}${Math.abs(Math.round(ev || 0)).toLocaleString()}
                         </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                      {isFundable && (
                          <Button 
                             size="sm" 
                             className="bg-green-600 hover:bg-green-700 text-white"
                             onClick={(e) => handleFund(app.id, e)}
                             isLoading={actionLoading === app.id}
                          >
                             <DollarSign className="w-3 h-3 mr-1"/> Fund
                          </Button>
                      )}
                      
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/applications/${app.id}`)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                );
            })}
          </tbody>
         </table>
         </div>
         
         {/* --- PAGINATION FOOTER --- */}
         <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{filteredQueue.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> to <span className="font-medium">{Math.min(page * PAGE_SIZE, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                            variant="outline"
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        <div className="flex items-center px-4 bg-white border-t border-b border-gray-300 text-sm">
                            Page {page} of {totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages || loading}
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </nav>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}