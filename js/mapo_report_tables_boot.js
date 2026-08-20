/* MAPO report tables boot */
(function(){
'use strict';
function boot(){
 const result=document.getElementById('result');
 if(!result||!result.parentNode||document.getElementById('openReportTables'))return;
 const section=document.createElement('section');section.id='reportTablesPanel';section.className='card';section.hidden=true;
 const defs=[['general','Datos generales'],['workers','Personas trabajadoras y horarios'],['patients','Tipología de pacientes'],['mobilizations','Movilizaciones'],['fs','Factor de elevación (FS)'],['fa','Factor de ayudas menores (FA)'],['wheelchairs','Sillas de ruedas (FC)'],['bathrooms','Baños — PMB y PMWC'],['rooms','Habitaciones — PMH'],['formation','Formación (FF)'],['factors','Resultado MAPO y factores']];
 section.innerHTML='<div class="section-heading"><div><h2>Tablas para informe Word</h2><p>Seleccione las tablas que desea preparar.</p></div></div><div class="report-table-selectors">'+defs.map(d=>'<label><input type="checkbox" data-report-table="'+d[0]+'"> '+d[1]+'</label>').join('')+'</div><div class="actions"><button type="button" id="generateReportTables">Generar tablas</button><button type="button" id="copyAllReportTables" class="secondary">Copiar todas las tablas</button></div><div id="reportTables"></div>';
 result.parentNode.insertBefore(section,result.nextSibling);
 const actions=result.querySelector('.actions');if(actions){const open=document.createElement('button');open.type='button';open.id='openReportTables';open.className='secondary';open.textContent='Crear tablas para informe Word';actions.appendChild(open);open.onclick=()=>{section.hidden=false;section.scrollIntoView({behavior:'smooth'});};}
 function render(){const host=document.getElementById('reportTables'),api=window.MAPOReportTables;if(!host||!api||typeof api.build!=='function'){if(host)host.innerHTML='<p class="error">No se ha cargado el generador de tablas.</p>';return;}const checks=[...section.querySelectorAll('[data-report-table]')].filter(x=>x.checked);host.innerHTML=checks.map(x=>api.build(x.dataset.reportTable)).join('')||'<p class="report-tables-empty">Seleccione al menos una tabla.</p>';}
 document.getElementById('generateReportTables').onclick=render;document.getElementById('copyAllReportTables').onclick=render;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
