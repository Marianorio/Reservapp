const API = '/api/reservations';

const form = document.getElementById('reservationForm');
const formMessage = document.getElementById('formMessage');
const reservationsBody = document.getElementById('reservationsBody');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.getElementById('tableWrapper');
const filterDate = document.getElementById('filterDate');

const today = new Date().toISOString().split('T')[0];
document.getElementById('reservation_date').setAttribute('min', today);
filterDate.value = today;

function showMessage(msg, type) {
  formMessage.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  setTimeout(() => formMessage.innerHTML = '', 4000);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

async function loadReservations() {
  const date = filterDate.value;
  const url = date ? `${API}?date=${date}` : API;

  try {
    const res = await fetch(url);
    const data = await res.json();

    reservationsBody.innerHTML = '';

    if (data.length === 0) {
      emptyState.classList.remove('d-none');
      tableWrapper.classList.add('d-none');
      return;
    }

    emptyState.classList.add('d-none');
    tableWrapper.classList.remove('d-none');

    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.customer_name}</strong></td>
        <td>${formatDate(r.reservation_date)}</td>
        <td><span class="badge bg-secondary">${formatTime(r.reservation_time)}</span></td>
        <td>${r.guest_count} ${r.guest_count === 1 ? 'persona' : 'personas'}</td>
        <td><small>${r.phone}<br>${r.email}</small></td>
        <td><button class="btn btn-outline-danger btn-sm" onclick="cancelReservation(${r.id})"><i class="bi bi-x-circle"></i></button></td>
      `;
      if (r.special_requests) {
        tr.title = r.special_requests;
      }
      reservationsBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error al cargar reservas:', err);
  }
}

async function cancelReservation(id) {
  if (!confirm('¿Cancelar esta reserva?')) return;

  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showMessage('Reserva cancelada', 'warning');
    loadReservations();
  } catch {
    showMessage('Error al cancelar la reserva', 'danger');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    customer_name: document.getElementById('customer_name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    reservation_date: document.getElementById('reservation_date').value,
    reservation_time: document.getElementById('reservation_time').value,
    guest_count: parseInt(document.getElementById('guest_count').value),
    special_requests: document.getElementById('special_requests').value.trim() || null,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      showMessage(err.error || 'Error al crear la reserva', 'danger');
      return;
    }

    showMessage('Reserva confirmada exitosamente', 'success');
    form.reset();
    document.getElementById('reservation_date').value = today;
    document.getElementById('guest_count').value = 2;
    loadReservations();
  } catch {
    showMessage('Error de conexión con el servidor', 'danger');
  }
});

filterDate.addEventListener('change', loadReservations);

loadReservations();
