/* MAPO Analyzer — compatibilidad de navegación histórica.
   La navegación real pertenece a app.js / navigation_controller.js / module_navigator.js.
   Este módulo no mueve nodos ni crea pantallas. */
(function(){
'use strict';
function showResult(){const e=document.getElementById('result');if(e)e.hidden=false;}
function showTables(){const e=document.getElementById('reportTablesPanel');if(e)e.hidden=false;}
function showStudy(){const e=document.getElementById('studyPanel');if(e)e.hidden=false;}
function init(){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOResultScreens=Object.freeze({showResult,showTables,showStudy});
})();
