import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydpjinnqexvwchqrvysa.supabase.co';
const supabaseKey = 'sb_publishable_V7eODxAzF_tF6DcBHQz_Tg_n4dKrZ_s';

export const supabase = createClient(supabaseUrl, supabaseKey);
