const $ = (id) => document.getElementById(id);
let selectedStudy = null;
let currentStep = 0;
let formData = {};
let lastResult = null;

function renderStep() {
  const study = MAPO_STUDIES[selectedStudy];
  const step = study.steps[currentStep];
  $('studyTitle').textContent = study.title;
  $('studyDescription').textContent = `${study.description} · Paso ${currentStep + 1} de ${study.steps.length}: ${step.title}`;
  $('formContainer').innerHTML = `<h3>${step.title}</h3><div class="grid">${step.fields.map(([id,label,type]) => `<label>${label}<input id="field_${id}" type="${type}" min="0" step="any" value="${formData[id] ?? ''}"></label>`).join('')}</div>`;
  $('previousStep').hidden = currentStep === 0;
  $('nextStep').hidden = currentStep === study.steps.length - 1;
  $('calculate').hidden = currentStep !== study.steps.length - 1;
  $('progressBar').style.width = `${((currentStep + 1) / study.steps.length) * 100}%`;
}

function saveStep() {
  const study = MAPO_STUDIES[selectedStudy];
  for (const [id, label, type] of study.steps[currentStep].fields) {
    const input = $(`field_${id}`);
    const raw = input.value.trim();
    if (type === 'number' && raw !== '' && Number(raw) < 0) throw new Error(`${label} no puede ser negativo.`);
    formData[id] = type === 'number' && raw !== '' ? Number(raw) : raw;
  }
}

function selectStudy(key) {
  selectedStudy = key;
  currentStep = 0;
  formData = {};
  $('studySelection').hidden = true;
  $('studyPanel').hidden = false;
  $('result').hidden = true;
  $('templateAdmin').hidden = true;
  renderStep();
}

document.querySelectorAll('.study-option').forEach(button => button.addEventListener('click', () => selectStudy(button.dataset.study)));
$('changeStudy').addEventListener('click', () => { selectedStudy = null; $('studyPanel').hidden = true; $('result').hidden = true; $('studySelection').hidden = false; });
$('nextStep').addEventListener('click', () => { try { saveStep(); currentStep++; renderStep(); $('error').hidden = true; } catch (e) { $('error').textContent = e.message; $('error').hidden = false; } });
$('previousStep').addEventListener('click', () => { saveStep(); currentStep--; renderStep(); });

$('calculate').addEventListener('click', () => {
  try {
    saveStep();
    if (!formData.op || formData.op <= 0) throw new Error('El número de personas trabajadoras (OP) debe ser mayor que 0.');
    const st = Number(formData.st ?? (Number(formData.st1 || 0) + Number(formData.st2 || 0)));
    const sp = Number(formData.sp ?? 0);
    const lta = Number(formData.lta ?? (Number(formData.lt1 || 0) + Number(formData.lt2 || 0)));
    const lpa = Number(formData.lpa ?? 0);
    const values = { op: formData.op, nc: Number(formData.nc || 0), pc: Number(formData.pc || 0), fs: 1, fa: 1, fc: 1, famb: 1, ff: 1 };
    lastResult = calculateMapo(values);
    $('mapoValue').textContent = `MAPO = ${lastResult.mapo.toFixed(2)}`;
    $('classification').textContent = `Nivel: ${lastResult.classification}`;
    $('breakdown').innerHTML = `<p>NC/OP: (${values.nc} / ${values.op})</p><p>PC/OP: (${values.pc} / ${values.op})</p><p>Levantamientos totales: ${st + sp}</p><p>% levantamientos totales con ayudas: ${st ? ((lta/st)*100).toFixed(1) : '0.0'}%</p><p>% levantamientos parciales con ayudas: ${sp ? ((lpa/sp)*100).toFixed(1) : '0.0'}%</p><p><strong>Estado:</strong> estructura de fichas preparada; los factores derivados de cada modelo se incorporarán con sus reglas completas.</p>`;
    $('result').hidden = false;
    $('error').hidden = true;
  } catch (e) { $('error').textContent = e.message; $('error').hidden = false; $('result').hidden = true; }
});

$('generateReport').addEventListener('click', () => alert('El sistema de plantillas Word está preparado. La siguiente fase conectará los tres DOCX reales y el reemplazo automático de campos.'));
