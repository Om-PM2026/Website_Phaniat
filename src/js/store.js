/**
 * Central State, Supabase DB & LocalStorage Manager for Phaniat SAO Portal
 */
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'phaniat_current_user',
  EMERGENCY_REPORTS: 'phaniat_emergency_reports',
  COMPLAINTS: 'phaniat_complaints',
  INVOICES: 'phaniat_invoices',
  NEWS: 'phaniat_news',
  OFFICER_ROLE: 'phaniat_officer_role'
};

// Initial Seed Data for Demo & Authentic Phaniat SAO Look
const INITIAL_NEWS = [
  {
    id: 'news-01',
    category: 'activity',
    categoryLabel: 'กิจกรรม อบต.',
    title: 'อบต.เพนียด จัดโครงการส่งเสริมสุขภาพผู้สูงอายุและบริการตรวจสุขภาพเชิงรุก ประจำปี 2569',
    date: '15 ก.ย. 2569',
    author: 'กองสาธารณสุขและสิ่งแวดล้อม',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
    ],
    snippet: 'ขอเชิญชวนประชาชนและผู้สูงอายุในพื้นที่ตำบลเพนียด ร่วมกิจกรรมตรวจสุขภาพประจำปี ตรวจวัดความดัน และรับคำปรึกษาด้านโภชนาการฟรี ณ อาคารอเนกประสงค์ อบต.เพนียด',
    content: `องค์การบริหารส่วนตำบลเพนียด โดยกองสาธารณสุขและสิ่งแวดล้อม ได้จัดโครงการส่งเสริมสุขภาพผู้สูงอายุและบริการตรวจสุขภาพเชิงรุก ณ อาคารอเนกประสงค์ 
    ภายในงานมีกิจกรรมการตรวจคัดกรองเบาหวาน ความดันโลหิต การให้คำแนะนำเรื่องการออกกำลังกายที่เหมาะสมกับวัย และการมอบถุงยังชีพสุขภาพแก่ผู้สูงอายุติดเตียงในพื้นที่ตำบลเพนียด`
  },
  {
    id: 'news-02',
    category: 'announcement',
    categoryLabel: 'ข่าวประชาสัมพันธ์',
    title: 'ประชาสัมพันธ์การยื่นแบบและชำระภาษีที่ดินและสิ่งปลูกสร้าง และภาษีป้าย ประจำปี 2569',
    date: '10 ก.ย. 2569',
    author: 'กองคลัง อบต.เพนียด',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
    ],
    snippet: 'แจ้งเจ้าของที่ดิน สิ่งปลูกสร้าง และป้ายโฆษณาในเขตตำบลเพนียด สามารถตรวจสอบยอดและชำระภาษีผ่านระบบออนไลน์ Smart E-Payment ได้แล้ววันนี้',
    content: `กองคลัง อบต.เพนียด แจ้งให้ผู้มีหน้าที่เสียภาษีที่ดินและสิ่งปลูกสร้าง รวมถึงภาษีป้ายในเขตพื้นที่ตำบลเพนียด ดำเนินการตรวจสอบและชำระภาษีประจำปีภาษี 2569 โดยท่านสามารถค้นหาใบแจ้งประเมินภาษีผ่านระบบออนไลน์และสแกนจ่ายผ่าน QR Code พร้อมเพย์ หรือติดต่อ ณ กองคลัง อบต.เพนียด ในวันและเวลาราชการ`
  },
  {
    id: 'news-03',
    category: 'procurement',
    categoryLabel: 'ประกาศจัดซื้อจัดจ้าง',
    title: 'ประกาศประกวดราคาจ้างก่อสร้างถนนคอนกรีตเสริมเหล็ก สายบ้านเพนียด - บ้านหนองหว้า',
    date: '05 ก.ย. 2569',
    author: 'กองช่าง อบต.เพนียด',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80'
    ],
    snippet: 'ประกวดราคาจ้างก่อสร้างถนน คสล. พร้อมระบบระบายน้ำข้างทาง เพื่อพัฒนาเส้นทางการสัญจรและการขนส่งผลผลิตทางการเกษตรของพี่น้องประชาชน',
    content: `ประกาศองค์การบริหารส่วนตำบลเพนียด เรื่อง ประกวดราคาจ้างก่อสร้างถนนคอนกรีตเสริมเหล็ก สายบ้านเพนียด หมู่ที่ 1 ถึง บ้านหนองหว้า ด้วยวิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding) ผู้สนใจสามารถดูรายละเอียดและยื่นข้อเสนอผ่านทางระบบจัดซื้อจัดจ้างภาครัฐด้วยอิเล็กทรอนิกส์`
  },
  {
    id: 'news-04',
    category: 'knowledge',
    categoryLabel: 'สาระน่ารู้ท้องถิ่น',
    title: 'แนวทางการคัดแยกขยะในครัวเรือน ลดปริมาณขยะ สร้างรายได้สู่ชุมชนตำบลเพนียด',
    date: '01 ก.ย. 2569',
    author: 'งานประชาสัมพันธ์',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'
    ],
    snippet: 'เรียนรู้วิธีการคัดแยกขยะ 4 ประเภท (ขยะอินทรีย์, ขยะรีไซเคิล, ขยะอันตราย, ขยะทั่วไป) เพื่อรักษาสิ่งแวดล้อมตำบลเพนียดให้น่าอยู่',
    content: `อบต.เพนียด รณรงค์ให้ทุกครัวเรือนร่วมมือกันคัดแยกขยะตั้งแต่ต้นทาง เพื่อช่วยลดภาระการจัดเก็บและกำจัดขยะมูลฝอย พร้อมทั้งส่งเสริมการจัดตั้ง "ธนาคารขยะรีไซเคิลชุมชน" เพื่อเปลี่ยนขยะให้เป็นเงินออมสำหรับครอบครัว`
  }
];

const INITIAL_INVOICES = [
  {
    id: 'INV-2026-001',
    type: 'water',
    typeName: 'ค่าน้ำประปา อบต.',
    citizenId: '1100200345678',
    refNumber: 'MTR-8842',
    customerName: 'นายสมชาย เพนียดดี',
    address: '99/1 หมู่ที่ 2 ต.เพนียด',
    period: 'สิงหาคม 2569',
    units: 18,
    amount: 198.00,
    status: 'unpaid',
    dueDate: '25 ก.ย. 2569'
  },
  {
    id: 'INV-2026-002',
    type: 'waste',
    typeName: 'ค่าธรรมเนียมเก็บขยะมูลฝอย',
    citizenId: '1100200345678',
    refNumber: 'WST-2026-09',
    customerName: 'นายสมชาย เพนียดดี',
    address: '99/1 หมู่ที่ 2 ต.เพนียด',
    period: 'ประจำปี 2569 (ไตรมาส 3)',
    units: 1,
    amount: 120.00,
    status: 'unpaid',
    dueDate: '30 ก.ย. 2569'
  },
  {
    id: 'INV-2026-003',
    type: 'tax',
    typeName: 'ภาษีที่ดินและสิ่งปลูกสร้าง',
    citizenId: '1100200345678',
    refNumber: 'TAX-LD-5520',
    customerName: 'นายสมชาย เพนียดดี',
    address: 'โฉนดเลขที่ 4120 หมู่ 1 ต.เพนียด',
    period: 'ประจำปีภาษี 2569',
    units: 1,
    amount: 450.00,
    status: 'unpaid',
    dueDate: '31 ต.ค. 2569'
  },
  {
    id: 'INV-2026-004',
    type: 'water',
    typeName: 'ค่าน้ำประปา อบต.',
    citizenId: '0812345678',
    refNumber: 'MTR-1029',
    customerName: 'น.ส. สุภาภรณ์ ร่มรื่น',
    address: '45 หมู่ที่ 3 ต.เพนียด',
    period: 'สิงหาคม 2569',
    units: 24,
    amount: 264.00,
    status: 'unpaid',
    dueDate: '25 ก.ย. 2569'
  }
];

const INITIAL_EMERGENCY_REPORTS = [
  {
    id: 'EMG-2026-0012',
    type: 'อุบัติเหตุทางถนน',
    reporterPhone: '0812345678',
    reporterName: 'พลเมืองดี',
    location: {
      lat: 14.8562,
      lng: 100.6124,
      addressText: 'หน้าโรงเรียนวัดเพนียด ถนนสายหลัก ม.2 ต.เพนียด'
    },
    details: 'รถจักรยานยนต์เฉี่ยวชนกับรถกระบะ มีผู้บาดเจ็บถลอก 1 ราย รู้สึกตัวดี ต้องการกู้ชีพปฐมพยาบาล',
    images: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80'],
    status: 'in_progress',
    statusLabel: 'เจ้าหน้าที่กำลังเดินทางไปที่เกิดเหตุ',
    timestamp: '16 ก.ย. 2569 14:15 น.',
    timeline: [
      { status: 'รับแจ้งเหตุแล้ว', time: '14:15 น.', note: 'ศูนย์วิทยุ อบต.เพนียด รับเรื่อง' },
      { status: 'สั่งการชุดกู้ชีพ', time: '14:18 น.', note: 'รถพยาบาลฉุกเฉินออกปฏิบัติการ' }
    ]
  }
];

const INITIAL_COMPLAINTS = [
  {
    id: 'CMP-2026-0034',
    category: 'ถนนชำรุด / หลุมบ่อ',
    title: 'ผิวจราจรเป็นหลุมขนาดใหญ่ทางเข้าซอย 4',
    reporterPhone: '0898765432',
    reporterName: 'นายวิชัย สุขเกษม',
    isAnonymous: false,
    location: {
      lat: 14.8601,
      lng: 100.6150,
      addressText: 'ปากซอยร่วมใจพัฒนา หมู่ที่ 4 ต.เพนียด'
    },
    details: 'ถนนลาดยางชำรุดเป็นหลุมลึก มีน้ำขัง รถเล็กสัญจรลำบาก เกรงว่าจะเกิดอุบัติเหตุในเวลากลางคืน',
    images: ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80'],
    status: 'investigating',
    statusLabel: 'กองช่างรับเรื่องและลงพื้นที่สำรวจแล้ว',
    timestamp: '14 ก.ย. 2569 09:30 น.',
    timeline: [
      { status: 'รับเรื่องร้องทุกข์', time: '14 ก.ย. 09:30 น.', note: 'งานรับเรื่องราวร้องทุกข์ลงทะเบียนระบบ' },
      { status: 'ส่งต่อกองช่าง', time: '14 ก.ย. 13:00 น.', note: 'มอบหมายนายช่างโยธาเข้าสำรวจปริมาณงานซ่อม' }
    ]
  }
];

