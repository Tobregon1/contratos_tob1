const fs = require('fs');
let appCode = fs.readFileSync('app.js', 'utf8');

// 1. Insert validation call in Empeño
const empTarget = "async function generateEmpeñoPDF(tipo = 'cliente') {";
const empInject = `async function generateEmpeñoPDF(tipo = 'cliente') {
  if (!validateForm('empeño')) return;`;
appCode = appCode.replace(empTarget, empInject);

// 2. Insert validation call in Servicios
const srvTarget = "async function generateServiciosPDF(tipo = 'cliente') {";
const srvInject = `async function generateServiciosPDF(tipo = 'cliente') {
  if (!validateForm('servicios')) return;`;
appCode = appCode.replace(srvTarget, srvInject);

// 3. Insert Supabase logic at the top (after DOMContentLoaded or standalone)
const supabaseInit = `
// ─── SUPABASE & HISTORIAL ────────────────────────────────────
const SUPABASE_URL = 'https://auwyrcnlrzzweamthwxr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d3lyY25scnp6d2VhbXRod3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Mjc0NzUsImV4cCI6MjEwMDQwMzQ3NX0.7qZpKvGXw6H8I839vxm6yVRK0gG3SwzJkvgMWzucQpk';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function saveContractToSupabase(contractData) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('contratos').insert([contractData]);
    if (error) console.error('Error guardando en Supabase:', error);
  } catch (err) {
    console.error('Excepción guardando historial:', err);
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historial-tbody');
  if (!tbody || !supabase) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">Cargando...</td></tr>';
  
  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">No hay contratos guardados aún.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(c => \`
      <tr style="border-bottom: 1px solid var(--c-border);">
        <td style="padding:12px 8px;">\${new Date(c.created_at).toLocaleDateString()}</td>
        <td style="padding:12px 8px; text-transform:capitalize;">\${c.tipo}</td>
        <td style="padding:12px 8px;">\${c.num_contrato}</td>
        <td style="padding:12px 8px;">\${c.cliente_nombre}</td>
        <td style="padding:12px 8px;">$\${c.monto_precio}</td>
      </tr>
    \`).join('');
  } catch (err) {
    console.error('Error cargando historial', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:red;">Error al cargar el historial.</td></tr>';
  }
}

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
    
    msg = \`Hola \${nombre}, te adjuntamos el resumen de tu Contrato de Empeño \${num}.%0A%0A\`
        + \`Artículo: \${articulo}%0A\`
        + \`Monto prestado: $\${monto}%0A\`
        + \`Total a devolver: \${total}%0A%0A\`
        + \`¡Gracias por confiar en Genesis Informatica!\`;
        
  } else if (type === 'servicios') {
    tel = document.getElementById('s-teléfono').value.trim();
    const nombre = document.getElementById('s-nombre').value.trim() || 'Cliente';
    const num = document.getElementById('servicios-num-tag').innerText;
    const servicio = document.getElementById('s-tipo-label').value || 'Servicio';
    const precio = document.getElementById('s-precio').value;
    
    msg = \`Hola \${nombre}, te adjuntamos el resumen de tu Contrato de Servicios \${num}.%0A%0A\`
        + \`Servicio: \${servicio}%0A\`
        + \`Precio Total: $\${precio}%0A%0A\`
        + \`¡Gracias por confiar en Genesis Informatica!\`;
  }
  
  if (!tel) {
    showToast('No se ingresó un teléfono para este cliente.', 'error');
    return;
  }
  
  // Clean phone number
  tel = tel.replace(/\\D/g, '');
  if (!tel.startsWith('54')) {
    tel = '549' + tel; // Assuming Argentina defaults
  }
  
  const url = \`https://wa.me/\${tel}?text=\${msg}\`;
  window.open(url, '_blank');
}
`;

appCode += '\n' + supabaseInit;

// 4. Update save to Supabase inside generateEmpeñoPDF
const empSaveTarget = 'savePDF(doc, `Empeno_${num}_${apellido}_${label}.pdf`);';
const empSaveInject = `savePDF(doc, \`Empeno_\${num}_\${apellido}_\${label}.pdf\`);
  
  if (tipo === 'cliente') {
    saveContractToSupabase({
      tipo: 'empeño',
      num_contrato: \`N° \${num}\`,
      cliente_nombre: \`\${nombre} \${apellido}\`.trim(),
      cliente_dni: dni,
      cliente_telefono: tel,
      descripcion: \`\${art} \${marca} \${modelo}\`.trim(),
      monto_precio: parseFloat(monto) || 0
    });
  }`;
appCode = appCode.replace(empSaveTarget, empSaveInject);

// 5. Update save to Supabase inside generateServiciosPDF
const srvSaveTarget = 'savePDF(doc, `Servicio_${num}_${apellido}_${label}.pdf`);';
const srvSaveInject = `savePDF(doc, \`Servicio_\${num}_\${apellido}_\${label}.pdf\`);
  
  if (tipo === 'cliente') {
    saveContractToSupabase({
      tipo: 'servicios',
      num_contrato: \`N° \${num}\`,
      cliente_nombre: \`\${nombre} \${apellido}\`.trim(),
      cliente_dni: dni,
      cliente_telefono: tel,
      descripcion: \`\${tipoServ} - \${desc}\`.substring(0, 100),
      monto_precio: parseFloat(precio) || 0
    });
  }`;
appCode = appCode.replace(srvSaveTarget, srvSaveInject);

// 6. Hook loadHistory when navigating to historial
const navTarget = "if (viewId === 'empeño') updateEmpeñoPreview();";
const navInject = "if (viewId === 'empeño') updateEmpeñoPreview();\n  if (viewId === 'historial') loadHistory();";
appCode = appCode.replace(navTarget, navInject);

fs.writeFileSync('app.js', appCode);
console.log('Update completed successfully.');
