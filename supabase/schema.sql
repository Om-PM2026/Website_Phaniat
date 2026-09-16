-- ==============================================================================
-- องค์การบริหารส่วนตำบลเพนียด (อบต.เพนียด) - Smart Citizen Portal
-- Supabase Database Schema & Initial Seed Data
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: profiles (ข้อมูลผู้ใช้งาน / ประชาชน / เจ้าหน้าที่)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    national_id VARCHAR(13) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    house_no VARCHAR(50),
    moo VARCHAR(20),
    role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABLE: news (ข่าวสาร ประชาสัมพันธ์ และจัดซื้อจัดจ้าง)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.news (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    snippet TEXT,
    content TEXT,
    date VARCHAR(50),
    author VARCHAR(100),
    image TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABLE: invoices (ใบแจ้งหนี้ / ภาษี / ค่าน้ำประปา / ค่าขยะ)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('water', 'waste', 'tax')),
    type_name VARCHAR(100) NOT NULL,
    citizen_id VARCHAR(20) NOT NULL,
    ref_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    period VARCHAR(100) NOT NULL,
    units NUMERIC(10, 2) DEFAULT 0,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'verifying', 'overdue')),
    due_date VARCHAR(50) NOT NULL,
    paid_at VARCHAR(100),
    receipt_number VARCHAR(100),
    payment_slip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLE: emergency_reports (แจ้งเหตุฉุกเฉิน กู้ชีพ กู้ภัย 24 ชม.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_reports (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_phone VARCHAR(20) NOT NULL,
    location JSONB NOT NULL, -- { lat: float, lng: float, addressText: string }
    details TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
    status_label VARCHAR(255) DEFAULT 'รอรับเรื่องและสั่งการ',
    timestamp VARCHAR(100) NOT NULL,
    timeline JSONB DEFAULT '[]'::jsonb, -- array of { status, time, note }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABLE: complaints (เรื่องร้องทุกข์ / ร้องเรียนปัญหาโครงสร้างพื้นฐาน)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT false,
    location JSONB NOT NULL, -- { lat: float, lng: float, addressText: string }
    details TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'fixing', 'completed', 'rejected')),
    status_label VARCHAR(255) DEFAULT 'รับเรื่องร้องทุกข์แล้ว',
    timestamp VARCHAR(100) NOT NULL,
    timeline JSONB DEFAULT '[]'::jsonb, -- array of { status, time, note }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Public Read & Write Policies for Demo / Public Portal (Anon key access)
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public Insert News" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update News" ON public.news FOR UPDATE USING (true);

CREATE POLICY "Public Read Invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Public Insert Invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Invoices" ON public.invoices FOR UPDATE USING (true);

CREATE POLICY "Public Read Emergency" ON public.emergency_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert Emergency" ON public.emergency_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Emergency" ON public.emergency_reports FOR UPDATE USING (true);

CREATE POLICY "Public Read Complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Public Insert Complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Complaints" ON public.complaints FOR UPDATE USING (true);

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

-- ==============================================================================
-- 8. ENABLE REALTIME FOR LIVE NOTIFICATIONS
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.emergency_reports, 
    public.complaints, 
    public.invoices, 
    public.news;
COMMIT;

-- ==============================================================================
-- 9. INITIAL SEED DATA (ข้อมูลตั้งต้น อบต.เพนียด)
-- ==============================================================================

