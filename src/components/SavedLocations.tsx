import React from 'react';
import { Trash2 } from 'lucide-react';
import { deletePriceSettings } from '../lib/api';
import { toast } from 'react-hot-toast';
import type { PriceSettings } from '../types';

interface SavedLocationsProps {
  locations: PriceSettings[];
  onDelete: (id: string) => void;
}

export const SavedLocations: React.FC<SavedLocationsProps> = ({ locations, onDelete }) => {
  const handleDelete = async (id: string, fromId: string, toId: string) => {
    try {
      await deletePriceSettings(fromId, toId);
      onDelete(id);
      toast.success('Route deleted successfully');
    } catch (error) {
      console.error('Error deleting price settings:', error);
      toast.error('Failed to delete route');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Saved Routes & Prices</h2>
      <div className="space-y-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="bg-gray-50 rounded-lg p-4 relative group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {location.from.name} → {location.to.name}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    Peak Hours: <span className="font-medium">Ksh. {location.peakPrice}</span>
                  </p>
                  <p className="text-sm">
                    Off-Peak: <span className="font-medium">Ksh. {location.offPeakPrice}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(location.id, location.from.id, location.to.id)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete route"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-gray-500 text-center py-4">No saved routes yet</p>
        )}
      </div>
    </div>
  );
};