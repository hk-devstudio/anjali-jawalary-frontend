import { useState, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import { getTrialProducts, getShopProducts, placeOrder, img } from './api'
import Admin from './Admin'

const MAX_TRIAL_POINTS = 6
const TRIAL_SERVICE_FEE = 199

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onVerified, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await import('./api').then(m => m.loginUser(form.email, form.password))
        onVerified(res.user) // pass full user object
      } else {
        const res = await import('./api').then(m => m.signupUser(form.name, form.email, form.password))
        setSuccess(res.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="otp-modal-card" onClick={e => e.stopPropagation()}>
        <button className="close-modal-x" onClick={onClose}>✕</button>

        <div className="otp-modal-header">
          <div className="otp-icon-wrap">💎</div>
          <h3>{isLogin ? 'Welcome Back' : 'Create an Account'}</h3>
          <p>{isLogin ? 'Log in to place your order' : 'Sign up to discover luxury samples'}</p>
        </div>

        <form className="otp-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input className="otp-input-field" style={{ letterSpacing: 'normal', textAlign: 'left', fontSize: '1rem', padding: '10px' }} 
              placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          )}
          <input className="otp-input-field" type="email" style={{ letterSpacing: 'normal', textAlign: 'left', fontSize: '1rem', padding: '10px' }} 
            placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input className="otp-input-field" type="password" style={{ letterSpacing: 'normal', textAlign: 'left', fontSize: '1rem', padding: '10px' }} 
            placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          
          {error && <p className="otp-error">{error}</p>}
          {success && <p style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>{success}</p>}

          <button className="otp-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: '0.85rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => {setIsLogin(!isLogin); setError(''); setSuccess('')}} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TRIAL CARD ───────────────────────────────────────────────────────────────
function TrialCard({ product, inBox, onToggle, pointsRemaining, onOpenDetail }) {
  const cost = product.trialPoints || 1
  const canAdd = cost <= pointsRemaining
  const disabled = !inBox && !canAdd
  const outOfStock = product.stock === 0

  return (
    <article className={`product-card trial-card${outOfStock ? ' out-of-stock-card' : ''}`}>
      <div className="card-img-wrap" onClick={() => onOpenDetail(product)} style={{ cursor: 'pointer' }}>
        <img src={img(product.imageUrl)} alt={product.name} loading="lazy" />
        <div className="trial-pts-tag">
          <span>⚡</span>
          <span>{cost} {cost === 1 ? 'Pt' : 'Pts'}</span>
        </div>
        {product.badge && <div className="promo-badge">{product.badge}</div>}
        {outOfStock
          ? <div className="out-of-stock-overlay">Out of Stock</div>
          : inBox && <div className="in-box-overlay"><span>✓ In Trial Box</span></div>
        }
      </div>

      <div className="card-body">
        <div className="card-cat">{product.category}</div>
        <h3 className="card-title" onClick={() => onOpenDetail(product)} title={product.name} style={{ cursor: 'pointer' }}>{product.name}</h3>

        <div className="rating-row">
          <span className="stars">★ {product.rating || 4.8}</span>
          <span>({product.ratingCount || 45} reviews)</span>
        </div>

        {/* NO PRICE IN TRIAL — only trial points */}
        <div className="trial-points-display">
          <span className="tpt-label">Trial Cost:</span>
          <span className="tpt-badge">
            ⚡ {cost} {cost === 1 ? 'Trial Point' : 'Trial Points'}
          </span>
        </div>

        <button
          className={`add-trial-btn ${inBox ? 'added' : ''}`}
          onClick={() => onToggle(product)}
          disabled={disabled || outOfStock}
          title={outOfStock ? 'Currently unavailable' : disabled ? `Need ${cost} pts, you have ${pointsRemaining}` : ''}
        >
          {outOfStock ? (
            <span>Unavailable</span>
          ) : inBox ? (
            <><span>✓ In Trial Box</span><span className="btn-sub">Tap to Remove</span></>
          ) : disabled ? (
            <span>Not Enough Points</span>
          ) : (
            <><span>+ Add to Trial Box</span><span className="btn-sub">({cost} Pt)</span></>
          )}
        </button>
      </div>
    </article>
  )
}

