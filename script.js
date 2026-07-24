const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// 1. Move Supabase Init to top
content = content.replace(
  '// ──────────────────────────────────────────────\r\n// STATE',
  `// ──────────────────────────────────────────────\r\n// SUPABASE INIT\r\n// ──────────────────────────────────────────────\r\nconst SUPABASE_URL = 'https://auwyrcnlrzzweamthwxr.supabase.co';\r\nconst SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d3lyY25scnp6d2VhbXRod3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Mjc0NzUsImV4cCI6MjEwMDQwMzQ3NX0.7qZpKvGXw6H8I839vxm6yVRK0gG3SwzJkvgMWzucQpk';\r\nconst supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;\r\n\r\n// ──────────────────────────────────────────────\r\n// STATE`
);
// fallback for \n
content = content.replace(
  '// ──────────────────────────────────────────────\n// STATE',
  `// ──────────────────────────────────────────────\n// SUPABASE INIT\n// ──────────────────────────────────────────────\nconst SUPABASE_URL = 'https://auwyrcnlrzzweamthwxr.supabase.co';\nconst SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d3lyY25scnp6d2VhbXRod3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Mjc0NzUsImV4cCI6MjEwMDQwMzQ3NX0.7qZpKvGXw6H8I839vxm6yVRK0gG3SwzJkvgMWzucQpk';\nconst supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;\n\n// ──────────────────────────────────────────────\n// STATE`
);

// Remove the old Supabase init at the bottom to avoid duplication
content = content.replace(
  /\/\/ ─── SUPABASE & HISTORIAL ────────────────────────────────────[\s\S]*?const supabaseClient = window\.supabase \? window\.supabase\.createClient\(SUPABASE_URL, SUPABASE_KEY\) : null;/,
  '// ─── SUPABASE & HISTORIAL ────────────────────────────────────'
);

// 2. Update navigate to async
content = content.replace('function navigate(view) {', 'async function navigate(view) {');
content = content.replace("App.empeño.contractNum = getNextNum('empeño');", "App.empeño.contractNum = await getNextNum('empeño');");
content = content.replace("App.servicios.contractNum = getNextNum('servicios');", "App.servicios.contractNum = await getNextNum('servicios');");

// 3. Update getNextNum
content = content.replace(
  /function getNextNum\(type\) \{[\s\S]*?\}/,
  `async function getNextNum(type) {
  if (!supabaseClient) return parseInt(localStorage.getItem(\`\${type}_num\`) || '0') + 1;
  try {
    const { data, error } = await supabaseClient
      .from('contratos')
      .select('num_contrato')
      .eq('tipo', type)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      const match = data[0].num_contrato.match(/\\d+/);
      if (match) return parseInt(match[0]) + 1;
    }
  } catch(e) { console.error('Error getting next num', e); }
  // Fallback
  return parseInt(localStorage.getItem(\`\${type}_num\`) || '0') + 1;
}`
);

// 4. Update updateStats
content = content.replace(
  /function updateStats\(\) \{[\s\S]*?document\.getElementById\('stat-total'\)\.textContent\s*=\s*en \+ sn;\s*\}/,
  `async function updateStats() {
  let en = 0, sn = 0;
  if (supabaseClient) {
    const { count: countE } = await supabaseClient.from('contratos').select('*', { count: 'exact', head: true }).eq('tipo', 'empeño');
    const { count: countS } = await supabaseClient.from('contratos').select('*', { count: 'exact', head: true }).eq('tipo', 'servicios');
    en = countE || 0;
    sn = countS || 0;
  } else {
    en = parseInt(localStorage.getItem('empeño_num') || '0');
    sn = parseInt(localStorage.getItem('servicios_num') || '0');
  }
  document.getElementById('stat-empeño').textContent   = en;
  document.getElementById('stat-servicios').textContent = sn;
  document.getElementById('stat-total').textContent    = en + sn;
}`
);

// 5. Update updateBadges
content = content.replace(
  /function updateBadges\(\) \{[\s\S]*?document\.getElementById\('badge-servicios'\)\.textContent = '#' \+ padNum\(sn, 3\);\s*\}/,
  `async function updateBadges() {
  const en = await getNextNum('empeño');
  const sn = await getNextNum('servicios');
  document.getElementById('badge-empeño').textContent   = '#' + padNum(en, 3);
  document.getElementById('badge-servicios').textContent = '#' + padNum(sn, 3);
}`
);

// 6. Update loadLogo
content = content.replace(
  /function loadLogo\(\) \{[\s\S]*?applyLogoToUI\(saved\);\s*\}\s*\}/,
  `async function loadLogo() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('configuracion').select('valor').eq('clave', 'genesis_logo').single();
      if (data && data.valor) {
        App.logo = data.valor;
        applyLogoToUI(data.valor);
        return;
      }
    } catch(e) { console.error('Error fetching logo', e); }
  }
  const saved = localStorage.getItem('genesis_logo');
  if (saved) {
    App.logo = saved;
    applyLogoToUI(saved);
  }
}`
);

// 7. Update handleLogoUpload
content = content.replace(
  /function handleLogoUpload\(event\) \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}/,
  `function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    App.logo = base64;
    localStorage.setItem('genesis_logo', base64);
    applyLogoToUI(base64);
    showToast('Logo cargado correctamente ✓', 'success');
    
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from('configuracion').upsert(
          { clave: 'genesis_logo', valor: base64 },
          { onConflict: 'clave' }
        );
        if (error) console.error('Error saving logo', error);
      } catch(e) { console.error('Exception saving logo', e); }
    }
  };
  reader.readAsDataURL(file);
}`
);

// 8. Update removeLogo
content = content.replace(
  /function removeLogo\(\) \{[\s\S]*?showToast\('Logo quitado', 'success'\);\s*\}/,
  `async function removeLogo() {
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
  
  if (supabaseClient) {
    try {
      await supabaseClient.from('configuracion').delete().eq('clave', 'genesis_logo');
    } catch(e) { console.error('Error deleting logo', e); }
  }
}`
);

fs.writeFileSync('app.js', content);
console.log('Done modifying app.js');
