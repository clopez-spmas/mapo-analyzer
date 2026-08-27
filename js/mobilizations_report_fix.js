/* MAPO Analyzer — compatibilidad histórica.
   La tabla de movilizaciones se genera ahora exclusivamente en mapo_report_tables.js.
   Este archivo no registra eventos ni modifica el DOM para evitar duplicidades. */
(function(){
'use strict';
window.MAPOMobilizationsReportFix={render:function(){
  if(window.MAPOReportTables&&typeof window.MAPOReportTables.render==='function')return window.MAPOReportTables.render();
}};
})();