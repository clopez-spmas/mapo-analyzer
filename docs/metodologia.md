# MAPO Analyzer — metodología implementada

Esta aplicación está diseñada para salas/unidades de hospitalización y se basa exclusivamente en la documentación MAPO aportada en la conversación.

## Fórmula

`MAPO = [(NC/OP × FS) + (PC/OP × FA)] × FC × Famb × FF`

## Factores

- **FS:** 0,5 si el equipamiento es adecuado y suficiente; 2 si es insuficiente o inadecuado; 4 si es ausente o inadecuado e insuficiente.
- **FA:** 0,5 si las ayudas menores son adecuadas y suficientes; 1 si son ausentes/inadecuadas o insuficientes.
- **FC:** depende de PMSR y de si existe suficiencia numérica de sillas (TSR ≥ 50 % de NA).
- **Famb:** 0,75 para PMamb 0–5,8; 1,25 para 5,9–11,6; 1,5 para 11,7–17,5.
- **FF:** 0,75 / 1 / 2 según las condiciones de formación descritas en la documentación.

## Puntuaciones de ambiente

PMamb = PMB + PMWC + PMH.

Las fichas asignan, entre otras, estas puntuaciones: baños de higiene: espacio insuficiente para ayudas = 2, puerta <85 cm = 1, obstáculos fijos = 1; baños WC: espacio insuficiente para silla = 2, WC <50 cm = 1, barra lateral ausente/inadecuada = 1, puerta <85 cm = 1, espacio lateral WC-pared <80 cm = 1; habitaciones: espacio cama-pared/cama-cama <90 cm = 2, espacio libre en pies <120 cm = 2, cama que requiere levantamiento manual = 1, cama-suelo <15 cm = 2, sillón <50 cm = 0,5. Los elementos descriptivos no se suman.

## Sillas de ruedas

PMSR = puntuación total / número total de sillas.
Las cuatro características puntuables son: frenos inadecuados, reposabrazos no extraíbles/abatibles, respaldo inadecuado y anchura >70 cm; cada una aporta 1 punto por silla. Reposapiés y mantenimiento son descriptivos.

## Niveles

- 0: Ausente
- 0,01–1,50: Irrelevante
- 1,51–5,00: Medio
- >5,00: Alto
