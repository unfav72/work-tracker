import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksApi, logsApi, statsApi } from '../lib/api';
import type { Work, WorkLog, StatsSummary } from '../lib/api';
import {
  CheckCircle2, Clock, MoreVertical, XCircle, Plus, Sparkles,
  TrendingUp, Target, Flame, X
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkPriority, setNewWorkPriority] = useState('medium');
  const [newWorkTime, setNewWorkTime] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data: works = [], isLoading: worksLoading } = useQuery<Work[]>({
    queryKey: ['works'],
    queryFn: () => worksApi.list(),
  });

  const { data: todayLogs = [] } = useQuery<WorkLog[]>({
    queryKey: ['todayLogs'],
    queryFn: logsApi.getToday,
  });

  const { data: stats } = useQuery<StatsSummary>({
    queryKey: ['stats'],
    queryFn: statsApi.summary,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (params: { workId: string; status: string }) =>
      logsApi.createOrUpdate({
        work_id: params.workId,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: params.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayLogs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const createWorkMutation = useMutation({
    mutationFn: worksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowAddWork(false);
      setNewWorkTitle('');
      setNewWorkPriority('medium');
      setNewWorkTime('');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: worksApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setMenuOpenId(null);
    },
  });

  const getWorkStatus = (workId: string): string => {
    const log = todayLogs.find((l) => l.work_id === workId);
    return log?.status || 'pending';
  };

  const handleToggle = (workId: string) => {
    const currentStatus = getWorkStatus(workId);
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    toggleStatusMutation.mutate({ workId, status: newStatus });
  };

  const handleSkip = (workId: string) => {
    toggleStatusMutation.mutate({ workId, status: 'skipped' });
    setMenuOpenId(null);
  };

  const handleAddWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkTitle.trim()) return;
    createWorkMutation.mutate({
      title: newWorkTitle.trim(),
      priority: newWorkPriority,
      time_of_day: newWorkTime || undefined,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      recurrence_type: 'daily',
    });
  };

  const completedCount = todayLogs.filter((l) => l.status === 'done').length;
  const totalCount = works.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedWorks = [...works].sort((a, b) => {
    const statusA = getWorkStatus(a.id) === 'done' ? 1 : 0;
    const statusB = getWorkStatus(b.id) === 'done' ? 1 : 0;
    if (statusA !== statusB) return statusA - statusB;
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) -
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpenId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (worksLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-pulse">
          <Sparkles size={32} />
          <span>Loading your day...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="header-greeting">
            {new Date().getHours() < 12 ? '🌅 Good Morning' :
             new Date().getHours() < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'}
          </h1>
          <p className="header-date">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Progress ring */}
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(250, 100%, 70%)" />
                <stop offset="100%" stopColor="hsl(200, 100%, 60%)" />
              </linearGradient>
            </defs>
            <circle
              className="progress-ring-bg"
              cx="60" cy="60" r="52"
              fill="none" strokeWidth="8"
            />
            <circle
              className="progress-ring-fill"
              cx="60" cy="60" r="52"
              fill="none" strokeWidth="8"
              strokeLinecap="round"
              stroke="url(#progressGrad)"
              strokeDasharray={`${progress * 3.267} 326.7`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="progress-ring-text">
            <span className="progress-value">{progress}</span>
            <span className="progress-percent">%</span>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <div className="stats-row">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Target size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.total_active_works ?? totalCount}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card stat-done">
          <div className="stat-icon"><Flame size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.completed_today ?? completedCount}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>
        <div className="stat-card stat-remaining">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{totalCount - completedCount}</span>
            <span className="stat-label">Left</span>
          </div>
        </div>
      </div>

      {/* Add work button */}
      <button className="add-work-btn" onClick={() => setShowAddWork(true)}>
        <Plus size={20} />
        <span>Add new work</span>
      </button>

      {/* Add work modal */}
      {showAddWork && (
        <div className="modal-overlay" onClick={() => setShowAddWork(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Work</h3>
              <button className="modal-close" onClick={() => setShowAddWork(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWork} className="modal-form">
              <div className="form-field">
                <label>Title</label>
                <input
                  type="text"
                  value={newWorkTitle}
                  onChange={(e) => setNewWorkTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Priority</label>
                  <div className="priority-select">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-option ${getPriorityColor(p)} ${newWorkPriority === p ? 'active' : ''}`}
                        onClick={() => setNewWorkPriority(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newWorkTime}
                    onChange={(e) => setNewWorkTime(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={createWorkMutation.isPending}>
                {createWorkMutation.isPending ? 'Creating...' : 'Add Work'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Works list */}
      <div className="works-list">
        {sortedWorks.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} className="empty-icon" />
            <h3>No works yet</h3>
            <p>Add your first daily work to get started!</p>
          </div>
        ) : (
          sortedWorks.map((work, index) => {
            const status = getWorkStatus(work.id);
            const isDone = status === 'done';
            const isSkipped = status === 'skipped';

            return (
              <div
                key={work.id}
                className={`work-card ${isDone ? 'work-done' : ''} ${isSkipped ? 'work-skipped' : ''}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="work-left">
                  <button
                    className={`work-check ${isDone ? 'checked' : ''}`}
                    onClick={() => handleToggle(work.id)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {isDone && <CheckCircle2 size={20} />}
                  </button>
                  <div className="work-info">
                    <h3 className={`work-title ${isDone ? 'completed' : ''}`}>
                      {work.title}
                    </h3>
                    <div className="work-meta">
                      {work.time_of_day && (
                        <span className="work-time">
                          <Clock size={12} /> {work.time_of_day}
                        </span>
                      )}
                      <span className={`work-priority ${getPriorityColor(work.priority)}`}>
                        {work.priority}
                      </span>
                      {work.recurrence_type !== 'one-time' && (
                        <span className="work-recurrence">
                          🔁 {work.recurrence_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="work-actions">
                  {!isDone && !isSkipped && (
                    <button
                      className="action-btn skip-btn"
                      onClick={() => handleSkip(work.id)}
                      title="Skip"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  <div className="menu-container">
                    <button
                      className="action-btn menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === work.id ? null : work.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpenId === work.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => archiveMutation.mutate(work.id)}>
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
