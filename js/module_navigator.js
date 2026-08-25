/* Navegación visual del programa MAPO. No contiene fórmulas ni cálculos. */
(function(){
'use strict';
const MODULES={
 hospitalizacion:[
  {step:1,title:'Personas trabajadoras',desc:'Trabajadores que realizan movilización manual de pacientes.'},
  {step:2,title:'Pacientes',desc:'Datos de pacientes colaboradores y no colaboradores.'},
  {step:3,title:'Tareas de movilización',desc:'Registro separado de los cuatro tipos de movilización.'},
  {step:4,title:'Factor de elevación (FS)',desc:'Equipamiento para levantamientos totales.'},
  {step:5,title:'Ayudas menores (FA)',desc:'Disponibilidad y adecuación de ayudas menores.'},
  {step:6,title:'Factor de sillas de ruedas (FC)',desc:'Sillas de ruedas y puntuación de inadecuación.'},
  {step:7,title:'Baños',desc:'Baños para higiene y baños con WC.'},
  {step:8,title:'Habitaciones',desc:'Condiciones de las habitaciones y PMH.'},
  {step:9,title:'Formación (FF)',desc:'Formación de las personas trabajadoras.'}
 ],
 ambulatorio:[
  {step:1,title:'Personas trabajadoras',desc:'Personas que realizan movilización manual de pacientes.'},
  {step:2,title:'Pacientes',desc:'Pacientes incluidos en el estudio.'},
  {step:3,title:'Factores del modelo',desc:'Factores específicos del servicio ambulatorio.'}
 ],
 quirurgica:[
  {step:1,title:'Personas trabajadoras',desc:'Personas que realizan movilización manual.'},
  {step:2,title:'Organización e intervenciones',desc:'Intervenciones y movilizaciones.'},
  {step:3,title:'Factores del modelo',desc:'Factores específicos del área quirúrgica.'}
 ]
};
function $(id){return document.getElementById(id);}
function show(id,visible){const e=$(id);if(e)e.hidden=!visible;}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function currentStudy(){return window.MAPOStudiesUI?.selected||document.querySelector('.study-option[aria-pressed="true"]')?.dataset.study||null;}
function ensureHub(){let hub=$('moduleHub');if(hub)return hub;const selection=$('studySelection');const panel=$('studyPanel');if(!selection||!panel)return null;hub=document.createElement('section');hub.id='moduleHub';hub.className='card module-hub';hub.hidden=true;selection.insertAdjacentElement('afterend',hub);return hub;}
function renderHub(key){const hub=ensureHub();if(!hub)return;const study=window.MAPO_STUDIES?.[key]||{};const modules=MODULES[key]||[];hub.innerHTML=`<div class="module-hub-heading"><div><span class="module-hub-badge">Acceso rápido</span><h2>${escapeHtml(study.title||'Estudio MAPO')}</h2><p>Acceda directamente al módulo que desea cumplimentar. Los cálculos y fórmulas del programa no se modifican desde esta pantalla.</p></div></div><div class="module-hub-grid">${modules.map(m=>`<button type="button" class="module-hub-item" data-hub-step="${m.step}"><span>Módulo</span><strong>${escapeHtml(m.title)}</strong><small>${escapeHtml(m.desc)}</small></button>`).join('')}</div><div class="module-hub-actions"><button type="button" id="hubCalculate">Cálculo MAPO</button><button type="button" id="hubSimulation" class="secondary">Simulación MAPO</button><button type="button" id="hubTables" class="secondary">Descargar tablas MAPO</button><button type="button" id="hubReport" class="secondary">Descargar informe MAPO</button></div><div class="module-hub-secondary-actions"><button type="button" id="hubRooms" class="secondary">Configurar salas / plantas / secciones</button><button type="button" id="hubLoad" class="secondary">Cargar estudio JSON</button><button type="button" id="hubBackStudy" class="secondary">Cambiar tipo de estudio</button></div>`;
hub.querySelectorAll('[data-hub-step]').forEach(b=>b.addEventListener('click',()=>openModule(key,Number(b.dataset.hubStep))));
$('hubCalculate').onclick=()=>openCalculation(key);
$('hubSimulation').onclick=()=>openSimulation();
$('hubTables').onclick=()=>openTables();
$('hubReport').onclick=()=>openReport();
$('hubRooms').onclick=()=>openRooms();
$('hubLoad').onclick=()=>openLoad();
$('hubBackStudy').onclick=()=>backToStudySelection();
return hub;}
function openModule(key,step){show('moduleHub',false);show('studyPanel',true);show('result',false);if(typeof window.selectStudy==='function' && window.MAPOStudiesUI?.selected!==key){window.selectStudy(key);}const nav=document.querySelector(`[data-module-step="${step}"]`);if(nav){nav.click();return;}if(step===0&&typeof window.renderStep==='function')window.renderStep();}
function openCalculation(key){show('moduleHub',false);show('studyPanel',true);show('result',false);if(typeof window.selectStudy==='function' && window.MAPOStudiesUI?.selected!==key)window.selectStudy(key);const last=window.MAPO_STUDIES?.[key]?.steps?.length-1;if(last>=0){const b=document.querySelector(`[data-module-step="${last}"]`);if(b)b.click();}const calc=$('calculate');if(calc)calc.scrollIntoView({behavior:'smooth',block:'center'});}
function openSimulation(){const b=$('openMapoSimulation');if(b){b.click();return;}show('mapoSimulation',true);$('mapoSimulation')?.scrollIntoView({behavior:'smooth'});}
function openTables(){const b=$('openReportTables');if(b){show('studyPanel',true);b.click();return;}const panel=$('reportTablesPanel');if(panel){panel.hidden=false;panel.scrollIntoView({behavior:'smooth'});return;}alert('El módulo de tablas todavía no está disponible en esta pantalla.');}
function openReport(){const b=$('generateReport');if(b){show('studyPanel',true);show('result',true);b.click();return;}alert('El módulo de informe Word todavía no está disponible en esta pantalla.');}
function openRooms(){show('moduleHub',false);show('roomSetup',true);show('studySelection',false);show('studyPanel',false);show('result',false);}
function openLoad(){openRooms();$('loadMultiStudy')?.click();}
function backToStudySelection(){show('moduleHub',false);show('studyPanel',false);show('result',false);show('studySelection',true);}
function afterStudySelected(key){window.MAPOStudiesUI=window.MAPOStudiesUI||{};window.MAPOStudiesUI.selected=key;const hub=renderHub(key);show('studySelection',false);show('studyPanel',false);show('result',false);show('globalResults',false);show('moduleHub',true);hub?.scrollIntoView({behavior:'smooth',block:'start'});}
function decorateMobilizations(){const host=$('formContainer');if(!host||!host.querySelector('.task-table'))return;if(host.querySelector('.mobilization-subnav'))return;const rows=[...host.querySelectorAll('.task-shift')];if(!rows.length)return;const defs=[['ta','Movilizaciones totales con ayuda','M_T_N'],['pa','Movilizaciones parciales con ayuda','m-t-n'],['tm','Movilizaciones totales sin ayuda','m-t-n'],['pm','Movilizaciones parciales sin ayuda','m-t-n']];const nav=document.createElement('div');nav.className='mobilization-subnav';nav.innerHTML=defs.map((d,i)=>`<button type="button" class="mobilization-subtab${i===0?' active':''}" data-mob-kind="${d[0]}"><strong>${d[1]}</strong><span>${d[2]}</span></button>`).join('');const intro=document.createElement('div');intro.className='mobilization-current';const table=host.querySelector('.task-table');table.insertAdjacentElement('beforebegin',nav);nav.insertAdjacentElement('afterend',intro);function apply(kind){const d=defs.find(x=>x[0]===kind);intro.innerHTML=`<strong>Estamos en: ${d[1]}</strong><span>Código: ${d[2]} · Introduzca únicamente los movimientos de esta categoría.</span>`;host.querySelectorAll('.mobilization-subtab').forEach(b=>b.classList.toggle('active',b.dataset.mobKind===kind));rows.forEach(row=>row.querySelectorAll('label').forEach(label=>{const input=label.querySelector('input[data-kind]');label.hidden=!!input&&input.dataset.kind!==kind;}));host.querySelectorAll('.custom-four input').forEach(input=>{input.closest('input').hidden=input.dataset.kind!==kind;});host.querySelectorAll('.custom-four').forEach(box=>{box.style.display='grid';});}
nav.querySelectorAll('button').forEach(b=>b.onclick=()=>apply(b.dataset.mobKind));apply('ta');}
function observe(){const host=$('formContainer');if(!host)return;const mo=new MutationObserver(()=>decorateMobilizations());mo.observe(host,{childList:true,subtree:true});decorateMobilizations();}
function interceptAccessAndStudy(){const enter=$('enterProgram');if(enter)enter.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();show('accessScreen',false);show('studySelection',true);},true);document.querySelectorAll('.study-option').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const key=b.dataset.study;if(typeof window.selectStudy==='function')window.selectStudy(key);if(window.MAPOMultiRoom?.state){window.MAPOMultiRoom.state.study=key;window.MAPOMultiRoom.state.rooms=window.MAPOMultiRoom.state.rooms?.length?window.MAPOMultiRoom.state.rooms:[{name:'Unidad 1',formData:{},currentStep:0,lastResult:null}];}afterStudySelected(key);},true));}
function init(){interceptAccessAndStudy();observe();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOModuleNavigator={afterStudySelected,openModule,renderHub,decorateMobilizations};
})();
