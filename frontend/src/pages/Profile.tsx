import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserIcon, SettingsIcon, CameraIcon } from '../components/icons';

import ImageUpload from '../components/ImageUpload';

const initialUser = {
  firstName: 'Sarah',
  lastName: 'Ahmed',
  email: 'sarah@example.com',
  phone: '+966500000000',
  city: 'Riyadh',
  about: 'Bride to be – planning my dream wedding!',
  profileImage: ''
};

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageChange = (files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setUser({ ...user, profileImage: reader.result.toString() });
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSave = () => {
    // TODO: call API to save changes
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-primary-600">{t('myProfile') || 'My Profile'}</h1>

      <div className="glass rounded-lg p-6">
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          {isEditing ? (
            <ImageUpload multiple={false} onChange={handleImageChange} initialPreviews={user.profileImage ? [user.profileImage] : []} />
          ) : (
            <img
              src={user.profileImage || 'https://via.placeholder.com/120'}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
        </div>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">{t('firstName') || 'First Name'}</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                disabled={!isEditing}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">{t('lastName') || 'Last Name'}</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                disabled={!isEditing}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                disabled
                className="w-full border border-accentNeutral bg-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">{t('phone') || 'Phone'}</label>
              <input
                type="text"
                name="phone"
                value={user.phone}
                disabled={!isEditing}
                onChange={handleChange}
                className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('city') || 'City'}</label>
            <input
              type="text"
              name="city"
              value={user.city}
              disabled={!isEditing}
              onChange={handleChange}
              className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('about') || 'About'}</label>
            <textarea
              name="about"
              value={user.about}
              disabled={!isEditing}
              onChange={handleChange}
              className="w-full border border-accentNeutral rounded px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
          </div>
        </form>

        <div className="mt-6 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded"
                onClick={handleSave}
              >
                {t('save') || 'Save'}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded"
                onClick={() => setIsEditing(false)}
              >
                {t('cancel') || 'Cancel'}
              </button>
            </>
          ) : (
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded"
              onClick={() => setIsEditing(true)}
            >
              {t('editProfile') || 'Edit Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
