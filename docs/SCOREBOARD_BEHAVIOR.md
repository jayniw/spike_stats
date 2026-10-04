# Scoreboard - Comportamientos Confirmados

> Documento único de referencia para todos los comportamientos del marcador en vivo. Centraliza lógica de incrementar, decrementar, bloquear y avanzar sets.

---

## Resumen Visual (Mobile)

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL                                    VISITANTE        │
│  ┌──┐ ┌──┐ ┌──┐        SET 2 / ››        ┌──┐ ┌──┐ ┌──┐   │
│  │25│ │18│ │ 0│        (centro clicable) │23│ │25│ │ 0│   │
│  └──┘ └──┘ └──┘        w-42px h-42px     └──┘ └──┘ └──┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Cuadros de resultado**: `w-10 h-10` (40px)
- **Botón central (set actual)**: `w-[42px] h-[42px]` (solo 2px más grande)
- **Sets máximos**: 5 (best_of_5) o 3 (best_of_3)

---

## Comportamientos por Acción

### 1. INCREMENTAR PUNTO (Tap / Click)

| Plataforma | Acción | Condición | Resultado |
|------------|--------|-----------|-----------|
| **Mobile / Touch** | Tap rápido (< 500ms) | Set **no bloqueado** | `+1` punto inmediato |
| **Desktop** | Click | Set **no bloqueado** | `+1` punto inmediato |
| **Cualquiera** | Tap/Click | Set **bloqueado (🔒)** | **Nada** (ignorado) |
| **Cualquiera** | Tap/Click | Set **deshabilitado** (futuro) | **Nada** (ignorado) |

**Feedback visual**: `active:scale-95` (rebote sutil al tocar)

---

### 2. DECREMENTAR PUNTO (Swipe Down)

| Plataforma | Acción | Condición | Resultado |
|------------|--------|-----------|-----------|
| **Mobile** | Swipe hacia abajo (> 15px) | Set **no bloqueado** Y `value > 0` | `-1` punto al soltar |
| **Mobile** | Swipe hacia abajo | Set **bloqueado (🔒)** | **Nada** |
| **Mobile** | Swipe hacia abajo | `value === 0` | **Nada** (mínimo 0) |
| **Desktop** | *No disponible* | - | Usar botón editar o undo |

**Feedback visual durante swipe**:
- Al arrastrar > 15px hacia abajo → aparece **`↓ -1`** en rojo debajo del cuadro
- Al soltar con hint visible → decrementa
- Si cancela (arrastra < 15px o hacia arriba) → no decrementa

**Threshold**: **15px** (reducido de 20px para mejor usabilidad móvil)

---

### 3. BLOQUEAR SET (Long Press)

| Plataforma | Acción | Condición | Resultado |
|------------|--------|-----------|-----------|
| **Mobile** | Mantener presionado **500ms** | Set **no bloqueado** | Marca set como bloqueado (🔒) |
| **Desktop** | *No implementado* | - | Solo touch |

**Efectos del bloqueo**:
1. Cuadro cambia a: `bg-muted text-muted-foreground opacity-50`
2. Aparece **🔒** en esquina superior derecha
3. **Ya no permite** incrementar ni decrementar
4. Dispara `onSetLocked(setNumber)` → sincroniza scores a Supabase
5. **Botón central cambia a `››`** (si hay siguiente set disponible)

---

### 4. AVANZAR AL SIGUIENTE SET

| Plataforma | Acción | Condición | Resultado |
|------------|--------|-----------|-----------|
| **Mobile / Desktop** | Click/Tap en botón central `››` | Set actual **bloqueado** Y **no es el último** | Avanza `current_set` en Supabase + store local |

**Botón central (estados)**:

| Estado | Apariencia | Acción al click |
|--------|------------|-----------------|
| **Set activo** (no bloqueado) | Fondo `muted`, número grande (`text-4xl`), cursor default | **Nada** |
| **Set bloqueado + hay siguiente** | **Ámbar (amber-500)**, `››` grande (`text-3xl`), hover amber-600 | **Avanza set** |
| **Set bloqueado (último/match done)** | Fondo `muted` + 🔒, número grande, cursor not-allowed | **Nada** |

