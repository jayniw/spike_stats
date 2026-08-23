# Feature Specification: SpikeStats MVP — Plataforma de estadísticas de voleibol en vivo

**Feature Branch**: `001-spikestats-mvp`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Construir SpikeStats según lo descrito en README.md"

## Clarifications

### Session 2026-08-23

- Q: ¿Qué información de las jugadoras debe mostrar el marcador público compartible cuando se registra una acción? → A: Configurable por partido por el entrenador, con "solo dorsal y posición" como valor inicial seguro (los nombres nunca se exponen por defecto).
- Q: ¿Los clubes necesitan cargar resultados de partidos anteriores a la app (solo resultado por sets, sin acciones) para historial y % de victorias? → A: Sí, alta manual solo-resultado; cuenta para historial y % de victorias, pero no para métricas basadas en acciones.
- Q: ¿Qué escala de uso debe soportar la plataforma durante su primer año? → A: Hasta 50 clubes activos (~250 equipos), dentro del nivel gratuito de infraestructura.
- Q: ¿Los analistas necesitan exportar las métricas de los dashboards (archivos o reportes) en la v1? → A: No; la exportación queda fuera de alcance explícito en v1.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Crear club e invitar miembros con roles (Priority: P1)

Como administrador de un club quiero crear mi club en la plataforma, invitar a
entrenadores, analistas y jugadores, y asignar roles, para que cada persona
vea y haga únicamente lo que le corresponde dentro de MI club.

**Why this priority**: El producto es multi-club desde el día uno; sin
organizaciones, membresías y roles no existe ninguna otra funcionalidad de
forma segura.

**Independent Test**: Se puede probar creando un club, invitando un usuario
con rol "espectador" y verificando que ese usuario ve el club pero no puede
crear equipos ni anotar partidos.

**Acceptance Scenarios**:

1. **Given** una usuaria autenticada sin club, **When** crea un nuevo club,
   **Then** queda como administradora de ese club y accede a su espacio
   aislado de datos.
2. **Given** un club existente, **When** la administración invita por correo a
   un usuario y le asigna el rol "entrenador", **Then** al aceptar la
   invitación el usuario puede gestionar equipos y anotar partidos, pero no
   gestionar membresías ni eliminar el club.
3. **Given** dos clubs A y B en la misma instancia, **When** un usuario del
   club A intenta abrir por URL directa un partido del club B, **Then** el
   acceso es denegado y ningún dato del club B se muestra.

---

### User Story 2 - Gestionar equipos y jugadores (Priority: P1)

Como entrenador quiero registrar mis equipos (categorías) y sus jugadoras con
dorsal y posición, para tener el roster listo antes de anotar partidos.

**Why this priority**: Todo registro de acciones en vivo se atribuye a
jugadoras de un roster; es el prerrequisito directo del anotador.

**Independent Test**: Se puede probando creando un equipo, agregando 12
jugadoras con dorsales y posiciones, e intentando (sin éxito) duplicar un
dorsal.

**Acceptance Scenarios**:

1. **Given** un entrenador de un club, **When** crea un equipo con nombre y
   categoría y agrega jugadoras con nombre, dorsal y posición, **Then** el
   roster queda guardado y visible para los miembros autorizados del club.
2. **Given** un equipo con la jugadora "7 — Martina", **When** se intenta
   registrar otra jugadora con dorsal 7 en el mismo equipo, **Then** el
   sistema rechaza el alta con un mensaje claro.
3. **Given** una jugadora con histórico de partidos, **When** se la elimina o
   archiva del roster, **Then** sus estadísticas históricas permanecen
   consultables y correctamente atribuidas.

---

### User Story 3 - Registrar partidos y resultados (Priority: P1)

Como entrenador quiero registrar cada partido (rival, fecha, competencia) y
su resultado por sets, para construir el historial del equipo.

**Why this priority**: Los dashboards y el anotador en vivo operan sobre un
partido registrado; es la unidad organizadora de la temporada.

**Independent Test**: Se puede probar registrando un partido contra un rival
en una fecha, editando su resultado por sets y verificando que aparece en el
historial del equipo.

**Acceptance Scenarios**:

1. **Given** un equipo con roster, **When** el entrenador registra un partido
   indicando rival, fecha y competencia, **Then** el partido figura en estado
   "programado" en el historial.
