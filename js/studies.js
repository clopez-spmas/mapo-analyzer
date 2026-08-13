/* Definición de los tres estudios MAPO. Los modelos documentales son independientes. */
const MAPO_HELP = {
  fs:{title:'¿Cómo se determina FS?',html:'<p>El programa comprueba la <strong>suficiencia</strong> del equipamiento y su <strong>adecuación</strong>. Para suficiencia basta cumplir una de las condiciones de la ficha. Para adecuación, el criterio es que al menos el 90% de las tareas de levantamiento total se realicen con equipamiento de ayuda.</p>'},
  fa:{title:'¿Cómo se determina FA?',html:'<p>El programa comprueba la <strong>suficiencia</strong> de las ayudas menores y su <strong>adecuación</strong>. Para adecuación, el criterio es que al menos el 90% de las tareas de levantamiento parcial se realicen con ayudas.</p>'},
  fc:{title:'¿Cómo se determina FC?',html:'<p>El programa obtiene la PMSR a partir de las características puntuables de las sillas y comprueba la suficiencia numérica: al menos el 50% del número de pacientes no autónomos.</p>'},
  famb:{title:'¿Cómo se determina Famb?',html:'<p>El programa obtiene PMB, PMWC y PMH a partir de las características del ambiente y calcula <strong>PMamb = PMB + PMWC + PMH</strong>.</p>'},
  ff:{title:'¿Cómo se determina FF?',html:'<p>El programa determina FF a partir de las características del curso, duración, práctica, organización, cobertura de plantilla, antigüedad y, cuando corresponda, verificación de eficacia.</p>'}
};
const MAPO_STUDIES={
 hospitalizacion:{title:'Salas de hospitalización',description:'Evaluación de riesgo MAPO en unidades de hospitalización.',templateKey:'hospitalizacion',steps:[
  {title:'Identificación de la unidad',fields:[['empresa','Hospital / empresa','text'],['unidad','Sala / unidad','text'],['fecha','Fecha de evaluación','date'],['codigo','Código de sala','text'],['camas','Número de camas','number']]},
  {title:'Personas trabajadoras que realizan MMP',shiftSchedule:true},
  {title:'Pacientes',fields:[['nc','Número de pacientes no colaboradores (NC)','number'],['pc','Número de pacientes parcialmente colaboradores (PC)','number']]},
  {title:'Factor de elevación (FS)',helpKey:'fs',questionGroup:'fs'},
  {title:'Factor de ayudas menores (FA)',helpKey:'fa',questionGroup:'fa'},
  {title:'Factor de sillas de ruedas (FC)',helpKey:'fc',questionGroup:'fc'},
  {title:'Factor ambiente / entorno (Famb)',helpKey:'famb',questionGroup:'famb'},
  {title:'Factor formación (FF)',helpKey:'ff',questionGroup:'ff'}
 ]},
 ambulatorio:{title:'Servicios ambulatorios',description:'Evaluación MAPO específica para servicios ambulatorios.',templateKey:'ambulatorio',steps:[
  {title:'Identificación',fields:[['empresa','Hospital / empresa','text'],['servicio','Servicio ambulatorio','text'],['fecha','Fecha de evaluación','date'],['codigo','Código','text']]},
  {title:'Evaluación del servicio',fields:[['op','Personas trabajadoras que realizan MMP','number'],['nc','Pacientes no colaboradores','number'],['pc','Pacientes parcialmente colaboradores','number']]},
  {title:'Factores del modelo',fields:[['nota','Los factores específicos del modelo ambulatorio se determinarán a partir de las condiciones observables de su ficha.','text']]}
 ]},
 quirurgica:{title:'Área quirúrgica',description:'Evaluación MAPO específica del área quirúrgica.',templateKey:'quirurgica',steps:[
  {title:'Identificación',fields:[['empresa','Hospital / empresa','text'],['area','Área quirúrgica','text'],['fecha','Fecha de evaluación','date'],['codigo','Código','text']]},
  {title:'Organización e intervenciones',fields:[['op','Personas trabajadoras que realizan MMP','number'],['intervencionesDia','Intervenciones por día','number'],['intervencionesMovilizacion','Intervenciones por día que requieren movilización','number']]},
  {title:'Factores del modelo',fields:[['nota','Los factores específicos del modelo quirúrgico se determinarán a partir de las condiciones observables de su ficha.','text']]}
 ]}
};
