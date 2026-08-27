/* MAPO Analyzer — campos de FS/FA en las tablas de informe.
   Solo lectura: toma las respuestas ya guardadas y las añade a las tablas.
   No calcula ni modifica ningún resultado MAPO. */
(function(){
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function valueOf(q){
 const f=window.formData||{};
 const v=f[q.id];
 if(v===true)return 'Sí';
 if(v===false)return 'No';
 if(v===null||v===undefined||v==='')return 'Sin responder';
 return v;
}
function enrich(factor){
 const questions=window.HOSPITALIZACION_QUESTIONS?.[factor];
 if(!Array.isArray(questions)||!questions.length)return;
 const blocks=Array.from(document.querySelectorAll('#reportTables .report-table-block'));
 const title=factor==='fs'?'Factor de elevación (FS)':'Factor de ayudas menores (FA)';
 const block=blocks.find(b=>b.querySelector('h3')?.textContent?.trim()===title);
 if(!block)return;
 const tbody=block.querySelector('table tbody');
 if(!tbody)return;
 tbody.querySelectorAll('tr[data-factor-question]').forEach(r=>r.remove());
 const rows=questions.map(q=>{const tr=document.createElement('tr');tr.dataset.factorQuestion=q.id;tr.innerHTML='<td>'+esc(q.label)+'</td><td>'+esc(valueOf(q))+'</td>';return tr;});
 const first=tbody.firstChild;
 rows.forEach(r=>tbody.insertBefore(r,first));
}
function bind(){
 const b=document.getElementById('generateReportTables');
 if(!b||b.dataset.factorFieldsBound)return;
 b.dataset.factorFieldsBound='1';
 b.addEventListener('click',()=>setTimeout(()=>{enrich('fs');enrich('fa');},0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
window.MAPOFactorReportFields=Object.freeze({enrich});
})();
