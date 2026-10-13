import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteProduct,
  getProducts,
  getAdminOrders,
  updateOrderStatus,
  img,
  isLoggedIn,
  loginAdmin,
  logout,
  saveProduct
} from './api'

export default function Admin() {
  const [ok, setOk] = useState(isLoggedIn)   // auto-true if cred already in sessionStorage
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('products') // 'products' | 'orders' | 'settings'
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [offerText, setOfferText] = useState('')
  const [edit, setEdit] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, ords] = await Promise.all([getProducts(), getAdminOrders()])
      setItems(prods)
      setOrders(ords)
      const { getSettings } = await import('./api')
      getSettings().then(setOfferText)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ok) loadData()
  }, [ok])

  const doLogin = async e => {
    e.preventDefault()
    const f = new FormData(e.target)
    try {
      await loginAdmin(f.get('u'), f.get('p'))
      sessionStorage.setItem('isAdmin', 'true')
      setOk(true)
      setErr('')
    } catch (x) {
      setErr(x.message)
    }
  }

  const submit = async e => {
    e.preventDefault()
    const f = new FormData(e.target)
    f.set('isTrial', e.target.isTrial.checked ? 'true' : 'false')
    f.set('isShop', e.target.isShop.checked ? 'true' : 'false')
    const r = await saveProduct(f, edit?.id)
    if (r.status === 401) { logout(); return setOk(false) }
    e.target.reset()
    setEdit(null)
    loadData()
  }

  const handleStatusChange = async (orderId, newStatus, trackingId = '') => {
    if (newStatus === 'SHIPPED' && !trackingId) {
      trackingId = prompt('Enter Shipment Tracking ID:')
      if (!trackingId) return // Cancelled prompt
    }
    await updateOrderStatus(orderId, newStatus, trackingId)
    loadData()
  }

  const saveSettings = async () => {
    const { updateSettings } = await import('./api')
    await updateSettings(offerText)
    alert('Settings Saved!')
  }

  if (!ok) {
    return (
      <main className="admin-wrap" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form className="admin-form-box" style={{ maxWidth: 380, width: '100%', margin: 'auto' }} onSubmit={doLogin}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Cinzel', color: 'var(--primary-dark)' }}>Nanjal Admin</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sign in to manage trials, products &amp; orders</p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <input name="u" placeholder="Username" required />
            <input name="p" type="password" placeholder="Password" required />
            {err && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{err}</p>}
            <button className="checkout-submit-btn" style={{ background: 'var(--primary)' }}>
              Sign In
            </button>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                ← Back to Storefront
              </Link>
            </div>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-wrap">
      <div className="admin-header-row">
        <div>
          <h2 style={{ fontFamily: 'Cinzel', color: 'var(--primary-dark)', fontSize: '1.6rem' }}>
            Nanjal Collection Console
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage sample discovery trials, luxury inventory &amp; customer orders
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/" className="cat-chip" style={{ textDecoration: 'none' }}>
            View Storefront ↗
          </Link>
          <button
            className="cat-chip"
            style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
            onClick={() => {
              logout()
              sessionStorage.removeItem('isAdmin')
              setOk(false)
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ADMIN TABS */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
          💎 Products Catalog ({items.length})
        </button>
        <button className={`admin-tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          📦 Orders &amp; Dispatches ({orders.length})
        </button>
        <button className={`admin-tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          ⚙️ Settings
        </button>
      </div>

      {tab === 'settings' && (
        <div className="admin-form-box">
          <h3 style={{ marginBottom: 14 }}>Global Store Settings</h3>
          <div className="admin-form-grid">
            <label>
              <strong>Festival Offer / Top Bar Text</strong>
              <input value={offerText} onChange={e => setOfferText(e.target.value)} placeholder="Enter offer text..." style={{ marginTop: 8 }} />
            </label>
          </div>
          <button onClick={saveSettings} className="checkout-submit-btn" style={{ width: 'auto', padding: '10px 24px', background: 'var(--primary)', marginTop: 16 }}>
            Save Settings
          </button>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <>
          <div className="admin-form-box">
            <h3 style={{ marginBottom: 14 }}>{edit ? 'Edit Product' : 'Add New Jewellery Product / Sample'}</h3>
            <form key={edit?.id || 'new'} onSubmit={submit}>
              <div className="admin-form-grid">
                <input
                  name="name"
                  placeholder="Product Title"
                  defaultValue={edit?.name}
                  required
                />
                <input
                  name="category"
                  placeholder="Category (Earrings, Necklaces, Rings, Bangles...)"
                  defaultValue={edit?.category}
                  required
                />
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Selling Price (₹)"
                  defaultValue={edit?.price}
                  required
                />
                <input
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  placeholder="MRP / Original Price (₹)"
                  defaultValue={edit?.originalPrice}
                />
                <input
                  name="stock"
                  type="number"
                  placeholder="Inventory Stock"
                  defaultValue={edit?.stock ?? 50}
                  required
                />
                <select name="trialPoints" defaultValue={edit?.trialPoints ?? 1}>
                  <option value="1">Trial Cost: 1 Point</option>
                  <option value="2">Trial Cost: 2 Points</option>
                  <option value="3">Trial Cost: 3 Points</option>
                  <option value="4">Trial Cost: 4 Points</option>
                  <option value="5">Trial Cost: 5 Points</option>
                </select>
                <input
                  name="badge"
                  placeholder="Promo Badge (e.g. Trending Trial, Best Seller)"
                  defaultValue={edit?.badge}
                />
                <input
                  name="rating"
                  type="number"
                  step="0.1"
                  placeholder="Rating (e.g. 4.9)"
                  defaultValue={edit?.rating ?? 4.9}
                />
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Product Images (select multiple — first image is cover)
                  </label>
                  <input name="images" type="file" accept="image/*" multiple />
                  {edit?.imageUrls && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {edit.imageUrls.split(',').map((u, i) => (
                        <img key={i} src={u} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-checkbox-group">
                  <label className="admin-checkbox-label">
                    <input
                      name="isTrial"
                      type="checkbox"
                      defaultChecked={edit ? edit.isTrial : true}
                    />
                    <span>Available in Trials Tab (Sample Box)</span>
                  </label>
                  <label className="admin-checkbox-label">
                    <input
                      name="isShop"
                      type="checkbox"
                      defaultChecked={edit ? edit.isShop : true}
                    />
                    <span>Available in Shop Tab (Full-Size Purchase)</span>
                  </label>
                </div>

                <textarea
                  name="description"
                  placeholder="Craftsmanship description, gemstone specifications, trial sample details..."
                  defaultValue={edit?.description}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="submit"
                  className="checkout-submit-btn"
                  style={{ width: 'auto', padding: '10px 24px', background: 'var(--primary)' }}
                >
                  {edit ? 'Update Product' : 'Add to Collection'}
                </button>
                {edit && (
                  <button
                    type="button"
                    className="cat-chip"
                    onClick={() => setEdit(null)}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name &amp; Category</th>
                  <th>Price / MRP</th>
                  <th>Modes &amp; Points</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={img(p.imageUrl)}
                        alt={p.name}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      />
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>{p.category}</small>
                      {p.badge && (
                        <span style={{ marginLeft: 6, fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4 }}>
                          {p.badge}
                        </span>
                      )}
                    </td>
                    <td>
                      ₹{p.price}
                      {p.originalPrice && (
                        <small style={{ display: 'block', textDecoration: 'line-through', color: '#999' }}>
                          ₹{p.originalPrice}
                        </small>
                      )}
                    </td>
                    <td>
                      {p.isTrial && (
                        <span className="order-badge-trial" style={{ marginRight: 6 }}>
                          ⚡ {p.trialPoints || 1} Pt Trial
                        </span>
                      )}
                      {p.isShop && (
                        <span className="order-badge-shop">
                          💎 Shop
                        </span>
                      )}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="cat-chip"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            setEdit(p)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="cat-chip"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                          onClick={async () => {
                            if (confirm(`Delete "${p.name}"?`)) {
                              await deleteProduct(p.id)
                              loadData()
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Type</th>
                <th>Customer &amp; Address</th>
                <th>Items Ordered</th>
                <th>Financials</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    No customer orders yet.
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  let items = []
                  try {
                    items = JSON.parse(o.itemsJson || '[]')
                  } catch {}

                  return (
                    <tr key={o.id}>
                      <td>
                        <strong>#{o.id}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={o.orderType === 'TRIAL' ? 'order-badge-trial' : 'order-badge-shop'}>
                          {o.orderType}
                        </span>
                      </td>
                      <td>
                        <strong>{o.customerName}</strong>
                        <div style={{ fontSize: '0.78rem' }}>📞 {o.customerPhone}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 220 }}>
                          {o.address}, {o.city} - {o.pincode}
                        </div>
                      </td>
                      <td>
                        <ul style={{ paddingLeft: 16, margin: 0, fontSize: '0.78rem' }}>
                          {items.map((it, idx) => (
                            <li key={idx}>
                              {it.name} {it.qty ? `x${it.qty}` : `(${it.points} Pt)`}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div><strong>Paid:</strong> ₹{o.totalPayable}</div>
                        {o.walletDiscount > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                            Wallet: -₹{o.walletDiscount}
                          </div>
                        )}
                        {o.cashbackEarned > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                            Cashback: +₹{o.cashbackEarned}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className={`status-pill status-${o.status}`}
                          value={o.status}
                          onChange={e => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