2. **Given** un partido finalizado, **When** el entrenador carga el resultado
   por sets (ej. 3-1), **Then** el resultado queda asociado al partido y se
   refleja en el historial.
3. **Given** un partido en estado "programado", **When** cualquier usuario sin
   rol de entrenador/analista intenta editar su resultado, **Then** la edición
   es denegada.

---

### User Story 4 - Anotación en vivo desde el teléfono (Priority: P2)

Como entrenador en la cancha quiero anotar cada acción del partido tocando
botones grandes con una sola mano en mi teléfono, para registrar saque,
recepción, colocación, ataque, bloqueo y defensa con su resultado (punto /
error / continuidad) sin perder jugadas.

**Why this priority**: Es el corazón del producto y su diferencial; convierte
el esfuerzo de anotar en estadísticas valiosas.

**Independent Test**: Se puede probando iniciar una sesión de anotación en un
partido programado, registrar una secuencia de acciones y verificar orden,
atribución a jugadora y marcador acumulado.

**Acceptance Scenarios**:

1. **Given** un partido programado, **When** el entrenador inicia la anotación
   en vivo desde su teléfono, **Then** puede registrar acciones eligiendo
   habilidad, jugadora y resultado, y el sistema mantiene el puntaje del set
   en curso automáticamente.
2. **Given** una acción registrada por error, **When** el entrenador usa la
   función deshacer o corrige la jugadora atribuida antes de finalizar el
   partido, **Then** el registro y las estadísticas derivadas quedan
   correctos.
3. **Given** el set en curso con 24-24, **When** se registra un punto, **Then**
   el set continúa hasta que haya diferencia de 2 puntos; al cerrarse el set
   el marcador pasa al siguiente set.
4. **Given** el anotador en pantalla de teléfono, **When** el entrenador opera
   con el pulgar sin reposicionar la mano, **Then** todas las acciones
   principales son alcanzables y los toques errados se recuperan con
   deshacer.

---

### User Story 5 - Sincronización en vivo y marcador público compartible (Priority: P2)

Como familiar o directivo quiero abrir un enlace público de solo lectura del
partido en curso y ver el marcador actualizado al instante, mientras el
entrenador anota en la cancha.

**Why this priority**: Multiplica el valor del anotador: seguidores remotos y
el banco ven el partido en tiempo real sin instalar nada.

**Independent Test**: Se puede probando compartiendo el enlace de un partido
en vivo, abriéndolo sin sesión iniciada y verificando que el marcador refleja
las acciones anotadas en segundos.

**Acceptance Scenarios**:

1. **Given** un partido en vivo con anotación activa, **When** una persona
   abre el enlace público compartido, **Then** ve el marcador, el set en
   curso y las últimas acciones sin necesidad de cuenta.
2. **Given** el enlace público abierto, **When** el entrenador registra una
   acción con punto, **Then** el marcador del espectador se actualiza en
   cuestión de segundos sin recargar manualmente.
3. **Given** un partido marcado como privado, **When** alguien abre su enlace
   anterior, **Then** el acceso al contenido en vivo es denegado.

---

### User Story 6 - Anotación tolerante a cortes de red (Priority: P2)

Como entrenador en un gimnasio con mala señal quiero que las acciones que
anoto sin conexión se guarden en mi teléfono y se sincronicen solas al
reconectar, para no perder ninguna jugada.

**Why this priority**: La confianza del entrenador en la herramienta depende
de que jamás se pierda una jugada; sin esto el anotador no es utilizable en
canchas reales.

**Independent Test**: Se puede probando activando modo avión durante una
anotación, registrando varias acciones, restableciendo la conexión y
verificando que todas las acciones aparecen exactamente una vez, en orden.

**Acceptance Scenarios**:

1. **Given** una anotación en vivo sin conexión, **When** el entrenador
   registra acciones, **Then** la app confirma cada registro localmente y
   muestra el estado pendiente de sincronización.
2. **Given** acciones pendientes almacenadas localmente, **When** la conexión
   se restablece, **Then** todas se sincronizan automáticamente sin pérdida
   ni duplicados, conservando el orden original.
3. **Given** una desconexión durante el cierre de la app, **When** el
   entrenador la reabre antes de reconectar, **Then** las acciones pendientes
   siguen presentes y se sincronizan luego.

