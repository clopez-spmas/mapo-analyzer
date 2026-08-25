/* MAPO Analyzer — navegación principal.
   La navegación de movilizaciones es exclusivamente:
   1) elegir turno; 2) elegir tipo; 3) introducir datos de esa única combinación.
   Las 12 combinaciones existen en formData.mobilizations para el cálculo,
   pero NO son 12 pasos de navegación. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const TITLES={hospitalizacion:'Salas de hospitalización',ambulatorio:'Servicios ambulatorios',quirurgica:'Área quirúrgica'};
const MODULES={
 hospitalizacion:[
  ['Personas trabajadoras','Trabajadores que realizan movilización manual de pacientes.'],
  ['Pacientes','Datos de pacientes colaboradores y no colaboradores.'],
  ['Movilizaciones','Seleccione un turno y después uno de sus cuatro tipos.'],
  ['Factor de elevación','Equipamiento para levantamientos totales.'],
  ['Ayudas menores','Disponibilidad y adecuación de ayudas menores.'],
  ['Factor de sillas de ruedas','Sillas de ruedas y puntuación de inadecuación.'],
  ['Baños','Baños para higiene y baños con WC.'],
  ['Habitaciones','Condiciones de las habitaciones y PMH.'],
  ['Formación','Formación de las personas trabajadoras.']
 ],
 ambulatorio:[['Personas trabajadoras','Personas que realizan movilización manual de pacientes.'],['Pacientes','Pacientes incluidos en el estudio.'],['Factores del modelo','Factores específicos del servicio ambulatorio.']],
 quirurgica:[['Personas trabajadoras','Personas que realizan movilización manual.'],['Organización e intervenciones','Intervenciones y movilizaciones.'],['Factores del modelo','Factores específicos del área quirúrgica.']]
};
const MOB_TURNS=['Mañana','Tarde','Noche'];
const MOB_CATEGORIES=[
 ['aidedTotal','Movilizaciones totales con ayuda','Con ayuda — total'],
 ['aidedPartial','Movilizaciones parciales con ayuda','Con ayuda — parcial'],
 ['manualTotal','Movilizaciones totales sin ayuda','Manual — total'],
 ['manualPartial','Movilizaciones parciales sin ayuda','Manual — parcial']
];
let chosenStudy=null,mobTurn=null;
const show=(id,v)=>{const e=$(id);if(e)e.hidden=!v;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hideAll(){['accessScreen','studySelection','roomSetup','moduleHub','studyPanel','result','globalResults','mapoSimulation','templateAdmin'].forEach(id=>show(id,false));}
function saveStudy(){window.MAPOMultiRoom?.saveMultiStudy?.();}
function loadStudy(){const f=$('loadMultiStudyFile');if(f){f.value='';f.click();}}
function removeGeneratedActions(host){if(!host)return;host.querySelectorAll('.main-flow-actions,.module-flow-actions,#mobilizationActions').forEach(e=>e.remove());}
function removeStudyIOControls(){document.getElementById('studyIO')?.remove();}
function addNav(host,prev,next){if(!host)return;removeGeneratedActions(host);const d=document.createElement('div');d.className='actions main-flow-actions';d.innerHTML='<button type="button" class="secondary nav-previous">Anterior</button><button type="button" class="secondary nav-save">Guardar estudio</button><button type="button" class="secondary nav-load">Cargar estudio</button><button type="button" class="nav-next">Siguiente</button>';host.appendChild(d);d.querySelector('.nav-previous').onclick=prev;d.querySelector('.nav-next').onclick=next;d.querySelector('.nav-save').onclick=saveStudy;d.querySelector('.nav-load').onclick=loadStudy;}
function typeScreen(){hideAll();show('studySelection',true);document.querySelectorAll('.study-option').forEach(b=>b.classList.toggle('selected',b.dataset.study===chosenStudy));}
function config(){hideAll();show('roomSetup',true);window.MAPOMultiRoom?.prepareRoomSetup?.();addNav($('roomSetup'),typeScreen,hub);}
function hub(){if(!chosenStudy){typeScreen();return;}hideAll();show('moduleHub',true);renderHub();}
function renderHub(){const h=$('moduleHub');if(!h)return;const mods=MODULES[chosenStudy]||[];h.innerHTML='<div class="module-hub-heading"><span class="module-hub-badge">Acceso directo a módulos</span><h2>'+esc(TITLES[chosenStudy]||'Estudio MAPO')+'</h2><p>Seleccione directamente el apartado que desea cumplimentar.</p></div><div class="module-hub-grid">'+mods.map((m,i)=>'<button type="button" class="module-hub-item" data-module="'+i+'"><span>Módulo '+(i+1)+'</span><strong>'+esc(m[0])+'</strong><small>'+esc(m[1])+'</small></button>').join('')+'</div><div class="module-hub-actions"><button type="button" id="hubCalculate">Cálculo MAPO</button><button type="button" id="hubSimulation" class="secondary">Simulación MAPO</button><button type="button" id="hubTables" class="secondary">Descargar tablas MAPO</button><button type="button" id="hubReport" class="secondary">Descargar informe MAPO</button></div>';h.querySelectorAll('[data-module]').forEach(b=>b.onclick=()=>openModule(Number(b.dataset.module)));$('hubCalculate').onclick=()=>openModule(0);$('hubSimulation').onclick=()=>{$('openMapoSimulation')?.click();};$('hubTables').onclick=()=>{$('openReportTables')?.click();};$('hubReport').onclick=()=>{$('generateReport')?.click();};addNav(h,config,()=>openModule(0));}
function removeLegacyModuleButtons(){const p=$('studyPanel');if(!p)return;removeGeneratedActions(p);const legacy=p.querySelector('#legacyStepActions');if(legacy)legacy.hidden=true;['previousStep','nextStep','calculate'].forEach(id=>{const b=$(id);if(b)b.hidden=true;});removeStudyIOControls();}
function renderMobilizationMenu(){
 const host=$('formContainer');if(!host)return;
 host.innerHTML=`<div class="mobilization-navigation"><div class="step-title-row"><h3>Movilizaciones</h3><span class="schedule-preview">Seleccione un turno. Después aparecerán únicamente los cuatro tipos de movilización de ese turno.</span></div><div class="mobilization-turn-buttons">${MOB_TURNS.map((t,i)=>`<button type="button" class="secondary mob-turn-btn ${mobTurn===i?'selected':''}" data-mob-turn="${i}">${t}</button>`).join('')}</div><div id="mobilizationOptions" class="mobilization-options" hidden></div></div>`;
 host.querySelectorAll('[data-mob-turn]').forEach(b=>b.onclick=()=>{mobTurn=Number(b.dataset.mobTurn);renderMobilizationMenu();});
 if(mobTurn!==null){const box=$('mobilizationOptions');box.hidden=false;box.innerHTML=`<h4>Turno de ${esc(MOB_TURNS[mobTurn])}</h4><p>Seleccione una opción. Solo se mostrará esa combinación para introducir los datos.</p><div class="mobilization-option-grid">${MOB_CATEGORIES.map((c,i)=>`<button type="button" class="module-hub-item" data-mob-category="${i}"><strong>${esc(c[1])}</strong><small>Turno de ${esc(MOB_TURNS[mobTurn])}</small></button>`).join('')}</div>`;box.querySelectorAll('[data-mob-category]').forEach(b=>b.onclick=()=>openMobilizationScreen(mobTurn,Number(b.dataset.mobCategory)));}
}
function selectedColumn(category,turn){const starts={aidedTotal:6,aidedPartial:9,manualTotal:0,manualPartial:3};return starts[category]+turn;}
function filterMobilizationTable(table,category,turn){
 const keepColumn=selectedColumn(category,turn);
 table.querySelectorAll('thead tr:first-child th').forEach((cell,i)=>{cell.hidden=i!==0 && i!==({manualTotal:1,manualPartial:2,aidedTotal:3,aidedPartial:4}[category]);});
 table.querySelectorAll('thead tr:nth-child(2) th').forEach((cell,i)=>{cell.hidden=i!==turn;});
 table.querySelectorAll('tbody tr').forEach(row=>{
  if(row.classList.contains('mob-section')){row.hidden=false;return;}
  const cells=[...row.children];
  cells.forEach((cell,i)=>{if(i===0)cell.hidden=false;else if(row.dataset.custom==='true'&&i===13)cell.hidden=false;else cell.hidden=(i-1)!==keepColumn;});
 });
}
function addSelectedMobilizationActions(host,turn,category){
 let old=$('mobilizationActions');if(old)old.remove();
 const actions=document.createElement('div');actions.id='mobilizationActions';actions.className='actions';actions.innerHTML='<button type="button" class="secondary" id="backToMobilizationMenu">Seleccionar otro turno</button><button type="button" class="secondary" id="saveMobilizationStudy">Guardar estudio</button>';
 host.appendChild(actions);
 $('backToMobilizationMenu').onclick=()=>{try{window.captureMobilizations?.();}catch(_){}mobTurn=null;window.MAPOMobilizationSelection={turn:null,category:null};renderMobilizationMenu();removeLegacyModuleButtons();};
 $('saveMobilizationStudy').onclick=saveStudy;
}
function renderMobilizationScreen(turn,category){
 if(typeof window.renderMobilizations!=='function')return;
 const host=$('formContainer');if(!host)return;
 window.renderMobilizations();
 const table=host.querySelector('.mob-table');if(!table)return;
 filterMobilizationTable(table,MOB_CATEGORIES[category][0],turn);
 host.querySelector('.step-title-row')?.remove();
 const title=document.createElement('div');title.className='mobilization-screen-title schedule-preview';title.innerHTML=`<strong>${esc(MOB_CATEGORIES[category][1])} — turno de ${esc(MOB_TURNS[turn])}</strong><br><span>Esta es la única combinación visible en esta pantalla. Los demás datos se conservan internamente.</span>`;host.insertBefore(title,host.firstChild);
 addSelectedMobilizationActions(host,turn,category);
 // Los campos visibles siguen siendo inputs normales y editables.
 host.querySelectorAll('.mob-count').forEach(input=>input.addEventListener('input',()=>{try{window.captureMobilizations?.();}catch(_){}},{passive:true}));
}
function openMobilizationScreen(turn,category){
 mobTurn=turn;window.MAPOMobilizationSelection={turn,category};
 hideAll();show('studyPanel',true);removeLegacyModuleButtons();
 if(window.MAPOMultiRoom?.openSelectedModule)window.MAPOMultiRoom.openSelectedModule(chosenStudy,3);
 else if(typeof window.selectStudy==='function'){window.selectStudy(chosenStudy);currentStep=3;window.renderStep?.();}
 setTimeout(()=>{renderMobilizationScreen(turn,category);removeLegacyModuleButtons();},0);
}
function openModule(index){
 if(!chosenStudy){typeScreen();return;}
 if(chosenStudy==='hospitalizacion'&&index===2){mobTurn=null;window.MAPOMobilizationSelection={turn:null,category:null};hideAll();show('studyPanel',true);removeLegacyModuleButtons();if(window.MAPOMultiRoom?.openSelectedModule)window.MAPOMultiRoom.openSelectedModule(chosenStudy,3);else if(typeof window.selectStudy==='function'){window.selectStudy(chosenStudy);currentStep=3;window.renderStep?.();}setTimeout(()=>{renderMobilizationMenu();removeLegacyModuleButtons();},0);return;}
 hideAll();show('studyPanel',true);removeLegacyModuleButtons();const realStep=index+1;if(window.MAPOMultiRoom?.openSelectedModule)window.MAPOMultiRoom.openSelectedModule(chosenStudy,realStep);else if(typeof window.selectStudy==='function'){window.selectStudy(chosenStudy);currentStep=realStep;window.renderStep?.();}setTimeout(()=>{removeLegacyModuleButtons();decorateModuleButtons(index);},0);
}
function decorateModuleButtons(index){const p=$('studyPanel');if(!p)return;removeGeneratedActions(p);removeStudyIOControls();const mods=MODULES[chosenStudy]||[],d=document.createElement('div');d.className='actions main-flow-actions';d.innerHTML='<button type="button" class="secondary nav-previous">Anterior</button><button type="button" class="secondary nav-save">Guardar estudio</button><button type="button" class="secondary nav-load">Cargar estudio</button><button type="button" class="nav-next">Siguiente</button>';p.appendChild(d);d.querySelector('.nav-previous').onclick=()=>index>0?openModule(index-1):hub();d.querySelector('.nav-next').onclick=()=>index<mods.length-1?openModule(index+1):$('calculate')?.click();d.querySelector('.nav-save').onclick=saveStudy;d.querySelector('.nav-load').onclick=loadStudy;}
function install(){const enter=$('enterProgram');if(enter)enter.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();typeScreen();},true);document.querySelectorAll('.study-option').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();chosenStudy=b.dataset.study;window.MAPOMultiRoom?.setStudyType?.(chosenStudy);config();},true));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.MAPOModuleNavigator={typeScreen,config,hub,openModule,selectType:key=>{chosenStudy=key;window.MAPOMultiRoom?.setStudyType?.(key);},getSelectedStudy:()=>chosenStudy};
})();
