import React from 'react';
import { Clock } from 'lucide-react';
import type { FareHistory } from '../types';

interface HistoryProps {
  history: FareHistory[];
}

export const History: React.FC<HistoryProps> = ({ history }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Collection History</h2>
      <div className="space-y-4">
        {history.map((record) => (
          <div
            key={record.id}
            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <Clock className="text-purple-500 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">{record.timestamp}</p>
                <p className="font-medium">Seats Occupied: {record.seatCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                Ksh. {record.totalAmount}
              </p>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-gray-500 text-center py-4">No collection history yet</p>
        )}
      </div>
    </div>
  );
};