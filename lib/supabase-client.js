import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://qjapdcjrdzrvkqadxuoj.supabase.co'
const supabaseKey = 'sb_publishable_Y-49ZlHv4LNAmz2FO97G4A__ydbzCnx'
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);