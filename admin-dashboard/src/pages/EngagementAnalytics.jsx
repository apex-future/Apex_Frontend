import { useEffect, useState } from 'react';
import { fetchEngagementAnalytics, fetchQuizzesAnalytics } from '../services/api';
import { Loader2, Users, TrendingUp, Award, Target, BarChart3, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function EngagementAnalytics() {
  const [engagement, setEngagement] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchEngagementAnalytics(30),
      fetchQuizzesAnalytics(30)
    ])
      .then(([engData, quizData]) => {
        setEngagement(engData);
        setQuizzes(quizData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-xl border border-red-200">Error loading engagement analytics: {error}</div>;
  if (!engagement && !quizzes) return null;

  const dau = engagement?.dau ?? 0;
  const wau = engagement?.wau ?? 0;
  const mau = engagement?.mau ?? 0;
  const avgQuizScore = quizzes?.average_score ?? 0;
  const quizCompletionRate = quizzes?.completion_rate_pct ?? 0;
  const totalQuizzes = quizzes?.total_quizzes_taken ?? 0;

  const activeUserTrend = engagement?.daily_active_users ?? [];
  const trendData = activeUserTrend.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: d.count
  }));

  const goalDistribution = engagement?.by_studying_goal ?? {};
  const goalData = Object.entries(goalDistribution).map(([name, value]) => ({ name, value }));

  const quizByDifficulty = quizzes?.by_difficulty ?? {};
  const difficultyData = Object.entries(quizByDifficulty).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    score: value.average_score ?? 0,
    count: value.count ?? 0
  }));

  const stats = [
    { name: 'Daily Active Users', value: dau.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-50 to-white' },
    { name: 'Weekly Active Users', value: wau.toLocaleString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', gradient: 'from-emerald-50 to-white' },
    { name: 'Monthly Active Users', value: mau.toLocaleString(), icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100', gradient: 'from-indigo-50 to-white' },
    { name: 'Avg Quiz Score', value: `${avgQuizScore.toFixed(1)}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-50 to-white' },
    { name: 'Quiz Completion', value: `${quizCompletionRate.toFixed(1)}%`, icon: Percent, color: 'text-rose-600', bg: 'bg-rose-100', gradient: 'from-rose-50 to-white' },
    { name: 'Total Quizzes', value: totalQuizzes.toLocaleString(), icon: Target, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-50 to-white' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className={`bg-gradient-to-br ${item.gradient} overflow-hidden rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-xl p-3.5 ${item.bg} shadow-inner`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-slate-500 truncate tracking-wide">{item.name}</dt>
                  <dd className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{item.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Users Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Active Users Trend</h3>
          <div className="h-80">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No trend data available yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Studying Goals Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">User Goals</h3>
          <div className="h-72">
            {goalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {goalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                <p className="text-sm">No goal data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Performance by Difficulty */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Quiz Performance by Difficulty</h3>
        <div className="h-72">
          {difficultyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={[0, 100]} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [name === 'score' ? `${value}%` : value, name === 'score' ? 'Avg Score' : 'Attempts']}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No quiz data available yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
