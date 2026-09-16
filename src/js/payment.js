/**
 * Payment Module: Smart E-Payment for Taxes, Water & Waste fees
 * Includes PromptPay QR Code Generation and E-Receipt rendering
 */
import { store } from './store.js';

let currentSelectedInvoice = null;
let activePaymentType = 'all';

export const payment = {
  init() {
    this.bindEvents();
    this.renderInvoices();
  },

  bindEvents() {
    // Type Filter Buttons
    const typeButtons = document.querySelectorAll('.payment-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaymentType = btn.dataset.type || 'all';
        this.renderInvoices();
      });
    });

    // Search Input & Button
    const searchBtn = document.getElementById('payment-search-btn');
    const searchInput = document.getElementById('payment-search-input');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.renderInvoices());
    }
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.renderInvoices();
      });
    }

    // PromptPay QR Modal
    const qrModalClose = document.getElementById('promptpay-modal-close');
    if (qrModalClose) {
      qrModalClose.addEventListener('click', () => {
        document.getElementById('promptpay-modal').classList.remove('open');
      });
    }

    const confirmPaymentBtn = document.getElementById('confirm-pay-btn');
    if (confirmPaymentBtn) {
      confirmPaymentBtn.addEventListener('click', () => this.handleConfirmPayment());
    }

    // Receipt Modal Close & Print
    const receiptClose = document.getElementById('receipt-modal-close');
    if (receiptClose) {
      receiptClose.addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.remove('open');
      });
    }

    const receiptPrintBtn = document.getElementById('receipt-print-btn');
    if (receiptPrintBtn) {
      receiptPrintBtn.addEventListener('click', () => {
        window.print();
      });
    }
  },

  renderInvoices() {
    const searchInput = document.getElementById('payment-search-input');
    const query = searchInput ? searchInput.value : '';
    const invoices = store.findInvoices(query, activePaymentType);
    const container = document.getElementById('payment-invoices-container');

    if (!container) return;

    if (invoices.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem 1rem;">
          <div style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">ไม่พบรายการที่ต้องชำระ</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            ไม่พบยอดค้างชำระสำหรับคำค้นหา "${query || 'ทั้งหมด'}" หรือท่านได้ชำระเรียบร้อยแล้ว
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
        ${invoices.map(inv => `
          <div class="bill-card">
            <div class="d-flex justify-between align-center" style="margin-bottom: 1rem;">
              <span class="badge ${this.getBadgeClass(inv.type)}">${inv.typeName}</span>
              <span class="badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}">
                ${inv.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระเงิน'}
              </span>
            </div>
            <h3 style="font-size: 1.15rem; margin-bottom: 0.25rem;">${inv.customerName}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              <i class="fas fa-map-marker-alt"></i> ${inv.address}
            </p>

            <div class="bill-row">
              <span style="color: var(--text-muted);">เลขที่ใบแจ้ง / Ref:</span>
              <strong>${inv.refNumber}</strong>
            </div>
            <div class="bill-row">
              <span style="color: var(--text-muted);">ประจำงวด/ปี:</span>
              <span>${inv.period}</span>
            </div>
            <div class="bill-row">
              <span style="color: var(--text-muted);">กำหนดชำระภายใน:</span>
              <span style="color: var(--danger); font-weight: 600;">${inv.dueDate}</span>
            </div>

            <div class="bill-total-row">
              <div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">ยอดเงินที่ต้องชำระ</div>
                <div class="bill-total-amount">฿${inv.amount.toFixed(2)}</div>
              </div>
              <div>
                ${inv.status === 'paid' ? `
                  <button class="btn btn-outline-primary btn-sm view-receipt-btn" data-id="${inv.id}">
                    <i class="fas fa-receipt"></i> ดูใบเสร็จ
                  </button>
                ` : `
                  <button class="btn btn-primary btn-sm pay-now-btn" data-id="${inv.id}">
                    <i class="fas fa-qrcode"></i> สแกนจ่าย QR
                  </button>
                `}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach Event Listeners to Buttons
    container.querySelectorAll('.pay-now-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const inv = store.getInvoices().find(i => i.id === id);
        if (inv) this.openPromptPayModal(inv);
      });
    });

    container.querySelectorAll('.view-receipt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const inv = store.getInvoices().find(i => i.id === id);
        if (inv) this.showReceiptModal(inv);
      });
    });
  },

  getBadgeClass(type) {
    switch (type) {
      case 'water': return 'badge-primary';
      case 'waste': return 'badge-warning';
      case 'tax': return 'badge-danger';
      default: return 'badge-secondary';
    }
  },

  openPromptPayModal(invoice) {
    currentSelectedInvoice = invoice;
    const modal = document.getElementById('promptpay-modal');
    if (!modal) return;

    document.getElementById('pp-modal-customer').textContent = invoice.customerName;
    document.getElementById('pp-modal-type').textContent = invoice.typeName;
    document.getElementById('pp-modal-amount').textContent = `฿${invoice.amount.toFixed(2)}`;
    document.getElementById('pp-modal-ref').textContent = `REF: ${invoice.refNumber} | TAXID: 0994000358821`;

    // Generate Visual QR (using SVG pattern for crisp display)
    const qrBox = document.getElementById('promptpay-qr-box');
    if (qrBox) {
      qrBox.innerHTML = this.generateSVGQRCode(invoice.amount, invoice.refNumber);
    }

    modal.classList.add('open');
  },

  generateSVGQRCode(amount, ref) {
    // Generate authentic styled PromptPay QR block with realistic visual QR matrix
    return `
      <div style="background: white; padding: 12px; border-radius: 8px; display: inline-block;">
        <svg viewBox="0 0 160 160" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
          <!-- Position Detection Patterns (Top-Left) -->
          <rect x="10" y="10" width="40" height="40" fill="#003764" rx="4"/>
          <rect x="16" y="16" width="28" height="28" fill="#fff" rx="2"/>
          <rect x="22" y="22" width="16" height="16" fill="#003764" rx="2"/>

          <!-- Position Detection Patterns (Top-Right) -->
          <rect x="110" y="10" width="40" height="40" fill="#003764" rx="4"/>
          <rect x="116" y="16" width="28" height="28" fill="#fff" rx="2"/>
          <rect x="122" y="22" width="16" height="16" fill="#003764" rx="2"/>

          <!-- Position Detection Patterns (Bottom-Left) -->
          <rect x="10" y="110" width="40" height="40" fill="#003764" rx="4"/>
          <rect x="16" y="116" width="28" height="28" fill="#fff" rx="2"/>
          <rect x="22" y="122" width="16" height="16" fill="#003764" rx="2"/>

          <!-- Random-like high density QR Data blocks representing Thai PromptPay ISO Payload -->
          <g fill="#003764">
            <rect x="60" y="15" width="8" height="8"/>
            <rect x="75" y="15" width="12" height="8"/>
            <rect x="95" y="15" width="8" height="8"/>
            <rect x="60" y="30" width="16" height="8"/>
            <rect x="85" y="30" width="8" height="8"/>
            <rect x="60" y="45" width="8" height="16"/>
            <rect x="80" y="45" width="12" height="8"/>
            
            <rect x="15" y="60" width="8" height="16"/>
            <rect x="30" y="60" width="14" height="8"/>
            <rect x="50" y="60" width="10" height="10"/>
            <rect x="70" y="60" width="20" height="8"/>
            <rect x="100" y="60" width="8" height="16"/>
            <rect x="120" y="60" width="16" height="8"/>
            <rect x="140" y="60" width="8" height="10"/>

            <rect x="20" y="80" width="12" height="8"/>
            <rect x="40" y="80" width="8" height="16"/>
            <rect x="60" y="80" width="14" height="8"/>
            <rect x="85" y="80" width="10" height="10"/>
            <rect x="110" y="80" width="12" height="8"/>
            <rect x="130" y="80" width="14" height="14"/>

            <rect x="60" y="100" width="10" height="12"/>
            <rect x="80" y="100" width="16" height="8"/>
            <rect x="105" y="100" width="8" height="14"/>
            <rect x="125" y="100" width="18" height="8"/>

            <rect x="60" y="120" width="14" height="8"/>
            <rect x="80" y="120" width="8" height="16"/>
            <rect x="100" y="120" width="14" height="8"/>
            <rect x="125" y="120" width="10" height="12"/>
            <rect x="140" y="120" width="8" height="8"/>

            <rect x="60" y="140" width="22" height="8"/>
            <rect x="90" y="140" width="12" height="8"/>
            <rect x="110" y="140" width="8" height="10"/>
            <rect x="125" y="140" width="18" height="8"/>
          </g>

          <!-- PromptPay Emblem Center -->
          <rect x="66" y="66" width="28" height="28" fill="#fff" rx="4" stroke="#003764" stroke-width="1.5"/>
          <text x="80" y="84" font-size="12" font-weight="bold" fill="#003764" text-anchor="middle" font-family="sans-serif">TH</text>
        </svg>
      </div>
    `;
  },

  handleConfirmPayment() {
    if (!currentSelectedInvoice) return;

    const paidInvoice = store.payInvoice(currentSelectedInvoice.id);

    document.getElementById('promptpay-modal').classList.remove('open');
    this.renderInvoices();

    window.showToast(`ชำระเงิน ${paidInvoice.typeName} ยอด ฿${paidInvoice.amount.toFixed(2)} สำเร็จเรียบร้อย!`, 'success');
    this.showReceiptModal(paidInvoice);
  },

  showReceiptModal(inv) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    document.getElementById('receipt-no').textContent = inv.receiptNumber || 'RCP-' + Date.now().toString().slice(-6);
    document.getElementById('receipt-date').textContent = inv.paidAt || new Date().toLocaleString('th-TH');
    document.getElementById('receipt-customer').textContent = inv.customerName;
    document.getElementById('receipt-address').textContent = inv.address;
    document.getElementById('receipt-item-title').textContent = `${inv.typeName} (${inv.period})`;
    document.getElementById('receipt-item-ref').textContent = `รหัสอ้างอิง: ${inv.refNumber}`;
    document.getElementById('receipt-item-amount').textContent = `฿${inv.amount.toFixed(2)}`;
    document.getElementById('receipt-total-amount').textContent = `฿${inv.amount.toFixed(2)}`;

    modal.classList.add('open');
  }
};
