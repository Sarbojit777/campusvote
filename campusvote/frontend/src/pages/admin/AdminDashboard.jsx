import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import Spinner from '../../components/ui/Spinner';

/* ── Status Badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    upcoming: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    closed: 'bg-[#1a1a1a] text-[#a1a1aa] border-[#2a2a2a]',
    results_published: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  const labels = { active: 'Live', upcoming: 'Upcoming', closed: 'Closed', results_published: 'Results' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg[status] || cfg.closed}`}>
      {labels[status] || status}
    </span>
  );
}

/* ── Event Form Modal ─────────────────────────────────────── */
function EventFormModal({ onClose, onSave, event, institutions, admin }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startsAt: event?.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : '',
    endsAt: event?.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : '',
    institutionId: event?.institutionId || (admin.isSuperAdmin ? '' : admin.institutionId),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title || !form.startsAt || !form.endsAt) { setError('Title, start, and end dates are required'); return; }
    setError('');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg">
        <h3 className="text-lg font-semibold text-white mb-6">{event ? 'Edit Event' : 'Create Event'}</h3>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="label-caps mb-1.5 block">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="President Election — Student Council" />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Description</label>
            <textarea className="input-field min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-caps mb-1.5 block">Starts At</label>
              <input type="datetime-local" className="input-field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">Ends At</label>
              <input type="datetime-local" className="input-field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </div>
          </div>
          {admin.isSuperAdmin && (
            <div>
              <label className="label-caps mb-1.5 block">Institution</label>
              <select className="input-field" value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })}>
                <option value="">Select institution</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary flex items-center justify-center gap-2" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Modal ──────────────────────────────────────────── */
