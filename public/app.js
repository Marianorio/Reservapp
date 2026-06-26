const API = '/api/v1/reservations';
const today = new Date().toISOString().split('T')[0];
let currentPage = 1;
let currentSortBy = 'reservation_date';
let currentSortOrder = 'desc';
let editingId = null;
let confirmCallback = null;

// --- Toast ---
function showToast(message, type = 'success') {
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0 show`;
  el.role = 'alert';
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icons[type] || icons.info} me-1"></i> ${message}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// --- Modal helpers ---
function showConfirm(message, callback) {
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = callback;
  const modal = new bootstrap.Modal('#confirmModal');
  modal.show();
}
document.getElementById('confirmAction').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  bootstrap.Modal.getInstance('#confirmModal').hide();
});

function showDetail(reservation) {
  const statusColors = { confirmed: 'success', cancelled: 'danger', completed: 'secondary', no_show: 'warning' };
  const el = document.getElementById('detailBody');
  el.innerHTML = `
    <div class="row mb-2"><div class="col-4 fw-bold">Cliente:</div><div class="col-8">${reservation.customer_name}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Teléfono:</div><div class="col-8">${reservation.customer_phone}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Email:</div><div class="col-8">${reservation.customer_email}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Fecha:</div><div class="col-8">${formatDate(reservation.reservation_date)}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Hora:</div><div class="col-8">${reservation.reservation_time?.slice(0, 5)}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Personas:</div><div class="col-8">${reservation.guest_count}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Mesa:</div><div class="col-8">${reservation.table_number}</div></div>
    <div class="row mb-2"><div class="col-4 fw-bold">Estado:</div><div class="col-8"><span class="badge bg-${statusColors[reservation.status_name] || 'secondary'}">${reservation.status_name}</span></div></div>
    ${reservation.special_requests ? `<div class="row mb-2"><div class="col-4 fw-bold">Notas:</div><div class="col-8">${reservation.special_requests}</div></div>` : ''}
  `;
  new bootstrap.Modal('#detailModal').show();
}

// --- Format helpers ---
function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(timeStr) {
  return timeStr?.slice(0, 5) || '';
}

// --- Time slots ---
function buildTimeSlots() {
  const slots = [
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '20:00','20:30','21:00','21:30','22:00','22:30','23:00'
  ];
  const sel = document.getElementById('reservation_time');
  sel.innerHTML = '<option value="">Seleccionar...</option>' + slots.map(s => `<option value="${s}">${s}</option>`).join('');
}
buildTimeSlots();

// --- Client-side validation ---
const form = document.getElementById('reservationForm');
const inputs = form.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
  input.addEventListener('input', () => validateField(input));
  input.addEventListener('blur', () => validateField(input));
});
function validateField(input) {
  if (input.checkValidity()) { input.classList.remove('is-invalid'); input.classList.add('is-valid'); return true; }
  else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); return false; }
}
function validateForm() {
  let valid = true;
  inputs.forEach(i => { if (!validateField(i)) valid = false; });
  return valid;
}

// --- API calls ---
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return { status: res.status, data };
}

// --- Load reservations ---
async function loadReservations() {
  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('limit', 20);
  params.set('sortBy', currentSortBy);
  params.set('sortOrder', currentSortOrder);

  const date = document.getElementById('filterDate').value;
  const name = document.getElementById('filterName').value.trim();
  const phone = document.getElementById('filterPhone').value.trim();
  const status = document.getElementById('filterStatus').value;

  if (date) params.set('date', date);
  if (name) params.set('customer_name', name);
  if (phone) params.set('phone', phone);
  if (status) params.set('status_id', status);

  document.getElementById('loadingState').classList.remove('d-none');
  document.getElementById('emptyState').classList.add('d-none');
  document.getElementById('tableWrapper').classList.add('d-none');

  try {
    const res = await fetch(`${API}?${params}`);
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
  const statusColors = { confirmed: 'success', cancelled: 'danger', completed: 'secondary', no_show: 'warning' };
  const tbody = document.getElementById('reservationsBody');
  tbody.innerHTML = data.map(r => `
    <tr class="reservation-row" style="animation: fadeIn 0.3s ease">
      <td><strong>${r.customer_name}</strong></td>
      <td>${formatDate(r.reservation_date)}</td>
      <td><span class="badge bg-secondary">${formatTime(r.reservation_time)}</span></td>
      <td>${r.guest_count}</td>
      <td>Mesa ${r.table_number}</td>
      <td><span class="badge bg-${statusColors[r.status_name] || 'secondary'}">${r.status_name}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-custom me-1" onclick='showDetail(${JSON.stringify(r).replace(/'/g, "&#39;")})' title="Ver"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-custom me-1" onclick='editReservation(${r.id})' title="Editar"><i class="bi bi-pencil"></i></button>
        ${r.status_name === 'confirmed' ? `<button class="btn btn-sm btn-outline-danger" onclick='cancelReservation(${r.id})' title="Cancelar"><i class="bi bi-x-circle"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPagination(page, total, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  document.getElementById('paginationInfo').textContent = `Página ${page} de ${totalPages} (${total} reservas)`;

  let html = '';
  if (page > 1) html += `<li class="page-item"><button class="page-link" data-page="${page - 1}"><i class="bi bi-chevron-left"></i></button></li>`;
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><button class="page-link" data-page="${i}">${i}</button></li>`;
  }
  if (page < totalPages) html += `<li class="page-item"><button class="page-link" data-page="${page + 1}"><i class="bi bi-chevron-right"></i></button></li>`;
  document.getElementById('pagination').innerHTML = html;
  document.querySelectorAll('#pagination .page-link').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); loadReservations(); });
  });
}

