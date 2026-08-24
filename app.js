/**
 * Tech Crew - Complaint Management Portal
 * Frontend Logic (Title & Description)
 */

// Application State
const state = {
  complaints: [],
  searchQuery: '',
  theme: localStorage.getItem('techcrew_theme') || 'light'
};

// DOM Elements
const elements = {
  complaintForm: document.getElementById('complaintForm'),
  submitBtn: document.getElementById('submitBtn'),
  complaintsList: document.getElementById('complaintsList'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  refreshFeedBtn: document.getElementById('refreshFeedBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  toastContainer: document.getElementById('toastContainer')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindEvents();
  loadData();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('techcrew_theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  if (elements.themeIcon) {
    elements.themeIcon.textContent = state.theme === 'dark' ? 'light_mode' : 'dark_mode';
  }
}

// Event Bindings
function bindEvents() {
  elements.themeToggleBtn?.addEventListener('click', toggleTheme);

  // Form Submit
  elements.complaintForm?.addEventListener('submit', handleComplaintSubmit);

  // Search Input
  elements.searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    }
    renderComplaints();
  });

  elements.clearSearchBtn?.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    renderComplaints();
  });

  // Refresh Feed
  elements.refreshFeedBtn?.addEventListener('click', () => {
    loadData(true);
    showToast('Complaints refreshed', 'info');
  });
}

// Data Fetching
async function loadData(syncFromSheet = false) {
  try {
    const url = `/api/complaints${syncFromSheet ? '?sync=true' : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.complaints) {
      state.complaints = data.complaints;
      renderComplaints();
    }
  } catch (err) {
    console.error('Error fetching complaints:', err);
  }
}

// Handle Complaint Box Submission
async function handleComplaintSubmit(e) {
  e.preventDefault();

  const formData = new FormData(elements.complaintForm);
  const payload = {
    title: formData.get('title'),
    description: formData.get('description')
  };

  // UI Loading State
  const submitBtn = elements.submitBtn;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> <span>Submitting...</span>`;

  try {
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      elements.complaintForm.reset();

      if (result.complaint) {
        state.complaints.unshift(result.complaint);
        renderComplaints();
      }

      showToast('Complaint submitted successfully!', 'success');
    } else {
      showToast(result.error || 'Failed to submit complaint.', 'error');
    }
  } catch (err) {
    console.error('Submission error:', err);
    showToast('Network error while submitting complaint.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>File a Complaint</span>`;
  }
}

// Render Complaints List (Title, Description, Date only)
function renderComplaints() {
  if (!elements.complaintsList) return;

  let filtered = state.complaints.filter(item => {
    if (state.searchQuery) {
      const q = state.searchQuery;
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    elements.complaintsList.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">inbox</span>
        <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">No Complaints Yet</h4>
        <p style="font-size: 13px;">Submitted complaints will appear here.</p>
      </div>
    `;
    return;
  }

  elements.complaintsList.innerHTML = filtered.map(item => {
    const dateFormatted = formatDate(item.timestamp);

    return `
      <article class="complaint-card">
        <div class="complaint-card-header">
          <h3 class="complaint-title">${escapeHtml(item.title)}</h3>
        </div>

        <p class="complaint-description">${escapeHtml(item.description)}</p>

        <div class="complaint-meta">
          <span class="complaint-date">${dateFormatted}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Date Formatting
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error';

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="font-size: 18px;">${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
