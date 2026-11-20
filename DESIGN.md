---
name: LifeOn
description: Plataforma SST para gestión de riesgos laborales en Chile (DS 44). Fuente: Figma "Plataforma LifeOn V2".
colors:
  brand-primary: "#FF3737"
  brand-primary-hover: "#ED1515"
  brand-primary-pressed: "#A50F0F"
  brand-primary-subtle: "#FFD7D7"
  brand-secondary: "#008B74"
  brand-secondary-hover: "#006F5D"
  brand-secondary-pressed: "#00382E"
  brand-secondary-subtle: "#CCE8E3"
  app-canvas: "#EDF7F5"
  bg-primary: "#FFFFFF"
  bg-secondary: "#FAFAFA"
  bg-tertiary: "#F7F7F7"
  bg-disabled: "#D9D9D9"
  text-primary: "#111111"
  text-secondary: "#545454"
  text-tertiary: "#8D8D8D"
  text-disabled: "#ADADAD"
  border-primary: "#EDEDED"
  border-secondary: "#ADADAD"
  success-subtle: "#F0FDF4"
  success-bold: "#00C950"
  success-text: "#00A63E"
  info-subtle: "#DBEAFE"
  info-bold: "#2B7FFF"
  info-text: "#155DFC"
  warning-subtle: "#FEFCE8"
  warning-bold: "#F0B100"
  warning-text: "#D08700"
  error-subtle: "#FEF2F2"
  error-bold: "#FB2C36"
  error-text: "#E7000B"
  lavender-avatar: "#BE72E4"
  lavender-avatar-icon: "#EEDBF8"
  ia-gradient-from: "#BDE7FF"
  ia-gradient-to: "#ADF2D3"
typography:
  h1:
    fontFamily: "Poppins, sans-serif"
    fontSize: "64px"
    fontWeight: 600
    lineHeight: "72px"
  h2:
    fontFamily: "Poppins, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "56px"
  h3:
    fontFamily: "Poppins, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: "48px"
  h4:
    fontFamily: "Poppins, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "38px"
  h5:
    fontFamily: "Poppins, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  h6:
    fontFamily: "Poppins, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  body-large:
    fontFamily: "Poppins, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "26px"
  body-medium:
    fontFamily: "Poppins, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-small:
    fontFamily: "Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
  caption:
    fontFamily: "Poppins, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
  micro-caption:
    fontFamily: "Poppins, sans-serif"
    fontSize: "10px"
    fontWeight: 300
    lineHeight: "18px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "999px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.bg-primary}"
    rounded: "{rounded.sm}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-primary-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.brand-primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.brand-secondary}"
    textColor: "{colors.bg-primary}"
    rounded: "{rounded.sm}"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.brand-secondary-hover}"
  button-tertiary:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    height: "40px"
  icon-button:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    size: "40px"
  icon-button-ia:
    backgroundColor: "{colors.ia-gradient-from}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    size: "40px"
  container:
    backgroundColor: "{colors.bg-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  stat-card:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-primary}"
    typography: "{typography.h4}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-item:
    textColor: "{colors.text-primary}"
    typography: "{typography.body-medium}"
    rounded: "{rounded.sm}"
    padding: "12px"
  nav-item-active:
    textColor: "{colors.brand-primary}"
  badge-ia:
    backgroundColor: "{colors.info-subtle}"
    textColor: "{colors.info-text}"
    typography: "{typography.micro-caption}"
    rounded: "{rounded.xs}"
  avatar-empty:
    backgroundColor: "{colors.lavender-avatar}"
    textColor: "{colors.lavender-avatar-icon}"
    rounded: "{rounded.full}"
    size: "32px"
  subscription-card:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "12px"
---

# LifeOn Design System

Fuente única de verdad: Figma **Plataforma LifeOn V2** (`IThKBkG0ujREL6m8RNFuMp`), páginas *Foundations*, *Components*, *UI Blocks* y *Screens Design*. Si este archivo y Figma no coinciden, manda Figma; actualiza este archivo.

## Overview

LifeOn es una herramienta de trabajo (modo *Operate*) para prevencionistas de riesgos en empresas chilenas: matrices IPER, ARTP, programa preventivo, documentación técnica y un asistente IA (APR Virtual). La interfaz es clara y luminosa: lienzo verde muy pálido, contenedores blancos de radio 16, tipografía Poppins y dos colores de marca, **rojo** (primario) y **teal** (secundario). El tono es cercano ("Hola de nuevo, Sergio" con la ilustración de mano) pero la información es operativa y real: nunca métricas ni historiales de ejemplo dentro de documentos de cumplimiento.

## Colors

- **Marca primaria (rojo `#FF3737`)**: botón primario, ítem activo del menú, ícono/texto de marca, contador de notificaciones. Hover `#ED1515`, pressed `#A50F0F`.
- **Marca secundaria (teal `#008B74`)**: botón secundario, enlaces y acciones de apoyo, estados "en marcha".
- **Neutros semánticos** (escala `Grey` de Figma): texto primario `#111111`, secundario `#545454`, terciario `#8D8D8D`, deshabilitado `#ADADAD`; bordes `#EDEDED`; fondos `#FFFFFF` / `#FAFAFA` / `#F7F7F7`.
- **Feedback**: success, info, warning y error tienen variante *subtle* (fondo) y *bold* (relleno) más un color de texto. El riesgo usa esta escala: Bajo = success, Medio = warning, Alto/Crítico = error.
- **Auxiliares**: Lavender (avatar sin foto), Azure y Emerald (solo en el degradado IA).
- **Degradado IA** (`IA/Primario`): Azure/100 `#BDE7FF` → Emerald/200 `#ADF2D3`, de izquierda a derecha. Es el **único** degradado del sistema y se reserva para puntos de entrada a la IA (botón APR de la barra superior).

