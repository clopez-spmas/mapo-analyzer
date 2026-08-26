/* MAPO report tables boot — integración del generador, sin duplicar botones */
(function(){
'use strict';

function tableToWordPayload(table){
 const clone=table.cloneNode(true);
 clone.querySelectorAll('th,td').forEach(cell=>{
   cell.style.border='1px solid #000';
   cell.style.padding='4px 6px';
   cell.style.verticalAlign='top';
 }
 );
 clone.style.borderCollapse='collapse';
 clone.style.width='100%';
 clone.style.border='1px solid #000';
 return {
   html:'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+clone.outerHTML+'</body></html>',
   text:table.innerText
 };
}

async function copyTables(tables,button){
 if(!tables.length)return false;
 const payloads=tables.map(tableToWordPayload);
 const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+payloads.map(x=>x.html.replace(/^<!DOCTYPE html><html><head><meta charset="utf-8"><\/head><body>|<\/body><\/html>$/g,'')).join('<br>')+'</body></html>';
 const text=payloads.map(x=>x.text).join('\n\n');
 try{
   if(navigator.clipboard&&window.ClipboardItem){
     await navigator.clipboard.write([new ClipboardItem({
       'text/html':new Blob([html],{type:'text/html'}),
       'text/plain':new Blob([text],{type:'text/plain'})
     })]);
   }else{
     const holder=document.createElement('div');
     holder.contentEditable='true';
     holder.style.position='fixed';holder.style.left='-9999px';
     holder.innerHTML=html;
     document.body.appendChild(holder);
     const range=document.createRange();range.selectNodeContents(holder);
     const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
     const ok=document.execCommand('copy');sel.removeAllRanges();holder.remove();
     if(!ok)throw new Error('copy failed');
   }
   if(button){const old=button.textContent;button.textContent=tables.length===1?'✓ Tabla copiada':'✓ Tablas copiadas';setTimeout(()=>button.textContent=old,1600);}
   return true;
 }catch(e){
   try{
     const holder=document.createElement('div');holder.contentEditable='true';holder.style.position='fixed';holder.style.left='-9999px';
     holder.innerHTML=html;document.body.appendChild(holder);
     const range=document.createRange();range.selectNodeContents(holder);
     const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
     document.execCommand('copy');sel.removeAllRanges();holder.remove();
     if(button){const old=button.textContent;button.textContent='✓ Tabla copiada';setTimeout(()=>button.textContent=old,1600);}
     return true;
   }catch(_){alert('No se han podido copiar las tablas. Compruebe que la aplicación se está ejecutando mediante HTTPS.');return false;}
 }
}

function boot(){
 const result=document.getElementById('result');
 if(!result||!result.parentNode||document.getElementById('openReportTables'))return;
 const section=document.createElement('section');
 section.id='reportTablesPanel';section.className='card';section.hidden=true;
 const defs=[['general','Datos generales'],['workers','Personas trabajadoras y horarios'],['patients','Tipología de pacientes'],['mobilizations','Movilizaciones'],['fs','Factor de elevación (FS)'],['fa','Factor de ayudas menores (FA)'],['wheelchairs','Sillas de ruedas (FC)'],['bathrooms','Baños — PMB y PMWC'],['rooms','Habitaciones — PMH'],['formation','Formación (FF)'],['factors','Resultado MAPO y factores']];
 section.innerHTML='<div class="section-heading"><div><h2>Tablas para informe Word</h2><p>Seleccione las tablas que desea preparar.</p></div></div><div class="report-table-selectors">'+defs.map(d=>'<label><input type="checkbox" data-report-table="'+d[0]+'"> '+d[1]+'</label>').join('')+'</div><div class="actions"><button type="button" id="generateReportTables">Generar tablas</button><button type="button" id="copyAllReportTables" class="secondary">Copiar todas las tablas</button></div><div id="reportTables"></div>';
 result.parentNode.insertBefore(section,result.nextSibling);
 const actions=result.querySelector('.actions');
 if(actions){const open=document.createElement('button');open.type='button';open.id='openReportTables';open.className='secondary';open.textContent='Crear tablas para informe Word';actions.appendChild(open);open.onclick=()=>{section.hidden=false;section.scrollIntoView({behavior:'smooth'});};}
 function render(){
   const host=document.getElementById('reportTables'),api=window.MAPOReportTables;
   if(!host||!api||typeof api.build!=='function'){if(host)host.innerHTML='<p class="error">No se ha cargado el generador de tablas.</p>';return;}
   const checks=[...section.querySelectorAll('[data-report-table]')].filter(x=>x.checked);
   host.innerHTML=checks.map(x=>api.build(x.dataset.reportTable)).join('')||'<p class="report-tables-empty">Seleccione al menos una tabla.</p>';
   // Los botones individuales los genera exclusivamente mapo_report_tables.js.
   // No se vuelven a insertar aquí: evita duplicados y eventos sin conexión.
 }
 const generate=document.getElementById('generateReportTables');if(generate)generate.onclick=render;
 const all=document.getElementById('copyAllReportTables');
 if(all)all.onclick=async()=>{
   // Si aún no se han generado, generar primero exactamente las tablas seleccionadas.
   render();
   const host=document.getElementById('reportTables');
   const tables=host?[...host.querySelectorAll('.mapo-report-table')]:[];
   await copyTables(tables,all);
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
