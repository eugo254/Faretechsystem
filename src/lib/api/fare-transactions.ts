import { supabase } from '../supabase';
import type { Location, FareTransaction } from '../../types';

export async function saveFareTransaction(
  fromLocation: Location,
  toLocation: Location,
  amount: number,
  isPeak: boolean
): Promise<FareTransaction> {
  const { data, error } = await supabase
    .from('fare_transactions')
    .insert({
      from_location: fromLocation.id,
      to_location: toLocation.id,
      amount,
      is_peak: isPeak
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTotalFareAmount(): Promise<number> {
  const { data, error } = await supabase
    .from('fare_transactions')
    .select('amount');

  if (error) throw error;
  return data.reduce((sum, transaction) => sum + transaction.amount, 0);
}

export async function getFareTransactions(): Promise<FareTransaction[]> {
  const { data, error } = await supabase
    .from('fare_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}