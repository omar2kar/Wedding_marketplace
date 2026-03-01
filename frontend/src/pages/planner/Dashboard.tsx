import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PlannerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'bundles' | 'clients' | 'tools'>('overview');

  // Mock data for demonstration
  const bundles = [
    { id: 1, name: 'Complete Wedding Package', services: 8, price: '€7,800', status: 'Active' },
    { id: 2, name: 'Budget Friendly Bundle', services: 5, price: '€3,900', status: 'Draft' },
  ];

  const clients = [
    { id: 1, name: 'Sarah Johnson', weddingDate: '2025-09-15', status: 'Planning' },
    { id: 2, name: 'Michael Chen', weddingDate: '2025-10-22', status: 'Confirmed' },
  ];

  const tools = [
    { id: 1, name: 'Wedding Budget Calculator', description: 'Track expenses and stay within budget' },
    { id: 2, name: 'Guest List Manager', description: 'Organize and manage your client\'s guest lists' },
    { id: 3, name: 'Timeline Planner', description: 'Create detailed wedding day timelines' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('plannerDashboard')}</h1>
        <p className="text-gray-600">{t('welcomePlanner')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('overview')}
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bundles'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('myBundles')}
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('myClients')}
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tools'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('plannerTools')}
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('createWeddingBundle')}</h2>
              <div className="flex">
                <input
                  type="text"
                  placeholder={t('bundleNamePlaceholder')}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button className="bg-primary-600 text-white px-6 py-2 rounded-r-lg hover:bg-primary-700 transition">
                  {t('create')}
                </button>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-600 mb-2">{t('selectServices')}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('dresses')}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('photography')}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('venues')}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('catering')}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('entertainment')}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {t('decoration')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('recentBundles')}</h2>
                <Link to="/planner/bundles" className="text-primary-600 hover:text-primary-800 text-sm">
                  {t('viewAll')}
                </Link>
              </div>
              <div className="space-y-4">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{bundle.name}</h3>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bundle.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bundle.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{t('servicesIncluded')}: {bundle.services}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">{bundle.price}</p>
                    <div className="mt-3 flex space-x-2">
                      <button className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm">
                        {t('editBundle')}
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm">
                        {t('viewDetails')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('myClients')}</h2>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <h3 className="font-medium">{client.name}</h3>
                    <p className="text-sm text-gray-600">{t('weddingDate')}: {client.weddingDate}</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.status === 'Confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                    <div className="mt-3 flex space-x-2">
                      <button className="flex-grow px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm">
                        {t('viewProfile')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{t('plannerBenefits')}</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('noCommissionFees')}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('exclusivePlannerTools')}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('prioritySupport')}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('verifiedBadge')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Bundles Tab */}
      {activeTab === 'bundles' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{t('myBundles')}</h2>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition">
              {t('createNewBundle')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{bundle.name}</h3>
                    <p className="text-sm text-gray-600">{t('servicesIncluded')}: {bundle.services}</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-lg font-bold text-primary-600 mt-2">{bundle.price}</p>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-grow px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm">
                    {t('editBundle')}
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm">
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t('myClients')}</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('weddingDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.weddingDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'Confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        {t('viewDetails')}
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        {t('remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t('plannerTools')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div key={tool.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-lg font-medium mb-2">{tool.name}</h3>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                  {t('openTool')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerDashboard;
