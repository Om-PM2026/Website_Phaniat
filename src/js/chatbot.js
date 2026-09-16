/**
 * AI Chatbot Module: "น้องเพนียด" Smart Assistant for Phaniat SAO
 * บันทึกประวัติการสนทนาลงในตาราง chat_messages บน Supabase Cloud
 */
import { store } from './store.js';
import { getSupabase } from './supabaseClient.js';

// Knowledge Base & Smart Intent Matcher
const KNOWLEDGE_BASE = [
  {
    keywords: ['ภาษี', 'ที่ดิน', 'สิ่งปลูกสร้าง', 'ป้าย', 'ชำระภาษี', 'จ่ายภาษี', 'tax'],
    reply: `ท่านสามารถตรวจสอบยอดและชำระ **ภาษีที่ดินและสิ่งปลูกสร้าง** รวมถึง **ภาษีป้าย** ผ่านระบบออนไลน์ได้ทันทีครับ 💳<br><br>
👉 <a href="#payment" onclick="window.navigateToSection('section-payment'); return false;" style="color: #2563EB; font-weight: 600; text-decoration: underline;">คลิกที่นี่เพื่อไปที่หน้าชำระค่าบริการ</a> หรือค้นหาด้วยเลขบัตรประชาชน 13 หลักครับ`,
    chips: ['ชำระค่าน้ำประปา', 'แจ้งเหตุฉุกเฉิน', 'เวลาทำการ อบต.']
  },
  {
    keywords: ['น้ำ', 'ประปา', 'ค่าน้ำ', 'มิเตอร์', 'water'],
    reply: `ค่าน้ำประปา อบต.เพนียด สามารถตรวจสอบยอดค้างชำระและสแกนจ่ายผ่าน QR Code พร้อมเพย์ได้ทันทีครับ 🚰<br><br>
👉 <a href="#payment" onclick="window.navigateToSection('section-payment'); return false;" style="color: #2563EB; font-weight: 600; text-decoration: underline;">คลิกค้นหาและชำระค่าน้ำประปา</a>`,
    chips: ['แจ้งเหตุฉุกเฉิน', 'ร้องเรียนถนนชำรุด', 'ติดต่อเจ้าหน้าที่']
  },
  {
    keywords: ['ฉุกเฉิน', 'กู้ชีพ', 'กู้ภัย', 'อุบัติเหตุ', 'พยาบาล', 'ไฟไหม้', '1669', '191', 'emergency'],
    reply: `🚨 <strong>สายด่วนฉุกเฉิน 24 ชั่วโมง อบต.เพนียด:</strong><br>
• กู้ชีพ-การแพทย์: <a href="tel:1669" style="color: #DC2626; font-weight: 700;">1669</a><br>
• เหตุด่วนเหตุร้าย: <a href="tel:191" style="color: #DC2626; font-weight: 700;">191</a><br>
• สนง.อบต.เพนียด: <a href="tel:036499111" style="color: #1E3A8A; font-weight: 700;">036-499-111</a><br><br>
👉 <a href="#emergency" onclick="window.navigateToSection('section-emergency'); return false;" style="color: #DC2626; font-weight: 600; text-decoration: underline;">คลิกแจ้งเหตุฉุกเฉินพร้อมปักหมุด GPS ทันที</a>`,
    chips: ['แจ้งเหตุฉุกเฉินทันที', 'ร้องเรียนร้องทุกข์', 'เบอร์ติดต่อ อบต.']
  },
  {
    keywords: ['ร้องเรียน', 'ร้องทุกข์', 'ถนน', 'หลุม', 'ไฟดับ', 'ขยะ', 'ท่อตัน', 'complaint'],
    reply: `ท่านสามารถส่งเรื่องร้องทุกข์ ปัญหาน้ำท่วม ถนนชำรุด หรือไฟฟ้าสาธารณะดับ พร้อมแนบรูปถ่ายและพิกัดแผนที่ได้ครับ 📢<br><br>
👉 <a href="#complaint" onclick="window.navigateToSection('section-complaint'); return false;" style="color: #2563EB; font-weight: 600; text-decoration: underline;">คลิกเพื่อยื่นเรื่องร้องทุกข์ออนไลน์</a>`,
    chips: ['ติดตามเรื่องร้องทุกข์', 'ชำระภาษีออนไลน์', 'แจ้งเหตุฉุกเฉิน']
  },
  {
    keywords: ['เวลา', 'เปิด', 'ปิด', 'ทำการ', 'เปิดกี่โมง', 'วันไหน'],
    reply: `⏰ <strong>เวลาทำการ องค์การบริหารส่วนตำบลเพนียด:</strong><br>
• วันจันทร์ - วันศุกร์: <strong>08:30 - 16:30 น.</strong><br>
• ปิดทำการ: วันเสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์<br>
*(ศูนย์บริการแจ้งเหตุฉุกเฉิน 24 ชม. เปิดทำการทุกวันไม่มีวันหยุด)*`,
    chips: ['ติดต่อ อบต.', 'ชำระค่าบริการ', 'แจ้งเหตุฉุกเฉิน']
  },
  {
    keywords: ['ติดต่อ', 'ที่ตั้ง', 'เบอร์', 'โทร', 'อยู่ไหน', 'แผนที่', 'contact'],
    reply: `📍 <strong>องค์การบริหารส่วนตำบลเพนียด</strong><br>
ตำบลเพนียด อำเภอโคกสำโรง จังหวัดลพบุรี 15120<br>
📞 โทรศัพท์: <strong>036-499-111</strong><br>
📧 อีเมล: <strong>contact@phaniat.go.th</strong><br><br>
👉 <a href="#contact" onclick="window.navigateToSection('section-contact'); return false;" style="color: #2563EB; font-weight: 600; text-decoration: underline;">ดูแผนที่และช่องทางติดต่อทั้งหมด</a>`,
    chips: ['เวลาทำการ', 'แจ้งเหตุฉุกเฉิน', 'ชำระภาษี']
  },
  {
    keywords: ['สมัคร', 'สมาชิก', 'เข้าสู่ระบบ', 'ลงทะเบียน', 'register', 'login'],
    reply: `ท่านสามารถกดปุ่ม **"เข้าสู่ระบบ / สมัคร"** ที่มุมขวาบนของหน้าเว็บ เพื่อลงทะเบียนประชาชนและรับบริการดิจิทัลของ อบต.เพนียด ได้ทันทีครับ 👤`,
    chips: ['ชำระภาษี', 'แจ้งเหตุฉุกเฉิน', 'ร้องเรียนร้องทุกข์']
  }
];

