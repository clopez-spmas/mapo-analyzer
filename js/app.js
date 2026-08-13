const $ = (id) => document.getElementById(id);

$('calculate').addEventListener('click', () => {
  $('error').hidden = true;
  try {
    const values = {
      op: Number($('op').value),
      nc: Number($('nc').value),
      pc: Number($('pc').value),
      fs: Number($('fs').value),
      fa: Number($('fa').value),
      fc: Number($('fc').value),
      famb: Number($('famb').value),
      ff: Number($('ff').value)
    };

    const result = calculateMapo(values);
    $('mapoValue').textContent = `MAPO = ${result.mapo.toFixed(2)}`;
    $('classification').textContent = `Nivel: ${result.classification}`;
    $('breakdown').innerHTML = `
      <p>Término NC: (${values.nc} / ${values.op}) × ${values.fs} = ${result.ncTerm.toFixed(3)}</p>
      <p>Término PC: (${values.pc} / ${values.op}) × ${values.fa} = ${result.pcTerm.toFixed(3)}</p>
      <p>MAPO = [${result.ncTerm.toFixed(3)} + ${result.pcTerm.toFixed(3)}] × ${values.fc} × ${values.famb} × ${values.ff}</p>
    `;
    $('result').hidden = false;
  } catch (error) {
    $('error').textContent = error.message;
    $('error').hidden = false;
    $('result').hidden = true;
  }
});
