/* Definición de los tres estudios MAPO. Los modelos documentales son independientes. */
const MAPO_STUDIES = {
  hospitalizacion: {
    title: 'Salas de hospitalización',
    description: 'Evaluación de riesgo MAPO en unidades de hospitalización.',
    templateKey: 'hospitalizacion',
    steps: [
      { title: 'Identificación', fields: [
        ['empresa','Empresa','text'], ['centro','Centro','text'], ['nif','NIF','text'],
        ['fecha','Fecha','date'], ['unidad','Sala / Unidad','text'], ['codigo','Código de sala','text'], ['camas','Nº de camas','number']
      ]},
      { title: 'Organización y pacientes', fields: [
        ['op','Personas trabajadoras que realizan MMP (OP)','number'],
        ['nc','Pacientes no colaboradores (NC)','number'],
        ['pc','Pacientes parcialmente colaboradores (PC)','number']
      ]},
      { title: 'Frecuencia y ayudas', fields: [
        ['lta','Levantamientos totales con ayudas (LTA)','number'],
        ['st','Levantamientos totales (ST)','number'],
        ['lpa','Levantamientos parciales con ayudas (LPA)','number'],
        ['sp','Levantamientos parciales (SP)','number']
      ]}
    ]
  },
  ambulatorio: {
    title: 'Servicios ambulatorios',
    description: 'Evaluación MAPO específica para servicios ambulatorios.',
    templateKey: 'ambulatorio',
    steps: [
      { title: 'Identificación', fields: [
        ['empresa','Empresa','text'], ['centro','Centro','text'], ['nif','NIF','text'],
        ['fecha','Fecha','date'], ['servicio','Servicio ambulatorio','text'], ['codigo','Código del servicio','text'], ['accesos','Accesos de pacientes/día','number']
      ]},
      { title: 'Organización y pacientes', fields: [
        ['op','Personas trabajadoras que realizan MMP (OP)','number'],
        ['nc','Pacientes no colaboradores (NC)','number'],
        ['pc','Pacientes parcialmente colaboradores (PC)','number']
      ]},
      { title: 'Frecuencia y ayudas', fields: [
        ['st','Levantamientos totales (ST)','number'], ['lta','Levantamientos totales con ayudas (LTA)','number'],
        ['sp','Levantamientos parciales (SP)','number'], ['lpa','Levantamientos parciales con ayudas (LPA)','number']
      ]}
    ]
  },
  quirurgica: {
    title: 'Área quirúrgica',
    description: 'Evaluación MAPO específica del área quirúrgica.',
    templateKey: 'quirurgica',
    steps: [
      { title: 'Identificación', fields: [
        ['empresa','Empresa','text'], ['centro','Centro','text'], ['nif','NIF','text'],
        ['fecha','Fecha','date'], ['unidad','Área quirúrgica','text'], ['codigo','Código','text']
      ]},
      { title: 'Organización y pacientes', fields: [
        ['op','Personas trabajadoras que realizan MMP (OP)','number'],
        ['nc','Pacientes no colaboradores (NC)','number'],
        ['pc','Pacientes parcialmente colaboradores (PC)','number']
      ]},
      { title: 'Frecuencia', fields: [
        ['st1','Tareas de movilización ST1','number'], ['lt1','Levantamientos con ayudas LT1','number'],
        ['st2','Tareas de movilización ST2','number'], ['lt2','Levantamientos con ayudas LT2','number']
      ]}
    ]
  }
};
