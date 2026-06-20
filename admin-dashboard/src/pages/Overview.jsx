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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-lg p-3 ${item.bg}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-500">{item.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Plan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.users.by_plan || {}).map(([plan, count]) => (
            <div key={plan} className="border border-gray-100 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-gray-500 capitalize">{plan}</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
