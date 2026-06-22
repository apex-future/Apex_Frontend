import { useEffect, useState } from 'react';
import { fetchOverview } from '../services/api';
import { Users, Activity, BookOpen, BrainCircuit, Loader2 } from 'lucide-react';

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">Error loading overview: {error}</div>;
  if (!data) return null;

  const stats = [
    { name: 'Total Users', value: data.users.total, change: `+${data.users.new_7d} this week`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Active Users (24h)', value: data.users.active_24h, change: `${data.users.active_7d} weekly`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Total Books', value: data.books.total, change: `+${data.books.uploaded_7d} this week`, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'AI Requests (7d)', value: data.ai.requests_7d, change: `${data.ai.total_requests} total`, icon: BrainCircuit, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-xl p-3.5 ${item.bg} shadow-inner`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-slate-500 truncate tracking-wide">{item.name}</dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-3xl font-bold text-slate-800 tracking-tight">{item.value.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-500">{item.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Users by Plan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(data.users.by_plan || {}).map(([plan, count]) => (
            <div key={plan} className="relative overflow-hidden border border-slate-100 rounded-2xl p-6 text-center hover:border-blue-200 hover:shadow-md transition-all duration-300 group bg-gradient-to-b from-white to-slate-50/50">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{plan}</div>
              <div className="mt-2 text-4xl font-extrabold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{count}</div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
