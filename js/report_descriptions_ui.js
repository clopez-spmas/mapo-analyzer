/* Pantallas descriptivas para el futuro informe Word: no intervienen en MAPO. */
(function(){
'use strict';
const prevRender=window.renderStep, prevSave=window.saveStep;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const note='<p class="schedule-preview"><strong>Destino:</strong> el texto introducido en esta pantalla se volcará en el informe Word cuando se incorpore la función de generación del informe. Puede dejarse en blanco.</p>';
const reportHelp={
 organizacion:['Nº de camas','Nº de personas trabajadoras que realizan MMC. Diferenciando entre turnos.','Nº de personas trabajadoras a tiempo parcial. Número de ellos por turno y horario.','Tipología de pacientes: nº medio diario de pacientes no colaboradores y parcialmente colaboradores.'],
 frecuencia:['Rutinas diarias en cada uno de los turnos.'],
 formacion:['¿Existe formación? Sí o No. (Hace cuánto)','Duración de la formación y nº de personas trabajadoras formados.','¿Existe entrenamiento en el uso de equipos? Sí o No.','¿Existe información? Sí o No.','¿Verificación de la formación?'],
 equipos:['Indicar presencia o no de equipos de ayuda y ayudas menores (dar número, marca y modelo). Incluir imágenes en tablas como la siguiente.','Para los equipos de ayuda se describirá su mantenimiento, adaptabilidad al medio, al ambiente y presencia de requisitos preliminares.','Describir tipos de sillas de ruedas existentes y número de sillas por cada tipo. Si se dispone de imágenes igualmente incluirlas en tablas.','Mencionar las características ergonómicas más relevantes.'],
 instalaciones:['Describir los baños para la higiene, baños con WC y habitaciones.','Tipos diferentes y número de cada uno de ellos.','Mencionar las características ergonómicas más relevantes.','Describir el tipo y número de camas regulables en altura existentes.','Si se dispone de imágenes incluirlas en tablas.']
};
function helpMarkup(key){return '<button type="button" class="help-trigger" data-report-help="'+key+'" aria-expanded="false" aria-controls="reportHelpBox">?</button><div class="help-popover" id="reportHelpBox" hidden><strong>Incluir:</strong><ul>'+reportHelp[key].map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></div>';}
function bindHelp(){const b=document.querySelector('[data-report-help]');if(!b)return;b.addEventListener('click',()=>{const p=$('reportHelpBox');p.hidden=!p.hidden;b.setAttribute('aria-expanded',String(!p.hidden));});}
function ensure(){formData.informeDescriptivo=formData.informeDescriptivo||{};return formData.informeDescriptivo;}
function getStep(){return MAPO_STUDIES[selectedStudy]?.steps?.[currentStep];}
const minorAidTypes=[
 ['sabana','Sábana deslizante'],
 ['tabla','Tabla deslizante'],
 ['cinturon','Cinturón ergonómico'],
 ['rollbord','ROLLBORD u otro similar'],
 ['gruaActiva','Grúa activa o de bipedestación, elevador de banda torácica'],
 ['otro','Otro']
];
function renderMinorAids(d){
 const aids=d.ayudasMenores||{};
 return '<section class="registry-card" style="margin-top:24px"><h3>Ayudas menores</h3><p>Registre la presencia y el número de unidades. Esta tabla se incorporará al futuro informe Word y no altera el cálculo MAPO.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Ayuda</th><th>Presencia</th><th>Número</th></tr></thead><tbody>'+
 minorAidTypes.map(([id,label])=>{const entry=aids[id]||{};return '<tr><td style="padding:8px;border:1px solid #ccc">'+esc(label)+(id==='otro'?'<input type="text" data-minor-other value="'+esc(entry.descripcion||'')+'" placeholder="Especificar ayuda">':'')+'</td><td style="padding:8px;border:1px solid #ccc"><select data-minor-presence="'+id+'" aria-label="Presencia: '+esc(label)+'"><option value="" '+(entry.presencia==null?'selected':'')+'>Sin indicar</option><option value="si" '+(entry.presencia===true?'selected':'')+'>Sí</option><option value="no" '+(entry.presencia===false?'selected':'')+'>No</option></select></td><td style="padding:8px;border:1px solid #ccc"><input type="number" min="0" step="1" style="max-width:110px" data-minor-count="'+id+'" value="'+esc(entry.numero??'')+'" aria-label="Número: '+esc(label)+'"></td></tr>';}).join('')+
 '</tbody></table></div></section>';
}
function readMinorAids(d){
 d.ayudasMenores=d.ayudasMenores||{};
 minorAidTypes.forEach(([id])=>{
  const p=document.querySelector('[data-minor-presence="'+id+'"]');
  const n=document.querySelector('[data-minor-count="'+id+'"]');
  if(!p||!n)return;
  const entry=d.ayudasMenores[id]||{};
  entry.presencia=p.value==='si'?true:p.value==='no'?false:null;
  entry.numero=n.value===''?'':Number(n.value);
  if(id==='otro')entry.descripcion=document.querySelector('[data-minor-other]')?.value||'';
  d.ayudasMenores[id]=entry;
 });
}
const helpEquipmentTypes=['Elevador/Grúa tipo 1','Elevador/Grúa tipo 2','Elevador/Grúa tipo 3','Camilla tipo 1','Camilla tipo 2'];
const helpDeficiencies=[['requisitos','Carencia de requisitos preliminares'],['paciente','Carencia de adaptabilidad al paciente'],['ambiente','Carencia de adaptabilidad al ambiente'],['mantenimiento','Carencia de mantenimiento']];
function helpChoice(id,i,value,label){
 return '<select data-help-def="'+i+'" data-help-key="'+id+'" aria-label="'+esc(label)+'"><option value="" '+(value==null?'selected':'')+'>Sin indicar</option><option value="si" '+(value===true?'selected':'')+'>Sí</option><option value="no" '+(value===false?'selected':'')+'>No</option></select>';
}
function renderHelpEquipment(d){
 const entries=d.equiposAyudaDetalle||helpEquipmentTypes.map(tipo=>({tipo}));
 return '<section class="registry-card" style="margin-top:24px"><h3>Equipos de ayuda — ficha de inspección</h3><p>Datos para el informe Word. No modifican FS ni FA.</p><div style="overflow-x:auto"><table style="min-width:850px;width:100%;border-collapse:collapse"><thead><tr><th>Descripción del equipo</th><th>Nº de equipos</th>'+helpDeficiencies.map(x=>'<th>'+esc(x[1])+'</th>').join('')+'<th></th></tr></thead><tbody>'+entries.map((e,i)=>'<tr><td><input type="text" data-help-type="'+i+'" value="'+esc(e.tipo||'')+'" aria-label="Descripción del equipo"></td><td><input style="width:85px" type="number" min="0" step="1" data-help-count="'+i+'" value="'+esc(e.numero??'')+'" aria-label="Número de equipos"></td>'+helpDeficiencies.map(([key,label])=>'<td>'+helpChoice(key,i,e[key],label)+'</td>').join('')+'<td><button type="button" class="secondary" data-help-remove="'+i+'">Eliminar</button></td></tr>').join('')+'</tbody></table></div><button type="button" class="secondary" id="addHelpEquipment">+ Añadir equipo</button><div style="margin-top:12px"><label>¿Existe un lugar para almacenar el equipamiento? '+helpChoice('almacen',-1,d.almacenEquipos,'Almacenamiento de equipos')+'</label></div><div><label>¿Hay espacio suficiente para almacenar equipos de nueva adquisición? '+helpChoice('espacio',-1,d.espacioNuevosEquipos,'Espacio para nuevos equipos')+'</label></div></section>';
}
function readHelpEquipment(d){
 const elements=document.querySelectorAll('[data-help-type]');
 if(elements.length){
  d.equiposAyudaDetalle=[...elements].map(el=>{const i=Number(el.dataset.helpType),num=document.querySelector('[data-help-count="'+i+'"]'),row={tipo:el.value,numero:num?.value===''?'':Number(num?.value||0)};helpDeficiencies.forEach(([key])=>{const v=document.querySelector('[data-help-def="'+i+'"][data-help-key="'+key+'"]')?.value;row[key]=v==='si'?true:v==='no'?false:null;});return row;});
 }
 const a=document.querySelector('[data-help-def="-1"][data-help-key="almacen"]'),b=document.querySelector('[data-help-def="-1"][data-help-key="espacio"]');
 if(a)d.almacenEquipos=a.value==='si'?true:a.value==='no'?false:null;
 if(b)d.espacioNuevosEquipos=b.value==='si'?true:b.value==='no'?false:null;
}
function read(){
 const step=getStep(),d=ensure();
 if(step?.custom==='reportDescription'){const e=$('mapoReportDescription');if(e)d[step.reportKey]=e.value;}
 if(step?.custom==='reportEquipment'||step?.custom==='reportMinorAids'){
  d.equipos=d.equipos||[];
  document.querySelectorAll('[data-equipo-modelo]').forEach(e=>{const i=Number(e.dataset.equipoModelo);if(d.equipos[i])d.equipos[i].modelo=e.value;});
  if(step?.custom==='reportMinorAids')readMinorAids(d);
  else readHelpEquipment(d);
 }
}
function renderDescription(step){
 const d=ensure();
 $('formContainer').innerHTML='<div class="step-title-row"><h3>'+esc(step.reportLabel)+'</h3>'+helpMarkup(step.reportKey)+'</div>'+note+
 '<label for="mapoReportDescription"><strong>'+esc(step.reportLabel)+'</strong></label>'+
 '<textarea id="mapoReportDescription" rows="12" style="width:100%;min-height:240px;resize:vertical" placeholder="Escriba aquí la descripción que aparecerá en el informe Word...">'+esc(d[step.reportKey]||'')+'</textarea>';
 $('mapoReportDescription').addEventListener('input',read);bindHelp();
}
function renderEquipment(){
 const d=ensure();d.equipos=d.equipos||[];
 $('formContainer').innerHTML='<div class="step-title-row"><h3>Equipos de ayuda disponibles</h3>'+helpMarkup('equipos')+'</div>'+note+
 '<p>Registre cada equipo en la tabla de dos columnas. La imagen y la marca/modelo se incorporarán a la sección de equipos del futuro informe Word. No modifica los factores FS ni FA.</p>'+
 '<div style="overflow-x:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr><th style="width:48%">Imagen</th><th>Marca / modelo</th></tr></thead><tbody>'+
 d.equipos.map((eq,i)=>'<tr><td style="vertical-align:top;padding:8px;border:1px solid #ccc">'+(eq.imagen?'<img src="'+esc(eq.imagen)+'" alt="Equipo de ayuda" style="max-height:150px;max-width:100%;display:block;margin-bottom:8px">':'<span>Sin imagen</span>')+
 '<input type="file" accept="image/png,image/jpeg,image/webp" data-equipo-imagen="'+i+'" aria-label="Imagen del equipo '+(i+1)+'">'+
 (eq.imagen?'<button type="button" class="secondary" data-quitar-imagen="'+i+'">Quitar imagen</button>':'')+
 '</td><td style="vertical-align:top;padding:8px;border:1px solid #ccc"><label>Marca / modelo<input type="text" style="width:100%" data-equipo-modelo="'+i+'" value="'+esc(eq.modelo||'')+'" placeholder="Marca y modelo"></label>'+
 '<button type="button" class="secondary" data-quitar-equipo="'+i+'">Eliminar fila</button></td></tr>').join('')+
 '</tbody></table></div><button type="button" class="secondary" id="anadirEquipoInforme">+ Añadir equipo</button><p id="equipoImageMessage" role="status"></p>'+renderHelpEquipment(d);
 bindHelp();document.querySelectorAll('[data-help-type],[data-help-count],[data-help-def]').forEach(e=>e.addEventListener('input',read));$('addHelpEquipment').onclick=()=>{read();d.equiposAyudaDetalle=d.equiposAyudaDetalle||helpEquipmentTypes.map(tipo=>({tipo}));d.equiposAyudaDetalle.push({tipo:''});renderEquipment();};document.querySelectorAll('[data-help-remove]').forEach(b=>b.onclick=()=>{read();d.equiposAyudaDetalle.splice(Number(b.dataset.helpRemove),1);renderEquipment();});$('anadirEquipoInforme').onclick=()=>{read();d.equipos.push({modelo:'',imagen:''});renderEquipment();};
 document.querySelectorAll('[data-equipo-modelo]').forEach(e=>e.addEventListener('input',read));
 document.querySelectorAll('[data-quitar-equipo]').forEach(b=>b.onclick=()=>{read();d.equipos.splice(Number(b.dataset.quitarEquipo),1);renderEquipment();});
 document.querySelectorAll('[data-quitar-imagen]').forEach(b=>b.onclick=()=>{read();d.equipos[Number(b.dataset.quitarImagen)].imagen='';renderEquipment();});
 document.querySelectorAll('[data-equipo-imagen]').forEach(input=>input.addEventListener('change',()=>{
  const file=input.files?.[0],i=Number(input.dataset.equipoImagen),out=$('equipoImageMessage');
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){out.textContent='Formato no admitido. Use JPG, PNG o WebP.';input.value='';return;}
  if(file.size>1024*1024){out.textContent='La imagen supera 1 MB. Reduzca su tamaño antes de adjuntarla.';input.value='';return;}
  read();
  const reader=new FileReader();
  reader.onload=()=>{if(!d.equipos[i])return;d.equipos[i].imagen=String(reader.result||'');renderEquipment();};
  reader.onerror=()=>{out.textContent='No se pudo leer la imagen.';};
  reader.readAsDataURL(file);
 }));
}
function renderMinorAidsScreen(){
 const d=ensure();
 $('formContainer').innerHTML='<div class="step-title-row"><h3>Ayudas menores disponibles</h3></div>'+note+renderMinorAids(d);
 document.querySelectorAll('[data-minor-presence],[data-minor-count],[data-minor-other]').forEach(e=>e.addEventListener('input',read));
}
window.renderStep=function(){
 const step=getStep();
 if(step?.custom==='reportDescription'){renderDescription(step);return;}
 if(step?.custom==='reportEquipment'){renderEquipment();return;}
 if(step?.custom==='reportMinorAids'){renderMinorAidsScreen();return;}
 return prevRender();
};
window.saveStep=function(){
 const step=getStep();
 if(step?.custom==='reportDescription'||step?.custom==='reportEquipment'||step?.custom==='reportMinorAids'){read();return;}
 return prevSave();
};
window.MAPOReportDescriptions={capture:read,render:step=>{if(step?.custom==='reportDescription'){renderDescription(step);return true;}if(step?.custom==='reportEquipment'){renderEquipment();return true;}if(step?.custom==='reportMinorAids'){renderMinorAidsScreen();return true;}return false;}};
})();