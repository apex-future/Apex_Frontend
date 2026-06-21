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
