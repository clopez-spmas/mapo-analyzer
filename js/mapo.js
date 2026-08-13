/* MAPO Analyzer - cálculo independiente de OCRA. */

function calculateMapo({ op, nc, pc, fs, fa, fc, famb, ff }) {
  const values = { op, nc, pc, fs, fa, fc, famb, ff };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(Number(value))) throw new Error(`El valor ${key} no es válido.`);
  }

  const OP = Number(op), NC = Number(nc), PC = Number(pc);
  if (OP <= 0) throw new Error('El número de operadores (OP) debe ser mayor que 0.');
  if (NC < 0 || PC < 0) throw new Error('NC y PC no pueden ser negativos.');

  const ncTerm = (NC / OP) * Number(fs);
  const pcTerm = (PC / OP) * Number(fa);
  const mapo = (ncTerm + pcTerm) * Number(fc) * Number(famb) * Number(ff);

  let classification;
  if (mapo === 0) classification = 'Ausente';
  else if (mapo <= 1.5) classification = 'Aceptable';
  else if (mapo <= 5) classification = 'Medio';
  else classification = 'Alto';

  return { ncTerm, pcTerm, mapo, classification };
}
