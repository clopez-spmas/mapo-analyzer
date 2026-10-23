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
 if(key==='tabla_movilizaciones_manuales'||key==='tabla_movilizaciones_asistidas'){
  const manual=key.endsWith('_manuales'),entries=f.mobilizations?.entries||{},custom=f.mobilizations?.custom||[];
  const builtinNames={wheelchair_bed:'De silla de ruedas a cama',bed_wheelchair:'De cama a silla de ruedas',wheelchair_toilet:'De silla de ruedas a inodoro',toilet_wheelchair:'De inodoro a silla de ruedas',bed_turning:'Giro o cambio postural en cama',bed_shower:'De cama a ducha',wheelchair_armchair:'De silla de ruedas a sillón',armchair_wheelchair:'De sillón a silla de ruedas',bed_stretcher:'De cama a camilla',stretcher_bed:'De camilla a cama',sit_to_stand:'Incorporación a bipedestación'};
  const names={...builtinNames,...Object.fromEntries(custom.map(x=>[x.id,x.name]))};
  const types=manual?['manualTotal','manualPartial']:['aidedTotal','aidedPartial'];
  return [['Movilización','Total mañana','Total tarde','Total noche','Parcial mañana','Parcial tarde','Parcial noche'],
   ...Object.entries(entries).filter(([id,x])=>types.some(k=>(x[k]||[]).some(n=>Number(n)>0)))
   .map(([id,x])=>[names[id]||id,...[...types].flatMap(k=>[0,1,2].map(i=>Number(x[k]?.[i]||0)))])];
 }
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
  if(!/\{[a-z_]+\}/.test(joined))return p;
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

 const styleCorporate=(table,sectionRows=[])=>{
  let pr=elements(table,'tblPr')[0];
  if(!pr){pr=doc.createElementNS(ns,'w:tblPr');table.insertBefore(pr,table.firstChild);}
  const borders=doc.createElementNS(ns,'w:tblBorders');
  for(const side of ['bottom','insideH']){
   const v=doc.createElementNS(ns,'w:'+side);v.setAttributeNS(ns,'w:val','single');v.setAttributeNS(ns,'w:sz','4');v.setAttributeNS(ns,'w:color','B4C8D7');borders.appendChild(v);
  }
  for(const side of ['top','left','right','insideV']){
   const v=doc.createElementNS(ns,'w:'+side);v.setAttributeNS(ns,'w:val','nil');borders.appendChild(v);
  }
  pr.appendChild(borders);
  const margins=doc.createElementNS(ns,'w:tblCellMar');
  for(const side of ['top','bottom','left','right']){
   const e=doc.createElementNS(ns,'w:'+side);e.setAttributeNS(ns,'w:w',side==='left'||side==='right'?'105':'75');e.setAttributeNS(ns,'w:type','dxa');margins.appendChild(e);
  }
  pr.appendChild(margins);
  rows(table).forEach((row,i)=>{
   const banner=sectionRows.includes(i),head=i===0||banner;
   if(head){const trPr=elements(row,'trPr')[0]||doc.createElementNS(ns,'w:trPr');if(!trPr.parentNode)row.insertBefore(trPr,row.firstChild);
    const repeat=doc.createElementNS(ns,'w:tblHeader');trPr.appendChild(repeat);
   }
   cells(row).forEach(tc=>{
    if(head){let tcPr=elements(tc,'tcPr')[0];if(!tcPr){tcPr=doc.createElementNS(ns,'w:tcPr');tc.insertBefore(tcPr,tc.firstChild);}
     const shd=doc.createElementNS(ns,'w:shd');shd.setAttributeNS(ns,'w:fill',banner?'194986':'D9E8F1');tcPr.appendChild(shd);
    }
    for(const run of Array.from(tc.getElementsByTagNameNS(ns,'r'))){
     let rp=elements(run,'rPr')[0];if(!rp){rp=doc.createElementNS(ns,'w:rPr');run.insertBefore(rp,run.firstChild);}
     if(head){rp.appendChild(doc.createElementNS(ns,'w:b'));if(banner){const color=doc.createElementNS(ns,'w:color');color.setAttributeNS(ns,'w:val','FFFFFF');rp.appendChild(color);}}
    }
   });
  });
 };
 const separateCorporateTable=(table)=>{
  const p=doc.createElementNS(ns,'w:p'),pr=doc.createElementNS(ns,'w:pPr'),spacing=doc.createElementNS(ns,'w:spacing');
  spacing.setAttributeNS(ns,'w:after','170');pr.appendChild(spacing);p.appendChild(pr);
  table.parentNode.insertBefore(p,table.nextSibling);
 };
 const direct={
  tabla_personal:()=>{const x=locate('tabla_personal');if(!x)return;const original=x.table,w=f.workerSchedule||{};
   const make=(tag)=>doc.createElementNS(ns,'w:'+tag);
   const tr=(values,header=false)=>{
    const row=make('tr');
    values.forEach(value=>{
     const tc=make('tc'),tcPr=make('tcPr'),p=make('p'),run=make('r'),rp=make('rPr'),txt=make('t');
     tcPr.appendChild(make('tcW')).setAttributeNS(ns,'w:type','auto');
     tc.appendChild(tcPr);
     if(header){const bold=make('b');rp.appendChild(bold);}
     const font=make('sz');font.setAttributeNS(ns,'w:val','18');rp.appendChild(font);
     run.appendChild(rp);txt.textContent=String(value??'');txt.setAttribute('xml:space','preserve');
     run.appendChild(txt);p.appendChild(run);tc.appendChild(p);row.appendChild(tc);
    });return row;
   };
   const table=make('tbl');
   const tblPr=elements(original,'tblPr')[0];if(tblPr)table.appendChild(tblPr.cloneNode(true));
   const tblGrid=make('tblGrid');for(let i=0;i<4;i++){const c=make('gridCol');c.setAttributeNS(ns,'w:w','2200');tblGrid.appendChild(c);}table.appendChild(tblGrid);
   const format=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('es-ES',{maximumFractionDigits:4}):'';
   const date=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'');};
   const idRows=[
    [['IDENTIFICACIÓN DE LA UNIDAD','','',''],true],
    [['Empresa',f.empresa||'','Centro de trabajo',f.centroTrabajo||'']],
    [['Sala / unidad',f.unidad||'','Fecha de evaluación',date(f.fecha)]],
    [['Código de sala',f.codigo||'','Número de camas',f.camas??'']],
    [['Dirección',f.direccion||'','NIF',f.nif||'']]
   ];
   const staffRows=[
    [['PERSONAL QUE REALIZA MOVILIZACIÓN MANUAL DE PACIENTES','','',''],true],
    [['Tipo de jornada','Hora de inicio','Hora de fin','N.º de personas'],true]
   ];
   (w.full||[]).filter(e=>e.start||e.end||e.people).forEach(e=>staffRows.push([['Jornada completa',e.start||'',e.end||'',e.people??'']]));
   (w.partial||[]).filter(e=>e.start||e.end||e.people).forEach(e=>staffRows.push([['Jornada parcial',e.start||'',e.end||'',e.people??'']]));
   staffRows.push([['TOTAL PERSONAL EXPUESTO (OP)',format(f.op),'','']]);
   const patientRows=[
    [['TIPOLOGÍA DE PACIENTES','Número','',''],true],
    [['Pacientes no colaboradores (NC)',f.nc??'','','']],
    [['Pacientes parcialmente colaboradores (PC)',f.pc??'','','']],
    [['Pacientes no autónomos (NA)',f.na??Number(f.nc||0)+Number(f.pc||0),'','']]
   ];
   const parent=original.parentNode;
   const blocks=[idRows,staffRows,patientRows];
   for(const [i,block] of blocks.entries()){
    const separate=make('tbl');
    const tblPr=elements(original,'tblPr')[0];if(tblPr)separate.appendChild(tblPr.cloneNode(true));
    const grid=make('tblGrid');for(let col=0;col<4;col++){const c=make('gridCol');c.setAttributeNS(ns,'w:w','2200');grid.appendChild(c);}separate.appendChild(grid);
    block.forEach(([values,header])=>separate.appendChild(tr(values,header)));
    styleCorporate(separate,i===1?[0]:[0]);
    parent.insertBefore(separate,original);
    separateCorporateTable(separate);
   }
   parent.removeChild(original);
   clearMarker(x.p);
  },
  tabla_formacion:()=>{const x=locate('tabla_formacion');if(!x)return;const t=x.table;
   set(t,2,1,f.ff_curso?'SÍ':'NO');set(t,4,3,f.ff_informacion?'SÍ':'NO');
   set(t,5,1,f.ff_cobertura??'');set(t,6,1,f.ff_eficacia?'SÍ':'NO');clearMarker(x.p);
  }
 };
 direct.tabla_personal();

 // Sustituir las tablas de cálculo y descripción por tablas corporativas completas.
 const formatValue=v=>typeof v==='number'?v.toLocaleString('es-ES',{maximumFractionDigits:3}):String(v??'');
 const createCorporateTable=(existing,data,key)=>{
  const table=doc.createElementNS(ns,'w:tbl');
  const pr=elements(existing,'tblPr')[0];
  if(pr)table.appendChild(pr.cloneNode(true));
  const count=Math.max(...data.map(x=>x.length),1);
  const widths=key==='tabla_camas'?[2600,750,1220,950,850,1630]:Array(count).fill(Math.floor(9000/count));
  const grid=doc.createElementNS(ns,'w:tblGrid');
  widths.forEach(width=>{const col=doc.createElementNS(ns,'w:gridCol');col.setAttributeNS(ns,'w:w',String(width));grid.appendChild(col);});
  table.appendChild(grid);
  data.forEach((values,index)=>{
   const row=doc.createElementNS(ns,'w:tr');
   values.forEach((value,j)=>{
    const tc=doc.createElementNS(ns,'w:tc');
    const tcPr=doc.createElementNS(ns,'w:tcPr');const tcW=doc.createElementNS(ns,'w:tcW');tcW.setAttributeNS(ns,'w:w',String(widths[j]||1000));tcW.setAttributeNS(ns,'w:type','dxa');tcPr.appendChild(tcW);tc.appendChild(tcPr);
    const p=doc.createElementNS(ns,'w:p');
    const run=doc.createElementNS(ns,'w:r');
    const props=doc.createElementNS(ns,'w:rPr');
    if(index===0){props.appendChild(doc.createElementNS(ns,'w:b'));const shade=doc.createElementNS(ns,'w:shd');shade.setAttributeNS(ns,'w:fill','D8E5EF');const tcPr=doc.createElementNS(ns,'w:tcPr');tcPr.appendChild(shade);tc.appendChild(tcPr);}
    const size=doc.createElementNS(ns,'w:sz');size.setAttributeNS(ns,'w:val','18');props.appendChild(size);
    run.appendChild(props);
    const t=doc.createElementNS(ns,'w:t');t.textContent=formatValue(value);t.setAttribute('xml:space','preserve');
    run.appendChild(t);p.appendChild(run);tc.appendChild(p);row.appendChild(tc);
   });
   table.appendChild(row);
  });
  return table;
 };

 const titlesCorporate={
  tabla_formacion:'FORMACIÓN DEL PERSONAL',
  tabla_movilizaciones:'MOVILIZACIONES DE PACIENTES',
  tabla_movilizaciones_manuales:'MOVILIZACIONES MANUALES DE PACIENTES',
  tabla_movilizaciones_asistidas:'MOVILIZACIONES CON EQUIPOS DE AYUDA',
  tabla_equipos:'EQUIPOS DE AYUDA DISPONIBLES',
  tabla_ayudas_menores:'AYUDAS MENORES',
  tabla_camas:'CAMAS REGULABLES',
  tabla_higiene:'EQUIPOS DE AYUDA PARA HIGIENE',
  tabla_sillas:'SILLAS DE RUEDAS',
  tabla_banos_higiene:'BAÑOS PARA HIGIENE',
  tabla_banos_wc:'BAÑOS CON INODORO',
  tabla_habitaciones:'HABITACIONES',
  tabla_fs_criterios:'FACTOR ELEVACIÓN (FS) — CRITERIOS',
  tabla_fs_adecuacion:'FACTOR ELEVACIÓN (FS) — ADECUACIÓN',
  tabla_fs_resultado:'FACTOR ELEVACIÓN (FS) — RESULTADO',
  tabla_fa_criterios:'FACTOR AYUDAS MENORES (FA) — CRITERIOS',
  tabla_fa_adecuacion:'FACTOR AYUDAS MENORES (FA) — ADECUACIÓN',
  tabla_fa_resultado:'FACTOR AYUDAS MENORES (FA) — RESULTADO',
  tabla_fc_suficiencia:'FACTOR SILLAS DE RUEDAS (FC) — SUFICIENCIA',
  tabla_fc_resultado:'FACTOR SILLAS DE RUEDAS (FC) — RESULTADO',
  tabla_famb_resultado:'FACTOR AMBIENTE (FAMB) — RESULTADO',
  tabla_ff_resultado:'FACTOR FORMACIÓN (FF) — RESULTADO',
  tabla_planificacion:'PLANIFICACIÓN PREVENTIVA',
  tabla_resultados:'RESUMEN DE RESULTADOS MAPO'
 };
 const addCorporateTitle=(table,title)=>{
  if(!title)return;
  const p=doc.createElementNS(ns,'w:p'),pPr=doc.createElementNS(ns,'w:pPr');
  const spacing=doc.createElementNS(ns,'w:spacing');spacing.setAttributeNS(ns,'w:before','240');spacing.setAttributeNS(ns,'w:after','90');pPr.appendChild(spacing);
  const keep=doc.createElementNS(ns,'w:keepNext');pPr.appendChild(keep);
  const shade=doc.createElementNS(ns,'w:shd');shade.setAttributeNS(ns,'w:fill','194986');pPr.appendChild(shade);p.appendChild(pPr);
  const run=doc.createElementNS(ns,'w:r'),rp=doc.createElementNS(ns,'w:rPr');
  rp.appendChild(doc.createElementNS(ns,'w:b'));
  const color=doc.createElementNS(ns,'w:color');color.setAttributeNS(ns,'w:val','FFFFFF');rp.appendChild(color);
  const size=doc.createElementNS(ns,'w:sz');size.setAttributeNS(ns,'w:val','20');rp.appendChild(size);
  const font=doc.createElementNS(ns,'w:rFonts');font.setAttributeNS(ns,'w:ascii','Arial');font.setAttributeNS(ns,'w:hAnsi','Arial');rp.appendChild(font);
  run.appendChild(rp);
  const t=doc.createElementNS(ns,'w:t');t.textContent=title;run.appendChild(t);p.appendChild(run);
  table.parentNode.insertBefore(p,table);
 };
 const allTables=[...new Set([...tables,...moreTables])].filter(k=>k!=='tabla_personal'&&k!=='tabla_fotos_equipos');
 for(const key of allTables){
  const x=locate(key);if(!x)continue;
  const data=rowsFor(key,f,r);
  if(!data)continue;
  const newTable=createCorporateTable(x.table,data,key);
  styleCorporate(newTable);
  x.table.parentNode.replaceChild(newTable,x.table);
  addCorporateTitle(newTable,titlesCorporate[key]);
  separateCorporateTable(newTable);
  clearMarker(x.p);
 }
 return new XMLSerializer().serializeToString(doc);
}

