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
const moreTables=['tabla_personal','tabla_formacion','tabla_movilizaciones_manuales','tabla_movilizaciones_asistidas','tabla_sillas','tabla_banos_higiene','tabla_banos_wc','tabla_fs_criterios','tabla_fs_adecuacion','tabla_fs_resultado','tabla_fa_criterios','tabla_fa_adecuacion','tabla_fa_resultado','tabla_fc_suficiencia','tabla_fc_resultado','tabla_famb_resultado','tabla_ff_resultado'];
const allKeys=[...Object.keys(fields),'nivel_riesgo','conclusiones','descripcion_equipos','medidas_planificacion','prioridad_planificacion','pmwc','pmb','pmh','pmamb',...tables,...moreTables];
const path=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function reportData(){
 const mr=window.MAPOMultiRoom,s=mr?.state,room=s?.rooms?.[s.active];
 if(room)return {form:room.formData||{},result:room.lastResult||{}};
 return window.MAPOReportState?.()||{form:{},result:{}};
}
function scalar(key,f,r){
 if(key==='na')return Number(f.nc||0)+Number(f.pc||0);
 if(key==='nivel_riesgo')return String(r.nivel||r.classification||r.riskLevel||r.level||'');
 if(key==='descripcion_equipos')return (f.informeDescriptivo?.equipos||[]).map(x=>typeof x==='string'?x:[x.nombre,x.descripcion,x.marca,x.modelo].filter(Boolean).join(' · ')).join('; ');
 if(['pmwc','pmb','pmh','pmamb'].includes(key)){const k={pmwc:'pmWC',pmb:'pmB',pmh:'pmH',pmamb:'pmamb'}[key];const v=r.details?.[k];return Number.isFinite(v)?v.toFixed(2).replace('.',','):'';}
 if(key==='conclusiones')return f.conclusionesInforme||'';
 if(key==='medidas_planificacion')return (f.planificacionPreventiva?.medidas||[]).map(x=>x.medida).filter(Boolean).join('; ');
 if(key==='prioridad_planificacion'){const x=Number(r.mapo);return r.mapo==null||!Number.isFinite(x)?'':x<=1.5?'---':x<=5?'3':'2';}
 const name=fields[key];if(!name)return '';
 const v=name==='mapo'?r.mapo:((['fs','fa','fc','famb','ff'].includes(name))?r[name]:path(f,name));
 return typeof v==='number'?Number(v.toFixed(2)).toLocaleString('es-ES',{maximumFractionDigits:2}):v??'';
}
function cell(v){return '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">'+xesc(v)+'</w:t></w:r></w:p></w:tc>';}
function tbl(rows){return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="D0D0D0"/>').join('')+'</w:tblBorders></w:tblPr>'+rows.map(row=>'<w:tr>'+row.map(cell).join('')+'</w:tr>').join('')+'</w:tbl>';}
function rowsFor(key,f,r){
 const desc=f.informeDescriptivo||{};
 if(key==='tabla_ayudas_menores'){const labels={sabana:'Sábana deslizante',tabla:'Tabla deslizante',cinturon:'Cinturón ergonómico',rollbord:'ROLLBORD u otro similar',gruaActiva:'Grúa activa / bipedestación'};const row=(name,e)=>[name,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];const extras=(desc.ayudasMenoresAdicionales||[]).filter(e=>e.descripcion?.trim()).map(e=>row(e.descripcion,e));const legacy=desc.ayudasMenores?.otro;return [['Ayuda menor','Presencia','Unidades'],...Object.entries(labels).map(([k,l])=>row(l,desc.ayudasMenores?.[k]||{})),...extras,...(legacy?.descripcion?.trim()?[row(legacy.descripcion,legacy)]:[])];}
 if(key==='tabla_equipos')return [['Tipo de equipo','Nº','Requisitos','Paciente','Ambiente','Mantenimiento'],...(desc.equiposAyudaDetalle||[]).map(e=>[e.tipo,e.numero,...['requisitos','paciente','ambiente','mantenimiento'].map(k=>e[k]==null?'':e[k]?'Sí':'No')])];
 if(key==='tabla_higiene'){const labels={camillaDucha:'Camilla para ducha',baneraErgonomica:'Bañera ergonómica',duchaErgonomica:'Ducha ergonómica',elevadorBanera:'Elevador para bañera fija'};const row=(name,e)=>[name,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];const extras=(f.ayudasHigieneAdicionales||[]).filter(e=>e.descripcion?.trim()).map(e=>row(e.descripcion,e));const legacy=f.ayudasHigiene?.otros;return [['Ayuda','Presencia','Unidades'],...Object.entries(labels).map(([k,l])=>row(l,f.ayudasHigiene?.[k]||{})),...extras,...(legacy?.descripcion?.trim()?[row(legacy.descripcion,legacy)]:[])];}
 if(key==='tabla_camas')return [['Tipo de cama','Nº','Eléctrica','Pedal','Nodos','Elevación manual'],...(f.camasRegulablesInforme||[]).map(e=>[e.descripcion,e.numero,e.electrica==null?'':e.electrica?'Sí':'No',e.pedal==null?'':e.pedal?'Sí':'No',e.nodos,e.manual==null?'':e.manual?'Sí':'No'])];
 if(key==='tabla_planificacion'){const p=f.planificacionPreventiva||{};const indice=Number(r.mapo);const prioridad=r.mapo===null||r.mapo===undefined||r.mapo===''||!Number.isFinite(indice)||indice<0?'':indice<=1.5?'---':indice<=5?'3':'2';const rows=[['Aspecto deficiente','Prioridad','Medida propuesta','Fecha prevista de aplicación','Presupuesto','Fecha de realización','Responsable'],...(p.medidas||[]).map(e=>['Trastornos musculoesqueléticos — movilización manual de pacientes',prioridad,e.medida||'','','','',''])];rows.push(['Alternativas a las medidas propuestas','','','','','','']);rows.push(['Aprobado por','','','','','','']);rows.push(['Fecha de aprobación','','','','','','']);return rows;}
 const yes=v=>v===true?'Sí':v===false?'No':v??'';
 const standard=(title,cols,items)=>[[title,...cols],...(items||[]).map(x=>[x.description||x.descripcion||x.tipo||'',x.units??x.numero??'',...cols.slice(1).map(k=>yes(x[k]))])];
 if(key==='tabla_personal'){const w=f.workerSchedule||{};return [['Personal','Horario inicio','Horario fin','Número'],...(w.full||[]).filter(x=>x.start||x.end||x.people).map(x=>['Jornada completa',x.start,x.end,x.people]),...(w.partial||[]).filter(x=>x.start||x.end||x.people).map(x=>['Jornada parcial',x.start,x.end,x.people]),['OP total','','',f.op??'']];}
 if(key==='tabla_formacion')return [['Datos de formación','Valor'],['Curso teórico-práctico',yes(f.ff_curso)],['Formación reciente',yes(f.ff_antiguedad)],['Eficacia verificada',yes(f.ff_eficacia)],['Información/adiestramiento',yes(f.ff_informacion)],['Cobertura (%)',f.ff_cobertura??'']];
 if(key==='tabla_movilizaciones_manuales'||key==='tabla_movilizaciones_asistidas'){const manual=key.endsWith('_manuales'),entries=f.mobilizations?.entries||{},custom=f.mobilizations?.custom||[];const names=Object.fromEntries(custom.map(x=>[x.id,x.name]));const fields=manual?['manualTotal','manualPartial']:['aidedTotal','aidedPartial'];return [['Movilización','Total mañana','Total tarde','Total noche','Parcial mañana','Parcial tarde','Parcial noche'],...Object.entries(entries).filter(([id,x])=>fields.some(k=>(x[k]||[]).some(n=>Number(n)>0))).map(([id,x])=>[names[id]||id,...fields.flatMap(k=>[0,1,2].map(i=>Number(x[k]?.[i]||0)))])];}
 if(key==='tabla_sillas'){const entries=f.wheelchairs?.entries||{};return [['Tipo de silla','Unidades','Frenos adecuados','Reposabrazos adecuados','Respaldo adecuado','Anchura adecuada'],...Object.entries(entries).filter(([k,x])=>Number(x.count)>0).map(([k,x])=>[k,x.count,yes(x.brakes),yes(x.arms),yes(x.back),yes(x.width)])];}
 if(key==='tabla_banos_higiene'||key==='tabla_banos_wc'){const bath=key.endsWith('_higiene'),data=bath?f.bathTypes:f.wcTypes;const cols=bath?['Espacio','Puerta','Obstáculos']:['Espacio','Altura WC','Barra de apoyo','Puerta','Espacio lateral'];const fields=bath?['space','door','obstacles']:['space','height','bar','door','lateral'];return [['Tipo de baño','Unidades',...cols],...(data||[]).map(x=>[x.description||'',x.units??'',...fields.map(k=>yes(x[k]))])];}
 if(key==='tabla_habitaciones')return [['Tipo de habitación','Unidades','Espacio camas','Espacio pies','Sección de cama','Espacio bajo cama','Sillón'],...(f.roomTypes||[]).map(x=>[x.description||'',x.units??'',...['between','foot','bedSection','underbed','chairHeight'].map(k=>yes(x[k]))])];
 if(key==='tabla_fs_criterios')return [['Criterio FS','Cumplimiento'],['Elevadores',yes(f.fs_elevadores)],['Camillas',yes(f.fs_camillas)],['Camas regulables 3 nodos',yes(f.fs_camas3)]];
 if(key==='tabla_fs_adecuacion')return [['Adecuación FS','Resultado'],['Movilizaciones totales con ayuda (%)',r.taskTotals?.pLTA??''],['Adecuación',yes(r.details?.fsAdequate)],['Suficiencia',yes(r.details?.fsSufficient)]];
 if(key==='tabla_fs_resultado')return [['Factor FS','Valor'],['FS',r.fs??'']];
 if(key==='tabla_fa_criterios')return [['Criterio FA','Cumplimiento'],['Sábana o tabla deslizante',yes(f.fa_sabana)],['Otras ayudas',yes(f.fa_dos)],['Camas con tres nodos',yes(f.fa_camas3)]];
 if(key==='tabla_fa_adecuacion')return [['Adecuación FA','Resultado'],['Movilizaciones parciales con ayuda (%)',r.taskTotals?.pLPA??''],['Adecuación',yes(r.details?.faAdequate)],['Suficiencia',yes(r.details?.faSufficient)]];
 if(key==='tabla_fa_resultado')return [['Factor FA','Valor'],['FA',r.fa??'']];
 if(key==='tabla_fc_suficiencia')return [['Criterio FC','Valor'],['Sillas totales',r.details?.tsr??''],['Pacientes no autónomos',f.na??(Number(f.nc||0)+Number(f.pc||0))],['Suficiencia',yes(r.details?.fcSufficient)],['PMSR',r.details?.pmsr??'']];
 if(key==='tabla_fc_resultado')return [['Factor FC','Valor'],['FC',r.fc??'']];
 if(key==='tabla_famb_resultado')return [['Factor ambiente','Valor'],['PMB',r.details?.pmB??''],['PMWC',r.details?.pmWC??''],['PMH',r.details?.pmH??''],['PMamb',r.details?.pmamb??''],['Famb',r.famb??'']];
 if(key==='tabla_ff_resultado')return [['Factor FF','Valor'],['FF',r.ff??'']];
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
 if(!Number.isFinite(Number(r.mapo)))throw Error('No hay resultados MAPO calculados para esta unidad. Calcule el índice antes de generar el informe.');
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
 const host=document.getElementById('wordReportPanel');
 if(!host||document.getElementById('mapoGenerateWord'))return;
 const wrap=document.createElement('div');
 wrap.className='registry-card';
 wrap.id='mapoGenerateWord';
 wrap.innerHTML='<h3>Generar informe Word</h3><div class="actions"><button type="button" id="mapoDownloadWord">Generar informe Word</button></div><p id="mapoWordFeedback" role="status"></p>';
 host.appendChild(wrap);
 wrap.querySelector('#mapoDownloadWord').onclick=async()=>{
  const output=wrap.querySelector('#mapoWordFeedback'),button=wrap.querySelector('#mapoDownloadWord');
  button.disabled=true;output.textContent='Preparando documento...';
  try{
   const response=await fetch('plantillas/MAPO_Hospitalizacion.docx',{cache:'no-store'});
   if(!response.ok)throw Error('La plantilla oficial no está disponible en la carpeta plantillas/ del programa.');
   await generate(await response.arrayBuffer());
   output.textContent='Documento generado. Revise el informe en Word.';
  }catch(e){output.textContent='No se pudo generar el informe: '+e.message;}
  finally{button.disabled=false;}
 };
}
function init(){createControls();const result=document.getElementById('result');if(result&&!result.querySelector('#openGeneratorFromResult')){const btn=document.createElement('button');btn.type='button';btn.id='openGeneratorFromResult';btn.className='secondary';btn.textContent='Generar informe Word';btn.onclick=()=>window.MAPOResultScreens?.showWord?.();result.querySelector('.section-heading .actions')?.appendChild(btn);}}
function openGenerator(){return window.MAPOResultScreens?.showWord?.();}
window.MAPOWordGenerator={generate,markers:allKeys,open:openGenerator,prepare:createControls};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();