/* MAPO Analyzer — compatibilidad de navegación histórica.
   La navegación real pertenece a app.js / navigation_controller.js / module_navigator.js.
   Este módulo no mueve nodos ni crea pantallas. También activa el adaptador de campos FS/FA
   para que las tablas de informe puedan mostrar las respuestas ya guardadas. */
(function(){
'use strict';
function showResult(){const e=document.getElementById('result');if(e)e.hidden=false;}
function showTables(){const e=document.getElementById('reportTablesPanel');if(e)e.hidden=false;}
function showStudy(){const e=document.getElementById('studyPanel');if(e)e.hidden=false;}
function bindFactorReport(){
 const b=document.getElementById('generateReportTables');
 if(!b||b.dataset.factorReportBound)return;
 b.dataset.factorReportBound='1';
 b.addEventListener('click',()=>setTimeout(()=>{
   if(window.MAPOFactorReportFields){
     window.MAPOFactorReportFields.enrich('fs');
     window.MAPOFactorReportFields.enrich('fa');
   }
 },0));
}
function init(){bindFactorReport();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showStudy});
})();
