/* Modelo guiado MAPO - Salas de hospitalización.
   Las preguntas convierten condiciones observables en puntuaciones; el usuario no introduce FS/FA/FC/Famb/FF. */

const HOSPITALIZACION_QUESTIONS = {
  fs: [
    { id:'fs_elevadores', label:'¿Hay al menos 1 elevador utilizable por cada 8 pacientes no colaboradores (NC)?', help:'Cuente únicamente los elevadores utilizables para la elevación total. Compare su número con NC/8.', type:'yesno' },
    { id:'fs_camillas', label:'¿Hay al menos 1 camilla regulable por cada 8 pacientes NC y, cuando se utiliza para la transferencia cama-camilla, se acompaña de tabla, sábana deslizante, rollboard o equivalente?', help:'Solo marque Sí si se cumplen las dos condiciones simultáneamente.', type:'yesno' },
    { id:'fs_camas3', label:'¿Las camas regulables en altura con 3 nodos están disponibles para el 100% de los pacientes de la unidad?', help:'La suficiencia se cumple si esta condición es cierta para toda la unidad.', type:'yesno' },
    { id:'fs_lta_total', label:'Número de levantamientos totales realizados con equipamiento de ayuda', help:'Incluya las tareas de levantamiento total realizadas con equipamiento de ayuda.', type:'number' },
    { id:'fs_st_total', label:'Número total de levantamientos totales evaluados', help:'Incluya todas las tareas de levantamiento total de pacientes consideradas en la evaluación.', type:'number' }
  ],
  fa: [
    { id:'fa_sabana', label:'¿Hay sábana o tabla deslizante disponible?', help:'La documentación exige la presencia de sábana o tabla deslizante como base de la suficiencia.', type:'yesno' },
    { id:'fa_dos', label:'¿Hay además al menos dos de las otras ayudas menores indicadas en la ficha?', help:'Considere, entre otras, rollbord, cinturón ergonómico, roller u otras ayudas indicadas en la ficha. La grúa de bipedestación/elevador de banda torácica se considera equivalente al cinturón ergonómico.', type:'yesno' },
    { id:'fa_camas3', label:'¿Todas las camas de la unidad son regulables en altura y tienen 3 nodos de articulación?', help:'Es la segunda vía de suficiencia: sábana/tabla deslizante + camas regulables en altura con 3 nodos para el 100% de los pacientes.', type:'yesno' },
    { id:'fa_lpa_total', label:'Número de levantamientos parciales realizados con equipamiento de ayuda', help:'Cuente los levantamientos parciales realizados con ayudas menores.', type:'number' },
    { id:'fa_sp_total', label:'Número total de levantamientos parciales evaluados', help:'Incluya todas las tareas de levantamiento parcial consideradas en la evaluación.', type:'number' }
  ],
  fc: [
    { id:'fc_sillas', label:'Número total de sillas de ruedas disponibles y utilizables', help:'Cuente las sillas disponibles para los pacientes de la unidad que pueden utilizarse para las movilizaciones.', type:'number' },
    { id:'fc_na', label:'Número de pacientes no autónomos (NA)', help:'NA corresponde a los pacientes no autónomos considerados por el método. En el cálculo hospitalario, NC + PC.', type:'number' },
    { id:'fc_pmsr', label:'Puntuación media de inadecuación de las sillas (PMSR)', help:'El programa calculará PMSR a partir de los tipos de silla y sus características puntuables. Esta casilla se mantiene solo como dato provisional y será sustituida por la ficha detallada de sillas.', type:'number' }
  ],
  famb: [
    { id:'famb_pmb', label:'Puntuación media de baños para la higiene del paciente (PMB)', help:'El programa calculará PMB a partir de los tipos de baño, unidades y características de inadecuación de la ficha.', type:'number' },
    { id:'famb_pmwc', label:'Puntuación media de baños con WC (PMWC)', help:'El programa calculará PMWC a partir de los tipos de baño, unidades y características de inadecuación de la ficha.', type:'number' },
    { id:'famb_pmh', label:'Puntuación media de habitaciones (PMH)', help:'El programa calculará PMH a partir de los tipos de habitación, unidades y características de inadecuación de la ficha.', type:'number' }
  ],
  ff: [
    { id:'ff_curso', label:'¿La formación fue un curso teórico-práctico de al menos 6 horas, organizado por el propio centro y con práctica específica en el uso de equipos de ayuda?', help:'La documentación define estas características como curso adecuado.', type:'yesno' },
    { id:'ff_cobertura', label:'¿Qué porcentaje de las personas trabajadoras que realizan manipulación de pacientes recibió el curso adecuado?', help:'Introduzca el porcentaje de plantilla cubierta por el curso adecuado.', type:'number' },
    { id:'ff_antiguedad', label:'¿La formación se realizó hace menos de 2 años respecto a esta evaluación?', help:'Si fue hace más de dos años, la documentación contempla la posibilidad de valorar la verificación de su eficacia.', type:'yesno' },
    { id:'ff_eficacia', label:'Si la formación tiene más de 2 años, ¿se ha verificado su eficacia?', help:'Solo se utiliza esta respuesta cuando la formación tiene más de dos años.', type:'yesno' },
    { id:'ff_informacion', label:'Si no existe curso adecuado, ¿se realizó al menos información/adiestramiento en el uso de equipos o se distribuyó material informativo al 90% de la plantilla y se verificó su eficacia?', help:'Esta es una condición específica que la documentación puntúa con FF=1.', type:'yesno' }
  ]
};

