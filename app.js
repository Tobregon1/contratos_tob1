/* ============================================================
   GENESIS INFORMATICA — CONTRATOS DIGITALES
   app.js — Main Application Logic
   ============================================================ */

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
const App = {
  logo: null,
  empeño: {
    step: 1,
    pad: null,
    contractNum: null,
    numSaved: false,
  },
  servicios: {
    step: 1,
    pad: null,
    contractNum: null,
    numSaved: false,
    tipo: '',
    tipoLabel: '',
  },
};

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTodayDates();
  loadLogo();
  updateStats();
  updateBadges();
});

function setTodayDates() {
  const today = new Date().toISOString().split('T')[0];
  ['e-fecha', 's-fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

// ──────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────
function navigate(view) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  window.scrollTo(0, 0);

  if (view === 'home') {
    // Reset sessions when returning home
    App.empeño.contractNum = null;
    App.empeño.numSaved = false;
    App.servicios.contractNum = null;
    App.servicios.numSaved = false;
    updateStats();
    updateBadges();
    return;
  }

  if (view === 'empeño') {
    // Assign contract number for this session
    App.empeño.contractNum = getNextNum('empeño');
    App.empeño.numSaved = false;
    App.empeño.step = 1;
    // Reset form steps
    showStep('empeño', 1);
    updateProgress('empeño', 1);
    document.getElementById('empeño-num-tag').textContent = '#' + padNum(App.empeño.contractNum, 3);
    document.getElementById('empeño-success').style.display = 'none';
    // Reset form
    resetForm('empeño');
  }

  if (view === 'servicios') {
    App.servicios.contractNum = getNextNum('servicios');
    App.servicios.numSaved = false;
    App.servicios.step = 1;
    showStep('servicios', 1);
    updateProgress('servicios', 1);
    document.getElementById('servicios-num-tag').textContent = '#' + padNum(App.servicios.contractNum, 3);
    document.getElementById('servicios-success').style.display = 'none';
    // Reset tipo
    App.servicios.tipo = '';
    App.servicios.tipoLabel = '';
    document.querySelectorAll('.stype-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('s-tipo').value = '';
    document.getElementById('s-tipo-label').value = '';
    resetForm('servicios');
  }

  if (view === 'historial') {
    loadHistory();
  }
}

function resetForm(type) {
  if (type === 'empeño') {
    const ids = ['e-nombre','e-apellido','e-dni','e-teléfono','e-dirección',
                 'e-artículo','e-marca','e-modelo','e-color','e-valor',
                 'e-monto','e-tasa','e-plazo','e-obs'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const estado = document.getElementById('e-estado');
    if (estado) estado.value = '';
    const periodo = document.getElementById('e-periodo');
    if (periodo) periodo.value = 'mensual';
    document.getElementById('e-venc-display').textContent = '—';
    document.getElementById('e-total-display').textContent = '$ —';
    setTodayDates();
  }
  if (type === 'servicios') {
    const ids = ['s-nombre','s-apellido','s-dni','s-teléfono','s-email','s-dirección',
                 's-descripcion','s-entregables','s-precio','s-seña','s-plazo',
                 's-garantía','s-condiciones'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const fp = document.getElementById('s-forma-pago');
    if (fp) fp.value = '';
    const fe = document.getElementById('s-fecha-entrega');
    if (fe) fe.value = '';
    setTodayDates();
  }
}

function nextStep(type, current) {
  if (!validateStep(type, current)) return;

  const next = current + 1;
  const maxStep = 4;
  if (next > maxStep) return;

  showStep(type, next);
  updateProgress(type, next);

  if (type === 'empeño') App.empeño.step = next;
  if (type === 'servicios') App.servicios.step = next;

  // Init signature pad when reaching step 4
  if (next === 4) {
    setTimeout(() => {
      initSignaturePad(type);
      updatePreview(type);
    }, 100);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(type, current) {
  const prev = current - 1;
  if (prev < 1) return;

  showStep(type, prev);
  updateProgress(type, prev);
  if (type === 'empeño') App.empeño.step = prev;
  if (type === 'servicios') App.servicios.step = prev;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep(type, step) {
  const prefix = type === 'empeño' ? 'e' : 's';
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`${prefix}step-${i}`);
    if (el) el.classList.toggle('active', i === step);
  }
}

function updateProgress(type, activeStep) {
  const prefix = type === 'empeño' ? 'e' : 's';
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`prog-${prefix}-${i}`);
    if (stepEl) {
      stepEl.classList.toggle('active', i === activeStep);
      stepEl.classList.toggle('done', i < activeStep);
    }
    if (i < 4) {
      const lineEl = document.getElementById(`pline-${prefix}-${i}`);
      if (lineEl) lineEl.classList.toggle('active', i < activeStep);
    }
  }
}

// ──────────────────────────────────────────────
// VALIDATION
// ──────────────────────────────────────────────
function validateStep(type, step) {
  if (type === 'empeño') {
    if (step === 1) {
      if (!val('e-nombre'))    { shakeField('e-nombre');   showToast('Ingresá el nombre del cliente', 'error'); return false; }
      if (!val('e-apellido'))  { shakeField('e-apellido'); showToast('Ingresá el apellido del cliente', 'error'); return false; }
      if (!val('e-dni'))       { shakeField('e-dni');      showToast('Ingresá el DNI del cliente', 'error'); return false; }
      if (!val('e-dirección')) { shakeField('e-dirección');showToast('Ingresá el domicilio del cliente', 'error'); return false; }
      if (!val('e-fecha'))     { shakeField('e-fecha');    showToast('Seleccioná la fecha del contrato', 'error'); return false; }
    }
    if (step === 2) {
      if (!val('e-artículo'))  { shakeField('e-artículo'); showToast('Describí el artículo en empeño', 'error'); return false; }
      if (!val('e-estado'))    { shakeField('e-estado');   showToast('Seleccioná el estado del artículo', 'error'); return false; }
      if (!val('e-valor'))     { shakeField('e-valor');    showToast('Ingresá el valor estimado del artículo', 'error'); return false; }
    }
    if (step === 3) {
      if (!val('e-monto'))     { shakeField('e-monto');    showToast('Ingresá el monto del préstamo', 'error'); return false; }
      if (!val('e-tasa'))      { shakeField('e-tasa');     showToast('Ingresá la tasa de interés', 'error'); return false; }
      if (!val('e-plazo'))     { shakeField('e-plazo');    showToast('Ingresá el plazo en días', 'error'); return false; }
    }
  }

  if (type === 'servicios') {
    if (step === 1) {
      if (!val('s-nombre'))    { shakeField('s-nombre');   showToast('Ingresá el nombre del cliente', 'error'); return false; }
      if (!val('s-apellido'))  { shakeField('s-apellido'); showToast('Ingresá el apellido del cliente', 'error'); return false; }
      if (!val('s-dni'))       { shakeField('s-dni');      showToast('Ingresá el DNI/CUIT del cliente', 'error'); return false; }
      if (!val('s-fecha'))     { shakeField('s-fecha');    showToast('Seleccioná la fecha del contrato', 'error'); return false; }
    }
    if (step === 2) {
      if (!App.servicios.tipo) { showToast('Seleccioná el tipo de servicio', 'error'); return false; }
      if (!val('s-descripcion'))  { shakeField('s-descripcion'); showToast('Describí el servicio a prestar', 'error'); return false; }
    }
    if (step === 3) {
      if (!val('s-precio'))    { shakeField('s-precio');   showToast('Ingresá el precio total del servicio', 'error'); return false; }
      if (!val('s-forma-pago')){ shakeField('s-forma-pago');showToast('Seleccioná la forma de pago', 'error'); return false; }
    }
  }

  return true;
}

function val(id) {
  const el = document.getElementById(id);
  return el && el.value.trim() !== '';
}

function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.style.borderColor = 'var(--c-danger)';
  el.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }, 2000);
}

