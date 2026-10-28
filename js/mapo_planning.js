/* Planificación preventiva documental. No participa en los cálculos MAPO. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function state(){formData.planificacionPreventiva=formData.planificacionPreventiva||{medidas:[],alternativas:'',aprobadoPor:'',fechaAprobacion:''};return formData.planificacionPreventiva;}
function screen(){return document.getElementById('planningPanel');}
function capture(){
 const p=state(),host=screen();if(!host||host.hidden)return;
 host.querySelectorAll('[data-plan-index]').forEach(el=>{const i=Number(el.dataset.planIndex),key=el.dataset.planField;p.medidas[i]=p.medidas[i]||{};p.medidas[i][key]=el.value;});
 ['alternativas','aprobadoPor','fechaAprobacion'].forEach(k=>{const el=host.querySelector('[data-plan-meta="'+k+'"]');if(el)p[k]=el.value;});
}
function draw(selectSimulation=false){
 const p=state(),host=screen();if(!host)return;
 const changes=selectSimulation&&window.MAPOSimulation?.getProposedChanges?.()||[];
 let html='<div class="section-heading"><div><h2>Planificación de la prevención</h2></div></div>';
 html+='<div class="actions"><button type="button" class="secondary" id="returnPlanResults">← Volver a resultados</button><button type="button" id="planAdd">+ Añadir medida</button></div>';
 if(changes.length)html+='<div class="registry-card"><h3>Seleccionar mejoras de la simulación</h3><p>Las modificaciones simuladas son propuestas, no medidas implantadas. Seleccione cuáles desea añadir; después podrá concretar el texto de la medida.</p>'+changes.map((c,i)=>'<label style="display:block"><input type="checkbox" data-plan-sim="'+i+'"> '+esc(c.description)+'</label>').join('')+'<button type="button" id="planImport">Incorporar seleccionadas</button></div>';


 html+='<div class="plan-measures" style="display:grid;gap:20px;margin:20px 0;">'+
 p.medidas.map((m,i)=>'<div class="plan-measure-item" style="padding-bottom:18px;border-bottom:1px solid var(--border,#dce5ef);">'+
 '<label for="planMeasure'+i+'" style="display:block;margin-bottom:8px;font-weight:600;">Medida propuesta'+(p.medidas.length>1?' '+(i+1):'')+'</label>'+
 '<textarea id="planMeasure'+i+'" data-plan-field="medida" data-plan-index="'+i+'" rows="5" style="display:block;width:100%;min-height:130px;box-sizing:border-box;resize:vertical;padding:12px;font:inherit;line-height:1.5;" placeholder="Describa la medida preventiva propuesta...">'+esc(m.medida||'')+'</textarea>'+
 '<div class="actions" style="margin-top:10px;justify-content:flex-end;"><button type="button" class="secondary" data-plan-remove="'+i+'">Eliminar medida</button></div></div>').join('')+
 '</div>';
 html+='<div class="actions"><button type="button" class="secondary" id="planSaveJson">Guardar estudio JSON</button><button type="button" class="secondary" id="planReturnBottom">Volver a resultados</button></div>';
 html+='<div class="actions mapo-sequence-navigation"><button type="button" class="secondary" id="planPrevious">Anterior</button><button type="button" class="secondary" id="planNext">Siguiente</button></div>';
 host.innerHTML=html;
 host.querySelectorAll('[data-plan-field],[data-plan-meta]').forEach(e=>e.addEventListener('input',capture));
 const redraw=()=>{capture();draw(false);};
 host.querySelector('#planAdd').onclick=()=>{capture();p.medidas.push({});draw(false);};
 host.querySelectorAll('[data-plan-remove]').forEach(e=>e.onclick=()=>{capture();p.medidas.splice(Number(e.dataset.planRemove),1);draw(false);});
 if(changes.length)host.querySelector('#planImport').onclick=()=>{capture();host.querySelectorAll('[data-plan-sim]:checked').forEach(e=>{const c=changes[Number(e.dataset.planSim)];if(c)p.medidas.push({medida:c.description,origen:'Simulación MAPO'});});draw(false);};
 const back=()=>{capture();window.MAPOResultScreens?.showResult?.();};
 host.querySelector('#planPrevious').onclick=()=>{capture();window.MAPOResultScreens?.showSimulation?.();};host.querySelector('#planNext').onclick=()=>{capture();window.MAPOResultScreens?.showWord?.();};
 host.querySelector('#returnPlanResults').onclick=back;host.querySelector('#planReturnBottom').onclick=back;
 host.querySelector('#planSaveJson').onclick=()=>{capture();const b=document.getElementById('saveStudy');if(b)b.click();};
}
function open(withSimulation=false){
 window.MAPOSimulation?.capture?.();
 if(typeof formData==='undefined'||!formData)return;
 const host=screen();if(!host)return;
 ['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','multiRoomResultsHub','mapoSimulation','reportTablesPanel','wordReportPanel','templateAdmin'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true;});
 host.hidden=false;draw(withSimulation);host.scrollIntoView({block:'start'});
}
function init(){
 const result=document.getElementById('result');if(!result)return;
 const head=result.querySelector('.section-heading .actions')||result.querySelector('.section-heading')||result;
 if(!document.getElementById('openMapoPlanning')){const b=document.createElement('button');b.id='openMapoPlanning';b.type='button';b.className='secondary';b.textContent='Planificación preventiva';b.onclick=()=>open(false);head.appendChild(b);}
}
window.MAPOPlanning={open,capture};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();