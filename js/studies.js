/* Definición de los tres estudios MAPO. Los modelos documentales son independientes. */
const MAPO_HELP = {
  fs: { title:'¿Cómo se determina FS?', html:'<p><strong>Factor de elevación.</strong> Compruebe primero la suficiencia de los equipos y después su adecuación.</p><ul><li>Elevadores: comprobar el número disponible respecto a los pacientes no colaboradores.</li><li>Camillas regulables: valorar las condiciones de uso con las ayudas previstas en la ficha.</li><li>Camas regulables de 3 nodos: comprobar la cobertura indicada en la ficha.</li><li><strong>Adecuación:</strong> comprobar el porcentaje de levantamientos totales realizados con ayuda; el criterio indicado en la ficha es ≥ 90%.</li></ul><p>El programa debe obtener FS a partir de estas condiciones.</p>' },
  fa: { title:'¿Cómo se determina FA?', html:'<p><strong>Factor de ayudas menores.</strong> Compruebe disponibilidad, suficiencia y adecuación de las ayudas menores.</p><ul><li>Comprobar las ayudas menores disponibles.</li><li>Comprobar que son adecuadas para las tareas de movilización parcial.</li><li><strong>Adecuación:</strong> comprobar el porcentaje de levantamientos parciales realizados con ayuda; el criterio indicado en la ficha es ≥ 90%.</li></ul><p>FA se obtiene a partir de estas condiciones.</p>' },
  fc: { title:'¿Cómo se determina FC?', html:'<p><strong>Factor de sillas de ruedas.</strong></p><ul><li>Obtener la <strong>PMSR</strong> mediante las características puntuables de las sillas.</li><li>Comprobar la <strong>suficiencia numérica</strong> respecto a los pacientes no autónomos.</li><li>Combinar PMSR y suficiencia según la tabla del método.</li></ul><p>Las características que no intervienen en la puntuación pueden mantenerse como información descriptiva.</p>' },
  famb: { title:'¿Cómo se determina Famb?', html:'<p><strong>Factor ambiente.</strong> Evaluar:</p><ul><li>baños de higiene (<strong>PMB</strong>);</li><li>baños con WC (<strong>PMWC</strong>);</li><li>habitaciones (<strong>PMH</strong>).</li></ul><p>Después calcular <strong>PMamb = PMB + PMWC + PMH</strong> y aplicar la tabla correspondiente para obtener Famb.</p>' },
  ff: { title:'¿Cómo se determina FF?', html:'<p><strong>Factor formación.</strong> Compruebe las condiciones de formación establecidas en la ficha correspondiente:</p><ul><li>contenido y modalidad;</li><li>formación práctica cuando corresponda;</li><li>cobertura de la plantilla;</li><li>antigüedad de la formación;</li><li>condiciones de eficacia que establezca el modelo.</li></ul><p>El valor debe derivarse de las respuestas de la ficha.</p>' }
};

const MAPO_STUDIES = {
  hospitalizacion: {
    title: 'Salas de hospitalización', description: 'Evaluación de riesgo MAPO en unidades de hospitalización.', templateKey: 'hospitalizacion',
    steps: [
      { title: 'Identificación', fields: [['empresa','Empresa','text'],['centro','Centro','text'],['nif','NIF','text'],['fecha','Fecha','date'],['unidad','Sala / Unidad','text'],['codigo','Código de sala','text'],['camas','Nº de camas','number']]},
      { title: 'Organización y pacientes', fields: [['op','Personas trabajadoras que realizan MMP (OP)','number'],['nc','Pacientes no colaboradores (NC)','number'],['pc','Pacientes parcialmente colaboradores (PC)','number']]},
      { title: 'Levantamientos', fields: [['st','Levantamientos totales (ST)','number'],['lta','Levantamientos totales con ayudas (LTA)','number'],['sp','Levantamientos parciales (SP)','number'],['lpa','Levantamientos parciales con ayudas (LPA)','number']]},
      { title: 'Factor de elevación (FS)', helpKey:'fs', fields: [['elevadores','Número de elevadores utilizables','number'],['camillasRegulables','Número de camillas regulables','number'],['camillaConAyuda','¿Transferencias con camilla acompañadas de tabla/sábana/rollboard? (1=Sí, 0=No)','number'],['camas3Nodos100','¿Camas regulables de 3 nodos para el 100%? (1=Sí, 0=No)','number']]},
      { title: 'Ayudas menores (FA)', helpKey:'fa', fields: [['sabanaOTabla','¿Hay sábana o tabla deslizante? (1=Sí, 0=No)','number'],['otrasAyudas','Número de otras ayudas menores disponibles','number']]},
      { title: 'Sillas de ruedas (FC)', helpKey:'fc', fields: [['sillasSuficientes','¿Sillas suficientes (≥50% de NA)? (1=Sí, 0=No)','number'],['pmsr','PMSR, puntuación media de sillas de ruedas','number']]},
      { title: 'Ambiente / entorno (Famb)', helpKey:'famb', fields: [['pmb','PMB, puntuación media baños de higiene','number'],['pmwc','PMWC, puntuación media baños con WC','number'],['pmh','PMH, puntuación media habitaciones','number']]},
      { title: 'Formación (FF)', helpKey:'ff', fields: [['ff','Valor FF según la condición de formación (0,75 / 1 / 2)','number']]}
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