function replaceScalarMarkers(xml,f,r){
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length)throw Error('La plantilla contiene XML no válido.');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 for(const paragraph of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
  const nodes=Array.from(paragraph.getElementsByTagNameNS(ns,'t'));
  if(!nodes.length)continue;
  const values=nodes.map(n=>n.textContent||'');
  const joined=values.join('');
  const matches=[...joined.matchAll(/\{([a-z_]+)\}/g)].filter(m=>allKeys.includes(m[1])&&!m[1].startsWith('tabla_'));
  if(!matches.length)continue;
  for(const match of matches.reverse()){
   const replacement=String(scalar(match[1],f,r)??'');
   let start=match.index,end=start+match[0].length;
   let a=0,first=-1,last=-1,left=0,right=0;
   values.forEach((value,i)=>{const b=a+value.length;if(first<0&&start>=a&&start<b){first=i;left=start-a;}if(last<0&&end>a&&end<=b){last=i;right=end-a;}a=b;});
   if(first<0||last<0)continue;
   if(first===last)values[first]=values[first].slice(0,left)+replacement+values[first].slice(right);
   else{values[first]=values[first].slice(0,left)+replacement;
    for(let j=first+1;j<last;j++)values[j]='';
    values[last]=values[last].slice(right);
   }
  }
  nodes.forEach((n,i)=>{n.textContent=values[i];n.setAttribute('xml:space','preserve');});
 }
 return new XMLSerializer().serializeToString(doc);
}

