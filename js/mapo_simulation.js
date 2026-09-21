/* MAPO Analyzer — simulación de mejoras. Pantalla independiente. */
(function(){
'use strict';
let baseData=null,simulationData=null,baseResult=null,simulationChanged=false;
const BEST={fs:.5,fa:.5,fc:.75,famb:.75,ff:.75};
const LABEL={fs:'FS — Factor de elevación',fa:'FA — Factor de ayudas menores',fc:'FC — Factor de sillas de ruedas',famb:'Famb — Factor ambiente',ff:'FF — Factor formación'};
const n=v=>Number(v||0),yn=v=>v===true||v==='yes';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v??{}));
function calc(d,isBase=false){
  if(isBase&&baseResult&&typeof baseResult.mapo==='number')return{f:{fs:n(baseResult.fs),fa:n(baseResult.fa),fc:n(baseResult.fc),famb:n(baseResult.famb),ff:n(baseResult.ff),taskTotals:baseResult.taskTotals||{}},mapo:n(baseResult.mapo)};
  if(typeof window.MAPOCalculationEngine?.calculateHospitalizacionFactors!=='function')throw new Error('No está disponible el motor de cálculo MAPO.');
  const f=window.MAPOCalculationEngine.calculateHospitalizacionFactors(d);const op=n(d.op);if(!op)throw new Error('OP debe ser mayor que 0.');
  const mapo=((n(d.nc)/op*n(f.fs))+(n(d.pc)/op*n(f.fa)))*n(f.fc)*n(f.famb)*n(f.ff);return{f,mapo};
}
function check(key,label,value){return `<label class="sim-option"><input type="checkbox" data-sim-key="${esc(key)}" ${value?'checked':''}><span>${label}</span></label>`;}
const HELP_OPTIONS=[0,25,50,75,90,100];
function taskCatalog(){return[...(window.HOSPITALIZATION_MOBILIZATIONS||[]),...(window.MAPO_TASKS||[]),...(window.EXTRA_MAPO_TASKS||[])];}
function taskLabel(id){const x=taskCatalog().find(v=>String(v.id)===String(id));if(x)return x.name||x.label;const custom=simulationData?.mobilizations?.custom||simulationData?.customTasks||[];if(String(id).startsWith('custom_')){const direct=custom.find(v=>String(v.id)===String(id));if(direct?.name)return direct.name;const idx=Number(String(id).split('_').pop());if(Number.isInteger(idx)&&custom[idx]?.name)return custom[idx].name;}return String(id);}
function taskEntries(d){if(typeof window.MAPOCalculationEngine?.taskEntries==='function')return window.MAPOCalculationEngine.taskEntries(d);return{};}
function mobilizationGroupStats(d){
  const shifts=['Mañana','Tarde','Noche'];
  const entries=d?.mobilizations?.entries&&typeof d.mobilizations.entries==='object'?d.mobilizations.entries:(d?.tasks&&typeof d.tasks==='object'?d.tasks:{});
  const sums=shifts.map(()=>({totalManual:0,totalAided:0,partialManual:0,partialAided:0}));
  Object.values(entries).forEach(e=>{
    const tm=Array.isArray(e?.manualTotal)?e.manualTotal:e?.tm!==undefined?[e.tm]:[],ta=Array.isArray(e?.aidedTotal)?e.aidedTotal:e?.ta!==undefined?[e.ta]:[],pm=Array.isArray(e?.manualPartial)?e.manualPartial:e?.pm!==undefined?[e.pm]:[],pa=Array.isArray(e?.aidedPartial)?e.aidedPartial:e?.pa!==undefined?[e.pa]:[];
    for(let i=0;i<3;i++){sums[i].totalManual+=n(tm[i]);sums[i].totalAided+=n(ta[i]);sums[i].partialManual+=n(pm[i]);sums[i].partialAided+=n(pa[i]);}
  }); return sums;
}
function groupKey(i,k){return i+'|'+k;}
function groupRatio(stats,i,k,ratios){
  const s=stats[i]||{},total=k==='total'?n(s.totalManual)+n(s.totalAided):n(s.partialManual)+n(s.partialAided); if(!total)return 0;
  const aided=k==='total'?n(s.totalAided):n(s.partialAided),key=groupKey(i,k);
  return ratios&&ratios[key]!==undefined?Math.max(0,Math.min(100,n(ratios[key]))):100*aided/total;
}
function taskRows(d,k){
  const shifts=['Mañana','Tarde','Noche'],groups=[],stats=mobilizationGroupStats(d),ratios=d?.simulationMobilizationGroups||{};
  shifts.forEach((shift,i)=>{
    const s=stats[i],total=n(s.totalManual)+n(s.totalAided),partial=n(s.partialManual)+n(s.partialAided);
    const add=(kind,label,role)=>{
      const aidedPct=groupRatio(stats,i,kind,ratios),pct=role==='aided'?aidedPct:100-aidedPct;
      groups.push('<div class="sim-task-row"><div><strong>'+esc(shift)+' — '+esc(label)+'</strong><label class="sim-number"><input type="number" min="0" max="100" step="0.1" value="'+pct.toFixed(1)+'" data-sim-mob="'+i+'" data-sim-mob-kind="'+kind+'" data-sim-mob-role="'+role+'" aria-label="'+esc(shift+' '+label+' porcentaje')+'"> %</label></div></div>');
    };
    if(k==='fs' && total) { add('total','Levantamiento total con ayuda','aided'); add('total','Levantamiento total sin ayuda','manual'); }
    if(k==='fa' && partial) { add('partial','Levantamiento parcial con ayuda','aided'); add('partial','Levantamiento parcial sin ayuda','manual'); }
  }); return groups.join('');
}
function buildTaskOverrides(d){
  const stats=mobilizationGroupStats(d),entries=d?.mobilizations?.entries&&typeof d.mobilizations.entries==='object'?d.mobilizations.entries:(d?.tasks&&typeof d.tasks==='object'?d.tasks:{}),ratios=d?.simulationMobilizationGroups||{},out={};
  Object.entries(entries).forEach(([id,e])=>{
    const tm=Array.isArray(e?.manualTotal)?e.manualTotal:e?.tm!==undefined?[e.tm]:[],ta=Array.isArray(e?.aidedTotal)?e.aidedTotal:e?.ta!==undefined?[e.ta]:[],pm=Array.isArray(e?.manualPartial)?e.manualPartial:e?.pm!==undefined?[e.pm]:[],pa=Array.isArray(e?.aidedPartial)?e.aidedPartial:e?.pa!==undefined?[e.pa]:[];
    let total=0,totalAided=0,partial=0,partialAided=0;
    for(let i=0;i<3;i++){const t=n(tm[i])+n(ta[i]),p=n(pm[i])+n(pa[i]);if(t){total+=t;totalAided+=t*groupRatio(stats,i,'total',ratios)/100;}if(p){partial+=p;partialAided+=p*groupRatio(stats,i,'partial',ratios)/100;}}
    out[id]={total:total?100*totalAided/total:undefined,partial:partial?100*partialAided/partial:undefined};
  }); return out;
}
const regFields={bath:[['space','Espacio suficiente para usar ayudas'],['door','Puerta de al menos 85 cm'],['obstacles','Sin obstáculos fijos']],wc:[['space','Espacio suficiente para silla de ruedas'],['height','Altura del WC adecuada'],['bar','Barra lateral adecuada'],['door','Puerta de al menos 85 cm'],['lateral','Espacio lateral de al menos 80 cm']],room:[['between','Espacio cama-cama/pared de al menos 90 cm'],['foot','Espacio libre en pies de al menos 120 cm'],['bedSection','Cama adecuada'],['underbed','Espacio cama-suelo de al menos 15 cm'],['chairHeight','Asiento de al menos 50 cm']]};
function registry(xs,k){if(!Array.isArray(xs)||!xs.length)return '<p class="sim-muted">No hay registros.</p>';let h='';xs.forEach((x,i)=>{const fields=regFields[k];if(!fields.some(([f])=>x[f]===true))return;h+=`<div class="sim-registry-card"><strong>${esc(x.description||`${k==='bath'?'Baño':k==='wc'?'WC':'Habitación'} tipo ${i+1}`)}</strong> — ${n(x.units)} unidad(es)<div class="sim-option-grid">${fields.map(([f,l])=>check(`${k}|${i}|${f}`,l,x[f]===true)).join('')}</div></div>`;});return h||'<p class="sim-good">No hay características inadecuadas registradas.</p>';}
function wheelchairRows(d){const xs=d.wheelchairTypes||[];if(!xs.length)return '<p class="sim-muted">No hay tipos de silla registrados.</p>';let h='';xs.forEach((x,i)=>{if(!['brakes','arms','back','width'].some(f=>x[f]===true))return;h+=`<div class="sim-registry-card"><strong>${esc(x.description||`Silla tipo ${i+1}`)}</strong> — ${n(x.units)} unidad(es)<div class="sim-option-grid">${check(`chair|${i}|brakes`,'Frenos adecuados',x.brakes!==true)}${check(`chair|${i}|arms`,'Reposabrazos adecuados',x.arms!==true)}${check(`chair|${i}|back`,'Respaldo adecuado',x.back!==true)}${check(`chair|${i}|width`,'Anchura adecuada',x.width!==true)}</div></div>`;});return h||'<p class="sim-good">No hay características inadecuadas registradas.</p>';}
function factor(k,f,d){let h=`<section class="simulation-factor"><div class="simulation-factor-head"><h3>${LABEL[k]}</h3><span>Actual: <b>${n(f[k]).toFixed(2)}</b> · Mejor: <b>${BEST[k].toFixed(2)}</b></span></div>`;
if(k==='fs')h+='<h4>Equipamiento</h4>'+check('fs_elevadores','Hay suficientes elevadores utilizables',yn(d.fs_elevadores))+check('fs_camillas','Hay suficientes camillas regulables con ayuda para transferencias',yn(d.fs_camillas))+check('fs_camas3','Camas regulables de 3 nodos disponibles para el 100%',yn(d.fs_camas3))+'<h4>Levantamientos totales</h4>'+taskRows(d,'fs');
if(k==='fa')h+='<h4>Ayudas menores</h4>'+check('fa_sabana','Hay sábana o tabla deslizante',yn(d.fa_sabana))+check('fa_dos','Hay al menos dos ayudas menores adicionales',yn(d.fa_dos))+check('fa_camas3','Todas las camas son regulables y de 3 nodos',yn(d.fa_camas3))+'<h4>Levantamientos parciales</h4>'+taskRows(d,'fa');
if(k==='fc')h+='<h4>Sillas de ruedas que generan puntuación</h4>'+wheelchairRows(d);
if(k==='famb')h+='<h4>Baños para higiene</h4>'+registry(d.bathTypes,'bath')+'<h4>Baños con WC</h4>'+registry(d.wcTypes,'wc')+'<h4>Habitaciones</h4>'+registry(d.roomTypes,'room');
if(k==='ff')h+='<h4>Formación</h4>'+check('ff_curso','Existe curso teórico-práctico adecuado de al menos 6 horas',yn(d.ff_curso))+`<label class="sim-option sim-number"><span>Porcentaje de plantilla cubierta</span><input type="number" min="0" max="100" data-sim-key="ff_cobertura" value="${n(d.ff_cobertura)}"> %</label>`+check('ff_antiguedad','La formación tiene menos de 2 años',yn(d.ff_antiguedad))+check('ff_eficacia','Si tiene más de 2 años, se ha verificado su eficacia',yn(d.ff_eficacia))+check('ff_informacion','Existe información/adiestramiento al 90% y eficacia verificada',yn(d.ff_informacion));
return h+'</section>';}
function collect(){document.querySelectorAll('#mapoSimulation [data-sim-key]').forEach(i=>{const p=i.dataset.simKey.split('|');if(p.length===3){const k=p[0],idx=Number(p[1]),f=p[2],key=k==='chair'?'wheelchairTypes':k==='bath'?'bathTypes':k==='wc'?'wcTypes':'roomTypes';simulationData[key]??=[];simulationData[key][idx]??={};if(k==='chair')simulationData[key][idx][f]=!i.checked;else simulationData[key][idx][f]=i.checked;}else simulationData[i.dataset.simKey]=i.type==='checkbox'?i.checked:Number(i.value||0);});simulationData.simulationMobilizationGroups??={};
document.querySelectorAll('#mapoSimulation [data-sim-mob][data-sim-mob-role="aided"]').forEach(sel=>{
  const i=Number(sel.dataset.simMob),kind=sel.dataset.simMobKind;
  const value=Math.max(0,Math.min(100,Number(sel.value||0)));
  simulationData.simulationMobilizationGroups[groupKey(i,kind)]=value;
});
simulationData.simulationMobilizationRatios=buildTaskOverrides(simulationData);
simulationChanged=JSON.stringify(baseData)!==JSON.stringify(simulationData);}
function flattenChanges(base,current,path='',out=[]){if(typeof base==='object'&&base!==null&&typeof current==='object'&&current!==null){if(Array.isArray(base)||Array.isArray(current)){const len=Math.max(base?.length||0,current?.length||0);for(let i=0;i<len;i++)flattenChanges(base?.[i],current?.[i],path?`${path}[${i}]`:`[${i}]`,out);}else{new Set([...Object.keys(base),...Object.keys(current)]).forEach(k=>{if(k!=='simulationMobilizationRatios'&&k!=='simulationMobilizationGroups')flattenChanges(base[k],current[k],path?`${path}.${k}`:k,out);});}return out;}if(String(base??'')!==String(current??''))out.push({path,from:base,to:current});return out;}
function simulationChanges(base,current){
  const out=[],stats=mobilizationGroupStats(base),ratios=current?.simulationMobilizationGroups||{},shifts=['Mañana','Tarde','Noche'];
  shifts.forEach((shift,i)=>['total','partial'].forEach(kind=>{
    const fromA=groupRatio(stats,i,kind,null),key=groupKey(i,kind),toA=ratios[key]!==undefined?n(ratios[key]):fromA,fromM=100-fromA,toM=100-toA;
    if(Math.abs(toA-fromA)>.001)out.push({path:'mobilizations.'+key+'.aided',from:fromA,to:toA,percent:true,label:shift+' — '+(kind==='total'?'Levantamiento total con ayuda':'Levantamiento parcial con ayuda')});
    if(Math.abs(toM-fromM)>.001)out.push({path:'mobilizations.'+key+'.manual',from:fromM,to:toM,percent:true,label:shift+' — '+(kind==='total'?'Levantamiento total sin ayuda':'Levantamiento parcial sin ayuda')});
  })); return out;
}
function isPercentPath(path){return /(^|\.)(ff_cobertura|cobertura|coverage|percent|porcentaje)(\.|$)/i.test(path);}
function formatChangeValue(v,path,percent=false){if(v===true)return 'Sí';if(v===false)return 'No';if(v===null||v===undefined||v==='')return '—';if(percent||isPercentPath(path))return `${Number(v).toLocaleString('es-ES',{maximumFractionDigits:2})} %`;if(typeof v==='number'&&Number.isFinite(v))return Number(v).toLocaleString('es-ES',{maximumFractionDigits:2});return String(v);}
function labelChange(c){const labels={ff_curso:'Curso teórico-práctico ≥ 6 h',ff_cobertura:'Cobertura de formación',ff_antiguedad:'Formación < 2 años',ff_eficacia:'Eficacia verificada',ff_informacion:'Información/adiestramiento',fs_elevadores:'Elevadores suficientes',fs_camillas:'Camillas regulables suficientes',fs_camas3:'Camas regulables de 3 nodos',fa_sabana:'Sábana/tabla deslizante',fa_dos:'Al menos dos ayudas menores adicionales',fa_camas3:'Todas las camas regulables y de 3 nodos'};return c.label||labels[c.path]||c.path;}
function summaryChanges(){const changes=[...flattenChanges(baseData,simulationData),...simulationChanges(baseData,simulationData)];if(!changes.length)return '<div class="simulation-summary-changes"><h3>Resumen de cambios simulados</h3><p>No se ha modificado ninguna condición.</p></div>';return `<div class="simulation-summary-changes"><h3>Resumen de cambios simulados</h3><ul>${changes.map(c=>`<li><strong>${esc(labelChange(c))}</strong>: ${esc(formatChangeValue(c.from,c.path,c.percent))} → <strong>${esc(formatChangeValue(c.to,c.path,c.percent))}</strong></li>`).join('')}</ul></div>`;}
function showScreen(){['accessScreen','roomSetup','studySelection','studyPanel','result','globalResults','templateAdmin'].forEach(id=>{const e=$(id);if(e)e.hidden=true;});const host=$('mapoSimulation');host.hidden=false;host.scrollIntoView({behavior:'smooth',block:'start'});}
function restoreResults(){const host=$('mapoSimulation');host.hidden=true;const result=$('result');if(result)result.hidden=false;ensureStudyNavigation();result?.scrollIntoView({behavior:'smooth',block:'start'});}
function ensureStudyNavigation(){const result=$('result');if(!result)return;let box=$('returnToStudyActions');if(!box){box=document.createElement('div');box.id='returnToStudyActions';box.className='actions';const heading=result.querySelector('.section-heading');(heading||result).appendChild(box);}box.innerHTML='<button type="button" id="returnToStudy">Volver al estudio</button>';const b=$('returnToStudy');if(b)b.onclick=returnToStudy;}
function returnToStudy(){const result=$('result'),panel=$('studyPanel');if(result)result.hidden=true;if(panel)panel.hidden=false;if(typeof renderStep==='function')renderStep();if(typeof syncStepButtons==='function')syncStepButtons();panel?.scrollIntoView({behavior:'smooth',block:'start'});}
function render(){const host=$('mapoSimulation');let current,original;try{original=calc(baseData,true);current=simulationChanged?calc(simulationData,false):original;}catch(err){host.innerHTML=`<div class="section-heading"><h2>Simulación de mejoras del índice MAPO</h2><button type="button" id="closeMapoSimulation" class="secondary">Volver a resultados</button></div><div class="error">${esc(err.message)}</div>`;host.hidden=false;showScreen();$('closeMapoSimulation').onclick=restoreResults;return;}let h=`<div class="section-heading"><div><h2>Simulación de mejoras del índice MAPO</h2><p>Modifique las condiciones concretas. El estudio original no se modifica.</p></div><button type="button" id="closeMapoSimulation" class="secondary">Volver a resultados</button></div><div class="simulation-summary"><div><span>MAPO actual</span><strong>${original.mapo.toFixed(2)}</strong></div><div>→</div><div><span>MAPO simulado</span><strong class="sim-score">${current.mapo.toFixed(2)}</strong></div></div>${summaryChanges()}`;h+=['fs','fa','fc','famb','ff'].map(k=>factor(k,current.f,simulationData)).join('');h+='<div class="actions"><button type="button" id="recalcMapoSimulation">Recalcular simulación</button><button type="button" id="resetMapoSimulation" class="secondary">Restablecer valores originales</button></div>';host.innerHTML=h;showScreen();
document.querySelectorAll('#mapoSimulation [data-sim-mob]').forEach(input=>{
  input.addEventListener('input',()=>{
    const i=input.dataset.simMob,kind=input.dataset.simMobKind,role=input.dataset.simMobRole;
    const other=document.querySelector('#mapoSimulation [data-sim-mob="'+i+'"][data-sim-mob-kind="'+kind+'"][data-sim-mob-role="'+(role==='aided'?'manual':'aided')+'"]');
    if(other){const v=Math.max(0,Math.min(100,Number(input.value||0)));other.value=(100-v).toFixed(1);}
  });
});
$('closeMapoSimulation').onclick=restoreResults;$('recalcMapoSimulation').onclick=()=>{collect();render();};$('resetMapoSimulation').onclick=()=>{simulationData=clone(baseData);simulationChanged=false;render();};}
function open(){if(typeof formData==='undefined'||!formData)throw new Error('No hay un estudio calculado para simular.');baseData=clone(formData);baseResult=typeof lastResult!=='undefined'&&lastResult?clone(lastResult):null;simulationData=clone(formData);simulationChanged=false;render();}
function bind(){const b=$('openMapoSimulation');if(b)b.onclick=()=>{try{open();}catch(err){alert('No se pudo abrir la simulación: '+err.message);}};}
window.MAPOSimulation={open,close:restoreResults};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
