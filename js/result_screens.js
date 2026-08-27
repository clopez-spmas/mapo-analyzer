/* MAPO Analyzer — navegación de pantallas de resultados. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const IDS=['studyPanel','result','globalResults','mapoSimulation','reportTablesPanel','templateAdmin'];
function ensureTablesPanel(){const p=$('reportTablesPanel'),main=document.querySelector('main.container');if(p&&main&&p.parentElement!==main)main.appendChild(p);return p;}
function setVisible(el,visible){if(!el)return;el.hidden=!visible;el.setAttribute('aria-hidden',visible?'false':'true');el.style.display=visible?'block':'none';}
function hideAll(){const p=ensureTablesPanel();IDS.forEach(id=>setVisible($(id),false));if(p)p.classList.add('result-independent-screen');}
function top(){window.scrollTo({top:0,behavior:'smooth'});}
function show(id,after){hideAll();const e=$(id);if(!e)return;e.classList.add('result-independent-screen');setVisible(e,true);if(after)after(e);top();}
function showResult(){show('result');}
function showTables(){show('reportTablesPanel');}
function showSimulation(){
  hideAll();
  const e=$('mapoSimulation');
  if(!e)return;
  e.classList.add('result-independent-screen');
  setVisible(e,true);
  try{
    if(window.MAPOSimulation&&typeof window.MAPOSimulation.open==='function'){
      window.MAPOSimulation.open();
    }else if(typeof window.renderMapoSimulation==='function'){
      window.renderMapoSimulation();
    }
  }catch(err){
    e.innerHTML='<div class="error">No se pudo abrir la simulación: '+String(err.message||err)+'</div>';
  }
  top();
}
function showStudy(){hideAll();const e=$('studyPanel');if(e){e.classList.remove('result-independent-screen');setVisible(e,true);}top();}
function bind(){document.addEventListener('click',e=>{const shortcut=e.target.closest('[data-result-screen]');if(shortcut){e.preventDefault();e.stopImmediatePropagation();const k=shortcut.dataset.resultScreen;if(k==='result')showResult();else if(k==='tables')showTables();else if(k==='simulation')showSimulation();return;}const b=e.target.closest('#openMapoSimulation,#openReportTables,#createReportTables');if(b){e.preventDefault();e.stopImmediatePropagation();if(b.id==='openMapoSimulation')showSimulation();else showTables();}},true);}
function init(){ensureTablesPanel();bind();const main=document.querySelector('main.container');if(main)new MutationObserver(ensureTablesPanel).observe(main,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showSimulation,showStudy});
})();