En código (Tailwind v4, `app/globals.css`): `red-*`, `teal-*`, `grey-*`, `green-*`, `blue-*`, `yellow-*`, `red-error-*`, `lavender-*`, `azure-*`, `emerald-*` ya contienen los valores de Figma. Usa `grey-*` para texto y bordes del sistema.

> **Desviación consciente en código:** la escala `gray-400…700` de `globals.css` no existe en Figma; se ajustó a valores legibles (`gray-500` #737373, `gray-600` #525252) porque el código heredado la usa para texto. El código nuevo debe usar `grey-800` (secundario) en lugar de `gray-*`.

## Typography

Poppins en todo el producto (Regular 400, Medium 500, SemiBold 600; Light 300 solo en MicroCaption). Encabezados en **SemiBold**, nunca Black/ExtraBold. Escala: H1 64/72 · H2 48/56 · H3 40/48 · H4 32/38 · H5 24/32 · H6 20/28 · Body L 18/26 · Body M 16/24 · Body S 14/22 · Caption 12/20 · MicroCaption 10/18.

Uso en app: título de página = H4 SemiBold; ítems de menú = Body M; etiquetas de tarjeta = Body S en texto secundario; metadatos = Caption.

## Layout

- Lienzo `#EDF7F5` con margen de 12 px; sidebar de 270 px y área principal separados por 12 px.
- Contenedores blancos con padding 20 px; separación entre contenedores 12 px.
- Barra superior de 60 px: alternar menú, logo de la empresa, buscador (≈390 px), y a la derecha botones de 40 px: APR (degradado IA), notificaciones, ayuda, filtros, avatar 32 px.
- Escala de espaciado: 4, 8, 12, 16, 20, 24, 32.
- Bajo 1024 px el sidebar pasa a panel superpuesto que se abre con el botón de menú (no está en Figma; decisión de implementación).

## Elevation & Depth

Sombras de Figma: `xs` = `0 6px 16px -4px rgba(0,0,0,0.02)` para contenedores y barra superior; `sm`, `md`, `lg` para capas flotantes (dropdowns, modales). La profundidad se expresa sobre todo con bordes `#EDEDED`, no con sombras.

## Shapes

Radios: xs 4 (chips pequeños, badge IA) · sm/md 8 (botones, inputs, ítems de menú, tarjeta de suscripción) · lg 16 (contenedores, Stat Cards) · xl 24 (modales grandes) · full (avatares, puntos de estado). Bordes: 1 px por defecto.

## Components

- **Botones**: Primary (rojo), Secondary (teal), Tertiary (blanco); variantes Solid / Stroke / Text; tamaños Small, Medium (40 px), Large; estados enabled, hovered, focused (anillo), pressed, disabled (`#D9D9D9`).
- **Nav-item**: ícono 20 px + Body M; activo = texto e ícono rojo, sin fondo. Etiqueta "IA" = badge Info (azul subtle).
- **Stat Card**: borde `#EDEDED`, radio 16, padding 20; etiqueta Body S secundaria, valor H4 SemiBold, una línea Caption coloreada según estado (neutral / success / warning / error).
- **Saludo del Dashboard**: ilustración `public/images/dashboard/hola.png` (62 px) + "Hola de nuevo, {nombre}" (H4) + subtítulo Body M secundario.
- **Tarjeta de suscripción**: fondo `#FAFAFA`, punto verde, "Suscripción activa" (Caption Medium) y fecha (MicroCaption).
- **Avatar sin foto**: círculo lavanda `#BE72E4` con silueta `#EEDBF8`.
- Otros componentes definidos en Figma y aún no auditados en código: Accordion, Breadcrumb, Callout, Chips, Dropdown, Dropzone, Empty-state, List-item, Pagination, ProgressBar, Steps, Table, Tabs, Tag, Text-input, Textarea, Tooltip, Modal, Drawer, Command-Palette, Box-assistant (APR Virtual).

## Do's and Don'ts

- **Do** usar el rojo de marca solo como color primario de acción y de marca; para riesgo crítico usa los tokens de *error* (`#E7000B` / `#FB2C36`) con etiqueta de texto, nunca color solo.
- **Do** mostrar datos reales o un estado vacío honesto; nada de historiales, aprobadores o fechas de ejemplo en documentos de cumplimiento.
- **Do** usar íconos Lucide (`react-icons/lu`) en un solo trazo; **don't** usar emoji como íconos o estados.
- **Don't** usar degradados salvo el degradado IA en entradas a la IA; **don't** violeta/índigo fuera de la paleta Lavender.
- **Don't** usar `font-black` / `font-extrabold`; encabezados en SemiBold.
- **Don't** usar `backdrop-blur` decorativo ni animaciones de pulso permanentes; anima solo estados reales (cargando, pensando).
- **Atención contraste (sobre blanco):** blanco sobre `#FF3737` 3.6:1, texto terciario `#8D8D8D` 3.3:1, success `#00A63E` 3.2:1 y warning `#D08700` 2.9:1 no alcanzan 4.5:1 para texto pequeño (error `#E7000B` 4.8:1 y secundario `#545454` 7.6:1 sí). Pendiente de revisar con diseño; mientras tanto úsalos en texto ≥18 px o acompañados de un ícono/etiqueta que no dependa del color.