// --- Form submit (create/update) ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const data = {
    customer_name: document.getElementById('customer_name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    reservation_date: document.getElementById('reservation_date').value,
    reservation_time: document.getElementById('reservation_time').value,
    guest_count: parseInt(document.getElementById('guest_count').value),
    special_requests: document.getElementById('special_requests').value.trim() || null,
  };

  document.getElementById('submitSpinner').classList.remove('d-none');
  document.getElementById('submitText').textContent = 'Guardando...';

  try {
    if (editingId) {
      await api('PATCH', `/${editingId}`, data);
      showToast('Reserva actualizada exitosamente', 'info');
    } else {
      await api('POST', '', data);
      showToast('Reserva confirmada exitosamente', 'success');
    }
    resetForm();
    loadReservations();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    document.getElementById('submitSpinner').classList.add('d-none');
    document.getElementById('submitText').innerHTML = '<i class="bi bi-check-circle me-1"></i>Confirmar Reserva';
  }
});

// --- Edit reservation ---
async function editReservation(id) {
  try {
    const { data } = await api('GET', `/${id}`);
    document.getElementById('customer_name').value = data.data.customer_name;
    document.getElementById('phone').value = data.data.customer_phone;
    document.getElementById('email').value = data.data.customer_email;
    document.getElementById('reservation_date').value = data.data.reservation_date;
    document.getElementById('reservation_time').value = data.data.reservation_time?.slice(0, 5);
    document.getElementById('guest_count').value = data.data.guest_count;
    document.getElementById('special_requests').value = data.data.special_requests || '';
    editingId = id;
    document.getElementById('formTitle').textContent = 'Editar Reserva';
    document.getElementById('submitText').innerHTML = '<i class="bi bi-pencil me-1"></i>Actualizar Reserva';
    document.getElementById('editingBadge').classList.remove('d-none');
    document.getElementById('editingId').textContent = id;
    document.getElementById('cancelEditBtn').classList.remove('d-none');
    document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// --- Cancel reservation ---
function cancelReservation(id) {
  showConfirm('¿Cancelar esta reserva?', async () => {
    try {
      await api('DELETE', `/${id}`);
      showToast('Reserva cancelada', 'warning');
      loadReservations();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}

// --- Reset form ---
function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById('customer_name').value = '';
  document.getElementById('reservation_date').value = today;
  document.getElementById('guest_count').value = 2;
  document.getElementById('special_requests').value = '';
  document.getElementById('formTitle').textContent = 'Nueva Reserva';
  document.getElementById('submitText').innerHTML = '<i class="bi bi-check-circle me-1"></i>Confirmar Reserva';
  document.getElementById('editingBadge').classList.add('d-none');
  document.getElementById('cancelEditBtn').classList.add('d-none');
  document.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
}
document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

// --- Sorting ---
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const sort = th.dataset.sort;
    if (currentSortBy === sort) currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    else { currentSortBy = sort; currentSortOrder = 'asc'; }
    currentPage = 1;
    loadReservations();
  });
});

