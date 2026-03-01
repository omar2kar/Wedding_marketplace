import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageIcon, SettingsIcon, SearchIcon } from '../components/icons';

const faqs = [
  {
    q: 'How do I create an account?',
    a: 'Click on Register, fill in your details, and verify your email.'
  },
  {
    q: 'How do I book a service?',
    a: 'Find the service via Search, open the service page, select an available date, and click Book.'
  },
  {
    q: 'How are payments handled?',
    a: 'Payments are processed securely via our partner gateway. You only pay when your booking is confirmed.'
  },
  {
    q: 'Can I contact the provider before booking?',
    a: 'Yes, use the built-in chat on each service page to discuss details.'
  }
];

const Help: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">{t('helpCenter') || 'Help Center'}</h1>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <details key={idx} className="glass rounded-lg p-4 hover:bg-white/15 transition-all duration-300">
            <summary className="cursor-pointer font-semibold text-white">
              {item.q}
            </summary>
            <p className="mt-2 text-white/80">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default Help;
