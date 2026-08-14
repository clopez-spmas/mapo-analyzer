/* MAPO Analyzer — simulación de mejoras. Pantalla independiente. */
(function(){
'use strict';
let baseData=null,simulationData=null,baseResult=null,simulationChanged=false;
const BEST={fs:.5,fa:.5,fc:.75,famb:.75,ff:.75};
const LABEL={fs:'FS — Factor de elevación',fa:'FA — Factor de ayudas menores',fc:'FC — Factor de sillas de ruedas',famb:'Famb — Factor ambiente',ff:'FF — Factor formación'};
const n=v=>Number(v||0),yn=v=>v===true||v==='yes';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v??{}));
const HELP_OPTIONS=[0,25,50,75,90,100];
function calc(d,isBase=false){
 if(isBase&&baseResult&&typeof baseResult.mapo==='number')return{f:{fs:n(baseResult.fs),fa:n(baseResult.fa),fc:n(baseResult.fc),famb:n(baseResult.famb),ff:n(baseResult.ff),taskTotals:baseResult.taskTotals||{}},mapo:n(baseResult.mapo)};
 if(typeof window.MAPOCalculationEngine?.calculateHospitalizacionFactors!=='function')throw new Error('No está disponible el motor de cálculo MAPO.');
 const f=window.MAPOCalculationEngine.calculateHospitalizacionFactors(d),op=n(d.op);if(!op)throw new Error('OP debe ser mayor que 0.');
 const mapo=((n(d.nc)/op*n(f.fs))+(n(d.pc)/op*n(f.fa)))*n(f.fc)*n(f.famb)*n(f.ff);return{f,mapo};
}
function check(key,label,value){return `<label class="sim-option"><input type="checkbox" data-sim-key="${esc(key)}" ${value?'checked':''}><span>${label}</span></label>`;}
function mobilizationEntries(d){const entries=d?.mobilizations?.entries;if(!entries||typeof entries!=='object')return{};const out={};Object.entries(entries).forEach(([id,e])=>{if(!e||typeof e!=='object')return;const sum=v=>Array.isArray(v)?v.reduce((a,x)=>a+n(x),0):n(v);const manualTotal=sum(e.manualTotal),aidedTotal=sum(e.aidedTotal),manualPartial=sum(e.manualPartial),aidedPartial=sum(e.aidedPartial);if(manualTotal+aidedTotal+manualPartial+aidedPartial>0)out[id]={manualTotal,aidedTotal,manualPartial,aidedPartial};});return out;}
function taskLabel(id){const lists=[window.HOSPITALIZATION_MOBILIZATIONS,window.MAPO_TASKS,window.EXTRA_MAPO_TASKS];for(const list of lists){if(Array.isArray(list)){const x=list.find(v=>String(v.id)===String(id));if(x)return x.name||x.label;}}const custom=simulationData?.mobilizations?.custom||simulationData?.customTasks||[];const x=Array.isArray(custom)?custom.find(v=>String(v.id)===String(id)):null;return x?.name||String(id);}
function taskRows(d,k){const entries=mobilizationEntries(d),overrides=d?.simulationMobilizationRatios||{},out=[];Object.entries(entries).forEach(([id,e])=>{const total=k==='fs'?e.manualTotal+e.aidedTotal:e.manualPartial+e.aidedPartial,aided=k==='fs'?e.aidedTotal:e.aidedPartial;if(total<=0)return;const raw=aided/total*100,kind=k==='fs'?'total':'partial',selected=overrides[id]?.[kind]??Math.round(raw);if(raw<90||overrides[id]?.[kind]!==undefined)out.push(`<div class="sim-task-row"><div class="sim-task-info"><strong>${esc(taskLabel(id))}</strong><span>Actual: ${aided}/${total} con ayuda (${raw.toFixed(1)}%)</span></div><label class="sim-number"><span>Simular % con ayuda</span><select data-sim-mob="${esc(id)}" data-sim-mob-kind="${kind}">${HELP_OPTIONS.map(v=>`<option value="${v}" ${Number(v)===Number(selected)?'selected':''}>${v} %</option>`).join('')}</select></label></div>`);});return out.length?`<div class="sim-mobilization-list">${out.join('')}</div>`:'<p class="sim-muted">Todas las movilizaciones están al 90 % o más con ayuda.</p>';}
function factor(k,f,d){let h=`<section class="simulation-factor"><div class="simulation-factor-head"><h3>${LABEL[k]}</h3><span>Actual: <b>${n(f[k]).toFixed(2)}</b> · Mejor: <b>${BEST[k].toFixed(2)}</b></span></div>`;
if(k==='fs')h+='<h4>Equipamiento</h4>'+check('fs_elevadores','Hay suficientes elevadores utilizables',yn(d.fs_elevadores))+check('fs_camillas','Hay suficientes camillas regulables con ayuda para transferencias',yn(d.fs_camillas))+check('fs_camas3','Camas regulables de 3 nodos disponibles para el 100%',yn(d.fs_camas3))+'<h4>Levantamientos totales</h4>'+taskRows(d,'fs');
if(k==='fa')h+='<h4>Ayudas menores</h4>'+check('fa_sabana','Hay sábana o tabla deslizante',yn(d.fa_sabana))+check('fa_dos','Hay al menos dos ayudas menores adicionales',yn(d.fa_dos))+check('fa_camas3','Todas las camas son regulables y de 3 nodos',yn(d.fa_camas3))+'<h4>Levantamientos parciales</h4>'+taskRows(d,'fa');
if(k==='fc')h+='<h4>Sillas de ruedas que generan puntuación</h4>'+(typeof wheelchairRows==='function'?wheelchairRows(d):'<p class="sim-muted">No hay tipos de silla registrados.</p>');
if(k==='famb')h+='<h4>Baños para higiene</h4>'+(typeof registry==='function'?registry(d.bathTypes,'bath'):'')+'<h4>Baños con WC</h4>'+(typeof registry==='function'?registry(d.wcTypes,'wc'):'')+'<h4>Habitaciones</h4>'+(typeof registry==='function'?registry(d.roomTypes,'room'):'');
if(k==='ff')h+='<h4>Formación que genera puntuación</h4>'+check('ff_curso','Existe curso teórico-práctico adecuado de al menos 6 horas',yn(d.ff_curso))+`<label class="sim-option sim-number"><span>Porcentaje de plantilla cubierta</span><input type="number" min="0" max="100" data-sim-key="ff_cobertura" value="${n(d.ff_cobertura)}"> %</label>`+check('ff_antiguedad','La formación tiene menos de 2 años',yn(d.ff_antiguedad))+check('ff_eficacia','Si tiene más de 2 años, se ha verificado su eficacia',yn(d.ff_eficacia))+check('ff_informacion','Existe información/adiestramiento al 90% y eficacia verificada',yn(d.ff_informacion));
return h+'</section>';}
/* resto del módulo se conserva en la versión existente */
})();
