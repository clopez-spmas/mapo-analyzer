/* MAPO Analyzer — compatibilidad de navegación histórica.
   La navegación real pertenece a app.js / navigation_controller.js / module_navigator.js.
   Este módulo no mueve nodos ni crea pantallas. Carga de forma aislada el adaptador de campos FS/FA. */
(function(){
'use strict';
function showResult(){const e=document.getElementById('result');if(e)e.hidden=false;}
function showTables(){const e=document.getElementById('reportTablesPanel');if(e)e.hidden=false;}
function showStudy(){const e=document.getElementById('studyPanel');if(e)e.hidden=false;}
function loadFactorReportAdapter(){
 if(window.MAPOFactorReportFields||document.querySelector('script[data-mapo-factor-report-fields]'))return;
 const s=document.createElement('script');s.src='js/mapo_factor_report_fields.js';s.async=false;s.dataset.mapoFactorReportFields='1';document.head.appendChild(s);
}
function init(){loadFactorReportAdapter();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showStudy});
})();
