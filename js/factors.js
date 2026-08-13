/* Reglas MAPO - salas de hospitalización, según documentación aportada. */

function factorElevacion({ nc, elevadores, camillasRegulables, camillaConAyuda, camas3Nodos100, porcentajeLTA }) {
  const suficiente = (nc > 0 && elevadores >= nc / 8) ||
    (nc > 0 && camillasRegulables >= nc / 8 && camillaConAyuda) ||
    camas3Nodos100;
  const adecuado = porcentajeLTA >= 90;
  let fs;
  if (!adecuado && !suficiente) fs = 4;
  else if (!adecuado || !suficiente) fs = 2;
  else fs = 0.5;
  return { suficiente, adecuado, fs };
}

function factorAyudasMenores({ sabanaOTabla, otrasAyudas, camas3Nodos100, porcentajeLPA }) {
  const suficiente = (sabanaOTabla && otrasAyudas >= 2) || (sabanaOTabla && camas3Nodos100);
  const adecuado = porcentajeLPA >= 90;
  const fa = adecuado && suficiente ? 0.5 : 1;
  return { suficiente, adecuado, fa };
}

function puntuacionSillas(tipos) {
  let total = 0, unidades = 0;
  for (const t of tipos) {
    const n = Number(t.unidades) || 0;
    const puntos = (t.frenos ? 1 : 0) + (t.reposabrazos ? 1 : 0) + (t.respaldo ? 1 : 0) + (t.anchura ? 1 : 0);
    total += puntos * n;
    unidades += n;
  }
  if (!unidades) return { total: 0, unidades: 0, pmsr: 0 };
  return { total, unidades, pmsr: total / unidades };
}

function factorSillas(pmsr, totalSillas, na) {
  const suficiente = totalSillas >= 0.5 * na;
  let fc;
  if (pmsr <= 1.33) fc = suficiente ? 0.75 : 1;
  else if (pmsr <= 2.66) fc = suficiente ? 1.12 : 1.5;
  else fc = 1.5;
  return { suficiente, fc };
}

function factorAmbiente(pmamb) {
  if (pmamb <= 5.8) return 0.75;
  if (pmamb <= 11.6) return 1.25;
  return 1.5;
}

function factorFormacion({ cursoAdecuado, porcentajeFormado, menosDeDosAnos, eficaciaVerificada, soloInformacion }) {
  if (cursoAdecuado && porcentajeFormado >= 75 && menosDeDosAnos) return 0.75;
  if (cursoAdecuado && porcentajeFormado >= 75 && !menosDeDosAnos && eficaciaVerificada) return 0.75;
  if (cursoAdecuado && porcentajeFormado >= 50) return 1;
  if (soloInformacion && porcentajeFormado >= 90 && eficaciaVerificada) return 1;
  return 2;
}

function calcularMapoCompleto({ op, nc, pc, fs, fa, fc, famb, ff }) {
  if (op <= 0) throw new Error('OP debe ser mayor que 0.');
  const terminoNC = (nc / op) * fs;
  const terminoPC = (pc / op) * fa;
  const mapo = (terminoNC + terminoPC) * fc * famb * ff;
  const nivel = mapo === 0 ? 'Ausente' : mapo <= 1.5 ? 'Irrelevante' : mapo <= 5 ? 'Medio' : 'Alto';
  return { terminoNC, terminoPC, mapo, nivel };
}
