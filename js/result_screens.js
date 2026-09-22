/* MAPO Analyzer — navegación única de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','multiRoomResultsHub','mapoSimulation','reportTablesPanel','templateAdmin'];
function hideAll(){SCREEN_IDS.forEach(id=>{const el=$(id);if(el){el.hidden=true;el.setAttribute('aria-hidden','true');el.style.removeProperty('display');}});}
function reveal(el){let p=el;while(p&&p!==document.body){p.hidden=false;p.removeAttribute('aria-hidden');p.style.removeProperty('display');p=p.parentElement;}el.hidden=false;el.removeAttribute('aria-hidden');}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();backToAccess();});bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function openScreen(id,after){const el=$(id);if(!el)return false;hideAll();reveal(el);addBackButton(el);if(typeof after==='function')after(el);reveal(el);window.scrollTo(0,0);return true;}
function showMultiRoomHub(){const mr=window.MAPOMultiRoom,s=mr?.state;if(!s||!Array.isArray(s.rooms)||s.rooms.length<=1)return showResult();const hub=$('multiRoomResultsHub');if(!hub)return false;hub.innerHTML='<div class="section-heading"><div><h2>Resultados del estudio multisala</h2><p>Seleccione una sala para consultar sus resultados, simulación o tablas para Word. No se calcula un resultado global en esta fase.</p></div></div><div class="multi-room-results-list">'+s.rooms.map((r,i)=>{const name=(r.name||'Unidad '+(i+1)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const has=!!(r.lastResult&&Object.keys(r.lastResult).length);return '<div class="multi-room-result-card"><h3>Sala '+(i+1)+': '+name+'</h3><p>'+(has?'Resultado calculado.':'Pendiente de cálculo.')+'</p><div class="actions"><button type="button" data-mr-result="'+i+'" '+(has?'':'disabled')+'>Ver resultado</button><button type="button" class="secondary" data-mr-sim="'+i+'" '+(has?'':'disabled')+'>Simular mejoras</button><button type="button" class="secondary" data-mr-tables="'+i+'">Tablas para Word</button></div></div>';}).join('')+'</div><div class="actions"><button type="button" class="secondary" id="multiRoomResultsBack">← Volver a accesos directos</button></div>';hub.querySelectorAll('[data-mr-result]').forEach(b=>b.onclick=()=>openRoomResult(Number(b.dataset.mrResult)));hub.querySelectorAll('[data-mr-sim]').forEach(b=>b.onclick=()=>openRoomSimulation(Number(b.dataset.mrSim)));hub.querySelectorAll('[data-mr-tables]').forEach(b=>b.onclick=()=>openRoomTables(Number(b.dataset.mrTables)));hub.querySelector('#multiRoomResultsBack').onclick=backToAccess;return openScreen('multiRoomResultsHub');}
function selectRoom(i){const mr=window.MAPOMultiRoom,s=mr?.state;if(!s||!s.rooms?.[i])return false;s.active=i;mr.restoreCurrentRoom?.();return true;}
function roomLabel(r,i){return r?.name?.trim()||('Sala '+(i+1));}
function addRoomSwitcher(host,onChange){
  const mr=window.MAPOMultiRoom,s=mr?.state;
  if(!host||!s||!Array.isArray(s.rooms)||s.rooms.length<=1)return;
  host.querySelector('#resultRoomSwitcher')?.remove();
  const box=document.createElement('div');
  box.id='resultRoomSwitcher';
  box.className='schedule-preview result-room-switcher';
  box.innerHTML='<strong>Unidad en consulta</strong><label>Seleccionar sala/planta/sección <select id="resultRoomSelector" aria-label="Seleccionar sala, planta o sección"></select></label><p class="small">Puede cambiar de sala sin volver a la pantalla anterior.</p>';
  const heading=host.querySelector('.section-heading');
  if(heading)heading.insertAdjacentElement('afterend',box);else host.insertBefore(box,host.firstChild);
  const sel=box.querySelector('#resultRoomSelector');
  sel.innerHTML=s.rooms.map((r,i)=>'<option value="'+i+'" '+(i===s.active?'selected':'')+'>'+String(roomLabel(r,i)).replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[x]))+'</option>').join('');
  sel.addEventListener('change',()=>{
    const i=Number(sel.value);
    if(!selectRoom(i))return;
    if(typeof onChange==='function')onChange();
  });
}
function openRoomResult(i){if(!selectRoom(i))return false;return showResult();}
function openRoomSimulation(i){if(!selectRoom(i))return false;return showSimulation();}
function openRoomTables(i){if(!selectRoom(i))return false;return showTables();}
function showResult(){return openScreen('result',()=>{window.MAPOResultsUI?.render?.();addRoomSwitcher($('result'),showResult);});}
function ensureTables(){if(document.getElementById('reportTablesPanel'))return document.getElementById('reportTablesPanel');if(typeof window.MAPOReportTables?.ensurePanel==='function')return window.MAPOReportTables.ensurePanel();return null;}
function showTables(){const panel=ensureTables();if(!panel)return false;const opened=openScreen('reportTablesPanel');if(opened){window.MAPOReportTables?.render?.();addRoomSwitcher(panel,showTables);if(!panel.dataset.defaultSelectionInitialized){panel.querySelectorAll('input[type="checkbox"]').forEach(cb=>{cb.checked=false;});panel.dataset.defaultSelectionInitialized='1';}}return opened;}
function showSimulation(){return openScreen('mapoSimulation',()=>{window.MAPOSimulation?.open?.();addRoomSwitcher($('mapoSimulation'),showSimulation);});}
function backToAccess(){const mr=window.MAPOMultiRoom;if(mr&&typeof mr.openHospitalDashboard==='function'){mr.openHospitalDashboard();window.scrollTo(0,0);return true;}if(typeof window.showHospitalizacionDashboard==='function'){$('studyPanel')?.removeAttribute('hidden');window.showHospitalizacionDashboard();window.scrollTo(0,0);return true;}const panel=$('studyPanel');if(!panel)return false;hideAll();panel.hidden=false;window.renderStep?.();window.scrollTo(0,0);return true;}
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,showMultiRoomHub,openRoomResult,openRoomSimulation,openRoomTables,backToAccess});
})();