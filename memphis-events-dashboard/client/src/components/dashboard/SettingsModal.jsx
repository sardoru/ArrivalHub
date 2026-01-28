import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';

export function SettingsModal({ onClose }) {
  const { settings, fetchSettings, updateSettings } = useStore();
  const [formData, setFormData] = useState({
    baseNightlyRate: 100,
    minNightlyRate: 50,
    maxNightlyRate: 500,
    propertyType: '',
    distanceFromDowntown: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        baseNightlyRate: settings.base_nightly_rate || 100,
        minNightlyRate: settings.min_nightly_rate || 50,
        maxNightlyRate: settings.max_nightly_rate || 500,
        propertyType: settings.property_type || '',
        distanceFromDowntown: settings.distance_from_downtown || ''
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        baseNightlyRate: parseFloat(formData.baseNightlyRate),
        minNightlyRate: parseFloat(formData.minNightlyRate),
        maxNightlyRate: parseFloat(formData.maxNightlyRate),
        propertyType: formData.propertyType || null,
        distanceFromDowntown: formData.distanceFromDowntown ? parseFloat(formData.distanceFromDowntown) : null
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Pricing Settings
              </h3>
              <p className="text-sm text-gray-500">
                Configure your base rates and property details.
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Nightly Rate ($)
                </label>
                <input
                  type="number"
                  name="baseNightlyRate"
                  value={formData.baseNightlyRate}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your standard nightly rate for normal demand periods.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rate ($)
                  </label>
                  <input
                    type="number"
                    name="minNightlyRate"
                    value={formData.minNightlyRate}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Rate ($)
                  </label>
                  <input
                    type="number"
                    name="maxNightlyRate"
                    value={formData.maxNightlyRate}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select type</option>
                  <option value="entire_home">Entire Home</option>
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="hotel_room">Hotel Room</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance from Downtown (miles)
                </label>
                <input
                  type="number"
                  name="distanceFromDowntown"
                  value={formData.distanceFromDowntown}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Properties closer to downtown may see higher demand during events.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
