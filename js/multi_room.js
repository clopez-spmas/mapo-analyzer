/* MAPO Analyzer — estado de unidades/salas y acceso a módulos. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const state={rooms:[],active:0,study:null};
 const clone=o=>JSON.parse(JSON.stringify(o??{}));
 const show=(id,v)=>{const e=$(id);if(e)e.hidden=!v;};
 const currentRoom=()=>state.rooms[state.active];
 const label=(r,i)=>r?.name?.trim()||`Unidad ${i+1}`;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function readNames(){document.querySelectorAll('[data-room-name]').forEach((e,i)=>{if(state.rooms[i])state.rooms[i].name=e.value.trim()||`Planta/Sala/Sección ${i+1}`;});}
 function capture(){const r=currentRoom();if(!r)return;try{window.MAPOStudyIO?.captureCurrentStep?.()}catch(_){}const s=typeof window.MAPOReportState==='function'?window.MAPOReportState():null;const currentForm=s?.form||window.formData||{};const currentResult=s?.result||{};if(currentForm&&Object.keys(currentForm).length)r.formData=clone(currentForm);r.currentStep=Number(currentStep)||0;if(currentResult&&Object.keys(currentResult).length)r.lastResult=clone(currentResult);}
 function restoreCurrentRoom(){const r=currentRoom();if(!r)return false;selectedStudy=state.study;currentStep=Number(r.currentStep)||0;formData=clone(r.formData||{});lastResult=Object.keys(r.lastResult||{}).length?clone(r.lastResult):null;return true;}
 function syncCurrentRoom(){capture();return currentRoom()||null;}
 function renderNames(n){n=Math.max(1,Math.min(50,Number(n)||1));readNames();const list=$('roomNames');if(!list)return;const old=state.rooms;state.rooms=Array.from({length:n},(_,i)=>({name:old[i]?.name||`Planta/Sala/Sección ${i+1}`,formData:old[i]?.formData||{},currentStep:old[i]?.currentStep||0,lastResult:old[i]?.lastResult||null}));list.innerHTML=state.rooms.map((r,i)=>`<label class="room-name-row"><span>Unidad ${i+1}</span><input data-room-name="${i}" type="text" value="${esc(r.name)}" placeholder="Ej.: Planta 2 · Medicina interna"></label>`).join('');}
 function openStudySetup(key){const err=$('error');if(err){err.textContent='';err.hidden=true;}state.study=key;state.active=0;show('accessScreen',false);show('studySelection',false);show('roomSetup',true);show('moduleHub',false);show('studyPanel',false);show('result',false);show('globalResults',false);prepareRoomSetup();window.MAPONavigation?.bindStandard?.();}
 function prepareRoomSetup(){const n=$('roomCount');renderNames(Number(n?.value)||1);window.MAPONavigation?.bindRoomSetup?.();}
 function setStudyType(k){state.study=k;}
 function renderModuleHub(){const hub=$('moduleHub');if(!hub)return;const study=MAPO_STUDIES[state.study];if(!study){show('moduleHub',false);return;}const steps=study.steps||[];const room=currentRoom();hub.innerHTML=`<div class="section-heading"><div><h2>Accesos directos a los módulos</h2><p>${esc(study.title)} · ${esc(label(room,state.active))}</p></div></div><p>Seleccione directamente el módulo que desea revisar o completar.</p><div class="module-hub-grid">${steps.map((s,i)=>`<button type="button" class="module-hub-item" data-hub-step="${i}"><span>Módulo ${i+1}</span><strong>${esc(s.title)}</strong></button>`).join('')}</div><div class="actions"><button type="button" class="secondary" id="moduleHubBack">Volver a identificación</button></div>`;hub.querySelectorAll('[data-hub-step]').forEach(b=>b.onclick=()=>openModule(Number(b.dataset.hubStep)));$('moduleHubBack').onclick=()=>{show('moduleHub',false);show('roomSetup',true);};show('roomSetup',false);show('studyPanel',false);show('result',false);show('globalResults',false);show('moduleHub',true);}
 function openHospitalDashboard(){const r=currentRoom();if(!r)return;if(selectedStudy===state.study&&typeof window.MAPOReportState==='function')capture();restoreCurrentRoom();show('roomSetup',false);show('moduleHub',false);show('studyPanel',true);show('result',false);show('globalResults',false);show('mapoSimulation',false);show('reportTablesPanel',false);show('wordReportPanel',false);show('planningPanel',false);show('multiRoomResultsHub',false);show('templateAdmin',false);ensureRoomNavigation();if(typeof window.showHospitalizacionDashboard==='function')window.showHospitalizacionDashboard();else if(typeof window.renderStep==='function')window.renderStep();updateBanner();}
 function openModule(step){const study=MAPO_STUDIES[state.study];if(!study||step<0||step>=study.steps.length)return;readNames();const r=currentRoom();selectedStudy=state.study;currentStep=step;formData=clone(r.formData||{});lastResult=r.lastResult?clone(r.lastResult):null;r.currentStep=step;show('moduleHub',false);show('roomSetup',false);show('studyPanel',true);show('result',false);show('globalResults',false);ensureRoomNavigation();renderStep();updateBanner();}
 function beginSelectedStudy(key){readNames();if(!state.rooms.length)renderNames(1);state.study=key||state.study;restoreCurrentRoom();if(state.study==='hospitalizacion')openHospitalDashboard();else renderModuleHub();}
 function updateBanner(){const b=$('currentRoomBanner'),r=currentRoom();if(b&&r)b.innerHTML=`<strong>Unidad en estudio:</strong> ${esc(label(r,state.active))}<span> · ${state.active+1} de ${state.rooms.length}</span>`;const s=$('roomSelector');if(s){s.innerHTML=state.rooms.map((r,i)=>`<option value="${i}" ${i===state.active?'selected':''}>${esc(label(r,i))}</option>`).join('');s.value=String(state.active);s.disabled=state.rooms.length<=1;}}
 function ensureRoomNavigation(){const p=$('studyPanel');if(!p)return false;let nav=$('roomNavigation');if(!nav){const h=p.querySelector('.section-heading');nav=document.createElement('div');nav.id='roomNavigation';if(h)h.insertAdjacentElement('afterend',nav);nav.innerHTML='<div class="schedule-preview"><strong>Unidad de estudio</strong><label>Seleccionar sala/planta/sección <select id="roomSelector" aria-label="Seleccionar sala, planta o sección"></select></label><p class="small">Seleccione aquí la unidad cuyos datos va a introducir. Los datos de cada unidad se conservan por separado.</p></div>';}let selector=$('roomSelector');if(selector&&!selector.dataset.roomBound){selector.addEventListener('change',e=>switchRoom(Number(e.target.value)));selector.dataset.roomBound='1';}let banner=$('currentRoomBanner');if(!banner){banner=document.createElement('div');banner.id='currentRoomBanner';banner.className='schedule-preview';const fc=p.querySelector('#formContainer');if(fc)fc.insertAdjacentElement('beforebegin',banner);}updateBanner();return true;}
 function header(){ensureRoomNavigation();}
 function switchRoom(i){if(i<0||i>=state.rooms.length)return;const err=$('error');if(err){err.textContent='';err.hidden=true;}capture();state.active=i;restoreCurrentRoom();show('result',false);if(state.study==='hospitalizacion')openHospitalDashboard();else renderModuleHub();}
 function previousStep(){if(currentStep<=0)return;capture();currentStep--;currentRoom().currentStep=currentStep;renderStep();updateBanner();window.MAPONavigation?.bindStandard?.();}
 function nextStep(){if(selectedStudy==='hospitalizacion'&&document.querySelector('#formContainer .dashboard-grid')){currentStep=0;currentRoom().currentStep=0;renderStep();updateBanner();window.MAPONavigation?.bindStandard?.();return;}const total=MAPO_STUDIES[selectedStudy].steps.length;if(currentStep>=total-1)return;capture();currentStep++;currentRoom().currentStep=currentStep;renderStep();updateBanner();window.MAPONavigation?.bindStandard?.();}
 async function saveMultiStudy(){capture();if(state.study==='hospitalizacion')state.rooms.forEach(r=>{r.lastResult=window.MAPOStudyIO?.refreshCalculatedResult?.(r.formData,r.lastResult)||r.lastResult;});await window.MAPOStudyIO.saveJson({format:'MAPO Analyzer Multi-Room Study',schemaVersion:4,savedAt:new Date().toISOString(),study:state.study,active:state.active,rooms:clone(state.rooms)},'MAPO_estudio_multi_sala.json');}
 async function loadMultiStudyFile(file){try{const d=JSON.parse(await file.text());if(d?.format!=='MAPO Analyzer Multi-Room Study'||!Array.isArray(d.rooms))throw Error('El archivo no es un estudio MAPO multi-sala válido.');state.rooms=d.rooms.map((r,i)=>({name:r.name||`Unidad ${i+1}`,formData:r.formData||{},currentStep:(d.study==='hospitalizacion'&&Number(d.schemaVersion||1)<4?(Number(d.schemaVersion||1)===3?(Number(r.currentStep)||0)+((Number(r.currentStep)||0)>=9?1:0):([0,2,5,14,7,1,3,4,6,8,10,11,12,13,15][(Number(r.currentStep)||0)+(Number(d.schemaVersion||1)<2&&Number(r.currentStep)>0?5:0)]??0)):(Number(r.currentStep)||0)),lastResult:r.lastResult||null}));state.active=Math.max(0,Math.min(state.rooms.length-1,Number(d.active)||0));state.study=d.study||null;if(state.study==='hospitalizacion'){selectedStudy=state.study;state.rooms.forEach(r=>{r.lastResult=window.MAPOStudyIO?.refreshCalculatedResult?.(r.formData,r.lastResult)||r.lastResult;});}if(state.study)beginSelectedStudy(state.study);else{show('roomSetup',true);renderNames(state.rooms.length);prepareRoomSetup();}}catch(e){const x=$('error');if(x){x.textContent=e.message;x.hidden=false;}}}

 // Evaluación conjunta: sumar datos no compartidos de las salas y reutilizar
 // exactamente el motor de cálculo de hospitalización, sin medias de índices.
 function globalMAPO(){
  syncCurrentRoom();
  if(state.study!=='hospitalizacion'||!state.rooms.length)return null;
  const rooms=state.rooms.map((room,i)=>({name:label(room,i),form:room.formData||{},result:room.lastResult||{}}));
  const missing=rooms.filter(({form})=>!(Number(form.op)>0)||!Number.isFinite(Number(form.nc))||!Number.isFinite(Number(form.pc)));
  if(missing.length)throw Error('Faltan OP, NC o PC válidos en: '+missing.map(r=>r.name).join(', '));
  const merged={nc:0,pc:0,na:0,op:0,mobilizations:{entries:{}},wheelchairs:{entries:{},custom:[]},bathTypes:[],wcTypes:[],roomTypes:[]};
  const fields=['manualTotal','manualPartial','aidedTotal','aidedPartial'];
  let trained=0,base=0,infoTrained=0;
  for(let i=0;i<rooms.length;i++){
   const f=rooms[i].form,prefix='s'+i+'_';
   for(const key of ['nc','pc','op'])merged[key]+=Number(f[key]||0);
   for(const key of ['bathTypes','wcTypes','roomTypes'])merged[key].push(...clone(f[key]||[]));
   const entries=f.mobilizations?.entries||{};
   for(const [key,e] of Object.entries(entries)){
    const aggregate=merged.mobilizations.entries[key]||{manualTotal:[0,0,0],manualPartial:[0,0,0],aidedTotal:[0,0,0],aidedPartial:[0,0,0]};
    fields.forEach(k=>[0,1,2].forEach(j=>aggregate[k][j]+=Number(e?.[k]?.[j]||0)));
    merged.mobilizations.entries[key]=aggregate;
   }
   for(const [key,e] of Object.entries(f.wheelchairs?.entries||{})){
    const x=merged.wheelchairs.entries[prefix+key]=clone(e);
    if(Number(x.count||0)<=0)delete merged.wheelchairs.entries[prefix+key];
   }
   const weight=Number(f.op)||0;
   base+=weight;
   trained+=Number.isFinite(Number(f.ff_personas_formadas))&&f.ff_personas_formadas!==''?Number(f.ff_personas_formadas):weight*Number(f.ff_cobertura||0)/100;
   infoTrained+=Number.isFinite(Number(f.ff_personas_informadas))&&f.ff_personas_informadas!==''?Number(f.ff_personas_informadas):weight*(f.ff_informacion===true?1:0);
  }
  merged.na=merged.nc+merged.pc;
  merged.ff_cobertura=base?100*trained/base:0;
  merged.ff_curso=rooms.every(x=>x.form.ff_curso===true);
  merged.ff_antiguedad=rooms.every(x=>x.form.ff_antiguedad===true);
  merged.ff_eficacia=rooms.every(x=>x.form.ff_eficacia===true);
  merged.ff_informacion=base>0&&infoTrained/base>=.9;
  // La suficiencia no puede asumirse por intercambio de equipos entre salas.
  for(const k of ['fs_elevadores','fs_camillas','fs_camas3','fa_sabana','fa_dos','fa_camas3']){
   merged[k]=rooms.every(x=>x.form[k]===true);
  }
  const factors=window.MAPOCalculationEngine?.calculateHospitalizacionFactors?.(merged);
  if(!factors||!['fs','fa','fc','famb','ff'].every(k=>Number.isFinite(factors[k])))throw Error('No se puede calcular MAPO global: faltan factores válidos.');
  const mapo=((merged.nc/merged.op*factors.fs)+(merged.pc/merged.op*factors.fa))*factors.fc*factors.famb*factors.ff;
  return {merged,result:{...factors,mapo,nivel:mapo===0?'Ausente':mapo<=1.5?'Aceptable':mapo<=5?'Medio':'Alto'},rooms};
 }
 function init(){const n=$('roomCount');if(n&&!n.dataset.multiRoomBound){n.dataset.multiRoomBound='1';const f=()=>renderNames(Number(n.value)||1);n.addEventListener('input',f);n.addEventListener('change',f);}$('loadMultiStudyFile')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)loadMultiStudyFile(f);e.target.value='';});setTimeout(()=>ensureRoomNavigation(),0);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPOMultiRoom={state,openStudySetup,prepareRoomSetup,beginSelectedStudy,setStudyType,saveMultiStudy,loadMultiStudyFile,switchRoom,previousStep,nextStep,renderNames,renderModuleHub,openModule,openHospitalDashboard,syncCurrentRoom,restoreCurrentRoom,globalMAPO};
})();