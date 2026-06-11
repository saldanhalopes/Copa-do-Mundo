# COP-22 — MatchScreen UX Spec & Inspector Wiring

**Owner:** UXDesigner → CTO (implementation)
**Status:** Spec complete, ready for implementation

---

## 1. Screen overview

The MatchScreen has 5 logical zones stacked vertically in a 1080×1920 portrait canvas (reference resolution from `DESIGN.md`).

```
┌─────────────────────┐
│  Mode Selector       │  ≈ 120px — Ranked / Staked toggle
│  (ranked/staked)     │
├─────────────────────┤
│  Stake Options       │  ≈ 160px — only visible in staked mode
│  (amount picker)     │
├─────────────────────┤
│  Lineup Grid         │  ┬  ≈ 720px — 11 players + 1 coach
│  (4-col grid)        │  │  scrollable if content overflows
│                      │  ┴
├─────────────────────┤
│  Team OVR + CTA      │  ≈ 120px — OVR text + start button
├─────────────────────┤
│  Tab Bar (from nav)  │  ≈ 150px — global navigation
└─────────────────────┘
```

**Overlays** (render on top, opaque backdrop):
- Picker Panel — select a card from inventory
- Staked Confirm Modal — confirm stake amount before matchmaking
- Battle Panel — clash-by-clash battle animation
- Result Panel — victory/defeat + ELO change

---

## 2. GameObject hierarchy & inspector mapping

Every public field in `MatchScreen.cs` maps to a GameObject in this tree.
Names match the field names for easy inspector drag-and-drop.

```
PartidaPanel                                  ← MatchScreen component lives here
├── ModeSelector                              ← GameObject
│   ├── RankedModeButton                      ← Button → rankedModeButton
│   │   ├── Label                             ← TMP_Text "Ranqueada"
│   │   └── RankedModeHighlight               ← GameObject → rankedModeHighlight (4px bar at bottom)
│   ├── StakedModeButton                      ← Button → stakedModeButton
│   │   ├── Label                             ← TMP_Text "Aposta"
│   │   └── StakedModeHighlight               ← GameObject → stakedModeHighlight (4px bar at bottom)
│   └── ModeDescriptionText                   ← TMP_Text → modeDescriptionText
│
├── StakedOptionsPanel                        ← GameObject → stakedOptionsPanel
│   ├── StakeText                             ← TMP_Text → stakeText
│   └── StakeButtons                          ← GameObject (horizontal layout)
│       ├── Btn5                              ← Button → stakeButtons[0]
│       ├── Btn10                             ← Button → stakeButtons[1]
│       ├── Btn25                             ← Button → stakeButtons[2]
│       └── Btn50                             ← Button → stakeButtons[3]
│
├── LineupScroll                              ← ScrollRect
│   └── LineupGrid                            ← GridLayoutGroup (4 columns)
│       ├── PlayerSlot_0                      ← CardSlot → playerSlots[0]
│       │   ├── CardView                      ← CardView (hidden when empty)
│       │   └── EmptyState                    ← GameObject + TMP_Text "GOL"
│       ├── PlayerSlot_1                      ← CardSlot → playerSlots[1] … "LAT"
│       ├── PlayerSlot_2                      ← CardSlot → playerSlots[2] … "LAT"
│       ├── PlayerSlot_3                      ← CardSlot → playerSlots[3] … "ZAG"
│       ├── PlayerSlot_4                      ← CardSlot → playerSlots[4] … "ZAG"
│       ├── PlayerSlot_5                      ← CardSlot → playerSlots[5] … "ZAG"
│       ├── PlayerSlot_6                      ← CardSlot → playerSlots[6] … "MEI"
│       ├── PlayerSlot_7                      ← CardSlot → playerSlots[7] … "MEI"
│       ├── PlayerSlot_8                      ← CardSlot → playerSlots[8] … "MEI"
│       ├── PlayerSlot_9                      ← CardSlot → playerSlots[9] … "ATA"
│       ├── PlayerSlot_10                     ← CardSlot → playerSlots[10] … "ATA"
│       └── CoachSlot                         ← CardSlot → coachSlot
│           ├── CardView                      ← CardView (hidden when empty)
│           └── EmptyState                    ← GameObject + TMP_Text "TÉC"
│
├── FooterInfo
│   ├── TeamOvrText                           ← TMP_Text → teamOvrText
│   └── StartButton                           ← Button → startButton
│       └── Label                             ← TMP_Text → startButtonText
│
├── PickerPanel                               ← GameObject (overlay, inactive by default)
│   ├── Backdrop                              ← Image (click to close)
│   └── PickerGrid                            ← Transform → pickerGrid (GridLayoutGroup)
│       └── PickerCardPrefab                  ← GameObject → pickerCardPrefab (CardView + Button)
│
├── StakedConfirmModal                        ← GameObject (overlay, inactive by default)
│   ├── Backdrop                              ← Image
│   ├── ConfirmStakeValueText                 ← TMP_Text → confirmStakeValueText
│   ├── ConfirmWarningText                    ← TMP_Text → confirmWarningText
│   ├── ConfirmStakeButton                    ← Button → confirmStakeButton
│   └── CancelStakeButton                     ← Button → cancelStakeButton
│
├── BattlePanel                               ← GameObject (overlay, inactive by default)
│   ├── BattleStatus                          ← TMP_Text → battleStatus
│   ├── ScoreText                             ← TMP_Text → scoreText
│   ├── ClashContainer                        ← Transform → clashContainer (VerticalLayoutGroup)
│   │   └── ClashRowPrefab                    ← GameObject → clashRowPrefab
│   └── ResultPanel                           ← GameObject → resultPanel (hidden until battle ends)
│       ├── ResultText                        ← TMP_Text → resultText
│       └── ResultDetail                      ← TMP_Text → resultDetail
│
└── BattleController                          ← BattleController component
```

