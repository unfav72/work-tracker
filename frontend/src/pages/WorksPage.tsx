import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksApi } from '../lib/api';
import type { Work } from '../lib/api';
import { format } from 'date-fns';
import { Sparkles, Trash2, Clock, Plus, X, Edit2 } from 'lucide-react';
export default function WorksPage() {
  const queryClient = useQueryClient();

  const { data: works = [], isLoading } = useQuery<Work[]>({
    queryKey: ['works'],
    queryFn: () => worksApi.list(),
  });

  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkPriority, setNewWorkPriority] = useState('medium');
  const [newWorkTime, setNewWorkTime] = useState('');
  const [newWorkRecurrence, setNewWorkRecurrence] = useState('daily');

  const createWorkMutation = useMutation({
    mutationFn: worksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowAddWork(false);
      setNewWorkTitle('');
      setNewWorkPriority('medium');
      setNewWorkTime('');
      setNewWorkRecurrence('daily');
    },
  });

  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [editWorkTitle, setEditWorkTitle] = useState('');
  const [editWorkPriority, setEditWorkPriority] = useState('medium');
  const [editWorkTime, setEditWorkTime] = useState('');
  const [editWorkRecurrence, setEditWorkRecurrence] = useState('daily');

  const updateWorkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      worksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setEditingWork(null);
    },
  });

  const openEditModal = (work: Work) => {
    setEditingWork(work);
    setEditWorkTitle(work.title);
    setEditWorkPriority(work.priority);
    setEditWorkTime(work.time_of_day || '');
    setEditWorkRecurrence(work.recurrence_type || 'daily');
  };

  const handleUpdateWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork || !editWorkTitle.trim()) return;
    updateWorkMutation.mutate({
      id: editingWork.id,
      data: {
        title: editWorkTitle.trim(),
        priority: editWorkPriority,
        time_of_day: editWorkTime || undefined,
        recurrence_type: editWorkRecurrence,
        start_date: format(new Date(), 'yyyy-MM-dd'),
      },
    });
  };

  const handleAddWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkTitle.trim()) return;
    createWorkMutation.mutate({
      title: newWorkTitle.trim(),
      priority: newWorkPriority,
      time_of_day: newWorkTime || undefined,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      recurrence_type: newWorkRecurrence,
    });
  };

  const archiveMutation = useMutation({
    mutationFn: worksApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-pulse">
          <Sparkles size={32} />
          <span>Loading works...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="header-greeting">📋 All Works</h1>
          <p className="header-date">Manage all your works here.</p>
        </div>
      </header>

      <button className="add-work-btn" onClick={() => setShowAddWork(true)}>
        <Plus size={20} />
        <span>Add new work</span>
      </button>

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
              
              <div className="form-field">
                <label>Recurrence</label>
                <div className="priority-select" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  {['one-time', 'daily', 'weekly', 'monthly'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`priority-option ${newWorkRecurrence === r ? 'active priority-medium' : ''}`}
                      onClick={() => setNewWorkRecurrence(r)}
                    >
                      {r === 'one-time' ? 'Once' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
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
                  <label>Time (Optional)</label>
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

      <div className="works-list">
        {works.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} className="empty-icon" />
            <h3>No works found</h3>
            <p>Go to Today to add your first work.</p>
          </div>
        ) : (
          works.map((work) => (
            <div key={work.id} className="work-card">
              <div className="work-left">
                <div className="work-info">
                  <h3 className="work-title">{work.title}</h3>
                  <div className="work-meta">
                    {work.time_of_day && (
                      <span className="work-time">
                        <Clock size={12} /> {work.time_of_day}
                      </span>
                    )}
                    <span className={`work-priority ${getPriorityColor(work.priority)}`}>
                      {work.priority}
                    </span>
                    <span className="work-recurrence">
                      🔁 {work.recurrence_type}
                    </span>
                    <span className="work-recurrence">
                      📅 Started: {format(new Date(work.start_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="work-actions">
                <button
                  className="action-btn"
                  onClick={() => openEditModal(work)}
                  title="Edit Work"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className="action-btn"
                  onClick={() => archiveMutation.mutate(work.id)}
                  title="Archive Work"
                  disabled={archiveMutation.isPending}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingWork && (
        <div className="modal-overlay" onClick={() => setEditingWork(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Work</h3>
              <button className="modal-close" onClick={() => setEditingWork(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateWork} className="modal-form">
              <div className="form-field">
                <label>Title</label>
                <input
                  type="text"
                  value={editWorkTitle}
                  onChange={(e) => setEditWorkTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              
              <div className="form-field">
                <label>Recurrence</label>
                <div className="priority-select" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  {['one-time', 'daily', 'weekly', 'monthly'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`priority-option ${editWorkRecurrence === r ? 'active priority-medium' : ''}`}
                      onClick={() => setEditWorkRecurrence(r)}
                    >
                      {r === 'one-time' ? 'Once' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Priority</label>
                  <div className="priority-select">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-option ${getPriorityColor(p)} ${editWorkPriority === p ? 'active' : ''}`}
                        onClick={() => setEditWorkPriority(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label>Time (Optional)</label>
                  <input
                    type="time"
                    value={editWorkTime}
                    onChange={(e) => setEditWorkTime(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={updateWorkMutation.isPending}>
                {updateWorkMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
