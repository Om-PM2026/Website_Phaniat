/**
 * Complaints Module: General Grievances, Public Works & Community Issues
 */
import { store } from './store.js';

let complaintMap = null;
let complaintMarker = null;
let complaintUploadedPhotos = [];
let defaultCoordinates = { lat: 14.8550, lng: 100.6150 };

export const complaints = {
  init() {
    this.initMap();
    this.bindEvents();
    this.renderRecentComplaints();
  },

  initMap() {
    const mapElement = document.getElementById('complaint-map');
    if (!mapElement || typeof L === 'undefined') return;

    if (complaintMap) {
      complaintMap.remove();
    }

    try {
      complaintMap = L.map('complaint-map').setView([defaultCoordinates.lat, defaultCoordinates.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(complaintMap);

      complaintMarker = L.marker([defaultCoordinates.lat, defaultCoordinates.lng], {
        draggable: true
      }).addTo(complaintMap);

      complaintMarker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        this.updateCoordsDisplay(position.lat, position.lng);
      });

      complaintMap.on('click', (e) => {
        complaintMarker.setLatLng(e.latlng);
        this.updateCoordsDisplay(e.latlng.lat, e.latlng.lng);
      });

      this.updateCoordsDisplay(defaultCoordinates.lat, defaultCoordinates.lng);
    } catch (err) {
      console.warn('Complaint Map Init:', err);
    }
  },

  updateCoordsDisplay(lat, lng) {
    const coordsEl = document.getElementById('complaint-coords-display');
    const latInput = document.getElementById('complaint-lat-input');
    const lngInput = document.getElementById('complaint-lng-input');

    if (coordsEl) coordsEl.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);
  },

  bindEvents() {
    const locateBtn = document.getElementById('complaint-get-location-btn');
    const fileInput = document.getElementById('complaint-file-input');
    const dropzone = document.getElementById('complaint-dropzone');
    const form = document.getElementById('complaint-form');
    const trackBtn = document.getElementById('complaint-track-search-btn');

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
        this.handleSubmitComplaint();
      });
    }

    if (trackBtn) {
      trackBtn.addEventListener('click', () => this.handleSearchTracking());
    }

    const modalClose = document.getElementById('complaint-track-modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        document.getElementById('complaint-track-modal').classList.remove('open');
      });
    }
  },

  getCurrentLocation() {
    const locateBtn = document.getElementById('complaint-get-location-btn');
    if (!navigator.geolocation) {
      window.showToast('เบราว์เซอร์ไม่รองรับการดึงพิกัด GPS อัตโนมัติ กรุณาปักหมุดบนแผนที่', 'warning');
      return;
    }

    if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังระบุ...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (complaintMap && complaintMarker) {
          complaintMap.setView([lat, lng], 16);
          complaintMarker.setLatLng([lat, lng]);
        }
        this.updateCoordsDisplay(lat, lng);
        if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> ดึงพิกัดปัจจุบันสำเร็จ';
        window.showToast('ระบุพิกัดสถานที่เกิดเหตุสำเร็จแล้ว', 'success');
      },
      () => {
        const demoLat = 14.8600;
        const demoLng = 100.6180;
        if (complaintMap && complaintMarker) {
          complaintMap.setView([demoLat, demoLng], 15);
          complaintMarker.setLatLng([demoLat, demoLng]);
        }
        this.updateCoordsDisplay(demoLat, demoLng);
        if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-crosshairs"></i> ดึงพิกัดของฉัน';
        window.showToast('ใช้พิกัดจำลองในเขต ต.เพนียด', 'info');
      }
    );
  },

  handlePhotoFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        complaintUploadedPhotos.push(e.target.result);
        this.renderPhotoPreviews();
      };
      reader.readAsDataURL(file);
    });
  },

  renderPhotoPreviews() {
    const grid = document.getElementById('complaint-photo-previews');
    if (!grid) return;
    grid.innerHTML = '';

    complaintUploadedPhotos.forEach((src, idx) => {
      const item = document.createElement('div');
      item.className = 'dropzone-preview-item';
      item.innerHTML = `
        <img src="${src}" alt="Preview" />
        <button type="button" class="dropzone-remove-btn" data-idx="${idx}">&times;</button>
      `;
      grid.appendChild(item);

      item.querySelector('.dropzone-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        complaintUploadedPhotos.splice(idx, 1);
        this.renderPhotoPreviews();
      });
    });
  },

  handleSubmitComplaint() {
    const categorySelect = document.getElementById('complaint-category-select');
    const titleInput = document.getElementById('complaint-title-input');
    const detailsInput = document.getElementById('complaint-details-input');
    const phoneInput = document.getElementById('complaint-phone-input');
    const nameInput = document.getElementById('complaint-name-input');
    const addressInput = document.getElementById('complaint-address-input');
    const anonCheckbox = document.getElementById('complaint-anon-checkbox');
    const latInput = document.getElementById('complaint-lat-input');
    const lngInput = document.getElementById('complaint-lng-input');

    const category = categorySelect ? categorySelect.value : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const details = detailsInput ? detailsInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const isAnonymous = anonCheckbox ? anonCheckbox.checked : false;

    if (!category) {
      window.showToast('กรุณาเลือกหมวดหมู่เรื่องร้องเรียน', 'danger');
      return;
    }
    if (!title) {
      window.showToast('กรุณาระบุหัวข้อเรื่องร้องทุกข์', 'danger');
      return;
    }
    if (!details) {
      window.showToast('กรุณาระบุรายละเอียดเรื่องร้องทุกข์', 'danger');
      return;
    }
    if (!isAnonymous && !phone) {
      window.showToast('กรุณาระบุเบอร์โทรศัพท์ หรือเลือก "ไม่เปิดเผยตัวตน"', 'danger');
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `CMP-2026-${randomNum}`;

    const complaint = {
      id: trackingCode,
      category: category,
      title: title,
      reporterPhone: isAnonymous ? 'ไม่เปิดเผย' : phone,
      reporterName: isAnonymous ? 'ประชาชนไม่ประสงค์ออกนาม' : (nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'ประชาชน'),
      isAnonymous: isAnonymous,
      location: {
        lat: parseFloat(latInput ? latInput.value : 14.8550),
        lng: parseFloat(lngInput ? lngInput.value : 100.6150),
        addressText: addressInput ? addressInput.value.trim() : 'ตำบลเพนียด'
      },
      details: details,
      images: complaintUploadedPhotos.length > 0 ? [...complaintUploadedPhotos] : [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80'
      ],
      status: 'received',
      statusLabel: 'รับเรื่องร้องทุกข์แล้ว รอการตรวจสอบ',
      timestamp: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      timeline: [
        {
          status: 'รับเรื่องร้องทุกข์',
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          note: 'เจ้าหน้าที่ศูนย์รับเรื่องราวร้องทุกข์ อบต.เพนียด รับเรื่องและลงทะเบียนในระบบ'
        }
      ]
    };

    store.addComplaint(complaint);

    if (document.getElementById('complaint-form')) {
      document.getElementById('complaint-form').reset();
    }
    complaintUploadedPhotos = [];
    this.renderPhotoPreviews();
    this.renderRecentComplaints();

    window.showToast(`บันทึกเรื่องร้องเรียนเรียบร้อย! รหัสติดตามเรื่องคือ: ${trackingCode}`, 'success');
    this.showTrackingModal(complaint);
  },

  renderRecentComplaints() {
    const listContainer = document.getElementById('recent-complaints-list');
    if (!listContainer) return;

    const list = store.getComplaints();
    listContainer.innerHTML = list.slice(0, 4).map(c => `
      <div class="card card-hover" style="margin-bottom: 1rem; padding: 1.25rem;">
        <div class="d-flex justify-between align-center" style="margin-bottom: 0.5rem;">
          <span class="badge badge-warning">${c.category}</span>
          <span class="badge badge-secondary">${c.timestamp}</span>
        </div>
        <h4 style="font-size: 1rem; margin-bottom: 0.35rem; color: var(--dark);">${c.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          <i class="fas fa-map-marker-alt"></i> ${c.location.addressText}
        </p>
        <div class="d-flex justify-between align-center">
          <span style="font-size: 0.82rem; font-weight: 600; color: var(--primary-dark);">
            <i class="fas fa-info-circle"></i> ${c.statusLabel}
          </span>
          <button class="btn btn-outline-primary btn-sm view-complaint-track" data-id="${c.id}">
            ติดตามผล (${c.id})
          </button>
        </div>
      </div>
    `).join('');

    listContainer.querySelectorAll('.view-complaint-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = store.getComplaints().find(c => c.id === id);
        if (item) this.showTrackingModal(item);
      });
    });
  },

  async handleSearchTracking() {
    const input = document.getElementById('complaint-search-input');
    const code = input ? input.value.trim() : '';

    if (!code) {
      window.showToast('กรุณากรอกรหัสเรื่องร้องทุกข์ (เช่น CMP-2026-0034)', 'warning');
      return;
    }

    let item = store.getComplaints().find(c => c.id.toLowerCase() === code.toLowerCase());
    if (!item) {
      await store.syncFromSupabase();
      item = store.getComplaints().find(c => c.id.toLowerCase() === code.toLowerCase());
    }

    if (!item) {
      window.showToast(`ไม่พบรหัสเรื่องร้องทุกข์ ${code}`, 'danger');
      return;
    }

    this.showTrackingModal(item);
  },

  showTrackingModal(complaint) {
    const modal = document.getElementById('complaint-track-modal');
    if (!modal) return;

    document.getElementById('cmp-modal-code').textContent = complaint.id;
    document.getElementById('cmp-modal-category').textContent = complaint.category;
    document.getElementById('cmp-modal-title').textContent = complaint.title;
    document.getElementById('cmp-modal-time').textContent = complaint.timestamp;
    document.getElementById('cmp-modal-location').textContent = complaint.location.addressText;
    document.getElementById('cmp-modal-status-badge').textContent = complaint.statusLabel;

    const timelineEl = document.getElementById('cmp-modal-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = '';
      (complaint.timeline || []).forEach((step, idx) => {
        const stepEl = document.createElement('div');
        stepEl.className = `timeline-step ${idx === complaint.timeline.length - 1 ? 'current' : 'completed'}`;
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