function replaceConclusionsSummary(xml,r){
 const n=Number(r.mapo);
 if(!Number.isFinite(n)||n<0)return xml;
 const formatted=n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
 const level=String(r.nivel||r.classification||r.riskLevel||r.level|| (n===0?'Ausente':n<=1.5?'Aceptable':n<=5?'Medio':'Alto')).trim().toUpperCase();
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const paragraphs=Array.from(doc.getElementsByTagNameNS(ns,'p'));
 for(const p of paragraphs){
  const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));
  const joined=nodes.map(x=>x.textContent||'').join('');
  if(!/El índice de riesgo MAPO calculado para la unidad/i.test(joined))continue;
  const updated=joined.replace(/(ha sido igual a\s*)X\b/i,(_,prefix)=>prefix+formatted)
    .replace(/(nivel de exposición\s*)AUSENTE\s*\/\s*ACEPTABLE\s*\/\s*MEDIO\s*\/\s*ALTO/i,(_,prefix)=>prefix+level);
  if(updated!==joined){nodes[0].textContent=updated;for(const node of nodes.slice(1))node.textContent='';nodes[0].setAttribute('xml:space','preserve');}
 }
 return new XMLSerializer().serializeToString(doc);
}

function selectRiskConclusion(xml,r){
 const n=Number(r.mapo);
 if(!Number.isFinite(n)||n<0)return xml;
 const level=n===0?'ausente':n<=1.5?'aceptable':n<=5?'medio':'alto';
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const paras=Array.from(doc.getElementsByTagNameNS(ns,'p'));
 const patterns=[
  ['aceptable',/^El riesgo es aceptable dado que/i],
  ['medio',/^El riesgo es medio y requiere/i],
  ['alto',/^El riesgo es alto con necesidad/i]
 ];
 for(const p of paras){
  const content=Array.from(p.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent).join('').trim();
  for(const [kind,pattern] of patterns){
   if(pattern.test(content)&&kind!==level){p.parentNode.removeChild(p);break;}
  }
 }
 return new XMLSerializer().serializeToString(doc);
}

