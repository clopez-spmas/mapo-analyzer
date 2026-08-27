/* MAPO Analyzer — puente histórico de datos de horarios para informes.
   No cambia ninguna fórmula. Guarda el último resultado que YA calculó
   WorkersScheduleV3 y hace que los informes reutilicen ese resultado.
   No registra eventos de tablas ni observa el DOM. */
(function(){
'use strict';
function install(){
 const api=window.WorkersScheduleV3;
 if(!api||typeof api.calculate!=='function'||typeof window.saveWorkerScheduleV3!=='function')return false;
 if(api.__reportSnapshotBridge)return true;
 const originalCalculate=api.calculate;
 const originalSave=window.saveWorkerScheduleV3;
 window.saveWorkerScheduleV3=function(){
   const result=originalSave.apply(this,arguments);
   window.formData=window.formData||{};
   window.formData.workerSchedule=window.formData.workerSchedule||{};
   window.formData.workerSchedule.reportSnapshot=result;
   return result;
 };
 api.calculate=function(){
   const snapshot=window.formData?.workerSchedule?.reportSnapshot;
   return snapshot||originalCalculate.apply(this,arguments);
 };
 Object.defineProperty(api,'__reportSnapshotBridge',{value:true,enumerable:false});
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.MAPOMobilizationsReportFix=Object.freeze({install});
})();
