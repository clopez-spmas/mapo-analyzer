/* MAPO Analyzer — navegación principal. Solo controla navegación/UI; NO contiene fórmulas ni cálculos. */
(function(){
'use strict';
const STUDY_TITLES={hospitalizacion:'Salas de hospitalización',ambulatorio:'Servicios ambulatorios',quirurgica:'Área quirúrgica'};
const MODULES={hospitalizacion:[{step:1,title:'Personas trabajadoras',desc:'Trabajadores que realizan movilización manual de pacientes.'},{step:2,title:'Pacientes',desc:'Datos de pacientes colaboradores y no colaboradores.'},{step:3,title:'Tareas de movilización',desc:'Registro separado de los cuatro tipos de movilización.'},{step:4,title:'Factor de elevación (FS)',desc:'Equipamiento para levantamientos totales.'},{step:5,title:'Ayudas menores (FA)',desc:'Disponibilidad y adecuación de ayudas menores.'},{step:6,title:'Factor de sillas de ruedas (FC)',desc:'Sillas de ruedas y puntuación de inadecuación.'},{step:7,title:'Baños',desc:'Baños para higiene y baños con WC.'},{step:8,title:'Habitaciones',desc:'Condiciones de las habitaciones y PMH.'},{step:9,title:'Formación (FF)',desc:'Formación de las personas trabajadoras.'}],ambulatorio:[{step:1,title:'Personas trabajadoras',desc:'Personas que realizan movilización manual de pacientes.'},{step:2,title:'Pacientes',desc:'Pacientes incluidos en el estudio.'},{step:3,title:'Factores del modelo',desc:'Factores específicos del servicio ambulatorio.'}],quirurgica:[{step:1,title:'Personas trabajadoras',desc:'Personas que realizan movilización manual.'},{step:2,title:'Organización e intervenciones',desc:'Intervenciones y movilizaciones.'},{step:3,title:'Factores del modelo',desc:'Factores específicos del área quirúrgica.'}]};
const $=id=>document.getElementById(id);
const show=(id,v)=>{const e=$(id);if(e)e.hidden=!v;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let flowStep=0; // 0 inicio, 1 tipo de estudio, 2 configuración, 3 acceso directo, 4 módulos
let chosenStudy=null;

function save(){try{if(typeof window.MAPOStudyIO?.captureCurrentStep==='function')window.MAPOStudyIO.captureCurrentStep();}catch(_e){} }
function saveStudy(){const b=$('saveMultiStudy');if(b)b.click();}
function loadStudy(){const b=$('loadMultiStudy');if(b)b.click();}
function baseActions(prev,next,extra=''){return `<div class="actions main-flow-actions"><button type="button" id="flowPrevious" class="secondary">Anterior</button>${extra}<button type="button" id="flowSave" class="secondary">Guardar estudio</button><button type="button" id="flowLoad" class="secondary">Cargar estudio</button><button type="button" id="flowNext">Siguiente</button></div>`;}
function hideAll(){show('accessScreen',false);show('studySelection',false);show('roomSetup',false);show('moduleHub',false);show('studyPanel',false);show('result',false);show('globalResults',false);}
function setCommonNav(host,prev,next,opts={}){
  const old=host.querySelector('.main-flow-actions');if(old)old.remove();
  host.insertAdjacentHTML('beforeend',baseActions(prev,next,opts.extra||''));
  const p=$('flowPrevious'),n=$('flowNext'),s=$('flowSave'),l=$('flowLoad');
  p.onclick=()=>prev();n.onclick=()=>next();s.onclick=()=>saveStudy();l.onclick=()=>loadStudy();
  p.disabled=!!opts.disablePrev;n.disabled=!!opts.disableNext;
}
function ensureHub(){let hub=$('moduleHub');if(hub)return hub;hub=document.createElement('section');hub.id='moduleHub';hub.className='card module-hub';hub.hidden=true;const sel=$('studySelection');sel?.insertAdjacentElement('afterend',hub);return hub;}
function renderHub(key){
 const hub=ensureHub(),mods=MODULES[key]||[];
 hub.innerHTML=`<div class="module-hub-heading"><div><span class="module-hub-badge">Acceso directo a módulos</span><h2>${esc(STUDY_TITLES[key]||'Estudio MAPO')}</h2><p>Seleccione directamente el apartado que desea cumplimentar.</p></div></div><div class="module-hub-grid">${mods.map(m=>`<button type="button" class="module-hub-item" data-hub-step="${m.step}"><span>Módulo ${m.step}</span><strong>${esc(m.title)}</strong><small>${esc(m.desc)}</small></button>`).join('')}</div><div class="module-hub-actions"><button type="button" id="hubCalculate">Cálculo MAPO</button><button type="button" id="hubSimulation" class="secondary">Simulación MAPO</button><button type="button" id="hubTables" class="secondary">Descargar tablas MAPO</button><button type="button" id="hubReport" class="secondary">Descargar informe MAPO</button></div>`;
 hub.querySelectorAll('[data-hub-step]').forEach(b=>b.onclick=()=>openModule(key,Number(b.dataset.hubStep)));
 $('hubCalculate').onclick=()=>openCalculation(key);$('hubSimulation').onclick=openSimulation;$('hubTables').onclick=openTables;$('hubReport').onclick=openReport;
 setCommonNav(hub,()=>goConfig(),()=>openModule(key,1),{extra:'',disableNext:!mods.length});
 return hub;
}
function goHome(){hideAll();show('accessScreen',true);flowStep=0;window.scrollTo({top:0,behavior:'smooth'});}
function goStudyType(){hideAll();show('studySelection',true);flowStep=1;decorateStudyType();window.scrollTo({top:0,behavior:'smooth'});}
function goConfig(){hideAll();show('roomSetup',true);flowStep=2;window.scrollTo({top:0,behavior:'smooth'});}
function goHub(){if(!chosenStudy)return goStudyType();hideAll();show('moduleHub',true);flowStep=3;renderHub(chosenStudy);window.scrollTo({top:0,behavior:'smooth'});}
function goModulesStart(){openModule(chosenStudy,1);}
function decorateStudyType(){const host=$('studySelection');if(!host)return;setCommonNav(host,goHome,()=>{if(!chosenStudy){const selected=document.querySelector('.study-option.selected');if(selected)chosenStudy=selected.dataset.study;}if(!chosenStudy){alert('Seleccione qué desea estudiar antes de continuar.');return;}goConfig();},{disableNext:false});}
function decorateConfig(){const host=$('roomSetup');if(!host)return;setCommonNav(host,goStudyType,()=>{if($('startRooms'))$('startRooms').click();setTimeout(()=>goHub(),0);});}
function selectType(key){chosenStudy=key;document.querySelectorAll('.study-option').forEach(b=>b.classList.toggle('selected',b.dataset.study===key));}
function openModule(key,step){chosenStudy=key;hideAll();show('studyPanel',true);if(typeof window.selectStudy==='function')window.selectStudy(key);setTimeout(()=>{if(typeof window.renderStep==='function'){currentStep=step;window.renderStep();}decorateModuleNavigation(key,step);},0);}
function decorateModuleNavigation(key,step){const panel=$('studyPanel');if(!panel)return;const old=panel.querySelector('.module-flow-actions');if(old)old.remove();const mods=MODULES[key]||[];const idx=mods.findIndex(m=>m.step===step);const prev=idx>0?mods[idx-1]:null,next=idx<mods.length-1?mods[idx+1]:null;const div=document.createElement('div');div.className='actions module-flow-actions';div.innerHTML=`<button type="button" id="modulePrevious" class="secondary">Anterior</button><button type="button" id="moduleSave" class="secondary">Guardar estudio</button><button type="button" id="moduleLoad" class="secondary">Cargar estudio</button><button type="button" id="moduleNext">Siguiente</button>`;panel.appendChild(div);$('modulePrevious').onclick=()=>prev?openModule(key,prev.step):goHub();$('moduleNext').onclick=()=>next?openModule(key,next.step):openCalculation(key);$('moduleSave').onclick=saveStudy;$('moduleLoad').onclick=loadStudy;}
function openCalculation(key){hideAll();show('studyPanel',true);chosenStudy=key;if(typeof window.selectStudy==='function')window.selectStudy(key);const last=(MODULES[key]||[]).at(-1)?.step||1;setTimeout(()=>{if(typeof window.renderStep==='function'){currentStep=last;window.renderStep();}$('calculate')?.scrollIntoView({behavior:'smooth',block:'center'});decorateModuleNavigation(key,last);},0);}
function openSimulation(){const b=$('openMapoSimulation');if(b)b.click();else show('mapoSimulation',true);}
function openTables(){const b=$('openReportTables');if(b)b.click();else alert('Las tablas MAPO estarán disponibles desde el resultado.');}
function openReport(){const b=$('generateReport');if(b)b.click();else alert('El informe MAPO se genera desde el resultado.');}
function install(){
 const enter=$('enterProgram');if(enter)enter.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();goStudyType();},true);
 document.querySelectorAll('.study-option').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();selectType(b.dataset.study);},true));
 decorateStudyType();decorateConfig();
 observeMobilizations();
}
function observeMobilizations(){const host=$('formContainer');if(!host)return;const decorate=()=>{if(!host.querySelector('.task-table')||host.querySelector('.mobilization-subnav'))return;const rows=[...host.querySelectorAll('.task-shift')];if(!rows.length)return;const defs=[['ta','Movilizaciones totales con ayuda','M_T_N'],['pa','Movilizaciones parciales con ayuda','m-t-n'],['tm','Movilizaciones totales sin ayuda','m-t-n'],['pm','Movilizaciones parciales sin ayuda','m-t-n']];const nav=document.createElement('div');nav.className='mobilization-subnav';nav.innerHTML=defs.map((d,i)=>`<button type="button" class="mobilization-subtab${i?'':' active'}" data-mob-kind="${d[0]}"><strong>${d[1]}</strong><span>${d[2]}</span></button>`).join('');const intro=document.createElement('div');intro.className='mobilization-current';host.querySelector('.task-table').insertAdjacentElement('beforebegin',nav);nav.insertAdjacentElement('afterend',intro);const apply=k=>{const d=defs.find(x=>x[0]===k);intro.innerHTML=`<strong>Estamos en: ${d[1]}</strong><span>Código: ${d[2]}</span>`;nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.mobKind===k));rows.forEach(r=>r.querySelectorAll('label').forEach(l=>{const i=l.querySelector('input[data-kind]');if(i)l.hidden=i.dataset.kind!==k;}));host.querySelectorAll('.custom-four input').forEach(i=>i.hidden=i.dataset.kind!==k);};nav.querySelectorAll('button').forEach(b=>b.onclick=()=>apply(b.dataset.mobKind));apply('ta');};new MutationObserver(decorate).observe(host,{childList:true,subtree:true});decorate();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.MAPOModuleNavigator={goHome,goStudyType,goConfig,goHub,openModule,renderHub,selectType};
})();