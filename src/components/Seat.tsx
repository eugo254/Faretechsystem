import React from 'react';
import { Armchair } from 'lucide-react';

interface SeatProps {
  occupied: boolean;
  disconnected: boolean;
  onClick: () => void;
}

export const Seat: React.FC<SeatProps> = ({ occupied, disconnected, onClick }) => {
  const getColor = () => {
    if (disconnected) return 'text-red-500';
    if (occupied) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`transition-colors ${getColor()}`}
      >
        <Armchair size={32} />
      </button>
      {disconnected && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
          Disconnected
        </div>
      )}
    </div>
  );
};