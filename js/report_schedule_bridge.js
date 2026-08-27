/* MAPO Analyzer — puente de datos de informe.
   No calcula horarios. Conserva el último resultado ya calculado para que
   el generador de tablas pueda leerlo sin volver a ejecutar el motor. */
(function(){
'use strict';
function install(){
  const api=window.WorkersScheduleV3;
  if(!api||typeof api.calculate!=='function'||typeof window.saveWorkerScheduleV3!=='function')return false;
  if(api.__mapoReportBridgeInstalled)return true;
  const originalCalculate=api.calculate;
  const originalSave=window.saveWorkerScheduleV3;
  const wrappedSave=function(){
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
  Object.defineProperty(api,'__mapoReportBridgeInstalled',{value:true,enumerable:false});
  window.saveWorkerScheduleV3=wrappedSave;
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.MAPOReportScheduleBridge={install};
})();
