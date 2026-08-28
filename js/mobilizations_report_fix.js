/* MAPO Analyzer — adaptadores de solo lectura para informes.
   Este módulo adapta los modelos de movilizaciones existentes al modelo de lectura
   utilizado por las tablas de informe. No modifica fórmulas ni el estado de cálculo. */
(function(){
'use strict';
function emptyEntry(){return{manualTotal:[0,0,0],manualPartial:[0,0,0],aidedTotal:[0,0,0],aidedPartial:[0,0,0]};}
function normalizeMobilizations(form){
 const source=form?.mobilizations;
 if(source&&source.entries&&typeof source.entries==='object')return source;
 const out={entries:{},custom:[]};
 const tasks=form?.tasks&&typeof form.tasks==='object'?form.tasks:{};
 Object.keys(tasks).forEach(id=>{
   const e=tasks[id]||{},dst=emptyEntry();
   [0,1,2].forEach(i=>{const r=e[i]||{};dst.manualTotal[i]=Number(r.tm||0);dst.aidedTotal[i]=Number(r.ta||0);dst.manualPartial[i]=Number(r.pm||0);dst.aidedPartial[i]=Number(r.pa||0);});
   out.entries[id]=dst;
 });
 const customs=Array.isArray(form?.customTasks)?form.customTasks:[];
 customs.forEach((x,i)=>{
   const id=x.id||`custom_${i}`,dst=emptyEntry();
   /* El modelo antiguo no guardaba turno para las personalizadas; se conserva
      como dato único sin inventar una asignación de turno. */
   dst.manualTotal[0]=Number(x.tm||0);dst.aidedTotal[0]=Number(x.ta||0);dst.manualPartial[0]=Number(x.pm||0);dst.aidedPartial[0]=Number(x.pa||0);
   out.custom.push({id,name:x.name||''});out.entries[id]=dst;
 });
 return out;
}
function makeMobilizationView(form){
 const mobilizations=normalizeMobilizations(form),entries=mobilizations.entries||{},tasks={};
 Object.keys(entries).forEach(id=>{
   const e=entries[id]||{},tm=e.manualTotal||[],ta=e.aidedTotal||[],pm=e.manualPartial||[],pa=e.aidedPartial||[];
   tasks[id]={};
   for(let i=0;i<3;i++)tasks[id][i]={tm:Number(tm[i]||0),ta:Number(ta[i]||0),pm:Number(pm[i]||0),pa:Number(pa[i]||0)};
 });
 const custom=Array.isArray(mobilizations.custom)?mobilizations.custom:[];
 const customTasks=custom.map((x)=>{
   const id=x.id,e=entries[id]||emptyEntry();
   return {id,name:x.name||'',tm:Number((e.manualTotal||[])[0]||0),ta:Number((e.aidedTotal||[])[0]||0),pm:Number((e.manualPartial||[])[0]||0),pa:Number((e.aidedPartial||[])[0]||0)};
 });
 return {tasks,customTasks,mobilizations};
}
function install(){
 if(typeof window.MAPOReportState!=='function')return false;
 if(window.MAPOReportState.__mobilizationAdapter)return true;
 const originalState=window.MAPOReportState;
 const wrappedState=function(){
   const state=originalState.apply(this,arguments)||{form:{},result:{}};
   const form=state.form||{},view=makeMobilizationView(form);
   state.form=Object.assign({},form,{tasks:view.tasks,customTasks:view.customTasks,mobilizations:view.mobilizations});
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