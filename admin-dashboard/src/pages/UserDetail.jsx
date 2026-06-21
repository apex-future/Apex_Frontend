import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUser, fetchUserActivity, fetchUserAiHistory, updateUserPlan, deleteUser } from '../services/api';
import { Loader2, ArrowLeft, User, Mail, Calendar, CreditCard, Clock, BrainCircuit, Trash2, ShieldAlert } from 'lucide-react';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState(null);
  const [aiHistory, setAiHistory] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchUser(id),
      fetchUserActivity(id),
      fetchUserAiHistory(id, 20)
    ])
      .then(([userData, activityData, aiData]) => {
        setUser(userData);
        setActivity(activityData);
        setAiHistory(aiData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlanChange = async (newPlan) => {
    if (!window.confirm(`Are you sure you want to change this user's plan to ${newPlan.toUpperCase()}?`)) return;
    
    setUpdatingPlan(true);
    try {
      await updateUserPlan(id, { plan: newPlan });
      setUser({ ...user, plan: newPlan });
    } catch (err) {
      alert('Failed to update plan: ' + err.message);
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('DANGER: Are you absolutely sure you want to delete this user? This action cannot be undone.')) return;
    
    setDeletingUser(true);
    try {
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
      setDeletingUser(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-xl border border-red-200">Error loading user details: {error}</div>;
  if (!user) return <div className="text-slate-500">User not found.</div>;

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'activity', name: 'Activity Timeline' },
    { id: 'ai-history', name: 'AI History' },
    { id: 'danger', name: 'Danger Zone' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{user.full_name || 'User Profile'}</h2>
          <p className="text-sm text-slate-500 font-medium">Manage details and view activity for {user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Basic Information</h3>
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-5 space-y-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Full Name</p>
                      <p className="font-semibold text-slate-800">{user.full_name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Email Address</p>
                      <p className="font-semibold text-slate-800">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Joined Date</p>
                      <p className="font-semibold text-slate-800">{new Date(user.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Plan & Usage</h3>
                <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-slate-500">Current Plan</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          user.plan === 'apex' ? 'bg-purple-100 text-purple-700' :
                          user.plan === 'free' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.plan || 'free'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handlePlanChange('free')}
                        disabled={updatingPlan || user.plan === 'free'}
                        className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                      >
                        Set Free
                      </button>
                      <button 
                        onClick={() => handlePlanChange('apex')}
                        disabled={updatingPlan || user.plan === 'apex'}
                        className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                      >
                        Upgrade to Apex
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <BrainCircuit className="w-5 h-5 text-emerald-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-slate-500">Daily AI Limit</p>
                        <p className="font-semibold text-slate-800">{user.daily_ai_count} / {user.plan === 'apex' ? 'Unlimited' : '100'} used</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Recent Activity</h3>
              {(!activity || activity.length === 0) ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  No recent activity found for this user.
                </div>
              ) : (
                <div className="space-y-6">
                  {activity.map((item, idx) => (
                    <div key={idx} className="flex space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                      </div>
                      <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                        <p className="text-sm font-medium text-slate-800">{item.action}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        {item.details && (
                          <div className="mt-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                            {JSON.stringify(item.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">AI Conversation History</h3>
              {(!aiHistory?.history || aiHistory.history.length === 0) ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100">
                  <BrainCircuit className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  No AI conversations found.
                </div>
              ) : (
                <div className="space-y-4">
                  {aiHistory.history.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col p-4 rounded-xl border ${msg.role === 'user' ? 'bg-blue-50 border-blue-100 ml-8' : 'bg-slate-50 border-slate-100 mr-8'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-600' : 'text-slate-500'}`}>
                          {msg.role === 'user' ? 'User Prompt' : 'AI Response'}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
                <div className="flex items-start">
                  <ShieldAlert className="w-6 h-6 text-rose-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-rose-800 tracking-tight">Danger Zone</h3>
                    <p className="text-sm text-rose-600/80 mt-1 mb-6">
                      Deleting this user will permanently remove all their data, books, highlights, and history from the platform. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteUser}
                      disabled={deletingUser}
                      className="flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Permanently Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
