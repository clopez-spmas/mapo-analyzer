/* Baños separados en dos subpantallas. Cambio exclusivamente visual/navegación del bloque de baños. */
(function(){
  let bathSubStep=0;
  const originalRender=window.renderStep;
  const originalSave=window.saveStep;
  const fields={
    bath:[['space','Espacio insuficiente para el uso de ayudas',2],['door','Anchura de la puerta < 85 cm',1],['obstacles','Presencia de obstáculos fijos',1]],
    wc:[['space','Espacio insuficiente para el uso de silla de ruedas',2],['height','Altura del WC inadecuada',1],['bar','Ausencia/inadecuación de barra lateral',1],['door','Anchura de la puerta < 85 cm',1],['lateral','Espacio lateral WC-pared < 80 cm',1]]
  };
  const keyFor=k=>k==='bath'?'bathTypes':'wcTypes';
  const titleFor=k=>k==='bath'?'Baños para higiene':'Baños con WC';
  const factorFor=k=>k==='bath'?'PMB':'PMWC';
  const help={bath:'Estas son las características que puntúan en PMB. Los datos descriptivos se mantienen separados.',wc:'Estas son las características que puntúan en PMWC. La apertura hacia dentro es un dato descriptivo.'};

  function read(k){
    const key=keyFor(k),xs=(formData[key]||[]).slice();
    document.querySelectorAll(`[data-brk="${k}"]`).forEach(el=>{
      const i=+el.dataset.bri,f=el.dataset.brf;xs[i]??={};
      if(el.type==='radio'){if(el.checked)xs[i][f]=el.value==='yes';}
      else xs[i][f]=el.type==='number'?(el.value===''?'':+el.value):el.value;
    });
    formData[key]=xs;
    let units=0,total=0;
    xs.forEach(x=>{const u=Number(x.units||0);units+=u;total+=u*fields[k].reduce((s,f)=>s+(x[f[0]]===true?f[2]:0),0);});
    const out=document.getElementById(`bath_result_${k}`);
    if(out)out.innerHTML=`<strong>${factorFor(k)}</strong>: ${units?(total/units).toFixed(2):'Pendiente'} · Unidades: ${units}`;
  }

  function renderRegistry(k){
    const xs=formData[keyFor(k)]||[],title=titleFor(k);
    return `<div class="bath-registry-context"><strong>Tipo de registro: ${title}</strong><span>${help[k]}</span></div>
      <p><strong>Puede agrupar unidades exactamente iguales.</strong> Si una unidad tiene alguna característica diferente, cree otro tipo. Máximo 50 tipos.</p>
      <button type="button" class="secondary bath-add-top" data-radd-local="${k}" ${xs.length>=50?'disabled':''}>${k==='bath'?'+ Añadir tipo de baño para higiene':'+ Añadir tipo de baño con WC'}</button>
      <div class="registry-list">${xs.map((x,i)=>`<div class="registry-card bath-registry-card"><div class="registry-card-head"><h4>${title} — Tipo ${i+1}</h4><span class="bath-type-badge">${factorFor(k)}</span></div><div class="grid"><label>Descripción<input type="text" data-brk="${k}" data-bri="${i}" data-brf="description" value="${x.description||''}"></label><label>Número de unidades<input type="number" min="1" step="1" data-brk="${k}" data-bri="${i}" data-brf="units" value="${x.units??''}"></label></div><div class="registry-questions">${fields[k].map(f=>`<div><strong>${f[1]}</strong><div class="choice-row"><label class="choice"><input type="radio" name="${k}_${i}_${f[0]}" data-brk="${k}" data-bri="${i}" data-brf="${f[0]}" value="yes" ${x[f[0]]===true?'checked':''}> Sí</label><label class="choice"><input type="radio" name="${k}_${i}_${f[0]}" data-brk="${k}" data-bri="${i}" data-brf="${f[0]}" value="no" ${x[f[0]]===false?'checked':''}> No</label></div></div>`).join('')}</div><div class="grid">${k==='bath'?`<label>Apertura hacia dentro<input type="text" data-brk="bath" data-bri="${i}" data-brf="doorInward" value="${x.doorInward||''}"></label><label>Ducha/bañera fija<input type="text" data-brk="bath" data-bri="${i}" data-brf="fixtures" value="${x.fixtures||''}"></label>`:`<label>Apertura hacia dentro<input type="text" data-brk="wc" data-bri="${i}" data-brf="doorInward" value="${x.doorInward||''}"></label>`}</div></div>`).join('')}</div>
      <div class="schedule-preview" id="bath_result_${k}"></div>`;
  }

  function renderBathScreen(kind){
    const container=document.getElementById('formContainer');
    const title=titleFor(kind);
    container.innerHTML=`<div class="bath-screen-header"><div><h3>${title}</h3><p>${kind==='bath'?'Registre aquí exclusivamente los baños destinados a la higiene del paciente.':'Registre aquí exclusivamente los baños con WC.'}</p></div><div class="bath-screen-step">${kind==='bath'?'Pantalla 1 de 2':'Pantalla 2 de 2'}</div></div><div class="bath-screen-tabs"><button type="button" class="secondary ${kind==='bath'?'active':''}" data-bath-sub="0">Baños para higiene</button><button type="button" class="secondary ${kind==='wc'?'active':''}" data-bath-sub="1">Baños con WC</button></div><div id="bathRegistryHost">${renderRegistry(kind)}</div>${kind==='wc'?'<div class="bath-famb-note">El cálculo completo de Famb se realizará cuando también esté disponible PMH.</div><div class="partial-factor-box"><button type="button" class="secondary" id="bathPartialFamb">Cálculo parcial de Famb</button><div id="partial_famb" class="schedule-preview" hidden></div></div>':''}`;

    document.querySelectorAll('[data-bath-sub]').forEach(btn=>btn.onclick=()=>{read(kind);bathSubStep=+btn.dataset.bathSub;renderBathScreen(bathSubStep===0?'bath':'wc');});
    document.querySelectorAll(`[data-brk="${kind}"]`).forEach(el=>el.addEventListener(el.type==='radio'?'change':'input',()=>read(kind)));
    document.querySelector('[data-radd-local]')?.addEventListener('click',()=>{
      const key=keyFor(kind);formData[key]=formData[key]||[];if(formData[key].length>=50)return;
      read(kind);formData[key].push({});renderBathScreen(kind);
      setTimeout(()=>document.querySelector(`[data-brk="${kind}"][data-bri="${formData[key].length-1}"]`)?.closest('.registry-card')?.scrollIntoView({behavior:'smooth',block:'center'}),0);
    });
    read(kind);

    if(kind==='wc')document.getElementById('bathPartialFamb').onclick=()=>{
      try{read('bath');read('wc');const r=window.calculateHospitalizacionFactors(formData),d=r.details||{},out=document.getElementById('partial_famb');out.hidden=false;out.innerHTML=`<strong>Factor ambiente (Famb) = ${r.famb===null?'Pendiente':Number(r.famb).toFixed(2)}</strong><br><span>PMB=${d.pmB===null?'Pendiente':d.pmB.toFixed(2)} · PMWC=${d.pmWC===null?'Pendiente':d.pmWC.toFixed(2)} · PMH=${d.pmH===null?'Pendiente':d.pmH.toFixed(2)}</span>`;}catch(e){const out=document.getElementById('partial_famb');out.hidden=false;out.textContent='No se puede calcular todavía: '+e.message;}
    };

    document.getElementById('previousStep').hidden=currentStep===0;
    document.getElementById('nextStep').hidden=false;
    document.getElementById('calculate').hidden=true;
    document.getElementById('progressBar').style.width=`${(currentStep+1)/MAPO_STUDIES[selectedStudy].steps.length*100}%`;
  }

  window.renderStep=function(){
    if(selectedStudy==='hospitalizacion'&&currentStep===7){
      document.getElementById('studyTitle').textContent=MAPO_STUDIES[selectedStudy].title;
      document.getElementById('studyDescription').textContent=`${MAPO_STUDIES[selectedStudy].description} · Paso ${currentStep+1} de ${MAPO_STUDIES[selectedStudy].steps.length}: Factor ambiente — baños`;
      renderBathScreen(bathSubStep===0?'bath':'wc');return;
    }
    originalRender();
  };

  window.saveStep=function(){
    if(selectedStudy==='hospitalizacion'&&currentStep===7){read('bath');read('wc');return;}
    originalSave();
  };

  const next=document.getElementById('nextStep');
  next.addEventListener('click',e=>{
    if(selectedStudy==='hospitalizacion'&&currentStep===7&&bathSubStep===0){e.preventDefault();e.stopImmediatePropagation();read('bath');bathSubStep=1;renderBathScreen('wc');}
  },true);
  const prev=document.getElementById('previousStep');
  prev.addEventListener('click',e=>{
    if(selectedStudy==='hospitalizacion'&&currentStep===7&&bathSubStep===1){e.preventDefault();e.stopImmediatePropagation();read('wc');bathSubStep=0;renderBathScreen('bath');}
  },true);
})();
