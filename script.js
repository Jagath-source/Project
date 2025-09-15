// Simple client-side auth and data management for the Internship Evaluation app

const AUTH = { username: 'intern', password: 'evaluate123' };
const STORAGE_KEYS = {
  sessionUser: 'ie_session_user',
  progress: 'ie_progress_entries',
  assessments: 'ie_assessment_entries',
  company: 'ie_company_profile',
  feedback: 'ie_feedback_entries',
};

function getSessionUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessionUser)); } catch { return null; }
}
function setSessionUser(user) {
  localStorage.setItem(STORAGE_KEYS.sessionUser, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.sessionUser);
}

function guardAuthenticatedPages() {
  const page = document.body.dataset.page;
  if (page !== 'login' && !getSessionUser()) {
    window.location.href = 'index.html';
  }
}

function attachLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

function readList(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  // If already logged in, go to dashboard
  if (getSessionUser()) {
    window.location.href = 'dashboard.html';
    return;
  }
  const error = document.getElementById('loginError');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username === AUTH.username && password === AUTH.password) {
      setSessionUser({ username, loginAt: new Date().toISOString() });
      window.location.href = 'dashboard.html';
    } else {
      error.hidden = false;
    }
  });
}

function initDashboard() {
  const progressEntries = readList(STORAGE_KEYS.progress);
  const assessmentEntries = readList(STORAGE_KEYS.assessments);
  const feedbackEntries = readList(STORAGE_KEYS.feedback);

  const totalProgress = document.getElementById('totalProgress');
  const totalAssessments = document.getElementById('totalAssessments');
  const avgAssessment = document.getElementById('avgAssessment');
  const totalFeedback = document.getElementById('totalFeedback');
  const recentActivity = document.getElementById('recentActivity');

  if (totalProgress) totalProgress.textContent = String(progressEntries.length);
  if (totalAssessments) totalAssessments.textContent = String(assessmentEntries.length);
  if (totalFeedback) totalFeedback.textContent = String(feedbackEntries.length);
  if (avgAssessment) {
    const avg = assessmentEntries.length
      ? Math.round(assessmentEntries.reduce((s, a) => s + Number(a.score || 0), 0) / assessmentEntries.length)
      : 0;
    avgAssessment.textContent = String(avg);
  }

  if (recentActivity) {
    const items = [];
    if (progressEntries[0]) items.push(`Latest progress: ${progressEntries[0].date} - ${progressEntries[0].task}`);
    if (assessmentEntries[0]) items.push(`Latest assessment: ${assessmentEntries[0].date} - ${assessmentEntries[0].score}`);
    if (feedbackEntries[0]) items.push(`Latest feedback: "${String(feedbackEntries[0].message).slice(0, 60)}"`);
    recentActivity.innerHTML = items.length ? items.map(t => `<div>• ${t}</div>`).join('') : '<div>No recent activity yet.</div>';
  }
}

function initProgressPage() {
  const form = document.getElementById('progressForm');
  const tableBody = document.querySelector('#progressTable tbody');
  const clearBtn = document.getElementById('clearProgress');
  if (!form || !tableBody) return;

  function render() {
    const list = readList(STORAGE_KEYS.progress);
    tableBody.innerHTML = '';
    list.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.hours}</td>
        <td>${item.task}</td>
        <td>${item.status}</td>
        <td>
          <button class="btn subtle" data-action="edit" data-idx="${idx}">Edit</button>
          <button class="btn danger" data-action="delete" data-idx="${idx}">Delete</button>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('pDate').value;
    const hours = Number(document.getElementById('pHours').value);
    const task = document.getElementById('pTask').value.trim();
    const status = document.getElementById('pStatus').value;
    if (!date || !task) return;
    const list = readList(STORAGE_KEYS.progress);
    list.unshift({ date, hours, task, status, createdAt: new Date().toISOString() });
    writeList(STORAGE_KEYS.progress, list);
    form.reset();
    render();
  });

  tableBody.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const action = target.getAttribute('data-action');
    const idxStr = target.getAttribute('data-idx');
    if (!action || idxStr == null) return;
    const idx = Number(idxStr);
    const list = readList(STORAGE_KEYS.progress);
    if (action === 'delete') {
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.progress, list);
      render();
    }
    if (action === 'edit') {
      const item = list[idx];
      document.getElementById('pDate').value = item.date;
      document.getElementById('pHours').value = String(item.hours);
      document.getElementById('pTask').value = item.task;
      document.getElementById('pStatus').value = item.status;
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.progress, list);
      render();
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Clear all progress entries?')) {
      writeList(STORAGE_KEYS.progress, []);
      render();
    }
  });

  render();
}