---

### User Story 7 - Dashboard de equipo (Priority: P3)

Como entrenador o analista quiero ver resultados históricos, % de victorias,
sets ganados/perdidos y eficiencias agregadas del equipo con evolución por
temporada, para responder cómo viene rindiendo el equipo.

**Why this priority**: Convierte los registros en decisiones; primer nivel de
analítica tras tener datos cargados.

**Independent Test**: Se puede probando con una temporada de partidos
cargados y verificando que los indicadores coinciden con el cálculo manual a
partir de las acciones registradas.

**Acceptance Scenarios**:

1. **Given** varios partidos finalizados con acciones registradas, **When** el
   analista abre el dashboard de equipo, **Then** ve historial de resultados,
   % de victorias, sets ganados/perdidos y eficiencias agregadas coherentes
   con las fórmulas definidas.
2. **Given** más de una temporada registrada, **When** se filtra por temporada
   o competencia, **Then** todos los indicadores se recalculan para esa
   selección.
3. **Given** acciones nuevas de un partido en vivo, **When** el dashboard está
   abierto, **Then** los indicadores se actualizan automáticamente sin
   recargar la página.

---

### User Story 8 - Dashboard por jugadora (Priority: P3)

Como analista quiero ver por jugadora los promedios por partido, eficiencia
de ataque, % de acierto en saque, calidad de recepción y tendencia temporal,
para comparar jugadoras y detectar dónde perdemos más puntos.

**Why this priority**: Completa la propuesta de valor analítica a nivel de
individuo; habilita comparaciones y seguimiento de desarrollo.

**Independent Test**: Se puede probando abriendo el perfil de una jugadora
con N partidos registrados y contrastando cada métrica contra el cálculo
manual sobre sus acciones.

**Acceptance Scenarios**:

1. **Given** una jugadora con acciones registradas en varios partidos,
   **When** el analista abre su dashboard, **Then** ve promedios por partido,
   eficiencia de ataque, kill %, ace % y errores de saque por set, y calidad
   de recepción según las fórmulas definidas.
2. **Given** dos o más jugadoras del mismo equipo, **When** el analista usa la
   vista comparativa, **Then** puede contrastar sus métricas lado a lado.
3. **Given** una jugadora con actividad en múltiples temporadas, **When** se
   selecciona un rango temporal, **Then** la tendencia mostrada corresponde
   solo a ese rango.

---

### Edge Cases

- ¿Qué ocurre si se pierde conexión justo cuando se cierra un set? El cambio
  de set y las acciones previas deben quedar registradas localmente y
  sincronizarse en orden al reconectar.
- ¿Cómo maneja el sistema dos dispositivos del mismo entrenador abriendo la
  anotación del mismo partido? Solo debe haber una sesión de anotación activa
  por partido; el segundo dispositivo recibe un aviso claro y modo solo
  lectura.
- ¿Qué ocurre si se registran acciones después de finalizar el partido? El
  sistema bloquea nuevas acciones tras la finalización; correcciones requieren
  reabrir el partido explícitamente (rol entrenador/analista).
- ¿Qué ocurre si un rival tiene el mismo nombre que otro ya registrado? Los
  rivales son etiquetas libres por partido; no se exige unicidad.
- ¿Qué ocurre con el enlace público de un partido cancelado? El enlace muestra
  estado "cancelado/sin datos en vivo" y nunca expone datos de otros
  partidos.
- ¿Qué ocurre si se intenta atribuir una acción a una jugadora eliminada del
  roster? Las acciones históricas mantienen la referencia y las métricas; solo
  se impide atribuir acciones nuevas a jugadoras inactivas.
- ¿La restricción de identidad pública afecta las vistas internas? No: los
  dashboards y anotador del club siempre muestran nombres; el modo "solo
  dorsal" aplica exclusivamente al contenido del enlace público.

## Requirements *(mandatory)*

### Functional Requirements

**Gestión de clubes y accesos**

- **FR-001**: System MUST permitir a una usuaria autenticada crear un club y
  convertirse en su administradora.
- **FR-002**: System MUST permitir invitar usuarios por correo y asignar a
  cada membresía exactamente uno de estos roles: administrador de club,
  entrenador, analista, jugadora, espectador.
