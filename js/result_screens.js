/* MAPO Analyzer — navegación de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SCREEN_IDS=['studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
function moveReportPanel(){const panel=$('reportTablesPanel'),main=document.querySelector('main.container');if(panel&&main&&panel.parentElement!==main)main.appendChild(panel);}
function hideAll(){moveReportPanel();SCREEN_IDS.forEach(id=>{const e=$(id);if(e)e.hidden=true;});}
function top(){window.scrollTo({top:0,behavior:'smooth'});}
function showResult(){hideAll();const e=$('result');if(e)e.hidden=false;top();}
function showTables(){hideAll();const e=$('reportTablesPanel');if(e){e.hidden=false;top();}}
function showSimulation(){hideAll();const e=$('mapoSimulation');if(e){e.hidden=false;top();if(typeof window.renderMapoSimulation==='function')window.renderMapoSimulation();}}
function showStudy(){hideAll();const e=$('studyPanel');if(e)e.hidden=false;top();}
function bind(){document.addEventListener('click',e=>{const s=e.target.closest('[data-result-screen]');if(s){e.preventDefault();e.stopImmediatePropagation();const k=s.dataset.resultScreen;if(k==='result')showResult();else if(k==='tables')showTables();else if(k==='simulation')showSimulation();return;}const b=e.target.closest('#openMapoSimulation,#openReportTables,#createReportTables');if(b){e.preventDefault();e.stopImmediatePropagation();if(b.id==='openMapoSimulation')showSimulation();else showTables();}},true);}
function init(){moveReportPanel();bind();const main=document.querySelector('main.container');if(main)new MutationObserver(moveReportPanel).observe(main,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,showStudy});
})();