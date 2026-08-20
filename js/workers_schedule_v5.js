/* MAPO Hospitalización — corrección de contribución de horarios parciales */
(function(){
  'use strict';
  const oldRender=window.renderWorkerScheduleV3;
  const oldSave=window.saveWorkerScheduleV3;
  const DAYS={weekdays:5,weekend:2,longshort:7,custom:r=>Array.isArray(r.daysWorked?.selected)?r.daysWorked.selected.length:0};
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m;};
  const duration=(a,b)=>{let x=mins(a),y=mins(b);if(y<=x)y+=1440;return y-x;};
  const overlap=(a,b,c,d)=>{let s=mins(a),e=mins(b),p=mins(c),q=mins(d);if(e<=s)e+=1440;if(q<=p)q+=1440;let best=0;for(const z of [-1440,0,1440])best=Math.max(best,Math.max(0,Math.min(e,q+z)-Math.max(s,p+z)));return best;};
  const days14=r=>{const d=r.daysWorked||{};if(d.type==='longshort')return 7;if(d.type==='custom')return Math.min(7,Array.isArray(d.selected)?d.selected.length:0)*2;return (DAYS[d.type]??5)*2;};
  const periodHours=r=>duration(r.start,r.end)/60*days14(r);
  const referenceIndex=(full)=>{let best=-1;full.forEach((r,i)=>{if(best<0){best=i;return;}const h=duration(r.start,r.end),bh=duration(full[best].start,full[best].end);if(h>bh||(h===bh&&Number(r.people||0)>Number(full[best].people||0)))best=i;});return best;};
  const calculate=()=>{
    const s=window.formData?.workerSchedule||{};
    const full=(s.full||[]).filter(r=>r.start&&r.end);
    const partial=(s.partial||[]).filter(r=>r.start&&r.end&&Number(r.people||0)>0);
    if(!full.length)return {A:0,D:0,OP:0,rows:[],reference:-1};
    const ref=referenceIndex(full), referenceWorker=full[ref];
    const A=full.reduce((sum,r)=>sum+Number(r.people||0),0);
    let D=0;
    const partialContrib=partial.map(r=>{
      const p=Number(r.people||0);
      const ph=periodHours(r);
      const rh=periodHours(referenceWorker);
      const contribution=rh>0?p*ph/rh:0;
      D+=contribution;
      return {...r,contribution};
    });
    const shifts=[['Mañana','morning'],['Tarde','afternoon'],['Noche','night']];
    const rows=shifts.map(([name,key])=>{
      const sh=s.shifts?.[key]||{};
      const fullOP=full.reduce((sum,r)=>{
        const h=duration(r.start,r.end)/60;
        return sum+(h?Number(r.people||0)*overlap(r.start,r.end,sh.start,sh.end)/60/h:0);
      },0);
      const partialOP=partialContrib.reduce((sum,r)=>{
        const totalMinutes=duration(r.start,r.end);
        const ov=overlap(r.start,r.end,sh.start,sh.end);
        return sum+(totalMinutes? r.contribution*ov/totalMinutes:0);
      },0);
      const fullPresent=fullOP;
      const partialPresent=partialContrib.reduce((sum,r)=>{
        const total=duration(r.start,r.end),ov=overlap(r.start,r.end,sh.start,sh.end);
        return sum+(total?Number(r.people||0)*ov/total:0);
      },0);
      return {name,key,start:sh.start,end:sh.end,fullPresent,partialPresent,totalPresent:fullPresent+partialPresent,op:fullOP+partialOP};
    });
    return {A,D,OP:A+D,rows,reference:ref,referenceWorker,partialContrib};
  };
  const patch=()=>{
    const box=document.getElementById('workerV3Results');
    if(!box)return;
    try{
      const r=calculate();
      const table=box.querySelector('table');
      if(!table)return;
      const body=table.querySelector('tbody');
      if(!body)return;
      [...body.rows].forEach((tr,i)=>{
        const row=r.rows[i];if(!row)return;
        const cells=tr.cells;
        if(cells[3])cells[3].textContent=row.fullPresent.toFixed(3);
        if(cells[4])cells[4].textContent=row.partialPresent.toFixed(3);
        if(cells[5])cells[5].textContent=row.totalPresent.toFixed(3);
        if(cells[6])cells[6].textContent=row.op.toFixed(3);
      });
      const p=box.querySelector('p');
      if(p)p.innerHTML='<strong>A:</strong> '+r.A.toFixed(3)+' · <strong>D:</strong> '+r.D.toFixed(3)+' · <strong>OP:</strong> '+r.OP.toFixed(3);
      window.formData.op=r.OP;
      window.formData.opByShift={};window.formData.presenceByShift={};
      r.rows.forEach(row=>{window.formData.opByShift[row.key]=row.op;window.formData.presenceByShift[row.key]=row.totalPresent;});
    }catch(e){/* El motor original mantiene la validación y muestra el error. */}
  };
  window.renderWorkerScheduleV3=function(){
    if(typeof oldRender==='function')oldRender();
    setTimeout(patch,0);
    const host=document.getElementById('formContainer');
    if(host&&!host.dataset.partialRatioPatch){
      host.dataset.partialRatioPatch='1';
      host.addEventListener('input',()=>setTimeout(patch,0),true);
      host.addEventListener('change',()=>setTimeout(patch,0),true);
    }
  };
  window.saveWorkerScheduleV3=function(){
    if(typeof oldSave==='function')oldSave();
    const r=calculate();
    window.formData.op=r.OP;
    window.formData.opByShift={};window.formData.presenceByShift={};
    r.rows.forEach(row=>{window.formData.opByShift[row.key]=row.op;window.formData.presenceByShift[row.key]=row.totalPresent;});
    return r;
  };
  window.mapoPartialRatioV5={calculate,patch};
})();
