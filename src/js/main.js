/**
 * Main Application Orchestrator for Phaniat SAO Portal
 */
import { store } from './store.js';
import { auth } from './auth.js';
import { emergency } from './emergency.js';
import { payment } from './payment.js';
import { complaints } from './complaints.js';
import { news } from './news.js';
import { admin } from './admin.js';
import { 
  getActiveSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured, 
  getSupabase 
} from './supabaseClient.js';

// Global Toast Notification Helper
window.showToast = function(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-info-circle';
  let defaultTitle = 'แจ้งเตือน';
  if (type === 'success') {
    icon = 'fa-check-circle';
    defaultTitle = 'สำเร็จ';
  } else if (type === 'danger') {
    icon = 'fa-exclamation-circle';
    defaultTitle = 'ข้อผิดพลาด';
  } else if (type === 'warning') {
    icon = 'fa-exclamation-triangle';
    defaultTitle = 'คำเตือน';
  }

  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icon}"></i></div>
    <div class="toast-content">
      <h4>${title || defaultTitle}</h4>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
};

// Global Page Navigation Helper
window.navigateToSection = function(sectionId) {
  // Update desktop navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.target === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile bottom bar items
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    if (item.dataset.target === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible section
  document.querySelectorAll('.portal-section').forEach(section => {
    section.classList.remove('active');
  });

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Close mobile drawer if open
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) navMenu.classList.remove('open');

  // Trigger leaflet map invalidatesize if switching to emergency or complaints
  if (sectionId === 'section-emergency') {
    setTimeout(() => {
      emergency.initMap();
    }, 200);
  } else if (sectionId === 'section-complaint') {
    setTimeout(() => {
      complaints.initMap();
    }, 200);
  }
};

// Update Supabase Connection Status Badge in Header
function updateSupabaseBadge() {
  const badgeText = document.getElementById('supabase-badge-status');
  const badgeBtn = document.getElementById('supabase-config-btn');
  if (!badgeText || !badgeBtn) return;

  if (isSupabaseConfigured()) {
    badgeText.textContent = '🟢 Supabase: เชื่อมต่อแล้ว';
    badgeBtn.style.background = '#059669';
  } else {
    badgeText.textContent = '🟡 ตั้งค่า Supabase DB';
    badgeBtn.style.background = '#D97706';
  }
}

// Bind Supabase Configuration Modal Events
function initSupabaseModal() {
  const btn = document.getElementById('supabase-config-btn');
  const modal = document.getElementById('supabase-modal');
  const closeBtn = document.getElementById('supabase-modal-close');
  const urlInput = document.getElementById('supabase-input-url');
  const keyInput = document.getElementById('supabase-input-key');
  const saveBtn = document.getElementById('supabase-save-btn');
  const clearBtn = document.getElementById('supabase-clear-btn');
  const feedback = document.getElementById('supabase-test-feedback');

  if (!btn || !modal) return;

  updateSupabaseBadge();

  btn.addEventListener('click', () => {
    const config = getActiveSupabaseConfig();
    if (urlInput) urlInput.value = config.url || '';
    if (keyInput) keyInput.value = config.anonKey || '';
    if (feedback) {
      feedback.style.display = 'none';
      feedback.innerHTML = '';
    }
    modal.classList.add('open');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const url = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      if (!url || !key) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.background = '#FEE2E2';
          feedback.style.color = '#991B1B';
          feedback.innerHTML = '<i class="fas fa-exclamation-triangle"></i> กรุณากรอกทั้ง Project URL และ Anon Key';
        }
        return;
      }

      saveSupabaseConfig(url, key);
      updateSupabaseBadge();

      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#FEF3C7';
        feedback.style.color = '#92400E';
        feedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังทดสอบเชื่อมต่อฐานข้อมูล Supabase...';
      }

      try {
        const client = getSupabase();
        if (!client) throw new Error('ไม่สามารถสร้าง Supabase Client ได้');

        const { data, error } = await client.from('emergency_reports').select('id').limit(1);

        if (error) {
          throw error;
        }

        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.background = '#DCFCE7';
          feedback.style.color = '#166534';
          feedback.innerHTML = '<i class="fas fa-check-circle"></i> เชื่อมต่อฐานข้อมูล Supabase สำเร็จ! ระบบพร้อมบันทึกข้อมูลเรียลไทม์';
        }

        window.showToast('เชื่อมต่อ Supabase Database สำเร็จแล้ว!', 'success');
        await store.syncFromSupabase();
        store.subscribeRealtime();

        setTimeout(() => {
          modal.classList.remove('open');
        }, 1500);
      } catch (err) {
        console.error('Supabase connection failed:', err);
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.background = '#FEE2E2';
          feedback.style.color = '#991B1B';
          feedback.innerHTML = `<i class="fas fa-times-circle"></i> เกิดข้อผิดพลาด: ${err.message || 'โปรดตรวจสอบ URL และ Key หรือรัน schema.sql ใน Supabase'}`;
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('phaniat_supabase_config');
      if (urlInput) urlInput.value = '';
      if (keyInput) keyInput.value = '';
      updateSupabaseBadge();
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#F1F5F9';
        feedback.style.color = '#475569';
        feedback.innerHTML = 'ล้างค่าการเชื่อมต่อเรียบร้อยแล้ว (กลับสู่โหมด Local Demo)';
      }
    });
  }
}

// App Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Store
  store.init();

  // 2. Initialize Submodules
  auth.init();
  emergency.init();
  payment.init();
  complaints.init();
  news.init();
  admin.init();

  // 3. Initialize Supabase Connection UI
  initSupabaseModal();

  // 4. Bind Navigation Events
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      if (target) window.navigateToSection(target);
    });
  });

  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.target;
      if (target) window.navigateToSection(target);
    });
  });

  // Quick Service Card Clicks
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.target;
      if (target) window.navigateToSection(target);
    });
  });

  // Mobile Drawer Toggle Button
  const mobileToggle = document.getElementById('mobile-toggle-btn');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Close modal when clicking outside modal-dialog
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  console.log('🏛️ อบต.เพนียด Smart Citizen Portal Initialized Successfully');
});
