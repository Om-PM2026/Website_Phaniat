/**
 * Supabase Client Configuration & Helper for Phaniat SAO Portal
 * 
 * วิธีตั้งค่าเชื่อมต่อ:
 * 1. ใส่ค่า Project URL และ Anon Key ใน SUPABASE_CONFIG ด้านล่าง
 * 2. หรือคลิกปุ่ม "ตั้งค่า Supabase Database" บนแถบหัวเว็บ
 */

// ==============================================================================
// 1. กำหนดค่าการเชื่อมต่อ (กรอก URL และ ANON KEY ของคุณที่นี่)
// ==============================================================================
export const SUPABASE_CONFIG = {
  url: 'https://rucfeemwmyuvgayzmcsc.supabase.co', 
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Y2ZlZW13bXl1dmdheXptY3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDI2MTYsImV4cCI6MjEwNTExODYxNn0.dzZTjjtRSAK9S3oZVAGy3xH6v1yvyrAONvADonOworA'
};

// ==============================================================================
// 2. Helper functions (รองรับทั้งไฟล์ config และ LocalStorage)
// ==============================================================================
export function getActiveSupabaseConfig() {
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

// ==============================================================================
// 3. Initialize Supabase Client
// ==============================================================================
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
