// orders.js — Quản lý đơn hàng EcoShop (localStorage)

const ORDERS_KEY = 'ecoshop_orders';

export const ORDER_STATUS = {
  pending:   { label: 'Chờ xử lý',  color: '#856404', bg: '#fff3cd', icon: '⏳' },
  shipping:  { label: 'Đang giao',  color: '#004085', bg: '#cce5ff', icon: '🚚' },
  completed: { label: 'Hoàn thành', color: '#155724', bg: '#d4edda', icon: '✅' },
};

export function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch { return []; }
}

export function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // mới nhất lên đầu
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order;
}

export function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order  = orders.find(o => o.id === id);
  if (!order) return false;
  order.status    = status;
  order.updatedAt = new Date().toISOString();
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return true;
}

export function createOrder({ user, items, total, address, phone }) {
  const order = {
    id:        'ORD-' + Date.now(),
    userId:    user.id,
    userName:  user.name,
    userEmail: user.email,
    items,
    total,
    address,
    phone,
    status:    'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveOrder(order);
}

export function getOrdersByUser(userId) {
  return getOrders().filter(o => o.userId === userId);
}