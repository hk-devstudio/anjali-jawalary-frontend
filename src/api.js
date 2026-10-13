export const API = import.meta.env.VITE_API_URL ?? ''

export const img = u => {
  if (!u) return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return API + u
}

// Products
export const getProducts = () => fetch(API + '/api/products').then(r => r.json())
export const getTrialProducts = () => fetch(API + '/api/products/trials').then(r => r.json())
export const getShopProducts = () => fetch(API + '/api/products/shop').then(r => r.json())

// Settings
export const getSettings = () => fetch(API + '/api/settings').then(r => r.text())
export const updateSettings = text => fetch(API + '/api/settings', {
  method: 'POST',
  body: text,
  headers: { ...auth(), 'Content-Type': 'text/plain' }
})

// Orders
export const placeOrder = orderData =>
  fetch(API + '/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }).then(async r => {
    if (!r.ok) throw new Error('Failed to place order')
    return r.json()
  })

// User Auth
export const signupUser = (name, email, password) =>
  fetch(API + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  }).then(async r => {
    const data = await r.json()
    if (!data.success) throw new Error(data.message)
    return data
  })

export const loginUser = (email, password) =>
  fetch(API + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(async r => {
    const data = await r.json()
    if (!data.success) throw new Error(data.message)
    return data
  })

// Admin auth
const auth = () => ({ Authorization: 'Basic ' + sessionStorage.getItem('cred') })

export const loginAdmin = async (u, p) => {
  const cred = btoa(u + ':' + p)
  const r = await fetch(API + '/api/admin/ping', { headers: { Authorization: 'Basic ' + cred } })
  if (!r.ok) throw new Error('Invalid admin credentials')
  sessionStorage.setItem('cred', cred)
}

export const logout = () => sessionStorage.removeItem('cred')
export const isLoggedIn = () => !!sessionStorage.getItem('cred')

export const saveProduct = (fd, id) =>
  fetch(API + '/api/admin/products' + (id ? '/' + id : ''), {
    method: id ? 'PUT' : 'POST',
    headers: auth(),
    body: fd
  })

export const deleteProduct = id =>
  fetch(API + '/api/admin/products/' + id, { method: 'DELETE', headers: auth() })

export const getAdminOrders = () =>
  fetch(API + '/api/admin/orders', { headers: auth() }).then(r => r.json())

export const updateOrderStatus = (id, status, trackingId = '') =>
  fetch(API + `/api/admin/orders/${id}/status?status=${encodeURIComponent(status)}&trackingId=${encodeURIComponent(trackingId)}`, {
    method: 'PUT',
    headers: auth()
  }).then(r => r.json())
