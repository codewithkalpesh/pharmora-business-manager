// src/pages/settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../api/auth.api';
import { PageHeader } from '../../components/common/PageHeader';
import {
  User, Shield, Building, Check, AlertCircle, RefreshCw, Key, Share2, Send, Link, Radio
} from 'lucide-react';

export function Settings() {
  const { user, fetchProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'business', 'groupLink'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Group Link Broadcaster fields
  const [groupForm, setGroupForm] = useState({
    groupWebhookUrl: user?.groupWebhookUrl || '',
    autoBroadcastEnabled: user?.autoBroadcastEnabled !== false,
  });

  useEffect(() => {
    if (user) {
      setGroupForm({
        groupWebhookUrl: user.groupWebhookUrl || '',
        autoBroadcastEnabled: user.autoBroadcastEnabled !== false,
      });
    }
  }, [user]);

  // Password fields
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Business profile fields
  const [businessForm, setBusinessForm] = useState({
    storeName: 'Pharmora Pharmacy',
    gstin: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    // Load local business settings if any
    const saved = localStorage.getItem('pbm_business_settings');
    if (saved) {
      try {
        setBusinessForm(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setBusinessForm({
        storeName: 'Pharmora Medical Store',
        gstin: '27AAAAA1111A1Z1',
        address: '123, Medical Square, Mumbai, Maharashtra 400001',
        phone: '+91 98765 43210',
        email: 'info@pharmora.com',
      });
    }
  }, []);

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await authApi.updateGroupWebhook(groupForm);
      if (fetchProfile) fetchProfile();
      setSuccess("Group link settings saved successfully! Every transaction will now be broadcasted.");
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save group link settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBroadcast = async () => {
    setError(null);
    setSuccess(null);
    if (!groupForm.groupWebhookUrl?.trim()) {
      setError("Please enter a Group Link / Webhook URL first.");
      return;
    }
    setLoading(true);
    try {
      await authApi.testGroupWebhook({ groupWebhookUrl: groupForm.groupWebhookUrl });
      setSuccess("Test broadcast message sent successfully! Check your group link.");
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send test broadcast. Check your URL.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    localStorage.setItem('pbm_business_settings', JSON.stringify(businessForm));
    setSuccess("Business settings updated successfully.");
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="App Settings"
        subtitle="Manage user profile, group transaction broadcasting, security, and shop details."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <User size={15} />
          My Profile
        </button>
        <button
          onClick={() => { setActiveTab('groupLink'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'groupLink'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Share2 size={15} />
          Group Link Broadcaster
        </button>
        <button
          onClick={() => { setActiveTab('security'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Shield size={15} />
          Security & Password
        </button>
        <button
          onClick={() => { setActiveTab('business'); setError(null); setSuccess(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'business'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Building size={15} />
          Business Profile
        </button>
      </div>

      {/* Notifications/Alert banners */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Active Tab View */}
      <div className="card p-6 border border-slate-800 bg-slate-900/40 rounded-2xl max-w-2xl">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Profile Details</h3>
              <p className="text-[11px] text-slate-450 mt-1">Your account identity info (Read-only)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="input cursor-not-allowed opacity-75"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input cursor-not-allowed opacity-75"
                />
              </div>

              <div className="input-group">
                <label className="input-label">System Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="input cursor-not-allowed opacity-75 font-semibold text-emerald-400 uppercase tracking-wider"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Status</label>
                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-400">
                  <Check size={15} /> Active System Account
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'groupLink' && (
          <form onSubmit={handleGroupSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Share2 size={16} className="text-emerald-400" />
                Group Link Broadcaster Settings
              </h3>
              <p className="text-[11px] text-slate-450 mt-1">
                Provide a group webhook or broadcast URL (Telegram Bot, WhatsApp Webhook, Discord Webhook, or custom HTTP endpoint). Every single transaction in the app will be shared automatically to this group.
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Group Link / Webhook URL</label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={groupForm.groupWebhookUrl}
                  onChange={(e) => setGroupForm({ ...groupForm, groupWebhookUrl: e.target.value })}
                  className="input pl-9 font-mono text-xs text-emerald-400"
                  placeholder="https://api.telegram.org/bot<token>/sendMessage?chat_id=<chat_id> or Webhook URL"
                />
                <Link size={15} className="absolute left-3 top-3 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports Telegram Bot API, Discord Webhooks, or standard JSON HTTP POST Webhooks.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
              <input
                type="checkbox"
                id="autoBroadcast"
                checked={groupForm.autoBroadcastEnabled}
                onChange={(e) => setGroupForm({ ...groupForm, autoBroadcastEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="autoBroadcast" className="text-xs text-slate-200 font-medium cursor-pointer">
                Automatically share every little transaction across the app in real-time
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary font-semibold"
              >
                {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
                Save Group Link
              </button>

              <button
                type="button"
                onClick={handleTestBroadcast}
                disabled={loading || !groupForm.groupWebhookUrl}
                className="btn btn-ghost border border-slate-700 text-slate-300 hover:text-white font-semibold flex items-center gap-1.5"
              >
                <Send size={14} className="text-emerald-400" />
                Send Test Message
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Update Password</h3>
              <p className="text-[11px] text-slate-450 mt-1">Ensure your account uses a long, random password to stay secure.</p>
            </div>

            <div className="input-group">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <div className="input-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input"
                placeholder="Min 6 characters"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary font-semibold mt-2"
            >
              {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
              <Key size={14} className="mr-1.5" />
              Update Password
            </button>
          </form>
        )}

        {activeTab === 'business' && (
          <form onSubmit={handleBusinessSubmit} className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Business Profile</h3>
              <p className="text-[11px] text-slate-450 mt-1">Used for document headers, GST billing reports, and custom invoice output details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Store / Business Name</label>
                <input
                  type="text"
                  required
                  value={businessForm.storeName}
                  onChange={(e) => setBusinessForm({ ...businessForm, storeName: e.target.value })}
                  className="input font-semibold"
                  placeholder="e.g. Pharmora Pharmacy"
                />
              </div>

              <div className="input-group">
                <label className="input-label">GSTIN / Registration Number</label>
                <input
                  type="text"
                  value={businessForm.gstin}
                  onChange={(e) => setBusinessForm({ ...businessForm, gstin: e.target.value })}
                  className="input uppercase font-mono"
                  placeholder="27AAAAA1111A1Z1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Business Phone</label>
                <input
                  type="text"
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  className="input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Business Email</label>
                <input
                  type="email"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  className="input"
                  placeholder="billing@pharmora.com"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Business Address</label>
              <textarea
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                className="input min-h-[80px] py-2"
                placeholder="Full store street address, City, Pin"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary font-semibold mt-2"
            >
              Save Changes
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Settings;
