/* MAPO Analyzer — navegación única de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
function hideAll(){SCREEN_IDS.forEach(id=>{const el=$(id);if(el){el.hidden=true;el.setAttribute('aria-hidden','true');el.style.removeProperty('display');}});}
function reveal(el){let p=el;while(p&&p!==document.body){p.hidden=false;p.removeAttribute('aria-hidden');p.style.removeProperty('display');p=p.parentElement;}el.hidden=false;el.removeAttribute('aria-hidden');}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();backToAccess();});bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function openScreen(id,after){const el=$(id);if(!el)return false;hideAll();reveal(el);addBackButton(el);if(typeof after==='function')after(el);reveal(el);window.scrollTo(0,0);return true;}
function showResult(){return openScreen('result',()=>window.MAPOResultsUI?.render?.());}
function ensureTables(){if(document.getElementById('reportTablesPanel'))return document.getElementById('reportTablesPanel');if(typeof window.MAPOReportTables?.ensurePanel==='function')return window.MAPOReportTables.ensurePanel();return null;}
function showTables(){const panel=ensureTables();if(!panel)return false;const opened=openScreen('reportTablesPanel');if(opened){window.MAPOReportTables?.render?.();if(!panel.dataset.defaultSelectionInitialized){panel.querySelectorAll('input[type="checkbox"]').forEach(cb=>{cb.checked=false;});panel.dataset.defaultSelectionInitialized='1';}}return opened;}
function showSimulation(){return openScreen('mapoSimulation',()=>window.MAPOSimulation?.open?.());}
function backToAccess(){const mr=window.MAPOMultiRoom;if(mr&&typeof mr.openHospitalDashboard==='function'){mr.openHospitalDashboard();window.scrollTo(0,0);return true;}if(typeof window.showHospitalizacionDashboard==='function'){$('studyPanel')?.removeAttribute('hidden');window.showHospitalizacionDashboard();window.scrollTo(0,0);return true;}const panel=$('studyPanel');if(!panel)return false;hideAll();panel.hidden=false;window.renderStep?.();window.scrollTo(0,0);return true;}
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,backToAccess});
})();