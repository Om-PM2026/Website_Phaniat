/**
 * Authentication Module: Phone number registration & OTP Login simulation
 */
import { store } from './store.js';

let otpCountdownTimer = null;
let generatedOtp = '123456';

export const auth = {
  init() {
    this.updateUserUI();
    this.bindEvents();
  },

  bindEvents() {
    const authBtn = document.getElementById('auth-header-btn');
    const authModal = document.getElementById('auth-modal');
    const authCloseBtn = document.getElementById('auth-modal-close');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const quickOtpFillBtn = document.getElementById('quick-otp-fill');
    const logoutBtn = document.getElementById('profile-logout-btn');

    if (authBtn) {
      authBtn.addEventListener('click', () => {
        const currentUser = store.getCurrentUser();
        if (currentUser) {
          this.openProfileModal();
        } else {
          this.openAuthModal();
        }
      });
    }

    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', () => this.closeAuthModal());
    }

    const profileCloseBtn = document.getElementById('profile-modal-close');
    if (profileCloseBtn) {
      profileCloseBtn.addEventListener('click', () => this.closeProfileModal());
    }

    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', () => this.handleSendOtp());
    }

    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => this.handleVerifyOtp());
    }

    if (quickOtpFillBtn) {
      quickOtpFillBtn.addEventListener('click', () => {
        const otpInput = document.getElementById('auth-otp-input');
        if (otpInput) {
          otpInput.value = generatedOtp;
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        store.setCurrentUser(null);
        this.closeProfileModal();
        this.updateUserUI();
        window.showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
      });
    }
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('open');
      this.resetAuthForm();
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('open');
    }
    if (otpCountdownTimer) {
      clearInterval(otpCountdownTimer);
    }
  },

  openProfileModal() {
    const user = store.getCurrentUser();
    if (!user) return;

    const modal = document.getElementById('profile-modal');
    const nameEl = document.getElementById('profile-display-name');
    const phoneEl = document.getElementById('profile-display-phone');
    const idEl = document.getElementById('profile-display-id');
    const addressEl = document.getElementById('profile-display-address');

    if (nameEl) nameEl.textContent = user.name || 'ประชาชนตำบลเพนียด';
    if (phoneEl) phoneEl.textContent = user.phone;
    if (idEl) idEl.textContent = user.citizenId || 'ไม่ได้ระบุ';
    if (addressEl) addressEl.textContent = user.address || 'ตำบลเพนียด';

    if (modal) modal.classList.add('open');
  },

  closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('open');
  },

  resetAuthForm() {
    const phoneStep = document.getElementById('auth-step-phone');
    const otpStep = document.getElementById('auth-step-otp');
    const phoneInput = document.getElementById('auth-phone-input');
    const otpInput = document.getElementById('auth-otp-input');

    if (phoneStep) phoneStep.style.display = 'block';
    if (otpStep) otpStep.style.display = 'none';
    if (phoneInput) phoneInput.value = '';
    if (otpInput) otpInput.value = '';
  },

  handleSendOtp() {
    const phoneInput = document.getElementById('auth-phone-input');
    const nameInput = document.getElementById('auth-name-input');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';

    // Validate Thai 10-digit phone
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      window.showToast('กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลักให้ถูกต้อง (เช่น 0812345678)', 'danger');
      return;
    }

    // Generate random 6-digit OTP
    generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Switch to OTP step
    document.getElementById('auth-step-phone').style.display = 'none';
    document.getElementById('auth-step-otp').style.display = 'block';

    const targetPhoneSpan = document.getElementById('auth-target-phone');
    if (targetPhoneSpan) {
      targetPhoneSpan.textContent = phone;
    }

    const demoOtpCode = document.getElementById('demo-otp-code');
    if (demoOtpCode) {
      demoOtpCode.textContent = generatedOtp;
    }

    // Countdown Timer
    let secondsLeft = 60;
    const countdownEl = document.getElementById('otp-countdown');
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);

    otpCountdownTimer = setInterval(() => {
      secondsLeft--;
      if (countdownEl) countdownEl.textContent = `${secondsLeft} วินาที`;
      if (secondsLeft <= 0) {
        clearInterval(otpCountdownTimer);
        if (countdownEl) countdownEl.textContent = 'หมดอายุแล้ว กรุณากดส่งใหม่';
      }
    }, 1000);

    window.showToast(`รหัส OTP สำหรับทดสอบส่งไปที่เบอร์ ${phone} แล้ว: ${generatedOtp}`, 'success');
  },

  handleVerifyOtp() {
    const otpInput = document.getElementById('auth-otp-input');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';
    const phoneInput = document.getElementById('auth-phone-input');
    const nameInput = document.getElementById('auth-name-input');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'คุณ' + phone.slice(-4);

    if (enteredOtp !== generatedOtp && enteredOtp !== '123456') {
      window.showToast('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'danger');
      return;
    }

    const user = {
      phone: phone,
      name: name,
      citizenId: '1100200' + Math.floor(100000 + Math.random() * 900000),
      address: 'หมู่ 2 ต.เพนียด',
      registeredAt: new Date().toLocaleDateString('th-TH')
    };

    store.setCurrentUser(user);
    this.closeAuthModal();
    this.updateUserUI();
    window.showToast(`ยินดีต้อนรับ ${user.name} เข้าสู่ระบบ อบต.เพนียด เรียบร้อยแล้ว`, 'success');
  },

  updateUserUI() {
    const user = store.getCurrentUser();
    const badgeText = document.getElementById('user-badge-text');
    const avatarEl = document.getElementById('user-avatar-icon');

    if (user) {
      if (badgeText) badgeText.textContent = user.name.length > 14 ? user.name.slice(0, 12) + '...' : user.name;
      if (avatarEl) avatarEl.textContent = user.name.charAt(0);
    } else {
      if (badgeText) badgeText.textContent = 'เข้าสู่ระบบ / สมัคร';
      if (avatarEl) avatarEl.innerHTML = '<i class="fas fa-user"></i>';
    }
  }
};
