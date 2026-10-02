import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, remindersApi } from '../lib/api';
import type { User, EmailConfig } from '../lib/api';
import { User as UserIcon, LogOut, Settings2, Moon, Globe, Mail, Send, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testEmailMessage, setTestEmailMessage] = useState('');
  const [reminderEmailInput, setReminderEmailInput] = useState('');
  const [reminderEmailDirty, setReminderEmailDirty] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user'],
    queryFn: authApi.me,
  });

  const { data: emailConfig } = useQuery<EmailConfig>({
    queryKey: ['emailConfig'],
    queryFn: remindersApi.getConfig,
  });

  // Sync the reminder email input when user data loads
  if (user && !reminderEmailDirty && reminderEmailInput !== (user.reminder_email || '')) {
    setReminderEmailInput(user.reminder_email || '');
  }

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['emailConfig'] });
    }
  });

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMutation.mutate({ theme: e.target.value });
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMutation.mutate({ timezone: e.target.value });
  };

  const handleDigestToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMutation.mutate({ digest_enabled: e.target.checked });
  };

  const handleDigestTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMutation.mutate({ digest_time: e.target.value });
  };

  const handleQuietStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMutation.mutate({ quiet_start: e.target.value });
  };

  const handleQuietEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMutation.mutate({ quiet_end: e.target.value });
  };

  const handleReminderEmailSave = () => {
    updateMutation.mutate({ reminder_email: reminderEmailInput || undefined });
    setReminderEmailDirty(false);
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus('sending');
    setTestEmailMessage('');
    try {
      const result = await remindersApi.sendTest();
      setTestEmailStatus('success');
      setTestEmailMessage(result.message || 'Test email sent!');
    } catch (err: any) {
      setTestEmailStatus('error');
      setTestEmailMessage(err.message || 'Failed to send test email');
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    width: '100%',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '0.5rem',
    borderRadius: '0.25rem',
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="header-greeting">⚙️ Settings</h1>
          <p className="header-date">Manage your account and preferences.</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem', maxWidth: '600px', paddingBottom: '4rem' }}>
        
        {/* Profile Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '1rem', borderRadius: '50%', color: 'white' }}>
              <UserIcon size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Account Details</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{isLoading ? 'Loading...' : user?.email}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Member Since</span>
              <span>{user ? new Date(user.created_at).toLocaleDateString() : '...'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Status</span>
              <span style={{ color: 'var(--priority-low)' }}>{user?.is_verified ? 'Verified' : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings2 size={24} /> Preferences
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Globe size={20} className="text-secondary" />
                <span>Timezone</span>
              </div>
              <select 
                style={selectStyle}
                value={user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={handleTimezoneChange}
                disabled={updateMutation.isPending}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Moon size={20} className="text-secondary" />
                <span>Theme</span>
              </div>
              <select 
                style={selectStyle}
                value={user?.theme || 'dark'}
                onChange={handleThemeChange}
                disabled={updateMutation.isPending}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email & Reminders Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={24} /> Email & Reminders
          </h2>

          {/* Email provider status */}
          <div style={{ 
            padding: '1rem', 
            background: emailConfig?.is_configured ? 'rgba(34, 197, 94, 0.08)' : 'rgba(250, 204, 21, 0.08)', 
            border: `1px solid ${emailConfig?.is_configured ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)'}`,
            borderRadius: '0.75rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {emailConfig?.is_configured ? (
              <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#facc15', flexShrink: 0 }} />
            )}
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Provider: {emailConfig?.provider || 'loading...'}
              </span>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {emailConfig?.is_configured 
                  ? `Emails will be sent to: ${emailConfig?.recipient}` 
                  : 'Email is set to console mode. Configure a provider in the backend .env file.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Reminder email field */}
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 500 }}>Reminder Email</span>
              </div>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Where should reminders be sent? Leave empty to use your login email.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="email" 
                  placeholder={user?.email || 'your@email.com'}
                  value={reminderEmailInput}
                  onChange={(e) => { 
                    setReminderEmailInput(e.target.value); 
                    setReminderEmailDirty(true); 
                  }}
                  style={inputStyle}
                  disabled={updateMutation.isPending}
                />
                {reminderEmailDirty && (
                  <button
                    onClick={handleReminderEmailSave}
                    disabled={updateMutation.isPending}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--accent-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Send test email */}
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>Test Email</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Send a test email to verify your setup works.
                  </p>
                </div>
                <button
                  onClick={handleSendTestEmail}
                  disabled={testEmailStatus === 'sending'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: testEmailStatus === 'success' 
                      ? 'rgba(34, 197, 94, 0.15)' 
                      : testEmailStatus === 'error' 
                        ? 'rgba(239, 68, 68, 0.15)' 
                        : 'rgba(99, 102, 241, 0.15)',
                    color: testEmailStatus === 'success' 
                      ? '#22c55e' 
                      : testEmailStatus === 'error' 
                        ? '#ef4444' 
                        : '#818cf8',
                    border: `1px solid ${testEmailStatus === 'success' 
                      ? 'rgba(34, 197, 94, 0.3)' 
                      : testEmailStatus === 'error' 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: '0.5rem',
                    cursor: testEmailStatus === 'sending' ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {testEmailStatus === 'sending' ? (
                    <>Sending...</>
                  ) : testEmailStatus === 'success' ? (
                    <><CheckCircle size={16} /> Sent!</>
                  ) : testEmailStatus === 'error' ? (
                    <><AlertCircle size={16} /> Failed</>
                  ) : (
                    <><Send size={16} /> Send Test</>
                  )}
                </button>
              </div>
              {testEmailMessage && (
                <p style={{ 
                  margin: '0.75rem 0 0', 
                  padding: '0.5rem 0.75rem',
                  background: testEmailStatus === 'success' 
                    ? 'rgba(34, 197, 94, 0.08)' 
                    : 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '0.5rem',
                  color: testEmailStatus === 'success' ? '#22c55e' : '#ef4444',
                  fontSize: '0.8rem',
                }}>
                  {testEmailMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={24} /> Notifications & Daily Digest
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span>Enable Daily Digest</span>
              <input 
                type="checkbox" 
                checked={user?.digest_enabled || false}
                onChange={handleDigestToggle}
                disabled={updateMutation.isPending}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span>Digest Time</span>
              <input 
                type="time" 
                value={user?.digest_time || ''}
                onChange={handleDigestTimeChange}
                disabled={updateMutation.isPending || !user?.digest_enabled}
                style={selectStyle}
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Moon size={24} /> Quiet Hours
          </h2>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>Mute notifications during this time window.</p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span>Quiet Hours Start</span>
              <input 
                type="time" 
                value={user?.quiet_start || ''}
                onChange={handleQuietStartChange}
                disabled={updateMutation.isPending}
                style={selectStyle}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span>Quiet Hours End</span>
              <input 
                type="time" 
                value={user?.quiet_end || ''}
                onChange={handleQuietEndChange}
                disabled={updateMutation.isPending}
                style={selectStyle}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <LogOut size={20} />
          Sign Out
        </button>

      </div>
    </div>
  );
}
