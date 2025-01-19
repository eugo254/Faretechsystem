
import { supabase, handleSupabaseError } from '../supabase';
import type { Location, PriceSettings } from '../../types';
import { locations } from '../../data/locations';

// Keep the enrichLocationData function unchanged
const enrichLocationData = (data: any) => {
  // ... existing code ...
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

// Keep the fetchPriceSettings function unchanged
export async function fetchPriceSettings(): Promise<PriceSettings[]> {
  // ... existing code ...
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


// Replace the entire existing savePriceSettings function with this new version
export async function savePriceSettings(
  from: Location,
  to: Location,
  peakPrice: number,
  offPeakPrice: number
): Promise<PriceSettings | null> {
  try {
    // First check if a price setting already exists
    const { data: existing, error: checkError } = await supabase
      .from('price_settings')
      .select('*')
      .eq('from_id', from.id)
      .eq('to_id', to.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      return handleSupabaseError(checkError);
    }

    if (existing) {
      throw new Error('Price settings already exist for these locations. Delete existing settings first.');
    }

    // If no existing settings, proceed with insert
    const { data, error } = await supabase
      .from('price_settings')
      .insert({
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

// Keep the deletePriceSettings function unchanged
export async function deletePriceSettings(fromId: string, toId: string): Promise<boolean> {
  // ... existing code ...
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
