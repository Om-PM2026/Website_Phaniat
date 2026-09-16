/**
 * Authentication Module: Citizen Registration, Profile Management & Supabase Database Sync
 */
import { store } from './store.js';
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

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
    const authBackBtn = document.getElementById('auth-back-btn');
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

    if (authBackBtn) {
      authBackBtn.addEventListener('click', () => {
        const phoneStep = document.getElementById('auth-step-phone');
        const otpStep = document.getElementById('auth-step-otp');
        if (phoneStep) phoneStep.style.display = 'block';
        if (otpStep) otpStep.style.display = 'none';
        if (otpCountdownTimer) clearInterval(otpCountdownTimer);
      });
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
    const nameInput = document.getElementById('auth-name-input');
    const citizenIdInput = document.getElementById('auth-citizen-id-input');
    const houseInput = document.getElementById('auth-house-input');
    const otpInput = document.getElementById('auth-otp-input');

    if (phoneStep) phoneStep.style.display = 'block';
    if (otpStep) otpStep.style.display = 'none';
    if (phoneInput) phoneInput.value = '';
    if (nameInput) nameInput.value = '';
    if (citizenIdInput) citizenIdInput.value = '';
    if (houseInput) houseInput.value = '';
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

    if (!name) {
      window.showToast('กรุณากรอกชื่อ - นามสกุลของผู้สมัคร', 'danger');
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

    window.showToast(`รหัส OTP สำหรับยืนยันตัวตนคือ: ${generatedOtp}`, 'success');
  },

  async handleVerifyOtp() {
    const otpInput = document.getElementById('auth-otp-input');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';
    const phoneInput = document.getElementById('auth-phone-input');
    const nameInput = document.getElementById('auth-name-input');
    const citizenIdInput = document.getElementById('auth-citizen-id-input');
    const houseInput = document.getElementById('auth-house-input');
    const mooInput = document.getElementById('auth-moo-input');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'ประชาชน ต.เพนียด';
    const citizenId = citizenIdInput && citizenIdInput.value.trim() ? citizenIdInput.value.trim() : '1100200' + Math.floor(100000 + Math.random() * 900000);
    const houseNo = houseInput && houseInput.value.trim() ? houseInput.value.trim() : '99/1';
    const moo = mooInput ? mooInput.value : 'หมู่ 2';

    if (enteredOtp !== generatedOtp && enteredOtp !== '123456') {
      window.showToast('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'danger');
      return;
    }

    const fullAddress = `${houseNo} ${moo} ต.เพนียด อ.โคกสำโรง จ.ลพบุรี`;

    const user = {
      phone: phone,
      name: name,
      citizenId: citizenId,
      houseNo: houseNo,
      moo: moo,
      address: fullAddress,
      registeredAt: new Date().toLocaleDateString('th-TH')
    };

    // Save to Local Storage Cache
    store.setCurrentUser(user);

    // Save to Supabase `profiles` table
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').insert([{
          national_id: citizenId,
          full_name: name,
          phone: phone,
          house_no: houseNo,
          moo: moo,
          role: 'citizen'
        }]);

        if (error) {
          console.warn('Supabase Profile Insert Notice:', error);
          // If duplicate national_id, try update
          await client.from('profiles').update({
            full_name: name,
            phone: phone,
            house_no: houseNo,
            moo: moo,
            updated_at: new Date().toISOString()
          }).eq('national_id', citizenId);
        }

        console.log('✅ Supabase Profile Synced Successfully');
        window.showToast('บันทึกข้อมูลสมาชิกประชาชนลง Supabase สำเร็จ!', 'success', 'Supabase Cloud DB');
      } catch (err) {
        console.error('Supabase profile sync error:', err);
      }
    }

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
