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
const allKeys=[...Object.keys(fields),'nivel_riesgo','conclusiones','descripcion_equipos','tabla_fotos_equipos','medidas_planificacion','prioridad_planificacion','pmwc','pmb','pmh','pmamb',...tables,...moreTables];
const path=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
function reportData(){
 const mr=window.MAPOMultiRoom,s=mr?.state,room=s?.rooms?.[s.active];
 if(room)return {form:room.formData||{},result:room.lastResult||{}};
 return window.MAPOReportState?.()||{form:{},result:{}};
}
function europeanDate(v){const text=String(v??'');const m=/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);return m?m[3]+'/'+m[2]+'/'+m[1]:text;}
function scalar(key,f,r){
 if(key==='na')return Number(f.nc||0)+Number(f.pc||0);
 if(key==='fecha_evaluacion'||key==='fecha_visita')return europeanDate(path(f,fields[key]));
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

async function insertEquipmentPhotos(zip,xml,f){
 const entries=(f.informeDescriptivo?.equipos||[]).filter(e=>e&&(e.modelo||e.nombre||e.descripcion||e.imagen));
 const token=xml.includes('{tabla_fotos_equipos}')?'{tabla_fotos_equipos}':'{descripcion_equipos}';
 if(!xml.includes(token)||!entries.some(e=>e.imagen?.startsWith('data:image/')))return {xml,inserted:false};
 const para=/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
 const candidates=[...xml.matchAll(para)].filter(m=>m[0].includes(token));
 const target=candidates.find(m=>m[0].replace(/<[^>]+>/g,'').trim()===token);
 if(!target)throw Error('El marcador '+token+' debe estar en un párrafo independiente para insertar fotografías.');
 const relsPath='word/_rels/document.xml.rels';
 const relsFile=zip.file(relsPath);
 if(!relsFile)throw Error('Falta el archivo de relaciones DOCX.');
 let rels=await relsFile.async('string');
 let ct=await zip.file('[Content_Types].xml').async('string');
 if(!/Extension="jpe?g"/i.test(ct))ct=ct.replace('</Types>','<Default Extension="jpeg" ContentType="image/jpeg"/></Types>');
 let rid=1;while(rels.includes('Id="rId'+rid+'"'))rid++;
 let pid=1000;while(xml.includes('id="'+pid+'"'))pid++;
 const drawing=(relationship,id)=>'<w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="2400000" cy="1750000"/><wp:docPr id="'+id+'" name="Fotografía equipo '+id+'"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Equipo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+relationship+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2400000" cy="1750000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
 const photoCell=(body)=>'<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr><w:p><w:r>'+body+'</w:r></w:p></w:tc>';
 let rows='<w:tr>'+cell('Equipo / modelo')+cell('Fotografía')+'</w:tr>';
 for(let i=0;i<entries.length;i++){
  const e=entries[i];
  const label=[e.nombre,e.descripcion,e.marca,e.modelo].filter(Boolean).join(' · ')||'Equipo '+(i+1);
  let photo=cell('Sin fotografía');
  const m=/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(e.imagen||'');
  if(m){
   const ext=m[1]==='jpg'?'jpeg':m[1];
   const contentType=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
   if(!new RegExp('Extension="'+ext+'"','i').test(ct))ct=ct.replace('</Types>','<Default Extension="'+ext+'" ContentType="'+contentType+'"/></Types>');
   const name='mapo_equipo_'+i+'.'+ext,rel='rId'+rid++;
   zip.file('word/media/'+name,m[2].replace(/\s/g,''),{base64:true});
   rels=rels.replace('</Relationships>','<Relationship Id="'+rel+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'+name+'"/></Relationships>');
   photo=photoCell(drawing(rel,pid++));
  }
  rows+='<w:tr>'+cell(label)+photo+'</w:tr>';
 }
 const table='<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="D0D0D0"/>').join('')+'</w:tblBorders></w:tblPr>'+rows+'</w:tbl>';
 xml=xml.replace(target[0],table);
 zip.file(relsPath,rels);zip.file('[Content_Types].xml',ct);
 return {xml,inserted:true};
}

function replaceUnitX(xml,unit){
 const name=String(unit??'').trim();
 if(!name)return xml;
 let precedingUnit=false;
 return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g,p=>{
  const hits=[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  if(!hits.length){precedingUnit=false;return p;}
  const joined=hits.map(m=>m[1]).join('');
  const plain=joined.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  const positions=[];
  const re=/\bunidad\s*(?:[·:\-]\s*)?x\b/gi;
  for(const m of plain.matchAll(re))positions.push(m.index+m[0].length-1);
  if(precedingUnit&&/^\s*x\s*$/i.test(plain))positions.push(plain.search(/x/i));
  precedingUnit=/\bunidad\s*(?:[·:\-]\s*)?$/i.test(plain.trim());
  if(!positions.length)return p;
  // Editar únicamente el carácter X, conservando los estilos y párrafos del modelo.
  const indices=new Set(positions);
  let offset=0,idx=0;
  return p.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,(_all,opening,value,closing)=>{
   const updated=[...value].map((ch,i)=>indices.has(offset+i)?xesc(name):ch).join('');
   offset+=value.length;idx++;
   return opening+updated+closing;
  });
 });
}