- **FR-003**: System MUST aplicar permisos por rol: solo administradores
  gestionan membresías; solo entrenadores y analistas registran/editan
  partidos y acciones; jugadoras y espectadores solo visualizan contenido
  permitido.
- **FR-004**: System MUST garantizar aislamiento total entre clubes: ningún
  usuario, sea cual fuere su rol o el medio de acceso (navegación, URL
  directa, enlace), puede ver o modificar datos de otro club.
- **FR-005**: Users MUST poder pertenecer a más de un club con roles
  independientes en cada uno.

**Equipos y jugadoras**

- **FR-006**: Coaches MUST poder crear, editar y archivar equipos dentro de su
  club.
- **FR-007**: Coaches MUST poder registrar jugadoras con nombre, dorsal
  (1–99) y posición ∈ {colocador, opuesto, central, receptor/a, líbero}.
- **FR-008**: System MUST rechazar dorsales duplicados dentro del mismo equipo
  activo, con mensaje claro.
- **FR-009**: System MUST preservar la atribución histórica de estadísticas de
  jugadoras eliminadas o archivadas.

**Partidos**

- **FR-010**: Coaches MUST poder registrar un partido indicando rival, fecha,
  competencia y condición (local/visitante).
- **FR-011**: System MUST gestionar estados de partido: programado → en vivo →
  finalizado (y cancelado); la anotación en vivo solo procede en "en vivo".
  System MUST además permitir registrar directamente como "finalizado" un
  partido ya jugado cargando únicamente su resultado por sets (sin acciones).
- **FR-012**: Coaches MUST poder cargar/editar el resultado por sets hasta la
  finalización definitiva.

**Anotación en vivo**

- **FR-013**: Coaches MUST poder iniciar una sesión de anotación en vivo desde
  su teléfono para un partido programado.
- **FR-014**: System MUST registrar cada acción con: tipo de habilidad ∈
  {saque, recepción, colocación, ataque, bloqueo, defensa}, resultado ∈
  {punto, error, continuidad}, jugadora del roster, y orden/tiempo de
  registro.
- **FR-015**: System MUST mantener automáticamente el marcador por set a
  partir de las acciones con resultado "punto" y detectar el cierre de set
  según las reglas estándar (25 puntos con diferencia de 2; quinto set a 15).
- **FR-016**: The scoring screen MUST ser operable con una mano: todas las
  acciones principales accesibles con el pulgar, botones grandes tolerantes
  al pulso, y recuperación de toques errados mediante deshacer.
- **FR-017**: Users MUST poder deshacer la última acción y corregir la
  jugadora atribuida en cualquier momento antes de la finalización.
- **FR-018**: System MUST persistir localmente toda acción registrada sin
  conexión y sincronizarla automáticamente al reconectar sin pérdida ni
  duplicación, conservando el orden de registro.
- **FR-019**: System MUST permitir una única sesión de anotación activa por
  partido; un segundo dispositivo accede en modo solo lectura con aviso.

**Marcador público**

- **FR-020**: System MUST generar un enlace público de solo lectura por
  partido en vivo que muestre marcador, set en curso y últimas acciones, sin
  requerir cuenta. La identificación de jugadoras en ese contenido es
  configurable por partido por el entrenador; el valor inicial seguro muestra
  únicamente dorsal y posición, nunca nombres.
- **FR-021**: System MUST actualizar el marcador público en tiempo cercano al
  real conforme se registran acciones.
- **FR-022**: System MUST permitir desactivar (privatizar) el enlace público;
  desactivado, el acceso al contenido en vivo es denegado.

**Dashboards**

- **FR-023**: Team dashboard MUST mostrar: historial de resultados, % de
  victorias, sets ganados/perdidos, puntos por set (PPS), eficiencia de
  ataque, ace % y errores de saque por set, recepción (% perfectas y errores),
  y bloqueos por set, con filtros por temporada/competencia y evolución
  temporal. El historial y el % de victorias incluyen los partidos cargados
  solo-resultado; las métricas derivadas de acciones se calculan únicamente
  sobre partidos con anotación.
- **FR-024**: Player dashboard MUST mostrar: promedios por partido, eficiencia
  de ataque `(kills − errores) / intentos`, kill % `kills / intentos`, ace %
  y errores de saque por set, calidad de recepción (% perfectas / errores),
  comparativa entre jugadoras y tendencia temporal.
