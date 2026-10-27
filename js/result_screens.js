/* MAPO Analyzer — navegación única de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','multiRoomResultsHub','mapoSimulation','planningPanel','wordReportPanel','reportTablesPanel','templateAdmin'];
function hideAll(){SCREEN_IDS.forEach(id=>{const el=$(id);if(el){el.hidden=true;el.setAttribute('aria-hidden','true');el.style.removeProperty('display');}});}
function reveal(el){let p=el;while(p&&p!==document.body){p.hidden=false;p.removeAttribute('aria-hidden');p.style.removeProperty('display');p=p.parentElement;}el.hidden=false;el.removeAttribute('aria-hidden');}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();backToAccess();});bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function backToEvaluation(){
 const mr=window.MAPOMultiRoom;
 if(mr?.state?.rooms?.length){mr.restoreCurrentRoom?.();}
 const study=typeof selectedStudy!=='undefined'?selectedStudy:null;
 const steps=study&&typeof MAPO_STUDIES!=='undefined'?MAPO_STUDIES[study]?.steps:null;
 if(!steps?.length)return backToAccess();
 currentStep=steps.length-1;
 if(mr?.state?.rooms?.[mr.state.active])mr.state.rooms[mr.state.active].currentStep=currentStep;
 hideAll();reveal($('studyPanel'));
 window.renderStep?.();
 window.MAPONavigation?.bindStandard?.();
 window.scrollTo(0,0);
 return true;
}
function ensureSequenceNavigation(el,previous,next){
 if(!el)return;
 let bar=el.querySelector(':scope > .mapo-sequence-navigation');
 if(!bar){bar=document.createElement('div');bar.className='actions mapo-sequence-navigation';el.appendChild(bar);}
 bar.innerHTML='';
 for(const [label,action] of [['Anterior',previous],['Siguiente',next]]){
  if(typeof action!=='function')continue;
  const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.addEventListener('click',action);bar.appendChild(b);
 }
}
function openScreen(id,after){const el=$(id);if(!el)return false;hideAll();reveal(el);addBackButton(el);if(typeof after==='function')after(el);reveal(el);window.scrollTo(0,0);return true;}
function showMultiRoomHub(){const mr=window.MAPOMultiRoom,s=mr?.state;if(!s||!Array.isArray(s.rooms)||s.rooms.length<=1)return showResult();const hub=$('multiRoomResultsHub');if(!hub)return false;hub.innerHTML='<div class="section-heading"><div><h2>Resultados del estudio multisala</h2><p>Seleccione una sala para consultar sus resultados, simulación o tablas para Word. No se calcula un resultado global en esta fase.</p></div></div><div class="multi-room-results-list">'+s.rooms.map((r,i)=>{const name=(r.name||'Unidad '+(i+1)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const has=!!(r.lastResult&&Object.keys(r.lastResult).length);return '<div class="multi-room-result-card"><h3>Sala '+(i+1)+': '+name+'</h3><p>'+(has?'Resultado calculado.':'Pendiente de cálculo.')+'</p><div class="actions"><button type="button" data-mr-result="'+i+'" '+(has?'':'disabled')+'>Ver resultado</button><button type="button" class="secondary" data-mr-sim="'+i+'" '+(has?'':'disabled')+'>Simular mejoras</button><button type="button" class="secondary" data-mr-tables="'+i+'">Tablas para Word</button></div></div>';}).join('')+'</div><div class="actions"><button type="button" id="openGlobalMapo">Ver resultado global del hospital</button><button type="button" class="secondary" id="multiRoomResultsBack">← Volver a accesos directos</button></div>';hub.querySelectorAll('[data-mr-result]').forEach(b=>b.onclick=()=>openRoomResult(Number(b.dataset.mrResult)));hub.querySelectorAll('[data-mr-sim]').forEach(b=>b.onclick=()=>openRoomSimulation(Number(b.dataset.mrSim)));hub.querySelectorAll('[data-mr-tables]').forEach(b=>b.onclick=()=>openRoomTables(Number(b.dataset.mrTables)));hub.querySelector('#multiRoomResultsBack').onclick=backToAccess;hub.querySelector('#openGlobalMapo').onclick=showGlobalMAPO;return openScreen('multiRoomResultsHub');}
function showGlobalMAPO(){
 const panel=$('globalResults');if(!panel)return false;
 try{
  const {merged,result,rooms}=window.MAPOMultiRoom.globalMAPO();
  const fmt=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:3});
  const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
  const trs=rooms.map(room=>'<tr><td>'+escape(room.name)+'</td><td>'+fmt(room.result.mapo)+'</td><td>'+escape(room.result.nivel||'')+'</td></tr>').join('');
  panel.innerHTML='<div class="section-heading"><div><h2>Resultados globales del hospital</h2><p>Datos agregados de '+rooms.length+' salas independientes. Los factores se recalculan con el motor MAPO; no se promedian índices individuales.</p></div></div><table style="width:100%;border-collapse:collapse"><thead><tr><th>Sala</th><th>MAPO</th><th>Exposición</th></tr></thead><tbody>'+trs+'<tr><th>HOSPITAL — GLOBAL</th><th>'+fmt(result.mapo)+'</th><th>'+escape(result.nivel)+'</th></tr></tbody></table><p><strong>Pacientes NC:</strong> '+fmt(merged.nc)+' · <strong>PC:</strong> '+fmt(merged.pc)+' · <strong>OP:</strong> '+fmt(merged.op)+'</p><p><strong>FS:</strong> '+fmt(result.fs)+' · <strong>FA:</strong> '+fmt(result.fa)+' · <strong>FC:</strong> '+fmt(result.fc)+' · <strong>Famb:</strong> '+fmt(result.famb)+' · <strong>FF:</strong> '+fmt(result.ff)+'</p>';
  openScreen('globalResults');addBackButton(panel);return true;
 }catch(e){window.alert('No se puede calcular el MAPO global: '+e.message);return false;}
}
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
function showResult(){return openScreen('result',()=>{window.MAPOResultsUI?.render?.();addRoomSwitcher($('result'),showResult);ensureSequenceNavigation($('result'),backToEvaluation,showTables);const host=$('result'),actions=host?.querySelector('.section-heading .actions');if(actions&&!host.querySelector('#openReportTablesFromResult')){const b=document.createElement('button');b.type='button';b.id='openReportTablesFromResult';b.className='secondary';b.textContent='Copiar tablas para Word';b.addEventListener('click',()=>showTables());const simulation=actions.querySelector('#openMapoSimulation');if(simulation)actions.insertBefore(b,simulation);else actions.prepend(b);}});}
function ensureTables(){if(document.getElementById('reportTablesPanel'))return document.getElementById('reportTablesPanel');if(typeof window.MAPOReportTables?.ensurePanel==='function')return window.MAPOReportTables.ensurePanel();return null;}
function showTables(){const panel=ensureTables();if(!panel)return false;const opened=openScreen('reportTablesPanel');if(opened){window.MAPOReportTables?.render?.();addRoomSwitcher(panel,showTables);ensureSequenceNavigation(panel,showResult,showSimulation);if(!panel.dataset.defaultSelectionInitialized){panel.querySelectorAll('input[type="checkbox"]').forEach(cb=>{cb.checked=false;});panel.dataset.defaultSelectionInitialized='1';}}return opened;}
function showSimulation(){return openScreen('mapoSimulation',()=>{window.MAPOSimulation?.open?.();addRoomSwitcher($('mapoSimulation'),showSimulation);ensureSequenceNavigation($('mapoSimulation'),showTables,()=>window.MAPOPlanning?.open?.(false));});}
function showWord(){const panel=$('wordReportPanel');if(!panel)return false;const mr=window.MAPOMultiRoom;const studyPanel=$('studyPanel');if(mr?.state?.rooms?.length&&studyPanel&&!studyPanel.hidden)mr.syncCurrentRoom?.();const shown=openScreen('wordReportPanel',()=>{window.MAPOWordGenerator?.prepare?.();window.MAPOWordGenerator?.refreshFilename?.();addRoomSwitcher(panel,showWord);panel.querySelector(':scope > .mapo-sequence-navigation')?.remove();});return shown;}
function showPlanning(){return window.MAPOPlanning?.open?.(false);}

function backToAccess(){const mr=window.MAPOMultiRoom;if(mr&&typeof mr.openHospitalDashboard==='function'){mr.openHospitalDashboard();window.scrollTo(0,0);return true;}if(typeof window.showHospitalizacionDashboard==='function'){$('studyPanel')?.removeAttribute('hidden');window.showHospitalizacionDashboard();window.scrollTo(0,0);return true;}const panel=$('studyPanel');if(!panel)return false;hideAll();panel.hidden=false;window.renderStep?.();window.scrollTo(0,0);return true;}
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,showWord,showPlanning,showMultiRoomHub,showGlobalMAPO,openRoomResult,openRoomSimulation,openRoomTables,backToAccess});
})();