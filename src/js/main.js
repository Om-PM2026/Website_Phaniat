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

  // 3. Bind Navigation Events
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