// ──────────────────────────────────────────────
// FORM LOGIC
// ──────────────────────────────────────────────
function recalcularEmpeño() {
  const monto = parseFloat(document.getElementById('e-monto').value) || 0;
  const tasa  = parseFloat(document.getElementById('e-tasa').value) || 0;
  const plazo = parseInt(document.getElementById('e-plazo').value) || 0;

  // Calculate vencimiento
  if (plazo > 0 && val('e-fecha')) {
    const fechaBase = new Date(document.getElementById('e-fecha').value + 'T12:00:00');
    const venc = new Date(fechaBase);
    venc.setDate(venc.getDate() + plazo);
    document.getElementById('e-venc-display').textContent = formatDate(venc.toISOString().split('T')[0]);
  } else {
    document.getElementById('e-venc-display').textContent = '—';
  }

  // Calculate total
  if (monto > 0 && tasa > 0) {
    const interés = monto * (tasa / 100);
    const total = monto + interés;
    document.getElementById('e-total-display').textContent = formatCurrency(total);
  } else if (monto > 0) {
    document.getElementById('e-total-display').textContent = formatCurrency(monto);
  } else {
    document.getElementById('e-total-display').textContent = '$ —';
  }
}

function selectServiceType(id, label) {
  App.servicios.tipo = id;
  App.servicios.tipoLabel = label;
  document.getElementById('s-tipo').value = id;
  document.getElementById('s-tipo-label').value = label;
  document.querySelectorAll('.stype-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`stype-${id}`).classList.add('selected');
}

// ──────────────────────────────────────────────
// SIGNATURE PAD
// ──────────────────────────────────────────────
function initSignaturePad(type) {
  const canvasId = `sig-${type}`;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width  = canvas.offsetWidth  * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);

  const pad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255,255,255,0)',
    penColor: '#1a1a2e',
    minWidth: 1.5,
    maxWidth: 3.5,
  });

  if (type === 'empeño')   App.empeño.pad = pad;
  if (type === 'servicios') App.servicios.pad = pad;
}

function clearSignature(type) {
  const pad = type === 'empeño' ? App.empeño.pad : App.servicios.pad;
  if (pad) pad.clear();
}

// ──────────────────────────────────────────────
// PREVIEW
// ──────────────────────────────────────────────
function updatePreview(type) {
  if (type === 'empeño') {
    const monto = parseFloat(document.getElementById('e-monto').value) || 0;
    const tasa  = parseFloat(document.getElementById('e-tasa').value) || 0;
    const total = monto + monto * (tasa / 100);
    const plazo = parseInt(document.getElementById('e-plazo').value) || 0;

    let vencStr = '—';
    if (plazo > 0 && val('e-fecha')) {
      const base = new Date(document.getElementById('e-fecha').value + 'T12:00:00');
      base.setDate(base.getDate() + plazo);
      vencStr = formatDate(base.toISOString().split('T')[0]);
    }

    const items = [
      { l: 'Cliente', v: `${g('e-nombre')} ${g('e-apellido')}` },
      { l: 'DNI', v: g('e-dni') },
      { l: 'Artículo', v: g('e-artículo'), full: true },
      { l: 'Marca / Modelo', v: `${g('e-marca')} ${g('e-modelo')}`.trim() || '—' },
      { l: 'Estado', v: g('e-estado') || '—' },
      { l: 'Valor estimado', v: g('e-valor') ? formatCurrency(g('e-valor')) : '—' },
      { l: 'Monto del préstamo', v: formatCurrency(monto), highlight: true },
      { l: 'Interés', v: `${g('e-tasa')}% ${g('e-periodo') || 'mensual'}` },
      { l: 'Plazo', v: plazo ? `${plazo} días` : '—' },
      { l: 'Vencimiento', v: vencStr },
      { l: 'Total a devolver', v: formatCurrency(total), highlight: true },
    ];

    renderPreview('empeño-preview-content', items);
  }

  if (type === 'servicios') {
    const precio = parseFloat(document.getElementById('s-precio').value) || 0;
    const seña   = parseFloat(document.getElementById('s-seña').value) || 0;

    const items = [
      { l: 'Cliente', v: `${g('s-nombre')} ${g('s-apellido')}` },
      { l: 'DNI / CUIT', v: g('s-dni') },
      { l: 'Tipo de servicio', v: App.servicios.tipoLabel || '—' },
      { l: 'Descripción', v: g('s-descripcion'), full: true },
      { l: 'Precio total', v: formatCurrency(precio), highlight: true },
      { l: 'Anticipo / Seña', v: seña > 0 ? formatCurrency(seña) : '—' },
      { l: 'Forma de pago', v: g('s-forma-pago') || '—' },
      { l: 'Plazo de entrega', v: g('s-plazo') || '—' },
      { l: 'Garantía', v: g('s-garantía') || '—' },
    ];

    renderPreview('servicios-preview-content', items);
  }
}

