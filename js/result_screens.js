/* MAPO Analyzer — navegación de pantallas de resultado.
   Responsabilidad única: mostrar/ocultar pantallas.
   NO genera tablas, NO calcula resultados y NO intercepta acciones de otros módulos. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function ensureScreens(){
 const main=document.querySelector('main.container'),result=$('result');
 if(!main||!result)return null;
 let rs=$('mapoResultScreen');
 if(!rs){rs=document.createElement('section');rs.id='mapoResultScreen';rs.className='result-screen';rs.hidden=true;main.appendChild(rs);}
 let ts=$('reportTablesScreen');
 if(!ts){ts=document.createElement('section');ts.id='reportTablesScreen';ts.className='result-screen';ts.hidden=true;main.appendChild(ts);}
 if(result.parentElement!==rs)rs.appendChild(result);
 const panel=$('reportTablesPanel');
 if(panel&&panel.parentElement!==ts)ts.appendChild(panel);
 return {rs,ts};
}
function hideWork(){['studyPanel','moduleHub','roomSetup','studySelection','globalResults','mapoSimulation','templateAdmin'].forEach(id=>{const e=$(id);if(e)e.hidden=true;});}
function showResult(){const s=ensureScreens();if(!s)return;hideWork();s.ts.hidden=true;s.rs.hidden=false;const r=$('result');r.hidden=false;if(window.MAPOResultsUI?.render)window.MAPOResultsUI.render();}
function showTables(){const s=ensureScreens();if(!s)return;hideWork();s.rs.hidden=true;s.ts.hidden=false;const p=$('reportTablesPanel');if(p)p.hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
function showStudy(){const s=ensureScreens();if(!s)return;s.rs.hidden=true;s.ts.hidden=true;const p=$('studyPanel');if(p)p.hidden=false;}
function addNav(){const s=ensureScreens();if(!s)return;
 if(!document.getElementById('resultScreenActions')){const a=document.createElement('div');a.id='resultScreenActions';a.className='actions result-screen-actions';a.innerHTML='<button type="button" id="backToStudyFromResult" class="secondary">Volver a la evaluación</button>';s.rs.appendChild(a);a.querySelector('#backToStudyFromResult').onclick=showStudy;}
 if(!document.getElementById('tablesScreenActions')){const a=document.createElement('div');a.id='tablesScreenActions';a.className='actions result-screen-actions';a.innerHTML='<button type="button" id="backToResultFromTables" class="secondary">Volver al resultado MAPO</button><button type="button" id="backToStudyFromTables" class="secondary">Volver a la evaluación</button>';s.ts.appendChild(a);a.querySelector('#backToResultFromTables').onclick=showResult;a.querySelector('#backToStudyFromTables').onclick=showStudy;}
}
function init(){ensureScreens();addNav();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens={showResult,showTables,showStudy};
})();