### `CardSlot` internal wiring

Each `CardSlot` in the lineup needs these fields assigned:

| CardSlot field | GameObject child |
|---|---|
| `cardView` | `CardView` (child of the slot) |
| `emptyState` | `EmptyState` (child of the slot) |
| `emptyLabel` | `TMP_Text` on `EmptyState` |
| `button` | `Button` on the slot root |
| `expectedPosition` | Set in Inspector per slot (GOL, LAT, ZAG, MEI, ATA, TÉC) |

### `BattleController` wiring

| BattleController field | GameObject |
|---|---|
| (the component lives on a child of PartidaPanel) | |

**Note:** `BattleController` uses C# events (`OnMatchmaking`, `OnClashRevealed`, `OnBattleEnd`) — no inspector wiring needed for those. MatchScreen hooks them in `Start()`.

---

## 3. Layout & spacing design (DESIGN.md tokens)

**Canvas:** 1080×1920, ScaleWithScreenSize, reference 1080×1920.

| Token | Value | Source |
|---|---|---|
| Background | `#0A2E22` | DESIGN.md — Verde campo escuro |
| Accent / CTA | `#FFDF00` (Amarelo troféu) | DESIGN.md |
| Text on dark | `#F3E9D2` (Papel envelhecido) | DESIGN.md |
| Text on accent | `#0A2E22` | DESIGN.md |
| Mode tab inactive | `#0A2E22` at 50% | Derived |
| Card slot empty | `#14533C` (Verde gramado) | DESIGN.md |
| Card slot border | `#F3E9D2` at 30% | Derived |
| Highlight bar | `#FFDF00` | DESIGN.md |
| Type (titles) | Archivo Black | DESIGN.md |
| Type (body) | Space Grotesk | DESIGN.md |

**Spacing:**
- Mode selector: top edge of panel (y-offset 0), 2 buttons side by side 540px each
- Inter-zone gap: 24px
- Lineup grid: 4 columns, cell size 240×300, spacing 8px
- Footer zone: 16px padding top/bottom
- Overlay backdrop: semi-transparent black (`#000000` at 70%)
- Modal padding: 40px

---

## 4. States & interaction flow

### 4.1 Default state (Ranked, no lineup)