export const chatbot = {
  sessionId: null,
  isOpen: false,

  init() {
    this.initSession();
    this.createWidget();
    this.bindEvents();
    this.loadHistory();
  },

  initSession() {
    let sid = localStorage.getItem('phaniat_chat_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('phaniat_chat_session_id', sid);
    }
    this.sessionId = sid;
  },

  createWidget() {
    // 1. Floating Action Button (FAB)
    const fab = document.createElement('button');
    fab.id = 'chatbot-fab-btn';
    fab.className = 'chatbot-fab';
    fab.setAttribute('aria-label', 'เปิดผู้ช่วยอัจฉริยะ อบต.เพนียด');
    fab.innerHTML = `
      <div class="pulse-ring"></div>
      <span class="badge-online"></span>
      <i class="fas fa-comments"></i>
    `;
    document.body.appendChild(fab);

    // 2. Chatbot Window
    const win = document.createElement('div');
    win.id = 'chatbot-window';
    win.className = 'chatbot-window';
    win.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-info">
          <div class="chatbot-avatar"><i class="fas fa-robot"></i></div>
          <div class="chatbot-header-title">
            <h4>น้องเพนียด (AI Assistant)</h4>
            <span>ออนไลน์ 24 ชม.</span>
          </div>
        </div>
        <button id="chatbot-close-btn" class="chatbot-close-btn" title="ปิดหน้าต่าง">&times;</button>
      </div>

      <div id="chatbot-messages" class="chatbot-body">
        <!-- Initial Welcome Message -->
        <div class="chat-msg bot">
          <div class="chat-bubble">
            สวัสดีครับ! 🙏 ผมคือ <strong>น้องเพนียด</strong> ผู้ช่วยอัจฉริยะ อบต.เพนียด ยินดีให้บริการข้อมูล ภาษี, ค่าน้ำประปา, แจ้งเหตุฉุกเฉิน และเรื่องร้องทุกข์ครับ มีอะไรให้ผมช่วยดูแลวันนี้ไหมครับ?
            
            <div class="chatbot-suggestions" style="margin-top: 10px;">
              <button class="suggestion-chip" data-msg="ชำระภาษีและค่าน้ำประปา"><i class="fas fa-file-invoice-dollar"></i> ชำระภาษี / ค่าน้ำ</button>
              <button class="suggestion-chip" data-msg="แจ้งเหตุฉุกเฉิน 24 ชม."><i class="fas fa-ambulance text-danger"></i> แจ้งเหตุฉุกเฉิน</button>
              <button class="suggestion-chip" data-msg="ร้องเรียนเรื่องร้องทุกข์"><i class="fas fa-comments text-warning"></i> ร้องทุกข์-ร้องเรียน</button>
              <button class="suggestion-chip" data-msg="เวลาทำการ อบต.เพนียด"><i class="fas fa-clock"></i> เวลาทำการ อบต.</button>
            </div>
          </div>
        </div>
      </div>

      <div class="chatbot-footer">
        <input type="text" id="chatbot-input" class="chatbot-input" placeholder="พิมพ์คำถามของคุณที่นี่..." autocomplete="off" />
        <button id="chatbot-send-btn" class="chatbot-send-btn" aria-label="ส่งข้อความ">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    `;
    document.body.appendChild(win);
  },

  bindEvents() {
    const fab = document.getElementById('chatbot-fab-btn');
    const win = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const input = document.getElementById('chatbot-input');
    const msgContainer = document.getElementById('chatbot-messages');

    if (fab && win) {
      fab.addEventListener('click', () => {
        this.toggleChat();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeChat();
      });
    }

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Handle suggestion chips click inside message container
    if (msgContainer) {
      msgContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip');
        if (chip) {
          const msg = chip.dataset.msg;
          if (msg) {
            this.sendUserMessage(msg);
          }
        }
      });
    }
  },

  toggleChat() {
    const win = document.getElementById('chatbot-window');
    if (!win) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      win.classList.add('open');
      const input = document.getElementById('chatbot-input');
      if (input) setTimeout(() => input.focus(), 200);
    } else {
      win.classList.remove('open');
    }
  },

  closeChat() {
    const win = document.getElementById('chatbot-window');
    if (win) {
      this.isOpen = false;
      win.classList.remove('open');
    }
  },

  handleSendMessage() {
    const input = document.getElementById('chatbot-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    this.sendUserMessage(text);
  },

  async sendUserMessage(text) {
    // 1. Render user message bubble
    this.appendMessage('user', text);

    // 2. Save user message to Supabase
    this.saveMessageToSupabase('user', text);

    // 3. Show typing indicator
    this.showTyping();

    // 4. Generate bot response after short realistic delay
    setTimeout(() => {
      this.hideTyping();
      const botResponse = this.matchResponse(text);
      this.appendMessage('bot', botResponse.reply, botResponse.chips);
      this.saveMessageToSupabase('bot', botResponse.reply.replace(/<[^>]*>?/gm, ''));
    }, 600);
  },

  matchResponse(text) {
    const clean = text.toLowerCase();

    for (const item of KNOWLEDGE_BASE) {
      const match = item.keywords.some(kw => clean.includes(kw.toLowerCase()));
      if (match) {
        return item;
      }
    }

    // Default Fallback response
    return {
      reply: `ขออภัยครับ น้องเพนียดยังไม่เข้าใจคำถามนี้อย่างชัดเจน 😅<br><br>
ท่านสามารถเลือกหัวข้อที่ต้องการติดต่อ หรือโทรสอบถามกองงานที่เกี่ยวข้องได้ที่เบอร์ <strong>036-499-111</strong> (วันและเวลาราชการ) ครับ`,
      chips: ['ชำระภาษีและค่าน้ำ', 'แจ้งเหตุฉุกเฉิน 24 ชม.', 'ร้องเรียนร้องทุกข์', 'เบอร์ติดต่อ อบต.']
    };
  },

  appendMessage(sender, text, chips = null) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${sender}`;

    let chipsHTML = '';
    if (chips && chips.length > 0) {
      chipsHTML = `
        <div class="chatbot-suggestions" style="margin-top: 8px;">
          ${chips.map(c => `<button class="suggestion-chip" data-msg="${c}">${c}</button>`).join('')}
        </div>
      `;
    }

    msgEl.innerHTML = `
      <div class="chat-bubble">
        ${text}
        ${chipsHTML}
        <div class="chat-time">${timeStr}</div>
      </div>
    `;

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  showTyping() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    let typingEl = document.getElementById('chatbot-typing-indicator');
    if (!typingEl) {
      typingEl = document.createElement('div');
      typingEl.id = 'chatbot-typing-indicator';
      typingEl.className = 'chat-msg bot';
      typingEl.innerHTML = `
        <div class="chat-bubble">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      container.appendChild(typingEl);
      container.scrollTop = container.scrollHeight;
    }
  },

  hideTyping() {
    const typingEl = document.getElementById('chatbot-typing-indicator');
    if (typingEl) typingEl.remove();
  },

  async saveMessageToSupabase(sender, messageText) {
    const client = getSupabase();
    const currentUser = store.getCurrentUser();

    // 1. Save to Local Cache
    const localHistory = JSON.parse(localStorage.getItem(`phaniat_chat_${this.sessionId}`) || '[]');
    localHistory.push({
      sender,
      message: messageText,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(`phaniat_chat_${this.sessionId}`, JSON.stringify(localHistory));

    // 2. Save to Supabase Cloud Database (table: chat_messages)
    if (client) {
      try {
        const { error } = await client.from('chat_messages').insert([{
          session_id: this.sessionId,
          sender: sender,
          message: messageText,
          user_name: currentUser ? currentUser.name : null,
          user_phone: currentUser ? currentUser.phone : null
        }]);

        if (error) {
          console.warn('Chat message Supabase notice:', error.message);
        } else {
          console.log('💬 Chat message saved to Supabase');
        }
      } catch (err) {
        console.warn('Chat Supabase insert warning:', err);
      }
    }
  },

  async loadHistory() {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const container = document.getElementById('chatbot-messages');
        if (container) {
          container.innerHTML = '';
          data.forEach(item => {
            this.appendMessage(item.sender, item.message);
          });
        }
      }
    } catch (e) {
      console.warn('Could not load chat history from Supabase:', e);
    }
  }
};