function replaceSimulatedConclusion(xml){
 const sim=window.MAPOSimulation?.getReportResult?.();
 if(!sim||!Number.isFinite(Number(sim.mapo)))return xml;
 const value=Number(sim.mapo);
 const formatted=value.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
 const level=value===0?'AUSENTE':value<=1.5?'ACEPTABLE':value<=5?'MEDIO':'ALTO';
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
  const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));
  const text=nodes.map(n=>n.textContent||'').join('');
  if(!/Aplicando esta\/s medida\/s/i.test(text)&&!/Aplicando esta\s*\/\s*s medida\s*\/\s*s/i.test(text))continue;
  const updated=text.replace(/(\bes\s+)XX\b/i,(_,prefix)=>prefix+formatted).replace(/(nivel de riesgo\s+)(?:ACEPTABLE|AUSENTE|MEDIO|ALTO)\b/i,(_,prefix)=>prefix+level);
  if(updated!==text&&nodes.length){nodes[0].textContent=updated;nodes[0].setAttribute('xml:space','preserve');for(const n of nodes.slice(1))n.textContent='';}
 }
 return new XMLSerializer().serializeToString(doc);
}

function replaceAcknowledgement(xml,f){
 const name=String(f.solicitanteEstudio||'').trim();
 if(!name)return xml;
 const hasTitle=/^(?:D\.?\s*\/\s*D(?:ña|ª)\.?|D\.|Dña\.?|Sr\.|Sra\.)\s*/i.test(name);
 const replacement=hasTitle?name:'D./Dña. '+name;
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
  const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));
  const plain=nodes.map(x=>x.textContent||'').join('');
  if(!/agradecer a la empresa/i.test(plain)||!/XXX\b/.test(plain))continue;
  const modified=plain.replace(/D\.\s*\/\s*D(?:ª|ña)\.?\s*XXX\b/i,replacement);
  if(modified!==plain&&nodes.length){nodes[0].textContent=modified;nodes[0].setAttribute('xml:space','preserve');for(const n of nodes.slice(1))n.textContent='';}
 }
 return new XMLSerializer().serializeToString(doc);
}

