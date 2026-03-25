import React, { useState, useEffect } from 'react';

interface BlockedDate {
  id: number;
  service_id: number;
  date: string;
  is_available: boolean;
  current_bookings: number;
}

interface Service {
  id: number;
  name: string;
  category: string;
}

interface AvailabilityManagementProps {
  vendorId: number;
}

const AvailabilityManagement: React.FC<AvailabilityManagementProps> = ({ vendorId }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Pending changes (not yet saved)
  const [pendingBlocks, setPendingBlocks] = useState<Set<string>>(new Set());
  const [pendingUnblocks, setPendingUnblocks] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchServices(); }, [vendorId]);
  useEffect(() => { if (selectedService) fetchAvailability(); }, [selectedService, currentMonth]);

  // Reset pending when service changes
  useEffect(() => { setPendingBlocks(new Set()); setPendingUnblocks(new Set()); }, [selectedService]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await fetch('http://localhost:5000/api/vendor/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setServices(list);
        if (list.length > 0) setSelectedService(list[0].id);
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const fetchAvailability = async () => {
    if (!selectedService) return;
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await fetch(`http://localhost:5000/api/availability/service/${selectedService}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedDates(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error('Error:', err); }
  };

  const saveChanges = async () => {
    if (!selectedService) return;
    setSaving(true);
    const token = localStorage.getItem('vendorToken');

    try {
      // 1. Block new dates
      if (pendingBlocks.size > 0) {
        await fetch(`http://localhost:5000/api/availability/service/${selectedService}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ dates: Array.from(pendingBlocks), status: 'blocked' })
        });
      }

      // 2. Unblock dates (delete from DB)
      const unblockArray = Array.from(pendingUnblocks);
      for (let i = 0; i < unblockArray.length; i++) {
        await fetch(`http://localhost:5000/api/availability/service/${selectedService}/${unblockArray[i]}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      // Reset and reload
      setPendingBlocks(new Set());
      setPendingUnblocks(new Set());
      await fetchAvailability();
      alert('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  // Calendar helpers — use local dates to avoid timezone issues
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Parse DB date to local YYYY-MM-DD (avoiding timezone shift)
  const parseDbDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDateInfo = (dateStr: string) => {
    const dbEntry = blockedDates.find(b => parseDbDate(b.date) === dateStr);

    // Check pending changes first
    if (pendingBlocks.has(dateStr)) return 'pending-block';
    if (pendingUnblocks.has(dateStr)) return 'available'; // will become available after save

    if (dbEntry) {
      if (dbEntry.current_bookings > 0) return 'booked';
      if (!dbEntry.is_available) return 'blocked';
      return 'available'; // is_available = true in DB (shouldn't happen with new logic, but handle it)
    }

    return 'available'; // Default: all dates are available
  };

  const handleDayClick = (day: number) => {
    const dateStr = getDateStr(day);
    if (dateStr < todayStr) return;

    const info = getDateInfo(dateStr);
    if (info === 'booked') return; // Can't change booked dates

    const dbEntry = blockedDates.find(b => parseDbDate(b.date) === dateStr);

    if (info === 'available' || info === 'pending-block') {
      // If it's pending-block, undo it
      if (pendingBlocks.has(dateStr)) {
        setPendingBlocks(prev => { const n = new Set(prev); n.delete(dateStr); return n; });
        return;
      }
      // If it was unblocked (pending), undo the unblock
      if (pendingUnblocks.has(dateStr)) {
        setPendingUnblocks(prev => { const n = new Set(prev); n.delete(dateStr); return n; });
        return;
      }
      // Available → Block it
      setPendingBlocks(prev => new Set(prev).add(dateStr));
    } else if (info === 'blocked') {
      // Blocked → Unblock it
      setPendingUnblocks(prev => new Set(prev).add(dateStr));
    }
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasChanges = pendingBlocks.size > 0 || pendingUnblocks.size > 0;

  // Count stats
  const blockedCount = blockedDates.filter(d => !d.is_available && d.current_bookings === 0).length;
  const bookedCount = blockedDates.filter(d => d.current_bookings > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-lg mb-2">No services found</p>
        <p className="text-gray-400 text-sm">Add services first before managing availability.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selector + Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Service</label>
            <select value={selectedService || ''} onChange={e => setSelectedService(Number(e.target.value))}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[280px]">
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{blockedCount}</p>
              <p className="text-gray-400">Blocked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{bookedCount}</p>
              <p className="text-gray-400">Booked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
          <span className="text-gray-600">Available (default)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-400"></div>
          <span className="text-gray-600">Blocked by you</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-400"></div>
          <span className="text-gray-600">Booked by client</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-200 border-2 border-dashed border-red-400"></div>
          <span className="text-gray-600">Will be blocked (unsaved)</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="h-16"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const info = getDateInfo(dateStr);

            let bg = 'bg-white border border-gray-150 hover:border-purple-300';
            let text = 'text-gray-800';
            let label = '';
            let icon = '';
            let extraClass = '';

            switch (info) {
              case 'available':
                bg = 'bg-white border border-gray-150 hover:border-purple-300 hover:bg-purple-50';
                label = '';
                break;
              case 'blocked':
                bg = 'bg-red-100 border border-red-300';
                text = 'text-red-700';
                label = 'Blocked';
                icon = '✗';
                break;
              case 'booked':
                bg = 'bg-blue-100 border border-blue-300';
                text = 'text-blue-700';
                label = 'Booked';
                icon = '📅';
                break;
              case 'pending-block':
                bg = 'bg-red-50 border-2 border-dashed border-red-400';
                text = 'text-red-500';
                label = 'Will block';
                icon = '✗';
                extraClass = 'animate-pulse';
                break;
            }

            if (isPast) {
              bg = 'bg-gray-50 border border-gray-100';
              text = 'text-gray-300';
              label = '';
              icon = '';
            }

            const todayRing = isToday ? 'ring-2 ring-purple-500 ring-offset-1' : '';

            return (
              <button key={day} onClick={() => handleDayClick(day)}
                disabled={isPast || info === 'booked'}
                className={`h-16 rounded-xl flex flex-col items-center justify-center transition-all ${bg} ${text} ${todayRing} ${extraClass} ${
                  isPast || info === 'booked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}>
                <span className="text-sm font-semibold">{day}</span>
                {icon && <span className="text-[10px] leading-none mt-0.5">{icon}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-center justify-between flex-wrap gap-3 sticky bottom-4">
          <div>
            <p className="font-semibold text-amber-900">Unsaved Changes</p>
            <p className="text-sm text-amber-700">
              {pendingBlocks.size > 0 && <span>{pendingBlocks.size} date(s) to block. </span>}
              {pendingUnblocks.size > 0 && <span>{pendingUnblocks.size} date(s) to unblock. </span>}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPendingBlocks(new Set()); setPendingUnblocks(new Set()); }}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              Discard
            </button>
            <button onClick={saveChanges} disabled={saving}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2">How it works:</p>
        <p>All dates are <strong>available by default</strong>. Click a date to mark it as <span className="text-red-600 font-medium">Blocked</span> (you're not available). Click a blocked date to unblock it. Changes are not saved until you press <strong>Save Changes</strong>.</p>
        <p className="mt-1"><span className="text-blue-600 font-medium">Booked</span> dates are set automatically when a client books your service and cannot be changed.</p>
      </div>
    </div>
  );
};

export default AvailabilityManagement;