function yes(d,id){ return d[id] === true || d[id] === 'yes'; }
function num(d,id){ return Number(d[id] || 0); }

function calculateHospitalizacionFactors(d){
  const fsSufficient = yes(d,'fs_elevadores') || yes(d,'fs_camillas') || yes(d,'fs_camas3');
  const st=num(d,'fs_st_total'), lta=num(d,'fs_lta_total');
  if(lta > st) throw new Error('Los levantamientos totales con ayuda no pueden superar el total de levantamientos totales.');
  const fsAdequate = st > 0 && lta/st >= .90;
  const fs = !fsSufficient && !fsAdequate ? 4 : fsSufficient && fsAdequate ? .5 : 2;

  const faSufficient = (yes(d,'fa_sabana') && yes(d,'fa_dos')) || (yes(d,'fa_sabana') && yes(d,'fa_camas3'));
  const sp=num(d,'fa_sp_total'), lpa=num(d,'fa_lpa_total');
  if(lpa > sp) throw new Error('Los levantamientos parciales con ayuda no pueden superar el total de levantamientos parciales.');
  const faAdequate = sp > 0 && lpa/sp >= .90;
  const fa = faSufficient && faAdequate ? .5 : 1;

  const na=num(d,'fc_na'), chairs=num(d,'fc_sillas'), pmsr=num(d,'fc_pmsr');
  const fcSufficient = chairs >= na*.5;
  let fc;
  if(pmsr <= 1.33) fc = fcSufficient ? .75 : 1;
  else if(pmsr <= 2.66) fc = fcSufficient ? 1.1 : 1.5;
  else fc = fcSufficient ? 1.5 : 2;

  const pmb=num(d,'famb_pmb'), pmwc=num(d,'famb_pmwc'), pmh=num(d,'famb_pmh');
  const pmamb=pmb+pmwc+pmh;
  const famb=pmamb<=5.8 ? .75 : pmamb<=11.6 ? 1.25 : 1.5;

  const course=yes(d,'ff_curso'), coverage=num(d,'ff_cobertura'), recent=yes(d,'ff_antiguedad'), efficacy=yes(d,'ff_eficacia'), info=yes(d,'ff_informacion');
  const adequateRecent=course && coverage>=75 && recent;
  const adequateOld=course && coverage>=75 && !recent && efficacy;
  const partialCourse=course && coverage>=50 && coverage<75 && recent;
  const infoCondition=info;
  const ff=(adequateRecent || adequateOld) ? .75 : (partialCourse || infoCondition) ? 1 : 2;

  return {fs,fa,fc,famb,ff,details:{fsSufficient,fsAdequate,faSufficient,faAdequate,fcSufficient,pmsr,pmamb,ffCondition:{adequateRecent,adequateOld,partialCourse,infoCondition}}};
}
