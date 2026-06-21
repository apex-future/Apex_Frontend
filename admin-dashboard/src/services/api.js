const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://web-production-e19b7.up.railway.app/api/admin';

export const getHeaders = () => {
  const secret = localStorage.getItem('adminSecret');
  return {
    'Content-Type': 'application/json',
    'X-Admin-Secret': secret || '',
  };
};

export const checkHealth = async (secret) => {
  const res = await fetch(`${API_BASE_URL}/health`, {
    headers: { 'X-Admin-Secret': secret }
  });
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 503) throw new Error('503: Server says Admin Endpoints are not configured');
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return res.json();
};

export const fetchOverview = async () => {
  const res = await fetch(`${API_BASE_URL}/overview`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
};

export const fetchUsers = async (page = 1, limit = 50) => {
  const res = await fetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const fetchAiAnalytics = async (days = 30) => {
  const res = await fetch(`${API_BASE_URL}/analytics/ai?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch AI analytics');
  return res.json();
};

export const fetchAiAnalyticsDaily = async (days = 7) => {
  const res = await fetch(`${API_BASE_URL}/analytics/ai/daily?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch daily AI analytics');
  return res.json();
};

export const fetchBooksAnalytics = async (days = 30) => {
  const res = await fetch(`${API_BASE_URL}/analytics/books?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch books analytics');
  return res.json();
};

export const fetchHighlightsAnalytics = async (days = 30) => {
  const res = await fetch(`${API_BASE_URL}/analytics/highlights?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch highlights analytics');
  return res.json();
};

export const fetchUser = async (id) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

export const updateUserPlan = async (id, planData) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}/plan`, { 
    method: 'PATCH', 
    headers: getHeaders(),
    body: JSON.stringify(planData)
  });
  if (!res.ok) throw new Error('Failed to update user plan');
  return res.json();
};

export const fetchUserActivity = async (id, days = 30) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}/activity?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user activity');
  return res.json();
};

export const fetchUserAiHistory = async (id, limit = 50) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}/ai-history?limit=${limit}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user AI history');
  return res.json();
};

export const fetchEngagementAnalytics = async (days = 30) => {
  const res = await fetch(`${API_BASE_URL}/analytics/engagement?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch engagement analytics');
  return res.json();
};

export const fetchQuizzesAnalytics = async (days = 30) => {
  const res = await fetch(`${API_BASE_URL}/analytics/quizzes?days=${days}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch quizzes analytics');
  return res.json();
};
