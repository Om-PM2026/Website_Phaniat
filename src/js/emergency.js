/**
 * Emergency Module: Emergency Reporting, Geolocation, Interactive Map & Tracking
 */
import { store } from './store.js';

let emergencyMap = null;
let emergencyMarker = null;
let emergencyUploadedPhotos = [];
let defaultCoordinates = { lat: 14.8550, lng: 100.6150 }; // Phaniat Subdistrict Center coords

export const emergency = {
  init() {
    this.initMap();
    this.bindEvents();
  },

  initMap() {
    const mapElement = document.getElementById('emergency-map');
    if (!mapElement || typeof L === 'undefined') return;

    if (emergencyMap) {
      emergencyMap.remove();
    }

    try {
      emergencyMap = L.map('emergency-map').setView([defaultCoordinates.lat, defaultCoordinates.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(emergencyMap);

      emergencyMarker = L.marker([defaultCoordinates.lat, defaultCoordinates.lng], {
        draggable: true
      }).addTo(emergencyMap);

      emergencyMarker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        this.updateCoordsDisplay(position.lat, position.lng);
      });

      emergencyMap.on('click', (e) => {
        emergencyMarker.setLatLng(e.latlng);
        this.updateCoordsDisplay(e.latlng.lat, e.latlng.lng);
      });

      this.updateCoordsDisplay(defaultCoordinates.lat, defaultCoordinates.lng);
    } catch (err) {
      console.warn('Map initialization:', err);
    }
  },

  updateCoordsDisplay(lat, lng) {
    const coordsEl = document.getElementById('emergency-coords-display');
    const latInput = document.getElementById('emergency-lat-input');
    const lngInput = document.getElementById('emergency-lng-input');

    if (coordsEl) coordsEl.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);
  },

  bindEvents() {
    const locateBtn = document.getElementById('emergency-get-location-btn');
    const fileInput = document.getElementById('emergency-file-input');
    const dropzone = document.getElementById('emergency-dropzone');
    const form = document.getElementById('emergency-form');
    const trackSearchBtn = document.getElementById('emergency-track-btn');

    if (locateBtn) {
      locateBtn.addEventListener('click', () => this.getCurrentLocation());
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handlePhotoFiles(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handlePhotoFiles(e.target.files);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmitEmergency();
      });
    }

    if (trackSearchBtn) {
      trackSearchBtn.addEventListener('click', () => this.handleSearchTracking());
    }

    // Emergency tracking modal close
    const trackModalClose = document.getElementById('track-modal-close');
    if (trackModalClose) {
      trackModalClose.addEventListener('click', () => {
        document.getElementById('emergency-track-modal').classList.remove('open');
      });
    }
  },

  getCurrentLocation() {
    const locateBtn = document.getElementById('emergency-get-location-btn');
    if (!navigator.geolocation) {
      window.showToast('เบราว์เซอร์ไม่รองรับการดึงพิกัด GPS อัตโนมัติ กรุณาปักหมุดบนแผนที่', 'warning');
      return;
    }

    if (locateBtn) {
      locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังระบุตำแหน่ง...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (emergencyMap && emergencyMarker) {
          emergencyMap.setView([lat, lng], 16);
          emergencyMarker.setLatLng([lat, lng]);
        }
        this.updateCoordsDisplay(lat, lng);

        if (locateBtn) {
          locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> ดึงพิกัดปัจจุบันสำเร็จ';
        }
        window.showToast('ดึงพิกัด GPS ปัจจุบันสำเร็จแล้ว', 'success');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Fallback to demo phaniat coordinates
        const demoLat = 14.8550 + (Math.random() - 0.5) * 0.01;
        const demoLng = 100.6150 + (Math.random() - 0.5) * 0.01;
        if (emergencyMap && emergencyMarker) {
          emergencyMap.setView([demoLat, demoLng], 15);
          emergencyMarker.setLatLng([demoLat, demoLng]);
        }
        this.updateCoordsDisplay(demoLat, demoLng);

        if (locateBtn) {
          locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> ดึงพิกัด GPS ของฉัน';
        }
        window.showToast('ใช้พิกัดจำลองในพื้นที่ตำบลเพนียด (เนื่องจากไม่ได้อนุญาต GPS)', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  handlePhotoFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        emergencyUploadedPhotos.push(e.target.result);
        this.renderPhotoPreviews();
      };
      reader.readAsDataURL(file);
    });
  },

  renderPhotoPreviews() {
    const grid = document.getElementById('emergency-photo-previews');
    if (!grid) return;
    grid.innerHTML = '';

    emergencyUploadedPhotos.forEach((src, idx) => {
      const item = document.createElement('div');
      item.className = 'dropzone-preview-item';
      item.innerHTML = `
        <img src="${src}" alt="Preview ${idx + 1}" />
        <button type="button" class="dropzone-remove-btn" data-idx="${idx}">&times;</button>
      `;
      grid.appendChild(item);

      item.querySelector('.dropzone-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        emergencyUploadedPhotos.splice(idx, 1);
        this.renderPhotoPreviews();
      });
    });
  },

  handleSubmitEmergency() {
    const typeSelect = document.getElementById('emergency-type-select');
    const phoneInput = document.getElementById('emergency-phone-input');
    const nameInput = document.getElementById('emergency-name-input');
    const addressInput = document.getElementById('emergency-address-input');
    const detailsInput = document.getElementById('emergency-details-input');
    const latInput = document.getElementById('emergency-lat-input');
    const lngInput = document.getElementById('emergency-lng-input');

    const type = typeSelect ? typeSelect.value : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const details = detailsInput ? detailsInput.value.trim() : '';

    if (!type) {
      window.showToast('กรุณาเลือกประเภทเหตุฉุกเฉิน', 'danger');
      return;
    }
    if (!phone) {
      window.showToast('กรุณาระบุเบอร์โทรศัพท์ติดต่อกลับ', 'danger');
      return;
    }
    if (!details) {
      window.showToast('กรุณาระบุรายละเอียดเหตุฉุกเฉิน', 'danger');
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `EMG-2026-${randomNum}`;

    const report = {
      id: trackingCode,
      type: type,
      reporterPhone: phone,
      reporterName: nameInput ? nameInput.value.trim() || 'พลเมืองดี' : 'พลเมืองดี',
      location: {
        lat: parseFloat(latInput ? latInput.value : 14.8550),
        lng: parseFloat(lngInput ? lngInput.value : 100.6150),
        addressText: addressInput ? addressInput.value.trim() : 'ตำบลเพนียด'
      },
      details: details,
      images: emergencyUploadedPhotos.length > 0 ? [...emergencyUploadedPhotos] : [
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80'
      ],
      status: 'pending',
      statusLabel: 'รับแจ้งเหตุแล้ว เจ้าหน้าที่กำลังประสานงาน',
      timestamp: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      timeline: [
        {
          status: 'รับเรื่องแจ้งเหตุฉุกเฉิน',
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          note: 'ระบบบันทึกพิกัดและข้อมูลส่งต่อไปยังศูนย์สั่งการ อบต.เพนียด'
        }
      ]
    };

    store.addEmergencyReport(report);

    // Reset Form
    if (document.getElementById('emergency-form')) {
      document.getElementById('emergency-form').reset();
    }
    emergencyUploadedPhotos = [];
    this.renderPhotoPreviews();

    // Show Success Modal / Toast
    window.showToast(`ส่งข้อมูลแจ้งเหตุสำเร็จ! รหัสติดตามเหตุของคุณคือ: ${trackingCode}`, 'success');
    this.showTrackingModal(report);
  },

  handleSearchTracking() {
    const input = document.getElementById('emergency-search-code-input');
    const code = input ? input.value.trim() : '';

    if (!code) {
      window.showToast('กรุณากรอกรหัสแจ้งเหตุ (เช่น EMG-2026-0012)', 'warning');
      return;
    }

    const reports = store.getEmergencyReports();
    const item = reports.find(r => r.id.toLowerCase() === code.toLowerCase());

    if (!item) {
      window.showToast(`ไม่พบข้อมูลรหัสแจ้งเหตุ ${code}`, 'danger');
      return;
    }

    this.showTrackingModal(item);
  },

  showTrackingModal(report) {
    const modal = document.getElementById('emergency-track-modal');
    if (!modal) return;

    document.getElementById('track-modal-code').textContent = report.id;
    document.getElementById('track-modal-type').textContent = report.type;
    document.getElementById('track-modal-time').textContent = report.timestamp;
    document.getElementById('track-modal-location').textContent = report.location.addressText || `${report.location.lat}, ${report.location.lng}`;
    document.getElementById('track-modal-status-badge').textContent = report.statusLabel;

    // Render Timeline Steps
    const timelineEl = document.getElementById('track-modal-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = '';
      (report.timeline || []).forEach((step, idx) => {
        const stepEl = document.createElement('div');
        stepEl.className = `timeline-step ${idx === report.timeline.length - 1 ? 'current' : 'completed'}`;
        stepEl.innerHTML = `
          <div class="timeline-dot"><i class="fas fa-check" style="font-size: 0.6rem;"></i></div>
          <div class="timeline-content">
            <h4>${step.status} <span class="timeline-time">(${step.time})</span></h4>
            <p>${step.note || ''}</p>
          </div>
        `;
        timelineEl.appendChild(stepEl);
      });
    }

    modal.classList.add('open');
  }
};