function replacePlanningIntroduction(xml,f){
 const company=String(f.empresa||'').trim(),person=String(f.solicitanteEstudio||'').trim();
 const title=/^(?:D\.?\s*\/\s*D(?:ña|ª)\.?|D\.|Dña\.?|Sr\.|Sra\.)\s*/i;
 const displayPerson=person?(title.test(person)?person:'D./Dña. '+person):'';
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
  const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));
  const original=nodes.map(n=>n.textContent||'').join('');
  if(!/Se recomienda que Empresa a través de la persona designada/i.test(original))continue;
  let updated=original;
  if(company)updated=updated.replace(/\bEmpresa(?=\s+a través)/,company);
  if(displayPerson)updated=updated.replace(/D\.\s*\/\s*Dña\.(?=\s+planifique)/i,displayPerson);
  if(updated!==original&&nodes.length){nodes[0].textContent=updated;nodes[0].setAttribute('xml:space','preserve');for(const node of nodes.slice(1))node.textContent='';}
 }
 return new XMLSerializer().serializeToString(doc);
}

function replacePlanningCompanyMentions(xml,f){
 const company=String(f.empresa||'').trim();
 if(!company)return xml;
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
  const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));
  const original=nodes.map(n=>n.textContent||'').join('');
  if(!/ofrece a Empresa asesoramiento/i.test(original)||!/para que Empresa opte/i.test(original))continue;
  const updated=original.replace(/\bEmpresa\b/g,company);
  if(updated!==original&&nodes.length){
   nodes[0].textContent=updated;nodes[0].setAttribute('xml:space','preserve');
   for(const node of nodes.slice(1))node.textContent='';
  }
 }
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
 xml=replaceScalarMarkers(xml,f,r);
 xml=replaceConclusionsSummary(xml,r);
 xml=selectRiskConclusion(xml,r);
 xml=replaceSimulatedConclusion(xml);
 xml=replaceAcknowledgement(xml,f);
 xml=replacePlanningIntroduction(xml,f);
 xml=replacePlanningCompanyMentions(xml,f);
 const leftovers=[...new Set([...xml.matchAll(/\{([a-z_]+)\}/g)].map(x=>x[1]))];
 if(leftovers.length)throw Error('Quedan marcadores sin completar: '+leftovers.join(', '));
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