**Tamaños**:
- Botón central: **42px × 42px** (`w-[42px] h-[42px]`)
- Cuadros de resultado: **40px × 40px** (`w-10 h-10`)
- Diferencia: **solo 2px** para que quepa en móvil con 5 sets

---

### 5. FINALIZAR / ABANDONAR PARTIDO

| Botón | Acción | Condición |
|-------|--------|-----------|
| **Finalizar Partido** (verde) | Abre confirmación → `completeMatch.mutate()` | Partido en progreso |
| **Abandonar** (rojo tenue) | Abre confirmación → `abandonMatch.mutate()` | Partido en progreso |
| **Reabrir Partido** (gris) | `reopenMatch.mutate()` | Partido `completed` o `abandoned` |

---

## Tabla Resumen - Mobile

| Gesture | Target | Condición | Efecto |
|---------|--------|-----------|--------|
| **Tap** | Cuadro resultado | No 🔒 | `+1` |
| **Swipe ↓ (>15px)** | Cuadro resultado | No 🔒, valor > 0 | `-1` |
| **Long Press (500ms)** | Cuadro resultado | No 🔒 | 🔒 Bloquea set |
| **Tap** | Centro `››` | 🔒 + hay siguiente | Siguiente set |
| **Tap** | Centro (número) | Sin 🔒 | Nada |
| **Tap** | Centro (🔒) | Último set | Nada |

---

## Estados del Cuadro de Resultado

```
┌─────────────────────────────────────────────────────────────┐
│  ESTADO              │  CLASE CSS                           │  INTERACCIÓN         │
├──────────────────────┼──────────────────────────────────────┼──────────────────────┤
│  Activo (editable)   │  bg-primary text-primary-foreground  │  Tap +1, Swipe -1   │
│  Bloqueado (🔒)      │  bg-muted text-muted-foreground      │  Ninguna            │
│  Deshabilitado       │  opacity-30 cursor-not-allowed       │  Ninguna            │
│  Press (active)      │  active:scale-95                     │  Feedback visual    │
└──────────────────────┴──────────────────────────────────────┴──────────────────────┘
```

---

## Timing Constants

```typescript
const LONG_PRESS_DELAY = 500;  // ms para bloquear set
const SWIPE_THRESHOLD = 15;    // px hacia abajo para mostrar hint -1
const SWIPE_CANCEL_THRESHOLD = 10;  // px movimiento horizontal cancela long-press
```

---

## Notas de Implementación Clave

1. **Usar `locked` no `disabled`** para gestos touch
   - `disabled` depende de `matchState` (React Query, timing async)
   - `locked` es estado local inmediato (`useState<Set<number>>`)

2. **El set actual NUNCA está disabled**
   - `isSetEnabled` retorna `true` para `currentSet` siempre
   - Solo se deshabilita si `matchState.isMatchComplete`

3. **Threshold reducido a 15px**
   - 20px era difícil en pantallas pequeñas / dedos grandes
   - 15px balancea sensibilidad vs swipe accidental

4. **Botón central ancho fijo 42px**
   - 40px = cuadros resultado + 2px = visible pero no invade
   - Evita overflow horizontal en móvil con 5 sets

---

## Testing Checklist (Mobile)

- [ ] Tap en cuadro activo → +1
- [ ] Swipe down 15px+ en cuadro activo → hint `↓ -1` → release → -1
- [ ] Swipe down 10px → no hint → release → no change
- [ ] Swipe down en cuadro 🔒 → no hint → no change
- [ ] Long press 500ms en cuadro activo → 🔒 aparece → no más tap/swipe
- [ ] Long press 300ms → cancel → no 🔒
- [ ] Tap en centro `››` (set bloqueado, no último) → avanza set
- [ ] 5 sets en pantalla → todos visibles sin scroll horizontal
- [ ] Valor 0 → swipe down → no decrementa
- [ ] Tap en cuadro deshabilitado (set futuro) → nada