function initAssessmentsPage() {
  const form = document.getElementById('assessmentForm');
  const tableBody = document.querySelector('#assessmentsTable tbody');
  const clearBtn = document.getElementById('clearAssessments');
  if (!form || !tableBody) return;

  function render() {
    const list = readList(STORAGE_KEYS.assessments);
    tableBody.innerHTML = '';
    list.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.score}</td>
        <td>${item.evaluator}</td>
        <td>${item.comments}</td>
        <td>
          <button class="btn subtle" data-action="edit" data-idx="${idx}">Edit</button>
          <button class="btn danger" data-action="delete" data-idx="${idx}">Delete</button>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('aDate').value;
    const score = Number(document.getElementById('aScore').value);
    const evaluator = document.getElementById('aEvaluator').value.trim();
    const comments = document.getElementById('aComments').value.trim();
    if (!date || Number.isNaN(score) || !evaluator || !comments) return;
    const list = readList(STORAGE_KEYS.assessments);
    list.unshift({ date, score, evaluator, comments, createdAt: new Date().toISOString() });
    writeList(STORAGE_KEYS.assessments, list);
    form.reset();
    render();
  });

  tableBody.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const action = target.getAttribute('data-action');
    const idxStr = target.getAttribute('data-idx');
    if (!action || idxStr == null) return;
    const idx = Number(idxStr);
    const list = readList(STORAGE_KEYS.assessments);
    if (action === 'delete') {
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.assessments, list);
      render();
    }
    if (action === 'edit') {
      const item = list[idx];
      document.getElementById('aDate').value = item.date;
      document.getElementById('aScore').value = String(item.score);
      document.getElementById('aEvaluator').value = item.evaluator;
      document.getElementById('aComments').value = item.comments;
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.assessments, list);
      render();
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Clear all assessment records?')) {
      writeList(STORAGE_KEYS.assessments, []);
      render();
    }
  });

  render();
}

function initCompanyPage() {
  const form = document.getElementById('companyForm');
  const preview = document.getElementById('companyPreview');
  const clearBtn = document.getElementById('clearCompany');
  if (!form || !preview) return;

  function render() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.company));
      if (!data) { preview.textContent = 'No data saved yet.'; return; }
      preview.textContent = `Company: ${data.name}\nMentor: ${data.mentor}\nEmail: ${data.email}\nPhone: ${data.phone}\nAddress: ${data.address}`;
      document.getElementById('cName').value = data.name || '';
      document.getElementById('cMentor').value = data.mentor || '';
      document.getElementById('cEmail').value = data.email || '';
      document.getElementById('cPhone').value = data.phone || '';
      document.getElementById('cAddress').value = data.address || '';
    } catch { preview.textContent = 'No data saved yet.'; }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const mentor = document.getElementById('cMentor').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const address = document.getElementById('cAddress').value.trim();
    const payload = { name, mentor, email, phone, address, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(payload));
    render();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.company);
    render();
  });

  render();
}

function initFeedbackPage() {
  const form = document.getElementById('feedbackForm');
  const tableBody = document.querySelector('#feedbackTable tbody');
  const clearBtn = document.getElementById('clearFeedback');
  if (!form || !tableBody) return;

  function render() {
    const list = readList(STORAGE_KEYS.feedback);
    tableBody.innerHTML = '';
    list.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.message}</td>
        <td>${item.category}</td>
        <td>${item.rating}</td>
        <td>${new Date(item.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn subtle" data-action="edit" data-idx="${idx}">Edit</button>
          <button class="btn danger" data-action="delete" data-idx="${idx}">Delete</button>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('fMessage').value.trim();
    const category = document.getElementById('fCategory').value;
    const rating = Number(document.getElementById('fRating').value);
    if (!message) return;
    const list = readList(STORAGE_KEYS.feedback);
    list.unshift({ message, category, rating, createdAt: new Date().toISOString() });
    writeList(STORAGE_KEYS.feedback, list);
    form.reset();
    render();
  });

  tableBody.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const action = target.getAttribute('data-action');
    const idxStr = target.getAttribute('data-idx');
    if (!action || idxStr == null) return;
    const idx = Number(idxStr);
    const list = readList(STORAGE_KEYS.feedback);
    if (action === 'delete') {
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.feedback, list);
      render();
    }
    if (action === 'edit') {
      const item = list[idx];
      document.getElementById('fMessage').value = item.message;
      document.getElementById('fCategory').value = item.category;
      document.getElementById('fRating').value = String(item.rating);
      list.splice(idx, 1);
      writeList(STORAGE_KEYS.feedback, list);
      render();
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Clear all feedback items?')) {
      writeList(STORAGE_KEYS.feedback, []);
      render();
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  guardAuthenticatedPages();
  attachLogout();
  const page = document.body.dataset.page;
  if (page === 'login') initLoginPage();
  if (page === 'dashboard') initDashboard();
  if (page === 'progress') initProgressPage();
  if (page === 'assessments') initAssessmentsPage();
  if (page === 'company') initCompanyPage();
  if (page === 'feedback') initFeedbackPage();
});


