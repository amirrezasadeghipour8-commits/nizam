/* Nizam — اتصال به Supabase (احراز هویت)
   این فایل یک ماژول است (با <script type="module"> بارگذاری می‌شود).
   کلاینت روی window می‌رود تا فایل‌های غیر-ماژول (app.js و…) هم بتوانند
   از supabaseClient استفاده کنند. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jranepomjeeeezjsqys.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e6It3SVY14DR1e1l1MuCKg__bLnAc7Y';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

/* اگر کاربر از قبل وارد شده باشد، نشست فعلی را می‌خواند.
   supabaseSession برای مراحل بعدی (ورود/خروج و همگام‌سازی) در دسترس است. */
let currentSession = null;
try {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentSession = session;
} catch (e) {
  console.error('Nizam: خطا در خواندن نشست Supabase', e);
}
window.supabaseSession = currentSession;
export { currentSession };