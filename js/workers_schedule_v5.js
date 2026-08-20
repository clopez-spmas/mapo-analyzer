/* MAPO Hospitalización — motor autoritativo de horarios parciales v6 */
(function(){
'use strict';
const oldRender=window.renderWorkerScheduleV3;
const oldSave=window.saveWorkerScheduleV3;
const dayCount=r=>{const d=r.daysWorked||{};if(d.type==='longshort')return 7;if(d.type==='custom')return Math.min(7,Array.isArray(d.selected)?d.selected.length:0);if(d.type==='weekend')return 2;return 5;};
const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m;};
const duration=(a,b)=>{let x=mins(a),y=mins(b);if(y<=x)y+=1440;return y-x;};
const overlap=(a,b,c,d)=>{let s=mins(a),e=mins(b),p=mins(c),q=mins(d);if(e<=s)e+=1440;if(q<=p)q+=1440;let best=0;for(const z of [-1440,0,1440])best=Math.max(best,Math.max(0,Math.min(e,q+z)-Math.max(s,p+z)));return best;};
const periodDays=r=>dayCount(r)*2;
const periodHours=r=>duration(r.start,r.end)/60*periodDays(r);
const referenceIndex=full=>{let best=-1;full.forEach((r,i)=>{if(best<0){best=i;return;}const h=duration(r.start,r.end),bh=duration(full[best].start,full[best].end);if(h>bh||(h===bh&&Number(r.people||0)>Number(full[best].people||0)))best=i;});return best;};
function calculate(){
 const s=window.formData?.workerSchedule||{};
 const full=(s.full||[]).filter(r=>r.start&&r.end);
 const partial=(s.partial||[]).filter(r=>r.start&&r.end&&Number(r.people||0)>0);
 if(!full.length)return {A:0,D:0,OP:0,rows:[],reference:-1};
 const ref=referenceIndex(full),rw=full[ref],rh=periodHours(rw);
 const A=full.reduce((sum,r)=>sum+Number(r.people||0)*dayCount(r)/7,0);
 const partialContrib=partial.map(r=>({r,contribution:rh>0?Number(r.people||0)*periodHours(r)/rh:0}));
 const D=partialContrib.reduce((sum,x)=>sum+x.contribution,0);
 const rows=[['Mañana','morning'],['Tarde','afternoon'],['Noche','night']].map(([name,key])=>{
  const sh=s.shifts?.[key]||{};
  const fullOP=full.reduce((sum,r)=>{const h=duration(r.start,r.end);return sum+(h?Number(r.people||0)*dayCount(r)/7*overlap(r.start,r.end,sh.start,sh.end)/h:0);},0);
  const partialOP=partialContrib.reduce((sum,x)=>{const h=duration(x.r.start,x.r.end),ov=overlap(x.r.start,x.r.end,sh.start,sh.end);return sum+(h?x.contribution*ov/h:0);},0);
  const partialPresent=partialContrib.reduce((sum,x)=>{const h=duration(x.r.start,x.r.end),ov=overlap(x.r.start,x.r.end,sh.start,sh.end);return sum+(h?Number(x.r.people||0)*ov/h:0);},0);
  return {name,key,start:sh.start,end:sh.end,fullPresent:fullOP,partialPresent,totalPresent:fullOP+partialPresent,op:fullOP+partialOP};
 });
 return {A,D,OP:A+D,rows,reference:ref,referenceWorker:rw,partialContrib};
}
function patch(){
 const box=document.getElementById('workerV3Results');if(!box)return;
 try{const r=calculate(),table=box.querySelector('table'),body=table?.querySelector('tbody');if(!body)return;
  [...body.rows].forEach((tr,i)=>{const row=r.rows[i],c=tr.cells;if(!row)return;if(c[3])c[3].textContent=row.fullPresent.toFixed(3);if(c[4])c[4].textContent=row.partialPresent.toFixed(3);if(c[5])c[5].textContent=row.totalPresent.toFixed(3);if(c[6])c[6].textContent=row.op.toFixed(3);});
  const p=box.querySelector('p');if(p)p.innerHTML='<strong>A:</strong> '+r.A.toFixed(3)+' · <strong>D:</strong> '+r.D.toFixed(3)+' · <strong>OP:</strong> '+r.OP.toFixed(3);
  window.formData.op=r.OP;window.formData.opByShift={};window.formData.presenceByShift={};r.rows.forEach(row=>{window.formData.opByShift[row.key]=row.op;window.formData.presenceByShift[row.key]=row.totalPresent;});
 }catch(e){console.error('MAPO schedule recalculation',e);}
}
function install(){const host=document.getElementById('formContainer');if(!host)return;if(host.dataset.scheduleAuthority)return;host.dataset.scheduleAuthority='1';host.addEventListener('input',()=>requestAnimationFrame(patch),true);host.addEventListener('change',()=>requestAnimationFrame(patch),true);new MutationObserver(()=>requestAnimationFrame(patch)).observe(host,{childList:true,subtree:true});patch();}
window.renderWorkerScheduleV3=function(){if(typeof oldRender==='function')oldRender();requestAnimationFrame(()=>{install();requestAnimationFrame(patch);});};
window.saveWorkerScheduleV3=function(){if(typeof oldSave==='function')oldSave();const r=calculate();window.formData.op=r.OP;window.formData.opByShift={};window.formData.presenceByShift={};r.rows.forEach(row=>{window.formData.opByShift[row.key]=row.op;window.formData.presenceByShift[row.key]=row.totalPresent;});return r;};
window.mapoPartialRatioV6={calculate,patch,version:'2026-08-20-v6'};
})();
