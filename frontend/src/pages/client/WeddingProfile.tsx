import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';

interface WeddingProfileData {
  id?: number;
  weddingDate: string;
  venueLocation: string;
  guestCount: number | '';
  budgetMin: number | '';
  budgetMax: number | '';
  preferredStyle: string;
  colorTheme: string;
  specialRequirements: string;
  servicesNeeded: string[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  is_completed: boolean;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
}

interface BookedVendor {
  booking_id: number;
  booking_status: string;
  event_date: string;
  total_amount: number;
  booked_at: string;
  vendor_id: number;
  business_name: string;
  vendor_name: string;
  category: string;
  phone: string;
  email: string;
  profile_image: string;
  rating: number;
  service_name: string;
  service_price: number;
}

interface RecommendedVendor {
  vendorId: number;
  businessName: string;
  vendorCategory: string;
  profileImage: string;
  city: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  serviceCategory: string;
  serviceImage: string;
  price: number;
  score: number;
  reasons: string[];
  matchType: 'excellent' | 'good' | 'fair';
}

interface RecommendationGroup {
  category: string;
  isBooked: boolean;
  vendors: RecommendedVendor[];
}

const STYLES = ['Classic', 'Modern', 'Rustic', 'Bohemian', 'Glamorous', 'Minimalist', 'Vintage', 'Garden', 'Beach'];
const CATEGORIES = ['Photography', 'Videography', 'Venues', 'Floristry', 'Beauty', 'Entertainment', 'Cake & Sweets', 'Planning', 'Car Rental'];

const WeddingProfile: React.FC = () => {
  const { client } = useClient();
  const [activeSection, setActiveSection] = useState<'profile' | 'tasks' | 'vendors' | 'recommendations'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile
  const [profile, setProfile] = useState<WeddingProfileData>({
    weddingDate: '', venueLocation: '', guestCount: '', budgetMin: '', budgetMax: '',
    preferredStyle: '', colorTheme: '', specialRequirements: '', servicesNeeded: []
  });

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Planning');

  // Booked Vendors
  const [bookedVendors, setBookedVendors] = useState<BookedVendor[]>([]);

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecommendationGroup[]>([]);
  const [topPicks, setTopPicks] = useState<RecommendedVendor[]>([]);
  const [recoStats, setRecoStats] = useState<any>(null);
  const [recoLoading, setRecoLoading] = useState(false);

  useEffect(() => {
    if (client?.id) {
      loadAll();
    }
  }, [client?.id]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadTasks(), loadBookedVendors(), loadRecommendations()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/wedding-profile/client/${client!.id}`);
      const data = await res.json();
      if (data) {
        setProfile({
          id: data.id,
          weddingDate: data.weddingDate ? new Date(data.weddingDate).toISOString().split('T')[0] : '',
          venueLocation: data.venueLocation || '',
          guestCount: data.guestCount || '',
          budgetMin: data.budgetMin || '',
          budgetMax: data.budgetMax || '',
          preferredStyle: data.preferredStyle || '',
          colorTheme: data.colorTheme || '',
          specialRequirements: data.specialRequirements || '',
          servicesNeeded: data.servicesNeeded || []
        });
      }
    } catch (err) { console.error('Error loading profile:', err); }
  };

  const loadRecommendations = async () => {
    setRecoLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/wedding-profile/recommendations/${client!.id}`);
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setTopPicks(data.topPicks || []);
        setRecoStats(data.stats || null);
      }
    } catch (err) { console.error('Error loading recommendations:', err); }
    setRecoLoading(false);
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/wedding-profile/tasks/${client!.id}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Error loading tasks:', err); }
  };

  const loadBookedVendors = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/wedding-profile/booked-vendors/${client!.id}`);
      const data = await res.json();
      setBookedVendors(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Error loading booked vendors:', err); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/wedding-profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client!.id, ...profile })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Create default tasks if first time
        await fetch('http://localhost:5000/api/wedding-profile/tasks/defaults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: client!.id })
        });
        loadTasks();
      }
    } catch (err) { console.error('Error saving:', err); }
    setSaving(false);
  };

  const toggleTask = async (taskId: number) => {
    try {
      await fetch(`http://localhost:5000/api/wedding-profile/tasks/${taskId}/toggle`, { method: 'PUT' });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
    } catch (err) { console.error('Error toggling task:', err); }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/wedding-profile/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client!.id, title: newTask, category: newTaskCategory })
      });
      if (res.ok) {
        setNewTask('');
        loadTasks();
      }
    } catch (err) { console.error('Error adding task:', err); }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await fetch(`http://localhost:5000/api/wedding-profile/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) { console.error('Error deleting task:', err); }
  };

  const toggleService = (cat: string) => {
    setProfile(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(cat)
        ? prev.servicesNeeded.filter(s => s !== cat)
        : [...prev.servicesNeeded, cat]
    }));
  };

  // Stats
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const daysUntilWedding = profile.weddingDate
    ? Math.max(0, Math.ceil((new Date(profile.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const totalBudgetUsed = bookedVendors.reduce((sum, v) => sum + Number(v.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Days Left</p>
          <p className="text-3xl font-bold text-purple-600">{daysUntilWedding !== null ? daysUntilWedding : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Set your date'}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tasks Done</p>
          <p className="text-3xl font-bold text-green-600">{completedTasks}/{totalTasks}</p>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #9333ea, #ec4899)' }}></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Booked Vendors</p>
          <p className="text-3xl font-bold text-blue-600">{bookedVendors.length}</p>
          <p className="text-xs text-gray-400 mt-1">{bookedVendors.filter(v => v.booking_status === 'confirmed').length} confirmed</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Budget Used</p>
          <p className="text-3xl font-bold text-amber-600">€{totalBudgetUsed.toLocaleString()}</p>
          {profile.budgetMax && <p className="text-xs text-gray-400 mt-1">of €{Number(profile.budgetMax).toLocaleString()} budget</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'profile' as const, label: 'Wedding Details', icon: '💍' },
          { id: 'tasks' as const, label: `Checklist (${completedTasks}/${totalTasks})`, icon: '✅' },
          { id: 'vendors' as const, label: `Booked Vendors (${bookedVendors.length})`, icon: '👥' },
          { id: 'recommendations' as const, label: `Suggestions (${topPicks.length})`, icon: '⭐' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSection === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ WEDDING DETAILS TAB ═══ */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Wedding Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Wedding Date</label>
              <input type="date" value={profile.weddingDate}
                onChange={e => setProfile(p => ({ ...p, weddingDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue / Location</label>
              <input type="text" value={profile.venueLocation} placeholder="e.g. Grand Hotel, Berlin"
                onChange={e => setProfile(p => ({ ...p, venueLocation: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Guests</label>
              <input type="number" value={profile.guestCount} placeholder="e.g. 150"
                onChange={e => setProfile(p => ({ ...p, guestCount: e.target.value ? parseInt(e.target.value) : '' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Wedding Style</label>
              <select value={profile.preferredStyle}
                onChange={e => setProfile(p => ({ ...p, preferredStyle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select a style...</option>
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Min (€)</label>
              <input type="number" value={profile.budgetMin} placeholder="e.g. 5000"
                onChange={e => setProfile(p => ({ ...p, budgetMin: e.target.value ? parseFloat(e.target.value) : '' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Max (€)</label>
              <input type="number" value={profile.budgetMax} placeholder="e.g. 20000"
                onChange={e => setProfile(p => ({ ...p, budgetMax: e.target.value ? parseFloat(e.target.value) : '' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Color Theme</label>
              <input type="text" value={profile.colorTheme} placeholder="e.g. Blush Pink & Gold"
                onChange={e => setProfile(p => ({ ...p, colorTheme: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          {/* Services Needed */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Services You Need</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => toggleService(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    profile.servicesNeeded.includes(cat)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requirements</label>
            <textarea rows={3} value={profile.specialRequirements} placeholder="Any special notes..."
              onChange={e => setProfile(p => ({ ...p, specialRequirements: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button onClick={saveProfile} disabled={saving}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
              {saving ? 'Saving...' : 'Save Wedding Profile'}
            </button>
            {saved && <span className="text-green-600 font-medium">Saved successfully!</span>}
          </div>
        </div>
      )}

      {/* ═══ TASKS CHECKLIST TAB ═══ */}
      {activeSection === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Wedding Checklist</h3>
            <span className="text-sm text-gray-500">{progressPercent}% complete</span>
          </div>

          {/* Add Task */}
          <div className="flex gap-2 mb-6">
            <input type="text" value={newTask} placeholder="Add a new task..."
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              {['Planning', ...CATEGORIES].filter((v, i, a) => a.indexOf(v) === i).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={addTask}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
              Add
            </button>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No tasks yet</p>
              <p className="text-sm">Save your wedding profile first to get a default checklist, or add tasks manually.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    task.is_completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-purple-200'
                  }`}>
                  <button onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}>
                    {task.is_completed && (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {task.category && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      task.is_completed ? 'bg-gray-100 text-gray-400' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {task.category}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    task.priority === 'high' ? 'bg-red-50 text-red-600' :
                    task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {task.priority}
                  </span>
                  <button onClick={() => deleteTask(task.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ BOOKED VENDORS TAB ═══ */}
      {activeSection === 'vendors' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Booked Vendors</h3>

          {bookedVendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No vendors booked yet</p>
              <p className="text-gray-400 text-sm mb-4">Start browsing vendors and book your first service!</p>
              <Link to="/search" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                Browse Vendors
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookedVendors.map(vendor => (
                <div key={vendor.booking_id}
                  className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-purple-200 transition-all">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                    {vendor.profile_image ? (
                      <img src={vendor.profile_image.startsWith('http') ? vendor.profile_image : `http://localhost:5000${vendor.profile_image}`}
                        alt="" className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      (vendor.business_name || 'V').charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/vendor/${vendor.vendor_id}`} className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                        {vendor.business_name || vendor.vendor_name}
                      </Link>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        vendor.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {vendor.booking_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{vendor.service_name || vendor.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Event: {vendor.event_date ? new Date(vendor.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>

                  {/* Price & Contact */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-gray-900">€{Number(vendor.total_amount).toLocaleString()}</p>
                    <div className="flex gap-2 mt-1">
                      {vendor.phone && (
                        <a href={`tel:${vendor.phone}`} className="text-xs text-purple-600 hover:underline">Call</a>
                      )}
                      {vendor.email && (
                        <a href={`mailto:${vendor.email}`} className="text-xs text-purple-600 hover:underline">Email</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Budget Summary */}
              <div className="mt-6 p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-purple-700">Total Booked Amount</span>
                  <span className="text-xl font-bold text-purple-700">€{totalBudgetUsed.toLocaleString()}</span>
                </div>
                {profile.budgetMax && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-purple-500 mb-1">
                      <span>Budget remaining</span>
                      <span>€{(Number(profile.budgetMax) - totalBudgetUsed).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-purple-100 rounded-full">
                      <div className="h-2 rounded-full bg-purple-500 transition-all"
                        style={{ width: `${Math.min(100, (totalBudgetUsed / Number(profile.budgetMax)) * 100)}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ RECOMMENDATIONS TAB ═══ */}
      {activeSection === 'recommendations' && (
        <div>
          {recoLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : recommendations.length === 0 && topPicks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suggestions yet</h3>
              <p className="text-gray-500 mb-4">Save your wedding details first (date, budget, services needed) and we'll suggest the best vendors for you!</p>
              <button onClick={() => setActiveSection('profile')}
                className="px-6 py-2.5 rounded-xl text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                Complete Your Profile
              </button>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              {recoStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-6 items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Found:</span>
                    <span className="font-semibold text-gray-900">{recoStats.totalFound} services</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Budget:</span>
                    <span className="font-semibold text-gray-900">{recoStats.budgetRange}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Categories needed:</span>
                    <span className="font-semibold text-gray-900">{recoStats.categoriesNeeded}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Already booked:</span>
                    <span className="font-semibold text-green-600">{recoStats.categoriesBooked}</span>
                  </div>
                  <button onClick={loadRecommendations} className="ml-auto text-sm text-purple-600 hover:underline font-medium">
                    Refresh
                  </button>
                </div>
              )}

              {/* Top Picks */}
              {topPicks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>⭐</span> Top Picks For You
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topPicks.map(vendor => (
                      <Link key={`${vendor.vendorId}-${vendor.serviceId}`}
                        to={`/vendor/${vendor.vendorId}`}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-purple-300 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                            {vendor.profileImage ? (
                              <img src={vendor.profileImage.startsWith('http') ? vendor.profileImage : `http://localhost:5000${vendor.profileImage}`}
                                alt="" className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : vendor.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">{vendor.businessName}</h4>
                            <p className="text-sm text-gray-500 truncate">{vendor.serviceName}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            vendor.matchType === 'excellent' ? 'bg-green-100 text-green-700' :
                            vendor.matchType === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {vendor.matchType === 'excellent' ? '95%+' : vendor.matchType === 'good' ? '80%+' : '60%+'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500 text-sm">★</span>
                            <span className="text-sm font-medium text-gray-900">{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                            <span className="text-xs text-gray-400">({vendor.totalReviews})</span>
                            {vendor.isVerified && <span className="text-xs text-green-600 font-bold ml-1">✓</span>}
                          </div>
                          <span className="font-bold text-purple-600">€{vendor.price}</span>
                        </div>
                        {vendor.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {vendor.reasons.slice(0, 2).map((r, i) => (
                              <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{r}</span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Category-wise Recommendations */}
              {recommendations.map(group => (
                <div key={group.category} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{group.category}</h3>
                    {group.isBooked ? (
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Already Booked</span>
                    ) : (
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Needs Booking</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.vendors.map(vendor => (
                      <Link key={`${vendor.vendorId}-${vendor.serviceId}`}
                        to={`/vendor/${vendor.vendorId}`}
                        className={`rounded-xl shadow-sm border p-5 transition-all group ${
                          group.isBooked ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-100 hover:border-purple-300 hover:shadow-md'
                        }`}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                            {vendor.profileImage ? (
                              <img src={vendor.profileImage.startsWith('http') ? vendor.profileImage : `http://localhost:5000${vendor.profileImage}`}
                                alt="" className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : vendor.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm truncate">{vendor.businessName}</h4>
                            <p className="text-xs text-gray-500 truncate">{vendor.serviceName}</p>
                          </div>
                          <span className="font-bold text-sm text-purple-600">€{vendor.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 text-xs">★ {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                          {vendor.isVerified && <span className="text-xs text-green-600 font-bold">✓ Verified</span>}
                          {vendor.city && <span className="text-xs text-gray-400">{vendor.city}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WeddingProfile;