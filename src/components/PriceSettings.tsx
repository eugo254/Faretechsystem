import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { locations } from '../data/locations';
import { savePriceSettings } from '../lib/api';
import type { Location, PriceSettings } from '../types';

interface PriceSettingsProps {
  onSave: (settings: Omit<PriceSettings, 'id'>) => void;
  onClose: () => void;
}

export const PriceSettings: React.FC<PriceSettingsProps> = ({ onSave, onClose }) => {
  const [from, setFrom] = useState<Location>(locations[0]);
  const [to, setTo] = useState<Location>(locations[1]);
  const [peakPrice, setPeakPrice] = useState(0);
  const [offPeakPrice, setOffPeakPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (from.id === to.id) {
      toast.error('From and To locations cannot be the same');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = await savePriceSettings(from, to, peakPrice, offPeakPrice);
      if (!data) {
        toast.error('Failed to save price settings');
        return;
      }
      onSave({ 
        from, 
        to, 
        peakPrice,
        offPeakPrice
      });
      toast.success('Price settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving price settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save price settings';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component remains exactly the same ...

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Configure Prices</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">From:</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={from.id}
              onChange={(e) => setFrom(locations.find(l => l.id === e.target.value)!)}
              disabled={isSubmitting}
            >
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">To:</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={to.id}
              onChange={(e) => setTo(locations.find(l => l.id === e.target.value)!)}
              disabled={isSubmitting}
            >
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Peak Price (Kshs):
            </label>
            <input
              type="number"
              min="0"
              value={peakPrice}
              onChange={(e) => setPeakPrice(Math.max(0, Number(e.target.value)))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Off-Peak Price (Kshs):
            </label>
            <input
              type="number"
              min="0"
              value={offPeakPrice}
              onChange={(e) => setOffPeakPrice(Math.max(0, Number(e.target.value)))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
