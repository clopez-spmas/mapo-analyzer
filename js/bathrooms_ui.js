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

  const hygieneAidKinds=[
    ['camillaDucha','Camilla para la ducha'],
    ['baneraErgonomica','Bañera ergonómica (baño asistido) adecuada'],
    ['duchaErgonomica','Ducha ergonómica (ducha asistida) adecuada'],
    ['elevadorBanera','Elevador para bañera fija'],
    ['otros','Otros']
  ];
  function hygieneAidsData(){formData.ayudasHigiene=formData.ayudasHigiene||{};return formData.ayudasHigiene;}
  function renderHygieneAids(){
    const d=hygieneAidsData();
    return '<section class="registry-card"><h3>Ayudas para la higiene del paciente</h3><p>Información complementaria para el informe Word. No modifica PMB ni Famb.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Ayuda</th><th>Presencia</th><th>Número</th></tr></thead><tbody>'+
      hygieneAidKinds.map(([key,label])=>{const v=d[key]||{};return '<tr><td>'+label+(key==='otros'?'<input type="text" data-hygiene-other value="'+escapeHtml(v.descripcion||'')+'" placeholder="Especificar ayuda">':'')+'</td><td><select data-hygiene-presence="'+key+'"><option value="" '+(v.presencia==null?'selected':'')+'>Sin indicar</option><option value="si" '+(v.presencia===true?'selected':'')+'>Sí</option><option value="no" '+(v.presencia===false?'selected':'')+'>No</option></select></td><td><input type="number" min="0" step="1" data-hygiene-count="'+key+'" value="'+escapeHtml(v.numero??'')+'" style="max-width:100px"></td></tr>';}).join('')+'</tbody></table></div></section>';
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function readHygieneAids(){
    const d=hygieneAidsData();
    hygieneAidKinds.forEach(([key])=>{const p=document.querySelector('[data-hygiene-presence="'+key+'"]'),n=document.querySelector('[data-hygiene-count="'+key+'"]');if(!p||!n)return;const v=d[key]||{};v.presencia=p.value==='si'?true:p.value==='no'?false:null;v.numero=n.value===''?'':Number(n.value);if(key==='otros')v.descripcion=document.querySelector('[data-hygiene-other]')?.value||'';d[key]=v;});
  }
  function isBathModule(){return selectedStudy==='hospitalizacion'&&MAPO_STUDIES[selectedStudy]?.steps?.[currentStep]?.title==='Factor ambiente — baños';}
  function read(k){
    const key=keyFor(k),xs=(formData[key]||[]).slice();
    document.querySelectorAll(`[data-brk="${k}"]`).forEach(el=>{
      const i=+el.dataset.bri,f=el.dataset.brf;xs[i]??={};
      if(el.type==='radio'){if(el.checked)xs[i][f]=el.value==='yes';}
      else xs[i][f]=el.type==='number'?(el.value===''?'':+el.value):el.value;
    });
    formData[key]=xs;
    if(k==='bath')readHygieneAids();
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

  function calculatePartialFamb(){
    read('bath');
    read('wc');
    const pmB=(formData.bathTypes||[]).length?meanLocal('bath'):null;
    const pmWC=(formData.wcTypes||[]).length?meanLocal('wc'):null;
    const rooms=formData.roomTypes||[];
    const pmH=rooms.length?meanLocalRoom(rooms):null;
    const out=document.getElementById('partial_famb');
    if(!out)return;
    out.hidden=false;
    if(pmB===null&&pmWC===null){
      out.innerHTML='<strong>No se puede calcular todavía.</strong><br>Debe introducir al menos un tipo de baño para higiene o un tipo de baño con WC.';
      return;
    }
    if(pmH===null){
      const subtotal=(pmB||0)+(pmWC||0);
      out.innerHTML=`<strong>Cálculo parcial de Famb</strong><br>PMB = ${pmB===null?'Pendiente':pmB.toFixed(2)} · PMWC = ${pmWC===null?'Pendiente':pmWC.toFixed(2)}<br><strong>Subtotal baños = ${subtotal.toFixed(2)}</strong><br><span>Famb completo queda pendiente de PMH (habitaciones). Este cálculo parcial no exige introducir habitaciones.</span>`;
      return;
    }
    const pmamb=pmB+pmWC+pmH;
    const famb=pmamb<=5.8?.75:pmamb<=11.6?1.25:1.5;
    out.innerHTML=`<strong>Factor ambiente (Famb) = ${famb.toFixed(2)}</strong><br>PMB = ${pmB.toFixed(2)} · PMWC = ${pmWC.toFixed(2)} · PMH = ${pmH.toFixed(2)} · PMamb = ${pmamb.toFixed(2)}`;
  }

  function meanLocal(k){
    const xs=formData[keyFor(k)]||[];let n=0,t=0;
    xs.forEach(x=>{const u=Number(x.units||0);if(u>0){n+=u;t+=u*fields[k].reduce((s,f)=>s+(x[f[0]]===true?f[2]:0),0);}});
    return n?t/n:null;
  }

  function meanLocalRoom(xs){
    const roomFields=[['between',2],['foot',2],['bedSection',1],['underbed',2],['chairHeight',.5]];let n=0,t=0;
    xs.forEach(x=>{const u=Number(x.units||0);if(u>0){n+=u;t+=u*roomFields.reduce((s,[f,p])=>s+(x[f]===true?p:0),0);}});
    return n?t/n:null;
  }

  function renderBathScreen(kind){
    const container=document.getElementById('formContainer');
    const title=titleFor(kind);
    container.innerHTML=`<div class="bath-screen-header"><div><h3>${title}</h3><p>${kind==='bath'?'Registre aquí exclusivamente los baños destinados a la higiene del paciente.':'Registre aquí exclusivamente los baños con WC.'}</p></div><div class="bath-screen-step">${kind==='bath'?'Pantalla 1 de 2':'Pantalla 2 de 2'}</div></div><div class="bath-screen-tabs"><button type="button" class="secondary ${kind==='bath'?'active':''}" data-bath-sub="0">Baños para higiene</button><button type="button" class="secondary ${kind==='wc'?'active':''}" data-bath-sub="1">Baños con WC</button></div><div id="bathRegistryHost">${renderRegistry(kind)}</div>${kind==='bath'?renderHygieneAids():''}${kind==='wc'?'<div class="bath-famb-note">El cálculo completo de Famb se realizará cuando también esté disponible PMH.</div><div class="partial-factor-box"><button type="button" class="secondary" id="bathPartialFamb">Cálculo parcial de Famb</button><div id="partial_famb" class="schedule-preview" hidden></div></div>':''}`;

    document.querySelectorAll('[data-bath-sub]').forEach(btn=>btn.onclick=()=>{read(kind);bathSubStep=+btn.dataset.bathSub;renderBathScreen(bathSubStep===0?'bath':'wc');});
    document.querySelectorAll(`[data-brk="${kind}"]`).forEach(el=>el.addEventListener(el.type==='radio'?'change':'input',()=>read(kind)));
    document.querySelector('[data-radd-local]')?.addEventListener('click',()=>{
      const key=keyFor(kind);formData[key]=formData[key]||[];if(formData[key].length>=50)return;
      read(kind);formData[key].push({});renderBathScreen(kind);
      setTimeout(()=>document.querySelector(`[data-brk="${kind}"][data-bri="${formData[key].length-1}"]`)?.closest('.registry-card')?.scrollIntoView({behavior:'smooth',block:'center'}),0);
    });
    if(kind==='bath')document.querySelectorAll('[data-hygiene-presence],[data-hygiene-count],[data-hygiene-other]').forEach(el=>el.addEventListener('input',readHygieneAids));
    read(kind);

    if(kind==='wc')document.getElementById('bathPartialFamb').onclick=calculatePartialFamb;

    document.getElementById('previousStep').hidden=currentStep===0;
    document.getElementById('nextStep').hidden=false;
    document.getElementById('calculate').hidden=true;
    document.getElementById('progressBar').style.width=`${(currentStep+1)/MAPO_STUDIES[selectedStudy].steps.length*100}%`;
  }

  window.renderStep=function(){
    if(isBathModule()){
      document.getElementById('studyTitle').textContent=MAPO_STUDIES[selectedStudy].title;
      document.getElementById('studyDescription').textContent=`${MAPO_STUDIES[selectedStudy].description} · Paso ${currentStep+1} de ${MAPO_STUDIES[selectedStudy].steps.length}: Factor ambiente — baños`;
      renderBathScreen(bathSubStep===0?'bath':'wc');return;
    }
    originalRender();
  };

  window.saveStep=function(){
    if(isBathModule()){read('bath');read('wc');return;}
    originalSave();
  };

  const next=document.getElementById('nextStep');
  next.addEventListener('click',e=>{
    if(isBathModule()&&bathSubStep===0){e.preventDefault();e.stopImmediatePropagation();read('bath');bathSubStep=1;renderBathScreen('wc');}
  },true);
  const prev=document.getElementById('previousStep');
  prev.addEventListener('click',e=>{
    if(isBathModule()&&bathSubStep===1){e.preventDefault();e.stopImmediatePropagation();read('wc');bathSubStep=0;renderBathScreen('bath');}
  },true);
})();
