import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { History } from './components/History';
import { PriceSettings } from './components/PriceSettings';
import { SavedLocations } from './components/SavedLocations';
import { FareTransactions } from './components/FareTransactions';
import { Seat } from './components/Seat';
import { deleteFareTransactions, fetchPriceSettings, getFareTransactions, getFareTransactionsIds, getTotalFareAmount } from './lib/api';
import type { SeatStatus, FareHistory, PriceSettings as PriceSettingsType, FareTransaction } from './types';

const App: React.FC = () => {
  const [seats, setSeats] = useState<SeatStatus[]>(
    Array.from({ length: 2 }, (_, i) => ({ id: i, occupied: false, disconnected: false }))
  );
  const [showSettings, setShowSettings] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [history, setHistory] = useState<FareHistory[]>([]);
  const [savedLocations, setSavedLocations] = useState<PriceSettingsType[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [transactions, setTransactions] = useState<FareTransaction[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [priceSettings, fareTransactions, totalFare] = await Promise.all([
          fetchPriceSettings(),
          getFareTransactions(),
          getTotalFareAmount()
        ]);

        if (priceSettings) setSavedLocations(priceSettings);
        if (fareTransactions) setTransactions(fareTransactions);
        if (typeof totalFare === 'number') setTotalCollection(totalFare);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data. Please check your connection.');
      }
    };

    loadData();
  }, []);

  const handleSeatClick = (id: number) => {
    setSeats(seats.map(seat => 
      seat.id === id ? { ...seat, occupied: !seat.occupied } : seat
    ));
  };


  const handleReset = async () => {
    try {
      // Fetch the IDs of all fare transactions
      const ids = await getFareTransactionsIds();
  
      if (ids.length === 0) {
        toast.error('No fare transactions found to delete');
        return;
      }
  
      // Await the asynchronous delete operation and pass the IDs
      const deletionSuccess = await deleteFareTransactions(ids);
  
      if (deletionSuccess) {
        // Clear the transactions array to hide the FareTransactions div
        setTransactions([]); // This will trigger a re-render and hide the div
        toast.success('All transactions deleted successfully');
      } else {
        toast.error('Failed to delete transactions');
      }
  
      // Reset total fare amount and show success toast
      setTotalCollection(0);
      toast.success('Total fare amount has been reset');
    } catch (error) {
      // Handle any errors during the delete operation
      console.error('Error deleting transactions:', error);
      toast.error('Failed to delete transactions');
    }
  };

  const handleReset2 = async () => {
    try {
      // Fetch the IDs of all fare transactions
      const ids = await getFareTransactionsIds();
  
      if (ids.length === 0) {
        toast.error('No fare transactions found to delete');
        return;
      }
  
      // Await the asynchronous delete operation and pass the IDs
      const deletionSuccess = await deleteFareTransactions(ids);
  
      if (deletionSuccess) {
        toast.success('All transactions deleted successfully');
      } else {
        toast.error('Failed to delete transactions');
      }
  
      // Reset total fare amount and show success toast
      setTotalCollection(0);
      toast.success('Total fare amount has been reset');
    } catch (error) {
      // Handle any errors during the delete operation
      console.error('Error deleting transactions:', error);
      toast.error('Failed to delete transactions');
    }
  };
  
 

  const handleSaveSettings = (settings: Omit<PriceSettingsType, 'id'>) => {
    setSavedLocations([...savedLocations, { ...settings, id: Date.now().toString() }]);
    setShowSettings(false);
  };

  const handleDeleteLocation = (id: string) => {
    setSavedLocations(savedLocations.filter(location => location.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <header className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <h1 className="text-lg font-black text-gray-800 mb-2 uppercase tracking-wide">FARETECH SYSTEM BY MAKORI</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">BUS FARE</h2>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-purple-600">Total Collection</h3>
              <p className="text-4xl font-bold text-green-600">Kshs. {totalCollection}</p>
              <p className="text-sm text-gray-500">
                Last Updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {seats.map((seat) => (
            <Seat
              key={seat.id}
              occupied={seat.occupied}
              disconnected={seat.disconnected}
              onClick={() => handleSeatClick(seat.id)}
            />
          ))}
        </div>

        {transactions.length > 0 && (
          <div className="mb-8">
            <FareTransactions
              transactions={transactions}
              total={totalCollection}
              
            />
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full py-3 bg-white text-purple-600 font-semibold rounded-lg shadow hover:bg-gray-50"
          >
            CONFIGURE PRICES
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg shadow hover:bg-red-600"
          >
            RESET TOTAL FARE AMOUNT
          </button>
        </div>

        {savedLocations.length > 0 && (
          <div className="mt-8">
            <SavedLocations
              locations={savedLocations}
              onDelete={handleDeleteLocation}
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8">
            <History history={history} />
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <PriceSettings
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default App;