```
ModeSelector: RankedHighlight ON, StakedHighlight OFF
StakedOptionsPanel: HIDDEN
Lineup: 11 empty slots + 1 empty coach slot
TeamOvrText: "OVR do time: — · Téc +0"
StartButton: DISABLED, text "Escale 11 jog. + técnico"
```

### 4.2 Ranked, complete lineup

```
StartButton: ENABLED, text "⚔️ Buscar partida ranqueada"
TeamOvrText: "OVR do time: 1842 · Téc +5"
StartButton onClick: → StartMatchInternal (non-staked path)
```

### 4.3 Staked mode toggled

```
ModeSelector: RankedHighlight OFF, StakedHighlight ON
StakedOptionsPanel: VISIBLE
StakeText: "Aposta: 5 · vencedor leva 9"
StakeButtons: interativos, destaque no valor selecionado
```

### 4.4 Staked, complete lineup

```
StartButton: text "⚔️ Buscar oponente — apostar 25"
StartButton onClick: → ShowStakedConfirmModal
```

### 4.5 Picker overlay

```
Backdrop VISIBLE (click closes)
PickerGrid populated with owned cards (filtered by slot type)
Click card → PickCard → closes picker, updates slot
```

### 4.6 Staked confirm modal

```
Backdrop VISIBLE
ConfirmStakeValueText: "Aposta: 25 POL"
ConfirmWarningText: "Valor total: 50 (você + oponente)..."
Confirm → StartMatchInternal
Cancel → close modal
```

### 4.7 Battle in progress

```
BattlePanel VISIBLE (hides lineup)
BattleStatus: "Pareando oponente equilibrado…" → "Batalha!"
Clashes animate one-by-one (0.8s delay per clash)
ScoreText: "0 — 0" → "1 — 0" → etc.
```

### 4.8 Battle result

```
ResultText: "🏆 VITÓRIA!" or "DERROTA"
ResultDetail: show prize/ELO delta
ResultPanel: VISIBLE (stays until user navigates away)
```

---

## 5. Accessibility & UX heuristics applied

| Heuristic | Application |
|---|---|
| **Hick's Law** | Only 2 mode choices, 4 stake values — minimal decision complexity |
| **Fitts's Law** | Start button is large (≥ 300×100px), near bottom thumb zone |
| **Progressive disclosure** | Stake options hidden until staked mode selected |
| **Recognition over recall** | Slots show position label when empty; owned cards in picker |
| **Forgiveness** | Staked confirm modal prevents accidental matchmaking; cancel available |
| **Feedback** | Button text changes reflect state; battle status updates live |
| **Consistency** | Same CardView component used in picker, slots, and battle |
| **Mobile thumb zone** | Mode selector at top (easy reach), start button at bottom, slots scroll in middle |
| **WCAG contrast** | Text on dark green: white `#F3E9D2` passes AA. Text on yellow `#FFDF00`: `#0A2E22` passes AA |
| **Color independence** | Mode indicator uses highlight bar position + icon/text, not color alone |

---

## 6. Acceptance criteria

- [ ] All 28 inspector fields in `MatchScreen.cs` are connected to real GameObjects
- [ ] `BattleController` component is on a child of PartidaPanel (or the panel itself)
- [ ] 11 `CardSlot` instances in `playerSlots[11]`, each with distinct `expectedPosition`
- [ ] `coachSlot` wired with `expectedPosition = "TÉC"`
- [ ] `stakeButtons[4]` wired with corresponding `stakeValues[4]` = {5, 10, 25, 50}
- [ ] Picker panel: `pickerCardPrefab` has both `CardView` and `Button` components
- [ ] `clashRowPrefab` has at least 2 `CardView` children + 1 `TMP_Text`
- [ ] All overlays start inactive (`SetActive(false)` in `Start()`)
- [ ] Start button is non-interactive until 11 players + coach are slotted
- [ ] Staked confirm modal shows correct stake value and warning
- [ ] Battle panel shows clash rows with live score updates
- [ ] Result panel shows victory/defeat with prize and ELO delta
