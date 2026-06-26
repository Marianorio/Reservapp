const API = '/api/v1';
const today = new Date().toISOString().split('T')[0];
let currentPage = 1;
let currentSortBy = 'reservation_date';
let currentSortOrder = 'desc';
let editingId = null;
let confirmCallback = null;
let currentUser = null;

// --- Helpers ---
function showToast(msg, type) {
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0 show`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icons[type]} me-1"></i> ${msg}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function formatDate(d) { return new Date(d+'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }); }
function formatTime(t) { return t?.slice(0,5)||''; }

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { if(t) localStorage.setItem('token',t); else localStorage.removeItem('token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
function setUser(u) { localStorage.setItem('user', JSON.stringify(u)); }

function showConfirm(msg, cb) {
  document.getElementById('confirmMessage').textContent = msg;
  confirmCallback = cb;
  bootstrap.Modal.getOrCreateInstance('#confirmModal').show();
}
document.getElementById('confirmAction').addEventListener('click', () => { if(confirmCallback) confirmCallback(); bootstrap.Modal.getInstance('#confirmModal')?.hide(); });

// --- Auth API ---
async function apiAuth(path, body) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}/reservations${path}`, opts);
  if (res.status === 204) return { status: 204 };
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return { status: res.status, data };
}

// --- Auth Views ---
function showAuth() {
  document.getElementById('authView').classList.remove('d-none');
  document.getElementById('appView').classList.add('d-none');
}

function showApp() {
  document.getElementById('authView').classList.add('d-none');
  document.getElementById('appView').classList.remove('d-none');
  currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  document.getElementById('userBadge').textContent = `${currentUser?.name} (${isAdmin ? 'Admin' : 'Usuario'})`;
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !isAdmin));
  document.getElementById('tabReservasLabel').textContent = isAdmin ? 'Reservas' : 'Mis Reservas';
  document.getElementById('listTitle').textContent = isAdmin ? 'Reservas' : 'Mis Reservas';

  document.getElementById('reservation_date').value = today;
  document.getElementById('filterDate').value = '';
  loadReservations();
}

// --- Auth Tab Switching ---
document.querySelectorAll('[data-auth]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-auth]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('loginForm').classList.toggle('d-none', btn.dataset.auth !== 'login');
    document.getElementById('registerForm').classList.toggle('d-none', btn.dataset.auth !== 'register');
    document.getElementById('authMessage').innerHTML = '';
  });
});

// --- Login Form ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await apiAuth('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
    showApp();
  } catch (err) { document.getElementById('authMessage').innerHTML = `<div class="alert alert-danger py-2">${err.message}</div>`; }
});

// --- Register Form ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (name.length < 3) return;
  try {
    const res = await apiAuth('/auth/register', { name, email, password });
    setToken(res.token);
    setUser(res.user);
    showApp();
  } catch (err) { document.getElementById('authMessage').innerHTML = `<div class="alert alert-danger py-2">${err.message}</div>`; }
});

// --- Google Login ---
document.getElementById('googleBtn').addEventListener('click', () => {
  showToast('Configura Google Client ID en el backend para habilitar', 'warning');
});

// --- Logout ---
document.getElementById('logoutBtn').addEventListener('click', () => {
  setToken(null);
  setUser(null);
  showAuth();
});

// --- Init: check session ---
(function init() {
  const token = getToken();
  if (token) {
    currentUser = getUser();
    if (currentUser) { showApp(); return; }
  }
  showAuth();
})();

// ========== RESERVATIONS (existing logic, adapted) ==========

function buildTimeSlots() {
  const slots = ['12:00','12:30','13:00','13:30','14:00','14:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00'];
  const sel = document.getElementById('reservation_time');
  sel.innerHTML = '<option value="">Seleccionar...</option>' + slots.map(s => `<option value="${s}">${s}</option>`).join('');
}
buildTimeSlots();

document.getElementById('reservationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    customer_name: document.getElementById('customer_name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    reservation_date: document.getElementById('reservation_date').value,
    reservation_time: document.getElementById('reservation_time').value,
    guest_count: parseInt(document.getElementById('guest_count').value) || 2,
    special_requests: document.getElementById('special_requests').value.trim() || null,
  };
  document.getElementById('submitSpinner').classList.remove('d-none');
  document.getElementById('submitText').textContent = 'Guardando...';
  try {
    if (editingId) {
      await api('PATCH', `/${editingId}`, data);
      showToast('Reserva actualizada', 'info');
    } else {
      await api('POST', '', data);
      showToast('Reserva confirmada', 'success');
    }
    resetForm();
    loadReservations();
  } catch (err) { showToast(err.message, 'danger'); }
  finally {
    document.getElementById('submitSpinner').classList.add('d-none');
    document.getElementById('submitText').innerHTML = '<i class="bi bi-check-circle me-1"></i>Confirmar Reserva';
  }
});

