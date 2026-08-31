import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAddresses } from '../utils/addressCache';
import { useWishlist } from '../context/WishlistContext';
import {
  User, Mail, MapPin, Package, Heart, LogOut,
  ChevronRight, ShieldCheck, Clock, Award,
  LayoutDashboard, ShoppingBag, Store, ExternalLink,
  Camera, Settings, CheckCircle2, Save, X, Bell, Loader2,
  Plus, Trash2, Home, Edit3
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'identity');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: 'Kerala, India'
  });
  const navigate = useNavigate();

  // Address management state
  const { addresses, loading: addrLoading, invalidate: invalidateAddresses } = useAddresses(user);
  const [addrForm, setAddrForm] = useState({
    full_name: '', email: '', phone: '',
    address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', is_default: false
  });
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [showAddrForm, setShowAddrForm] = useState(false);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || 'Kerala, India'
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/');
      const list = response.data.results ?? (Array.isArray(response.data) ? response.data : []);
      setOrders(list);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'history') fetchOrders();
  }, [user, activeTab]);

  const openNewAddrForm = () => {
    setEditingAddrId(null);
    setAddrForm({
      full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '',
      address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false
    });
    setShowAddrForm(true);
  };

  const openEditAddrForm = (addr) => {
    setEditingAddrId(addr.id);
    setAddrForm({ ...addr });
    setShowAddrForm(true);
  };

  const cancelAddrForm = () => {
    setShowAddrForm(false);
    setEditingAddrId(null);
  };

  const handleSaveAddr = async (e) => {
    e.preventDefault();
    try {
      if (editingAddrId) {
        await api.put(`/shipping/addresses/${editingAddrId}/`, addrForm);
      } else {
        await api.post('/shipping/addresses/', addrForm);
      }
      invalidateAddresses();
      cancelAddrForm();
    } catch (err) {
      alert(err.userMessage || 'Failed to save address.');
    }
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/shipping/addresses/${id}/`);
      invalidateAddresses();
    } catch {
      alert('Failed to delete address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/shipping/addresses/${id}/`, { is_default: true });
      invalidateAddresses();
    } catch {
      alert('Failed to update default address.');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('type', 'avatar');

    try {
      const response = await api.post('/core/upload/', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = response.data.url;

      // Update user on backend
      await api.patch('/core/me/', { avatar_url: imageUrl });

      // Update local state
      updateUser({ avatar_url: imageUrl });
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Failed to update profile picture.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Split full_name into first and last for Django
      const names = formData.full_name.trim().split(' ');
      const first_name = names[0] || '';
      const last_name = names.slice(1).join(' ') || '';

      const response = await api.patch('/core/me/', {
        first_name,
        last_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location
      });

      updateUser(response.data);
      setIsEditing(false);
      // alert("Profile credentials updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save your changes.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'var(--brand-gold)' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Account Access</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.125rem', maxWidth: '500px', margin: '0 auto 3.5rem' }}>Please sign in to access your profile and order history.</p>
          <Link to="/login" className="btn btn-primary" style={{ padding: '1.125rem 3.5rem' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  const isSeller = user.role === 'grower' || user.is_verified_seller || user.username === 'aquaticexotica';

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name || user.username}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`;

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      {/* Profile Header */}
      <header style={{ marginBottom: '6rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3rem' }} className="slide-up">
        <div style={{ position: 'relative' }}>
          <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--brand-gold)', boxShadow: 'var(--shadow-lg)', padding: '6px', backgroundColor: 'white' }}>
            {avatarUploading ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '50%' }}>
                <Loader2 className="animate-spin" color="var(--brand-gold)" />
              </div>
            ) : (
              <img
                src={user.avatar_url || (isSeller && user.username === 'aquaticexotica' ? "/src/assets/sellers/aquatic_exotica_owner.png" : defaultAvatar)}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            )}
          </div>
          <input
            type="file"
            id="avatar-input"
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-input" style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'white', color: 'var(--bg-deep)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <Camera size={18} />
          </label>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {isSeller ? 'Verified Master Grower' : 'Verified Collector'}
            </span>
            {isSeller && <Award size={16} color="var(--brand-gold)" />}
          </div>
          <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>{user.full_name || user.username || 'Collector'}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Mail size={18} color="var(--brand-gold)" /> {user.email || 'No email provided'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MapPin size={18} color="var(--brand-gold)" /> {formData.location}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Clock size={18} color="var(--brand-gold)" /> Member since April 2024</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {[
          { key: 'identity', label: 'Identity' },
          { key: 'addresses', label: 'Addresses' },
          { key: 'history', label: 'Orders' },
          { key: 'wishlist', label: 'Wishlist' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'security', label: 'Security' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em',
              color: activeTab === tab.key ? 'var(--bg-deep)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--bg-deep)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 5vw, 4rem)', minWidth: 0, maxWidth: '800px', margin: '0 auto' }} className="slide-up">

        {activeTab === 'identity' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>Identity Details</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} style={{ color: 'var(--brand-gold)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Edit Credentials</button>
              ) : (
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button onClick={() => setIsEditing(false)} style={{ color: 'var(--text-secondary)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cancel</button>
                  <button onClick={handleUpdateProfile} style={{ color: 'var(--brand-green)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Save Changes</button>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border-subtle)', padding: '3.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '3.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid var(--border-subtle)', outline: 'none', fontWeight: 700, fontFamily: 'inherit' }}
                  />
                ) : (
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bg-deep)' }}>{user.full_name || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Username</label>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>@{user.username}</p>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>Primary identifier cannot be changed</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid var(--border-subtle)', outline: 'none', fontWeight: 700, fontFamily: 'inherit' }}
                  />
                ) : (
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bg-deep)' }}>{user.email || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Botanical Rank</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-gold)' }}>{isSeller ? 'Master Grower' : 'Elite Collector'}</p>
                  <CheckCircle2 size={20} color="var(--brand-gold)" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Home Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid var(--border-subtle)', outline: 'none', fontWeight: 700, fontFamily: 'inherit' }}
                  />
                ) : (
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bg-deep)' }}>{formData.location}</p>
                )}
              </div>
            </div>

            {isSeller && (
              <div style={{ marginTop: '3rem', padding: '2.5rem', backgroundColor: 'rgba(164, 137, 72, 0.05)', borderRadius: '24px', border: '1px dashed var(--brand-gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Award size={32} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Verified Studio Partner</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You are authorized to list and sell rare botanical specimens.</p>
                    </div>
                  </div>
                  <Link to="/seller/dashboard" style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manage Studio</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Saved Addresses</h3>
              {!showAddrForm && addresses.length < 5 && (
                <button onClick={openNewAddrForm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '50px', padding: '0.65rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Plus size={16} /> Add Address
                </button>
              )}
            </div>

            {addrLoading && !addresses.length ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading addresses...</div>
            ) : (
              <>
                {/* Address cards */}
                {!showAddrForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: addresses.length ? '2rem' : 0 }}>
                    {addresses.length === 0 && (
                      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '24px', border: '1px dashed var(--border-subtle)' }}>
                        <Home size={40} strokeWidth={1} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No saved addresses yet.</p>
                        <button onClick={openNewAddrForm} style={{ backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '50px', padding: '0.75rem 2rem', fontWeight: 700, cursor: 'pointer' }}>
                          Add Your First Address
                        </button>
                      </div>
                    )}
                    {addresses.map(addr => (
                      <div key={addr.id} style={{ backgroundColor: 'white', borderRadius: '20px', border: addr.is_default ? '2px solid var(--brand-green)' : '1px solid var(--border-subtle)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{addr.full_name}</span>
                            {addr.is_default && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 900, backgroundColor: 'var(--brand-green)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Default</span>
                            )}
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.25rem', lineHeight: 1.6 }}>
                            {addr.address_line1}{addr.address_line2 ? ', ' + addr.address_line2 : ''}, {addr.city}, {addr.state} {addr.pincode}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{addr.phone} · {addr.email}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <button onClick={() => openEditAddrForm(addr)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: 'var(--bg-deep)' }}>
                            <Edit3 size={13} /> Edit
                          </button>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.id)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-green)', cursor: 'pointer', textDecoration: 'underline' }}>
                              Set as default
                            </button>
                          )}
                          <button onClick={() => handleDeleteAddr(addr.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit form */}
                {showAddrForm && (
                  <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>
                        {editingAddrId ? 'Edit Address' : 'New Address'}
                      </h4>
                      <button onClick={cancelAddrForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAddr}>
                      {(() => {
                        const iStyle = { width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
                        const lStyle = { display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.5rem' };
                        const af = (field) => e => setAddrForm(prev => ({ ...prev, [field]: e.target.value }));
                        return (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                              <div>
                                <label style={lStyle}>Full Name *</label>
                                <input required type="text" value={addrForm.full_name} onChange={af('full_name')} style={iStyle} />
                              </div>
                              <div>
                                <label style={lStyle}>Mobile *</label>
                                <input required type="tel" value={addrForm.phone} onChange={af('phone')} style={iStyle} />
                              </div>
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                              <label style={lStyle}>Email *</label>
                              <input required type="email" value={addrForm.email} onChange={af('email')} style={iStyle} />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                              <label style={lStyle}>Address Line 1 *</label>
                              <input required placeholder="House no., street, landmark" value={addrForm.address_line1} onChange={af('address_line1')} style={iStyle} />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                              <label style={lStyle}>Address Line 2 <span style={{ textTransform: 'none', fontWeight: 600 }}>(optional)</span></label>
                              <input placeholder="Apartment, area, etc." value={addrForm.address_line2} onChange={af('address_line2')} style={iStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                              <div>
                                <label style={lStyle}>City *</label>
                                <input required value={addrForm.city} onChange={af('city')} style={iStyle} />
                              </div>
                              <div>
                                <label style={lStyle}>State *</label>
                                <input required value={addrForm.state} onChange={af('state')} style={iStyle} />
                              </div>
                              <div>
                                <label style={lStyle}>PIN Code *</label>
                                <input required maxLength={6} value={addrForm.pincode} onChange={af('pincode')} style={iStyle} />
                              </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2rem' }}>
                              <input type="checkbox" checked={addrForm.is_default} onChange={e => setAddrForm(prev => ({ ...prev, is_default: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                              Set as default address
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button type="submit" disabled={addrLoading} style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                {addrLoading ? 'Saving...' : editingAddrId ? 'Update Address' : 'Save Address'}
                              </button>
                              <button type="button" onClick={cancelAddrForm} style={{ padding: '1rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </form>
                  </div>
                )}

                {addresses.length >= 5 && !showAddrForm && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>You've reached the maximum of 5 saved addresses.</p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>Order History</h3>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{orders.length} ARCHIVED ORDERS</span>
            </div>
            {loading ? (
              <div style={{ padding: '8rem', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
                <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>Syncing with botanical archive...</p>
              </div>
            ) : orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map(order => {
                  const isPaid = order.payment_status === 'captured' || order.payment_status === 'completed' || order.is_paid;
                  const isDelivered = order.status === 'delivered';
                  const statusColor = isDelivered ? 'var(--brand-green)' : 'var(--brand-gold)';
                  const statusBg = isDelivered ? 'rgba(34,197,94,0.08)' : 'rgba(164,137,72,0.08)';
                  const STATUS_LABELS = {
                    placed: 'Placed', processing: 'Processing', shipped: 'Shipped',
                    in_transit: 'In Transit', out_for_delivery: 'Out for Delivery',
                    delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
                  };
                  return (
                    <div key={order.id} style={{
                      backgroundColor: 'white', borderRadius: '20px',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.05)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>

                        {/* Left: icon + order meta */}
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--brand-gold)' }}>
                            <Package size={24} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--bg-deep)', fontSize: '1.05rem', marginBottom: '0.3rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.03em' }}>
                              {order.order_number || `#ACQ-${order.id.slice(0, 8)}`}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              <span>{order.items?.length || 0} {order.items?.length === 1 ? 'specimen' : 'specimens'}</span>
                              <span>·</span>
                              <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: amount + badges + CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--bg-deep)' }}>
                            ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                          </span>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: isPaid ? 'var(--brand-green)' : '#ef4444',
                              backgroundColor: isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                              padding: '0.35rem 0.75rem', borderRadius: '100px',
                              border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: statusColor, backgroundColor: statusBg,
                              padding: '0.35rem 0.75rem', borderRadius: '100px',
                              border: `1px solid ${statusColor}40`,
                            }}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          <Link
                            to={`/orders/${order.id}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.55rem 1.25rem', borderRadius: '100px',
                              backgroundColor: 'var(--bg-deep)', color: 'white',
                              fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                              letterSpacing: '0.08em', textDecoration: 'none',
                              whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                          >
                            View Order <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '8rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '48px', border: '1px solid var(--border-subtle)' }}>
                <ShoppingBag size={64} strokeWidth={1} style={{ marginBottom: '2rem', opacity: 0.1 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>No orders yet.</p>
                <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>Explore Collection</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>Curated Wishlist</h3>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{wishlist.length} SAVED SPECIMENS</span>
            </div>
            {wishlist.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem' }}>
                {wishlist.map(item => (
                  <Link to={`/product/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-card" style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <div style={{ height: '220px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                        <img src={item.image_url || item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                        <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)' }}>{item.name}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '1.1rem' }}>₹{item.price}</p>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase' }}>Available</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ padding: '8rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '48px', border: '1px solid var(--border-subtle)' }}>
                <Heart size={64} strokeWidth={1} style={{ marginBottom: '2rem', opacity: 0.1, color: '#ef4444' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>No items saved yet.</p>
                <Link to="/shop" className="btn btn-outline" style={{ padding: '1rem 3rem' }}>Begin Curation</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>Studio Updates</h3>
              <button style={{ color: 'var(--brand-gold)', fontWeight: 800, background: 'none', border: 'none', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mark all as read</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { title: 'New Arrival: Bucephalandra Black Cobra', time: '2 hours ago', type: 'new', msg: 'The legendary Black Cobra specimens from our recent Borneo import are now available.' },
                { title: 'Order Dispatched: #ACQ-2045', time: '1 day ago', type: 'order', msg: 'Your tropical specimen box has been cleared for priority shipping and is currently in transit.' },
                { title: 'Seasonal Insight: Monsoon Care', time: '3 days ago', type: 'insight', msg: 'Review our latest curator notes on managing high-humidity environments during the monsoon season.' }
              ].map((note, i) => (
                <div key={i} style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '1.5rem', position: 'relative' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--brand-gold)' }}>
                    {note.type === 'new' ? <Award size={24} /> : note.type === 'order' ? <Package size={24} /> : <Settings size={24} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{note.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{note.time}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{note.msg}</p>
                  </div>
                  {i === 0 && <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-gold)' }}></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="fade-in">
            <h3 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '3rem' }}>Security & Access</h3>
            <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border-subtle)', padding: '3.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '3rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)' }}>
                  <ShieldCheck size={32} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>Two-Factor Authentication</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>Secure your botanical archive with an additional verification layer.</p>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>Enable</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(164, 137, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                  <Award size={32} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>Verified Partner Protocol</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your account is strictly verified as a <strong style={{ color: 'var(--brand-gold)' }}>{isSeller ? 'Master Grower' : 'Verified Collector'}</strong>.</p>
                </div>
                <CheckCircle2 size={24} color="var(--brand-green)" style={{ marginLeft: 'auto' }} />
              </div>
            </div>
          </div>
        )}



        {/* Botanical Partner Section / Seller CTA */}
        <section style={{ backgroundColor: 'var(--bg-deep)', borderRadius: '48px', padding: '5rem', color: 'white', position: 'relative', overflow: 'hidden', marginTop: '2rem' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {!isSeller ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                    <Store size={32} />
                  </div>
                  <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)' }}>Botanical Collective</h3>
                </div>
                <p style={{ opacity: 0.8, fontSize: '1.25rem', maxWidth: '550px', marginBottom: '1.5rem', lineHeight: 1.8, fontWeight: 300 }}>
                  Junglyst curators are invited individually based on expertise, quality, and values. Our seller network is closed to direct applications.
                </p>
                <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '500px', lineHeight: 1.7 }}>
                  If you believe your collection aligns with our standards, contact us at <strong style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>hello@junglyst.com</strong>
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                    <Award size={32} />
                  </div>
                  <h3 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)' }}>Botanical Partner</h3>
                </div>
                <p style={{ opacity: 0.8, fontSize: '1.25rem', maxWidth: '550px', marginBottom: '3.5rem', lineHeight: 1.8, fontWeight: 300 }}>
                  You have successfully curated <strong style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>{orders.length} ARCHIVED SPECIMENS</strong>. Reach 10 to unlock exclusive first-access to rare seasonal imports and private studio tours.
                </p>
                <button className="btn btn-primary" style={{ backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', padding: '1.25rem 3.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>View Reward Status</button>
              </>
            )}
          </div>
          <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', fontSize: '20rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>🌿</div>
        </section>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .product-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
