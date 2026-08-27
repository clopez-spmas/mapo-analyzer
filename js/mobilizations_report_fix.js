/* MAPO Analyzer — adaptadores de solo lectura para informes.
   No modifica fórmulas ni el estado de cálculo. Convierte la estructura que
   utiliza la pantalla actual de movilizaciones (tasks/customTasks) a la
   estructura de lectura que utiliza el generador de tablas. */
(function(){
'use strict';
function makeMobilizationView(form){
 const tasks=form.tasks||{},customTasks=Array.isArray(form.customTasks)?form.customTasks:[];
 const entries={};
 Object.keys(tasks).forEach(id=>{
   const shifts=tasks[id]||{};
   entries[id]={manualTotal:[0,0,0],aidedTotal:[0,0,0],manualPartial:[0,0,0],aidedPartial:[0,0,0]};
   for(let i=0;i<3;i++){const r=shifts[i]||{};entries[id].manualTotal[i]=Number(r.tm||0);entries[id].aidedTotal[i]=Number(r.ta||0);entries[id].manualPartial[i]=Number(r.pm||0);entries[id].aidedPartial[i]=Number(r.pa||0);}
 });
 const custom=[];
 customTasks.forEach((x,i)=>{
   const id=x.id||`custom_report_${i}`;
   custom.push({id,name:x.name||'',source:'Personalizada'});
   entries[id]={manualTotal:[Number(x.tm||0),0,0],aidedTotal:[Number(x.ta||0),0,0],manualPartial:[Number(x.pm||0),0,0],aidedPartial:[Number(x.pa||0),0,0]};
 });
 return {entries,custom};
}
function install(){
 if(typeof window.MAPOReportState!=='function')return false;
 if(window.MAPOReportState.__mobilizationAdapter)return true;
 const originalState=window.MAPOReportState;
 const wrappedState=function(){
   const state=originalState.apply(this,arguments)||{form:{},result:{}};
   const form=state.form||{};
   if((!form.mobilizations||!form.mobilizations.entries||!Object.keys(form.mobilizations.entries).length) && form.tasks){
     state.form=Object.assign({},form,{mobilizations:makeMobilizationView(form)});
   }
   return state;
 };
 Object.defineProperty(wrappedState,'__mobilizationAdapter',{value:true});
 window.MAPOReportState=wrappedState;
 return true;
}
function installScheduleSnapshot(){
 const api=window.WorkersScheduleV3;
 if(!api||typeof api.calculate!=='function'||typeof window.saveWorkerScheduleV3!=='function')return false;
 if(api.__reportSnapshotBridge)return true;
 const originalCalculate=api.calculate,originalSave=window.saveWorkerScheduleV3;
 window.saveWorkerScheduleV3=function(){
   const result=originalSave.apply(this,arguments);
   window.formData=window.formData||{};window.formData.workerSchedule=window.formData.workerSchedule||{};window.formData.workerSchedule.reportSnapshot=result;
   return result;
 };
 api.calculate=function(){return window.formData?.workerSchedule?.reportSnapshot||originalCalculate.apply(this,arguments);};
 Object.defineProperty(api,'__reportSnapshotBridge',{value:true,enumerable:false});
 return true;
}
function installAll(){install();installScheduleSnapshot();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installAll);else installAll();
window.MAPOMobilizationsReportFix=Object.freeze({install,installScheduleSnapshot,installAll});
})();
