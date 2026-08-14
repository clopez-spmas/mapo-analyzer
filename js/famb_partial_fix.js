/* Famb parcial: calcula exclusivamente PMB + PMWC y no exige PMH. */
(function(){
  function scoreRegistry(key, fields){
    const items = Array.isArray(window.formData?.[key]) ? window.formData[key] : [];
    let units = 0;
    let weighted = 0;
    items.forEach(item => {
      const u = Number(item.units || 0);
      if (u <= 0) return;
      const score = fields.reduce((sum, field) => sum + (item[field] === true ? field === 'space' ? 2 : 1 : 0), 0);
      units += u;
      weighted += u * score;
    });
    return { units, value: units ? weighted / units : null };
  }

  function syncFromDom(key){
    if (!window.formData) return;
    const items = Array.isArray(formData[key]) ? formData[key].slice() : [];
    document.querySelectorAll(`[data-rk="${key}"]`).forEach(el => {
      const i = Number(el.dataset.ri), field = el.dataset.rf;
      items[i] ||= {};
      if (el.type === 'radio') {
        if (el.checked) items[i][field] = el.value === 'yes';
      } else if (el.type === 'number') {
        items[i][field] = el.value === '' ? '' : Number(el.value);
      } else {
        items[i][field] = el.value;
      }
    });
    formData[key] = items;
  }

  function calculatePartial(){
    syncFromDom('bath');
    syncFromDom('wc');
    const pmb = scoreRegistry('bath', ['space','door','obstacles']);
    const pmwc = scoreRegistry('wc', ['space','height','bar','door','lateral']);
    if (pmb.value === null && pmwc.value === null) throw new Error('Debe introducir al menos un baño para calcular el Famb parcial.');

    const values = [pmb.value, pmwc.value].filter(v => v !== null);
    const subtotal = values.reduce((a,b) => a+b, 0);
    const partial = subtotal <= 5.8 ? 0.75 : subtotal <= 11.6 ? 1.25 : 1.5;
    const out = document.getElementById('partial_famb');
    if (!out) return;
    out.hidden = false;
    out.innerHTML = `<strong>Famb parcial (baños) = ${partial.toFixed(2)}</strong><br>PMB: ${pmb.value === null ? 'Pendiente' : pmb.value.toFixed(2)} · PMWC: ${pmwc.value === null ? 'Pendiente' : pmwc.value.toFixed(2)} · Suma baños: ${subtotal.toFixed(2)}<br><small>Este es el cálculo parcial de los baños. El Famb global se completará al disponer también de PMH.</small>`;
  }

  document.addEventListener('click', function(event){
    const button = event.target.closest('[data-partial-factor="famb"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { calculatePartial(); }
    catch (err) {
      const out = document.getElementById('partial_famb');
      if (out) { out.hidden = false; out.textContent = 'No se puede calcular todavía: ' + err.message; }
    }
  }, true);
})();
