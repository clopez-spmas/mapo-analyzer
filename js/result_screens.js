/* MAPO Analyzer — navegación independiente de resultados, tablas y simulación. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const IDS=['studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
function ensureTablesPanel(){const p=$('reportTablesPanel'),main=document.querySelector('main.container');if(p&&main&&p.parentElement!==main)main.appendChild(p);return p;}
function setVisible(el,visible){if(!el)return;el.hidden=!visible;el.setAttribute('aria-hidden',visible?'false':'true');el.style.display=visible?'block':'none';}
function hideAll(){ensureTablesPanel();IDS.forEach(id=>setVisible($(id),false));}
function top(){window.scrollTo({top:0,behavior:'smooth'});}
function backToAccess(){
  hideAll();
  if(window.MAPOMultiRoom&&typeof window.MAPOMultiRoom.openHospitalDashboard==='function'){
    window.MAPOMultiRoom.openHospitalDashboard();
  }else if(typeof window.showHospitalizacionDashboard==='function'){
    const p=$('studyPanel');
    if(p)setVisible(p,true);
    window.showHospitalizacionDashboard();
  }else if($('studyPanel')){
    setVisible($('studyPanel'),true);
    if(typeof window.renderStep==='function')window.renderStep();
  }
  top();
}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();backToAccess();});bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function show(id,after){hideAll();const e=$(id);if(!e)return;e.classList.add('result-independent-screen');setVisible(e,true);addBackButton(e);if(after)after(e);top();}
function showResult(){show('result');}
function showTables(){show('reportTablesPanel');}
function showSimulation(){show('mapoSimulation',e=>{try{if(window.MAPOSimulation&&typeof window.MAPOSimulation.open==='function')window.MAPOSimulation.open();}catch(err){const old=e.querySelector('.simulation-open-error');if(!old){const p=document.createElement('p');p.className='error simulation-open-error';p.textContent='No se pudo abrir la simulación: '+String(err.message||err);e.appendChild(p);}}});}
function ensureDashboardShortcuts(){
  const host=$('formContainer');
  if(!host)return;
  const grid=host.querySelector('.dashboard-grid');
  if(!grid)return;
  ['result','tables','simulation'].forEach(k=>grid.querySelector(`[data-result-screen="${k}"]`)?.remove());
  const defs=[
    ['result','✓','Resultados MAPO','Consultar el resultado de la evaluación y los factores MAPO.','Resultado'],
    ['tables','▤','Tablas para informe Word','Seleccionar y preparar las tablas para copiar al informe.','Informe'],
    ['simulation','↗','Simulación MAPO','Simular mejoras y comprobar su efecto sobre el índice MAPO.','Simulación']
  ];
  defs.forEach(d=>{const b=document.createElement('button');b.type='button';b.className='dashboard-card dashboard-result-shortcut';b.dataset.resultScreen=d[0];b.innerHTML=`<span class="dashboard-number">${d[1]}</span><span><strong>${d[2]}</strong><small>${d[3]}</small><em>${d[4]}</em></span>`;grid.appendChild(b);});
}
function bind(){
 document.addEventListener('click',e=>{
   const shortcut=e.target.closest('[data-result-screen]');
   if(shortcut){e.preventDefault();e.stopImmediatePropagation();const k=shortcut.dataset.resultScreen;if(k==='result')showResult();else if(k==='tables')showTables();else if(k==='simulation')showSimulation();return;}
   const b=e.target.closest('#openMapoSimulation,#openReportTables,#createReportTables');
   if(b){e.preventDefault();e.stopImmediatePropagation();if(b.id==='openMapoSimulation')showSimulation();else showTables();return;}
   const calc=e.target.closest('#calculate');
   if(calc){setTimeout(()=>{if($('result')&&!$('result').hidden&&typeof window.MAPOResultScreens?.showResult==='function')showResult();},0);}
 },true);
}
function init(){
 ensureTablesPanel();
 bind();
 const main=document.querySelector('main.container');
 if(main)new MutationObserver(()=>{ensureTablesPanel();ensureDashboardShortcuts();}).observe(main,{childList:true,subtree:true});
 ensureDashboardShortcuts();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,backToAccess});
})();