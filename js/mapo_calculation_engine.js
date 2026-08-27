/* MAPO Analyzer — motor único de cálculo de factores de hospitalización.
   La fuente de verdad son los datos introducidos en los módulos de evaluación.
   No mantiene copias independientes de sillas, baños, habitaciones ni movilizaciones. */
(function(){
  'use strict';
  function yn(v){ return v===true || v==='yes'; }
  function num(v){ return Number(v||0); }

  function normalizeEntries(entries){
    const result={};
    if(!entries || typeof entries!=='object') return result;
    Object.entries(entries).forEach(([id,e])=>{
      if(!e || typeof e!=='object') return;
      result[id]={
        manualTotal:Array.isArray(e.manualTotal)?e.manualTotal.reduce((a,v)=>a+num(v),0):num(e.manualTotal),
        aidedTotal:Array.isArray(e.aidedTotal)?e.aidedTotal.reduce((a,v)=>a+num(v),0):num(e.aidedTotal),
        manualPartial:Array.isArray(e.manualPartial)?e.manualPartial.reduce((a,v)=>a+num(v),0):num(e.manualPartial),
        aidedPartial:Array.isArray(e.aidedPartial)?e.aidedPartial.reduce((a,v)=>a+num(v),0):num(e.aidedPartial)
      };
    });
    return result;
  }

  function entriesHaveData(entries){
    return Object.values(entries).some(e=>num(e.manualTotal)+num(e.aidedTotal)+num(e.manualPartial)+num(e.aidedPartial)>0);
  }

  function taskEntries(data){
    const mobilizationEntries=normalizeEntries(data?.mobilizations?.entries);
    if(entriesHaveData(mobilizationEntries)) return mobilizationEntries;
    const tasks=data?.tasks;
    if(tasks && typeof tasks==='object' && Object.keys(tasks).length){
      const result={};
      Object.entries(tasks).forEach(([id,shifts])=>{
        let tm=0,ta=0,pm=0,pa=0;
        if(Array.isArray(shifts)) shifts.forEach(r=>{tm+=num(r?.tm);ta+=num(r?.ta);pm+=num(r?.pm);pa+=num(r?.pa);});
        else if(shifts && typeof shifts==='object'){
          if(['tm','ta','pm','pa'].some(k=>Object.prototype.hasOwnProperty.call(shifts,k))){tm=num(shifts.tm);ta=num(shifts.ta);pm=num(shifts.pm);pa=num(shifts.pa);}
          else Object.values(shifts).forEach(r=>{tm+=num(r?.tm);ta+=num(r?.ta);pm+=num(r?.pm);pa+=num(r?.pa);});
        }
        result[id]={manualTotal:tm,aidedTotal:ta,manualPartial:pm,aidedPartial:pa};
      });
      return result;
    }
    return mobilizationEntries;
  }

  function rawMobilizationTotals(data){
    let st=0,lta=0,sp=0,lpa=0;
    Object.values(taskEntries(data)).forEach(e=>{st+=num(e.manualTotal)+num(e.aidedTotal);lta+=num(e.aidedTotal);sp+=num(e.manualPartial)+num(e.aidedPartial);lpa+=num(e.aidedPartial);});
    return {st,lta,sp,lpa};
  }

  function taskTotalsFrom(data){
    const entries=taskEntries(data),raw=rawMobilizationTotals(data),overrides=data?.simulationMobilizationRatios||{};
    if(!Object.keys(overrides).length)return{st:raw.st,lta:raw.lta,sp:raw.sp,lpa:raw.lpa,stp:raw.st+raw.sp,pLTA:raw.st?100*raw.lta/raw.st:0,pLPA:raw.sp?100*raw.lpa/raw.sp:0};
    let st=0,lta=0,sp=0,lpa=0;
    Object.entries(entries).forEach(([id,e])=>{const totalT=num(e.manualTotal)+num(e.aidedTotal),totalP=num(e.manualPartial)+num(e.aidedPartial),ov=overrides[id]||{};st+=totalT;sp+=totalP;lta+=ov.total!==undefined&&totalT>0?totalT*Math.max(0,Math.min(100,num(ov.total)))/100:num(e.aidedTotal);lpa+=ov.partial!==undefined&&totalP>0?totalP*Math.max(0,Math.min(100,num(ov.partial)))/100:num(e.aidedPartial);});
    return{st,lta,sp,lpa,stp:st+sp,pLTA:st?100*lta/st:0,pLPA:sp?100*lpa/sp:0};
  }

  function registryMean(items,fields){
    if(!Array.isArray(items))return null;
    let units=0,points=0;
    items.forEach(x=>{const u=num(x?.units);if(u<=0)return;const p=fields.reduce((s,f)=>s+(x?.[f[0]]===true?f[1]:0),0);units+=u;points+=u*p;});
    return units?points/units:null;
  }
  const CHAIR_FIELDS=[['brakes',1],['arms',1],['back',1],['width',1]];
  const BATH_FIELDS=[['space',2],['door',1],['obstacles',1]];
  const WC_FIELDS=[['space',2],['height',1],['bar',1],['door',1],['lateral',1]];
  const ROOM_FIELDS=[['between',2],['foot',2],['bedSection',1],['underbed',2],['chairHeight',.5]];

  function wheelchairData(data){
    const types=Array.isArray(data?.wheelchairTypes)?data.wheelchairTypes:[];
    let units=0,points=0;
    types.forEach(x=>{const u=num(x?.units);if(u<=0)return;const p=CHAIR_FIELDS.reduce((s,f)=>s+(x?.[f[0]]===true?f[1]:0),0);units+=u;points+=u*p;});
    return{types,tsr:units,pmsr:units?points/units:null,points};
  }

  function calculateHospitalizacionFactors(data){
    const d=data||{},tt=taskTotalsFrom(d);
    const fsS=yn(d.fs_elevadores)||yn(d.fs_camillas)||yn(d.fs_camas3);
    const fsA=tt.st>0&&tt.lta/tt.st>=.9;
    const fs=!fsS&&!fsA?4:fsS&&fsA?.5:2;
    const faS=(yn(d.fa_sabana)&&yn(d.fa_dos))||(yn(d.fa_sabana)&&yn(d.fa_camas3));
    const faA=tt.sp>0&&tt.lpa/tt.sp>=.9;
    const fa=faS&&faA?.5:1;

    /* Fuente canónica de FC: módulo Sillas de ruedas. */
    const wc=wheelchairData(d);
    const na=num(d.na)||num(d.nc)+num(d.pc);
    const fcS=wc.tsr>=na*.5;
    let fc=1;
    if(wc.pmsr!==null)fc=wc.pmsr<=1.33?(fcS?.75:1):wc.pmsr<=2.66?(fcS?1.12:1.5):(fcS?1.5:2);

    /* Fuente canónica de Famb: módulos de baños y habitaciones. */
    const pmb=registryMean(d.bathTypes,BATH_FIELDS),pmwc=registryMean(d.wcTypes,WC_FIELDS),pmh=registryMean(d.roomTypes,ROOM_FIELDS);
    const pmamb=pmb!==null&&pmwc!==null&&pmh!==null?pmb+pmwc+pmh:null;
    const famb=pmamb===null?null:(pmamb<=5.8?.75:pmamb<=11.6?1.25:1.5);

    /* Fuente canónica de FF: módulo de formación. */
    const course=yn(d.ff_curso),cov=num(d.ff_cobertura),recent=yn(d.ff_antiguedad),eff=yn(d.ff_eficacia),info=yn(d.ff_informacion);
    const ff=(course&&cov>=75&&(recent||eff))?.75:(course&&cov>=50&&cov<75&&recent)||info?1:2;

    return{fs,fa,fc,famb,ff,taskTotals:tt,details:{fsSufficient:fsS,fsAdequate:fsA,faSufficient:faS,faAdequate:faA,pmsr:wc.pmsr,tsr:wc.tsr,fcSufficient:fcS,pmamb,pmB:pmb,pmWC:pmwc,pmH:pmh,wheelchairPoints:wc.points}};
  }
  window.MAPOCalculationEngine={taskTotalsFrom,calculateHospitalizacionFactors,taskEntries,wheelchairData,registryMean};
  window.calculateHospitalizacionFactors=calculateHospitalizacionFactors;
})();