function renderPreview(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => `
    <div class="prev-item${item.full ? ' full' : ''}">
      <div class="prev-lbl">${item.l}</div>
      <div class="prev-val${item.highlight ? ' highlight' : ''}">${item.v || '—'}</div>
    </div>
  `).join('');
}

function g(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ──────────────────────────────────────────────
// NUMBER UTILITIES
// ──────────────────────────────────────────────
function getNextNum(type) {
  return parseInt(localStorage.getItem(`${type}_num`) || '0') + 1;
}

function saveNum(type, num) {
  localStorage.setItem(`${type}_num`, num);
}

function padNum(num, len) {
  return String(num).padStart(len, '0');
}

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return '$ ' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function numberToWords(n) {
  n = Math.floor(Math.abs(parseFloat(n) || 0));
  if (n === 0) return 'cero';

  const ones = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
    'diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve'];
  const tens  = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const hunds = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos',
                 'seiscientos','setecientos','ochocientos','novecientos'];

  let r = '';

  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    r += (m === 1 ? 'un millon' : numberToWords(m) + ' millones') + ' ';
    n %= 1000000;
  }
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    r += (t === 1 ? 'mil' : numberToWords(t) + ' mil') + ' ';
    n %= 1000;
  }
  if (n >= 100) {
    if (n === 100) r += 'cien ';
    else r += hunds[Math.floor(n / 100)] + ' ';
    n %= 100;
  }
  if (n >= 20) {
    r += tens[Math.floor(n / 10)];
    if (n % 10 !== 0) r += ' y ' + ones[n % 10];
    r += ' ';
  } else if (n > 0) {
    r += ones[n] + ' ';
  }

  return r.trim().toUpperCase();
}

// ──────────────────────────────────────────────
// STATS & BADGES
// ──────────────────────────────────────────────
function updateStats() {
  const en = parseInt(localStorage.getItem('empeño_num') || '0');
  const sn = parseInt(localStorage.getItem('servicios_num') || '0');
  document.getElementById('stat-empeño').textContent   = en;
  document.getElementById('stat-servicios').textContent = sn;
  document.getElementById('stat-total').textContent    = en + sn;
}

function updateBadges() {
  const en = getNextNum('empeño');
  const sn = getNextNum('servicios');
  document.getElementById('badge-empeño').textContent   = '#' + padNum(en, 3);
  document.getElementById('badge-servicios').textContent = '#' + padNum(sn, 3);
}

// ──────────────────────────────────────────────
// LOGO MANAGEMENT
// ──────────────────────────────────────────────
function loadLogo() {
  const saved = localStorage.getItem('genesis_logo');
  if (saved) {
    App.logo = saved;
    applyLogoToUI(saved);
  }
}

function applyLogoToUI(base64) {
  const ids = ['home-logo', 'settings-logo-preview'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = base64; el.style.display = ''; }
  });

  const ph = document.getElementById('settings-logo-ph');
  if (ph) ph.style.display = 'none';
  const removeBtn = document.getElementById('btn-remove-logo');
  if (removeBtn) removeBtn.style.display = '';
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    App.logo = base64;
    localStorage.setItem('genesis_logo', base64);
    applyLogoToUI(base64);
    showToast('Logo cargado correctamente ✓', 'success');
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  App.logo = null;
  localStorage.removeItem('genesis_logo');
  ['header-logo','home-logo','settings-logo-preview'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = ''; el.style.display = 'none'; }
  });
  const hlt = document.getElementById('hlt');
  if (hlt) hlt.style.display = 'flex';
  const ph = document.getElementById('settings-logo-ph');
  if (ph) ph.style.display = '';
  const rb = document.getElementById('btn-remove-logo');
  if (rb) rb.style.display = 'none';
  showToast('Logo quitado', 'success');
}

// ──────────────────────────────────────────────
// SETTINGS MODAL
// ──────────────────────────────────────────────
function openSettings() {
  const en = parseInt(localStorage.getItem('empeño_num') || '0');
  const sn = parseInt(localStorage.getItem('servicios_num') || '0');
  document.getElementById('cfg-empeño-cnt').textContent   = en;
  document.getElementById('cfg-servicios-cnt').textContent = sn;

  // Refresh logo preview in modal
  if (App.logo) {
    const prev = document.getElementById('settings-logo-preview');
    if (prev) { prev.src = App.logo; prev.style.display = ''; }
    const ph = document.getElementById('settings-logo-ph');
    if (ph) ph.style.display = 'none';
    const rb = document.getElementById('btn-remove-logo');
    if (rb) rb.style.display = '';
  }

  document.getElementById('modal-settings').style.display = 'flex';
}

function closeSettings(event) {
  if (event && event.target !== document.getElementById('modal-settings')) return;
  document.getElementById('modal-settings').style.display = 'none';
  // Close on overlay click
  if (!event) document.getElementById('modal-settings').style.display = 'none';
}

// Called from modal close button
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-settings');
  if (modal && e.target === modal) modal.style.display = 'none';
});

function resetCounters() {
  if (!confirm('¿Reiniciar la numeración al #001? Esta acción no borra los contratos existentes.')) return;
  localStorage.setItem('empeño_num', '0');
  localStorage.setItem('servicios_num', '0');
  updateStats();
  updateBadges();
  document.getElementById('cfg-empeño-cnt').textContent = '0';
  document.getElementById('cfg-servicios-cnt').textContent = '0';
  showToast('Numeración reiniciada al #001 ✓', 'success');
}

// ──────────────────────────────────────────────
// NEW CONTRACT
// ──────────────────────────────────────────────
function startNewContract(type) {
  navigate('home');
  setTimeout(() => navigate(type), 80);
}

// ──────────────────────────────────────────────
// PDF GENERATION — EMPEÑO
// ──────────────────────────────────────────────
function generatePDF(type, copyType) {
  if (type === 'empeño')   generateEmpeñoPDF(copyType);
  if (type === 'servicios') generateServiciosPDF(copyType);
}