// ─── SHOP CARD ────────────────────────────────────────────────────────────────
function ShopCard({ product, onAddToCart, onOpenDetail }) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null
  const outOfStock = product.stock === 0

  return (
    <article className={`product-card shop-card${outOfStock ? ' out-of-stock-card' : ''}`}>
      <div className="card-img-wrap" onClick={() => onOpenDetail(product)} style={{ cursor: 'pointer' }}>
        <img src={img(product.imageUrl)} alt={product.name} loading="lazy" />
        {product.badge && <div className="promo-badge">{product.badge}</div>}
        {discount && !outOfStock && <div className="discount-bubble">-{discount}%</div>}
        {outOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
      </div>

      <div className="card-body">
        <div className="card-cat">{product.category}</div>
        <h3 className="card-title" onClick={() => onOpenDetail(product)} title={product.name}>
          {product.name}
        </h3>

        <div className="rating-row">
          <span className="stars">★ {product.rating || 4.8}</span>
          <span>({product.ratingCount || 45})</span>
        </div>

        <div className="price-row">
          <span className="selling-price">₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className="discount-tag">{discount}% OFF</span>
            </>
          )}
        </div>

        <button
          className="add-cart-btn"
          onClick={() => onAddToCart(product)}
          disabled={outOfStock}
          style={outOfStock ? { background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' } : {}}
        >
          {outOfStock ? '⚠ Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </article>
  )
}

// ─── DETAIL GALLERY ────────────────────────────────────────────────────────────
function DetailGallery({ images, productName }) {
  const [active, setActive] = useState(0)
  const allImgs = images && images.length > 0 ? images : []
  const mainImg = allImgs[active] || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="detail-gallery">
      <div className="detail-main-img-wrap">
        <img src={img(mainImg)} alt={productName} className="detail-main-img" />
      </div>
      {allImgs.length > 1 && (
        <div className="detail-thumbnails">
          {allImgs.map((u, i) => (
            <div
              key={i}
              className={`detail-thumb${active === i ? ' active-thumb' : ''}`}
              onClick={() => setActive(i)}
            >
              <img src={img(u)} alt={`${productName} ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


function Storefront() {
  const [activeTab, setActiveTab] = useState('trials')
  const [trialProducts, setTrialProducts] = useState([])
  const [shopProducts, setShopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [sortBy, setSortBy] = useState('featured')

  // Trial Box
  const [trialBox, setTrialBox] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nanjal_trial_box') || '[]') } catch { return [] }
  })

  // Shop Cart
  const [shopCart, setShopCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nanjal_shop_cart') || '[]') } catch { return [] }
  })


  // Drawers & Modals
  const [isTrialDrawerOpen, setIsTrialDrawerOpen] = useState(false)
  const [isShopDrawerOpen, setIsShopDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  // User State
  const [currentUser, setCurrentUser] = useState(null)
  const [authModal, setAuthModal] = useState(null) // null | 'trial' | 'shop'
  const [topBarText, setTopBarText] = useState("🎉 FESTIVAL OFFER: FLAT 20% OFF ON ALL ROYAL HEIRLOOMS!")

  // Checkout Form
  const [checkoutForm, setCheckoutForm] = useState({ address: '', city: '', pincode: '', phone: '' })
  const [useWallet, setUseWallet] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toast
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem('nanjal_trial_box', JSON.stringify(trialBox)) }, [trialBox])
  useEffect(() => { localStorage.setItem('nanjal_shop_cart', JSON.stringify(shopCart)) }, [shopCart])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => {
    setLoading(true)
    import('./api').then(m => {
      m.getSettings().then(res => setTopBarText(res)).catch(() => {})
      return Promise.all([m.getTrialProducts(), m.getShopProducts()])
    })
    .then(([t, s]) => { setTrialProducts(t); setShopProducts(s) })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  // Points calculation
  const pointsUsed = trialBox.reduce((s, p) => s + (p.trialPoints || 1), 0)
  const pointsRemaining = Math.max(0, MAX_TRIAL_POINTS - pointsUsed)
  const freeGiftUnlocked = pointsUsed >= 3

  // Toggle trial product
  const handleToggleTrial = product => {
    const inBox = trialBox.some(i => i.id === product.id)
    if (inBox) {
      setTrialBox(trialBox.filter(i => i.id !== product.id))
      showToast(`Removed "${product.name}" from Trial Box`)
    } else {
      const cost = product.trialPoints || 1
      if (cost > pointsRemaining) {
        showToast(`Need ${cost} points — only ${pointsRemaining} remaining`)
        return
      }
      setTrialBox([...trialBox, product])
      showToast(`✨ Added to Trial Box (${cost} Pt used)`)
    }
  }

  // Shop cart
  const handleAddToCart = product => {
    const existing = shopCart.find(i => i.product.id === product.id)
    if (existing) {
      setShopCart(shopCart.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
      setShopCart([...shopCart, { product, qty: 1 }])
    }
    showToast(`🛍️ "${product.name}" added to cart!`)
  }

  const updateCartQty = (productId, delta) => {
    setShopCart(shopCart
      .map(i => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }

  // Filtered + sorted products
  const activeProducts = activeTab === 'trials' ? trialProducts : shopProducts
  const categories = ['All', ...new Set(activeProducts.map(p => p.category))]

  const displayed = [...activeProducts]
    .filter(p => {
      const matchCat = selectedCat === 'All' || p.category === selectedCat
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'points-low') return (a.trialPoints || 1) - (b.trialPoints || 1)
      return 0
    })

  // Shop totals
  const shopSubtotal = shopCart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const walletDeduct = 0;
  const shopTotal = shopSubtotal;

  // Checkout gate
  const initiateCheckout = (type) => {
    if (type === 'trial' && trialBox.length === 0) { showToast('Trial Box is empty!'); return }
    if (type === 'shop' && shopCart.length === 0) { showToast('Cart is empty!'); return }
    if (!currentUser) {
      setAuthModal(type)
    } else {
      if (type === 'trial') setIsTrialDrawerOpen(true)
      if (type === 'shop') setIsShopDrawerOpen(true)
    }
  }

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user)
    if (user.role === 'ADMIN') {
      // Auto-authenticate the admin panel so they don't need to sign in again there
      try {
        const { loginAdmin } = await import('./api')
        await loginAdmin('admin', 'admin123')
        sessionStorage.setItem('isAdmin', 'true')
      } catch {}
    }
    setAuthModal(null)
    if (authModal === 'trial') setIsTrialDrawerOpen(true)
    if (authModal === 'shop') setIsShopDrawerOpen(true)
  }

  // Trigger Razorpay Payment Gateway
  const triggerRazorpayPayment = async (payableAmount, orderPayload, onSuccess) => {
    setIsSubmitting(true)
    try {
      const { createPaymentOrder, verifyPaymentOrder } = await import('./api')
      const paymentOrder = await createPaymentOrder(payableAmount)

      const options = {
        key: paymentOrder.keyId || "rzp_test_TnQlgIaXc3S5Tt",
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "Nanjal Collection",
        description: `${orderPayload.orderType} Order Payment`,
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=200&q=80",
        order_id: paymentOrder.orderId,
        handler: async function (response) {
          try {
            // Save order to database
            const savedOrder = await placeOrder({
              ...orderPayload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              paymentStatus: "PAID"
            })

            // Verify signature on backend
            await verifyPaymentOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              localOrderId: savedOrder.id
            }).catch(console.error)

            onSuccess(savedOrder)
          } catch (err) {
            showToast("Order save error: " + err.message)
          } finally {
            setIsSubmitting(false)
          }
        },
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
          contact: checkoutForm.phone || ""
        },
        theme: {
          color: "#0f172a"
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
            showToast("Payment window closed.")
          }
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (resp) {
          showToast("Payment failed: " + resp.error.description)
          setIsSubmitting(false)
        })
        rzp.open()
      } else {
        throw new Error("Razorpay SDK not loaded. Please refresh.")
      }
    } catch (err) {
      showToast(err.message)
      setIsSubmitting(false)
    }
  }

  // Place trial order
  const handlePlaceTrialOrder = async e => {
    e.preventDefault()
    if (!checkoutForm.address || !checkoutForm.phone) { showToast('Please fill all required fields'); return }

    const orderPayload = {
      orderType: 'TRIAL',
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: checkoutForm.phone,
      address: checkoutForm.address,
      city: checkoutForm.city,
      pincode: checkoutForm.pincode,
      itemsJson: JSON.stringify(trialBox.map(p => ({ id: p.id, name: p.name, points: p.trialPoints || 1 }))),
      subtotal: TRIAL_SERVICE_FEE,
      walletDiscount: 0,
      totalPayable: TRIAL_SERVICE_FEE,
      cashbackEarned: TRIAL_SERVICE_FEE
    }

    triggerRazorpayPayment(TRIAL_SERVICE_FEE, orderPayload, (res) => {
      setTrialBox([])
      setIsTrialDrawerOpen(false)
      setOrderConfirmation({ ...res, cashbackEarned: TRIAL_SERVICE_FEE })
    })
  }

  // Place shop order
  const handlePlaceShopOrder = async e => {
    e.preventDefault()
    if (!checkoutForm.address || !checkoutForm.phone) { showToast('Please fill all required fields'); return }

    const orderPayload = {
      orderType: 'SHOP',
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: checkoutForm.phone,
      address: checkoutForm.address,
      city: checkoutForm.city,
      pincode: checkoutForm.pincode,
      itemsJson: JSON.stringify(shopCart.map(i => ({ id: i.product.id, name: i.product.name, qty: i.qty, unitPrice: i.product.price }))),
      subtotal: shopSubtotal,
      walletDiscount: 0,
      totalPayable: shopTotal,
      cashbackEarned: 0
    }

    triggerRazorpayPayment(shopTotal, orderPayload, (res) => {
      setShopCart([])
      setIsShopDrawerOpen(false)
      setOrderConfirmation(res)
    })
  }

  return (
    <>
      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1c1917', color: '#fef3c7', padding: '12px 24px', borderRadius: 9999, fontSize: '0.88rem', fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* TOP STRIP */}
      <div className="top-strip">
        <span>{topBarText}</span>
      </div>

      {/* HEADER */}
      <header className="header-wrap">
        <div className="nav-container">
          <Link to="/" className="brand-block">
            <span className="brand-name">Nanjal Collection</span>
            <span className="brand-sub">Luxury Jewellery Sampling</span>
          </Link>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={activeTab === 'trials' ? 'Search trial samples...' : 'Search full-size collections...'}
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedCat('All') }}
            />
            {search && <button className="clear-search" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="nav-actions">
            {/* User chip with dropdown */}
            {currentUser ? (
              <div style={{ position: 'relative' }} className="user-chip-wrap">
                <div className="pill-btn user-chip" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'default' }}>
                  ✓ Hi, {currentUser.name.split(' ')[0]}
                </div>
                <div className="user-dropdown">
                  <div className="user-dropdown-name">{currentUser.name}</div>
                  <div className="user-dropdown-email">{currentUser.email}</div>
                  <button className="user-dropdown-logout" onClick={() => { setCurrentUser(null); sessionStorage.removeItem('isAdmin') }}>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button className="pill-btn" onClick={() => setAuthModal('shop')} style={{ background: '#f5f5f4', border: '1px solid #d6d3d1' }}>
                Sign In
              </button>
            )}

            <button className="pill-btn trial-points-pill" onClick={() => initiateCheckout('trial')}>
              <span>⚡ Trial Box:</span>
              <span className="badge-count">{trialBox.length} items</span>
            </button>

            <button className="pill-btn cart-pill" onClick={() => initiateCheckout('shop')}>
              <span>🛍️ Cart</span>
              {shopCart.length > 0 && (
                <span className="badge-count">{shopCart.reduce((s, i) => s + i.qty, 0)}</span>
              )}
            </button>

            {currentUser?.role === 'ADMIN' && (
              <Link to="/admin" className="admin-link">Admin</Link>
            )}
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="mode-switcher-strip">
          <div className="mode-switcher-container">
            <button
              className={`tab-switch-btn ${activeTab === 'trials' ? 'active' : ''}`}
              onClick={() => { setActiveTab('trials'); setSelectedCat('All'); setSearch('') }}
            >
              <span>⚡ TRIAL SAMPLES</span>
              <span className="tab-tag">Free Trial Box</span>
            </button>
            <button
              className={`tab-switch-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => { setActiveTab('shop'); setSelectedCat('All'); setSearch('') }}
            >
              <span>💎 SHOP FULL SIZE</span>
              <span className="tab-tag">Buy Now</span>
            </button>
          </div>
        </div>
      </header>

      {/* STICKY TRIAL METER — only in trial tab */}
      {activeTab === 'trials' && (
        <div className="trial-meter-bar">
          <div className="trial-meter-inner">
            <div className="meter-info">
              <div className="meter-points-badge">⚡ {pointsRemaining} / {MAX_TRIAL_POINTS} Points Left</div>
              <div className="meter-text">
                {pointsUsed === 0
                  ? <span>Pick up to <strong>6 Trial Points</strong> worth of samples!</span>
                  : pointsUsed < MAX_TRIAL_POINTS
                    ? <span><strong>{trialBox.length} samples</strong> selected ({pointsUsed} pts used)</span>
                    : <span>🎉 <strong>Trial Box Full!</strong> Ready for checkout.</span>
                }
              </div>
            </div>

            <div className="slots-container">
              {[...Array(MAX_TRIAL_POINTS)].map((_, i) => (
                <div key={i} className={`meter-slot ${i < pointsUsed ? 'filled' : ''}`}>
                  {i < pointsUsed ? '✓' : i + 1}
                </div>
              ))}
              <div className={`meter-slot free-gift ${freeGiftUnlocked ? 'filled' : ''}`} title="Add 3+ pts to unlock free gift">
                🎁
              </div>
              <button className="meter-action-btn" onClick={() => initiateCheckout('trial')}>
                Checkout Box ({trialBox.length}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER - ROYAL EDITORIAL */}
      <section className="hero-banner">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-pill">
              NANJAL COLLECTION
            </div>
            <h1 className="hero-title">
              Found by Woman<br /><span>for Women</span>
            </h1>
            <p className="hero-desc">
              Crafted with tradition. Designed for today. {activeTab === 'trials' ? 'Try our curated sample jewellery pieces in the comfort of your home.' : 'Heirloom craftsmanship created to celebrate timeless elegance.'}
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="#catalog" className="hero-cta-btn">
                Explore Collections →
              </a>
              {activeTab === 'trials' && (
                <button
                  onClick={() => initiateCheckout('trial')}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#dfbe82', border: '1px solid rgba(223,190,130,0.4)', padding: '12px 24px', borderRadius: 4, fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  ⚡ Open Trial Box ({trialBox.length})
                </button>
              )}
            </div>
          </div>
          <div className="hero-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&q=80"
              alt="Indian Royal Emerald Heritage Jewelry Model"
            />
          </div>
        </div>
      </section>

      {/* ── 1. SHOP BY CATEGORY (ARCHED LUXURY PORTALS) ── */}
      <section className="arch-categories-section">
        <div className="arch-section-header">
          <div className="arch-ornament">❖ ❖ ❖</div>
          <h2 className="arch-section-title">Shop by Category</h2>
          <p className="arch-section-sub">Find the perfect piece for every occasion.</p>
        </div>
        <div className="arch-categories-grid">
          {[
            { name: 'Necklaces', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80' },
            { name: 'Earrings', img: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=500&q=80' },
            { name: 'Rings', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=80' },
            { name: 'Bangles', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=500&q=80' },
            { name: 'Bridal', img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=500&q=80' }
          ].map(c => (
            <button
              key={c.name}
              className="arch-cat-card"
              onClick={() => { setSelectedCat(c.name); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              <div className="arch-cat-portal">
                <img src={c.img} alt={c.name} />
              </div>
              <span className="arch-cat-label">{c.name} →</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 2. FEATURED COLLECTION (ROYAL HERITAGE) ── */}
      <section className="heritage-feature-row">
        <div className="heritage-container">
          <div className="heritage-intro">
            <div className="heritage-intro-sub">Featured Collection</div>
            <h2 className="heritage-intro-title">Royal Heritage</h2>
            <p className="heritage-intro-desc">
              Inspired by timeless traditions, our Royal Heritage collection brings together classic handcrafted designs and regal emerald elegance.
            </p>
            <button
              className="heritage-view-btn"
              onClick={() => { setActiveTab('shop'); setSelectedCat('All'); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              View Collection →
            </button>
          </div>
          <div className="heritage-cards-grid">
            {(shopProducts.slice(0, 4).length > 0 ? shopProducts.slice(0, 4) : [
              { id: 'h1', name: 'Royal Emerald Necklace', price: 156000, img: 'https://images.unsplash.com/photo-1608042314453-ae338d80c427?auto=format&fit=crop&w=500&q=80' },
              { id: 'h2', name: 'Temple Jhumka Earrings', price: 98000, img: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=500&q=80' },
              { id: 'h3', name: 'Kundan Bangle Set', price: 72000, img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=500&q=80' },
              { id: 'h4', name: 'Regal Emerald Ring', price: 88000, img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=80' }
            ]).map((item, idx) => (
              <div key={idx} className="heritage-card-box" onClick={() => setSelectedProduct(item)} style={{ cursor: 'pointer' }}>
                <div className="h-img-wrap">
                  <img src={img(item.imageUrl || item.img)} alt={item.name} />
                </div>
                <div className="h-body">
                  <div className="h-title">{item.name}</div>
                  <div className="h-price">₹{item.price?.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. OUR STORY SECTION ── */}
      <section className="our-story-section">
        <div className="our-story-container">
          <div className="story-image-mosaic">
            <img
              src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"
              alt="Crafted with Passion & Purpose"
            />
          </div>
          <div className="story-content">
            <div className="story-badge">Our Story</div>
            <h2 className="story-title">Crafted with Passion &amp; Purpose</h2>
            <p className="story-desc">
              At Nanjal Collection, we believe jewellery is more than an accessory — it's a legacy. Every piece is thoughtfully designed and meticulously crafted by skilled artisans, celebrating India's rich heritage while embracing modern sensibilities.
            </p>
            <button
              className="heritage-view-btn"
              onClick={() => { setActiveTab('trials'); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              Explore Sample Trials →
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. 4 TRUST BADGES STRIP ── */}
      <section className="trust-badges-strip">
        <div className="trust-badges-container">
          <div className="trust-badge-item">
            <div className="trust-icon">💎</div>
            <div className="trust-title">Certified Authenticity</div>
            <div className="trust-sub">100% Hallmark Certified</div>
          </div>
          <div className="trust-badge-item">
            <div className="trust-icon">🌿</div>
            <div className="trust-title">Artisan Craftsmanship</div>
            <div className="trust-sub">Handcrafted by Skilled Artisans</div>
          </div>
          <div className="trust-badge-item">
            <div className="trust-icon">🛡️</div>
            <div className="trust-title">Secure Payments</div>
            <div className="trust-sub">Safe &amp; Encrypted Razorpay Transactions</div>
          </div>
          <div className="trust-badge-item">
            <div className="trust-icon">🚚</div>
            <div className="trust-title">Worldwide Shipping</div>
            <div className="trust-sub">Luxury Delivered to Your Doorstep</div>
          </div>
        </div>
      </section>

      {/* ── 5. NEWSLETTER STRIP ── */}
      <section className="newsletter-strip">
        <div className="newsletter-container">
          <div className="newsletter-info">
            <h4>Join Our Nanjal Circle</h4>
            <p>Be the first to know about new collections, exclusive offers and secret previews.</p>
          </div>
          <form className="newsletter-form" onSubmit={e => { e.preventDefault(); showToast('Thank you for subscribing to Nanjal Circle!') }}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      {/* MAIN CATALOG */}
      <main className="main-wrap" id="catalog">
        <div className="catalog-header">
          <div className="category-chips">
            {categories.map(c => (
              <button key={c} className={`cat-chip ${c === selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            {activeTab === 'trials' && <option value="points-low">1 Point First</option>}
            {activeTab === 'shop' && <option value="price-low">Price: Low → High</option>}
            {activeTab === 'shop' && <option value="price-high">Price: High → Low</option>}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Loading exquisite creations...
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 12 }}>No results found.</p>
            <button className="cat-chip active" onClick={() => { setSelectedCat('All'); setSearch('') }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {displayed.map(p =>
              activeTab === 'trials' ? (
                <TrialCard
                  key={p.id}
                  product={p}
                  inBox={trialBox.some(i => i.id === p.id)}
                  onToggle={handleToggleTrial}
                  pointsRemaining={pointsRemaining}
                  onOpenDetail={setSelectedProduct}
                />
              ) : (
                <ShopCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                  onOpenDetail={setSelectedProduct}
                />
              )
            )}
          </div>
        )}

        {/* FAQ */}
        <section className="faq-section">
          <h3>How Nanjal Trial Works</h3>
          {[
            ['What is the Trial Points system?', 'Every customer gets up to 5 Trial Points to use. Each jewellery sample costs 1–5 points depending on the piece. Browse the Trials tab, pick what you love using your points — no pricing shown, just points!'],
            ['How do I place a Trial order?', 'Create a free account and verify your email. Then add samples to your Trial Box using your points, fill in your delivery address, and confirm. We will pack and ship your selected pieces to you.'],
            ['Is there any cost for a Trial?', 'A small service fee of ₹199 covers premium velvet packaging, anti-tarnish inserts, and insured door-to-door express delivery across India. The jewellery samples themselves are completely free with your trial points.'],
            ['How does email verification work?', 'When you sign up, we send a verification link to your email. Click the link to activate your account. You must verify your email before placing any order — no OTP required, just one click!'],
            ['What emails will I receive?', 'You will get a confirmation email when your order is placed, a shipping notification with your tracking ID when your order is dispatched, and a delivery confirmation once it arrives.'],
            ['What is the return policy?', 'We offer a hassle-free 3-day return window from the date of delivery. If you are not satisfied with what you received, contact us and we will arrange a pickup.'],
            ['Can I buy full-size after trying?', 'Absolutely! After trying samples at home — checking the feel, weight, finish, and fit — head to our Shop tab to purchase full-size heirloom pieces. We have Bridal, Polki, Temple, and more!'],
            ['How does stock work?', 'Each product has limited inventory. Once a product is out of stock it will show as "Unavailable". Stock is automatically restored if an order is cancelled.'],
          ].map(([q, a]) => (
            <div key={q} className="faq-item">
              <div className="faq-q"><span>{q}</span><span>▾</span></div>
              <div className="faq-a">{a}</div>
            </div>
          ))}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h4 style={{ fontFamily: 'Cinzel', color: '#f59e0b', fontSize: '1.1rem' }}>Nanjal Collection</h4>
            <p>India's pioneering artisanal jewellery sampling house. Try genuine samples, verify finish & fit, then buy with confidence.</p>
          </div>
          <div className="footer-col">
            <h4>Trial Program</h4>
            <p>• 6 Trial Points per customer</p>
            <p>• ₹199 Discovery Delivery Fee</p>
            <p>• 100% Cashback to Nanjal Wallet</p>
            <p>• Free Silk Keepsake Pouch (3+ Pts)</p>
          </div>
          <div className="footer-col">
            <h4>Assurance</h4>
            <p>• 100% Skin Safe & Nickel Free</p>
            <p>• Certified Gemstones & Polki</p>
            <p>• Insured Pan-India Transit</p>
            <p>• OTP-Secured Delivery</p>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Nanjal Collection. All Rights Reserved.</div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {authModal && (
        <AuthModal
          onVerified={handleAuthSuccess}
          onClose={() => setAuthModal(null)}
        />
      )}

      {/* ── TRIAL BOX DRAWER ── */}
      {isTrialDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setIsTrialDrawerOpen(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                ⚡ Trial Discovery Box
                <span style={{ fontSize: '0.8rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 9999, marginLeft: 8 }}>
                  {pointsUsed}/{MAX_TRIAL_POINTS} Pts
                </span>
              </div>
              <button className="close-drawer-btn" onClick={() => setIsTrialDrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-content">
              {trialBox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem' }}>📦</div>
                  <h4>Your Trial Box is Empty</h4>
                  <p>Browse Trial Samples and add items using your 6 Trial Points.</p>
                </div>
              ) : (
                <>
                  {/* Verified phone banner */}
                  {currentUser && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', color: '#065f46', fontWeight: 700, marginBottom: 12 }}>
                      <span>✓</span>
                      <span>Logged in as: {currentUser.email}</span>
                    </div>
                  )}

                  {trialBox.map(item => (
                    <div key={item.id} className="drawer-item">
                      <img src={img(item.imageUrl)} alt={item.name} />
                      <div className="drawer-item-info">
                        <div className="drawer-item-title">{item.name}</div>
                        <div className="drawer-item-pts">⚡ {item.trialPoints || 1} Trial Point</div>
                        <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>{item.category}</div>
                      </div>
                      <button className="remove-item-btn" onClick={() => handleToggleTrial(item)}>Remove</button>
                    </div>
                  ))}

                  {freeGiftUnlocked && (
                    <div className="free-gift-box">
                      <span className="gift-icon">🎁</span>
                      <div>
                        <div className="free-gift-title">Complimentary Gift Unlocked!</div>
                        <div className="free-gift-desc">Silk Velvet Pouch + Anti-Tarnish Bar (Worth ₹299) — FREE</div>
                      </div>
                    </div>
                  )}

                  <div className="cashback-promise-box">
                    <span className="coin-icon">💰</span>
                    <div className="cashback-promise-text">
                      <h4>100% Cashback Guaranteed</h4>
                      <p>Pay ₹{TRIAL_SERVICE_FEE} fee → get ₹{TRIAL_SERVICE_FEE} back in Nanjal Wallet instantly!</p>
                    </div>
                  </div>

                  <div className="bill-summary">
                    <div className="bill-row"><span>Samples Value (via Trial Points)</span><span style={{ textDecoration: 'line-through', color: '#aaa' }}>Covered by Points</span></div>
                    <div className="bill-row"><span>Packaging & Courier Fee</span><span>₹{TRIAL_SERVICE_FEE}</span></div>
                    <div className="bill-row highlight"><span>Cashback to Wallet</span><span>+ ₹{TRIAL_SERVICE_FEE}</span></div>
                    <div className="bill-row total"><span>Net Payable</span><span>₹{TRIAL_SERVICE_FEE}</span></div>
                  </div>

                  <form id="trialForm" className="checkout-form" onSubmit={handlePlaceTrialOrder}>
                    <h4>Delivery Details</h4>
                    <input placeholder="Phone Number *" required value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} />
                    <textarea placeholder="Full Delivery Address *" required rows={2} value={checkoutForm.address} onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))} />
                    <div className="form-row-2">
                      <input placeholder="City *" required value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))} />
                      <input placeholder="Pincode *" required value={checkoutForm.pincode} onChange={e => setCheckoutForm(f => ({ ...f, pincode: e.target.value }))} />
                    </div>
                  </form>
                </>
              )}
            </div>

            {trialBox.length > 0 && (
              <div className="drawer-footer">
                <button type="submit" form="trialForm" className="checkout-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Placing Order...' : `Place Trial Order • ₹${TRIAL_SERVICE_FEE} (Get ₹${TRIAL_SERVICE_FEE} back)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SHOP CART DRAWER ── */}
      {isShopDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setIsShopDrawerOpen(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                🛍️ Shopping Bag
                <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: 9999, marginLeft: 8 }}>
                  {shopCart.reduce((s, i) => s + i.qty, 0)} items
                </span>
              </div>
              <button className="close-drawer-btn" onClick={() => setIsShopDrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-content">
              {shopCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem' }}>💎</div>
                  <h4>Your Bag is Empty</h4>
                  <p>Browse our full-size luxury collections!</p>
                </div>
              ) : (
                <>
                  {currentUser && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', color: '#065f46', fontWeight: 700, marginBottom: 12 }}>
                      <span>✓</span>
                      <span>Logged in as: {currentUser.email}</span>
                    </div>
                  )}

                  {shopCart.map(({ product, qty }) => (
                    <div key={product.id} className="drawer-item">
                      <img src={img(product.imageUrl)} alt={product.name} />
                      <div className="drawer-item-info">
                        <div className="drawer-item-title">{product.name}</div>
                        <div className="drawer-item-price">₹{(product.price * qty).toLocaleString('en-IN')}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                          {[[-1, '−'], [1, '+']].map(([delta, label]) => (
                            <button key={delta} onClick={() => updateCartQty(product.id, delta)} style={{ width: 26, height: 26, borderRadius: 6, background: '#f0ebe1', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>
                              {label}
                            </button>
                          ))}
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{qty}</span>
                        </div>
                      </div>
                      <button className="remove-item-btn" onClick={() => updateCartQty(product.id, -qty)}>✕</button>
                    </div>
                  ))}

                  <div className="bill-summary">
                    <div className="bill-row"><span>Subtotal</span><span>₹{shopSubtotal.toLocaleString('en-IN')}</span></div>
                    <div className="bill-row"><span>Shipping</span><span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span></div>
                    <div className="bill-row total"><span>Total Payable</span><span>₹{shopTotal.toLocaleString('en-IN')}</span></div>
                  </div>

                  <form id="shopForm" className="checkout-form" onSubmit={handlePlaceShopOrder}>
                    <h4>Delivery Details</h4>
                    <input placeholder="Phone Number *" required value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} />
                    <textarea placeholder="Full Delivery Address *" required rows={2} value={checkoutForm.address} onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))} />
                    <div className="form-row-2">
                      <input placeholder="City *" required value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))} />
                      <input placeholder="Pincode *" required value={checkoutForm.pincode} onChange={e => setCheckoutForm(f => ({ ...f, pincode: e.target.value }))} />
                    </div>
                  </form>
                </>
              )}
            </div>

            {shopCart.length > 0 && (
              <div className="drawer-footer">
                <button type="submit" form="shopForm" className="checkout-submit-btn shop-checkout-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Placing Order...' : `Pay ₹${shopTotal.toLocaleString('en-IN')} • Confirm Order`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL MODAL ── */}
      {selectedProduct && (() => {
        const allImgs = selectedProduct.imageUrls
          ? selectedProduct.imageUrls.split(',').filter(Boolean)
          : [selectedProduct.imageUrl].filter(Boolean)
        return (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="detail-modal-card" onClick={e => e.stopPropagation()}>
            <button className="close-modal-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <DetailGallery images={allImgs} productName={selectedProduct.name} />

            <div className="detail-content">
              <div className="card-cat">{selectedProduct.category}</div>
              <h2 style={{ fontFamily: 'Cinzel', fontSize: '1.3rem', marginBottom: 8 }}>{selectedProduct.name}</h2>
              <div className="rating-row">
                <span className="stars">★ {selectedProduct.rating || 4.8}</span>
                <span>({selectedProduct.ratingCount || 50} reviews)</span>
              </div>
              <div className="price-row" style={{ margin: '14px 0' }}>
                <span className="selling-price" style={{ fontSize: '1.4rem' }}>₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                {selectedProduct.originalPrice && (
                  <span className="original-price">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                )}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                {selectedProduct.description}
              </p>
              <div style={{ background: '#fdfaf3', padding: 12, borderRadius: 8, border: '1px solid #f0ebe1', marginBottom: 20, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📦</span>
                <span><strong>3-Day Returns:</strong> Hassle-free returns available within 3 days of delivery.</span>
              </div>
              <button className="add-cart-btn" onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null) }}>
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── ORDER CONFIRMATION ── */}
      {orderConfirmation && (
        <div className="modal-backdrop" onClick={() => setOrderConfirmation(null)}>
          <div className="success-modal-card" onClick={e => e.stopPropagation()}>
            <div className="success-icon-wrap">✓</div>
            <h2>Order Confirmed! 🎉</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Order #{orderConfirmation.id} is being prepared for dispatch.
            </p>
            {orderConfirmation.cashbackEarned > 0 && (
              <div className="success-cashback-badge">
                <span>💰</span>
                <span>₹{orderConfirmation.cashbackEarned} credited to your Nanjal Wallet!</span>
              </div>
            )}
            <div style={{ background: '#faf9f6', padding: 14, borderRadius: 10, fontSize: '0.85rem', margin: '14px 0', textAlign: 'left' }}>
              <div><strong>Name:</strong> {orderConfirmation.customerName}</div>
              <div><strong>Phone:</strong> +91-{orderConfirmation.customerPhone}</div>
              <div><strong>Address:</strong> {orderConfirmation.address}, {orderConfirmation.city} – {orderConfirmation.pincode}</div>
              <div style={{ marginTop: 6 }}><strong>Paid:</strong> ₹{orderConfirmation.totalPayable}</div>
            </div>
            <button className="checkout-submit-btn" onClick={() => {
              setOrderConfirmation(null)
              if (orderConfirmation.orderType === 'TRIAL') setActiveTab('shop')
            }}>
              {orderConfirmation.orderType === 'TRIAL' ? 'Shop Full-Size with Cashback →' : 'Continue Shopping'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