// --- Filters ---
document.getElementById('filterDate').addEventListener('change', () => { currentPage = 1; loadReservations(); });
document.getElementById('filterName').addEventListener('input', debounce(() => { currentPage = 1; loadReservations(); }, 400));
document.getElementById('filterPhone').addEventListener('input', debounce(() => { currentPage = 1; loadReservations(); }, 400));
document.getElementById('filterStatus').addEventListener('change', () => { currentPage = 1; loadReservations(); });
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterDate').value = today;
  document.getElementById('filterName').value = '';
  document.getElementById('filterPhone').value = '';
  document.getElementById('filterStatus').value = '';
  currentPage = 1;
  loadReservations();
});

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

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
    const res = await fetch(`${API}?date=${today}&limit=100`);
    const result = await res.json();
    const total = result.total || 0;
    const confirmed = result.data?.filter(r => r.status_name === 'confirmed').length || 0;
    const cancelled = result.data?.filter(r => r.status_name === 'cancelled').length || 0;

    document.getElementById('statTodayReservations').textContent = total;
    document.getElementById('statConfirmed').textContent = confirmed;
    document.getElementById('statCancelled').textContent = cancelled;

    // Capacity estimation (15 tables, estimate max ~60 people)
    const capacityPct = Math.min(Math.round((total / 60) * 100), 100);
    document.getElementById('statCapacity').textContent = `${capacityPct}%`;

    const list = document.getElementById('dailyReservations');
    if (!result.data || result.data.length === 0) {
      list.innerHTML = '<div class="list-group-item text-center text-muted">No hay reservas para hoy</div>';
      return;
    }
    list.innerHTML = result.data
      .sort((a, b) => (a.reservation_time || '').localeCompare(b.reservation_time || ''))
      .map(r => `<div class="list-group-item d-flex justify-content-between align-items-center">
        <div><strong>${r.customer_name}</strong> · ${formatTime(r.reservation_time)} · Mesa ${r.table_number}</div>
        <span class="badge bg-${r.status_name === 'confirmed' ? 'success' : 'danger'}">${r.guest_count} pers.</span>
      </div>`).join('');
  } catch (err) {
    showToast('Error al cargar dashboard', 'danger');
  }
}

// --- Calendar ---
let calendarDate = new Date();
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  document.getElementById('calendarTitle').textContent = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += '<div class="col p-2"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    grid.innerHTML += `<div class="col p-1">
      <div class="calendar-day ${isToday ? 'bg-primary text-white' : 'bg-light'}" data-date="${dateStr}">
        <span class="fw-bold">${d}</span>
        <small class="calendar-dot" id="dot-${dateStr}"></small>
      </div>
    </div>`;
  }

  // Fetch reservation counts for the month
  fetch(`${API}?date=${year}-${String(month + 1).padStart(2, '0')}-01&limit=1`);

  // Add click handlers
  document.querySelectorAll('.calendar-day').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.date;
      document.getElementById('filterDate').value = date;
      document.querySelector('[data-tab="reservas"]').click();
      loadReservations();
    });
  });

  // Load dots (simplified - check via API)
  loadCalendarDots(year, month, daysInMonth);
}

async function loadCalendarDots(year, month, daysInMonth) {
  try {
    const res = await fetch(`${API}?sortBy=reservation_date&sortOrder=asc&limit=100`);
    const result = await res.json();
    if (!result.data) return;
    result.data.forEach(r => {
      const dot = document.getElementById(`dot-${r.reservation_date}`);
      if (dot) dot.textContent = ' ●';
    });
  } catch {}
}
document.getElementById('prevMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
document.getElementById('nextMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });

// --- Init ---
document.getElementById('reservation_date').value = today;
document.getElementById('filterDate').value = today;
loadReservations();