function positionDescriptionAfterHeading(xml,token,headingPattern){
 const paragraphs=[...xml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)];
 const plain=p=>[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(x=>x[1]).join('').replace(/&nbsp;|&#160;/g,' ').trim();
 const source=paragraphs.find(x=>plain(x[0])===token);
 if(!source)return xml;
 const heading=paragraphs.find(x=>x.index>source.index&&x.index-source.index<12000&&headingPattern.test(plain(x[0])));
 if(!heading)return xml;
 const between=xml.slice(source.index+source[0].length,heading.index);
 if(/<w:tbl\b|<\/w:tc>|<w:sectPr\b/.test(between))return xml;
 return xml.slice(0,source.index)+xml.slice(source.index+source[0].length,heading.index+heading[0].length)+source[0]+xml.slice(heading.index+heading[0].length);
}
function positionDescriptions(xml){
 const items=[
  ['{factores_organizativos}',/^factores\s+organizativos\s*:/i],
  ['{descripcion_frecuencia}',/^(?:descripci[oó]n\s+(?:de\s+la\s+)?|frecuencia\s+(?:de\s+las?\s+)?)?frecuencia\b|^frecuencia\b/i],
  ['{descripcion_formacion}',/^(?:descripci[oó]n\s+(?:de\s+la\s+)?)?formaci[oó]n\b|^factor\s+formaci[oó]n\b/i],
  ['{descripcion_instalaciones}',/^(?:(?:descripci[oó]n\s+de\s+las?\s+)?instalaciones|caracter[ií]sticas\s+de\s+las?\s+instalaciones)\b/i],
  ['{descripcion_equipos}',/^(?:(?:descripci[oó]n\s+de\s+los?\s+)?equipos\s+de\s+ayuda|equipos\s+disponibles|equipos\s+de\s+elevaci[oó]n)\b/i],
  ['{tabla_fotos_equipos}',/^(?:(?:descripci[oó]n\s+de\s+los?\s+)?equipos\s+de\s+ayuda|equipos\s+disponibles|equipos\s+de\s+elevaci[oó]n)\b/i]
 ];
 for(const [token,pattern] of items)xml=positionDescriptionAfterHeading(xml,token,pattern);
 return xml;
}

function fillOriginalTables(xml,f,r){
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('No se ha podido interpretar la plantilla Word.');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const elements=(node,tag)=>Array.from(node?.childNodes||[]).filter(n=>n.nodeType===1&&n.localName===tag&&n.namespaceURI===ns);
 const text=node=>Array.from(node?.getElementsByTagNameNS(ns,'t')||[]).map(n=>n.textContent).join('');
 const rows=table=>elements(table,'tr'),cells=row=>elements(row,'tc');
 const locate=key=>{
  const p=Array.from(doc.getElementsByTagNameNS(ns,'p')).find(n=>text(n).trim()==='{'+key+'}');
  if(!p)return null;
  let next=p.nextSibling;while(next&&next.nodeType!==1)next=next.nextSibling;
  if(!next||next.localName!=='tbl')return null;
  return {p,table:next};
 };
 const fill=(tc,value)=>{
  if(!tc)return;
  let p=elements(tc,'p')[0];if(!p){p=doc.createElementNS(ns,'w:p');tc.appendChild(p);}
  let t=p.getElementsByTagNameNS(ns,'t')[0];if(!t){
   let run=elements(p,'r')[0];if(!run){run=doc.createElementNS(ns,'w:r');p.appendChild(run);}
   t=doc.createElementNS(ns,'w:t');run.appendChild(t);
  }
  for(const n of Array.from(tc.getElementsByTagNameNS(ns,'t')))n.textContent='';
  t.textContent=String(value??'');
  t.setAttribute('xml:space','preserve');
 };
 const set=(table,row,cell,value)=>{const rr=rows(table)[row];if(rr)fill(cells(rr)[cell],value);};
 const clearMarker=p=>p.parentNode.removeChild(p);
 const direct={
  tabla_personal:()=>{const x=locate('tabla_personal');if(!x)return;const t=x.table,w=f.workerSchedule||{};
   // Mantener la ficha corporativa y su estructura combinada.
   set(t,3,0,f.unidad||'');set(t,3,1,f.codigo||'');set(t,3,2,f.camas||'');
   set(t,20,1,Number(f.op||0).toLocaleString('es-ES',{maximumFractionDigits:4}));
   // La tabla distribuye turnos en columnas: mañana, tarde y noche.
   const sh=w.shifts||{};const shifts=['morning','afternoon','night'];
   shifts.forEach((k,i)=>{const v=sh[k];if(v)set(t,11,i+1,[v.start,v.end].filter(Boolean).join(' - '));});
   set(t,33,1,f.nc??'');set(t,33,2,f.pc??'');set(t,34,1,f.na??'');
   clearMarker(x.p);
  },
  tabla_formacion:()=>{const x=locate('tabla_formacion');if(!x)return;const t=x.table;
   set(t,2,1,f.ff_curso?'SÍ':'NO');set(t,4,3,f.ff_informacion?'SÍ':'NO');
   set(t,5,1,f.ff_cobertura??'');set(t,6,1,f.ff_eficacia?'SÍ':'NO');clearMarker(x.p);
  }
 };
 Object.values(direct).forEach(fn=>fn());
 const bindings=[
  ['tabla_movilizaciones_manuales','mobilizations',4],
  ['tabla_movilizaciones_asistidas','mobilizations',3],
  ['tabla_equipos','equips',3],
  ['tabla_ayudas_menores','minor',2],
  ['tabla_camas','beds',2]
 ];
 for(const [key,type,first] of bindings){
  const x=locate(key);if(!x)continue;const t=x.table;
  if(type==='mobilizations'){
   const fields=key.endsWith('manuales')?['manualTotal','manualPartial']:['aidedTotal','aidedPartial'];
   const ids=['head_bed','bed_wheelchair','wheelchair_bed','bed_stretcher','stretcher_bed','wheelchair_toilet','toilet_wheelchair','bed_turning','sit_to_stand'];
   const entries=f.mobilizations?.entries||{};
   for(let i=0;i<ids.length;i++){const e=entries[ids[i]]||{};if(!rows(t)[first+i])break;
    const values=fields.flatMap(k=>(e[k]||[0,0,0]).slice(0,3));
    const cc=cells(rows(t)[first+i]);
    // Evitar sobrescribir textos de tareas (primera celda).
    for(let j=0;j<Math.min(6,cc.length-1);j++)fill(cc[j+1],values[j]||'');
   }
  }else if(type==='equips'){
   const entries=f.informeDescriptivo?.equiposAyudaDetalle||[];
   entries.slice(0,5).forEach((e,i)=>{
    const rr=rows(t)[first+i];if(!rr)return;const cc=cells(rr);
    fill(cc[0],e.tipo||'');if(cc[1])fill(cc[1],e.numero??'');
   });
  }else if(type==='minor'){
   const aids=f.informeDescriptivo?.ayudasMenores||{};
   ['sabana','tabla','cinturon','rollbord','gruaActiva'].forEach((k,i)=>{
    const rr=rows(t)[first+i];if(!rr)return;const cc=cells(rr),v=aids[k]||{};
    if(cc[1])fill(cc[1],v.presencia==null?'':v.presencia?'SÍ':'NO');
    if(cc[2])fill(cc[2],v.numero??'');
   });
  }else if(type==='beds'){
   (f.camasRegulablesInforme||[]).slice(0,4).forEach((e,i)=>{
    const rr=rows(t)[first+i];if(!rr)return;const cc=cells(rr);
    [e.descripcion,e.numero,e.electrica?'SÍ':'NO',e.pedal?'SÍ':'NO',e.nodos,e.manual?'SÍ':'NO'].forEach((v,j)=>{if(cc[j])fill(cc[j],v??'');});
   });
  }
  clearMarker(x.p);
 }
 // Matrices corporativas de inadecuaciones, conservando sus títulos y ponderaciones.
 const matrices=[
  ['tabla_sillas',Object.entries(f.wheelchairs?.entries||{}).filter(([,v])=>Number(v.count)>0).map(([name,v])=>({description:name,units:v.count,brakes:!v.brakes,arms:!v.arms,back:!v.back,width:!v.width})),[{row:3,key:'brakes'},{row:4,key:'arms'},{row:5,key:'back'},{row:6,key:'width'}],9],
  ['tabla_banos_higiene',f.bathTypes||[],[{row:5,key:'space'},{row:6,key:'door'},{row:8,key:'obstacles'}],12],
  ['tabla_banos_wc',f.wcTypes||[],[{row:5,key:'space'},{row:6,key:'height'},{row:7,key:'bar'},{row:8,key:'door'},{row:9,key:'lateral'}],11],
  ['tabla_habitaciones',f.roomTypes||[],[{row:5,key:'between'},{row:6,key:'foot'},{row:7,key:'bedSection'},{row:8,key:'underbed'},{row:9,key:'chairHeight'}],15]
 ];
 for(const [key,items,criteria,unitsRow] of matrices){
  const x=locate(key);if(!x)continue;
  const t=x.table,max=Math.min(items.length,6);
  for(let j=0;j<max;j++){
   const entry=items[j];
   for(const criterion of criteria){
    const cc=cells(rows(t)[criterion.row]);if(cc[2+j])fill(cc[2+j],entry[criterion.key]?'X':'');
   }
   const unitCells=cells(rows(t)[unitsRow]);if(unitCells[1+j])fill(unitCells[1+j],entry.units??'');
  }
  clearMarker(x.p);
 }
 // Otros bloques conservan la tabla de la plantilla, y se elimina solamente
 // el marcador anterior. No crear una tabla genérica duplicada.
 const rest=['tabla_sillas','tabla_banos_higiene','tabla_banos_wc','tabla_habitaciones','tabla_fs_criterios','tabla_fs_adecuacion','tabla_fs_resultado','tabla_fa_criterios','tabla_fa_adecuacion','tabla_fa_resultado','tabla_fc_suficiencia','tabla_fc_resultado','tabla_famb_resultado','tabla_ff_resultado','tabla_planificacion','tabla_resultados','tabla_higiene','tabla_movilizaciones'];
 for(const key of rest){const x=locate(key);if(x)clearMarker(x.p);}
 return new XMLSerializer().serializeToString(doc);
}
async function generate(template){
 if(typeof JSZip==='undefined')throw Error('No se ha cargado el componente ZIP necesario para generar DOCX.');
 const zip=await JSZip.loadAsync(template),doc=zip.file('word/document.xml');
 if(!doc)throw Error('El documento seleccionado no es una plantilla DOCX compatible.');
 let xml=normalize(await doc.async('string')),d=reportData(),f=d.form||{},r=d.result||{};
 xml=replaceUnitX(xml,f.unidad);
 xml=positionDescriptions(xml);
 if(!Number.isFinite(Number(r.mapo)))throw Error('No hay resultados MAPO calculados para esta unidad. Calcule el índice antes de generar el informe.');
 const found=[...xml.matchAll(/\{([a-z_]+)\}/g)].map(m=>m[1]);const unknown=[...new Set(found.filter(k=>!allKeys.includes(k)))];
 if(unknown.length)throw Error('Marcadores no reconocidos: '+unknown.join(', '));
 if(!found.length)throw Error('La plantilla no contiene marcadores compatibles. Consulte el catálogo de marcadores.');
 const photos=await insertEquipmentPhotos(zip,xml,f);xml=photos.xml;
 xml=fillOriginalTables(xml,f,r);
 for(const key of allKeys){
  if(key.startsWith('tabla_')|| (key==='descripcion_equipos'&&photos.inserted))continue;
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