-- 9.1 ข้อมูลข่าวสาร
INSERT INTO public.news (id, category, category_label, title, date, author, image, gallery, snippet, content)
VALUES
(
  'news-01',
  'activity',
  'กิจกรรม อบต.',
  'อบต.เพนียด จัดโครงการส่งเสริมสุขภาพผู้สูงอายุและบริการตรวจสุขภาพเชิงรุก ประจำปี 2569',
  '15 ก.ย. 2569',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
  '["https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80"]'::jsonb,
  'ขอเชิญชวนประชาชนและผู้สูงอายุในพื้นที่ตำบลเพนียด ร่วมกิจกรรมตรวจสุขภาพประจำปี ตรวจวัดความดัน และรับคำปรึกษาด้านโภชนาการฟรี ณ อาคารอเนกประสงค์ อบต.เพนียด',
  'องค์การบริหารส่วนตำบลเพนียด โดยกองสาธารณสุขและสิ่งแวดล้อม ได้จัดโครงการส่งเสริมสุขภาพผู้สูงอายุและบริการตรวจสุขภาพเชิงรุก ณ อาคารอเนกประสงค์ ภายในงานมีกิจกรรมการตรวจคัดกรองเบาหวาน ความดันโลหิต การให้คำแนะนำเรื่องการออกกำลังกายที่เหมาะสมกับวัย และการมอบถุงยังชีพสุขภาพแก่ผู้สูงอายุติดเตียงในพื้นที่ตำบลเพนียด'
),
(
  'news-02',
  'announcement',
  'ข่าวประชาสัมพันธ์',
  'ประชาสัมพันธ์การยื่นแบบและชำระภาษีที่ดินและสิ่งปลูกสร้าง และภาษีป้าย ประจำปี 2569',
  '10 ก.ย. 2569',
  'กองคลัง อบต.เพนียด',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
  '["https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80"]'::jsonb,
  'แจ้งเจ้าของที่ดิน สิ่งปลูกสร้าง และป้ายโฆษณาในเขตตำบลเพนียด สามารถตรวจสอบยอดและชำระภาษีผ่านระบบออนไลน์ Smart E-Payment ได้แล้ววันนี้',
  'กองคลัง อบต.เพนียด แจ้งให้ผู้มีหน้าที่เสียภาษีที่ดินและสิ่งปลูกสร้าง รวมถึงภาษีป้ายในเขตพื้นที่ตำบลเพนียด ดำเนินการตรวจสอบและชำระภาษีประจำปีภาษี 2569 โดยท่านสามารถค้นหาใบแจ้งประเมินภาษีผ่านระบบออนไลน์และสแกนจ่ายผ่าน QR Code พร้อมเพย์ หรือติดต่อ ณ กองคลัง อบต.เพนียด ในวันและเวลาราชการ'
),
(
  'news-03',
  'procurement',
  'ประกาศจัดซื้อจัดจ้าง',
  'ประกาศประกวดราคาจ้างก่อสร้างถนนคอนกรีตเสริมเหล็ก สายบ้านเพนียด - บ้านหนองหว้า',
  '05 ก.ย. 2569',
  'กองช่าง อบต.เพนียด',
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
  '["https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80"]'::jsonb,
  'ประกวดราคาจ้างก่อสร้างถนน คสล. พร้อมระบบระบายน้ำข้างทาง เพื่อพัฒนาเส้นทางการสัญจรและการขนส่งผลผลิตทางการเกษตรของพี่น้องประชาชน',
  'ประกาศองค์การบริหารส่วนตำบลเพนียด เรื่อง ประกวดราคาจ้างก่อสร้างถนนคอนกรีตเสริมเหล็ก สายบ้านเพนียด หมู่ที่ 1 ถึง บ้านหนองหว้า ด้วยวิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding) ผู้สนใจสามารถดูรายละเอียดและยื่นข้อเสนอผ่านทางระบบจัดซื้อจัดจ้างภาครัฐด้วยอิเล็กทรอนิกส์'
),
(
  'news-04',
  'knowledge',
  'สาระน่ารู้ท้องถิ่น',
  'แนวทางการคัดแยกขยะในครัวเรือน ลดปริมาณขยะ สร้างรายได้สู่ชุมชนตำบลเพนียด',
  '01 ก.ย. 2569',
  'งานประชาสัมพันธ์',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
  '["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"]'::jsonb,
  'เรียนรู้วิธีการคัดแยกขยะ 4 ประเภท (ขยะอินทรีย์, ขยะรีไซเคิล, ขยะอันตราย, ขยะทั่วไป) เพื่อรักษาสิ่งแวดล้อมตำบลเพนียดให้น่าอยู่',
  'อบต.เพนียด รณรงค์ให้ทุกครัวเรือนร่วมมือกันคัดแยกขยะตั้งแต่ต้นทาง เพื่อช่วยลดภาระการจัดเก็บและกำจัดขยะมูลฝอย พร้อมทั้งส่งเสริมการจัดตั้ง "ธนาคารขยะรีไซเคิลชุมชน" เพื่อเปลี่ยนขยะให้เป็นเงินออมสำหรับครอบครัว'
)
ON CONFLICT (id) DO NOTHING;

