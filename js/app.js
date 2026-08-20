const $=id=>document.getElementById(id);
let selectedStudy=null,currentStep=0,formData={},lastResult=null;
/* Estado público de solo lectura para módulos de presentación/informes. No altera los cálculos. */
window.MAPOReportState=function(){return {form:formData,result:lastResult||{}};};