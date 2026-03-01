import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  category: string;
}

interface Commission {
  category: string;
  commission_rate: number;
}

interface EmailTemplate {
  id: number;
  template_type: string;
  subject: string;
  body: string;
  is_active: boolean;
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'commissions' | 'emails'>('general');
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({});
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (activeTab === 'general') {
        const response = await fetch('http://localhost:5000/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } else if (activeTab === 'commissions') {
        const response = await fetch('http://localhost:5000/api/admin/settings/commissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCommissions(data.commissions);
        }
      } else if (activeTab === 'emails') {
        const response = await fetch('http://localhost:5000/api/admin/settings/email-templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEmailTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (setting: SystemSetting, newValue: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/settings/${setting.setting_key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          value: newValue,
          description: setting.description 
        })
      });

      if (response.ok) {
        setEditingSetting(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const updateCommission = async (category: string, rate: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/settings/commissions/${category}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commission_rate: rate })
      });

      if (response.ok) {
        setEditingCommission(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating commission:', error);
    }
  };

  const updateEmailTemplate = async (template: EmailTemplate) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/settings/email-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
          is_active: template.is_active
        })
      });

      if (response.ok) {
        setEditingTemplate(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="glass border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mr-4 text-white/70 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">System Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
        <div className="glass rounded-lg border border-white/20">
          <div className="border-b border-white/30">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'general'
                    ? 'border-red-500 text-white/60'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'commissions'
                    ? 'border-red-500 text-white/60'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                Commission Rates
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'emails'
                    ? 'border-red-500 text-white/60'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                Email Templates
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-white/70">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* General Settings Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {Object.entries(settings).map(([category, categorySettings]) => (
                      <div key={category} className="glass border border-white/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-4 capitalize">
                          {category} Settings
                        </h3>
                        <div className="space-y-4">
                          {categorySettings.map((setting) => (
                            <div key={setting.id} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">{setting.setting_key}</div>
                                <div className="text-sm text-white/70">{setting.description}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {editingSetting?.id === setting.id ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      defaultValue={setting.setting_value}
                                      className="w-32 px-2 py-1 border border-white/30 rounded text-sm"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          updateSetting(setting, e.currentTarget.value);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => setEditingSetting(null)}
                                      className="text-white/60 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-white">{setting.setting_value}</span>
                                    <button
                                      onClick={() => setEditingSetting(setting)}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Commission Rates Tab */}
                {activeTab === 'commissions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Service Category Commission Rates</h3>
                    <div className="space-y-3">
                      {commissions.map((commission) => (
                        <div key={commission.category} className="glass flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-lg">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{commission.category}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {editingCommission?.category === commission.category ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  defaultValue={commission.commission_rate}
                                  className="w-20 px-2 py-1 border border-white/30 rounded text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCommission(commission.category, parseFloat(e.currentTarget.value));
                                    }
                                  }}
                                />
                                <span className="text-sm text-white/70">%</span>
                                <button
                                  onClick={() => setEditingCommission(null)}
                                  className="text-white/60 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-white">{commission.commission_rate}%</span>
                                <button
                                  onClick={() => setEditingCommission(commission)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Templates Tab */}
                {activeTab === 'emails' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Email Templates</h3>
                    <div className="space-y-4">
                      {emailTemplates.map((template) => (
                        <div key={template.id} className="glass border border-white/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-white">{template.template_type}</h4>
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  template.is_active ? 'bg-green-100 text-green-800' : 'bg-white/10 text-white'
                                }`}>
                                  {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-white/80">Subject:</span>
                              <p className="text-sm text-white">{template.subject}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white/80">Body:</span>
                              <p className="text-sm text-white whitespace-pre-wrap">{template.body.substring(0, 200)}...</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Setting Modal */}
      {editingSetting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 glass border border-white/20">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Edit Setting</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Key:</label>
                  <input
                    type="text"
                    value={editingSetting.setting_key}
                    disabled
                    className="w-full px-3 py-2 border border-white/30 rounded-md bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Value:</label>
                  <input
                    type="text"
                    defaultValue={editingSetting.setting_value}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateSetting(editingSetting, e.currentTarget.value);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setEditingSetting(null)}
                  className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {editingCommission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 glass border border-white/20">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Edit Commission Rate</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Category:</label>
                  <input
                    type="text"
                    value={editingCommission.category}
                    disabled
                    className="w-full px-3 py-2 border border-white/30 rounded-md bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Commission Rate (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={editingCommission.commission_rate}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateCommission(editingCommission.category, parseFloat(e.currentTarget.value));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setEditingCommission(null)}
                  className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Email Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl glass border border-white/20">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Edit Email Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Template Type:</label>
                  <input
                    type="text"
                    value={editingTemplate.template_type}
                    disabled
                    className="w-full px-3 py-2 border border-white/30 rounded-md bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Subject:</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Body:</label>
                  <textarea
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={8}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_active}
                      onChange={(e) => setEditingTemplate({...editingTemplate, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-white/80">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateEmailTemplate(editingTemplate)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