function generateEmpeñoPDF(copyType) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Save contract number on first generation
  if (!App.empeño.numSaved) {
    saveNum('empeño', App.empeño.contractNum);
    App.empeño.numSaved = true;
  }

  // Collect data
  const num    = padNum(App.empeño.contractNum, 4);
  const nombre = `${g('e-nombre')} ${g('e-apellido')}`;
  const dni    = g('e-dni');
  const tel    = g('e-teléfono');
  const dir    = g('e-dirección');
  const fecha  = g('e-fecha');
  const art    = g('e-artículo');
  const marca  = g('e-marca');
  const modelo = g('e-modelo');
  const color  = g('e-color');
  const estado = g('e-estado');
  const valor  = parseFloat(g('e-valor')) || 0;
  const monto  = parseFloat(g('e-monto')) || 0;
  const tasa   = parseFloat(g('e-tasa')) || 0;
  const plazo  = parseInt(g('e-plazo')) || 0;
  const periodo = g('e-periodo') || 'mensual';
  const obs    = g('e-obs');

  const interés = monto * (tasa / 100);
  const total   = monto + interés;

  // Vencimiento
  let vencStr = '—';
  if (plazo > 0 && fecha) {
    const base = new Date(fecha + 'T12:00:00');
    base.setDate(base.getDate() + plazo);
    vencStr = formatDate(base.toISOString().split('T')[0]);
  }

  // Signature
  let sigData = null;
  if (App.empeño.pad && !App.empeño.pad.isEmpty()) {
    sigData = App.empeño.pad.toDataURL('image/png');
  }

  // ── PDF LAYOUT ──
  const PW = 210, PH = 297, M = 18, CW = PW - M * 2;
  let y = M;

  // Colors
  const PURPLE = [123, 47, 190];
  const DARK   = [20, 20, 35];
  const GRAY   = [90, 90, 110];
  const LGRAY  = [180, 180, 195];

  function checkPage(needed = 20) {
    if (y + needed > PH - 20) {
      doc.addPage();
      y = M;
      addFooter();
    }
  }

  function line(x1, y1, x2, y2, color, w) {
    doc.setDrawColor(...(color || LGRAY));
    doc.setLineWidth(w || 0.3);
    doc.line(x1, y1, x2, y2);
  }

  function addFooter() {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LGRAY);
    doc.text(`Contrato de Empeño N° ${num} — Genesis Informatica — Corrientes Capital, Argentina`, PW / 2, PH - 8, { align: 'center' });
    line(M, PH - 12, PW - M, PH - 12);
  }

  // ─── HEADER ───
  // Logo
  if (App.logo) {
    try { doc.addImage(App.logo, 'PNG', M, y, 36, 18, '', 'FAST'); } catch(e) {}
  }

  // Business info (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PURPLE);
  doc.text('Genesis Informatica', PW - M, y + 6, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Tobias Ezequiel Obregón', PW - M, y + 11, { align: 'right' });
  doc.text('CUIT: 20-43534626-0', PW - M, y + 15.5, { align: 'right' });
  doc.text('Corrientes Capital, Argentina', PW - M, y + 20, { align: 'right' });

  y += 26;

  // Divider line with purple gradient effect
  doc.setFillColor(...PURPLE);
  doc.rect(M, y, CW, 0.8, 'F');
  y += 5;

  // Copy type badge
  const isCliente = copyType === 'cliente';
  const badgeColor = isCliente ? [34, 197, 94] : [59, 130, 246];
  const badgeText  = isCliente ? 'ORIGINAL' : 'COPIA';
  doc.setFillColor(...badgeColor);
  doc.roundedRect(M, y, 58, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, M + 29, y + 5.3, { align: 'center' });

  // Contract number (right)
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`N° ${num}`, PW - M, y + 5.3, { align: 'right' });
  y += 14;

  // Contract title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(`CONTRATO DE EMPEÑO N° ${num}`, PW / 2, y, { align: 'center' });
  y += 5;
  line(M, y, PW - M, y);
  y += 6;

  // ─── INTRO ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const intro = `En la ciudad de Corrientes Capital, Provincia de Corrientes, República Argentina, el día ${formatDate(fecha)}, entre:`;
  const introLines = doc.splitTextToSize(intro, CW);
  doc.text(introLines, M, y);
  y += introLines.length * 5 + 3;

  // Prestamista block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PURPLE);
  doc.text('PRESTAMISTA:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const prestLines = doc.splitTextToSize(
    `Genesis Informatica, representada por Tobias Ezequiel Obregón, CUIT N° 20-43534626-0, con domicilio en Corrientes Capital, Provincia de Corrientes, Argentina; en adelante denominado "EL PRESTAMISTA";`,
    CW - 4
  );
  doc.setFontSize(9.5);
  y += 5;
  doc.text(prestLines, M + 4, y);
  y += prestLines.length * 5 + 4;

  // Prestatario block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PURPLE);
  doc.text('PRESTATARIO / CLIENTE:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  let clientDesc = `${nombre}, DNI N° ${dni}`;
  if (dir)  clientDesc += `, domiciliado/a en ${dir}`;
  if (tel)  clientDesc += `, teléfono: ${tel}`;
  clientDesc += `; en adelante denominado/a "EL CLIENTE";`;
  const clientLines = doc.splitTextToSize(clientDesc, CW - 4);
  y += 5;
  doc.text(clientLines, M + 4, y);
  y += clientLines.length * 5 + 4;

  const acuerdoLines = doc.splitTextToSize(
    `Se conviene el presente CONTRATO DE EMPEÑO sujeto a las siguientes cláusulas y condiciones:`, CW
  );
  doc.setFontSize(9.5);
  doc.text(acuerdoLines, M, y);
  y += acuerdoLines.length * 5 + 5;

  // ─── CLAUSES ───
  function addClause(number, title, content) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PURPLE);
    doc.text(`CLÁUSULA ${number} — ${title}`, M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(content, CW - 2);
    doc.text(lines, M + 2, y);
    y += lines.length * 5 + 4;
    line(M, y, PW - M, y, LGRAY, 0.2);
    y += 6;
  }

  // Clause 1 — Artículo
  let artDesc = art;
  if (marca || modelo) artDesc += `. Marca/Modelo: ${[marca, modelo].filter(Boolean).join(' / ')}`;
  if (color) artDesc += `. Color/Características: ${color}`;
  addClause('PRIMERA', 'OBJETO DEL CONTRATO',
    `El CLIENTE entrega voluntariamente al PRESTAMISTA, en calidad de empeño y como garantía del préstamo otorgado, el siguiente bien:\n\n` +
    `Descripción: ${artDesc}\n` +
    `Estado del artículo: ${estado || 'A determinar'}\n` +
    `Valor estimado por el PRESTAMISTA: ${formatCurrency(valor)}\n\n` +
    `El CLIENTE declara ser el único y legítimo propietario del bien descrito y que el mismo se encuentra libre de todo gravamen, embargo o reclamo de terceros.`
  );

  addClause('SEGUNDA', 'MONTO DEL PRÉSTAMO',
    `El PRESTAMISTA otorga al CLIENTE en préstamo la suma de PESOS ${numberToWords(monto)} (${formatCurrency(monto)}), en concepto de préstamo garantizado con el artículo detallado en la Cláusula Primera. El CLIENTE declara haber recibido dicha suma en efectivo/transferencia y en conformidad.`
  );

  addClause('TERCERA', 'PLAZO',
    `El presente contrato tiene una vigencia de ${plazo} (${numberToWords(plazo)}) días corridos, contados a partir de la fecha de suscripción, venciendo el día ${vencStr}.`
  );

  addClause('CUARTA', 'INTERESES Y TOTAL A DEVOLVER',
    `Se establece una tasa de interés del ${tasa}% ${periodo}. El CLIENTE deberá abonar al PRESTAMISTA, al momento del rescate, la suma total de PESOS ${numberToWords(total)} (${formatCurrency(total)}), correspondiente al capital prestado (${formatCurrency(monto)}) más los intereses acordados (${formatCurrency(interés)}).`
  );

  addClause('QUINTA', 'RESCATE DEL ARTICULO',
    `Para recuperar el bien empeñado, el CLIENTE deberá abonar la totalidad del monto indicado en la Cláusula Cuarta (${formatCurrency(total)}) antes del vencimiento establecido el día ${vencStr}. El pago deberá efectuarse en las instalaciones del PRESTAMISTA, en efectivo o por el medio que las partes acuerden en ese momento.`
  );

  addClause('SEXTA', 'VENCIMIENTO E INCUMPLIMIENTO',
    `En caso de no producirse el rescate del artículo antes de la fecha de vencimiento establecida, el CLIENTE perderá en forma definitiva e irrevocable el derecho sobre el bien empeñado. El bien quedará en propiedad del PRESTAMISTA sin necesidad de notificación previa, intimación adicional, ni acción judicial alguna. El CLIENTE declara conocer y aceptar expresamente esta condición al momento de la firma del presente contrato.`
  );

  addClause('SEPTIMA', 'CONDICIONES GENERALES',
    `El CLIENTE garantiza que el bien entregado en empeño no es producto de delito y que es su legítimo propietario. Las partes renuncian a cualquier fuero que pudiera corresponderles sometiendose a la jurisdicción de los Tribunales Ordinarios de la ciudad de Corrientes, Argentina.` +
    (obs ? `\n\nOBSERVACIONES: ${obs}` : '')
  );

  // Conformidad
  checkPage(15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  const conformLines = doc.splitTextToSize(
    `CONFORMIDAD: En prueba de conformidad se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en la ciudad de Corrientes Capital, el día ${formatDate(fecha)}.`,
    CW
  );
  doc.text(conformLines, M, y);
  y += conformLines.length * 5 + 8;

  // ─── SIGNATURE SECTION ───
  checkPage(55);

  // Signature boxes
  const sigBoxW = 78;
  const leftX   = M;
  const rightX  = PW - M - sigBoxW;

  // Left box — Cliente
  doc.setFillColor(248, 248, 252);
  doc.rect(leftX, y, sigBoxW, 50, 'F');
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.rect(leftX, y, sigBoxW, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PURPLE);
  doc.text('FIRMA DEL CLIENTE', leftX + sigBoxW / 2, y + 7, { align: 'center' });

  // Signature line
  line(leftX + 8, y + 32, leftX + sigBoxW - 8, y + 32, LGRAY, 0.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(nombre, leftX + sigBoxW / 2, y + 37, { align: 'center' });
  doc.text(`DNI: ${dni}`, leftX + sigBoxW / 2, y + 42, { align: 'center' });
  doc.setTextColor(...GRAY);
  doc.text('(Firma a mano)', leftX + sigBoxW / 2, y + 47, { align: 'center' });

  // Right box — Prestamista
  doc.setFillColor(248, 248, 252);
  doc.rect(rightX, y, sigBoxW, 50, 'F');
  doc.setDrawColor(...LGRAY);
  doc.rect(rightX, y, sigBoxW, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PURPLE);
  doc.text('FIRMA DEL PRESTAMISTA', rightX + sigBoxW / 2, y + 7, { align: 'center' });

  if (sigData) {
    try { doc.addImage(sigData, 'PNG', rightX + 5, y + 9, sigBoxW - 10, 22, '', 'FAST'); } catch(e) {}
    line(rightX + 8, y + 32, rightX + sigBoxW - 8, y + 32, LGRAY, 0.5);
  } else {
    line(rightX + 8, y + 32, rightX + sigBoxW - 8, y + 32, LGRAY, 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('Tobias Ezequiel Obregón', rightX + sigBoxW / 2, y + 37, { align: 'center' });
  doc.text('CUIT: 20-43534626-0', rightX + sigBoxW / 2, y + 42, { align: 'center' });
  doc.text('Genesis Informatica', rightX + sigBoxW / 2, y + 47, { align: 'center' });

  y += 55;

  // Footer on last page
  addFooter();

  // Save
  const label = isCliente ? 'CLIENTE' : 'NEGOCIO';
  const apellido = g('e-apellido').replace(/\s+/g, '_') || 'SinApellido';
  savePDF(doc, `Empeño_${num}_${apellido}_${label}.pdf`);

  if (copyType === 'cliente') {
    saveContractToSupabase({
      tipo: 'empeño',
      num_contrato: `N° ${num}`,
      cliente_nombre: nombre.trim(),
      cliente_dni: dni,
      cliente_telefono: tel,
      descripcion: `${art} ${g('e-marca')} ${g('e-modelo')}`.trim(),
      monto_precio: parseFloat(g('e-monto')) || 0,
      pdf_base64: doc.output('datauristring')
    });
  }

  showSuccess('empeño');
  showToast('¡PDF generado correctamente!', 'success');
}

// ──────────────────────────────────────────────
// PDF GENERATION — SERVICIOS
// ──────────────────────────────────────────────
function generateServiciosPDF(copyType) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  if (!App.servicios.numSaved) {
    saveNum('servicios', App.servicios.contractNum);
    App.servicios.numSaved = true;
  }

  const num    = padNum(App.servicios.contractNum, 4);
  const nombre = `${g('s-nombre')} ${g('s-apellido')}`;
  const dni    = g('s-dni');
  const tel    = g('s-teléfono');
  const email  = g('s-email');
  const dir    = g('s-dirección');
  const fecha  = g('s-fecha');
  const tipo   = App.servicios.tipoLabel || g('s-tipo-label') || 'Servicio';
  const desc   = g('s-descripcion');
  const entregables = g('s-entregables');
  const precio = parseFloat(g('s-precio')) || 0;
  const seña   = parseFloat(g('s-seña')) || 0;
  const restante = precio - seña;
  const formaPago  = g('s-forma-pago');
  const plazo  = g('s-plazo');
  const fechaEnt = g('s-fecha-entrega');
  const garantía   = g('s-garantía');
  const condiciones = g('s-condiciones');

  let sigData = null;
  if (App.servicios.pad && !App.servicios.pad.isEmpty()) {
    sigData = App.servicios.pad.toDataURL('image/png');
  }

  const PW = 210, PH = 297, M = 18, CW = PW - M * 2;
  let y = M;

  const PURPLE = [123, 47, 190];
  const DARK   = [20, 20, 35];
  const GRAY   = [90, 90, 110];
  const LGRAY  = [180, 180, 195];

  function checkPage(needed = 20) {
    if (y + needed > PH - 20) {
      doc.addPage();
      y = M;
      addFooter();
    }
  }

  function line(x1, y1, x2, y2, color, w) {
    doc.setDrawColor(...(color || LGRAY));
    doc.setLineWidth(w || 0.3);
    doc.line(x1, y1, x2, y2);
  }

  function addFooter() {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LGRAY);
    doc.text(`Contrato de Servicios N° ${num} — Genesis Informatica — Corrientes Capital, Argentina`, PW / 2, PH - 8, { align: 'center' });
    line(M, PH - 12, PW - M, PH - 12);
  }

  // ─── HEADER ───
  if (App.logo) {
    try { doc.addImage(App.logo, 'PNG', M, y, 36, 18, '', 'FAST'); } catch(e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PURPLE);
  doc.text('Genesis Informatica', PW - M, y + 6, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Tobias Ezequiel Obregón', PW - M, y + 11, { align: 'right' });
  doc.text('CUIT: 20-43534626-0', PW - M, y + 15.5, { align: 'right' });
  doc.text('Corrientes Capital, Argentina', PW - M, y + 20, { align: 'right' });

  y += 26;
  doc.setFillColor(...PURPLE);
  doc.rect(M, y, CW, 0.8, 'F');
  y += 5;

  const isCliente = copyType === 'cliente';
  const badgeColor = isCliente ? [34, 197, 94] : [59, 130, 246];
  const badgeText  = isCliente ? 'ORIGINAL' : 'COPIA';
  doc.setFillColor(...badgeColor);
  doc.roundedRect(M, y, 58, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, M + 29, y + 5.3, { align: 'center' });

  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`N° ${num}`, PW - M, y + 5.3, { align: 'right' });
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(`CONTRATO DE PRESTACIÓN DE SERVICIOS N° ${num}`, PW / 2, y, { align: 'center' });
  y += 3;
  doc.setFontSize(10);
  doc.setTextColor(...PURPLE);
  doc.text(`— ${tipo} —`, PW / 2, y + 5, { align: 'center' });
  y += 9;
  line(M, y, PW - M, y);
  y += 6;

  // ─── INTRO ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const intro = `En la ciudad de Corrientes Capital, Provincia de Corrientes, República Argentina, el día ${formatDate(fecha)}, entre:`;
  const introLines = doc.splitTextToSize(intro, CW);
  doc.text(introLines, M, y);
  y += introLines.length * 5 + 3;

  // Prestador block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PURPLE);
  doc.text('PRESTADOR DE SERVICIOS:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const prestLines = doc.splitTextToSize(
    `Genesis Informatica, representada por Tobias Ezequiel Obregón, CUIT N° 20-43534626-0, con domicilio en Corrientes Capital, Argentina; en adelante denominado "EL PRESTADOR";`,
    CW - 4
  );
  y += 5;
  doc.text(prestLines, M + 4, y);
  y += prestLines.length * 5 + 4;



  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PURPLE);
  doc.text('CLIENTE / COMITENTE:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  let clientDesc = `${nombre}, DNI/CUIT N° ${dni}`;
  if (dir)   clientDesc += `, domiciliado/a en ${dir}`;
  if (tel)   clientDesc += `, teléfono: ${tel}`;
  if (email) clientDesc += `, email: ${email}`;
  clientDesc += `; en adelante denominado/a "EL CLIENTE";`;
  const clientLines = doc.splitTextToSize(clientDesc, CW - 4);
  y += 5;
  doc.text(clientLines, M + 4, y);
  y += clientLines.length * 5 + 4;

  const acuLines = doc.splitTextToSize(`Se conviene el presente CONTRATO DE PRESTACIÓN DE SERVICIOS sujeto a las siguientes cláusulas y condiciones:`, CW);
  doc.text(acuLines, M, y);
  y += acuLines.length * 5 + 5;

  // ─── CLAUSES ───
  function addClause(number, title, content) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PURPLE);
    doc.text(`CLÁUSULA ${number} — ${title}`, M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(content, CW - 2);
    doc.text(lines, M + 2, y);
    y += lines.length * 5 + 4;
    line(M, y, PW - M, y, LGRAY, 0.2);
    y += 6;
  }

  addClause('PRIMERA', 'OBJETO DEL CONTRATO',
    `EL PRESTADOR se obliga a prestar a EL CLIENTE el siguiente servicio de ${tipo}:\n\n` +
    `${desc}` +
    (entregables ? `\n\nALCANCE Y ENTREGABLES: ${entregables}` : '')
  );

  let precioClausa = `El precio total convenido por los servicios descriptos en la Cláusula Primera es de PESOS ${numberToWords(precio)} (${formatCurrency(precio)}).`;
  if (seña > 0) {
    precioClausa += ` El CLIENTE abona en concepto de seña o anticipo la suma de ${formatCurrency(seña)}, quedando un saldo pendiente de ${formatCurrency(restante)} a abonar según las condiciones acordadas.`;
  }
  precioClausa += ` Forma de pago: ${formaPago}.`;

  addClause('SEGUNDA', 'PRECIO Y FORMA DE PAGO', precioClausa);

  let plazoClausa = '';
  if (plazo) plazoClausa += `El plazo de entrega es de ${plazo}. `;
  if (fechaEnt) plazoClausa += `Fecha estimada de entrega: ${formatDate(fechaEnt)}. `;
  if (!plazoClausa) plazoClausa = 'El plazo de entrega sera acordado entre las partes una vez iniciados los trabajos. ';
  plazoClausa += 'El PRESTADOR se compromete a notificar con anticipación razonable cualquier demora justificada en la entrega.';
  addClause('TERCERA', 'PLAZO DE ENTREGA', plazoClausa);

  let garantClausa = garantía || 'El PRESTADOR garantiza que los servicios serán ejecutados con profesionalidad y diligencia.';
  garantClausa += ' En caso de defectos imputables al PRESTADOR, este se obliga a corregirlos sin cargo adicional dentro del periodo de garantía establecido.';
  addClause('CUARTA', 'GARANTÍA DEL SERVICIO', garantClausa);

  addClause('QUINTA', 'OBLIGACIONES DEL CLIENTE',
    `EL CLIENTE se obliga a: (a) proporcionar oportunamente toda la informacion y materiales necesarios para la ejecucion del servicio; (b) efectuar los pagos en los plazos y formas convenidas; (c) prestar colaboracion razonable cuando el servicio lo requiera. La demora del CLIENTE en el cumplimiento de estas obligaciones podra justificar una extension proporcional del plazo de entrega.`
  );

  addClause('SEXTA', 'PROPIEDAD INTELECTUAL Y CONFIDENCIALIDAD',
    `Los trabajos, disenos, codigos, materiales y demas productos generados en el marco del presente contrato serán propiedad del CLIENTE una vez recibido el pago total del precio acordado. Hasta ese momento, el PRESTADOR conserva todos los derechos sobre los mismos. Ambas partes se obligan a mantener confidencialidad sobre la informacion sensible compartida durante la ejecucion del contrato.`
  );

  addClause('SEPTIMA', 'CONDICIONES GENERALES Y JURISDICCION',
    `En caso de discrepancias no previstas en este contrato, las partes se comprometen a resolverlas de buena fe y de comun acuerdo. En caso de no llegar a un acuerdo, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la ciudad de Corrientes, Argentina, renunciando a cualquier otro fuero que pudiera corresponderles.` +
    (condiciones ? `\n\nCONDICIONES ADICIONALES: ${condiciones}` : '')
  );

  // Conformidad
  checkPage(15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  const conformLines = doc.splitTextToSize(
    `CONFORMIDAD: En prueba de conformidad se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en la ciudad de Corrientes Capital, el día ${formatDate(fecha)}.`,
    CW
  );
  doc.text(conformLines, M, y);
  y += conformLines.length * 5 + 8;

  // ─── SIGNATURE SECTION ───
  checkPage(55);

  const sigBoxW = 78;
  const leftX   = M;
  const rightX  = PW - M - sigBoxW;

  // Left — Cliente
  doc.setFillColor(248, 248, 252);
  doc.rect(leftX, y, sigBoxW, 50, 'F');
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.rect(leftX, y, sigBoxW, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PURPLE);
  doc.text('FIRMA DEL CLIENTE', leftX + sigBoxW / 2, y + 7, { align: 'center' });
  line(leftX + 8, y + 32, leftX + sigBoxW - 8, y + 32, LGRAY, 0.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(nombre, leftX + sigBoxW / 2, y + 37, { align: 'center' });
  doc.text(`DNI/CUIT: ${dni}`, leftX + sigBoxW / 2, y + 42, { align: 'center' });
  doc.setTextColor(...GRAY);
  doc.text('(Firma a mano)', leftX + sigBoxW / 2, y + 47, { align: 'center' });

  // Right — Prestador
  doc.setFillColor(248, 248, 252);
  doc.rect(rightX, y, sigBoxW, 50, 'F');
  doc.setDrawColor(...LGRAY);
  doc.rect(rightX, y, sigBoxW, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PURPLE);
  doc.text('FIRMA DEL PRESTADOR', rightX + sigBoxW / 2, y + 7, { align: 'center' });

  if (sigData) {
    try { doc.addImage(sigData, 'PNG', rightX + 5, y + 9, sigBoxW - 10, 22, '', 'FAST'); } catch(e) {}
    line(rightX + 8, y + 32, rightX + sigBoxW - 8, y + 32, LGRAY, 0.5);
  } else {
    line(rightX + 8, y + 32, rightX + sigBoxW - 8, y + 32, LGRAY, 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('Tobias Ezequiel Obregón', rightX + sigBoxW / 2, y + 37, { align: 'center' });
  doc.text('CUIT: 20-43534626-0', rightX + sigBoxW / 2, y + 42, { align: 'center' });
  doc.text('Genesis Informatica', rightX + sigBoxW / 2, y + 47, { align: 'center' });

  y += 55;
  addFooter();

  const label = isCliente ? 'CLIENTE' : 'NEGOCIO';
  const apellido = g('s-apellido').replace(/\s+/g, '_') || 'SinApellido';
  savePDF(doc, `Servicio_${num}_${apellido}_${label}.pdf`);

  if (copyType === 'cliente') {
    saveContractToSupabase({
      tipo: 'servicios',
      num_contrato: `N° ${num}`,
      cliente_nombre: nombre.trim(),
      cliente_dni: dni,
      cliente_telefono: tel,
      descripcion: `${tipoServ} - ${desc}`.substring(0, 100),
      monto_precio: parseFloat(precio) || 0,
      pdf_base64: doc.output('datauristring')
    });
  }

  showSuccess('servicios');
  showToast('¡PDF generado correctamente!', 'success');

  // Update stats & badges after save
  updateStats();
  updateBadges();
}

// ──────────────────────────────────────────────
// UI HELPERS
// ──────────────────────────────────────────────
function savePDF(doc, filename) {
  const blob = doc.output('blob');
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.type     = 'application/pdf';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}
function showSuccess(type) {
  document.getElementById(`${type}-success`).style.display = 'flex';
  updateStats();
  updateBadges();
}

function showToast(msg, type) {
  const toast = document.getElementById('app-toast');
  toast.textContent = msg;
  toast.className = `toast show${type ? ' ' + type : ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.className = 'toast', 3200);
}


// ─── SUPABASE & HISTORIAL ────────────────────────────────────
const SUPABASE_URL = 'https://auwyrcnlrzzweamthwxr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d3lyY25scnp6d2VhbXRod3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Mjc0NzUsImV4cCI6MjEwMDQwMzQ3NX0.7qZpKvGXw6H8I839vxm6yVRK0gG3SwzJkvgMWzucQpk';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function saveContractToSupabase(contractData) {
  if (!supabaseClient) return;
  contractData.estado_pago = 'pendiente';
  try {
    const { error } = await supabaseClient.from('contratos').insert([contractData]);
    if (error) console.error('Error guardando en Supabase:', error);
  } catch (err) {
    console.error('Excepción guardando historial:', err);
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historial-tbody');
  if (!tbody || !supabaseClient) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:16px;">Cargando...</td></tr>';
  
  try {
    const { data, error } = await supabaseClient
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:16px;">No hay contratos guardados aún.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(c => `
      <tr style="border-bottom: 1px solid var(--c-border);">
        <td style="padding:12px 8px;">${new Date(c.created_at).toLocaleDateString()}</td>
        <td style="padding:12px 8px; text-transform:capitalize;">${c.tipo}</td>
        <td style="padding:12px 8px;">${c.num_contrato}</td>
        <td style="padding:12px 8px;">${c.cliente_nombre}</td>
        <td style="padding:12px 8px;">$${c.monto_precio}</td>
        <td style="padding:12px 8px;">
          <button onclick="toggleEstadoPago('${c.id}', '${c.estado_pago || 'pendiente'}')" 
                  style="border:none; border-radius:12px; padding:4px 10px; font-size:12px; cursor:pointer; font-weight:bold;
                         background: ${c.estado_pago === 'pagado' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; 
                         color: ${c.estado_pago === 'pagado' ? '#22C55E' : '#EF4444'};">
            ${c.estado_pago === 'pagado' ? '✅ Pagado' : '❌ Pendiente'}
          </button>
        </td>
        <td style="padding:12px 8px;">
          ${c.pdf_base64 
            ? `<a href="${c.pdf_base64}" download="Contrato_${c.num_contrato.replace(' ', '')}_${c.cliente_nombre.replace(/\s+/g, '_')}.pdf" style="text-decoration:none; color:var(--c-purple-l); font-weight:bold; font-size:20px;" title="Descargar PDF">📄</a>` 
            : `<span style="color:var(--c-muted); font-size:12px;">N/A</span>`}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error cargando historial', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:16px; color:red;">Error al cargar el historial.</td></tr>';
  }
}

window.toggleEstadoPago = async function(id, currentEstado) {
  if (!supabaseClient) return;
  const nuevoEstado = currentEstado === 'pagado' ? 'pendiente' : 'pagado';
  try {
    const { error } = await supabaseClient.from('contratos').update({ estado_pago: nuevoEstado }).eq('id', id);
    if (error) throw error;
    loadHistory();
  } catch (err) {
    console.error('Error actualizando pago:', err);
    showToast('Error actualizando el estado de pago', 'error');
  }
};

// ─── VALIDATION ──────────────────────────────────────────────
function validateForm(type) {
  let isValid = true;
  let requiredFields = [];
  
  if (type === 'empeño') {
    requiredFields = ['e-nombre', 'e-dni', 'e-artículo', 'e-estado', 'e-valor', 'e-monto', 'e-tasa', 'e-plazo'];
  } else if (type === 'servicios') {
    requiredFields = ['s-nombre', 's-dni', 's-tipo', 's-descripcion', 's-precio', 's-forma-pago'];
  }
  
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add('input-error');
      isValid = false;
      // Remover el error al escribir
      el.addEventListener('input', () => el.classList.remove('input-error'), { once: true });
    } else {
      el.classList.remove('input-error');
    }
  });
  
  if (!isValid) {
    showToast('Faltan campos obligatorios', 'error');
  }
  return isValid;
}

// ─── WHATSAPP SHARING ────────────────────────────────────────
function shareWhatsApp(type) {
  let tel = '', msg = '';
  
  if (type === 'empeño') {
    tel = document.getElementById('e-teléfono').value.trim();
    const nombre = document.getElementById('e-nombre').value.trim() || 'Cliente';
    const num = document.getElementById('empeño-num-tag').innerText;
    const monto = document.getElementById('e-monto').value;
    const articulo = document.getElementById('e-artículo').value;
    const total = document.getElementById('e-total-display').innerText;
    
    msg = `Hola ${nombre}, te adjuntamos el resumen de tu *Contrato de Empeño ${num}*.\n\n`
        + `*Artículo:* ${articulo}\n`
        + `*Monto prestado:* $${monto}\n`
        + `*Total a devolver:* ${total}\n\n`
        + `¡Gracias por confiar en Genesis Informatica!`;
  } else if (type === 'servicios') {
    tel = document.getElementById('s-teléfono').value.trim();
    const nombre = document.getElementById('s-nombre').value.trim() || 'Cliente';
    const num = document.getElementById('servicios-num-tag').innerText;
    const servicio = document.getElementById('s-tipo-label').value || 'Servicio';
    const precio = document.getElementById('s-precio').value;
    
    msg = `Hola ${nombre}, te adjuntamos el resumen de tu *Contrato de Servicios ${num}*.\n\n`
        + `*Servicio:* ${servicio}\n`
        + `*Precio Total:* $${precio}\n\n`
        + `¡Gracias por confiar en Genesis Informatica!`;
  }
  
  if (!tel) {
    showToast('No se ingresó un teléfono para este cliente.', 'error');
    return;
  }
  
  // Clean phone number
  tel = tel.replace(/\D/g, '');
  if (!tel.startsWith('54')) {
    tel = '549' + tel; // Assuming Argentina defaults
  }
  
  const encodedMsg = encodeURIComponent(msg);
  const url = `https://wa.me/${tel}?text=${encodedMsg}`;
  window.open(url, '_blank');
}
