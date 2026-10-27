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
function mobilizationSummary(f,r){
 const entries=Object.values(f.mobilizations?.entries||{});
 const kinds=['manualTotal','manualPartial','aidedTotal','aidedPartial'];
 const shift=kinds.map(k=>[0,1,2].map(i=>entries.reduce((total,e)=>total+Number(e?.[k]?.[i]||0),0)));
 const sum=x=>x.reduce((a,b)=>a+b,0);
 const [mt,mp,at,ap]=shift.map(sum);
 const pct=(num,den)=>den>0?(100*num/den).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' %':'No calculable';
 return {shift,mt,mp,at,ap,pctTotal:pct(at,mt+at),pctPartial:pct(ap,mp+ap)};
}
function rowsFor(key,f,r){
 const desc=f.informeDescriptivo||{};
 if(key==='tabla_ayudas_menores'){const labels={sabana:'Sábana deslizante',tabla:'Tabla deslizante',cinturon:'Cinturón ergonómico',rollbord:'ROLLBORD u otro similar',gruaActiva:'Grúa activa / bipedestación'};const row=(name,e)=>[name,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];const extras=(desc.ayudasMenoresAdicionales||[]).filter(e=>e.descripcion?.trim()).map(e=>row(e.descripcion,e));const legacy=desc.ayudasMenores?.otro;return [['Tipo de ayuda menor disponible para la movilización de pacientes','¿Está disponible en la unidad?','Número de unidades'],...Object.entries(labels).map(([k,l])=>row(l,desc.ayudasMenores?.[k]||{})),...extras,...(legacy?.descripcion?.trim()?[row(legacy.descripcion,legacy)]:[])];}
 if(key==='tabla_equipos')return [['Descripción del equipo de ayuda','Número de equipos','¿Carece de requisitos preliminares?','¿Carece de adaptabilidad al paciente?','¿Carece de adaptabilidad al entorno?','¿Carece de mantenimiento adecuado?'],...(desc.equiposAyudaDetalle||[]).map(e=>[e.tipo,e.numero,...['requisitos','paciente','ambiente','mantenimiento'].map(k=>e[k]==null?'':e[k]?'Sí':'No')])];
 if(key==='tabla_higiene'){const labels={camillaDucha:'Camilla para ducha',baneraErgonomica:'Bañera ergonómica',duchaErgonomica:'Ducha ergonómica',elevadorBanera:'Elevador para bañera fija'};const row=(name,e)=>[name,e.presencia==null?'':e.presencia?'Sí':'No',e.numero??''];const extras=(f.ayudasHigieneAdicionales||[]).filter(e=>e.descripcion?.trim()).map(e=>row(e.descripcion,e));const legacy=f.ayudasHigiene?.otros;return [['Ayuda','Presencia','Unidades'],...Object.entries(labels).map(([k,l])=>row(l,f.ayudasHigiene?.[k]||{})),...extras,...(legacy?.descripcion?.trim()?[row(legacy.descripcion,legacy)]:[])];}
 if(key==='tabla_camas')return [['Descripción del tipo de cama','N.º de camas','¿Regulación eléctrica de altura?','¿Regulación mediante pedal?','N.º de secciones o nodos','¿Elevación manual de cabecera o pies?'],...(f.camasRegulablesInforme||[]).map(e=>[e.descripcion,e.numero,e.electrica==null?'':e.electrica?'Sí':'No',e.pedal==null?'':e.pedal?'Sí':'No',e.nodos,e.manual==null?'':e.manual?'Sí':'No'])];
 if(key==='tabla_planificacion'){const p=f.planificacionPreventiva||{};const indice=Number(r.mapo);const prioridad=r.mapo===null||r.mapo===undefined||r.mapo===''||!Number.isFinite(indice)||indice<0?'':indice<=1.5?'---':indice<=5?'3':'2';const rows=[['Aspecto deficiente','Prioridad','Medida propuesta','Fecha prevista de aplicación','Presupuesto','Fecha de realización','Responsable'],...(p.medidas||[]).map(e=>['Trastornos musculoesqueléticos — movilización manual de pacientes',prioridad,e.medida||'','','','',''])];rows.push(['Alternativas a las medidas propuestas','','','','','','']);rows.push(['Aprobado por','','','','','','']);rows.push(['Fecha de aprobación','','','','','','']);return rows;}
 const yes=v=>v===true?'Sí':v===false?'No':v??'';
 const standard=(title,cols,items)=>[[title,...cols],...(items||[]).map(x=>[x.description||x.descripcion||x.tipo||'',x.units??x.numero??'',...cols.slice(1).map(k=>yes(x[k]))])];
 if(key==='tabla_personal'){const w=f.workerSchedule||{};return [['Personal','Horario inicio','Horario fin','Número'],...(w.full||[]).filter(x=>x.start||x.end||x.people).map(x=>['Jornada completa',x.start,x.end,x.people]),...(w.partial||[]).filter(x=>x.start||x.end||x.people).map(x=>['Jornada parcial',x.start,x.end,x.people]),['OP total','','',f.op??'']];}
 if(key==='tabla_formacion')return [
 ['Aspectos de la formación del personal','Respuesta'],
 ['¿Se ha impartido formación teórico-práctica específica sobre movilización manual de pacientes?',yes(f.ff_curso)],
 ['¿La formación recibida se considera reciente según el criterio del método MAPO?',yes(f.ff_antiguedad)],
 ['¿Se ha proporcionado información o adiestramiento sobre movilización de pacientes y uso de equipos?',yes(f.ff_informacion)],
 ['¿Se ha verificado la eficacia de la formación o información impartida?',yes(f.ff_eficacia)],
 ['¿Qué porcentaje de personas trabajadoras ha recibido formación?',f.ff_cobertura==null?'':String(f.ff_cobertura)+' %']
 ];
 if(key==='tabla_movilizaciones_manuales'||key==='tabla_movilizaciones_asistidas'){
  const manual=key.endsWith('_manuales'),entries=f.mobilizations?.entries||{},custom=f.mobilizations?.custom||[];
  const builtinNames={wheelchair_bed:'De silla de ruedas a cama',bed_wheelchair:'De cama a silla de ruedas',wheelchair_toilet:'De silla de ruedas a inodoro',toilet_wheelchair:'De inodoro a silla de ruedas',bed_turning:'Giro o cambio postural en cama',bed_shower:'De cama a ducha',wheelchair_armchair:'De silla de ruedas a sillón',armchair_wheelchair:'De sillón a silla de ruedas',bed_stretcher:'De cama a camilla',stretcher_bed:'De camilla a cama',sit_to_stand:'Incorporación a bipedestación'};
  const names={...builtinNames,...Object.fromEntries(custom.map(x=>[x.id,x.name]))};
  const types=manual?['manualTotal','manualPartial']:['aidedTotal','aidedPartial'];
  const summary=mobilizationSummary(f,r);
  return [['Movilización','Total mañana','Total tarde','Total noche','Parcial mañana','Parcial tarde','Parcial noche'],
   ...Object.entries(entries).filter(([id,x])=>types.some(k=>(x[k]||[]).some(n=>Number(n)>0)))
   .map(([id,x])=>[names[id]||id,...[...types].flatMap(k=>[0,1,2].map(i=>Number(x[k]?.[i]||0)))]),
   ['TOTAL POR TURNO',...types.flatMap(k=>summary.shift[['manualTotal','manualPartial','aidedTotal','aidedPartial'].indexOf(k)])]
  ];
 }
 if(key==='tabla_sillas'){
  const entries=f.wheelchairs?.entries||{};
  const labels={large_wheel:'Silla de ruedas de ruedas grandes',small_wheel:'Silla de ruedas de ruedas pequeñas',electric:'Silla de ruedas eléctrica',shower:'Silla de ducha',shower_chair:'Silla de ducha'};
  const lines=Object.entries(entries).filter(([,x])=>Number(x?.count)>0).map(([k,x])=>[
   labels[k]||k.replace(/_/g,' '),x.count,
   yes(x.brakes),yes(x.arms),yes(x.back),yes(x.width)
  ]);
  const total=lines.reduce((n,row)=>n+Number(row[1]||0),0);
  return [['Tipo de silla de ruedas o de ducha','N.º de unidades','¿Funcionamiento adecuado de los frenos?','¿Reposabrazos extraíbles o abatibles?','¿Respaldo ergonómicamente adecuado?','¿Anchura máxima adecuada (hasta 70 cm)?'],...lines,['TOTAL DE SILLAS (TSR)',total,'','','','']];
 }
 if(key==='tabla_banos_higiene'||key==='tabla_banos_wc'){const bath=key.endsWith('_higiene'),data=bath?f.bathTypes:f.wcTypes;const cols=bath?['¿Espacio insuficiente para el uso de ayudas?','¿Anchura de puerta inferior a 85 cm?','¿Presencia de obstáculos fijos?']:['¿Espacio insuficiente para utilizar silla de ruedas?','¿Altura del inodoro inadecuada (45–50 cm)?','¿Ausencia o inadecuación de barra de apoyo lateral?','¿Anchura de puerta inferior a 85 cm?','¿Espacio lateral insuficiente junto al inodoro?'];const fields=bath?['space','door','obstacles']:['space','height','bar','door','lateral'];return [[bath?'Tipo de baño para higiene':'Tipo de baño con inodoro','Número de unidades',...cols],...(data||[]).map(x=>[x.description||'',x.units??'',...fields.map(k=>yes(x[k]))])];}
 if(key==='tabla_habitaciones')return [['Tipo de habitación','Número de habitaciones','¿Espacio entre cama y pared inferior a 90 cm?','¿Espacio libre a los pies de la cama inferior a 120 cm?','¿Cama que requiere levantar manualmente una sección?','¿Espacio bajo la cama inferior a 15 cm?','¿Altura del asiento del sillón inadecuada?'],...(f.roomTypes||[]).map(x=>[x.description||'',x.units??'',...['between','foot','bedSection','underbed','chairHeight'].map(k=>yes(x[k]))])];
 const pct=v=>v==null||v===''?'':typeof v==='number'?v.toLocaleString('es-ES',{maximumFractionDigits:2})+' %':String(v)+' %';
 const result=(value)=>value==null?'':value;
 if(key==='tabla_fs_criterios')return [
 ['FS — NIVEL DE SUFICIENCIA NUMÉRICA','Comprobación'],
 ['La suficiencia de los equipos para elevaciones totales se establece cuando se cumple, como mínimo, una de las siguientes condiciones:',''],
 ['¿Existe al menos un elevador por cada 8 pacientes no colaboradores (NC)?',yes(f.fs_elevadores)],
 ['¿Se dispone de una camilla regulable por cada 8 pacientes NC cuando la transferencia sea habitual, utilizando además sábana, tabla deslizante o equivalente?',yes(f.fs_camillas)],
 ['¿Existen camas regulables en altura con tres nodos para el 100 % de los pacientes de la unidad?',yes(f.fs_camas3)],
 ['Suficiencia numérica de los equipos para elevación total',yes(r.details?.fsSufficient)]
 ];
 if(key==='tabla_fs_adecuacion')return [
 ['FS — NIVEL DE ADECUACIÓN','Resultado'],
 ['La adecuación exige que el equipamiento responda a las necesidades de la unidad y que se utilice al menos en el 90 % de las movilizaciones totales de pacientes.',''],
 ['%LTA — Porcentaje de levantamientos totales realizados con equipamiento de ayuda',pct(r.taskTotals?.pLTA)],
 ['¿El porcentaje de levantamientos totales con equipos de ayuda es igual o superior al 90 %?',r.taskTotals?.pLTA==null?'':yes(Number(r.taskTotals.pLTA)>=90)],
 ['Adecuación de los equipos de elevación',yes(r.details?.fsAdequate)]
 ];
 if(key==='tabla_fs_resultado')return [
 ['CARACTERÍSTICAS RELEVANTES PARA ASIGNAR FS','Valor de referencia'],
 ['Equipos ausentes o simultáneamente inadecuados e insuficientes',4],
 ['Equipos insuficientes o inadecuados',2],
 ['Equipos adecuados y suficientes','0,5'],
 ['VALOR DEL FACTOR DE ELEVACIÓN (FS)',result(r.fs)]
 ];
 if(key==='tabla_fa_criterios')return [
 ['FA — NIVEL DE SUFICIENCIA NUMÉRICA','Comprobación'],
 ['Para considerar suficientes las ayudas menores debe cumplirse al menos una de las siguientes condiciones:',''],
 ['¿Se dispone de sábana o tabla deslizante y, como mínimo, de otras dos ayudas menores (rollboard, disco giratorio u otras equivalentes)?',f.fa_sabana==null||f.fa_dos==null?'':yes(Boolean(f.fa_sabana)&&Boolean(f.fa_dos))],
 ['¿Se dispone de sábana o tabla deslizante y todas las camas son regulables en altura con tres nodos de articulación?',f.fa_sabana==null||f.fa_camas3==null?'':yes(Boolean(f.fa_sabana)&&Boolean(f.fa_camas3))],
 ['Suficiencia numérica de ayudas menores',yes(r.details?.faSufficient)]
 ];
 if(key==='tabla_fa_adecuacion')return [
 ['FA — NIVEL DE ADECUACIÓN','Resultado'],
 ['Se consideran adecuadas las ayudas menores que satisfacen las exigencias de la unidad y se emplean al menos en el 90 % de las movilizaciones parciales.',''],
 ['%LPA — Porcentaje de levantamientos parciales realizados con equipamiento de ayuda',pct(r.taskTotals?.pLPA)],
 ['¿El porcentaje de levantamientos parciales con equipos de ayuda es igual o superior al 90 %?',r.taskTotals?.pLPA==null?'':yes(Number(r.taskTotals.pLPA)>=90)],
 ['Adecuación de las ayudas menores',yes(r.details?.faAdequate)]
 ];
 if(key==='tabla_fa_resultado')return [
 ['CARACTERÍSTICAS RELEVANTES PARA ASIGNAR FA','Valor de referencia'],
 ['Ayudas menores ausentes o que no reúnen las condiciones de suficiencia y adecuación',1],
 ['Ayudas menores adecuadas y suficientes','0,5'],
 ['VALOR DEL FACTOR DE AYUDAS MENORES (FA)',result(r.fa)]
 ];
 if(key==='tabla_fc_suficiencia')return [
 ['FC — SUFICIENCIA DE SILLAS DE RUEDAS','Resultado'],
 ['El modelo considera suficientes las sillas de ruedas cuando su número es igual o superior al 50 % de los pacientes no autónomos (NA).',''],
 ['TSR — Número total de sillas de ruedas en la unidad',result(r.details?.tsr)],
 ['NA — Número de pacientes no autónomos',Number(f.nc||0)+Number(f.pc||0)],
 ['¿TSR es igual o superior al 50 % de NA?',yes(r.details?.fcSufficient)],
 ['PMSR — Puntuación media de las sillas de ruedas; representa su inadecuación ergonómica',result(r.details?.pmsr)],
 ['Tabla de asignación: PMSR de 0 a 1,33','Suficiente: 0,75 / Insuficiente: 1'],
 ['Tabla de asignación: PMSR de 1,34 a 2,66','Suficiente: 1,12 / Insuficiente: 1,5'],
 ['Tabla de asignación: PMSR de 2,67 a 4','Suficiente: 1,5 / Insuficiente: 2']
 ];
 if(key==='tabla_fc_resultado')return [
 ['FACTOR SILLA DE RUEDAS (FC)','Valor'],
 ['El valor se obtiene combinando la puntuación media de inadecuación (PMSR) y la suficiencia de sillas disponibles.',''],
 ['VALOR DEL FACTOR SILLA DE RUEDAS (FC)',result(r.fc)]
 ];
 if(key==='tabla_famb_resultado')return [
 ['FACTOR AMBIENTE / ENTORNO (Famb)','Puntuación / valor'],
 ['Se evalúan las condiciones ergonómicas de baños para higiene, baños con inodoro y habitaciones. Las puntuaciones medias de cada entorno se suman para obtener PMamb.',''],
 ['PMB — Puntuación media de baños para higiene del paciente',result(r.details?.pmB)],
 ['PMWC — Puntuación media de baños con inodoro',result(r.details?.pmWC)],
 ['PMH — Puntuación media de habitaciones',result(r.details?.pmH)],
 ['PMamb — Suma PMB + PMWC + PMH',result(r.details?.pmamb)],
 ['Tabla del modelo: PMamb entre 0 y 5,8','Famb = 0,75'],
 ['Tabla del modelo: PMamb entre 5,9 y 11,6','Famb = 1,25'],
 ['Tabla del modelo: PMamb entre 11,7 y 17,5','Famb = 1,5'],
 ['VALOR DEL FACTOR AMBIENTE / ENTORNO (Famb)',result(r.famb)]
 ];
 if(key==='tabla_ff_resultado')return [
 ['CARACTERÍSTICAS RELEVANTES PARA ASIGNAR FF','Valor de referencia'],
 ['Curso adecuado en los dos últimos años para al menos el 75 % de las personas trabajadoras','0,75'],
 ['Curso adecuado de más de dos años para al menos el 75 % de la plantilla, con eficacia verificada','0,75'],
 ['Curso adecuado en los dos últimos años para entre el 50 % y el 75 % de las personas trabajadoras',1],
 ['Solo información o entrenamiento en equipos para el 90 % de la plantilla, con eficacia verificada',1],
 ['Ausencia de formación o incumplimiento de las condiciones anteriores',2],
 ['VALOR DEL FACTOR FORMACIÓN (FF)',result(r.ff)]
 ];
 if(key==='tabla_resultados')return [
 ['FACTORES UTILIZADOS EN EL CÁLCULO DEL ÍNDICE MAPO','Resultado'],
 ['NC — Número medio de pacientes no colaboradores',scalar('nc',f,r)],
 ['PC — Número medio de pacientes parcialmente colaboradores',scalar('pc',f,r)],
 ['NA — Número de pacientes no autónomos (NC + PC)',scalar('na',f,r)],
 ['OP — Personal expuesto equivalente en 24 horas',scalar('op',f,r)],
 ['FS — Factor de elevación: adecuación y suficiencia de equipos',scalar('fs',f,r)],
 ['FA — Factor de ayudas menores: adecuación y suficiencia',scalar('fa',f,r)],
 ['FC — Factor de sillas de ruedas',scalar('fc',f,r)],
 ['Famb — Factor de instalaciones y entorno',scalar('famb',f,r)],
 ['FF — Factor formación del personal',scalar('ff',f,r)],
 ['ÍNDICE DE RIESGO MAPO',scalar('indice_mapo',f,r)],
 ['NIVEL DE EXPOSICIÓN',scalar('nivel_riesgo',f,r)]
 ];
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
 if(!entries.length)return {xml,inserted:false};
 const para=/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
 const matches=[...xml.matchAll(para)];
 const plain=p=>[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(x=>x[1]).join('').trim();
 const found=matches.find(m=>['{descripcion_equipos}','{tabla_fotos_equipos}'].includes(plain(m[0])));
 const heading=matches.find(m=>/^Equipos de ayuda disponibles\s*:/i.test(plain(m[0])));
 if(!found&&!heading)throw Error('No se encontró la sección Equipos de ayuda disponibles en la plantilla.');
 const relsPath='word/_rels/document.xml.rels',relFile=zip.file(relsPath);
 if(!relFile)throw Error('Relaciones DOCX no disponibles.');
 let rels=await relFile.async('string'),ct=await zip.file('[Content_Types].xml').async('string');
 let rid=1;while(rels.includes('Id="rId'+rid+'"'))rid++;
 let pid=1000;while(xml.includes('id="'+pid+'"'))pid++;
 const drawing=(rel,id)=>'<w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="2400000" cy="1750000"/><wp:docPr id="'+id+'" name="Foto equipo '+id+'"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Equipo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+rel+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2400000" cy="1750000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
 const paragraph=content=>'<w:p><w:r>'+content+'</w:r></w:p>';
 const label=e=>[e.nombre,e.descripcion,e.marca,e.modelo].filter(Boolean).join(' · ');
 const cell=(content)=>'<w:tc><w:tcPr><w:tcW w:w="4400" w:type="dxa"/></w:tcPr>'+content+'</w:tc>';
 const headerCell=t=>'<w:tc><w:tcPr><w:tcW w:w="4400" w:type="dxa"/><w:shd w:fill="194986"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>'+t+'</w:t></w:r></w:p></w:tc>';
 let rows='<w:tr>'+headerCell('Equipo / modelo')+headerCell('Fotografía')+'</w:tr>';
 for(let i=0;i<entries.length;i++){
  const e=entries[i];let picture=paragraph('<w:t>Sin fotografía</w:t>');
  const m=/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(e.imagen||'');
  if(m){
   const ext=m[1]==='jpg'?'jpeg':m[1];
   const mime=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
   if(!new RegExp('Extension="'+ext+'"','i').test(ct))ct=ct.replace('</Types>','<Default Extension="'+ext+'" ContentType="'+mime+'"/></Types>');
   const file='mapo_equipo_'+i+'.'+ext,rel='rId'+rid++;
   zip.file('word/media/'+file,m[2].replace(/\s/g,''),{base64:true});
   rels=rels.replace('</Relationships>','<Relationship Id="'+rel+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'+file+'"/></Relationships>');
   picture=paragraph(drawing(rel,pid++));
  }
  rows+='<w:tr>'+cell(paragraph('<w:t xml:space="preserve">'+xesc(label(e)||'Equipo '+(i+1))+'</w:t>'))+cell(picture)+'</w:tr>';
 }
 const table='<w:tbl><w:tblPr><w:tblW w:w="8800" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4400"/><w:gridCol w:w="4400"/></w:tblGrid>'+rows+'</w:tbl>';
 if(found)xml=xml.replace(found[0],table);
 else xml=xml.slice(0,heading.index+heading[0].length)+table+xml.slice(heading.index+heading[0].length);
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

 const styleCorporate=(table,sectionRows=[],riskSection=false)=>{
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
    // El informe modelo hereda justificación distribuida: anularla en todas las celdas.
    for(const paragraph of Array.from(tc.getElementsByTagNameNS(ns,'p'))){
     let paragraphProperties=elements(paragraph,'pPr')[0];
     if(!paragraphProperties){paragraphProperties=doc.createElementNS(ns,'w:pPr');paragraph.insertBefore(paragraphProperties,paragraph.firstChild);}
     for(const child of elements(paragraphProperties,'jc'))paragraphProperties.removeChild(child);
     const alignment=doc.createElementNS(ns,'w:jc');alignment.setAttributeNS(ns,'w:val','left');paragraphProperties.appendChild(alignment);
     const spacing=elements(paragraphProperties,'spacing')[0]||doc.createElementNS(ns,'w:spacing');
     spacing.setAttributeNS(ns,'w:before','0');spacing.setAttributeNS(ns,'w:after','0');
     if(!spacing.parentNode)paragraphProperties.appendChild(spacing);
    }
    if(head){let tcPr=elements(tc,'tcPr')[0];if(!tcPr){tcPr=doc.createElementNS(ns,'w:tcPr');tc.insertBefore(tcPr,tc.firstChild);}
     for(const prior of elements(tcPr,'shd'))tcPr.removeChild(prior);
     const shd=doc.createElementNS(ns,'w:shd');shd.setAttributeNS(ns,'w:val','clear');shd.setAttributeNS(ns,'w:fill',riskSection?'194986':banner?'194986':'D9E8F1');tcPr.appendChild(shd);
    }
    for(const run of Array.from(tc.getElementsByTagNameNS(ns,'r'))){
     let rp=elements(run,'rPr')[0];if(!rp){rp=doc.createElementNS(ns,'w:rPr');run.insertBefore(rp,run.firstChild);}
     if(head){rp.appendChild(doc.createElementNS(ns,'w:b'));if(banner||riskSection){for(const prior of elements(rp,'color'))rp.removeChild(prior);const color=doc.createElementNS(ns,'w:color');color.setAttributeNS(ns,'w:val','FFFFFF');rp.appendChild(color);}}
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
  let properties=elements(table,'tblPr')[0];
  if(!properties){properties=doc.createElementNS(ns,'w:tblPr');table.insertBefore(properties,table.firstChild);}
  for(const child of Array.from(properties.childNodes)){if(['tblW','tblInd','tblLayout'].includes(child.localName))properties.removeChild(child);}
  const tw=doc.createElementNS(ns,'w:tblW');tw.setAttributeNS(ns,'w:w','9000');tw.setAttributeNS(ns,'w:type','dxa');properties.appendChild(tw);
  const ind=doc.createElementNS(ns,'w:tblInd');ind.setAttributeNS(ns,'w:w','0');ind.setAttributeNS(ns,'w:type','dxa');properties.appendChild(ind);
  const layout=doc.createElementNS(ns,'w:tblLayout');layout.setAttributeNS(ns,'w:type','fixed');properties.appendChild(layout);
  const count=Math.max(...data.map(x=>x.length),1);
  const widths=key==='tabla_formacion'?[6900,2100]:key.startsWith('tabla_fs_')||key.startsWith('tabla_fa_')||key.startsWith('tabla_fc_')||key==='tabla_famb_resultado'||key==='tabla_ff_resultado'||key==='tabla_resultados'?[6900,2100]:key==='tabla_camas'?[2250,850,1550,1300,1250,1800]:key==='tabla_sillas'?[2300,820,1550,1600,1430,1300]:key==='tabla_banos_higiene'?[2450,900,2050,1850,1750]:key==='tabla_banos_wc'?[1700,800,1350,1300,1450,1150,1250]:key==='tabla_habitaciones'?[1700,850,1370,1370,1510,1220,980]:Array(count).fill(Math.floor(9000/count));
  // Distribuir siempre dentro del ancho total de 9000 twips del área de impresión.
  const total=widths.reduce((a,b)=>a+b,0);
  if(total!==9000){for(let i=0;i<widths.length;i++)widths[i]=Math.round(widths[i]*9000/total);}
  widths[widths.length-1]+=9000-widths.reduce((a,b)=>a+b,0);
  const grid=doc.createElementNS(ns,'w:tblGrid');
  widths.forEach(width=>{const col=doc.createElementNS(ns,'w:gridCol');col.setAttributeNS(ns,'w:w',String(width));grid.appendChild(col);});
  table.appendChild(grid);
  data.forEach((values,index)=>{
   const row=doc.createElementNS(ns,'w:tr');
   const trPr=doc.createElementNS(ns,'w:trPr');
   const cantSplit=doc.createElementNS(ns,'w:cantSplit');trPr.appendChild(cantSplit);row.appendChild(trPr);
   values.forEach((value,j)=>{
    const tc=doc.createElementNS(ns,'w:tc');
    const tcPr=doc.createElementNS(ns,'w:tcPr');const tcW=doc.createElementNS(ns,'w:tcW');tcW.setAttributeNS(ns,'w:w',String(widths[j]||1000));tcW.setAttributeNS(ns,'w:type','dxa');tcPr.appendChild(tcW);tc.appendChild(tcPr);
    const p=doc.createElementNS(ns,'w:p');
    const pPr=doc.createElementNS(ns,'w:pPr');
    const jc=doc.createElementNS(ns,'w:jc');jc.setAttributeNS(ns,'w:val','left');pPr.appendChild(jc);
    p.appendChild(pPr);
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
  tabla_fs_criterios:'ASIGNACIÓN DEL VALOR DEL FACTOR DE ELEVACIÓN (FS)',
  tabla_fs_adecuacion:'ADECUACIÓN DEL FACTOR DE ELEVACIÓN (FS)',
  tabla_fs_resultado:'RESULTADO DEL FACTOR DE ELEVACIÓN (FS)',
  tabla_fa_criterios:'ASIGNACIÓN DEL VALOR DEL FACTOR DE AYUDAS MENORES (FA)',
  tabla_fa_adecuacion:'ADECUACIÓN DEL FACTOR DE AYUDAS MENORES (FA)',
  tabla_fa_resultado:'RESULTADO DEL FACTOR DE AYUDAS MENORES (FA)',
  tabla_fc_suficiencia:'ASIGNACIÓN DEL VALOR DEL FACTOR SILLA DE RUEDAS (FC)',
  tabla_fc_resultado:'RESULTADO DEL FACTOR SILLA DE RUEDAS (FC)',
  tabla_famb_resultado:'ASIGNACIÓN DEL VALOR DEL FACTOR AMBIENTE / ENTORNO (FAMB)',
  tabla_ff_resultado:'ASIGNACIÓN DEL VALOR DEL FACTOR FORMACIÓN (FF)',
  tabla_planificacion:'PLANIFICACIÓN PREVENTIVA',
  tabla_resultados:'RESUMEN DE RESULTADOS MAPO'
 };
 const addCorporateTitle=(table,title)=>{
  if(!title)return;
  const p=doc.createElementNS(ns,'w:p'),pPr=doc.createElementNS(ns,'w:pPr');
  const spacing=doc.createElementNS(ns,'w:spacing');spacing.setAttributeNS(ns,'w:before','240');spacing.setAttributeNS(ns,'w:after','90');pPr.appendChild(spacing);
  const normalStyle=doc.createElementNS(ns,'w:pStyle');normalStyle.setAttributeNS(ns,'w:val','Normal');pPr.insertBefore(normalStyle,pPr.firstChild);
  const noNumber=doc.createElementNS(ns,'w:numPr'),numId=doc.createElementNS(ns,'w:numId');numId.setAttributeNS(ns,'w:val','0');noNumber.appendChild(numId);pPr.appendChild(noNumber);
  const indent=doc.createElementNS(ns,'w:ind');indent.setAttributeNS(ns,'w:left','0');indent.setAttributeNS(ns,'w:firstLine','0');pPr.appendChild(indent);
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

 const fillPlanningOriginal=()=>{
  const x=locate('tabla_planificacion');if(!x)return;
  const t=x.table,rr=rows(t);
  // El modelo corporativo tiene un título, identificación, cabeceras y
  // una fila de medida propuesta con celdas combinadas.
  if(rr.length<5||cells(rr[1]).length!==6||cells(rr[4]).length!==7)
   throw Error('La tabla de planificación del modelo no tiene su estructura corporativa original.');
  set(t,1,1,f.empresa||'');
  set(t,1,3,f.centroTrabajo||'');
  set(t,1,5,europeanDate(f.fecha));
  set(t,2,1,f.unidad||'');
  const measures=(f.planificacionPreventiva?.medidas||[]).map(x=>String(x.medida||'').trim()).filter(Boolean);
  if(measures.length){
   const example=rr[4],end=rr[5]||null;
   measures.forEach((value,i)=>{
    const row=i===0?example:example.cloneNode(true);
    if(i>0){t.insertBefore(row,end);fill(cells(row)[0],'');}
    fill(cells(row)[2],value);
   });
  }
  clearMarker(x.p);
 };
 fillPlanningOriginal();
 const allTables=[...new Set([...tables,...moreTables])].filter(k=>k!=='tabla_personal'&&k!=='tabla_planificacion'&&k!=='tabla_fotos_equipos');
 for(const key of allTables){
  const x=locate(key);if(!x)continue;
  const data=rowsFor(key,f,r);
  if(!data)continue;
  const newTable=createCorporateTable(x.table,data,key);
  styleCorporate(newTable,[],/^tabla_(?:fs_|fa_|fc_|famb_|ff_|resultados)/.test(key));
  x.table.parentNode.replaceChild(newTable,x.table);
  if(!/^tabla_(?:fs_|fa_|fc_|famb_|ff_)/.test(key))addCorporateTitle(newTable,titlesCorporate[key]);
  if(key==='tabla_movilizaciones_manuales'||key==='tabla_movilizaciones_asistidas'){
   const totals=mobilizationSummary(f,r),manual=key.endsWith('_manuales');
   const details=manual?[
    ['Indicador de movilizaciones manuales','Total'],
    ['LTM — Levantamientos y movilizaciones totales manuales',totals.mt],
    ['LPM — Levantamientos y movilizaciones parciales manuales',totals.mp]
   ]:[
    ['Indicador de movilizaciones asistidas','Total'],
    ['LTA — Levantamientos totales realizados con equipos de ayuda',totals.at],
    ['LPA — Levantamientos parciales realizados con equipos de ayuda',totals.ap],
    ['%LTA — Porcentaje de levantamientos totales con equipos de ayuda',totals.pctTotal],
    ['%LPA — Porcentaje de levantamientos parciales con equipos de ayuda',totals.pctPartial]
   ];
   const summaryTable=createCorporateTable(x.table,details,'tabla_resumen_movilizaciones');
   styleCorporate(summaryTable);
   newTable.parentNode.insertBefore(summaryTable,newTable.nextSibling);
   separateCorporateTable(summaryTable);
  }else separateCorporateTable(newTable);
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
 if(!sim||!Number.isFinite(Number(sim.mapo))){
  const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
   const phrase=Array.from(p.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('');
   if(/Aplicando esta\s*\/\s*s medida\s*\/\s*s/i.test(phrase)&&/\bXX\b/.test(phrase))p.parentNode.removeChild(p);
  }
  return new XMLSerializer().serializeToString(doc);
 }
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

function insertPreventiveBullets(xml,f){
 const measures=(f.planificacionPreventiva?.medidas||[]).map(m=>String(m.medida||'').trim()).filter(Boolean);
 if(!measures.length)return xml;
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const paragraphs=Array.from(doc.getElementsByTagNameNS(ns,'p'));
 const text=p=>Array.from(p.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('');
 const anchor=paragraphs.find(p=>/se insta a la empresa adoptar las siguientes medidas preventivas\s*:/i.test(text(p)));
 if(!anchor)throw Error('No aparece el párrafo introductorio de medidas preventivas en la plantilla.');
 let cursor=anchor;
 for(const measure of measures){
  const p=doc.createElementNS(ns,'w:p'),pPr=doc.createElementNS(ns,'w:pPr');
  const spacing=doc.createElementNS(ns,'w:spacing');spacing.setAttributeNS(ns,'w:after','80');pPr.appendChild(spacing);
  const indent=doc.createElementNS(ns,'w:ind');indent.setAttributeNS(ns,'w:left','480');indent.setAttributeNS(ns,'w:hanging','240');pPr.appendChild(indent);
  p.appendChild(pPr);
  const symbol=doc.createElementNS(ns,'w:r'),bullet=doc.createElementNS(ns,'w:t');
  bullet.textContent='●  ';bullet.setAttribute('xml:space','preserve');symbol.appendChild(bullet);p.appendChild(symbol);
  const run=doc.createElementNS(ns,'w:r'),runPr=doc.createElementNS(ns,'w:rPr');
  const font=doc.createElementNS(ns,'w:rFonts');font.setAttributeNS(ns,'w:ascii','Arial');font.setAttributeNS(ns,'w:hAnsi','Arial');runPr.appendChild(font);
  const size=doc.createElementNS(ns,'w:sz');size.setAttributeNS(ns,'w:val','20');runPr.appendChild(size);
  run.appendChild(runPr);
  const t=doc.createElementNS(ns,'w:t');t.textContent=measure;t.setAttribute('xml:space','preserve');run.appendChild(t);p.appendChild(run);
  cursor.parentNode.insertBefore(p,cursor.nextSibling);cursor=p;
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
  const values=nodes.map(n=>n.textContent||'');
  const original=values.join('');
  if(!/ofrece a Empresa asesoramiento/i.test(original)||!/para que Empresa opte/i.test(original))continue;
  const matches=[...original.matchAll(/\bEmpresa\b/g)];
  for(const match of matches.reverse()){
   const start=match.index,end=start+match[0].length;
   let position=0,first=-1,last=-1,startOffset=0,endOffset=0;
   values.forEach((v,i)=>{
    const next=position+v.length;
    if(first<0&&start>=position&&start<next){first=i;startOffset=start-position;}
    if(last<0&&end>position&&end<=next){last=i;endOffset=end-position;}
    position=next;
   });
   if(first<0||last<0)continue;
   if(first===last)values[first]=values[first].slice(0,startOffset)+company+values[first].slice(endOffset);
   else{
    values[first]=values[first].slice(0,startOffset)+company;
    for(let j=first+1;j<last;j++)values[j]='';
    values[last]=values[last].slice(endOffset);
   }
  }
  nodes.forEach((node,i)=>{node.textContent=values[i];node.setAttribute('xml:space','preserve');});
 }
 return new XMLSerializer().serializeToString(doc);
}

function colorMapoResultCell(xml,r){
 const value=Number(r.mapo);
 if(!Number.isFinite(value)||value<0)throw Error('El indice MAPO no es valido para colorear el resultado.');
 const fill=value===0?null:value<=1.5?'00FF00':value<=5?'FFFF00':'FF0000';
 const parser=new DOMParser(),doc=parser.parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const direct=(node,tag)=>Array.from(node?.childNodes||[]).filter(n=>n.nodeType===1&&n.namespaceURI===ns&&n.localName===tag);
 const content=node=>Array.from(node.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('').trim();
 let target=null;
 for(const row of Array.from(doc.getElementsByTagNameNS(ns,'tr'))){
  const cells=direct(row,'tc');
  if(cells.length<2)continue;
  const first=content(cells[0]).replace(/\s+/g,' ').trim();
  if(!/^(?:indice|índice)\s+(?:de\s+riesgo\s+)?MAPO\b/i.test(first))continue;
  // La última celda contiene el valor, no la fórmula ni la etiqueta.
  target=cells[cells.length-1];
  break;
 }
 if(!target)throw Error('No se encuentra la celda del indice MAPO en la tabla del modelo.');
 let properties=direct(target,'tcPr')[0];
 if(!properties){properties=doc.createElementNS(ns,'w:tcPr');target.insertBefore(properties,target.firstChild);}
 for(const prev of direct(properties,'shd'))properties.removeChild(prev);
 if(fill){
  const shading=doc.createElementNS(ns,'w:shd');
  shading.setAttributeNS(ns,'w:val','clear');
  shading.setAttributeNS(ns,'w:color','auto');
  shading.setAttributeNS(ns,'w:fill',fill);
  properties.appendChild(shading);
 }
 return new XMLSerializer().serializeToString(doc);
}

function fillTemplateTables(xml,f,r){
 const d=new DOMParser().parseFromString(xml,'application/xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 if(d.getElementsByTagName('parsererror').length)throw Error('Plantilla Word no válida.');
 const direct=(n,t)=>Array.from(n?.childNodes||[]).filter(x=>x.nodeType===1&&x.namespaceURI===ns&&x.localName===t);
 const all=(n,t)=>Array.from(n?.getElementsByTagNameNS(ns,t)||[]);
 const body=all(d,'body')[0];
 const tables=direct(body,'tbl');
 if(tables.length!==31)throw Error('La plantilla ha cambiado: se esperaban 31 tablas originales, se encontraron '+tables.length+'. Se detiene la generación para evitar modificar el formato.');
 const rows=i=>direct(tables[i],'tr'),cells=row=>direct(row,'tc');
 const unique=row=>cells(row).filter((c,i,a)=>a.indexOf(c)===i);
 const cell=(i,row,col)=>cells(rows(i)[row]||{})[col];
 const write=(tc,val)=>{
  if(!tc||val===undefined||val===null)return;
  let ts=all(tc,'t');
  if(!ts.length){
   let p=direct(tc,'p')[0];if(!p){p=d.createElementNS(ns,'w:p');tc.appendChild(p);}
   let run=direct(p,'r')[0];if(!run){run=d.createElementNS(ns,'w:r');p.appendChild(run);}
   const t=d.createElementNS(ns,'w:t');run.appendChild(t);ts=[t];
  }
  ts[0].textContent=String(val);ts[0].setAttribute('xml:space','preserve');
  ts.slice(1).forEach(x=>x.textContent='');
  // Sólo el dato escrito: estilo uniforme de valor, sin heredar títulos o fórmulas.
  const run=ts[0].parentNode;
  if(run?.localName==='r'){
   let props=direct(run,'rPr')[0];
   if(!props){props=d.createElementNS(ns,'w:rPr');run.insertBefore(props,run.firstChild);}
   for(const prop of [...props.childNodes])if(['b','bCs','i','iCs','color','sz','szCs','rFonts','highlight','shd'].includes(prop.localName))props.removeChild(prop);
   const font=d.createElementNS(ns,'w:rFonts');font.setAttributeNS(ns,'w:ascii','Arial');font.setAttributeNS(ns,'w:hAnsi','Arial');props.appendChild(font);
   const size=d.createElementNS(ns,'w:sz');size.setAttributeNS(ns,'w:val','20');props.appendChild(size);
   const shade=d.createElementNS(ns,'w:color');shade.setAttributeNS(ns,'w:val','000000');props.appendChild(shade);
  }
 };
 const set=(i,row,col,v)=>write(cell(i,row,col),v);
 const text=tc=>all(tc,'t').map(t=>t.textContent||'').join('');
 const addValue=(i,row,col,v)=>{
  const tc=cell(i,row,col);if(!tc||v===undefined||v===null)return;
  const txt=text(tc).trim();
  if(txt&&txt.includes('{'))return;
  write(tc,(txt?(txt+' '):'')+String(v));
 };
 const bool=v=>v===true?'Sí':v===false?'No':'';
 const num=v=>v==null?'':Number(v).toLocaleString('es-ES',{maximumFractionDigits:4});
 const entries=Object.values(f.mobilizations?.entries||{});
 const sum=(type,shift)=>entries.reduce((n,e)=>n+Number(e[type]?.[shift]||0),0);
 const totals=type=>[0,1,2].map(shift=>sum(type,shift));
 const types=['manualTotal','manualPartial','aidedTotal','aidedPartial'];
 const pct=(n,den)=>den?num(n/den*100)+' %':'';
 const ttot=types.map(type=>totals(type).reduce((a,b)=>a+b,0));
 const descriptions={
  head_bed:'Desplazamiento hacia la cabecera de la cama',
  bed_wheelchair:'De la cama a la silla de ruedas/sillón/silla',
  wheelchair_bed:'De la silla de ruedas/sillón/silla a la cama',
  bed_stretcher:'De la cama a la camilla',
  stretcher_bed:'De la camilla a la cama',
  wheelchair_toilet:'De la silla de ruedas al WC',
  toilet_wheelchair:'Del WC a la silla de ruedas',
  bed_turning:'Rotación en la cama y cambio postural',
  sit_to_stand:'Levantamiento de posición sentada a postura de pie',
  bed_shower:'De la cama a la ducha',
  shower_bed:'De la ducha a la cama',
  wheelchair_armchair:'De la silla de ruedas al sillón',
  armchair_wheelchair:'Del sillón a la silla de ruedas'
 };
 // Sólo se clonan filas del modelo. Nunca se recrean tablas, anchos, bordes ni estilos.
 const grow=(i,start,capacity,wanted)=>{
  if(wanted<=capacity)return;
  const template=rows(i)[start+capacity-1],before=rows(i)[start+capacity];
  if(!template||!before)throw Error('No se puede ampliar la tabla original '+i);
  for(let j=capacity;j<wanted;j++)tables[i].insertBefore(template.cloneNode(true),before);
 };
 const shrink=(i,start,capacity,wanted)=>{
  const rr=rows(i);for(let k=capacity-1;k>=wanted;k--){const row=rr[start+k];if(row)row.parentNode.removeChild(row);}
 };
 // Tabla nueva del modelo: celdas físicas combinadas, no columnas lógicas.
 const staff=tables[4],srows=direct(staff,'tr'),sc=i=>cells(srows[i]);
 if(sc(3).length!==4||sc(7).length!==4||sc(9).length!==2)
  throw Error('La estructura de personal no coincide con la plantilla revisada.');
 write(sc(3)[0],f.unidad||'');
 write(sc(3)[1],f.codigoSala??f.codigo??'');
 write(sc(3)[2],f.camas??'');
 if(f.auxEnfermeria!=null)write(sc(7)[0],f.auxEnfermeria);
 if(f.auxGeriatria!=null)write(sc(7)[1],f.auxGeriatria);
 if(f.personalLimitacionMMP!=null)write(sc(7)[3],f.personalLimitacionMMP);
 const displayDate=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'');};
 const appendTo=(parent,value)=>{if(value==null||value==='')return;const p=parent.localName==='p'?parent:direct(parent,'p')[0];if(!p)return;const run=d.createElementNS(ns,'w:r'),t=d.createElementNS(ns,'w:t');t.textContent=' '+String(value);t.setAttribute('xml:space','preserve');run.appendChild(t);p.appendChild(run);};
 if(sc(1).length===2){
  for(const para of direct(sc(1)[0],'p')){
   if(/EMPRESA:/i.test(text(para)))appendTo(para,f.empresa);
   if(/CENTRO:/i.test(text(para)))appendTo(para,f.centroTrabajo);
  }
  appendTo(sc(1)[1],displayDate(f.fecha));
 }
 const ws=f.workerSchedule||{},full=(ws.full||[]).filter(x=>Number(x.people)>0),partial=(ws.partial||[]).filter(x=>Number(x.people)>0);
 const fillScheduleRows=(head,items)=>{
  const current=direct(staff,'tr'),first=current[head+1],second=current[head+2];
  if(!first||!second||cells(first).length!==2)throw Error('No coincide la tabla de horarios.');
  const sample=first.cloneNode(true),rr=[first,second];
  while(rr.length<items.length){const cloned=sample.cloneNode(true);rr.at(-1).parentNode.insertBefore(cloned,rr.at(-1).nextSibling);rr.push(cloned);}
  rr.forEach((row,i)=>{const x=items[i],cc=cells(row);write(cc[0],x?String(x.start||'')+'–'+String(x.end||''):'');write(cc[1],x?x.people:'');});
 };
 // El bloque parcial se procesa primero para mantener los índices de la tabla.
 fillScheduleRows(13,partial);fillScheduleRows(9,full);
 const opTarget=direct(staff,'tr').find(row=>/N[ºo°.]*\s*TOTAL DE PERSONAS TRABAJADORAS EN 24 HORAS/i.test(text(row)));
 if(opTarget)write(cells(opTarget).at(-1),'Op= '+num(r.op??f.op));
 set(5,3,1,'NC = '+num(f.nc));set(5,3,2,'PC = '+num(f.pc));set(5,4,1,'NA = '+num(f.na));
 // Formación: conservamos literalmente todas las preguntas y solo completamos respuestas.
 set(6,2,1,bool(f.ff_curso));
 set(6,2,3,f.ff_entrenamiento_equipos==null?'':bool(f.ff_entrenamiento_equipos));
 set(6,3,1,f.ff_meses_formacion??'');
 set(6,4,1,f.ff_horas_formacion??'');
 set(6,4,3,f.ff_material_informativo==null?'':bool(f.ff_material_informativo));
 set(6,5,1,f.ff_personas_formadas??'');
 set(6,5,3,f.ff_personas_informadas??'');
 set(6,6,1,bool(f.ff_eficacia));
 // Movilizaciones: correspondencia con las filas fijas de la plantilla.
 const manual=['head_bed','bed_wheelchair','wheelchair_bed','bed_stretcher','stretcher_bed','wheelchair_toilet','toilet_wheelchair','bed_turning','sit_to_stand'];
 const assisted=[...manual,'wheelchair_armchair','armchair_wheelchair'];
 const fillMob=(ti,start,taskNames,offsets,keys)=>{
  taskNames.forEach((k,i)=>{
   const e=f.mobilizations?.entries?.[k]||{};
   keys.forEach((key,j)=>[0,1,2].forEach((shift)=>set(ti,start+i,offsets[j*3+shift],num(e[key]?.[shift]??0))));
  });
 };
 fillMob(7,4,manual,[1,2,3,4,5,6],['manualTotal','manualPartial']);
 fillMob(8,3,assisted,[1,2,3,4,5,6],['aidedTotal','aidedPartial']);
 // Todas las tareas del estudio, incluidas las personalizadas, antes del total.
 const customs=(f.mobilizations?.custom||[]).filter(c=>c.name?.trim());
 const tableTasks={
  7:{keys:['manualTotal','manualPartial'],standard:manual},
  8:{keys:['aidedTotal','aidedPartial'],standard:assisted}
 };
 const tableSums={};
 for(const ti of [7,8]){
  const {keys,standard}=tableTasks[ti],rr=rows(ti);
  const totalRow=rr.find(row=>/Total\s+por\s+turno/i.test(text(row)));
  if(!totalRow)throw Error('Falta Total por turno en movilizaciones '+ti);
  const idx=rr.indexOf(totalRow);
  const sample=rr.slice(0,idx).reverse().find(row=>/^Otros\s*:/i.test(text(cells(row)[0]||row)))||rr[idx-1];
  if(!sample||cells(sample).length<7)throw Error('No existe fila base de tareas en '+ti);
  const related=customs.filter(c=>keys.includes(c.category));
  for(const c of related){
   const entry=f.mobilizations?.entries?.[c.id]||{};
   const clone=sample.cloneNode(true);
   write(cells(clone)[0],c.name);
   keys.forEach((kind,j)=>[0,1,2].forEach(shift=>write(cells(clone)[1+j*3+shift],num(entry[kind]?.[shift]??0))));
   totalRow.parentNode.insertBefore(clone,totalRow);
  }
  // Sumar las mismas tareas que se muestran, sin incluir categorías no representadas.
  const ids=[...standard,...related.map(c=>c.id)];
  const sums=keys.map(kind=>[0,1,2].map(shift=>ids.reduce((n,id)=>n+Number(f.mobilizations?.entries?.[id]?.[kind]?.[shift]||0),0)));
  tableSums[ti]=sums;
  const cs=cells(totalRow);
  if(cs.length!==7)throw Error('La fila Total por turno debe tener seis celdas de resultados en '+ti);
  sums.forEach((values,j)=>values.forEach((v,k)=>write(cs[1+j*3+k],num(v))));
 }
 // La fila de fórmulas tiene cinco celdas físicas: título, fórmula,
 // resultado LTM/LTA, fórmula, resultado LPM/LPA. No añadir al texto de la fórmula.
 const setSummary=(ti,rx)=>{
  const row=rows(ti).find(x=>rx.test(text(x)));
  if(!row)throw Error('Falta fila de totales de movilización en '+ti);
  const cc=cells(row);
  if(cc.length!==5)throw Error('Estructura de totales no prevista en '+ti+': '+cc.length);
  const sums=tableSums[ti].map(v=>v.reduce((a,b)=>a+b,0));
  write(cc[2],num(sums[0]));write(cc[4],num(sums[1]));
 };
 setSummary(7,/Total\s+de\s+LTM\s+y\s+LPM/i);
 setSummary(8,/Total\s+de\s+LTA\s+y\s+LPA/i);
 const postureRow=rows(7).find(row=>/no\s+pueden\s+adoptar\s+algunas\s+posturas/i.test(text(row)));
 if(postureRow){
  const cc=cells(postureRow);
  const answer=String(f.pacientesNAPosturas||'').trim();
  if(answer&&!/^(s[ií]|no)$/i.test(answer))throw Error('Indique Sí o No en la pregunta sobre posturas de pacientes no autónomos.');
  if(answer&&cc.length>1)write(cc[1],answer);
  if(answer&&/^s[ií]$/i.test(answer)&&f.pacientesNAPosturasDetalle&&cc.length>2)write(cc[2],f.pacientesNAPosturasDetalle);
 }
 // Porcentajes con los mismos totales de las tareas visibles.
 const manualTotals=tableSums[7].map(v=>v.reduce((a,b)=>a+b,0));
 const assistedTotals=tableSums[8].map(v=>v.reduce((a,b)=>a+b,0));
 const assistedRows=rows(8);
 for(const [label,numerator,denominator] of [
  ['%LTA',assistedTotals[0],manualTotals[0]+assistedTotals[0]],
  ['%LPA',assistedTotals[1],manualTotals[1]+assistedTotals[1]]
 ]){
  const resultRow=assistedRows.find(row=>text(cells(row)[0]).trim().startsWith(label+':'));
  if(!resultRow)throw Error('Falta fila '+label);
  const cs=cells(resultRow);
  if(cs.length!==3)throw Error('La fila '+label+' no tiene tres celdas físicas.');
  write(cs[2],pct(numerator,denominator));
 }
 // Tipos de sillas en las columnas A-G existentes en el modelo.
 const chairCatalog={
  large_wheel:'Silla de ruedas de rueda grande',
  small_wheel:'Silla de ruedas de rueda pequeña',
  shower_bath:'Silla de ducha o baño',
  electric:'Silla de ruedas eléctrica',
  tilt:'Silla de ruedas basculante',
  manual_transit:'Silla manual de tránsito (no autopropulsable)',
  manual_self:'Silla manual autopropulsable',
  manual_light:'Silla manual ligera',
  manual_bariatric:'Silla manual bariátrica',
  manual_reclining:'Silla manual con respaldo reclinable',
  pediatric:'Silla de ruedas pediátrica'
 };
 for(const item of f.wheelchairs?.custom||[])if(item.id&&item.name)chairCatalog[item.id]=item.name;
 const chairTypes=Object.entries(f.wheelchairs?.entries||{}).filter(([,x])=>Number(x?.count)>0);
 const chairCols=[2,3,4,5,6,7,8],chairBase=tables[11];
 const chairPages=Math.max(1,Math.ceil(chairTypes.length/chairCols.length));
 const wheelchairPoints=x=>['brakes','arms','back','width'].reduce((n,k)=>n+(x[k]===true?0:1),0);
 const writeLegend=(tc,lines)=>{
  write(tc,lines[0]||'');
  const p=direct(tc,'p')[0];if(!p)return;
  // La fila corporativa original utiliza alineación distribuida:
  // imponer alineación izquierda y eliminar tabulaciones de la leyenda.
  let pPr=direct(p,'pPr')[0];
  if(!pPr){pPr=d.createElementNS(ns,'w:pPr');p.insertBefore(pPr,p.firstChild);}
  direct(pPr,'jc').forEach(node=>pPr.removeChild(node));
  const jc=d.createElementNS(ns,'w:jc');jc.setAttributeNS(ns,'w:val','left');pPr.appendChild(jc);
  direct(pPr,'tabs').forEach(node=>pPr.removeChild(node));
  all(p,'tab').forEach(node=>node.parentNode?.removeChild(node));
  const ts=all(p,'t');if(!ts.length)return;
  const run=ts[0].parentNode;
  for(const line of lines.slice(1)){
   const br=d.createElementNS(ns,'w:br'),t=d.createElementNS(ns,'w:t');
   t.textContent=line;t.setAttribute('xml:space','preserve');
   run.appendChild(br);run.appendChild(t);
  }
 };
 const whiteTypeHeader=(tc,value)=>{
  write(tc,value);
  for(const run of all(tc,'r')){
   let props=direct(run,'rPr')[0];
   if(!props){props=d.createElementNS(ns,'w:rPr');run.insertBefore(props,run.firstChild);}
   direct(props,'color').forEach(node=>props.removeChild(node));
   const color=d.createElementNS(ns,'w:color');color.setAttributeNS(ns,'w:val','FFFFFF');props.appendChild(color);
  }
 };
 const chairCaption=(table,part,page)=>{
  const model=direct(table,'tr').find(row=>cells(row).length===1)||direct(table,'tr')[0];
  if(!model)throw Error('No se encuentra una fila corporativa para identificar los tipos de sillas.');
  // Una fila final explicativa por cada grupo A-G, conservando los bordes y fuentes de la plantilla.
  const newRow=model.cloneNode(true);
  const targetCells=cells(newRow);
  targetCells.forEach(tc=>write(tc,''));
  const label=part.map(([kind],i)=>'Tipo '+String.fromCharCode(65+i)+': '+(chairCatalog[kind]||kind.replace(/_/g,' '))).join('  |  ');
  if(!targetCells[0])throw Error('No hay celda donde insertar la descripción de los tipos de sillas.');
  writeLegend(targetCells[0],label.split('  |  '));
  const last=direct(table,'tr')[direct(table,'tr').length-1];
  table.insertBefore(newRow,last);
 };
 let chairPagesLast=chairBase;
 for(let page=0;page<chairPages;page++){
  const table=page===0?chairBase:chairBase.cloneNode(true);
  if(page>0){
   const previous=page===1?chairBase:chairPagesLast;
   previous.parentNode.insertBefore(table,previous.nextSibling);
  }
  const part=chairTypes.slice(page*chairCols.length,(page+1)*chairCols.length);
  const rr=direct(table,'tr');
  const put=(row,col,val)=>write(cells(rr[row])[col],val);
  chairCols.forEach((col,j)=>{
   const entry=part[j],x=entry?.[1];
   whiteTypeHeader(cells(rr[2])[col],entry?String.fromCharCode(65+j):'');
   for(const [criterion,row] of [['brakes',3],['arms',4],['back',5],['width',6]]){
    put(row,col,x?(x[criterion]===true?'—':'X'):'');
   }
   // Respuestas descriptivas; no intervienen en el cálculo de PMSR.
   put(7,col,x?.footrests==null?'':x.footrests?'NO':'SÍ');
   put(8,col,x?.maintenance==null?'':x.maintenance?'NO':'SÍ');
   put(9,col,x?.count??'');
   put(10,col,x?num(wheelchairPoints(x)):'');
  });
  // Los valores globales sólo figuran en la última continuación.
  const isLast=page===chairPages-1;
  const totalSillas=Number(r.details?.tsr);
  const totalPuntos=Number(r.details?.wheelchairPoints);
  put(9,cells(rr[9]).length-1,isLast&&Number.isFinite(totalSillas)?num(totalSillas):'');
  put(11,cells(rr[11]).length-1,isLast&&Number.isFinite(totalPuntos)?num(totalPuntos):'');
  put(12,cells(rr[12]).length-1,isLast&&r.details?.pmsr!=null?num(r.details.pmsr):'');
  chairCaption(table,part,page);
  chairPagesLast=table;
 }
 // Camas: ampliar o suprimir solo las filas de equipo, clonando la fila corporativa.
 const beds=f.camasRegulablesInforme||[];
 if(beds.length>4)grow(15,2,4,beds.length);
 else if(beds.length<4)shrink(15,2,4,beds.length);
 beds.forEach((b,k)=>{
  set(15,2+k,0,b.descripcion||'');set(15,2+k,1,b.numero??'');
  set(15,2+k,2,bool(b.electrica));set(15,2+k,3,bool(b.pedal));
  set(15,2+k,4,b.nodos??'');set(15,2+k,5,bool(b.manual));
 });
 // Ayudas menores, conservando la nomenclatura de las filas de la plantilla.
 const help=f.informeDescriptivo?.ayudasMenores||{};
 ['sabana','tabla','cinturon','rollbord','gruaActiva'].forEach((key,j)=>{
  const v=help[key]||{};set(10,2+j,1,bool(v.presencia));set(10,2+j,2,v.numero??'');
 });
 const extras=[...(f.informeDescriptivo?.ayudasMenoresAdicionales||[])].filter(x=>x.descripcion?.trim());
 const legacy=help.otro;if(legacy?.descripcion?.trim())extras.push(legacy);
 if(extras.length>1)grow(10,7,1,extras.length);
 if(!extras.length)shrink(10,7,1,0);
 extras.forEach((e,j)=>{set(10,7+j,0,e.descripcion);set(10,7+j,1,bool(e.presencia));set(10,7+j,2,e.numero??'');});
 // Equipos: datos registrados bajo el bloque descriptivo, sin cambiar sus preguntas.

 const equipment=f.informeDescriptivo?.equiposAyudaDetalle||[];
 if(equipment.length>5)grow(9,3,5,equipment.length);
 if(equipment.length<5)shrink(9,3,5,equipment.length);
 equipment.forEach((e,j)=>{
  set(9,3+j,0,e.tipo||'');set(9,3+j,1,e.numero??'');
  ['requisitos','paciente','ambiente','mantenimiento'].forEach((k,n)=>set(9,3+j,2+n,bool(e[k])));
 });
 // Preguntas de almacenamiento: buscar la fila por el texto de la plantilla,
 // ya que el número de filas cambia según los equipos registrados.
 const equipmentRows=direct(tables[9],'tr');
 for(const [question,value] of [
  [/¿Existe un lugar para almacenar el equipamiento\?/i,f.informeDescriptivo?.almacenEquipos],
  [/¿Habría espacio suficiente para almacenar equipos/i,f.informeDescriptivo?.espacioNuevosEquipos]
 ]){
  const row=equipmentRows.find(row=>question.test(text(row)));
  if(!row)throw Error('Falta una pregunta de almacenamiento en la plantilla: '+question.source);
  const cs=cells(row);
  if(cs.length<2)throw Error('No hay celda de respuesta para '+question.source);
  if(value!==undefined&&value!==null)write(cs[cs.length-1],bool(value));
 }
 // Tablas matriciales: conservar criterios, ponderaciones y las columnas A, B, C... originales.
 const matrix=(ti,data,start,labelrow,countrow,columns,flags)=>{
  if(data.length>columns.length){
    const source=tables[ti];let previous=source;
    for(let offset=columns.length;offset<data.length;offset+=columns.length){
      const copy=source.cloneNode(true);
      previous.parentNode.insertBefore(copy,previous.nextSibling);
      previous=copy;
      columns.forEach((col,j)=>{
        const x=data[offset+j];
        if(labelrow!==null)write(cells(rows(copy)[labelrow])[col],x?x.description:'');
        if(countrow!==null)write(cells(rows(copy)[countrow])[col],x?x.units:'');
        flags.forEach(([row,key])=>{
          const value=x?(x[key]===true?'X':x[key]===false?'—':''):'';
          write(cells(rows(copy)[row])[col],value);
        });
      });
    }
  }
  for(let j=0;j<columns.length;j++){
   const col=columns[j],x=data[j];
   if(labelrow!==null)set(ti,labelrow,col,x?.description||'');
   if(countrow!==null)set(ti,countrow,col,x?.units??'');
   flags.forEach(([row,key])=>set(ti,row,col,x?(x[key]===true?'X':x[key]===false?'—':''):''));
  }
 };
 // Baños de higiene: los criterios y las columnas se localizan en cada fila del modelo.
 // Las celdas están combinadas de forma distinta según la fila.
 const baths=f.bathTypes||[],bathSource=tables[12],bathCapacity=6;
 const bathPages=Math.max(1,Math.ceil(baths.length/bathCapacity));
 const bathTitleRows=table=>direct(table,'tr');
 const bathRow=(table,pattern)=>bathTitleRows(table).find(row=>pattern.test(text(row)));
 const bathValues=(row,part,fn)=>{
  if(!row)return;
  const cc=cells(row);
  if(cc.length<7)throw Error('La fila de baño no tiene las seis celdas de tipos esperadas: '+text(row).slice(0,70));
  const columns=cc.slice(cc.length-7,cc.length-1);
  columns.forEach((tc,j)=>write(tc,part[j]?fn(part[j],j):''));
 };
 const bathPatterns=[
  [/Espacio insuficiente/i,'space'],
  [/Anchura de la puerta/i,'door'],
  [/Presencia de obstáculos/i,'obstacles']
 ];
 let previousBath=bathSource;
 for(let page=0;page<bathPages;page++){
  const table=page===0?bathSource:bathSource.cloneNode(true);
  if(page>0)previousBath.parentNode.insertBefore(table,previousBath.nextSibling);
  previousBath=table;
  const part=baths.slice(page*bathCapacity,(page+1)*bathCapacity);
  bathPatterns.forEach(([re,key])=>bathValues(bathRow(table,re),part,x=>x[key]===true?'X':x[key]===false?'—':''));
  bathValues(bathRow(table,/Apertura de la puerta.*hacia adentro/i),part,x=>x.doorInward??'');
  bathValues(bathRow(table,/Presencia de ducha/i),part,x=>x.shower==null?'':x.shower?'SÍ':'NO');
  bathValues(bathRow(table,/Bañera fija/i),part,x=>x.fixedBathtub==null?'':x.fixedBathtub?'SÍ':'NO');
  bathValues(bathRow(table,/Unidades:\s*N[uú]mero/i),part,x=>x.units??'');
  bathValues(bathRow(table,/Puntuaci[oó]n por tipo de ba[nñ]o/i),part,x=>{
   const points=(x.space===true?2:0)+(x.door===true?1:0)+(x.obstacles===true?1:0);
   return num(points);
  });
  const totalUnits=baths.reduce((n,x)=>n+Number(x.units||0),0);
  const totalPoints=baths.reduce((n,x)=>n+Number(x.units||0)*((x.space===true?2:0)+(x.door===true?1:0)+(x.obstacles===true?1:0)),0);
  const rowUnits=bathRow(table,/Unidades:\s*N[uú]mero/i);
  if(rowUnits&&page===bathPages-1)write(cells(rowUnits).at(-1),num(totalUnits));
  const rowScore=bathRow(table,/Puntuaci[oó]n por tipo de ba[nñ]o/i);
  if(rowScore&&page===bathPages-1)write(cells(rowScore).at(-1),num(totalPoints));
  const pmRow=bathRow(table,/PMB\s*:/i);
  if(pmRow&&page===bathPages-1)write(cells(pmRow).at(-1),r.details?.pmB==null?'':num(r.details.pmB));
  // Mantener vacías las celdas A-F de clasificación C/H; la leyenda de tipos va en una fila independiente.
  const bottom=bathTitleRows(table);
  const templateRow=bottom.find(row=>cells(row).length===1)||bottom[0];
  if(!templateRow)throw Error('No existe fila de título que pueda clonarse para la leyenda de baños.');
  const description=part.map((x,j)=>'Tipo '+String.fromCharCode(65+j)+': '+(x.description||'Sin descripción')).join('  |  ');
  const legend=templateRow.cloneNode(true);
  const legendCells=cells(legend);
  legendCells.forEach(tc=>write(tc,''));
  writeLegend(legendCells[0],description.split('  |  '));
  table.appendChild(legend);
 }

 const aids=f.ayudasHigiene||{};
 const aidRows=[
  [/Camilla para la ducha/i,'camillaDucha'],
  [/Bañera ergonómica/i,'baneraErgonomica'],
  [/Ducha ergonómica/i,'duchaErgonomica'],
  [/Elevador para bañera fija/i,'elevadorBanera']
 ];
 for(const [re,key] of aidRows){
  const row=bathRow(bathSource,re);
  if(!row)continue;
  const cc=cells(row),item=aids[key];
  if(item){
   if(cc.length>1)write(cc[1],item.numero??'');
   if(cc.length>2)write(cc[cc.length-1],item.presencia==null?'':item.presencia?'Sí':'No');
  }
 }
 const hasAids=Object.values(aids).some(x=>x?.presencia===true);
 const aidTitle=bathRow(bathSource,/¿Hay ayudas para la higiene del paciente/i);
 if(aidTitle&&Object.keys(aids).length&&cells(aidTitle).length>1)write(cells(aidTitle).at(-1),hasAids?'Sí':'No');
 // Tabla corporativa WC: localizar celdas reales por fila, incluidas combinaciones.
 const wcTypes=f.wcTypes||[],wcOriginal=tables[13],wcCapacity=6;
 const wcPages=Math.max(1,Math.ceil(wcTypes.length/wcCapacity));
 let previousWC=wcOriginal;
 for(let page=0;page<wcPages;page++){
  const table=page===0?wcOriginal:wcOriginal.cloneNode(true);
  if(page>0)previousWC.parentNode.insertBefore(table,previousWC.nextSibling);
  previousWC=table;
  const part=wcTypes.slice(page*wcCapacity,(page+1)*wcCapacity);
  const getRow=re=>direct(table,'tr').find(row=>re.test(text(row)));
  const fillWC=(re,fn)=>{
   const row=getRow(re);if(!row)throw Error('Falta la fila WC de la plantilla: '+re);
   const cc=cells(row);
   if(cc.length<7)throw Error('La fila WC tiene menos de seis columnas: '+text(row).slice(0,65));
   cc.slice(-7,-1).forEach((tc,j)=>write(tc,part[j]?fn(part[j]):''));
  };
  for(const [pattern,key] of [
   [/Espacio insuficiente/i,'space'],
   [/Altura del WC inadecuada/i,'height'],
   [/Ausencia o inadecuaci[oó]n/i,'bar'],
   [/Anchura de la puerta/i,'door'],
   [/Espacio lateral entre WC/i,'lateral']
  ])fillWC(pattern,x=>x[key]===true?'X':x[key]===false?'—':'');
  fillWC(/Apertura de la puerta/i,x=>x.doorInward??'');
  fillWC(/Unidades:\s*N[uú]mero/i,x=>x.units??'');
  fillWC(/Puntuaci[oó]n por tipo de ba[nñ]o/i,x=>{
   return num((x.space===true?2:0)+(x.height===true?1:0)+(x.bar===true?1:0)+(x.door===true?1:0)+(x.lateral===true?1:0));
  });
  const isLast=page===wcPages-1;
  const totalUnits=wcTypes.reduce((a,x)=>a+Number(x.units||0),0);
  const totalPoints=wcTypes.reduce((a,x)=>a+Number(x.units||0)*((x.space===true?2:0)+(x.height===true?1:0)+(x.bar===true?1:0)+(x.door===true?1:0)+(x.lateral===true?1:0)),0);
  const setLast=(re,value)=>{const row=getRow(re);if(row&&cells(row).length)write(cells(row).at(-1),isLast?value:'');};
  setLast(/Unidades:\s*N[uú]mero/i,num(totalUnits));
  setLast(/Puntuaci[oó]n por tipo de ba[nñ]o/i,num(totalPoints));
  setLast(/PMWC\s*:/i,r.details?.pmWC==null?'':num(r.details.pmWC));
  const description=part.map((x,j)=>'Tipo '+String.fromCharCode(65+j)+': '+(x.description||'Sin descripción')).join('  |  ');
  const rr=direct(table,'tr'),model=rr.find(row=>cells(row).length===1)||rr[0];
  if(!model)throw Error('No se puede crear la fila descriptiva de WC.');
  const legend=model.cloneNode(true);
  cells(legend).forEach(tc=>write(tc,''));
  writeLegend(cells(legend)[0],description.split('  |  '));
  const final=getRow(/PMWC\s*:/i);
  if(final)table.insertBefore(legend,final);
  else table.appendChild(legend);
 }
 // Habitaciones: completar las celdas de cada fila mediante el rótulo del modelo.
 const rooms=f.roomTypes||[],roomOriginal=tables[14],roomCapacity=6;
 const roomPages=Math.max(1,Math.ceil(rooms.length/roomCapacity));
 let previousRoom=roomOriginal;
 const roomCriteria=[
  [/Espacio entre cama/i,'between',2],
  [/Espacio libre.*pies/i,'foot',2],
  [/Cama inadecuada/i,'bedSection',1],
  [/Espacio.*(?:cama.*suelo|suelo.*cama)/i,'underbed',2],
  [/Altura del asiento/i,'chairHeight',0.5]
 ];
 for(let page=0;page<roomPages;page++){
  const table=page===0?roomOriginal:roomOriginal.cloneNode(true);
  if(page>0)previousRoom.parentNode.insertBefore(table,previousRoom.nextSibling);
  previousRoom=table;
  const rr=direct(table,'tr'),part=rooms.slice(page*roomCapacity,(page+1)*roomCapacity);
  const findRow=re=>rr.find(row=>re.test(text(row)));
  const fillRow=(re,fn)=>{
   const row=findRow(re);
   if(!row)throw Error('No se encuentra la fila de habitaciones: '+re);
   const cc=cells(row);
   if(cc.length<7)throw Error('La fila de habitaciones no contiene las seis columnas de tipos: '+text(row).slice(0,65));
   cc.slice(-7,-1).forEach((tc,j)=>write(tc,part[j]?fn(part[j]):''));
   return row;
  };
  for(const [re,key] of roomCriteria)fillRow(re,x=>x[key]===true?'X':x[key]===false?'—':'');
  fillRow(/Presencia de obstáculos fijos/i,x=>x.observations??'');
  fillRow(/Altura.*cama fija/i,x=>x.bedHeight??'');
  fillRow(/Barras laterales inadecuadas/i,x=>x.sideRails??'');
  fillRow(/Anchura de la puerta/i,x=>x.doorWidth??'');
  fillRow(/Cama sin ruedas/i,x=>x.noWheels??'');
  const unitsRow=fillRow(/Unidades:.*habitaciones/i,x=>x.units??'');
  const scoreRow=fillRow(/Puntuaci[oó]n por tipo de habitaci[oó]n/i,x=>num(
   (x.between===true?2:0)+(x.foot===true?2:0)+(x.bedSection===true?1:0)+(x.underbed===true?2:0)+(x.chairHeight===true?0.5:0)
  ));
  const last=page===roomPages-1;
  const totalUnits=rooms.reduce((n,x)=>n+Number(x.units||0),0);
  const totalScore=rooms.reduce((n,x)=>n+Number(x.units||0)*((x.between===true?2:0)+(x.foot===true?2:0)+(x.bedSection===true?1:0)+(x.underbed===true?2:0)+(x.chairHeight===true?0.5:0)),0);
  if(cells(unitsRow).length)write(cells(unitsRow).at(-1),last?num(totalUnits):'');
  if(cells(scoreRow).length)write(cells(scoreRow).at(-1),last?num(totalScore):'');
  const description=part.map((x,j)=>'Tipo '+String.fromCharCode(65+j)+': '+(x.description||'Sin descripción')).join('  |  ');
  const templateRow=rr.find(row=>cells(row).length===1)||rr[0];
  const legend=templateRow.cloneNode(true);
  cells(legend).forEach(tc=>write(tc,''));
  writeLegend(cells(legend)[0],description.split('  |  '));
  table.appendChild(legend);
 }

 // PMH y respuesta de pacientes encamados: celdas originales del informe.
 const rowWith=(re)=>tables.flatMap(table=>direct(table,'tr')).find(row=>re.test(text(row)));
 const pmhRow=rowWith(/PMH\s*:\s*Puntuaci[oó]n\s+media\s+de\s+habitaciones/i);
 if(!pmhRow)throw Error('No se encuentra la fila PMH en la plantilla.');
 const pmhCells=cells(pmhRow);
 if(pmhCells.length<2)throw Error('Falta celda de resultado PMH.');
 if(r.details?.pmH!=null)write(pmhCells.at(-1),num(r.details.pmH));
 const bedboundRow=rowWith(/motivo\s+que\s+no\s+se\s+use\s+el\s+ba[nñ]o/i);
 if(!bedboundRow)throw Error('No se encuentra la pregunta sobre pacientes encamados.');
 const bedCells=cells(bedboundRow);
 if(bedCells.length<2)throw Error('Falta celda de respuesta de pacientes encamados.');
 const bedValue=f.pacientesNAEncamados;
 if(bedValue!==undefined&&bedValue!==null&&bedValue!=='')write(bedCells.at(-1),bedValue===true?'Sí':bedValue===false?'No':String(bedValue));
 // PMamb se completa una única vez, dentro de la celda corporativa rotulada PMamb =.
 // FC: completar PMSR, TSR y suficiencia en la tabla corporativa por rótulos.
 const fcRows=tables.flatMap(tb=>direct(tb,'tr'));
 const fcCellText=tc=>text(tc).replace(/\s+/g,' ').trim();
 const fcWrite=(re,value)=>{
  const row=fcRows.find(row=>re.test(fcCellText(cells(row)[0]||row)));
  if(!row||cells(row).length<2)throw Error('No se encuentra la respuesta del factor FC: '+re.source);
  const cc=cells(row),destination=cc[cc.length-1];
  write(destination,value);
 };
 const twoDecimals=v=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
 if(r.details?.pmsr!=null)fcWrite(/^PMSR\s*:/i,'PMSR = '+twoDecimals(r.details.pmsr));
 if(r.details?.tsr!=null)fcWrite(/^Total de sillas de ruedas en la sala/i,'TSR = '+Math.round(Number(r.details.tsr)));
 if(r.details?.fcSufficient!=null)fcWrite(/^¿TSR\s*[≥>=]+\s*50\s*%\s*NA/i,r.details.fcSufficient?'Sí':'No');
 // Las referencias técnicas y puntuaciones fijas del método se dejan intocadas.
 [ ['fs_elevadores',18,1],['fs_camillas',18,2],['fs_camas3',18,3],
   ['fa_sabana',21,1],['fa_camas3',21,2] ].forEach(([key,ti,ri])=>set(ti,ri,1,bool(f[key])));
 set(19,1,1,'%LTA = '+pct(ttot[2],ttot[0]+ttot[2]));
 set(19,2,1,(ttot[0]+ttot[2])?bool(ttot[2]/(ttot[0]+ttot[2])>=.9):'');
 set(22,1,1,'%LPA = '+pct(ttot[3],ttot[1]+ttot[3]));
 set(22,2,1,(ttot[1]+ttot[3])?bool(ttot[3]/(ttot[1]+ttot[3])>=.9):'');
  // Rellenar valores calculados en las mismas celdas con rótulos del modelo.
 const findLabeledCell=(pattern)=>{
  for(const table of tables)for(const row of direct(table,'tr'))for(const tc of cells(row))
   if(pattern.test(text(tc)))return tc;
  return null;
 };
 const replaceLabelValue=(pattern,label,value)=>{
  if(value==null||!Number.isFinite(Number(value)))throw Error('No existe resultado calculado para '+label);
  const tc=findLabeledCell(pattern);
  if(!tc)throw Error('No se encuentra la celda '+label+' en la plantilla.');
  const paragraphs=direct(tc,'p');
  const target=paragraphs.find(p=>pattern.test(text(p)))||paragraphs[0];
  if(!target)throw Error('No existe el párrafo de '+label);
  const textNodes=all(target,'t');
  const content=textNodes.map(n=>n.textContent||'').join('');
  const match=pattern.exec(content);
  if(!match)throw Error('No se reconoce el rótulo '+label);
  const valueText=num(value);
  const prefix=content.slice(0,match.index+match[0].length);
  textNodes[0].textContent=prefix+' '+valueText;
  textNodes[0].setAttribute('xml:space','preserve');
  textNodes.slice(1).forEach(n=>n.textContent='');
 };
 // Tabla de asignación Famb: introducir PMamb en la celda de resultado.
 const pmambFactorRow=tables.flatMap(tb=>direct(tb,'tr')).find(row=>{
  const cc=cells(row);
  return cc.length>=2&&/PMamb:\s*Puntuaci[oó]n\s*media\s*entorno\/ambiente/i.test(text(cc[0]))&&/PMamb\s*=/i.test(text(cc.at(-1)));
 });
 if(!pmambFactorRow)throw Error('No se encuentra el campo PMamb de asignación Famb.');
 const pmambFactorCell=cells(pmambFactorRow).at(-1);
 const pmambCalculated=r.details?.pmamb;
 if(pmambCalculated==null||!Number.isFinite(Number(pmambCalculated)))throw Error('No existe valor PMamb calculado.');
 write(pmambFactorCell,'PMamb = '+Number(pmambCalculated).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}));
 replaceLabelValue(/\bFC\s*=\s*$/i,'FC',r.fc);
 // La fórmula PMB + PMWC + PMH se mantiene y el resultado va en su misma celda.
 // PMamb en la tabla vigente: la celda corporativa dice "PMamb =", no la fórmula completa.
 const pmambResult=r.details?.pmamb;
 if(pmambResult==null||!Number.isFinite(Number(pmambResult)))throw Error('Falta el valor calculado PMamb.');
 // Completar PMamb en la misma celda que contiene la fórmula de 2.8.
 const pmambCell=tables.flatMap(tb=>direct(tb,'tr')).flatMap(row=>cells(row)).find(tc=>/PMamb\s*=\s*PMB\s*\+\s*PMWC\s*\+\s*PMH\s*=/i.test(text(tc)));
 if(!pmambCell)throw Error('No se localiza la celda de fórmula PMamb en la plantilla.');
 const pmambParagraph=direct(pmambCell,'p').find(p=>/PMamb/i.test(text(p)))||direct(pmambCell,'p').at(-1);
 if(!pmambParagraph)throw Error('La celda PMamb no contiene ningún párrafo editable.');
 const valueRun=d.createElementNS(ns,'w:r');
 const valueNode=d.createElementNS(ns,'w:t');
 valueNode.appendChild(d.createTextNode(' '+num(pmambResult)));
 valueNode.setAttribute('xml:space','preserve');
 valueRun.appendChild(valueNode);
 pmambParagraph.appendChild(valueRun);
 replaceLabelValue(/\bFamb\s*=\s*$/i,'Famb',r.famb);
 // Mantener Famb y su valor en una única línea en la celda corporativa estrecha.
 const fambCell=findLabeledCell(/\bFamb\s*=\s*/i);
 if(fambCell){
  let tcPr=direct(fambCell,'tcPr')[0];
  if(!tcPr){tcPr=d.createElementNS(ns,'w:tcPr');fambCell.insertBefore(tcPr,fambCell.firstChild);}
  if(!direct(tcPr,'noWrap').length)tcPr.appendChild(d.createElementNS(ns,'w:noWrap'));
  const p=direct(fambCell,'p')[0];
  if(p){
   const tNodes=all(p,'t');
   if(tNodes.length){
    tNodes[0].textContent='Famb = '+Number(r.famb).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
    tNodes[0].setAttribute('xml:space','preserve');
    tNodes.slice(1).forEach(n=>n.textContent='');
   }
   all(p,'br').forEach(n=>n.parentNode?.removeChild(n));
   all(p,'tab').forEach(n=>n.parentNode?.removeChild(n));
   for(const run of all(p,'r')){
    let rp=direct(run,'rPr')[0];
    if(!rp){rp=d.createElementNS(ns,'w:rPr');run.insertBefore(rp,run.firstChild);}
    direct(rp,'sz').forEach(n=>n.parentNode.removeChild(n));
    const sz=d.createElementNS(ns,'w:sz');sz.setAttributeNS(ns,'w:val','16');rp.appendChild(sz);
   }
  }
 }

 // Planificación: rellenar exclusivamente los campos del modelo; no modificar el resto.
 const plan=tables.find(t=>direct(t,'tr').some(row=>/FECHA PREVISTA\s*(?:DE\s*)?APLICACI[OÓ]N/i.test(text(row))));
 if(!plan)throw Error('No se encuentra la tabla corporativa de planificación.');
 const pr=direct(plan,'tr');
 const identify=pr.find(row=>/EMPRESA:/i.test(text(row))&&/CENTRO:/i.test(text(row)));
 if(!identify||cells(identify).length<6)throw Error('La identificación de planificación no tiene seis celdas.');
 const id=cells(identify),dt=String(f.fecha||'');
 write(id[1],f.empresa||'');write(id[3],f.centroTrabajo||'');
 write(id[5],/^\d{4}-\d\d-\d\d/.test(dt)?dt.slice(8,10)+'/'+dt.slice(5,7)+'/'+dt.slice(0,4):dt);
 const unit=pr.find(row=>/UNIDAD:/i.test(text(row)));
 if(unit&&cells(unit).length>1)write(cells(unit)[1],f.unidad||'');
 const heading=pr.findIndex(row=>/RIESGO\/ASPECTO DEFICIENTE/i.test(text(row))&&/MEDIDA PROPUESTA/i.test(text(row)));
 if(heading<0||!pr[heading+1]||cells(pr[heading+1]).length<7)throw Error('No coincide la estructura de las medidas de planificación.');
 const original=pr[heading+1],measures=(f.planificacionPreventiva?.medidas||[]).filter(m=>String(m.medida||'').trim());
 const template=original.cloneNode(true);
 let previousMeasureRow=original;
 for(let i=0;i<Math.max(1,measures.length);i++){
  const row=i===0?original:template.cloneNode(true);
  if(i>0)previousMeasureRow.parentNode.insertBefore(row,previousMeasureRow.nextSibling);
  previousMeasureRow=row;
  const cs=cells(row);
  write(cs[2],measures[i]?.medida||'');
  // Columna de fecha prevista de aplicación: siempre en blanco.
  write(cs[3],'');
  if(i>0){write(cs[4],'');write(cs[5],'');write(cs[6],'');}
 }
 return new XMLSerializer().serializeToString(d);
}
async function generate(template,providedData){
 if(typeof JSZip==='undefined')throw Error('No se ha cargado el componente ZIP necesario para generar DOCX.');
 const zip=await JSZip.loadAsync(template),doc=zip.file('word/document.xml');
 if(!doc)throw Error('El documento seleccionado no es una plantilla DOCX compatible.');
 let xml=normalize(await doc.async('string')),d=providedData||reportData(),f=d.form||{},r=d.result||{};
 xml=replaceUnitX(xml,f.unidad);
 xml=positionDescriptions(xml);
 if(!Number.isFinite(Number(r.mapo)))throw Error('No hay resultados MAPO calculados para esta unidad. Calcule el índice antes de generar el informe.');
 const found=[...xml.matchAll(/\{([a-z_]+)\}/g)].map(m=>m[1]);const unknown=[...new Set(found.filter(k=>!allKeys.includes(k)))];
 if(unknown.length)throw Error('Marcadores no reconocidos: '+unknown.join(', '));
 if(!found.length)throw Error('La plantilla no contiene marcadores compatibles. Consulte el catálogo de marcadores.');
 xml=fillTemplateTables(xml,f,r);
 const photos=await insertEquipmentPhotos(zip,xml,f);xml=photos.xml;

// Los antiguos marcadores de creación de tablas no deben quedar impresos.
 xml=xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g,p=>{
  const visible=p.replace(/<[^>]*>/g,'').trim();
  return /^\{tabla_[a-z_]+\}$/.test(visible)?'':p;
});

 xml=replaceScalarMarkers(xml,f,r);
 xml=replaceConclusionsSummary(xml,r);
 xml=selectRiskConclusion(xml,r);
 xml=replaceSimulatedConclusion(xml);
 xml=replaceAcknowledgement(xml,f);
 xml=insertPreventiveBullets(xml,f);
 xml=replacePlanningIntroduction(xml,f);
 xml=replacePlanningCompanyMentions(xml,f);
 xml=colorMapoResultCell(xml,r);
 const leftovers=[...new Set([...xml.matchAll(/\{([a-z_]+)\}/g)].map(x=>x[1]))];
 if(leftovers.length)throw Error('Quedan marcadores sin completar: '+leftovers.join(', '));
 zip.file('word/document.xml',xml);
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
 return blob;
}
async function generateStudy(template){
 const mr=window.MAPOMultiRoom,rooms=mr?.state?.rooms||[];
 if(rooms.length<=1)return generate(template);
 const {merged,result}=mr.globalMAPO();
 const valid=rooms.map((room,i)=>{
  const form=room.formData||{};
  const previous=room.lastResult||{};
  const refreshed=window.MAPOStudyIO?.refreshCalculatedResult?.(form,previous)||previous;
  if(!Number.isFinite(Number(refreshed.mapo)))throw Error('Falta calcular el índice MAPO de la sala '+(room.name||i+1));
  return {form,result:refreshed,name:room.name||'Sala '+(i+1)};
 });
 const docs=[];
 for(const room of valid)docs.push(await JSZip.loadAsync(await generate(template,room)));
 const main=docs[0],mainDoc=main.file('word/document.xml');
 let xml=await mainDoc.async('string');
 const bodyMatch=/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/.exec(xml);
 if(!bodyMatch)throw Error('No se puede identificar el cuerpo del informe Word.');
 const sectionMatch=/<w:sectPr\b[\s\S]*?<\/w:sectPr>/.exec(bodyMatch[1]);
 const section=sectionMatch?.[0]||'';
 let combined=bodyMatch[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g,'');
 const relPath='word/_rels/document.xml.rels';
 let rels=await main.file(relPath).async('string'),types=await main.file('[Content_Types].xml').async('string');
 let relIndex=9000;
 const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const para=(content,bold=false)=>'<w:p><w:r>'+(bold?'<w:rPr><w:b/></w:rPr>':'')+'<w:t xml:space="preserve">'+escape(content)+'</w:t></w:r></w:p>';
 const pageBreak='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
 for(let i=1;i<docs.length;i++){
  const src=docs[i],other=await src.file('word/document.xml').async('string');
  const body=/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/.exec(other);
  if(!body)throw Error('No se puede leer la sala '+(i+1));
  let fragment=body[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g,'');
  const srcRels=await src.file(relPath).async('string');
  for(const m of srcRels.matchAll(/<Relationship\b[^>]*\/>/g)){
   const tag=m[0],id=/\bId="([^"]+)"/.exec(tag)?.[1],target=/\bTarget="([^"]+)"/.exec(tag)?.[1];
   if(!id||!target||!tag.includes('/image'))continue;
   const oldFile='word/'+target.replace(/^\/?/,'');
   const raw=src.file(oldFile);
   if(!raw)continue;
   const extension=target.split('.').pop(),filename='mapo_multi_'+i+'_'+relIndex+'.'+extension;
   main.file('word/media/'+filename,await raw.async('uint8array'));
   const newid='rId'+relIndex++;
   fragment=fragment.replaceAll('r:embed="'+id+'"','r:embed="'+newid+'"');
   rels=rels.replace('</Relationships>','<Relationship Id="'+newid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'+filename+'"/></Relationships>');
   const extPattern=new RegExp('Extension="'+extension+'"','i');
   if(!extPattern.test(types)){
    const mime=extension==='png'?'image/png':extension==='webp'?'image/webp':'image/jpeg';
    types=types.replace('</Types>','<Default Extension="'+extension+'" ContentType="'+mime+'"/></Types>');
   }
  }
  combined+=pageBreak+fragment;
 }
 // El informe global contiene datos y cálculos agregados, no una media de índices.
 combined+=pageBreak+para('RESULTADOS GLOBALES DEL HOSPITAL',true);
 combined+=para('Evaluación conjunta de '+valid.length+' salas independientes.',false);
 combined+=para('Pacientes no colaboradores (NC): '+merged.nc);
 combined+=para('Pacientes parcialmente colaboradores (PC): '+merged.pc);
 combined+=para('Personal expuesto equivalente (OP): '+Number(merged.op).toLocaleString('es-ES'));
 const factorLabels=[['FS','fs'],['FA','fa'],['FC','fc'],['Famb','famb'],['FF','ff']];
 for(const [label,key] of factorLabels)combined+=para(label+': '+Number(result[key]).toLocaleString('es-ES'));
 combined+=para('Índice MAPO global: '+Number(result.mapo).toLocaleString('es-ES',{maximumFractionDigits:3}),true);
 combined+=para('Nivel de exposición global: '+result.nivel,true);
 combined+=para('Comparativa por salas',true);
 for(const room of valid)combined+=para(room.name+': MAPO '+Number(room.result.mapo).toLocaleString('es-ES',{maximumFractionDigits:3})+' — '+(room.result.nivel||''));
 xml=xml.replace(bodyMatch[0],'<w:body>'+combined+section+'</w:body>');
 main.file('word/document.xml',xml);
 main.file(relPath,rels);main.file('[Content_Types].xml',types);
 return main.generateAsync({type:'blob',compression:'DEFLATE'});
}
function downloadBlob(blob,name){
 const link=document.createElement('a'),url=URL.createObjectURL(blob);
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function refreshFilename(){
 const input=document.getElementById('mapoWordFilename');
 if(!input)return;
 const f=reportData().form||{};
 const room=window.MAPOMultiRoom?.state?.rooms?.[window.MAPOMultiRoom?.state?.active];
 const multi=(window.MAPOMultiRoom?.state?.rooms?.length||0)>1;
 const label=String(multi?(f.centroTrabajo||f.empresa||'Hospital')+'_multisala':(f.unidad||room?.name||'estudio')).replace(/[^\p{L}\p{N}_-]+/gu,'_');
 const currentDefault='MAPO_'+label+'.docx';
 // Conservar nombres elegidos manualmente; actualizar sólo el sugerido.
 if(!input.value||input.value===input.dataset.defaultName)input.value=currentDefault;
 input.dataset.defaultName=currentDefault;
}
function createControls(){
 const host=document.getElementById('wordReportPanel');
 if(!host||document.getElementById('mapoGenerateWord'))return;
 const wrap=document.createElement('div');
 wrap.className='registry-card';wrap.id='mapoGenerateWord';
 wrap.innerHTML='<h3>Generar informe Word</h3><p id="mapoWordScope">En estudios multisala se generará un único documento con todas las salas y el resultado global.</p><label for="mapoWordFilename">Nombre del archivo Word</label><input id="mapoWordFilename" type="text" autocomplete="off" placeholder="MAPO_nombre_unidad.docx" aria-label="Nombre del informe Word"><p class="small">Se guardará como documento .docx. Si su navegador permite elegir carpeta, se abrirá el selector de archivos; en otros navegadores se descargará con el nombre indicado en la carpeta de descargas configurada.</p><div class="actions"><button type="button" id="mapoDownloadWord">Elegir ubicación y guardar Word</button></div><p id="mapoWordFeedback" role="status"></p>';
 host.appendChild(wrap);
 const input=wrap.querySelector('#mapoWordFilename');
 const defaultName=()=>{
  const f=reportData().form||{};
  return 'MAPO_'+String(f.unidad||'estudio').replace(/[^\p{L}\p{N}_-]+/gu,'_')+'.docx';
 };
 input.value=defaultName();
 input.dataset.defaultName=input.value;
 refreshFilename();
 wrap.querySelector('#mapoDownloadWord').onclick=async()=>{
  const output=wrap.querySelector('#mapoWordFeedback'),button=wrap.querySelector('#mapoDownloadWord');
  button.disabled=true;output.textContent='Preparando documento...';
  try{
   let name=String(input.value||'').trim().replace(/[\\/:*?"<>|]/g,'_');
   if(!name)throw Error('Introduzca un nombre para el informe.');
   if(!/\.docx$/i.test(name))name+='.docx';
   let handle=null;
   if(typeof window.showSaveFilePicker==='function'){
    try{
     handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'Documento de Word',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']}}]});
    }catch(e){if(e?.name==='AbortError'){output.textContent='Guardado cancelado.';return;}throw e;}
   }
   const response=await fetch('plantillas/MAPO_Hospitalizacion.docx',{cache:'no-store'});
   if(!response.ok)throw Error('La plantilla oficial no está disponible en la carpeta plantillas/ del programa.');
   const blob=await generateStudy(await response.arrayBuffer());
   if(handle){
    const writable=await handle.createWritable();
    await writable.write(blob);await writable.close();
    output.textContent='Informe Word guardado en la ubicación seleccionada.';
   }else{
    downloadBlob(blob,name);
    output.textContent='Documento descargado como '+name+'. Si desea seleccionar la carpeta, active «Preguntar dónde guardar cada archivo» en los ajustes del navegador.';
   }
  }catch(e){output.textContent='No se pudo generar el informe: '+e.message;}
  finally{button.disabled=false;}
 };
}

function init(){createControls();const result=document.getElementById('result');if(result&&!result.querySelector('#openGeneratorFromResult')){const btn=document.createElement('button');btn.type='button';btn.id='openGeneratorFromResult';btn.className='secondary';btn.textContent='Generar informe Word';btn.onclick=()=>window.MAPOResultScreens?.showWord?.();result.querySelector('.section-heading .actions')?.appendChild(btn);}}
function openGenerator(){return window.MAPOResultScreens?.showWord?.();}
window.MAPOWordGenerator={generate,markers:allKeys,open:openGenerator,prepare:createControls,refreshFilename};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();