export const store = {
  async init() {
    // 1. Initial Local Storage fallback
    if (!localStorage.getItem(STORAGE_KEYS.NEWS)) {
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(INITIAL_NEWS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(INITIAL_EMERGENCY_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    }

    // 2. If Supabase is configured, sync initial data from database & subscribe to Realtime
    if (isSupabaseConfigured()) {
      await this.syncFromSupabase();
      this.subscribeRealtime();
    }
  },

  async syncFromSupabase() {
    const client = getSupabase();
    if (!client) return;

    try {
      // Sync News
      const { data: newsData, error: newsErr } = await client.from('news').select('*').order('created_at', { ascending: false });
      if (!newsErr && newsData && newsData.length > 0) {
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(newsData.map(n => ({
          ...n,
          categoryLabel: n.category_label || n.categoryLabel
        }))));
      }

      // Sync Invoices
      const { data: invData, error: invErr } = await client.from('invoices').select('*').order('created_at', { ascending: false });
      if (!invErr && invData && invData.length > 0) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invData.map(i => ({
          ...i,
          typeName: i.type_name || i.typeName,
          citizenId: i.citizen_id || i.citizenId,
          refNumber: i.ref_number || i.refNumber,
          customerName: i.customer_name || i.customerName,
          dueDate: i.due_date || i.dueDate,
          paidAt: i.paid_at || i.paidAt,
          receiptNumber: i.receipt_number || i.receiptNumber,
          paymentSlip: i.payment_slip || i.paymentSlip
        }))));
      }

      // Sync Emergency Reports
      const { data: emgData, error: emgErr } = await client.from('emergency_reports').select('*').order('created_at', { ascending: false });
      if (!emgErr && emgData && emgData.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(emgData.map(e => ({
          ...e,
          reporterPhone: e.reporter_phone || e.reporterPhone,
          reporterName: e.reporter_name || e.reporterName,
          statusLabel: e.status_label || e.statusLabel
        }))));
      }

      // Sync Complaints
      const { data: cmpData, error: cmpErr } = await client.from('complaints').select('*').order('created_at', { ascending: false });
      if (!cmpErr && cmpData && cmpData.length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(cmpData.map(c => ({
          ...c,
          reporterPhone: c.reporter_phone || c.reporterPhone,
          reporterName: c.reporter_name || c.reporterName,
          isAnonymous: c.is_anonymous ?? c.isAnonymous,
          statusLabel: c.status_label || c.statusLabel
        }))));
      }
      console.log('✅ Supabase data synced successfully');
    } catch (err) {
      console.warn('⚠️ Supabase sync warning:', err);
    }
  },

  subscribeRealtime() {
    const client = getSupabase();
    if (!client) return;

    // Realtime channel for emergency and complaints
    client.channel('public_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_reports' }, payload => {
        console.log('⚡ Realtime Emergency update:', payload);
        this.syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, payload => {
        console.log('⚡ Realtime Complaint update:', payload);
        this.syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        console.log('⚡ Realtime Invoice update:', payload);
        this.syncFromSupabase();
      })
      .subscribe();
  },

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getEmergencyReports() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]');
  },

  addEmergencyReport(report) {
    const reports = this.getEmergencyReports();
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(reports));

    // Async push to Supabase
    const client = getSupabase();
    if (client) {
      client.from('emergency_reports').insert([{
        id: report.id,
        type: report.type,
        reporter_name: report.reporterName,
        reporter_phone: report.reporterPhone,
        location: report.location,
        details: report.details,
        images: report.images || [],
        status: report.status || 'pending',
        status_label: report.statusLabel || 'รอรับเรื่องและสั่งการ',
        timestamp: report.timestamp,
        timeline: report.timeline || []
      }]).then(({ error, data }) => {
        if (error) {
          console.error('❌ Supabase Insert Emergency Error:', error);
          if (window.showToast) {
            window.showToast(`Supabase Error: ${error.message} (บันทึกในเครื่องเรียบร้อย)`, 'warning', 'การเชื่อมต่อ Supabase');
          }
        } else {
          console.log('✅ Supabase Insert Emergency Success');
          if (window.showToast) {
            window.showToast('บันทึกข้อมูลขึ้น Supabase Cloud สำเร็จ!', 'success', 'Supabase Live DB');
          }
        }
      });
    } else {
      console.info('ℹ️ Supabase not configured: Emergency saved to local storage.');
    }

    return report;
  },

  updateEmergencyStatus(id, newStatus, statusLabel, note) {
    const reports = this.getEmergencyReports();
    const item = reports.find(r => r.id === id);
    if (item) {
      item.status = newStatus;
      item.statusLabel = statusLabel;
      item.timeline = item.timeline || [];
      item.timeline.push({
        status: statusLabel,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        note: note || ''
      });
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(reports));

      // Async update in Supabase
      const client = getSupabase();
      if (client) {
        client.from('emergency_reports').update({
          status: newStatus,
          status_label: statusLabel,
          timeline: item.timeline,
          updated_at: new Date().toISOString()
        }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase Update Emergency Error:', error);
        });
      }
    }
    return item;
  },

  getComplaints() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS) || '[]');
  },

  addComplaint(complaint) {
    const list = this.getComplaints();
    list.unshift(complaint);
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));

    // Async push to Supabase
    const client = getSupabase();
    if (client) {
      client.from('complaints').insert([{
        id: complaint.id,
        category: complaint.category,
        title: complaint.title,
        reporter_name: complaint.reporterName,
        reporter_phone: complaint.reporterPhone,
        is_anonymous: complaint.isAnonymous || false,
        location: complaint.location,
        details: complaint.details,
        images: complaint.images || [],
        status: complaint.status || 'received',
        status_label: complaint.statusLabel || 'รับเรื่องร้องทุกข์แล้ว',
        timestamp: complaint.timestamp,
        timeline: complaint.timeline || []
      }]).then(({ error }) => {
        if (error) {
          console.error('❌ Supabase Insert Complaint Error:', error);
          if (window.showToast) {
            window.showToast(`Supabase Error: ${error.message} (บันทึกในเครื่องเรียบร้อย)`, 'warning', 'การเชื่อมต่อ Supabase');
          }
        } else {
          console.log('✅ Supabase Insert Complaint Success');
          if (window.showToast) {
            window.showToast('บันทึกเรื่องร้องทุกข์ขึ้น Supabase Cloud สำเร็จ!', 'success', 'Supabase Live DB');
          }
        }
      });
    }

    return complaint;
  },

  updateComplaintStatus(id, newStatus, statusLabel, note) {
    const complaints = this.getComplaints();
    const item = complaints.find(c => c.id === id);
    if (item) {
      item.status = newStatus;
      item.statusLabel = statusLabel;
      item.timeline = item.timeline || [];
      item.timeline.push({
        status: statusLabel,
        time: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        note: note || ''
      });
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));

      // Async update in Supabase
      const client = getSupabase();
      if (client) {
        client.from('complaints').update({
          status: newStatus,
          status_label: statusLabel,
          timeline: item.timeline,
          updated_at: new Date().toISOString()
        }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase Update Complaint Error:', error);
        });
      }
    }
    return item;
  },

  getInvoices() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
  },

  findInvoices(query, type = 'all') {
    const cleanQuery = query.trim().toLowerCase();
    const list = this.getInvoices();
    return list.filter(inv => {
      const matchType = type === 'all' || inv.type === type;
      const matchQuery = !cleanQuery || 
        inv.citizenId.toLowerCase().includes(cleanQuery) ||
        inv.refNumber.toLowerCase().includes(cleanQuery) ||
        inv.customerName.toLowerCase().includes(cleanQuery) ||
        inv.id.toLowerCase().includes(cleanQuery);
      return matchType && matchQuery;
    });
  },

  payInvoice(invoiceId, paymentSlip) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.status = 'paid';
      inv.paidAt = new Date().toLocaleString('th-TH');
      inv.paymentSlip = paymentSlip || null;
      inv.receiptNumber = 'RCP-' + Date.now().toString().slice(-6);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

      // Async update in Supabase
      const client = getSupabase();
      if (client) {
        client.from('invoices').update({
          status: 'paid',
          paid_at: inv.paidAt,
          payment_slip: inv.paymentSlip,
          receipt_number: inv.receiptNumber,
          updated_at: new Date().toISOString()
        }).eq('id', invoiceId).then(({ error }) => {
          if (error) console.error('Supabase Update Invoice Error:', error);
        });
      }
    }
    return inv;
  },

  getNews() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NEWS) || '[]');
  }
};
