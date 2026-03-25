import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Vendor {
  id: number;
  business_name: string;
  owner_name: string;
  category: string;
  rating: number;
  profile_image: string | null;
  is_featured: number | null;
}

interface FeaturedVendor {
  id: number;
  businessName: string;
  ownerName: string;
  category: string;
  rating: number;
  profileImage: string | null;
  displayOrder: number;
}

const FeaturedVendorsAdmin: React.FC = () => {
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [featured, setFeatured] = useState<FeaturedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featRes, allRes] = await Promise.all([
        fetch('http://localhost:5000/api/featured-vendors'),
        fetch('http://localhost:5000/api/featured-vendors/all-vendors')
      ]);
      if (featRes.ok) setFeatured(await featRes.json());
      if (allRes.ok) setAllVendors(await allRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addFeatured = async (vendorId: number) => {
    try {
      const res = await fetch('http://localhost:5000/api/featured-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId })
      });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  };

  const removeFeatured = async (vendorId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/featured-vendors/${vendorId}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  };

  const moveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = [...featured];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const order = newOrder.map((v, i) => ({ vendorId: v.id, displayOrder: i + 1 }));
    try {
      await fetch('http://localhost:5000/api/featured-vendors/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
      loadData();
    } catch (err) { console.error(err); }
  };

  const moveDown = async (index: number) => {
    if (index >= featured.length - 1) return;
    const newOrder = [...featured];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const order = newOrder.map((v, i) => ({ vendorId: v.id, displayOrder: i + 1 }));
    try {
      await fetch('http://localhost:5000/api/featured-vendors/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
      loadData();
    } catch (err) { console.error(err); }
  };

  const featuredIds = new Set(featured.map(f => f.id));
  const filteredVendors = allVendors.filter(v =>
    !featuredIds.has(v.id) &&
    (v.business_name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/dashboard" className="text-sm text-purple-600 hover:underline mb-2 inline-block">← Back to Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900">Featured Vendors</h1>
            <p className="text-gray-500 mt-1">Manage which vendors appear on the homepage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current Featured */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Homepage Vendors</h2>
            <p className="text-sm text-gray-400 mb-4">{featured.length} vendors shown on homepage</p>

            {featured.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg mb-1">No featured vendors</p>
                <p className="text-sm">Add vendors from the list on the right</p>
              </div>
            ) : (
              <div className="space-y-2">
                {featured.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-300 w-5">#{index + 1}</span>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                      {vendor.profileImage ? (
                        <img src={vendor.profileImage.startsWith('http') ? vendor.profileImage : `http://localhost:5000${vendor.profileImage}`}
                          alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                          {vendor.businessName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{vendor.businessName}</p>
                      <p className="text-xs text-gray-400">{vendor.category} · ★ {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1">
                      <button onClick={() => moveUp(index)} disabled={index === 0}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition" title="Move up">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button onClick={() => moveDown(index)} disabled={index === featured.length - 1}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition" title="Move down">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button onClick={() => removeFeatured(vendor.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition" title="Remove">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Vendors */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Available Vendors</h2>
            <p className="text-sm text-gray-400 mb-4">Click + to add to homepage</p>

            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4 border border-gray-200 focus:border-purple-400" />

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredVendors.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-sm">No vendors available</p>
              ) : (
                filteredVendors.map(vendor => (
                  <div key={vendor.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-gray-200">
                      {vendor.profile_image ? (
                        <img src={vendor.profile_image.startsWith('http') ? vendor.profile_image : `http://localhost:5000${vendor.profile_image}`}
                          alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                          {(vendor.business_name || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{vendor.business_name}</p>
                      <p className="text-xs text-gray-400">{vendor.category} · {vendor.owner_name}</p>
                    </div>
                    <button onClick={() => addFeatured(vendor.id)}
                      className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition font-bold text-lg"
                      title="Add to featured">
                      +
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedVendorsAdmin;