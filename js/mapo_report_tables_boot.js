/* MAPO report tables boot */
(function(){
'use strict';
function copyTableToWord(table,button){
 const clone=table.cloneNode(true);
 clone.querySelectorAll('th,td').forEach(cell=>{cell.style.border='1px solid #000';cell.style.padding='4px 6px';cell.style.verticalAlign='top';});
 clone.style.borderCollapse='collapse';clone.style.width='100%';clone.style.border='1px solid #000';
 const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+clone.outerHTML+'</body></html>';
 const text=table.innerText;
 const done=()=>{const old=button.textContent;button.textContent='Tabla copiada';setTimeout(()=>button.textContent=old,1400);};
 if(navigator.clipboard&&window.ClipboardItem){
   navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]).then(done).catch(()=>fallbackCopy(table,button));
 }else fallbackCopy(table,button);
}
function fallbackCopy(table,button){
 const range=document.createRange();range.selectNode(table);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
 try{document.execCommand('copy');const old=button.textContent;button.textContent='Tabla copiada';setTimeout(()=>button.textContent=old,1400);}finally{sel.removeAllRanges();}
}
function attachCopyButtons(root){
 if(!root)return;
 root.querySelectorAll('.mapo-report-table').forEach(table=>{
   if(table.nextElementSibling?.classList.contains('copy-report-table'))return;
   const b=document.createElement('button');b.type='button';b.className='copy-report-table secondary';b.textContent='Copiar tabla para Word';
   b.addEventListener('click',()=>copyTableToWord(table,b));
   table.insertAdjacentElement('afterend',b);
 });
}
function boot(){
 const result=document.getElementById('result');
 if(!result||!result.parentNode||document.getElementById('openReportTables'))return;
 const section=document.createElement('section');section.id='reportTablesPanel';section.className='card';section.hidden=true;
 const defs=[['general','Datos generales'],['workers','Personas trabajadoras y horarios'],['patients','Tipología de pacientes'],['mobilizations','Movilizaciones'],['fs','Factor de elevación (FS)'],['fa','Factor de ayudas menores (FA)'],['wheelchairs','Sillas de ruedas (FC)'],['bathrooms','Baños — PMB y PMWC'],['rooms','Habitaciones — PMH'],['formation','Formación (FF)'],['factors','Resultado MAPO y factores']];
 section.innerHTML='<div class="section-heading"><div><h2>Tablas para informe Word</h2><p>Seleccione las tablas que desea preparar.</p></div></div><div class="report-table-selectors">'+defs.map(d=>'<label><input type="checkbox" data-report-table="'+d[0]+'"> '+d[1]+'</label>').join('')+'</div><div class="actions"><button type="button" id="generateReportTables">Generar tablas</button><button type="button" id="copyAllReportTables" class="secondary">Copiar todas las tablas</button></div><div id="reportTables"></div>';
 result.parentNode.insertBefore(section,result.nextSibling);
 const actions=result.querySelector('.actions');if(actions){const open=document.createElement('button');open.type='button';open.id='openReportTables';open.className='secondary';open.textContent='Crear tablas para informe Word';actions.appendChild(open);open.onclick=()=>{section.hidden=false;section.scrollIntoView({behavior:'smooth'});};}
 function render(){const host=document.getElementById('reportTables'),api=window.MAPOReportTables;if(!host||!api||typeof api.build!=='function'){if(host)host.innerHTML='<p class="error">No se ha cargado el generador de tablas.</p>';return;}const checks=[...section.querySelectorAll('[data-report-table]')].filter(x=>x.checked);host.innerHTML=checks.map(x=>api.build(x.dataset.reportTable)).join('')||'<p class="report-tables-empty">Seleccione al menos una tabla.</p>';attachCopyButtons(host);}
 document.getElementById('generateReportTables').onclick=render;
 document.getElementById('copyAllReportTables').onclick=()=>{render();setTimeout(()=>copyAll(),0);};
 function copyAll(){const host=document.getElementById('reportTables');if(!host)return;const tables=[...host.querySelectorAll('.mapo-report-table')];if(!tables.length)return;const holder=document.createElement('div');tables.forEach(t=>holder.appendChild(t.cloneNode(true)));const html='<!DOCTYPE html><html><body>'+holder.innerHTML+'</body></html>';const text=tables.map(t=>t.innerText).join('\n\n');if(navigator.clipboard&&window.ClipboardItem)navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
