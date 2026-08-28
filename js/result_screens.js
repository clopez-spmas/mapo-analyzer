/* MAPO Analyzer — gestor único de pantallas independientes. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
function setScreen(id,visible){const el=$(id);if(!el)return;el.hidden=!visible;el.setAttribute('aria-hidden',visible?'false':'true');}
function hideScreens(){SCREEN_IDS.forEach(id=>setScreen(id,false));}
function top(){window.scrollTo({top:0,behavior:'auto'});}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.onclick=e=>{e.preventDefault();e.stopPropagation();backToAccess();};bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function open(id,after){const el=$(id);if(!el)return false;hideScreens();setScreen(id,true);addBackButton(el);if(typeof after==='function')after(el);top();return true;}
function showResult(){return open('result',el=>{if(typeof window.MAPOResultsUI?.render==='function')window.MAPOResultsUI.render();el.hidden=false;});}
function showTables(){return open('reportTablesPanel');}
function showSimulation(){return open('mapoSimulation',()=>{try{window.MAPOSimulation?.open?.();}catch(_){}});}
function backToAccess(){
  const mr=window.MAPOMultiRoom;
  if(mr&&typeof mr.openHospitalDashboard==='function'){mr.openHospitalDashboard();top();return true;}
  if(typeof window.showHospitalizacionDashboard==='function'){$('studyPanel')?.removeAttribute('hidden');window.showHospitalizacionDashboard();top();return true;}
  hideScreens();const p=$('studyPanel');if(!p)return false;p.hidden=false;window.renderStep?.();top();return true;
}
function bind(){document.addEventListener('click',e=>{const shortcut=e.target.closest('[data-result-screen]');if(shortcut){e.preventDefault();e.stopImmediatePropagation();const k=shortcut.dataset.resultScreen;if(k==='result')showResult();else if(k==='tables')showTables();else if(k==='simulation')showSimulation();return;}const legacy=e.target.closest('#openMapoSimulation,#openReportTables,#createReportTables');if(legacy){e.preventDefault();e.stopImmediatePropagation();legacy.id==='openMapoSimulation'?showSimulation():showTables();}},true);}
function init(){bind();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,backToAccess});
})();