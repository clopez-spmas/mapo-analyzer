/* Pantallas descriptivas para el futuro informe Word: no intervienen en MAPO. */
(function(){
'use strict';
const prevRender=window.renderStep, prevSave=window.saveStep;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const note='<p class="schedule-preview"><strong>Destino:</strong> el texto introducido en esta pantalla se volcará en el informe Word cuando se incorpore la función de generación del informe. Puede dejarse en blanco.</p>';
function ensure(){formData.informeDescriptivo=formData.informeDescriptivo||{};return formData.informeDescriptivo;}
function getStep(){return MAPO_STUDIES[selectedStudy]?.steps?.[currentStep];}
function read(){
 const step=getStep(),d=ensure();
 if(step?.custom==='reportDescription'){const e=$('mapoReportDescription');if(e)d[step.reportKey]=e.value;}
 if(step?.custom==='reportEquipment'){
  d.equipos=d.equipos||[];
  document.querySelectorAll('[data-equipo-modelo]').forEach(e=>{const i=Number(e.dataset.equipoModelo);if(d.equipos[i])d.equipos[i].modelo=e.value;});
 }
}
function renderDescription(step){
 const d=ensure();
 $('formContainer').innerHTML='<div class="step-title-row"><h3>'+esc(step.reportLabel)+'</h3></div>'+note+
 '<label for="mapoReportDescription"><strong>Descripción para el informe</strong></label>'+
 '<textarea id="mapoReportDescription" rows="12" style="width:100%;min-height:240px;resize:vertical" placeholder="Escriba aquí la descripción que aparecerá en el informe Word...">'+esc(d[step.reportKey]||'')+'</textarea>';
 $('mapoReportDescription').addEventListener('input',read);
}
function renderEquipment(){
 const d=ensure();d.equipos=d.equipos||[];
 $('formContainer').innerHTML='<div class="step-title-row"><h3>Equipos de ayuda disponibles</h3></div>'+note+
 '<p>Registre cada equipo en la tabla de dos columnas. La imagen y la marca/modelo se incorporarán a la sección de equipos del futuro informe Word. No modifica los factores FS ni FA.</p>'+
 '<div style="overflow-x:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr><th style="width:48%">Imagen</th><th>Marca / modelo</th></tr></thead><tbody>'+
 d.equipos.map((eq,i)=>'<tr><td style="vertical-align:top;padding:8px;border:1px solid #ccc">'+(eq.imagen?'<img src="'+esc(eq.imagen)+'" alt="Equipo de ayuda" style="max-height:150px;max-width:100%;display:block;margin-bottom:8px">':'<span>Sin imagen</span>')+
 '<input type="file" accept="image/png,image/jpeg,image/webp" data-equipo-imagen="'+i+'" aria-label="Imagen del equipo '+(i+1)+'">'+
 (eq.imagen?'<button type="button" class="secondary" data-quitar-imagen="'+i+'">Quitar imagen</button>':'')+
 '</td><td style="vertical-align:top;padding:8px;border:1px solid #ccc"><label>Marca / modelo<input type="text" style="width:100%" data-equipo-modelo="'+i+'" value="'+esc(eq.modelo||'')+'" placeholder="Marca y modelo"></label>'+
 '<button type="button" class="secondary" data-quitar-equipo="'+i+'">Eliminar fila</button></td></tr>').join('')+
 '</tbody></table></div><button type="button" class="secondary" id="anadirEquipoInforme">+ Añadir equipo</button><p id="equipoImageMessage" role="status"></p>';
 $('anadirEquipoInforme').onclick=()=>{read();d.equipos.push({modelo:'',imagen:''});renderEquipment();};
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
window.renderStep=function(){
 const step=getStep();
 if(step?.custom==='reportDescription'){renderDescription(step);return;}
 if(step?.custom==='reportEquipment'){renderEquipment();return;}
 return prevRender();
};
window.saveStep=function(){
 const step=getStep();
 if(step?.custom==='reportDescription'||step?.custom==='reportEquipment'){read();return;}
 return prevSave();
};
window.MAPOReportDescriptions={capture:read,render:step=>{if(step?.custom==='reportDescription'){renderDescription(step);return true;}if(step?.custom==='reportEquipment'){renderEquipment();return true;}return false;}};
})();