function StatsModal({ eventId, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    api.get(`/admin/events/${eventId}/stats`)
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Live Stats</h3>
          <div className="flex items-center gap-2">
            <button onClick={fetchStats} className="text-xs text-[#52525b] hover:text-[#a1a1aa] border border-[#2a2a2a] rounded-lg px-2 py-1">
              ↻ Refresh
            </button>
            <button onClick={onClose} className="text-[#52525b] hover:text-white text-xl leading-none">×</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
                <p className="text-[#52525b] text-xs mt-1">Total Votes</p>
              </div>
              <div className="flex-1 bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{stats.participationPercent}%</p>
                <p className="text-[#52525b] text-xs mt-1">Participation</p>
              </div>
            </div>
            <div className="space-y-3">
              {stats.candidates.sort((a, b) => b.voteCount - a.voteCount).map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{c.name}</span>
                    <span className="text-xs text-[#a1a1aa]">{c.voteCount} ({c.votePercent}%)</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                    <div className="h-2 rounded-full bg-white/30 transition-all" style={{ width: `${c.votePercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Add Candidate Form ───────────────────────────────────── */
function AddCandidateForm({ eventId, onAdded }) {
  const [form, setForm] = useState({ name: '', bio: '', position: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.position) { setError('Name and position are required'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('bio', form.bio);
      fd.append('position', form.position);
      if (photo) fd.append('photo', photo);
      const { data } = await api.post(`/admin/events/${eventId}/candidates`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onAdded(data);
      setForm({ name: '', bio: '', position: '' });
      setPhoto(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-6">
      <h4 className="text-sm font-semibold text-white mb-4">Add Candidate</h4>
      {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Position (e.g. President)" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </div>
        <textarea className="input-field min-h-[64px] resize-none" placeholder="Short bio (optional)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

        <div
          className="border border-dashed border-[#2a2a2a] rounded-xl p-4 text-center cursor-pointer hover:border-[#3a3a3a] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded-xl mx-auto" />
          ) : (
            <div className="text-[#52525b] text-sm">
              <p className="text-2xl mb-1">📷</p>
              <p>Click to upload photo</p>
              <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        <button className="btn-primary flex items-center justify-center gap-2" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Add Candidate'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Admin Dashboard ─────────────────────────────────── */
const TABS = ['Events', 'Candidates', 'Results', 'Settings'];

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('Events');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [statsEventId, setStatsEventId] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [publishConfirm, setPublishConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchEvents();
    api.get('/institutions').then(({ data }) => setInstitutions(data));
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/admin/events')
      .then(({ data }) => { setEvents(data); if (!selectedEvent) setSelectedEvent(data[0] || null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const saveEvent = async (form) => {
    if (editingEvent) {
      const { data } = await api.put(`/admin/events/${editingEvent.id}`, form);
      setEvents((evs) => evs.map((e) => e.id === data.id ? { ...e, ...data } : e));
    } else {
      const { data } = await api.post('/admin/events', form);
      setEvents((evs) => [data, ...evs]);
    }
    setEditingEvent(null);
  };

  const deleteEvent = async (eventId) => {
    setActionLoading(eventId);
    try {
      await api.delete(`/admin/events/${eventId}`);
      setEvents((evs) => evs.filter((e) => e.id !== eventId));
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete this event');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const publishResults = async (eventId) => {
    setActionLoading(eventId);
    try {
      await api.post(`/admin/events/${eventId}/publish-results`);
      setEvents((evs) => evs.map((e) => e.id === eventId ? { ...e, status: 'results_published', resultsPublished: true } : e));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot publish results');
    } finally {
      setActionLoading(null);
      setPublishConfirm(null);
    }
  };

  const deleteCandidate = async (candidateId) => {
    try {
      await api.delete(`/admin/events/${selectedEvent.id}/candidates/${candidateId}`);
      setSelectedEvent((e) => ({ ...e, candidates: e.candidates?.filter((c) => c.id !== candidateId) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete candidate');
    }
  };

  const handleLogout = () => { logout(); nav('/'); };

  const closedEvents = events.filter((e) => e.status === 'closed' || e.status === 'results_published');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-[#2a2a2a]">
          <p className="text-white font-semibold">CampusVote</p>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-medium text-accent-amber">Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${tab === t ? 'bg-[#1a1a1a] text-white' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a]/50'}`}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#2a2a2a]">
          <div className="text-xs text-[#52525b] px-3 mb-2 truncate">{admin?.email}</div>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#52525b] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-[#2a2a2a]">
          <button onClick={() => setSidebarOpen(true)} className="text-[#a1a1aa] hover:text-white text-xl">☰</button>
          <span className="text-white font-semibold">CampusVote Admin</span>
        </header>

        <div className="p-6 max-w-5xl">
          {/* Events Tab */}
          {tab === 'Events' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Events</h2>
                <button
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                >
                  + New Event
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[#a1a1aa]">No events yet. Create your first election.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={event.status} />
                          {admin?.isSuperAdmin && <span className="text-xs text-[#52525b]">{event.institutionName}</span>}
                        </div>
                        <p className="font-medium text-white truncate">{event.title}</p>
                        <p className="text-xs text-[#52525b] mt-1">
                          {new Date(event.startsAt).toLocaleDateString()} — {new Date(event.endsAt).toLocaleDateString()} · {event.voteCount} votes · {event.candidateCount} candidates
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className="text-xs text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 transition-colors"
                          onClick={() => setStatsEventId(event.id)}
                        >
                          Stats
                        </button>
                        {event.status === 'upcoming' && (
                          <button
                            className="text-xs text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 transition-colors"
                            onClick={() => { setEditingEvent(event); setShowEventModal(true); }}
                          >
                            Edit
                          </button>
                        )}
                        {!event.resultsPublished && (
                          <button
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg px-2.5 py-1.5 transition-colors"
                            onClick={() => setDeleteConfirm(event)}
                            disabled={actionLoading === event.id}
                          >
                            Delete
                          </button>
                        )}
                        <button
                          className="text-xs text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 transition-colors"
                          onClick={() => { setSelectedEvent(event); setTab('Candidates'); }}
                        >
                          Candidates
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Candidates Tab */}
          {tab === 'Candidates' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Candidates</h2>
              </div>

              {/* Event Selector */}
              <div className="mb-6">
                <label className="label-caps mb-2 block">Select Event</label>
                <select
                  className="input-field max-w-sm"
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const ev = events.find((x) => x.id === e.target.value);
                    if (ev) {
                      api.get(`/admin/events/${ev.id}/stats`).then(({ data }) => {
                        setSelectedEvent({ ...ev, candidates: data.candidates });
                      });
                    }
                  }}
                >
                  <option value="">Choose an event</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>

              {selectedEvent?.candidates?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedEvent.candidates.map((c) => (
                    <div key={c.id} className="card">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-[#1a1a1a] rounded-xl mb-3 flex items-center justify-center text-3xl font-bold text-[#52525b]">
                          {c.name[0]}
                        </div>
                      )}
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="label-caps mt-0.5">{c.position}</p>
                      {c.bio && <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2">{c.bio}</p>}
                      <button
                        onClick={() => deleteCandidate(c.id)}
                        className="mt-3 w-full text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#52525b] text-sm">No candidates yet for this event.</p>
              )}

              {selectedEvent && (
                <AddCandidateForm
                  eventId={selectedEvent.id}
                  onAdded={(c) => setSelectedEvent((e) => ({ ...e, candidates: [...(e.candidates || []), c] }))}
                />
              )}
            </div>
          )}

          {/* Results Tab */}
          {tab === 'Results' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Results Control</h2>
              {closedEvents.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[#a1a1aa]">No closed events to publish results for.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closedEvents.map((event) => (
                    <div key={event.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={event.status} />
                        </div>
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-xs text-[#52525b] mt-1">{event.voteCount} votes</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className="text-xs text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 transition-colors"
                          onClick={() => setStatsEventId(event.id)}
                        >
                          Preview Results
                        </button>
                        {!event.resultsPublished && (
                          <button
                            className="text-xs text-accent-amber hover:text-amber-300 border border-amber-500/20 rounded-lg px-2.5 py-1.5 transition-colors"
                            onClick={() => setPublishConfirm(event)}
                            disabled={actionLoading === event.id}
                          >
                            {actionLoading === event.id ? 'Publishing...' : 'Publish Results'}
                          </button>
                        )}
                        {event.resultsPublished && (
                          <span className="text-xs text-accent-green border border-green-500/20 rounded-lg px-2.5 py-1.5">
                            ✓ Published
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === 'Settings' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Settings</h2>
              <div className="card max-w-sm">
                <p className="label-caps mb-2">Account</p>
                <p className="text-sm text-white mb-1">{admin?.email}</p>
                <p className="text-xs text-[#52525b]">{admin?.isSuperAdmin ? 'Super Admin' : 'Institution Admin'}</p>
                {!admin?.isSuperAdmin && admin?.institutionId && (
                  <p className="text-xs text-[#52525b] mt-1">
                    Institution: {institutions.find((i) => i.id === admin.institutionId)?.name || admin.institutionId}
                  </p>
                )}
                <button onClick={handleLogout} className="btn-outline mt-4">Logout</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showEventModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
          onSave={saveEvent}
          institutions={institutions}
          admin={admin}
        />
      )}
      {statsEventId && <StatsModal eventId={statsEventId} onClose={() => setStatsEventId(null)} />}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-3">Delete Event</h3>
            <p className="text-[#a1a1aa] text-sm mb-6">
              Are you sure you want to delete <span className="text-white">"{deleteConfirm.title}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 rounded-xl py-3 font-medium transition-colors"
                onClick={() => deleteEvent(deleteConfirm.id)}
                disabled={actionLoading === deleteConfirm.id}
              >
                {actionLoading === deleteConfirm.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish confirmation */}
      {publishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-3">Publish Results</h3>
            <p className="text-[#a1a1aa] text-sm mb-6">
              Publish results for <span className="text-white">"{publishConfirm.title}"</span>? Results will become visible to all students. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => setPublishConfirm(null)}>Cancel</button>
              <button
                className="flex-1 bg-amber-500/20 text-accent-amber hover:bg-amber-500/30 border border-amber-500/20 rounded-xl py-3 font-medium transition-colors"
                onClick={() => publishResults(publishConfirm.id)}
                disabled={actionLoading === publishConfirm.id}
              >
                {actionLoading === publishConfirm.id ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
