import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import type { User } from '../lib/api';
import { User as UserIcon, LogOut, Settings2, Moon, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user'],
    queryFn: authApi.me,
  });

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}
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
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}
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
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}
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
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <span>Quiet Hours End</span>
              <input 
                type="time" 
                value={user?.quiet_end || ''}
                onChange={handleQuietEndChange}
                disabled={updateMutation.isPending}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}
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
