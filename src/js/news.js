/**
 * News Module: News, Activities, Announcements & Public Relations
 */
import { store } from './store.js';

let activeCategory = 'all';
let searchQuery = '';

export const news = {
  init() {
    this.bindEvents();
    this.renderNews();
  },

  bindEvents() {
    // Category Filter Chips
    const filterChips = document.querySelectorAll('.news-filter-chips .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.category || 'all';
        this.renderNews();
      });
    });

    // Search Box
    const searchInput = document.getElementById('news-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        this.renderNews();
      });
    }

    // Article Detail Modal Close
    const modalClose = document.getElementById('article-modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        document.getElementById('article-modal').classList.remove('open');
      });
    }
  },

  renderNews() {
    const list = store.getNews();
    const container = document.getElementById('news-grid-container');
    if (!container) return;

    const filtered = list.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.snippet.toLowerCase().includes(searchQuery) ||
        item.author.toLowerCase().includes(searchQuery);
      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <i class="fas fa-newspaper" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
          <h3>ไม่พบข่าวสารหรือกิจกรรม</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">ลองค้นหาด้วยคำค้นอื่น หรือเลือกหมวดหมู่อื่น</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="news-card" data-id="${item.id}">
        <div class="news-card-thumb">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          <span class="news-badge-category">${item.categoryLabel}</span>
        </div>
        <div class="news-card-body">
          <div class="news-meta">
            <span><i class="far fa-calendar-alt"></i> ${item.date}</span>
            <span><i class="fas fa-user-circle"></i> ${item.author}</span>
          </div>
          <h3 class="news-card-title">${item.title}</h3>
          <p class="news-card-snippet">${item.snippet}</p>
          <div class="news-card-footer">
            <span>อ่านรายละเอียด</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = store.getNews().find(n => n.id === id);
        if (item) this.openArticleModal(item);
      });
    });
  },

  openArticleModal(item) {
    const modal = document.getElementById('article-modal');
    if (!modal) return;

    document.getElementById('article-modal-category').textContent = item.categoryLabel;
    document.getElementById('article-modal-title').textContent = item.title;
    document.getElementById('article-modal-date').textContent = item.date;
    document.getElementById('article-modal-author').textContent = item.author;
    document.getElementById('article-modal-cover').src = item.image;
    document.getElementById('article-modal-content').textContent = item.content;

    const galleryEl = document.getElementById('article-modal-gallery');
    if (galleryEl) {
      if (item.gallery && item.gallery.length > 0) {
        galleryEl.innerHTML = item.gallery.map(img => `
          <img src="${img}" alt="Gallery Image" class="article-gallery-img" onclick="window.open('${img}', '_blank')" />
        `).join('');
      } else {
        galleryEl.innerHTML = '';
      }
    }

    modal.classList.add('open');
  }
};
