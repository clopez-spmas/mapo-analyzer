/* Puente de datos de movilizaciones para los factores FS/FA.
   Las movilizaciones se almacenan en formData.mobilizations.entries,
   mientras que el calculador histórico esperaba formData.tasks. */
(function(){
  const original=window.calculateHospitalizacionFactors;
  if(typeof original!=='function') return;

  window.calculateHospitalizacionFactors=function(d){
    const copy=Object.assign({},d);
    const mob=d && d.mobilizations;
    if(mob && mob.entries){
      let tm=0,ta=0,pm=0,pa=0;
      Object.values(mob.entries).forEach(e=>{
        ['manualTotal','manualPartial','aidedTotal','aidedPartial'].forEach(k=>{
          const values=Array.isArray(e[k])?e[k]:[0,0,0];
          const total=values.reduce((s,v)=>s+Number(v||0),0);
          if(k==='manualTotal') tm+=total;
          else if(k==='aidedTotal') ta+=total;
          else if(k==='manualPartial') pm+=total;
          else pa+=total;
        });
      });
      /* El cálculo existente identifica las tareas por ID oficial.
         Para FS/FA no importa el nombre de la tarea, sino el volumen
         total y la distribución total/parcial, por lo que se concentra
         todo el registro en una tarea oficial neutra. */
      copy.tasks={head_bed:{summary:{tm,ta,pm,pa}}};
    }
    const result=original(copy);
    const mobTotals=mob&&mob.entries?Object.values(mob.entries).reduce((a,e)=>{
      a.st+=(e.manualTotal||[]).reduce((s,v)=>s+Number(v||0),0)+(e.manualPartial||[]).reduce((s,v)=>s+Number(v||0),0)+(e.aidedTotal||[]).reduce((s,v)=>s+Number(v||0),0)+(e.aidedPartial||[]).reduce((s,v)=>s+Number(v||0),0);
      a.lta+=(e.aidedTotal||[]).reduce((s,v)=>s+Number(v||0),0);
      a.sp+=(e.manualPartial||[]).reduce((s,v)=>s+Number(v||0),0)+(e.aidedPartial||[]).reduce((s,v)=>s+Number(v||0),0);
      a.lpa+=(e.aidedPartial||[]).reduce((s,v)=>s+Number(v||0),0);
      return a;
    },{st:0,lta:0,sp:0,lpa:0}):null;
    if(mobTotals){
      result.taskTotals={st:mobTotals.st,lta:mobTotals.lta,sp:mobTotals.sp,lpa:mobTotals.lpa,stp:mobTotals.st,pLTA:mobTotals.st?100*mobTotals.lta/mobTotals.st:0,pLPA:mobTotals.sp?100*mobTotals.lpa/mobTotals.sp:0};
      result.details=result.details||{};
      result.details.st=mobTotals.st;
      result.details.lta=mobTotals.lta;
      result.details.sp=mobTotals.sp;
      result.details.lpa=mobTotals.lpa;
    }
    return result;
  };
})();