- **FR-025**: System MUST calcular todas las métricas con las fórmulas aquí
  definidas y producir valores idénticos en todos los dashboards para los
  mismos datos.
- **FR-026**: Dashboards MUST actualizarse automáticamente cuando lleguen
  acciones nuevas de partidos en vivo.

**General**

- **FR-027**: The user interface MUST estar en español.
- **FR-028**: System MUST funcionar dentro de infraestructura de costo cero
  (niveles gratuitos), sin procesos de larga duración en servidor.

### Key Entities *(include if feature involves data)*

- **Club (Organización)**: institución con espacio de datos propio y aislado;
  contiene equipos, partidos y membresías.
- **Membresía**: relación usuario–club con un único rol
  (administrador/entrenador/analista/jugadora/espectador).
- **Equipo**: grupo dentro de un club, con nombre y categoría.
- **Jugadora**: integrante de un equipo; dorsal único por equipo, posición,
  estado activo/archivada.
- **Partido**: enfrentamiento contra un rival en fecha y competencia, con
  condición local/visitante, estado (programado/en vivo/finalizado/cancelado),
  resultado por sets y preferencia de identidad pública de jugadoras para el
  enlace (por defecto: solo dorsal). Puede existir sin acciones cuando se
  carga retrospectivamente solo el resultado.
- **Acción**: evento unitario de juego: habilidad, resultado, jugadora,
  partido/set asociado, número de orden; base de todas las métricas.
- **Enlace público**: token de solo lectura asociado a un partido en curso,
  activable/desactivable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un entrenador registra una acción de juego en menos de 2
  segundos durante jugada real (medición media sobre 20 acciones consecutivas).
- **SC-002**: Un set completo (~50 acciones) se anota sin perder ni una sola
  acción, incluyendo al menos un corte de red simulado.
- **SC-003**: 100% de las acciones anotadas sin conexión se sincronizan al
  reconectar, sin duplicados y en orden (verificado en pruebas controladas).
- **SC-004**: Una acción con punto registrada en cancha se refleja en el
  marcador público en menos de 5 segundos bajo conectividad normal.
- **SC-005**: 90% de entrenadores primerizos completan la anotación de un set
  de práctica sin ayuda externa en su primera sesión.
- **SC-006**: 100% de los intentos de acceso cruzado entre clubes (URLs
  directas, enlaces, roles elevados) resultan denegados en las pruebas de
  seguridad.
- **SC-007**: Un analista obtiene la respuesta a "¿quién tiene mejor eficiencia
  de ataque?" en menos de 10 segundos usando el dashboard de una temporada de
  ~20 partidos y 12 jugadoras.
- **SC-008**: Todas las métricas de dashboards coinciden 100% con el cálculo
  manual de referencia sobre las mismas acciones (suite de validación).
- **SC-009**: La plataforma mantiene los objetivos de SC-001 a SC-004 y los
  tiempos de respuesta de dashboards con hasta 50 clubes activos (~250
  equipos) y 10 partidos anotándose en vivo en simultáneo, sin exceder
  infraestructura gratuita.

## Assumptions

- Reglas de puntuación estándar FIVB adulto (sets a 25, tie-break a 15, mejor
  de 5) salvo indicación contraria de la competencia.
- v1 contempla una sola sesión de anotación activa por partido; anotación
  colaborativa multi-dispositivo queda fuera de alcance.
- No se requiere gestión de rotaciones ni alineaciones en cancha en v1; las
  acciones se atribuyen directamente a jugadoras nombradas.
- Autenticación por correo electrónico (contraseña o enlace mágico), estándar
  de la industria; sin SSO en v1.
- Las temporadas son etiquetas aplicadas a partidos (ej. "2026-Apertura"); no
  se gestiona como entidad independiente en v1.
- Los rivales son etiquetas de texto libre por partido, sin ficha propia.
- El enlace público no requiere cuenta y es revocable marcando el partido
  como privado.
- Idioma inicial de la interfaz: español.
- La exportación de métricas (CSV, PDF, reportes) queda fuera de alcance en
  v1: los dashboards son la única superficie analítica.
- Restricción de costos: operar dentro de niveles gratuitos de hosting y
  base de datos, según constitución del proyecto (Principio V).
