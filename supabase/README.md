# คู่มือการติดตั้งและเชื่อมต่อ Supabase Database
## ระบบ Smart Citizen Portal - องค์การบริหารส่วนตำบลเพนียด (อบต.เพนียด)

---

### 📌 ขั้นตอนที่ 1: สร้าง Project ใน Supabase
1. เข้าไปที่ [https://supabase.com](https://supabase.com) แล้วเข้าสู่ระบบ (Sign in)
2. คลิก **"New Project"**
3. ตั้งชื่อโปรเจกต์ เช่น `phaniat-sao-portal` และตั้ง Database Password
4. เลือก Region ใกล้เคียง เช่น `Singapore (ap-southeast-1)`
5. รอระบบสร้าง Database ประมาณ 1-2 นาที

---

### 📌 ขั้นตอนที่ 2: รัน SQL Schema เพื่อสร้างตารางและข้อมูลตั้งต้น
1. ในแถบเมนูด้านซ้ายของ Supabase Dashboard ให้คลิกที่ **"SQL Editor"**
2. คลิก **"New query"**
3. คัดลอกโค้ดทั้งหมดจากไฟล์ [`supabase/schema.sql`](file:///e:/Antigravity/supabase/schema.sql) ไปวางในช่อง SQL Editor
4. กดปุ่ม **"Run"** (หรือกด `Ctrl + Enter`)
5. ตารางทั้งหมดจะถูกสร้างขึ้นพร้อมข้อมูลตั้งต้น (Seed Data) และเปิดใช้งาน Realtime อัตโนมัติ:
   - `profiles` - ตารางข้อมูลประชาชนและเจ้าหน้าที่
   - `news` - ตารางข่าวสาร กิจกรรม และประกาศจัดซื้อจัดจ้าง
   - `invoices` - ตารางใบแจ้งหนี้ภาษี ค่าน้ำประปา ค่าขยะ
   - `emergency_reports` - ตารางแจ้งเหตุฉุกเฉิน 24 ชม.
   - `complaints` - ตารางเรื่องร้องทุกข์และปัญหาโครงสร้างพื้นฐาน

---

### 📌 ขั้นตอนที่ 3: นำ API Keys มาเชื่อมต่อในเว็บ
1. ใน Supabase Dashboard ไปที่ **Project Settings** (ไอคอนฟันเฟืองล่างซ้าย) -> **API**
2. คัดลอกค่า 2 ค่า:
   - **Project URL** (เช่น `https://abcdefghijklm.supabase.co`)
   - **Project API Keys** -> ช่อง `anon` `public` (คีย์ขนาดยาวขึ้นต้นด้วย `eyJ...`)
3. เปิดไฟล์ [`src/js/supabaseClient.js`](file:///e:/Antigravity/src/js/supabaseClient.js) แล้วนำค่าไปวาง:

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://abcdefghijklm.supabase.co', // ใส่ Project URL ของคุณ
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // ใส่ anon public key ของคุณ
};
```

---

### 📌 ขั้นตอนที่ 4: (ทางเลือกเสริม) สร้าง Storage Buckets สำหรับอัปโหลดรูป
หากต้องการให้ประชาชนสามารถอัปโหลดรูปภาพหลักฐานและสลิปเงินขึ้น Supabase Cloud Storage:
1. ไปที่เมนู **"Storage"** ในแถบซ้าย
2. สร้าง Bucket ใหม่ (คลิก **"New bucket"**) และเปิดสวิตช์ **"Public bucket"**:
   - `emergency-images` (รูปสถานที่เกิดเหตุ)
   - `complaint-images` (รูปจุดร้องเรียน/ถนนชำรุด)
   - `payment-slips` (สลิปโอนเงินภาษี/ค่าน้ำ)

---

### 🌟 คุณสมบัติเด่นของฐานข้อมูลนี้
* **Real-time Live Sync**: เมื่อประชาชนแจ้งเหตุฉุกเฉินหรือร้องทุกข์ ข้อมูลจะเด้งเข้าแผงควบคุมเจ้าหน้าที่ อบต. ทันทีโดยไม่ต้องกดรีเฟรช
* **Offline / Mock Fallback**: แม้ยังไม่ได้เชื่อมต่อ Supabase หรืออินเทอร์เน็ตขาดหาย ตัวเว็บจะยังคงทำงานได้ด้วย LocalStorage Cache ทันที
* **Row Level Security (RLS)**: มีนโยบายความปลอดภัยพร้อมรองรับการขยายระบบยืนยันตัวตนในอนาคต
