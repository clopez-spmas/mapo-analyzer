/* MAPO Analyzer — motor único de cálculo de factores de hospitalización.
   Recibe siempre los datos que se quieren evaluar. No depende de formData.
   Las fórmulas se mantienen iguales a las validadas del programa.
*/
(function(){
  'use strict';
  function yn(v){ return v===true || v==='yes'; }
  function num(v){ return Number(v||0); }
  function taskTotalsFrom(data){
    let st=0,lta=0,sp=0,lpa=0;
    Object.values(data?.tasks||{}).forEach(turns=>Object.values(turns||{}).forEach(r=>{
      st+=num(r.tm)+num(r.ta);
      lta+=num(r.ta);
      sp+=num(r.pm)+num(r.pa);
      lpa+=num(r.pa);
    }));
    return {st,lta,sp,lpa,stp:st+sp,pLTA:st?100*lta/st:0,pLPA:sp?100*lpa/sp:0};
  }
  function calculateHospitalizacionFactors(data){
    const d=data||{};
    const tt=taskTotalsFrom(d);
    const fsS=yn(d.fs_elevadores)||yn(d.fs_camillas)||yn(d.fs_camas3);
    const fsA=tt.st>0&&tt.lta/tt.st>=.9;
    const fs=!fsS&&!fsA?4:fsS&&fsA?.5:2;
    const faS=(yn(d.fa_sabana)&&yn(d.fa_dos))||(yn(d.fa_sabana)&&yn(d.fa_camas3));
    const faA=tt.sp>0&&tt.lpa/tt.sp>=.9;
    const fa=faS&&faA?.5:1;
    const na=num(d.nc)+num(d.pc);
    const chairs=num(d.fc_sillas);
    const pmsr=num(d.fc_pmsr);
    const fcS=chairs>=na*.5;
    const fc=pmsr<=1.33?(fcS?.75:1):pmsr<=2.66?(fcS?1.12:1.5):(fcS?1.5:2);
    const pmb=num(d.famb_pmb);
    const pmwc=num(d.famb_pmwc);
    const pmh=num(d.famb_pmh);
    const pmamb=pmb+pmwc+pmh;
    const famb=pmamb<=5.8?.75:pmamb<=11.6?1.25:1.5;
    const course=yn(d.ff_curso);
    const cov=num(d.ff_cobertura);
    const recent=yn(d.ff_antiguedad);
    const eff=yn(d.ff_eficacia);
    const info=yn(d.ff_informacion);
    const ff=(course&&cov>=75&&(recent||eff))?.75:(course&&cov>=50&&cov<75&&recent)||info?1:2;
    return {
      fs,fa,fc,famb,ff,
      taskTotals:tt,
      details:{
        fsSufficient:fsS,fsAdequate:fsA,
        faSufficient:faS,faAdequate:faA,
        pmsr,pmamb,pmB:pmb,pmWC:pmwc,pmH:pmh,
        fcSufficient:fcS
      }
    };
  }
  window.MAPOCalculationEngine={taskTotalsFrom,calculateHospitalizacionFactors};
  window.calculateHospitalizacionFactors=calculateHospitalizacionFactors;
})();
