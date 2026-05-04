const BASE = '/api/customer';

export const getPublicMenu = async (restaurantId, tableId, lang = 'en') => {
  const bust = Date.now(); // ← forces a fresh request every time
  const res = await fetch(
    `/api/customer/${restaurantId}/${tableId}/menu?lang=${lang}&_=${bust}`,
    { cache: 'no-store' } // ← tells browser never to cache this
  );
  if (!res.ok) throw new Error('Failed to load menu');
  return res.json();
};

export const placeOrder = async (restaurantId, tableId, body) => {
  const res = await fetch(`${BASE}/${restaurantId}/${tableId}/orders`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to place order');
  return res.json();
};

export const getRecommendations = async (restaurantId, itemIds, lang = 'en') => {
  const ids = itemIds.join(',');
  const res = await fetch(`${BASE}/${restaurantId}/recommendations?items=${ids}&lang=${lang}`);
  if (!res.ok) return [];
  return res.json();
};

export const getOrderStatus = async (restaurantId, tableId, orderId) => {
  const res = await fetch(`${BASE}/${restaurantId}/${tableId}/orders/${orderId}`);
  if (!res.ok) throw new Error('Failed to get order status');
  return res.json();
};

export const getForYou = async (restaurantId, name, phone, lang = 'en') => {
  const params = new URLSearchParams({ lang });
  if (name?.trim())  params.append('name',  name.trim());
  if (phone?.trim()) params.append('phone', phone.trim());
  const res = await fetch(`/api/customer/${restaurantId}/foryou?${params}`);
  if (!res.ok) return { items: [], isPersonal: false };
  return res.json();
};