import { supabase, handleSupabaseError } from '../supabase';
import type { Location, PriceSettings } from '../../types';
import { locations } from '../../data/locations';

const enrichLocationData = (data: any) => {
  try {
    const from = locations.find(loc => loc.id === data.from_id);
    const to = locations.find(loc => loc.id === data.to_id);
    
    if (!from || !to) return null;

    return {
      id: data.id,
      from,
      to,
      peakPrice: data.peak_price,
      offPeakPrice: data.off_peak_price,
      createdAt: data.created_at
    };
  } catch (error) {
    return null;
  }
};

export async function fetchPriceSettings(): Promise<PriceSettings[]> {
  try {
    const { data, error } = await supabase
      .from('price_settings')
      .select('*');
    
    if (error) return handleSupabaseError(error);
    
    return data
      .map(enrichLocationData)
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    return handleSupabaseError(error);
  }
}

export async function savePriceSettings(
  from: Location,
  to: Location,
  peakPrice: number,
  offPeakPrice: number
): Promise<PriceSettings | null> {
  try {
    const { data, error } = await supabase
      .from('price_settings')
      .upsert({
        from_id: from.id,
        to_id: to.id,
        peak_price: peakPrice,
        off_peak_price: offPeakPrice
      })
      .select()
      .single();

    if (error) return handleSupabaseError(error);
    return enrichLocationData(data);
  } catch (error) {
    return handleSupabaseError(error);
  }
}

export async function deletePriceSettings(fromId: string, toId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('price_settings')
      .delete()
      .eq('from_id', fromId)
      .eq('to_id', toId);

    if (error) {
      handleSupabaseError(error);
      return false;
    }
    return true;
  } catch (error) {
    handleSupabaseError(error);
    return false;
  }
}