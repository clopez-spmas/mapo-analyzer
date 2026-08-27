/* MAPO Analyzer — pantallas independientes de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function hideAll(){['studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'].forEach(id=>{const e=$(id);if(e)e.hidden=true;});}
function showResult(){hideAll();const e=$('result');if(e)e.hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
function showTables(){hideAll();const e=$('reportTablesPanel');if(e)e.hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
function showSimulation(){hideAll();const e=$('mapoSimulation');if(e)e.hidden=false;window.scrollTo({top:0,behavior:'smooth'});if(typeof window.renderMapoSimulation==='function')window.renderMapoSimulation();}
function showStudy(){hideAll();const e=$('studyPanel');if(e)e.hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
function bindShortcuts(){document.addEventListener('click',e=>{const b=e.target.closest('[data-result-screen]');if(!b)return;e.preventDefault();const key=b.dataset.resultScreen;if(key==='result')showResult();else if(key==='tables')showTables();else if(key==='simulation')showSimulation();});}
function init(){bindShortcuts();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,showStudy});
})();
