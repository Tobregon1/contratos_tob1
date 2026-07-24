const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// 1. Refactor generateEmpeñoPDF
let empeñoStart = code.indexOf('function generateEmpeñoPDF(copyType) {');
let empeñoEnd = code.indexOf('\n// ──────────────────────────────────────────────\n// PDF GENERATION — SERVICIOS', empeñoStart);
let empeñoBody = code.substring(empeñoStart, empeñoEnd);

let newEmpeñoDoc = empeñoBody
  .replace('function generateEmpeñoPDF(copyType) {', 'function createEmpeñoDoc(isCliente) {')
  .replace(/const isCliente = copyType === 'cliente';\s*/, '')
  .replace(/\/\/ Save[\s\S]*$/, 'return doc;\n}');

let newEmpeñoGen = `function generateEmpeñoPDF(copyType) {
  const isCliente = copyType === 'cliente';

  if (!App.empeño.numSaved) {
    saveNum('empeño', App.empeño.contractNum);
    
    const docC = createEmpeñoDoc(true);
    const docN = createEmpeñoDoc(false);
    
    const nombre = \`\${g('e-nombre')} \${g('e-apellido')}\`;
    const num = padNum(App.empeño.contractNum, 4);
    const art = g('e-artículo');
    
    saveContractToSupabase({
      tipo: 'empeño',
      num_contrato: \`N° \${num}\`,
      cliente_nombre: nombre.trim(),
      cliente_dni: g('e-dni'),
      cliente_telefono: g('e-teléfono'),
      descripcion: \`\${art} \${g('e-marca')} \${g('e-modelo')}\`.trim(),
      monto_precio: parseFloat(g('e-monto')) || 0,
      pdf_base64: docC.output('datauristring'),
      pdf_base64_copia: docN.output('datauristring')
    });
    
    App.empeño.numSaved = true;
  }

  const doc = createEmpeñoDoc(isCliente);
  const label = isCliente ? 'CLIENTE' : 'NEGOCIO';
  const num = padNum(App.empeño.contractNum, 4);
  const apellido = g('e-apellido').replace(/\\s+/g, '_') || 'SinApellido';
  savePDF(doc, \`Empeño_\${num}_\${apellido}_\${label}.pdf\`);
  
  showSuccess('empeño');
  showToast('¡PDF generado correctamente!', 'success');
}
`;

code = code.substring(0, empeñoStart) + newEmpeñoDoc + '\n\n' + newEmpeñoGen + '\n' + code.substring(empeñoEnd);

// 2. Refactor generateServiciosPDF
let servStart = code.indexOf('function generateServiciosPDF(copyType) {');
let servEnd = code.indexOf('\n// ──────────────────────────────────────────────\n// HELPERS', servStart);
if (servEnd === -1) servEnd = code.indexOf('\n// ─── SUPABASE & HISTORIAL', servStart);
if (servEnd === -1) servEnd = code.indexOf('async function loadHistory', servStart);

let servBody = code.substring(servStart, servEnd);

let newServDoc = servBody
  .replace('function generateServiciosPDF(copyType) {', 'function createServiciosDoc(isCliente) {')
  .replace(/const isCliente = copyType === 'cliente';\s*/, '')
  .replace(/\/\/ Save[\s\S]*$/, 'return doc;\n}');

let newServGen = `function generateServiciosPDF(copyType) {
  const isCliente = copyType === 'cliente';

  if (!App.servicios.numSaved) {
    saveNum('servicios', App.servicios.contractNum);
    
    const docC = createServiciosDoc(true);
    const docN = createServiciosDoc(false);
    
    const num = padNum(App.servicios.contractNum, 4);
    const nombre = \`\${g('s-nombre')} \${g('s-apellido')}\`;
    
    saveContractToSupabase({
      tipo: 'servicios',
      num_contrato: \`N° \${num}\`,
      cliente_nombre: nombre.trim(),
      cliente_dni: g('s-dni'),
      cliente_telefono: g('s-teléfono'),
      descripcion: \`\${App.servicios.tipoLabel} - \${g('s-equipo')} \${g('s-marca')}\`.trim(),
      monto_precio: parseFloat(g('s-precio')) || 0,
      pdf_base64: docC.output('datauristring'),
      pdf_base64_copia: docN.output('datauristring')
    });
    
    App.servicios.numSaved = true;
  }

  const doc = createServiciosDoc(isCliente);
  const label = isCliente ? 'CLIENTE' : 'NEGOCIO';
  const num = padNum(App.servicios.contractNum, 4);
  const apellido = g('s-apellido').replace(/\\s+/g, '_') || 'SinApellido';
  savePDF(doc, \`Servicio_\${num}_\${apellido}_\${label}.pdf\`);
  
  showSuccess('servicios');
  showToast('¡PDF generado correctamente!', 'success');
}
`;

code = code.substring(0, servStart) + newServDoc + '\n\n' + newServGen + '\n' + code.substring(servEnd);

// 3. Update loadHistory to show two buttons
let historyStart = code.indexOf('tbody.innerHTML = data.map(c =>');
let historyEnd = code.indexOf(').join(');
if (historyEnd === -1) historyEnd = code.indexOf(').join(');

if(historyStart !== -1) {
  let newPDFCell = `<div style="display:flex; gap:8px;">
            \${c.pdf_base64 
              ? \`<a href="\${c.pdf_base64}" download="Contrato_\${c.num_contrato.replace(' ', '')}_\${c.cliente_nombre.replace(/\\s+/g, '_')}_CLIENTE.pdf" style="text-decoration:none; color:var(--c-purple-l); font-weight:bold; font-size:20px;" title="Original (Cliente)">📄</a>\` 
              : ''}
            \${c.pdf_base64_copia
              ? \`<a href="\${c.pdf_base64_copia}" download="Contrato_\${c.num_contrato.replace(' ', '')}_\${c.cliente_nombre.replace(/\\s+/g, '_')}_NEGOCIO.pdf" style="text-decoration:none; color:var(--c-blue); font-weight:bold; font-size:20px;" title="Copia (Negocio)">📄</a>\`
              : ''}
            \${!c.pdf_base64 && !c.pdf_base64_copia ? \`<span style="color:var(--c-muted); font-size:12px;">N/A</span>\` : ''}
          </div>`;
          
  code = code.replace(/<td style="padding:12px 8px;">\s*\$\{c\.pdf_base64[\s\S]*?<\/td>/, 
    `<td style="padding:12px 8px;">\n${newPDFCell}\n</td>`
  );
} else {
  console.log("Could not find loadHistory table row generation");
}

fs.writeFileSync('app.js', code);
console.log('Script completed.');
