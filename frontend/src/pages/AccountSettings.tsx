import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsForm {
  currentPassword: string;
  newPassword: string;
  notifications: boolean;
  language: 'en' | 'de';
}

const AccountSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<SettingsForm>({
    currentPassword: '',
    newPassword: '',
    notifications: true,
    language: (i18n.language as 'en' | 'de') || 'de',
  });
  const [message, setMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, type } = target;
    const value = type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm({
      ...form,
      [name as keyof SettingsForm]: value as any,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend API
    i18n.changeLanguage(form.language);
    setMessage(t('settingsSaved') || 'Settings saved successfully');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">
        {t('accountSettings') || 'Account Settings'}
      </h1>

      <form
        onSubmit={handleSave}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        {/* Password Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {t('changePassword') || 'Change Password'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t('currentPassword') || 'Current Password'}
              </label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t('newPassword') || 'New Password'}
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {t('preferences') || 'Preferences'}
          </h2>
          <div className="space-y-4">
            {/* Notifications */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={form.notifications}
                onChange={handleChange}
                className="h-4 w-4 text-secondary-500 focus:ring-secondary-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                {t('enableNotifications') || 'Enable notifications'}
              </label>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t('language') || 'Language'}
              </label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded"
        >
          {t('saveSettings') || 'Save Settings'}
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default AccountSettings;