-- 9.2 ข้อมูลใบแจ้งหนี้ / ภาษี / ค่าน้ำประปา
INSERT INTO public.invoices (id, type, type_name, citizen_id, ref_number, customer_name, address, period, units, amount, status, due_date)
VALUES
(
  'INV-2026-001',
  'water',
  'ค่าน้ำประปา อบต.',
  '1100200345678',
  'MTR-8842',
  'นายสมชาย เพนียดดี',
  '99/1 หมู่ที่ 2 ต.เพนียด',
  'สิงหาคม 2569',
  18,
  198.00,
  'unpaid',
  '25 ก.ย. 2569'
),
(
  'INV-2026-002',
  'waste',
  'ค่าธรรมเนียมเก็บขยะมูลฝอย',
  '1100200345678',
  'WST-2026-09',
  'นายสมชาย เพนียดดี',
  '99/1 หมู่ที่ 2 ต.เพนียด',
  'ประจำปี 2569 (ไตรมาส 3)',
  1,
  120.00,
  'unpaid',
  '30 ก.ย. 2569'
),
(
  'INV-2026-003',
  'tax',
  'ภาษีที่ดินและสิ่งปลูกสร้าง',
  '1100200345678',
  'TAX-LD-5520',
  'นายสมชาย เพนียดดี',
  'โฉนดเลขที่ 4120 หมู่ 1 ต.เพนียด',
  'ประจำปีภาษี 2569',
  1,
  450.00,
  'unpaid',
  '31 ต.ค. 2569'
),
(
  'INV-2026-004',
  'water',
  'ค่าน้ำประปา อบต.',
  '0812345678',
  'MTR-1029',
  'น.ส. สุภาภรณ์ ร่มรื่น',
  '45 หมู่ที่ 3 ต.เพนียด',
  'สิงหาคม 2569',
  24,
  264.00,
  'unpaid',
  '25 ก.ย. 2569'
)
ON CONFLICT (id) DO NOTHING;

-- 9.3 ข้อมูลการแจ้งเหตุฉุกเฉิน
INSERT INTO public.emergency_reports (id, type, reporter_phone, reporter_name, location, details, images, status, status_label, timestamp, timeline)
VALUES
(
  'EMG-2026-0012',
  'อุบัติเหตุทางถนน',
  '0812345678',
  'พลเมืองดี',
  '{"lat": 14.8562, "lng": 100.6124, "addressText": "หน้าโรงเรียนวัดเพนียด ถนนสายหลัก ม.2 ต.เพนียด"}'::jsonb,
  'รถจักรยานยนต์เฉี่ยวชนกับรถกระบะ มีผู้บาดเจ็บถลอก 1 ราย รู้สึกตัวดี ต้องการกู้ชีพปฐมพยาบาล',
  '["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80"]'::jsonb,
  'in_progress',
  'เจ้าหน้าที่กำลังเดินทางไปที่เกิดเหตุ',
  '16 ก.ย. 2569 14:15 น.',
  '[{"status": "รับแจ้งเหตุแล้ว", "time": "14:15 น.", "note": "ศูนย์วิทยุ อบต.เพนียด รับเรื่อง"}, {"status": "สั่งการชุดกู้ชีพ", "time": "14:18 น.", "note": "รถพยาบาลฉุกเฉินออกปฏิบัติการ"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 9.4 ข้อมูลเรื่องร้องทุกข์
INSERT INTO public.complaints (id, category, title, reporter_phone, reporter_name, is_anonymous, location, details, images, status, status_label, timestamp, timeline)
VALUES
(
  'CMP-2026-0034',
  'ถนนชำรุด / หลุมบ่อ',
  'ผิวจราจรเป็นหลุมขนาดใหญ่ทางเข้าซอย 4',
  '0898765432',
  'นายวิชัย สุขเกษม',
  false,
  '{"lat": 14.8601, "lng": 100.6150, "addressText": "ปากซอยร่วมใจพัฒนา หมู่ที่ 4 ต.เพนียด"}'::jsonb,
  'ถนนลาดยางชำรุดเป็นหลุมลึก มีน้ำขัง รถเล็กสัญจรลำบาก เกรงว่าจะเกิดอุบัติเหตุในเวลากลางคืน',
  '["https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80"]'::jsonb,
  'investigating',
  'กองช่างรับเรื่องและลงพื้นที่สำรวจแล้ว',
  '14 ก.ย. 2569 09:30 น.',
  '[{"status": "รับเรื่องร้องทุกข์", "time": "14 ก.ย. 09:30 น.", "note": "งานรับเรื่องราวร้องทุกข์ลงทะเบียนระบบ"}, {"status": "ส่งต่อกองช่าง", "time": "14 ก.ย. 13:00 น.", "note": "มอบหมายนายช่างโยธาเข้าสำรวจปริมาณงานซ่อม"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
