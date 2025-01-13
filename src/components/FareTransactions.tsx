import React from 'react';
import { formatDateTime } from '../utils/dateTime';
import { formatCurrency } from '../utils/price';
import type { FareTransaction } from '../types';
import { locations } from '../data/locations';

interface FareTransactionsProps {
  transactions: FareTransaction[];
  total: number;
}

export const FareTransactions: React.FC<FareTransactionsProps> = ({ 
  transactions,
  total
}) => {
  const getLocationName = (id: string) => {
    return locations.find(loc => loc.id === id)?.name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Fare Transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Time</th>
              <th className="py-2 text-left">From</th>
              <th className="py-2 text-left">To</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-center">Peak</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b">
                <td className="py-2">{formatDateTime(new Date(transaction.created_at))}</td>
                <td className="py-2">{getLocationName(transaction.from_location)}</td>
                <td className="py-2">{getLocationName(transaction.to_location)}</td>
                <td className="py-2 text-right">{formatCurrency(transaction.amount)}</td>
                <td className="py-2 text-center">
                  {transaction.is_peak ? '✓' : '-'}
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td colSpan={3} className="py-2">Total Collection</td>
              <td className="py-2 text-right">{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};