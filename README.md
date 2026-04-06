# Alfresco — ATISA

Gestión y soporte de la plataforma Alfresco ECM en ATISA.

## Equipo

| Rol | Nombre | Responsabilidad |
|-----|--------|-----------------|
| Project Manager / Soporte L1 | Oscar | Tickets básicos, seguimiento de sprints, coordinación |
| Desarrollador / Soporte L2 | Leobardo | Tickets técnicos, código, configuración |
| Proveedor externo (L3) | [Appropia](https://appropia.com/es) | Escalaciones, soporte especializado Alfresco/Hyland |

## Estructura del proyecto

```
alfresco/
├── docs/                  # Documentación general y procedimientos
│   ├── guias/             # Guías de uso y administración
│   ├── arquitectura/      # Diagramas y docs de arquitectura
│   └── conocimiento/      # Knowledge base (soluciones de Appropia)
├── tickets/               # Registro y seguimiento de incidencias
│   ├── abiertos/          # Tickets en progreso
│   ├── cerrados/          # Tickets resueltos (con documentación)
│   └── escalados/         # Tickets escalados a Appropia
├── sprints/               # Seguimiento de sprints y dailys
├── scripts/               # Scripts de mantenimiento y automatización
└── templates/             # Plantillas para tickets, reportes, etc.
```

## Objetivo

Mejorar la implementación de Alfresco y reducir progresivamente la dependencia de Appropia mediante la captura sistemática de conocimiento técnico.
