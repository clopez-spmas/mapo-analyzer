const $ = (id) => document.getElementById(id);
let selectedStudy = null;
let currentStep = 0;
let formData = {};
let lastResult = null;

function factorElevacion(d) {
  const suficiente = (d.nc > 0 && d.elevadores >= d.nc / 8) || (d.nc > 0 && d.camillasRegulables >= d.nc / 8 && d.camillaConAyuda === 1) || d.camas3Nodos100 === 1;
  const adecuado = d.st > 0 && d.lta / d.st >= 0.90;
  return { suficiente, adecuado, fs: !suficiente && !adecuado ? 4 : suficiente && adecuado ? 0.5 : 2 };
}
function factorAyudas(d) {
  const suficiente = (d.sabanaOTabla === 1 && d.otrasAyudas >= 2) || (d.sabanaOTabla === 1 && d.camas3Nodos100 === 1);
  const adecuado = d.sp > 0 && d.lpa / d.sp >= 0.90;
  return { suficiente, adecuado, fa: suficiente && adecuado ? 0.5 : 1 };
}
function factorSillas(d) {
  const suficiente = d.sillasSuficientes === 1;
  const p = Number(d.pmsr || 0);
  const fc = p <= 1.33 ? (suficiente ? 0.75 : 1) : p <= 2.66 ? (suficiente ? 1.12 : 1.5) : (suficiente ? 1.5 : 2);
  return { suficiente, pmsr: p, fc };
}
function factorAmbiente(d) {
  const pmamb = Number(d.pmb || 0) + Number(d.pmwc || 0) + Number(d.pmh || 0);
  return { pmamb, famb: pmamb <= 5.8 ? 0.75 : pmamb <= 11.6 ? 1.25 : 1.5 };
}
function calcularHospitalizacion(d) {
  const fs = factorElevacion(d), fa = factorAyudas(d), fc = factorSillas(d), famb = factorAmbiente(d);
  const ff = Number(d.ff);
  if (![0.75,1,2].includes(ff)) throw new Error('FF debe ser 0,75; 1; o 2 según la condición de formación.');
  if (d.op <= 0) throw new Error('OP debe ser mayor que 0.');
  if (d.lta > d.st || d.lpa > d.sp) throw new Error('Los levantamientos con ayuda no pueden superar los levantamientos totales/parciales correspondientes.');
  const terminoNC = d.nc / d.op * fs.fs;
  const terminoPC = d.pc / d.op * fa.fa;
  const mapo = (terminoNC + terminoPC) * fc.fc * famb.famb * ff;
  const nivel = mapo === 0 ? 'Ausente' : mapo <= 1.5 ? 'Aceptable / irrelevante' : mapo <= 5 ? 'Medio' : 'Alto';
  return { mapo, nivel, fs:fs.fs, fa:fa.fa, fc:fc.fc, famb:famb.famb, ff, terminoNC, terminoPC, detalle:{fs,fa,fc,famb} };
}

function renderStep() {
  const study = MAPO_STUDIES[selectedStudy], step = study.steps[currentStep];
  $('studyTitle').textContent = study.title;
  $('studyDescription').textContent = `${study.description} · Paso ${currentStep + 1} de ${study.steps.length}: ${step.title}`;
  const help = step.helpKey ? `<button type="button" class="help-trigger" data-help="${step.helpKey}" aria-label="Ayuda sobre ${step.title}" title="Mostrar ayuda">?</button><div class="help-popover" id="help_${step.helpKey}" hidden>${MAPO_HELP[step.helpKey]}</div>` : '';
  $('formContainer').innerHTML = `<div class="step-title-row"><h3>${step.title}</h3>${help}</div><div class="grid">${step.fields.map(([id,label,type]) => `<label>${label}<input id="field_${id}" type="${type}" min="0" step="any" value="${formData[id] ?? ''}"></label>`).join('')}</div>`;
  document.querySelectorAll('.help-trigger').forEach(button => button.addEventListener('click', () => {
    const box = $(`help_${button.dataset.help}`);
    const wasHidden = box.hidden;
    document.querySelectorAll('.help-popover').forEach(p => p.hidden = true);
    box.hidden = !wasHidden;
  }));
  $('previousStep').hidden = currentStep === 0;
  $('nextStep').hidden = currentStep === study.steps.length - 1;
  $('calculate').hidden = currentStep !== study.steps.length - 1;
  $('progressBar').style.width = `${((currentStep + 1) / study.steps.length) * 100}%`;
}
function saveStep() {
  const study = MAPO_STUDIES[selectedStudy];
  for (const [id,label,type] of study.steps[currentStep].fields) {
    const input = $(`field_${id}`), raw = input.value.trim();
    if (type === 'number' && raw !== '' && Number(raw) < 0) throw new Error(`${label} no puede ser negativo.`);
    formData[id] = type === 'number' && raw !== '' ? Number(raw) : raw;
  }
}
function selectStudy(key) { selectedStudy=key; currentStep=0; formData={}; $('studySelection').hidden=true; $('studyPanel').hidden=false; $('result').hidden=true; renderStep(); }
document.querySelectorAll('.study-option').forEach(b=>b.addEventListener('click',()=>selectStudy(b.dataset.study)));
$('changeStudy').addEventListener('click',()=>{selectedStudy=null;$('studyPanel').hidden=true;$('result').hidden=true;$('studySelection').hidden=false;});
$('nextStep').addEventListener('click',()=>{try{saveStep();currentStep++;renderStep();$('error').hidden=true;}catch(e){$('error').textContent=e.message;$('error').hidden=false;}});
$('previousStep').addEventListener('click',()=>{saveStep();currentStep--;renderStep();});
$('calculate').addEventListener('click',()=>{
  try {
    saveStep();
    if (selectedStudy === 'hospitalizacion') lastResult = calcularHospitalizacion(formData);
    else {
      if (!formData.op || formData.op <= 0) throw new Error('OP debe ser mayor que 0.');
      const fs=Number(formData.fs||1),fa=Number(formData.fa||1),fc=Number(formData.fc||1),famb=Number(formData.famb||1),ff=Number(formData.ff||1);
      const mapo=((Number(formData.nc||0)/formData.op)*fs+(Number(formData.pc||0)/formData.op)*fa)*fc*famb*ff;
      lastResult={mapo,nivel:mapo===0?'Ausente':mapo<=1.5?'Aceptable / irrelevante':mapo<=5?'Medio':'Alto',fs,fa,fc,famb,ff};
    }
    $('mapoValue').textContent=`MAPO = ${lastResult.mapo.toFixed(2)}`;
    $('classification').textContent=`Nivel de exposición: ${lastResult.nivel}`;
    $('breakdown').innerHTML=`<p>FS = ${lastResult.fs}</p><p>FA = ${lastResult.fa}</p><p>FC = ${lastResult.fc}</p><p>Famb = ${lastResult.famb}</p><p>FF = ${lastResult.ff}</p><p><strong>Fórmula:</strong> [(NC/OP × FS) + (PC/OP × FA)] × FC × Famb × FF</p>`;
    $('result').hidden=false;$('error').hidden=true;
  } catch(e) { $('error').textContent=e.message;$('error').hidden=false;$('result').hidden=true; }
});
$('generateReport').addEventListener('click',()=>alert('La generación del informe Word se conectará al modelo del estudio seleccionado. Los modelos serán administrados mediante SharePoint.'));
