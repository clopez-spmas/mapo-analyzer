/* Definición de los tres estudios MAPO. Los modelos documentales son independientes. */
const MAPO_STUDIES = {
  hospitalizacion: {
    title: 'Salas de hospitalización', description: 'Evaluación de riesgo MAPO en unidades de hospitalización.', templateKey: 'hospitalizacion',
    steps: [
      { title: 'Identificación', fields: [['empresa','Empresa','text'],['centro','Centro','text'],['nif','NIF','text'],['fecha','Fecha','date'],['unidad','Sala / Unidad','text'],['codigo','Código de sala','text'],['camas','Nº de camas','number']]},
      { title: 'Organización y pacientes', fields: [['op','Personas trabajadoras que realizan MMP (OP)','number'],['nc','Pacientes no colaboradores (NC)','number'],['pc','Pacientes parcialmente colaboradores (PC)','number']]},
      { title: 'Levantamientos', fields: [['st','Levantamientos totales (ST)','number'],['lta','Levantamientos totales con ayudas (LTA)','number'],['sp','Levantamientos parciales (SP)','number'],['lpa','Levantamientos parciales con ayudas (LPA)','number']]},
      { title: 'Factor de elevación (FS)', fields: [['elevadores','Número de elevadores utilizables','number'],['camillasRegulables','Número de camillas regulables','number'],['camillaConAyuda','¿Transferencias con camilla acompañadas de tabla/sábana/rollboard? (1=Sí, 0=No)','number'],['camas3Nodos100','¿Camas regulables de 3 nodos para el 100%? (1=Sí, 0=No)','number']]},
      { title: 'Ayudas menores (FA)', fields: [['sabanaOTabla','¿Hay sábana o tabla deslizante? (1=Sí, 0=No)','number'],['otrasAyudas','Número de otras ayudas menores disponibles','number']]},
      { title: 'Sillas de ruedas (FC)', fields: [['sillasSuficientes','¿Sillas suficientes (≥50% de NA)? (1=Sí, 0=No)','number'],['pmsr','PMSR, puntuación media de sillas de ruedas','number']]},
      { title: 'Ambiente / entorno (Famb)', fields: [['pmb','PMB, puntuación media baños de higiene','number'],['pmwc','PMWC, puntuación media baños con WC','number'],['pmh','PMH, puntuación media habitaciones','number']]},
      { title: 'Formación (FF)', fields: [['ff','Valor FF según la condición de formación (0,75 / 1 / 2)','number']]}
    ]
  },
  ambulatorio: {
    title: 'Servicios ambulatorios', description: 'Evaluación MAPO específica para servicios ambulatorios.', templateKey: 'ambulatorio',
    steps: [
      { title: 'Identificación', fields: [['empresa','Empresa','text'],['centro','Centro','text'],['nif','NIF','text'],['fecha','Fecha','date'],['servicio','Servicio ambulatorio','text'],['codigo','Código','text'],['accesos','Accesos de pacientes/día','number']]},
      { title: 'Organización y pacientes', fields: [['op','Personas trabajadoras que realizan MMP (OP)','number'],['nc','Pacientes no colaboradores (NC)','number'],['pc','Pacientes parcialmente colaboradores (PC)','number']]},
      { title: 'Frecuencia y tareas', fields: [['st','Levantamientos totales (ST)','number'],['lta','Levantamientos totales con ayudas (LTA)','number'],['sp','Levantamientos parciales (SP)','number'],['lpa','Levantamientos parciales con ayudas (LPA)','number']]},
      { title: 'Factores específicos', fields: [['fs','FS obtenido según ficha del servicio','number'],['fa','FA obtenido según ficha del servicio','number'],['fc','FC obtenido según ficha del servicio','number'],['famb','Famb obtenido según ficha del servicio','number'],['ff','FF obtenido según ficha del servicio','number']]}
    ]
  },
  quirurgica: {
    title: 'Área quirúrgica', description: 'Evaluación MAPO específica del área quirúrgica.', templateKey: 'quirurgica',
    steps: [
      { title: 'Identificación', fields: [['empresa','Empresa','text'],['centro','Centro','text'],['nif','NIF','text'],['fecha','Fecha','date'],['unidad','Área quirúrgica','text'],['codigo','Código','text'],['camas','Número de camas','number'],['diasEstancia','Media de días de estancia','number']]},
      { title: 'Organización e intervenciones', fields: [['op','Personas trabajadoras que realizan MMP (OP)','number'],['quirofanos','Número de quirófanos','number'],['intervencionesAnuales','Media anual de intervenciones','number'],['intervencionesDia','Media de intervenciones/día','number'],['intervencionesMovilizacion','Intervenciones/día que requieren movilización','number']]},
      { title: 'Pacientes y movilización', fields: [['nc','Pacientes no colaboradores (NC)','number'],['pc','Pacientes parcialmente colaboradores (PC)','number'],['st1','Tareas de movilización tipo 1','number'],['lt1','Levantamientos con ayudas tipo 1','number'],['st2','Tareas de movilización tipo 2','number'],['lt2','Levantamientos con ayudas tipo 2','number']]},
      { title: 'Factores del modelo', fields: [['fs','FS obtenido según ficha de área quirúrgica','number'],['fa','FA obtenido según ficha de área quirúrgica','number'],['ff','FF obtenido según ficha de área quirúrgica','number']]}
    ]
  }
};
