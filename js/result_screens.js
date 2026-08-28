/* MAPO Analyzer — navegación de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
let openingResult=false;
function setScreen(id,visible){const el=$(id);if(!el)return;el.hidden=!visible;el.setAttribute('aria-hidden',visible?'false':'true');}
function hideScreens(){SCREEN_IDS.forEach(id=>{const el=$(id);if(el){el.hidden=true;el.setAttribute('aria-hidden','true');}});}
function top(){window.scrollTo(0,0);}
function addBackButton(el){if(!el||el.querySelector(':scope > .result-screen-navigation'))return;const bar=document.createElement('div');bar.className='result-screen-navigation actions';const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='← Volver a accesos directos';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();backToAccess();});bar.appendChild(b);el.insertBefore(bar,el.firstChild);}
function open(id,after){const el=$(id);if(!el)return false;hideScreens();setScreen(id,true);addBackButton(el);if(typeof after==='function')after(el);top();return true;}
function hasResult(){const s=typeof window.MAPOReportState==='function'?window.MAPOReportState():null;return !!(s?.result&&Object.keys(s.result).length);}
function ensureCalculated(){if(hasResult()||openingResult)return hasResult();const b=$('calculate');if(!b)return false;openingResult=true;try{b.click();}finally{openingResult=false;}return hasResult();}
function showResult(){
  if(!ensureCalculated())return open('result');
  return open('result',function(){window.MAPOResultsUI?.render?.();});
}
function showTables(){
  ensureCalculated();
  const opened=open('reportTablesPanel');
  if(!opened)return false;
  const mapo=document.querySelector('#reportTablesPanel [data-report-table="mapoResults"]');
  const mobilizations=document.querySelector('#reportTablesPanel [data-report-table="mobilizations"]');
  if(mapo)mapo.checked=true;
  if(mobilizations)mobilizations.checked=true;
  window.MAPOReportTables?.render?.();
  return true;
}
function showSimulation(){return open('mapoSimulation',function(){try{window.MAPOSimulation?.open?.();}catch(_){}});}
function backToAccess(){const mr=window.MAPOMultiRoom;if(mr&&typeof mr.openHospitalDashboard==='function'){mr.openHospitalDashboard();top();return true;}if(typeof window.showHospitalizacionDashboard==='function'){$('studyPanel')?.removeAttribute('hidden');window.showHospitalizacionDashboard();top();return true;}hideScreens();const p=$('studyPanel');if(!p)return false;p.hidden=false;window.renderStep?.();top();return true;}
function bindLegacy(){document.addEventListener('click',function(e){const legacy=e.target.closest('#openMapoSimulation,#openReportTables,#createReportTables');if(!legacy)return;e.preventDefault();e.stopImmediatePropagation();legacy.id==='openMapoSimulation'?showSimulation():showTables();},true);}
function init(){bindLegacy();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,backToAccess});
})();