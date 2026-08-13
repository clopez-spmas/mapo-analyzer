/* MAPO Analyzer - cálculo independiente de OCRA */

function calculateMapo({ op, nc, pc, fs, fa, fc, famb, ff }) {
  if (op <= 0) throw new Error('El número de operadores (OP) debe ser mayor que 0.');
  if (nc < 0 || pc < 0) throw new Error('NC y PC no pueden ser negativos.');

  const ncTerm = (nc / op) * fs;
  const pcTerm = (pc / op) * fa;
  const mapo = (ncTerm + pcTerm) * fc * famb * ff;

  let classification;
  if (mapo === 0) classification = 'Ausente';
  else if (mapo <= 1.5) classification = 'Irrelevante';
  else if (mapo <= 5) classification = 'Medio';
  else classification = 'Alto';

  return { ncTerm, pcTerm, mapo, classification };
}
