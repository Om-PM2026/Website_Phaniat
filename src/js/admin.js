/**
 * Officer / Admin Simulator: Allows previewing government backend operations
 */
import { store } from './store.js';
import { payment } from './payment.js';
import { emergency } from './emergency.js';
import { complaints } from './complaints.js';

export const admin = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const adminToggleBtn = document.getElementById('admin-demo-toggle-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminClose = document.getElementById('admin-modal-close');

    if (adminToggleBtn) {
      adminToggleBtn.addEventListener('click', () => {
        this.renderAdminData();
        if (adminModal) adminModal.classList.add('open');
      });
    }

    if (adminClose) {
      adminClose.addEventListener('click', () => {
        if (adminModal) adminModal.classList.remove('open');
      });
    }

    // Admin Tab Navigation
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.target;
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(target);
        if (pane) pane.classList.add('active');
      });
    });
  },

  renderAdminData() {
    this.renderEmergencyList();
    this.renderComplaintsList();
    this.renderInvoicesList();
  },

  renderEmergencyList() {
    const container = document.getElementById('admin-emergency-list');
    if (!container) return;

    const list = store.getEmergencyReports();
    if (list.length === 0) {
      container.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 1rem;">ไม่มีรายการแจ้งเหตุฉุกเฉิน</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;">
        <div class="d-flex justify-between align-center" style="margin-bottom: 0.35rem;">
          <strong style="color: var(--danger);">${item.id} - ${item.type}</strong>
          <span class="badge ${item.status === 'resolved' ? 'badge-success' : 'badge-danger'}">${item.statusLabel}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          <strong>ผู้แจ้ง:</strong> ${item.reporterName} (${item.reporterPhone}) | <strong>เวลา:</strong> ${item.timestamp}
        </p>
        <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">${item.details}</p>
        <div class="d-flex gap-1">
          <button class="btn btn-outline-primary btn-sm admin-update-emg" data-id="${item.id}" data-status="in_progress" data-label="เจ้าหน้าที่กู้ชีพกำลังเดินทาง">
            <i class="fas fa-ambulance"></i> ส่งเจ้าหน้าที่
          </button>
          <button class="btn btn-outline btn-sm admin-update-emg" data-id="${item.id}" data-status="resolved" data-label="ระงับเหตุและช่วยเหลือเรียบร้อย">
            <i class="fas fa-check-circle" style="color: var(--success);"></i> ระงับเหตุแล้ว
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.admin-update-emg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const status = e.currentTarget.dataset.status;
        const label = e.currentTarget.dataset.label;
        store.updateEmergencyStatus(id, status, label, 'เจ้าหน้าที่ศูนย์วิทยุ อบต.เพนียด อัปเดตสถานะ');
        this.renderEmergencyList();
        window.showToast(`อัปเดตสถานะ ${id} เรียบร้อยแล้ว`, 'success');
      });
    });
  },

  renderComplaintsList() {
    const container = document.getElementById('admin-complaints-list');
    if (!container) return;

    const list = store.getComplaints();
    if (list.length === 0) {
      container.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 1rem;">ไม่มีเรื่องร้องทุกข์</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;">
        <div class="d-flex justify-between align-center" style="margin-bottom: 0.35rem;">
          <strong style="color: var(--dark);">${item.id} - ${item.category}</strong>
          <span class="badge ${item.status === 'completed' ? 'badge-success' : 'badge-warning'}">${item.statusLabel}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">
          <strong>หัวข้อ:</strong> ${item.title} | <strong>สถานที่:</strong> ${item.location.addressText}
        </p>
        <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">${item.details}</p>
        <div class="d-flex gap-1">
          <button class="btn btn-outline-primary btn-sm admin-update-cmp" data-id="${item.id}" data-status="fixing" data-label="กองช่างเข้าดำเนินการแก้ไขพื้นที่">
            <i class="fas fa-tools"></i> ส่งทีมช่างเข้าซ่อม
          </button>
          <button class="btn btn-outline btn-sm admin-update-cmp" data-id="${item.id}" data-status="completed" data-label="ดำเนินการแก้ไขเสร็จสิ้นเรียบร้อย">
            <i class="fas fa-check-circle" style="color: var(--success);"></i> ดำเนินการเสร็จสิ้น
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.admin-update-cmp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const status = e.currentTarget.dataset.status;
        const label = e.currentTarget.dataset.label;
        store.updateComplaintStatus(id, status, label, 'กองช่าง/กองสาธารณสุข อบต.เพนียด ดำเนินการ');
        this.renderComplaintsList();
        complaints.renderRecentComplaints();
        window.showToast(`อัปเดตเรื่องร้องเรียน ${id} เรียบร้อยแล้ว`, 'success');
      });
    });
  },

  renderInvoicesList() {
    const container = document.getElementById('admin-invoices-list');
    if (!container) return;

    const list = store.getInvoices();
    container.innerHTML = list.map(item => `
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600;">${item.customerName} - ${item.typeName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Ref: ${item.refNumber} | ฿${item.amount.toFixed(2)}</div>
        </div>
        <div>
          <span class="badge ${item.status === 'paid' ? 'badge-success' : 'badge-warning'}">
            ${item.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
          </span>
        </div>
      </div>
    `).join('');
  }
};
