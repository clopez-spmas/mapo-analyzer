/* Reglas MAPO - salas de hospitalización, según documentación aportada. */

function factorElevacion({ nc, elevadores, camillasRegulables, camillaConAyuda, camas3Nodos100, porcentajeLTA }) {
  const n = Number(nc);
  const pct = Number(porcentajeLTA);
  if (!Number.isFinite(n) || n < 0) throw new Error('NC debe ser un número igual o mayor que 0.');
  if (!Number.isFinite(pct) || pct < 0) throw new Error('%LTA debe ser un porcentaje igual o mayor que 0.');

  // La ficha exige al menos una de las tres condiciones de suficiencia.
  // Si no existen pacientes NC, la suficiencia numérica de elevación no es
  // aplicable y no debe generar por sí sola una condición de insuficiencia.
  const suficiente = n === 0 ||
    (Number(elevadores) >= n / 8) ||
    (Number(camillasRegulables) >= n / 8 && Boolean(camillaConAyuda)) ||
    Boolean(camas3Nodos100);

  const adecuado = pct >= 90;
  let fs;
  if (!adecuado && !suficiente) fs = 4;
  else if (!adecuado || !suficiente) fs = 2;
  else fs = 0.5;
  return { suficiente, adecuado, fs, aplicable: n > 0 };
}

function factorAyudasMenores({ sabanaOTabla, otrasAyudas, camas3Nodos100, porcentajeLPA }) {
  const pct = Number(porcentajeLPA);
  if (!Number.isFinite(pct) || pct < 0) throw new Error('%LPA debe ser un porcentaje igual o mayor que 0.');
  const suficiente = (Boolean(sabanaOTabla) && Number(otrasAyudas) >= 2) ||
    (Boolean(sabanaOTabla) && Boolean(camas3Nodos100));
  const adecuado = pct >= 90;
  const fa = adecuado && suficiente ? 0.5 : 1;
  return { suficiente, adecuado, fa };
}

function puntuacionSillas(tipos) {
  if (!Array.isArray(tipos)) throw new Error('La relación de sillas de ruedas no es válida.');
  let total = 0, unidades = 0;
  for (const t of tipos) {
    const n = Number(t.unidades);
    if (!Number.isFinite(n) || n < 0) throw new Error('El número de sillas de cada tipo debe ser igual o mayor que 0.');
    const puntos = (t.frenos ? 1 : 0) + (t.reposabrazos ? 1 : 0) + (t.respaldo ? 1 : 0) + (t.anchura ? 1 : 0);
    total += puntos * n;
    unidades += n;
  }
  if (!unidades) return { total: 0, unidades: 0, pmsr: 0 };
  return { total, unidades, pmsr: total / unidades };
}

function factorSillas(pmsr, totalSillas, na) {
  const p = Number(pmsr), s = Number(totalSillas), n = Number(na);
  if (!Number.isFinite(p) || p < 0 || p > 4) throw new Error('PMSR debe estar entre 0 y 4.');
  if (!Number.isFinite(s) || s < 0) throw new Error('El número total de sillas no puede ser negativo.');
  if (!Number.isFinite(n) || n < 0) throw new Error('NA debe ser un número igual o mayor que 0.');

  const suficiente = s >= 0.5 * n;
  let fc;
  if (p <= 1.33) fc = suficiente ? 0.75 : 1;
  else if (p <= 2.66) fc = suficiente ? 1.12 : 1.5;
  else fc = suficiente ? 1.5 : 2;
  return { suficiente, fc };
}

function factorAmbiente(pmamb) {
  const p = Number(pmamb);
  if (!Number.isFinite(p) || p < 0) throw new Error('PMamb debe ser un número igual o mayor que 0.');
  if (p <= 5.8) return 0.75;
  if (p <= 11.6) return 1.25;
  return 1.5;
}

function factorFormacion({ cursoAdecuado, porcentajeFormado, menosDeDosAnos, eficaciaVerificada, soloInformacion }) {
  const pct = Number(porcentajeFormado);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error('El porcentaje de personas trabajadoras formadas debe estar entre 0 y 100.');

  // Ordenadas de mayor a menor exigencia, respetando literalmente las
  // condiciones de la ficha de Hospitalización.
  if (cursoAdecuado && pct >= 75 && menosDeDosAnos) return 0.75;
  if (cursoAdecuado && pct >= 75 && !menosDeDosAnos && eficaciaVerificada) return 0.75;
  if (cursoAdecuado && pct >= 50 && pct < 75 && menosDeDosAnos) return 1;
  if (soloInformacion && pct >= 90 && eficaciaVerificada) return 1;
  return 2;
}

function calcularMapoCompleto({ op, nc, pc, fs, fa, fc, famb, ff }) {
  const values = { op, nc, pc, fs, fa, fc, famb, ff };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(Number(value))) throw new Error(`${key} debe ser numérico.`);
  }
  if (Number(op) <= 0) throw new Error('OP debe ser mayor que 0.');
  if (Number(nc) < 0 || Number(pc) < 0) throw new Error('NC y PC no pueden ser negativos.');

  const terminoNC = (Number(nc) / Number(op)) * Number(fs);
  const terminoPC = (Number(pc) / Number(op)) * Number(fa);
  const mapo = (terminoNC + terminoPC) * Number(fc) * Number(famb) * Number(ff);
  const nivel = mapo === 0 ? 'Ausente' : mapo <= 1.5 ? 'Aceptable' : mapo <= 5 ? 'Medio' : 'Alto';
  return { terminoNC, terminoPC, mapo, nivel };
}
