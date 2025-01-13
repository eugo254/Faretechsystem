import type { Location, PriceSettings } from '../types';
import { isPeakHour } from './dateTime';
import { supabase } from '../lib/supabase';

export async function calculateFareAmount(
  from: Location,
  to: Location,
  boardingTime: Date = new Date()
): Promise<number> {
  // Get price settings from database
  const { data: priceSettings } = await supabase
    .from('price_settings')
    .select('*')
    .eq('from_id', from.id)
    .eq('to_id', to.id)
    .single();

  if (!priceSettings) {
    throw new Error('No price settings found for this route');
  }

  // Return peak or off-peak price based on time
  return isPeakHour(boardingTime) ? priceSettings.peak_price : priceSettings.off_peak_price;
}