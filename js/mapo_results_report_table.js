/* Añade la tabla de resultados MAPO al selector de tablas para Word. No modifica cálculos. */
(function(){
'use strict';
function addSelector(){
  const panel=document.getElementById('reportTablesPanel');
  if(!panel || panel.querySelector('[data-report-table="mapoResults"]')) return;
  const container=panel.querySelector('.report-table-selectors');
  if(!container) return;
  const label=document.createElement('label');
  label.className='report-table-selector';
  label.innerHTML='<input type="checkbox" data-report-table="mapoResults"> Resultados de la evaluación MAPO';
  container.appendChild(label);
}
function resultBlock(){
  const source=document.getElementById('breakdown')?.querySelector('.mapo-result-table');
  if(!source) return null;
  const block=document.createElement('div');
  block.className='report-table-block mapo-results-report-block';
  const h=document.createElement('h3'); h.textContent='Resultados de la evaluación MAPO'; block.appendChild(h);
  const table=source.cloneNode(true); table.classList.add('mapo-report-table'); block.appendChild(table);
  const actions=document.createElement('div'); actions.className='report-table-actions';
  const b=document.createElement('button'); b.type='button'; b.className='copy-report-table'; b.textContent='Copiar tabla para Word';
  b.onclick=async()=>{
    const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+table.outerHTML+'</body></html>';
    const text=table.innerText;
    try{
      if(navigator.clipboard&&window.ClipboardItem) await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]);
      else { const d=document.createElement('div'); d.contentEditable='true'; d.style.position='fixed'; d.style.left='-9999px'; d.innerHTML=html; document.body.appendChild(d); const r=document.createRange(); r.selectNodeContents(d); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges(); d.remove(); }
      b.textContent='✓ Tabla copiada'; setTimeout(()=>b.textContent='Copiar tabla para Word',1800);
    }catch(e){ b.textContent='No se pudo copiar'; setTimeout(()=>b.textContent='Copiar tabla para Word',1800); }
  };
  actions.appendChild(b); block.appendChild(actions); return block;
}
function appendResultIfSelected(){
  const host=document.getElementById('reportTables'); if(!host) return;
  const cb=document.querySelector('#reportTablesPanel [data-report-table="mapoResults"]');
  if(!cb?.checked) return;
  host.querySelector('.mapo-results-report-block')?.remove();
  const block=resultBlock(); if(block) host.appendChild(block);
}
function init(){
  addSelector();
  const panel=document.getElementById('reportTablesPanel');
  if(panel){
    new MutationObserver(()=>{addSelector();}).observe(panel,{childList:true,subtree:true});
    panel.addEventListener('change',e=>{if(e.target?.matches('[data-report-table="mapoResults"]')) appendResultIfSelected();});
  }
  const host=document.getElementById('reportTables');
  if(host) new MutationObserver(()=>{setTimeout(appendResultIfSelected,0);}).observe(host,{childList:true,subtree:true});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
