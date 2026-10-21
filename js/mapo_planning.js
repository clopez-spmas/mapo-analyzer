/* Planificación preventiva documental. No participa en los cálculos MAPO. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const priorities=['','Inmediata','Alta','Media','Baja'];
const columns=[['medida','Medida propuesta','textarea']];
function state(){formData.planificacionPreventiva=formData.planificacionPreventiva||{medidas:[],alternativas:'',aprobadoPor:'',fechaAprobacion:''};return formData.planificacionPreventiva;}
function screen(){return document.getElementById('planningPanel');}
function input(k,i,v,type){
 const id='data-plan-field="'+k+'" data-plan-index="'+i+'"';
 if(type==='select')return '<select '+id+'>'+priorities.map(x=>'<option value="'+esc(x)+'" '+(v===x?'selected':'')+'>'+esc(x||'Sin indicar')+'</option>').join('')+'</select>';
 if(type==='textarea')return '<textarea '+id+' rows="2" style="min-width:180px">'+esc(v||'')+'</textarea>';
 return '<input '+id+' type="'+type+'" value="'+esc(v||'')+'"'+(type==='text'?' style="min-width:140px"':'')+'>';
}
function capture(){
 const p=state(),host=screen();if(!host||host.hidden)return;
 host.querySelectorAll('[data-plan-index]').forEach(el=>{const i=Number(el.dataset.planIndex),key=el.dataset.planField;p.medidas[i]=p.medidas[i]||{};p.medidas[i][key]=el.value;});
 ['alternativas','aprobadoPor','fechaAprobacion'].forEach(k=>{const el=host.querySelector('[data-plan-meta="'+k+'"]');if(el)p[k]=el.value;});
}
function draw(selectSimulation=false){
 const p=state(),host=screen();if(!host)return;
 const changes=selectSimulation&&window.MAPOSimulation?.getProposedChanges?.()||[];
 let html='<div class="section-heading"><div><h2>Planificación de la prevención</h2><p>Registro documental de propuestas y medidas preventivas. No modifica el estudio ni el índice MAPO original.</p></div></div>';
 html+='<div class="actions"><button type="button" class="secondary" id="returnPlanResults">← Volver a resultados</button><button type="button" id="planAdd">+ Añadir medida</button></div>';
 if(changes.length)html+='<div class="registry-card"><h3>Seleccionar mejoras de la simulación</h3><p>Las modificaciones simuladas son propuestas, no medidas implantadas. Seleccione cuáles desea añadir; después podrá concretar el texto de la medida.</p>'+changes.map((c,i)=>'<label style="display:block"><input type="checkbox" data-plan-sim="'+i+'"> '+esc(c.description)+'</label>').join('')+'<button type="button" id="planImport">Incorporar seleccionadas</button></div>';
 html+='<p>Empresa: '+esc(formData.empresa||'—')+' · Centro: '+esc(formData.centroTrabajo||'—')+' · Unidad: '+esc(formData.unidad||'—')+' · Fecha de evaluación: '+esc(formData.fecha||'—')+'</p>';
 html+='<div style="overflow-x:auto"><table class="mapo-report-table" style="min-width:760px;width:100%"><thead><tr>'+columns.map(c=>'<th>'+esc(c[1])+'</th>').join('')+'<th>Acción</th></tr></thead><tbody>';
 html+=p.medidas.map((m,i)=>'<tr>'+columns.map(([k,,t])=>'<td>'+input(k,i,m[k],t)+'</td>').join('')+'<td><button type="button" class="secondary" data-plan-remove="'+i+'">Eliminar</button></td></tr>').join('');
 html+='</tbody></table></div>';

 html+='<div class="actions"><button type="button" class="secondary" id="planSaveJson">Guardar estudio JSON</button><button type="button" class="secondary" id="planReturnBottom">Volver a resultados</button></div>';
 host.innerHTML=html;
 host.querySelectorAll('[data-plan-field],[data-plan-meta]').forEach(e=>e.addEventListener('input',capture));
 const redraw=()=>{capture();draw(false);};
 host.querySelector('#planAdd').onclick=()=>{capture();p.medidas.push({});draw(false);};
 host.querySelectorAll('[data-plan-remove]').forEach(e=>e.onclick=()=>{capture();p.medidas.splice(Number(e.dataset.planRemove),1);draw(false);});
 if(changes.length)host.querySelector('#planImport').onclick=()=>{capture();host.querySelectorAll('[data-plan-sim]:checked').forEach(e=>{const c=changes[Number(e.dataset.planSim)];if(c)p.medidas.push({medida:c.description,origen:'Simulación MAPO'});});draw(false);};
 const back=()=>{capture();window.MAPOResultScreens?.showResult?.();};
 host.querySelector('#returnPlanResults').onclick=back;host.querySelector('#planReturnBottom').onclick=back;
 host.querySelector('#planSaveJson').onclick=()=>{capture();const b=document.getElementById('saveStudy');if(b)b.click();};
}
function open(withSimulation=false){
 if(typeof formData==='undefined'||!formData)return;
 const host=screen();if(!host)return;
 ['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','multiRoomResultsHub','mapoSimulation','reportTablesPanel','templateAdmin'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true;});
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