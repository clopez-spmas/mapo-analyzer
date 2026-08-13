/* Integración única de la tipología de pacientes con los cálculos de Hospitalización. */
(function () {
  function getPatientCounts(data) {
    const p = data && data.patientTypes ? data.patientTypes : null;
    if (!p) {
      throw new Error('Debe completar la tipología de pacientes antes de calcular MAPO.');
    }

    const values = {
      autonomo: Number(p.autonomo || 0),
      colaborador: Number(p.colaborador || 0),
      noColaborador: Number(p.noColaborador || 0),
      encamado: Number(p.encamado || 0)
    };

    for (const [key, value] of Object.entries(values)) {
      if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error(`El número de pacientes de «${key}» debe ser un entero igual o mayor que 0.`);
      }
    }

    const nc = values.noColaborador + values.encamado;
    const pc = values.colaborador;
    const na = nc + pc;
    return { ...values, nc, pc, na };
  }

  window.getHospitalizacionPatientCounts = getPatientCounts;

  const originalFactors = window.calculateHospitalizacionFactors;
  if (typeof originalFactors === 'function') {
    window.calculateHospitalizacionFactors = function (data) {
      const counts = getPatientCounts(data);
      return originalFactors({ ...data, ...counts });
    };
  }

  const originalCalculateMapo = window.calculateMapo;
  if (typeof originalCalculateMapo === 'function') {
    window.calculateMapo = function (data) {
      const counts = getPatientCounts(data);
      return originalCalculateMapo({ ...data, ...counts });
    };
  }
})();
