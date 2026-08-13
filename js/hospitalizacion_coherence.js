/* Hospitalización: coherencia de datos y pantallas de captura. No modifica OCRA. */
(function(){
  const originalRenderStep=window.renderStep;
  const originalSaveStep=window.saveStep;

  const YESNO=(id,label,help)=>({id,label,help});
  const SCORE_HELP={
    chair:'Marque Sí cuando la silla presente la característica de inadecuación indicada. Las características descriptivas se registran aparte y no suman puntos.',
    bath:'Marque Sí cuando la característica de inadecuación esté presente. La puntuación se calcula automáticamente según la ficha de hospitalización.',
    room:'Marque Sí cuando la característica de inadecuación esté presente. Los datos descriptivos no suman puntos.'
  };

  function arr(key){return formData[key]||[];}
  function typeScore(item,fields){return fields.reduce((s,f)=>s+(item[f.id]===true?f.points:0),0);}
  function weighted(items){let n=0,total=0;items.forEach(x=>{const u=Number(x.units||0);if(u>0){n+=u;total+=u*Number(x.score||0);}});return n?total/n:null;}

  const chairFields=[
    YESNO('brakes','Funcionamiento inadecuado de los frenos',SCORE_HELP.chair),
    YESNO('arms','Reposabrazos no extraíbles o abatibles',SCORE_HELP.chair),
    YESNO('back','Respaldo inadecuado: altura >90 cm o inclinación >100°',SCORE_HELP.chair),
    YESNO('width','Anchura máxima inadecuada: >70 cm',SCORE_HELP.chair)
  ]; chairFields.forEach(f=>f.points=1);
  const bathFields=[
    {id:'space',label:'Espacio insuficiente para el uso de ayudas',points:2,help:SCORE_HELP.bath},
    {id:'door',label:'Anchura de la puerta inferior a 85 cm',points:1,help:SCORE_HELP.bath},
    {id:'obstacles',label:'Presencia de obstáculos fijos',points:1,help:SCORE_HELP.bath}
  ];
  const wcFields=[
    {id:'space',label:'Espacio insuficiente para el uso de silla de ruedas',points:2,help:SCORE_HELP.bath},
    {id:'height',label:'Altura del WC inadecuada (inferior a 50 cm)',points:1,help:SCORE_HELP.bath},
    {id:'bar',label:'Ausencia o inadecuación de la barra de apoyo lateral',points:1,help:SCORE_HELP.bath},
    {id:'door',label:'Anchura de la puerta inferior a 85 cm',points:1,help:SCORE_HELP.bath},
    {id:'lateral',label:'Espacio lateral entre WC y pared inferior a 80 cm',points:1,help:SCORE_HELP.bath}
  ];
  const roomFields=[
    {id:'between',label:'Espacio entre cama y cama o cama y pared inferior a 90 cm',points:2,help:SCORE_HELP.room},
    {id:'foot',label:'Espacio libre desde los pies de cama inferior a 120 cm',points:2,help:SCORE_HELP.room},
    {id:'bedSection',label:'Cama inadecuada: requiere levantamiento manual de una sección',points:1,help:SCORE_HELP.room},
    {id:'underbed',label:'Espacio entre cama y suelo inferior a 15 cm',points:2,help:SCORE_HELP.room},
    {id:'chairHeight',label:'Altura del asiento del sillón de descanso inferior a 50 cm',points:0.5,help:SCORE_HELP.room}
  ];

  function yesNoField(id,name,checked){return `<label class="choice"><input type="radio" name="${id}_${name}" data-reg-yes="${name}" value="yes" ${checked===true?'checked':''}> Sí</label><label class="choice"><input type="radio" name="${id}_${name}" data-reg-no="${name}" value="no" ${checked===false?'checked':''}> No</label>`;}
  function registryRows(kind,items,fields){
    return items.map((x,i)=>`<div class="registry-card"><div class="registry-card-head"><h4>${kind==='chair'?'Tipo de silla':kind==='bath'?'Tipo de baño para higiene':kind==='wc'?'Tipo de baño con WC':'Tipo de habitación'} ${i+1}</h4><button type="button" class="help-trigger" data-reg-help="${kind}_${i}">?</button></div><div class="grid"><label>Descripción<input type="text" data-reg-kind="${kind}" data-reg-index="${i}" data-reg-field="description" value="${x.description||''}"></label><label>${kind==='room'?'Número de habitaciones':'Número de unidades'}<input type="number" min="1" step="1" data-reg-kind="${kind}" data-reg-index="${i}" data-reg-field="units" value="${x.units??''}"></label></div><div class="registry-questions">${fields.map(f=>`<div class="registry-question"><span>${f.label}</span><div class="choice-row">${yesNoField(`${kind}_${i}`,f.id,x[f.id])}</div><div class="small">${f.help}</div></div>`).join('')}</div><div class="grid descriptive-grid">${kind==='chair'?'<label>Reposapiés no extraíble/no reclinable<input type="text" data-reg-kind="chair" data-reg-index="'+i+'" data-reg-field="footrest" value="'+(x.footrest||'')+'"></label><label>Mal estado de mantenimiento<input type="text" data-reg-kind="chair" data-reg-index="'+i+'" data-reg-field="maintenance" value="'+(x.maintenance||'')+'"></label>':''}${kind==='bath'?'<label>Apertura de puerta hacia adentro<input type="text" data-reg-kind="bath" data-reg-index="'+i+'" data-reg-field="doorInward" value="'+(x.doorInward||'')+'"></label><label>Presencia de ducha / bañera fija<input type="text" data-reg-kind="bath" data-reg-index="'+i+'" data-reg-field="fixtures" value="'+(x.fixtures||'')+'"></label>':''}${kind==='wc'?'<label>Apertura de puerta hacia adentro<input type="text" data-reg-kind="wc" data-reg-index="'+i+'" data-reg-field="doorInward" value="'+(x.doorInward||'')+'"></label>':''}${kind==='room'?'<label>Obstáculos fijos / observaciones<input type="text" data-reg-kind="room" data-reg-index="'+i+'" data-reg-field="observations" value="'+(x.observations||'')+'"></label><label>Altura de cama fija (cm)<input type="number" min="0" step="0.1" data-reg-kind="room" data-reg-index="'+i+'" data-reg-field="bedHeight" value="'+(x.bedHeight??'')+'"></label><label>Barras laterales inadecuadas<input type="text" data-reg-kind="room" data-reg-index="'+i+'" data-reg-field="sideRails" value="'+(x.sideRails||'')+'"></label><label>Anchura de puerta (cm)<input type="number" min="0" step="0.1" data-reg-kind="room" data-reg-index="'+i+'" data-reg-field="doorWidth" value="'+(x.doorWidth??'')+'"></label><label>Cama sin ruedas<input type="text" data-reg-kind="room" data-reg-index="'+i+'" data-reg-field="noWheels" value="'+(x.noWheels||'')+'"></label>':''}</div><div class="question-help-popover" id="regHelp_${kind}_${i}" hidden>Revise las condiciones de la ficha MAPO antes de agrupar unidades. Solo agrupe unidades que sean exactamente iguales respecto a las características evaluadas.</div></div>`).join('');
  }
  function registry(kind,title,items,fields,max=50){
    return `<div class="registry-intro"><p><strong>Puede agrupar unidades exactamente iguales</strong> o registrar cada unidad por separado. El programa calcula la puntuación media automáticamente.</p><button type="button" class="help-trigger" data-reg-general="${kind}">?</button><div class="help-popover" id="regGeneral_${kind}" hidden>Si dos unidades no son exactamente iguales en las características que afectan a la puntuación, regístrelas como tipos diferentes. Límite de ${max} tipos agrupados.</div></div><div id="registry_${kind}">${registryRows(kind,items,fields)}</div><button type="button" class="secondary" data-add-reg="${kind}" ${items.length>=max?'disabled':''}>+ Añadir tipo</button><div id="registrySummary_${kind}" class="schedule-preview"></div>`;
  }
  function renderFC(){const items=arr('wheelchairTypes');return `<div class="step-title-row"><h3>Factor de sillas de ruedas (FC)</h3><button type="button" class="help-trigger" data-reg-general="chair">?</button><div class="help-popover" id="regGeneral_chair" hidden>La ficha calcula PMSR a partir de las características de inadecuación de las sillas y después comprueba si el número total de sillas es al menos el 50% de NA.</div></div>${registry('chair','Sillas de ruedas',items,chairFields,50)}<p class="small">NA se obtiene automáticamente de la tipología de pacientes: NC + PC.</p>`;}
  function renderEnvironment(kind){const items=arr(kind);const cfg=kind==='bath'?{title:'Baños para la higiene (PMB)',fields:bathFields}:kind==='wc'?{title:'Baños con WC (PMWC)',fields:wcFields}:{title:'Habitaciones (PMH)',fields:roomFields};return `<div class="step-title-row"><h3>${cfg.title}</h3><button type="button" class="help-trigger" data-reg-general="${kind}">?</button><div class="help-popover" id="regGeneral_${kind}" hidden>Registre tipos exactamente iguales juntos y utilice un tipo distinto cuando cambie alguna condición evaluada.</div></div>${registry(kind,cfg.title,items,cfg.fields,50)}<div id="environmentSummary_${kind}" class="schedule-preview"></div>`;}
  function readRegistry(kind){const old=arr(kind).slice();document.querySelectorAll(`[data-reg-kind="${kind}"]`).forEach(el=>{const i=Number(el.dataset.regIndex),f=el.dataset.regField;old[i]??={};old[i][f]=el.type==='number'?(el.value===''?'':Number(el.value)):el.value;});document.querySelectorAll(`input[data-reg-kind="${kind}"][type="radio"]`).forEach(()=>{});document.querySelectorAll(`[name^="${kind}_"]`).forEach(r=>{if(!r.checked)return;const m=r.name.match(new RegExp('^'+kind+'_(\\d+)$'));if(!m)return;const i=Number(m[1]),field=r.value==='yes'?r.dataset.regYes:r.dataset.regNo;old[i]??={};old[i][field]=r.value==='yes';});formData[kind==='chair'?'wheelchairTypes':kind+'Types']=old;updateRegistrySummary(kind);}
  function getItems(kind){return arr(kind);}
  function summary(kind){const items=getItems(kind);const total=items.reduce((s,x)=>s+Number(x.units||0),0);const fields=kind==='chair'?chairFields:kind==='bath'?bathFields:kind==='wc'?wcFields:roomFields;items.forEach(x=>x.score=typeScore(x,fields));const mean=weighted(items);return{items,total,mean};}
  function updateRegistrySummary(kind){const id=kind==='chair'?'wheelchairTypes':kind+'Types';const items=formData[id]||[];const fields=kind==='chair'?chairFields:kind==='bath'?bathFields:kind==='wc'?wcFields:roomFields;items.forEach(x=>x.score=typeScore(x,fields));const s=weighted(items);const e=$(`registrySummary_${kind}`);if(e)e.innerHTML=`<strong>${kind==='chair'?'TSR / PMSR':kind==='bath'?'PMB':kind==='wc'?'PMWC':'PMH'}</strong>: ${s===null?'Pendiente':s.toFixed(2)} · Unidades: ${items.reduce((n,x)=>n+Number(x.units||0),0)}`;}
  function bindRegistry(kind){document.querySelectorAll(`[data-reg-kind="${kind}"]`).forEach(el=>el.addEventListener(el.type==='radio'?'change':'input',()=>{readRegistry(kind);}));document.querySelectorAll(`[data-reg-help],[data-reg-general]`).forEach(b=>b.onclick=()=>{const id=b.dataset.regHelp?`regHelp_${b.dataset.regHelp}`:`regGeneral_${b.dataset.regGeneral}`;const box=$(id);if(!box)return;const was=box.hidden;document.querySelectorAll('.help-popover,.question-help-popover').forEach(x=>x.hidden=true);box.hidden=!was;});const add=$(`[data-add-reg="${kind}"]`);if(add)add.onclick=()=>{const key=kind==='chair'?'wheelchairTypes':kind+'Types';formData[key]=formData[key]||[];if(formData[key].length>=50)return;formData[key].push({});renderStep();};}
  function getEnvironmentValue(kind){const key=kind==='chair'?'wheelchairTypes':kind+'Types';const items=formData[key]||[];const fields=kind==='chair'?chairFields:kind==='bath'?bathFields:kind==='wc'?wcFields:roomFields;items.forEach(x=>x.score=typeScore(x,fields));return weighted(items);}
  function renderWrapped(){const study=MAPO_STUDIES[selectedStudy],step=study.steps[currentStep];if(step.questionGroup==='fc'){renderFC();bindRegistry('chair');updateRegistrySummary('chair');return;}if(step.title==='Factor ambiente — baños'){renderEnvironment('bath');bindRegistry('bath');updateRegistrySummary('bath');return;}if(step.custom==='pmh'){renderEnvironment('room');bindRegistry('room');updateRegistrySummary('room');return;}originalRenderStep();}
  window.renderStep=renderWrapped;
  window.saveStep=function(){const study=MAPO_STUDIES[selectedStudy],step=study.steps[currentStep];if(step.questionGroup==='fc'){readRegistry('chair');return;}if(step.title==='Factor ambiente — baños'){readRegistry('bath');readRegistry('wc');return;}if(step.custom==='pmh'){readRegistry('room');return;}originalSaveStep();};
  window.calculateHospitalizacionFactors=function(d){
    if(window.getHospitalizacionPatientCounts){Object.assign(d,window.getHospitalizacionPatientCounts(d));}
    const officialIds=new Set(MAPO_TASKS.map(x=>x.id));let st=0,lta=0,sp=0,lpa=0;Object.entries(d.tasks||{}).forEach(([id,byShift])=>{if(!officialIds.has(id))return;Object.values(byShift||{}).forEach(r=>{st+=Number(r.tm||0)+Number(r.ta||0);lta+=Number(r.ta||0);sp+=Number(r.pm||0)+Number(r.pa||0);lpa+=Number(r.pa||0);});});
    const taskTotals={st,lta,sp,lpa,stp:st+sp,pLTA:st?100*lta/st:0,pLPA:sp?100*lpa/sp:0};
    const fsS=Number(d.nc||0)===0 ? true : (yn(d.fs_elevadores)||yn(d.fs_camillas)||yn(d.fs_camas3));
    const fsA=st>0&&lta/st>=.9;const fs=fsS&&fsA?.5:(!fsS&&!fsA?4:2);
    const faS=(yn(d.fa_sabana)&&yn(d.fa_dos))||(yn(d.fa_sabana)&&yn(d.fa_camas3));const faA=sp>0&&lpa/sp>=.9;const fa=faS&&faA?.5:1;
    const chairs=getEnvironmentValue('chair'),chairCount=(d.wheelchairTypes||[]).reduce((s,x)=>s+Number(x.units||0),0),na=Number(d.na||0),fcS=chairCount>=na*.5;let fc;if(chairs===null)fc=null;else if(chairs<=1.33)fc=fcS?.75:1;else if(chairs<=2.66)fc=fcS?1.12:1.5;else fc=fcS?1.5:2;
    const pmb=getEnvironmentValue('bath'),pmwc=getEnvironmentValue('wc'),pmh=getEnvironmentValue('room');const pmamb=[pmb,pmwc,pmh].every(x=>x!==null)?pmb+pmwc+pmh:null;const famb=pmamb===null?null:(pmamb<=5.8?.75:pmamb<=11.6?1.25:1.5);
    const course=yn(d.ff_curso),cov=Number(d.ff_cobertura||0),recent=yn(d.ff_antiguedad),eff=yn(d.ff_eficacia),info=yn(d.ff_informacion);const ff=(course&&cov>=75&&(recent||eff))?.75:(course&&cov>=50&&cov<75&&recent)||info?1:2;
    return{fs,fa,fc,famb,ff,taskTotals,details:{fsSufficient:fsS,fsAdequate:fsA,faSufficient:faS,faAdequate:faA,pmsr:chairs,tsr:chairCount,pmamb,pmB:pmb,pmWC:pmwc,pmH:pmh,fcSufficient:fcS}};
  };
})();
