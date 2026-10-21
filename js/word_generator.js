/* Generación DOCX mediante marcadores estables de plantilla. Requiere JSZip y una plantilla DOCX etiquetada. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const xesc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c]));
const fields={
 empresa:'empresa',centro_trabajo:'centroTrabajo',direccion:'direccion',nif:'nif',unidad:'unidad',codigo_sala:'codigo',fecha_evaluacion:'fecha',fecha_visita:'fechaVisita',solicitante:'solicitanteEstudio',
 acompanante:'acompananteVisita',cargo_acompanante:'cargoAcompanante',delegado_prevencion:'delegadoPrevencion',
 camas:'camas',nc:'nc',pc:'pc',na:'na',op:'op',
 indice_mapo:'mapo',fs:'fs',fa:'fa',fc:'fc',famb:'famb',ff:'ff',
 factores_organizativos:'informeDescriptivo.organizacion',descripcion_frecuencia:'informeDescriptivo.frecuencia',descripcion_formacion:'informeDescriptivo.formacion',descripcion_instalaciones:'informeDescriptivo.instalaciones'
};
const tables=['tabla_movilizaciones','tabla_equipos','tabla_ayudas_menores','tabla_camas','tabla_higiene','tabla_habitaciones','tabla_planificacion','tabla_resultados'];
const allKeys=[...Object.keys(fields),'nivel_riesgo','conclusiones',...tables];
const path=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function reportData(){
 const mr=window.MAPOMultiRoom,s=mr?.state,room=s?.rooms?.[s.active];
 if(room)return {form:room.formData||{},result:room.lastResult||{}};
 return window.MAPOReportState?.()||{form:{},result:{}};
}
function scalar(key,f,r){
 if(key==='na')return Number(f.nc||0)+Number(f.pc||0);
 if(key==='nivel_riesgo')return String(r.classification||r.riskLevel||r.level||'');
 if(key==='conclusiones')return f.conclusionesInforme||'';
 const name=fields[key];if(!name)return '';
 const v=name==='mapo'?r.mapo:((['fs','fa','fc','famb','ff'].includes(name))?r[name]:path(f,name));
 return typeof v==='number'?Number(v.toFixed(2)).toLocaleString('es-ES',{maximumFractionDigits:2}):v??'';
}
function cell(v){return '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">'+xesc(v)+'</w:t></w:r></w:p></w:tc>';}
function tbl(rows){return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="D0D0D0"/>').join('')+'</w:tblBorders></w:tblPr>'+rows.map(row=>'<w:tr>'+row.map(cell).join('')+'</w:tr>').join('')+'</w:tbl>';}
function rowsFor(key,f,r){
 const desc=f.informeDescriptivo||{};
 if(key==='tabla_ayudas_menores'){const labels={sabana:'Sábana deslizante',tabla:'Tabla deslizante',cinturon:'Cinturón ergonómico',rollbord:'ROLLBORD u otro similar',gruaActiva:'Grúa activa / bipedestación',otro:'Otro'};return [['Ayuda menor','Presencia','Unidades'],...Object.entries(labels).map(([k,l])=>{const e=desc.ayudasMenores?.[k]||{};return [k==='otro'&&e.descripcion?e.descripcion:l,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];})];}
 if(key==='tabla_equipos')return [['Tipo de equipo','Nº','Requisitos','Paciente','Ambiente','Mantenimiento'],...(desc.equiposAyudaDetalle||[]).map(e=>[e.tipo,e.numero,...['requisitos','paciente','ambiente','mantenimiento'].map(k=>e[k]==null?'':e[k]?'Sí':'No')])];
 if(key==='tabla_higiene'){const labels={camillaDucha:'Camilla para ducha',baneraErgonomica:'Bañera ergonómica',duchaErgonomica:'Ducha ergonómica',elevadorBanera:'Elevador para bañera fija',otros:'Otros'};return [['Ayuda','Presencia','Unidades'],...Object.entries(labels).map(([k,l])=>{const e=f.ayudasHigiene?.[k]||{};return [e.descripcion||l,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];})];}
 if(key==='tabla_camas')return [['Tipo de cama','Nº','Eléctrica','Pedal','Nodos','Elevación manual'],...(f.camasRegulablesInforme||[]).map(e=>[e.descripcion,e.numero,e.electrica==null?'':e.electrica?'Sí':'No',e.pedal==null?'':e.pedal?'Sí':'No',e.nodos,e.manual==null?'':e.manual?'Sí':'No'])];
 if(key==='tabla_planificacion'){const p=f.planificacionPreventiva||{};return [['Aspecto deficiente','Prioridad','Medida propuesta','Fecha prevista','Presupuesto','Realizada','Responsable'],...(p.medidas||[]).map(e=>[e.deficiencia,e.prioridad,e.medida,e.fechaPrevista,e.presupuesto,e.fechaRealizacion,e.responsable])];}
 if(key==='tabla_resultados')return [['Dato','Resultado'],...['nc','pc','na','op','fs','fa','fc','famb','ff','indice_mapo','nivel_riesgo'].map(k=>[k.toUpperCase(),scalar(k,f,r)])];
 return null;
}
function normalize(xml){
 // Reúne marcadores fragmentados en varios tramos w:t, sin tocar el resto del documento.
 return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g,p=>{
  const hits=[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  if(hits.length<2)return p;
  const joined=hits.map(m=>m[1]).join('');
  if(!/\{(?:tabla_\w+|empresa|centro_trabajo|indice_mapo)/.test(joined))return p;
  const matches=[...joined.matchAll(/\{([a-z_]+)\}/g)].filter(m=>allKeys.includes(m[1]));
  if(!matches.length)return p;
  // Solo reconstruye el párrafo cuando está formado por un marcador autónomo.
  if(matches.length===1&&joined.trim()===matches[0][0]){
   let i=0;return p.replace(/(<w:t(?:\s[^>]*)?>)[\s\S]*?(<\/w:t>)/g,(_,$1,$2)=>$1+(i++===0?matches[0][0]:'')+$2);
  }
  return p;
 });
}
async function generate(template){
 if(typeof JSZip==='undefined')throw Error('No se ha cargado el componente ZIP necesario para generar DOCX.');
 const zip=await JSZip.loadAsync(template),doc=zip.file('word/document.xml');
 if(!doc)throw Error('El documento seleccionado no es una plantilla DOCX compatible.');
 let xml=normalize(await doc.async('string')),d=reportData(),f=d.form||{},r=d.result||{};
 const found=[...xml.matchAll(/\{([a-z_]+)\}/g)].map(m=>m[1]);const unknown=[...new Set(found.filter(k=>!allKeys.includes(k)))];
 if(unknown.length)throw Error('Marcadores no reconocidos: '+unknown.join(', '));
 if(!found.length)throw Error('La plantilla no contiene marcadores compatibles. Consulte el catálogo de marcadores.');
 for(const key of allKeys){
  if(key.startsWith('tabla_')){
   const rr=rowsFor(key,f,r);if(!rr)continue;
   const token='{'+key+'}';
   if(!xml.includes(token))continue;
   const re=/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
   xml=xml.replace(re,p=>p.includes(token)&&p.replace(/<[^>]+>/g,'').trim()===token?tbl(rr):p);
  }else{xml=xml.split('{'+key+'}').join(xesc(scalar(key,f,r)));}
 }
 zip.file('word/document.xml',xml);
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
 const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='MAPO_'+(f.unidad||'estudio').replace(/[^\w-]+/g,'_')+'.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function createControls(){
 const host=document.getElementById('reportTablesPanel')||document.getElementById('result');if(!host||document.getElementById('mapoGenerateWord'))return;
 const wrap=document.createElement('div');wrap.className='registry-card';wrap.id='mapoGenerateWord';wrap.innerHTML='<h3>Generar informe Word</h3><p>Utilice la plantilla DOCX con marcadores compatibles. La plantilla maestra no se modifica.</p><label>Plantilla Word (.docx) para pruebas<input type="file" accept=".docx" id="mapoWordTemplate"></label><div class="actions"><button type="button" id="mapoDownloadWord">Generar informe Word</button><button type="button" class="secondary" id="mapoWordMarkers">Ver marcadores disponibles</button></div><p id="mapoWordFeedback" role="status"></p><div id="mapoWordMarkerList" hidden></div>';
 host.appendChild(wrap);
 wrap.querySelector('#mapoWordMarkers').onclick=()=>{const box=wrap.querySelector('#mapoWordMarkerList');box.hidden=!box.hidden;box.textContent=allKeys.map(k=>'{'+k+'}').join(' · ');};
 wrap.querySelector('#mapoDownloadWord').onclick=async()=>{const output=wrap.querySelector('#mapoWordFeedback');output.textContent='Preparando documento...';try{const selected=wrap.querySelector('#mapoWordTemplate').files?.[0];let raw;if(selected)raw=await selected.arrayBuffer();else{const response=await fetch('plantillas/MAPO_Hospitalizacion.docx',{cache:'no-store'});if(!response.ok)throw Error('No hay plantilla publicada. Seleccione un DOCX con marcadores para probar.');raw=await response.arrayBuffer();}await generate(raw);output.textContent='Documento generado. Revise el informe en Word.';}catch(e){output.textContent='No se pudo generar: '+e.message;}};
}
function init(){createControls();const result=document.getElementById('result');if(result){const btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent='Generar informe Word';btn.onclick=()=>{window.MAPOResultScreens?.showTables?.();createControls();document.getElementById('mapoGenerateWord')?.scrollIntoView({block:'start'});};result.querySelector('.section-heading .actions')?.appendChild(btn);}}
function openGenerator(){
 const tables=document.getElementById('reportTablesPanel');
 const widget=document.getElementById('mapoGenerateWord');
 if(tables&&widget&&widget.parentElement!==tables)tables.appendChild(widget);
 else if(!widget)createControls();
 document.getElementById('mapoGenerateWord')?.scrollIntoView({block:'start'});
}
window.MAPOWordGenerator={generate,markers:allKeys,open:openGenerator};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();