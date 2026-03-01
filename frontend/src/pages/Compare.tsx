import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompare } from '../context/CompareContext';
import { Link } from 'react-router-dom';

// helper to extract numeric price
const toNumber = (p?: string | number) => {
  if (typeof p === 'number') return p;
  if (!p) return Number.POSITIVE_INFINITY;
  return parseFloat(p.replace(/[^0-9.]/g, ''));
};

const Compare: React.FC = () => {
  const { t } = useTranslation();
  const { items, remove, clear } = useCompare();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">{t('noItemsToCompare')}</h1>
        <Link
          to="/search"
          className="text-primary-600 hover:underline"
        >
          {t('goBackToSearch')}
        </Link>
      </div>
    );
  }

  // determine best values
  const minPrice = Math.min(...items.map(i => toNumber(i.price)));
  const maxRating = Math.max(...items.map(i => i.rating ?? 0));
  const minDistance = Math.min(...items.map(i => i.distance ?? Number.POSITIVE_INFINITY));

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('compareServices')}</h1>
        <button
          onClick={clear}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        >
          {t('clear')}
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('service')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('provider')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('price')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('rating')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('distance')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.provider}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${toNumber(item.price)===minPrice?'text-primary-700 font-semibold':'text-gray-500'}`}>
                {item.price}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.rating===maxRating?'text-primary-700 font-semibold':'text-gray-500'}`}
              >
                {item.rating ?? '-'}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.distance===minDistance?'text-primary-700 font-semibold':'text-gray-500'}`}
              >
                {item.distance ? `${item.distance} km` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                <button
                  onClick={() => remove(item.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  {t('remove')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Compare;
