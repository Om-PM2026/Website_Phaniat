/**
 * Supabase Client Configuration & Helper for Phaniat SAO Portal
 * 
 * รองรับทั้ง:
 * 1. Environment Variables บน Vercel/Vite (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. ค่าที่บันทึกผ่านหน้าเว็บ (LocalStorage)
 * 3. ค่าเริ่มต้น Default Config
 */

// 1. อ่านค่าจาก Environment Variables ของ Vite/Vercel (ถ้ามี)
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) 
  ? import.meta.env.VITE_SUPABASE_URL 
  : '';

const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : '';

// 2. กำหนดค่าการเชื่อมต่อ Default Config
export const SUPABASE_CONFIG = {
  url: envUrl || 'https://rucfeemwmyuvgayzmcsc.supabase.co', 
  anonKey: envAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Y2ZlZW13bXl1dmdheXptY3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDI2MTYsImV4cCI6MjEwNTExODYxNn0.dzZTjjtRSAK9S3oZVAGy3xH6v1yvyrAONvADonOworA'
};

// 3. Helper functions (ลำดับความสำคัญ: Env Vars > LocalStorage > Default)
export function getActiveSupabaseConfig() {
  if (envUrl && envAnonKey) {
    return {
      url: envUrl,
      anonKey: envAnonKey
    };
  }

  const localSaved = localStorage.getItem('phaniat_supabase_config');
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch (e) {
      console.warn('Invalid local supabase config', e);
    }
  }

  return SUPABASE_CONFIG;
}

export function saveSupabaseConfig(url, anonKey) {
  const config = {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim()
  };
  localStorage.setItem('phaniat_supabase_config', JSON.stringify(config));
  supabaseInstance = null; // reset instance
  return isSupabaseConfigured();
}

export function isSupabaseConfigured() {
  const config = getActiveSupabaseConfig();
  return Boolean(
    config.url && 
    config.anonKey && 
    !config.url.includes('YOUR_PROJECT') &&
    config.url.startsWith('https://')
  );
}

// 4. Initialize Supabase Client
let supabaseInstance = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  const config = getActiveSupabaseConfig();
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseInstance = window.supabase.createClient(
      config.url,
      config.anonKey
    );
    return supabaseInstance;
  }

  return null;
}

export const supabase = getSupabase();
