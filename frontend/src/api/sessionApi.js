const BASE = '/api/sessions';

export const getActiveSession = async (restaurantId, tableId) => {
  const res = await fetch(`${BASE}/active/${restaurantId}/${tableId}`);
  if (!res.ok) return null;
  return res.json();
};

export const requestBill = async (restaurantId, tableId) => {
  const res = await fetch(`${BASE}/request-bill/${restaurantId}/${tableId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to request bill');
  return res.json();
};

export const getSessions = async (restaurantId, token) => {
  const res = await fetch(`${BASE}/${restaurantId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json();
};

export const setSplit = async (sessionId, data, token) => {
  const res = await fetch(`${BASE}/${sessionId}/split`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to set split');
  return res.json();
};

export const markSplitPaid = async (sessionId, splitIndex, token) => {
  const res = await fetch(`${BASE}/${sessionId}/split/${splitIndex}/paid`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark paid');
  return res.json();
};

export const closeSession = async (sessionId, token) => {
  const res = await fetch(`${BASE}/${sessionId}/close`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to close session');
  return res.json();
};