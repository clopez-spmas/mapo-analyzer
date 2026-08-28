/* MAPO Analyzer — adaptadores de solo lectura para informes.
   Este módulo adapta el modelo actual de movilizaciones al modelo de lectura
   utilizado por las tablas de informe. No modifica fórmulas ni el estado de cálculo. */
(function(){
'use strict';
function makeMobilizationView(form){
 const source=form.mobilizations||{},entries=source.entries&&typeof source.entries==='object'?source.entries:{};
 const tasks={};
 Object.keys(entries).forEach(id=>{
   const e=entries[id]||{},tm=e.manualTotal||[],ta=e.aidedTotal||[],pm=e.manualPartial||[],pa=e.aidedPartial||{};
   tasks[id]={};
   for(let i=0;i<3;i++)tasks[id][i]={tm:Number(tm[i]||0),ta:Number(ta[i]||0),pm:Number(pm[i]||0),pa:Number(pa[i]||0)};
 });
 const custom=Array.isArray(source.custom)?source.custom:[];
 const customTasks=custom.map((x,i)=>{
   const id=x.id||`custom_${i}`,e=entries[id]||{};
   return {id,name:x.name||'',tm:Number((e.manualTotal||[])[0]||0),ta:Number((e.aidedTotal||[])[0]||0),pm:Number((e.manualPartial||[])[0]||0),pa:Number((e.aidedPartial||[])[0]||0)};
 });
 return {tasks,customTasks,mobilizations:source};
}
function install(){
 if(typeof window.MAPOReportState!=='function')return false;
 if(window.MAPOReportState.__mobilizationAdapter)return true;
 const originalState=window.MAPOReportState;
 const wrappedState=function(){
   const state=originalState.apply(this,arguments)||{form:{},result:{}};
   const form=state.form||{};
   const view=makeMobilizationView(form);
   if(Object.keys(view.tasks).length||view.customTasks.length){
     state.form=Object.assign({},form,{tasks:view.tasks,customTasks:view.customTasks,mobilizations:view.mobilizations});
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