const API_BASE_URL = 'https://web-production-e19b7.up.railway.app/api/admin';

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
  if (!res.ok) throw new Error('Forbidden');
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