async function loadReservations() {
  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('limit', 20);
  params.set('sortBy', currentSortBy);
  params.set('sortOrder', currentSortOrder);

  const date = document.getElementById('filterDate').value;
  const name = document.getElementById('filterName')?.value?.trim();
  const phone = document.getElementById('filterPhone')?.value?.trim();
  const status = document.getElementById('filterStatus')?.value;

  if (date) params.set('date', date);
  if (name) params.set('customer_name', name);
  if (phone) params.set('phone', phone);
  if (status) params.set('status_id', status);

  document.getElementById('loadingState').classList.remove('d-none');
  document.getElementById('emptyState').classList.add('d-none');
  document.getElementById('tableWrapper').classList.add('d-none');

  try {
    const res = await fetch(`${API}/reservations?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const result = await res.json();
    document.getElementById('loadingState').classList.add('d-none');

    if (!result.data || result.data.length === 0) {
      document.getElementById('emptyState').classList.remove('d-none');
      return;
    }
    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('tableWrapper').classList.remove('d-none');
    renderTable(result.data);
    renderPagination(result.page, result.total, result.limit);
  } catch (err) {
    document.getElementById('loadingState').classList.add('d-none');
    showToast(err.message, 'danger');
  }
}

function renderTable(data) {
  const colors = { confirmed:'success', cancelled:'danger', completed:'secondary', no_show:'warning' };
  const isAdmin = currentUser?.role === 'admin';
  document.getElementById('reservationsBody').innerHTML = data.map(r => `
    <tr class="reservation-row">
      <td><strong>${r.customer_name}</strong></td>
      <td>${formatDate(r.reservation_date)}</td>
      <td><span class="badge bg-secondary">${formatTime(r.reservation_time)}</span></td>
      <td>${r.guest_count}</td>
      <td>Mesa ${r.table_number}</td>
      <td><span class="badge bg-${colors[r.status_name]||'secondary'}">${r.status_name}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-custom me-1" onclick='showDetail(${JSON.stringify(r).replace(/'/g,"&#39;")})' title="Ver"><i class="bi bi-eye"></i></button>
        ${isAdmin || r.user_id === currentUser?.id ? `<button class="btn btn-sm btn-outline-custom me-1" onclick='editReservation(${r.id})' title="Editar"><i class="bi bi-pencil"></i></button>` : ''}
        ${r.status_name === 'confirmed' ? `<button class="btn btn-sm btn-outline-danger" onclick='cancelReservation(${r.id})' title="Cancelar"><i class="bi bi-x-circle"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPagination(page, total, limit) {
  const tp = Math.ceil(total/limit)||1;
  document.getElementById('paginationInfo').textContent = `Página ${page} de ${tp} (${total} reservas)`;
  let html = '';
  if (page > 1) html += `<li class="page-item"><button class="page-link" data-page="${page-1}"><i class="bi bi-chevron-left"></i></button></li>`;
  for (let i = Math.max(1,page-2); i <= Math.min(tp,page+2); i++)
    html += `<li class="page-item ${i===page?'active':''}"><button class="page-link" data-page="${i}">${i}</button></li>`;
  if (page < tp) html += `<li class="page-item"><button class="page-link" data-page="${page+1}"><i class="bi bi-chevron-right"></i></button></li>`;
  document.getElementById('pagination').innerHTML = html;
  document.querySelectorAll('#pagination .page-link').forEach(btn => btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); loadReservations(); }));
}

function showDetail(r) {
  const colors = { confirmed:'success', cancelled:'danger', completed:'secondary', no_show:'warning' };
  document.getElementById('detailBody').innerHTML = `
    <div class="row mb-2"><div class="col-4 fw-bold">Cliente:</div><div class="col-8">${r.customer_name}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Teléfono:</div><div class="col-8">${r.customer_phone}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Email:</div><div class="col-8">${r.customer_email}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Fecha:</div><div class="col-8">${formatDate(r.reservation_date)}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Hora:</div><div class="col-8">${formatTime(r.reservation_time)}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Personas:</div><div class="col-8">${r.guest_count}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Mesa:</div><div class="col-8">${r.table_number}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Estado:</div><div class="col-8"><span class="badge bg-${colors[r.status_name]||'secondary'}">${r.status_name}</span></div></div>
    ${r.special_requests ? `<div class="row mb-2"><div class="col-4 fw-bold">Notas:</div><div class="col-8">${r.special_requests}</div></div>` : ''}`;
  bootstrap.Modal.getOrCreateInstance('#detailModal').show();
}

async function editReservation(id) {
  try {
    const { data } = await api('GET', `/${id}`);
    const r = data.data || data;
    document.getElementById('customer_name').value = r.customer_name;
    document.getElementById('phone').value = r.customer_phone;
    document.getElementById('email').value = r.customer_email;
    document.getElementById('reservation_date').value = r.reservation_date;
    document.getElementById('reservation_time').value = r.reservation_time?.slice(0,5);
    document.getElementById('guest_count').value = r.guest_count;
    document.getElementById('special_requests').value = r.special_requests||'';
    editingId = id;
    document.getElementById('formTitle').textContent = 'Editar Reserva';
    document.getElementById('submitText').innerHTML = '<i class="bi bi-pencil me-1"></i>Actualizar';
    document.getElementById('editingBadge').classList.remove('d-none');
    document.getElementById('editingId').textContent = id;
    document.getElementById('cancelEditBtn').classList.remove('d-none');
    document.getElementById('formCard').scrollIntoView({ behavior:'smooth' });
  } catch(err) { showToast(err.message,'danger'); }
}

function cancelReservation(id) {
  showConfirm('¿Cancelar esta reserva?', async () => {
    try { await api('DELETE',`/${id}`); showToast('Reserva cancelada','warning'); loadReservations(); }
    catch(err) { showToast(err.message,'danger'); }
  });
}

function resetForm() {
  document.getElementById('reservationForm').reset();
  editingId = null;
  document.getElementById('reservation_date').value = today;
  document.getElementById('guest_count').value = 2;
  document.getElementById('formTitle').textContent = 'Nueva Reserva';
  document.getElementById('submitText').innerHTML = '<i class="bi bi-check-circle me-1"></i>Confirmar Reserva';
  document.getElementById('editingBadge').classList.add('d-none');
  document.getElementById('cancelEditBtn').classList.add('d-none');
}
document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

// --- Sorting ---
document.querySelectorAll('.sortable').forEach(th => th.addEventListener('click', () => {
  if (currentSortBy === th.dataset.sort) currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  else { currentSortBy = th.dataset.sort; currentSortOrder = 'asc'; }
  currentPage = 1; loadReservations();
}));

// --- Filters ---
document.getElementById('filterDate').addEventListener('change', () => { currentPage = 1; loadReservations(); });
document.getElementById('filterName')?.addEventListener('input', debounce(() => { currentPage = 1; loadReservations(); }, 400));
document.getElementById('filterPhone')?.addEventListener('input', debounce(() => { currentPage = 1; loadReservations(); }, 400));
document.getElementById('filterStatus')?.addEventListener('change', () => { currentPage = 1; loadReservations(); });
document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
  document.getElementById('filterDate').value = '';
  if (document.getElementById('filterName')) document.getElementById('filterName').value = '';
  if (document.getElementById('filterPhone')) document.getElementById('filterPhone').value = '';
  if (document.getElementById('filterStatus')) document.getElementById('filterStatus').value = '';
  currentPage = 1; loadReservations();
});

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// --- Tab switching ---
document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('d-none'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('d-none');
    if (btn.dataset.tab === 'dashboard') loadDashboard();
    if (btn.dataset.tab === 'calendario') renderCalendar();
  });
});

// --- Dashboard ---
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/reservations?date=${today}&limit=100`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const result = await res.json();
    const total = result.total || 0;
    const confirmed = result.data?.filter(r => r.status_name === 'confirmed').length || 0;
    const cancelled = result.data?.filter(r => r.status_name === 'cancelled').length || 0;
    document.getElementById('statTodayReservations').textContent = total;
    document.getElementById('statConfirmed').textContent = confirmed;
    document.getElementById('statCancelled').textContent = cancelled;
    document.getElementById('statCapacity').textContent = `${Math.min(Math.round(total/60*100),100)}%`;
    const list = document.getElementById('dailyReservations');
    if (!result.data?.length) { list.innerHTML = '<div class="list-group-item text-center text-muted">Sin reservas hoy</div>'; return; }
    list.innerHTML = result.data.sort((a,b)=>(a.reservation_time||'').localeCompare(b.reservation_time||'')).map(r =>
      `<div class="list-group-item d-flex justify-content-between align-items-center">
        <div><strong>${r.customer_name}</strong> &middot; ${formatTime(r.reservation_time)} &middot; Mesa ${r.table_number}</div>
        <span class="badge bg-${r.status_name==='confirmed'?'success':'danger'}">${r.guest_count} pers.</span></div>`
    ).join('');
  } catch { showToast('Error al cargar dashboard','danger'); }
}

// --- Calendar ---
let calendarDate = new Date();
function renderCalendar() {
  const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
  document.getElementById('calendarTitle').textContent = new Date(y,m).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  const fd = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate();
  let html = '';
  for (let i = 0; i < fd; i++) html += '<div class="col p-2"></div>';
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === today;
    html += `<div class="col p-1"><div class="calendar-day ${isToday?'bg-primary text-white':'bg-light'}" data-date="${ds}"><span class="fw-bold">${d}</span><small class="calendar-dot" id="dot-${ds}"></small></div></div>`;
  }
  document.getElementById('calendarGrid').innerHTML = html;
  document.querySelectorAll('.calendar-day').forEach(el => el.addEventListener('click', () => {
    document.getElementById('filterDate').value = el.dataset.date;
    document.querySelector('[data-tab="reservas"]').click();
    loadReservations();
  }));
  loadCalendarDots(y, m, dim);
}
async function loadCalendarDots(y,m,dim) {
  try {
    const res = await fetch(`${API}/reservations?sortBy=reservation_date&sortOrder=asc&limit=100`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const result = await res.json();
    if (result.data) result.data.forEach(r => { const dot = document.getElementById(`dot-${r.reservation_date}`); if (dot) dot.textContent = ' ●'; });
  } catch {}
}
document.getElementById('prevMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth()-1); renderCalendar(); });
document.getElementById('nextMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth()+1); renderCalendar(); });
