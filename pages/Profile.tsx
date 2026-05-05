import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { User as UserIcon, Mail, Phone, MapPin, Building2, Shield, Star, Leaf, Truck, Award, ArrowLeft, Pencil, Check, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  consumer: { label: 'Customer', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: <UserIcon size={16} /> },
  retailer: { label: 'Retailer', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: <Building2 size={16} /> },
  charity: { label: 'Charity', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: <Leaf size={16} /> },
  volunteer: { label: 'Volunteer', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: <Truck size={16} /> },
  admin: { label: 'Admin', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: <Shield size={16} /> },
};

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate }) => {
  const role = roleConfig[user.role] || roleConfig.consumer;

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    organizationName: user.organizationName || '',
    vehicleType: user.vehicleType || '',
  });

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Validation helpers
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => !phone || /^\d{10}$/.test(phone.replace(/\D/g, ''));

  const getFieldErrors = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(form.email)) errors.email = 'Enter a valid email (must contain @)';
    if (form.phone && !validatePhone(form.phone)) errors.phone = 'Mobile number must be exactly 10 digits';
    if ((user.role === 'retailer' || user.role === 'charity') && !form.organizationName.trim()) errors.organizationName = 'Organization name is required';
    return errors;
  };

  const fieldErrors = isEditing ? getFieldErrors() : {};

  const handleStartEdit = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      organizationName: user.organizationName || '',
      vehicleType: user.vehicleType || '',
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveProfile = async () => {
    const errors = getFieldErrors();
    if (Object.keys(errors).length > 0) {
      setEditError('Please fix the errors below before saving.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, '') || '',
        address: form.address.trim(),
        organizationName: form.organizationName.trim(),
        vehicleType: form.vehicleType.trim(),
      });
      onUserUpdate(updated);
      setIsEditing(false);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => setEditSuccess(null), 3000);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirm password do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await api.changePassword(pwForm.oldPassword, pwForm.newPassword);
      setPwSuccess('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPwError(err?.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  // Fields config
  const fields: { key: keyof typeof form; label: string; icon: React.ReactNode; type?: string; placeholder?: string }[] = [
    { key: 'name', label: 'Full Name', icon: <UserIcon size={16} />, placeholder: 'Your full name' },
    ...(user.role === 'retailer' || user.role === 'charity'
      ? [{ key: 'organizationName' as const, label: 'Organization', icon: <Building2 size={16} />, placeholder: 'Organization name' }]
      : []),
    { key: 'email', label: 'Email Address', icon: <Mail size={16} />, type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Phone', icon: <Phone size={16} />, type: 'tel', placeholder: '10-digit mobile number' },
    { key: 'address', label: 'Address', icon: <MapPin size={16} />, placeholder: 'Your address' },
    ...(user.role === 'volunteer'
      ? [{ key: 'vehicleType' as const, label: 'Vehicle Type', icon: <Truck size={16} /> }]
      : []),
  ];

  // Stats
  const stats: { label: string; value: string | number; icon: React.ReactNode; color: string }[] = [];
  if (user.role === 'consumer') {
    stats.push({ label: 'Eco Points', value: user.ecoPoints || 0, icon: <Leaf size={18} />, color: 'from-emerald-500 to-green-600' });
  }
  if (user.role === 'retailer') {
    stats.push({ label: 'Credit Points', value: user.creditPoints || 0, icon: <Star size={18} />, color: 'from-amber-500 to-yellow-600' });
    stats.push({ label: 'Charity Points', value: user.charityPointsGained || 0, icon: <Award size={18} />, color: 'from-purple-500 to-violet-600' });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-eco-600 dark:hover:text-eco-400 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Success Toast */}
        {editSuccess && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <Check size={16} /> {editSuccess}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm overflow-hidden mb-6">
          <div className="h-28 bg-gradient-to-r from-eco-500 via-emerald-500 to-teal-500 relative">
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-900 border-4 border-white dark:border-dark-900 shadow-lg flex items-center justify-center text-3xl font-black text-eco-700 dark:text-eco-400">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : initials}
              </div>
            </div>
          </div>
          <div className="pt-16 px-6 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.name || 'User'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${role.bg} ${role.color}`}>
                {role.icon} {role.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Member since {joinedDate} • ID: {user.id}</p>
          </div>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className={`grid ${stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
            {stats.map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-sm`}>
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  {s.icon}
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <div className="text-3xl font-black">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Account Details */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Details</h3>
            {!isEditing ? (
              <button onClick={handleStartEdit} className="flex items-center gap-1.5 text-sm text-eco-600 hover:text-eco-700 font-semibold transition-colors">
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleSaveProfile} disabled={saving || Object.keys(fieldErrors).length > 0} className="flex items-center gap-1.5 text-sm bg-eco-600 text-white px-4 py-1.5 rounded-lg hover:bg-eco-700 disabled:opacity-50 font-semibold transition-colors">
                  <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancelEdit} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold transition-colors">
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>

          {editError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm">
              {editError}
            </div>
          )}

          <div className="space-y-1">
            {fields.map((f) => (
              <div key={f.key} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0 mt-2.5">
                  {f.icon}
                </div>
                <div className="flex-1 border-b border-gray-50 dark:border-dark-800 py-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">{f.label}</p>
                  {isEditing ? (
                    <div>
                      {f.key === 'vehicleType' ? (
                        <select
                          value={form.vehicleType}
                          onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                          className="w-full border border-gray-200 dark:border-dark-700 rounded-lg p-2 text-sm bg-white dark:bg-dark-800 dark:text-white focus:ring-2 focus:ring-eco-500 outline-none"
                        >
                          <option value="">Select...</option>
                          <option value="bike">Bicycle</option>
                          <option value="scooter">Scooter/Bike</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                      ) : (
                        <input
                          type={f.type || 'text'}
                          value={form[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.placeholder}
                          className={`w-full border rounded-lg p-2 text-sm bg-white dark:bg-dark-800 dark:text-white focus:ring-2 focus:ring-eco-500 outline-none transition-colors ${
                            fieldErrors[f.key] ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-dark-700'
                          }`}
                        />
                      )}
                      {fieldErrors[f.key] && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors[f.key]}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {(user as any)[f.key] || '—'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={18} /> Security
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Password</p>
              <p className="text-xs text-gray-400">••••••••</p>
            </div>
            <button
              onClick={() => { setShowPasswordModal(true); setPwError(null); setPwSuccess(null); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-eco-600 hover:text-eco-700 transition-colors"
            >
              <KeyRound size={14} /> Change Password
            </button>
          </div>
        </div>

      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-dark-700 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound size={20} className="text-eco-600" />
              <h4 className="text-xl font-bold dark:text-white">Change Password</h4>
            </div>

            {pwSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <Check size={16} /> {pwSuccess}
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {pwError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm">
                    {pwError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOld ? 'text' : 'password'}
                      required
                      value={pwForm.oldPassword}
                      onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                      className="w-full border border-gray-200 dark:border-dark-700 rounded-lg p-2.5 pr-10 text-sm bg-white dark:bg-dark-800 dark:text-white focus:ring-2 focus:ring-eco-500 outline-none"
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      className="w-full border border-gray-200 dark:border-dark-700 rounded-lg p-2.5 pr-10 text-sm bg-white dark:bg-dark-800 dark:text-white focus:ring-2 focus:ring-eco-500 outline-none"
                      placeholder="Min 6 characters"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwForm.newPassword && pwForm.newPassword.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Must be at least 6 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className={`w-full border rounded-lg p-2.5 text-sm bg-white dark:bg-dark-800 dark:text-white focus:ring-2 focus:ring-eco-500 outline-none ${
                      pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'border-red-400' : 'border-gray-200 dark:border-dark-700'
                    }`}
                    placeholder="Re-enter new password"
                  />
                  {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    disabled={pwSaving}
                    type="submit"
                    className="bg-eco-600 text-white py-2.5 rounded-lg font-semibold hover:bg-eco-700 disabled:opacity-60 transition-colors text-sm"
                  >
                    {pwSaving ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
