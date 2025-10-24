# Shortcuts Plugin - Developer Documentation

## Architecture Overview

This plugin is built with a modular architecture following **SOLID principles** and **Facade pattern** for maintainability and extensibility. The original monolithic `HotkeyMonitor` class (732 lines) has been refactored into 10+ specialized modules, each with a single responsibility.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          ShortcutsPlugin                         │
│                            (main.ts)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ShortcutManager                            │
│                    (Facade Coordinator)                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Keyboard   │  │    Focus     │  │   Executor   │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │      UI      │  │  Listeners   │  │   Settings   │          │
│  │   Module     │  │   Events     │  │   Updates    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Core Coordinator

#### `ShortcutManager` (core/ShortcutManager.ts)
- **Responsibilities:** Facade that coordinates all sub-modules
- **Key Methods:**
  - `handleKeyDown()` - Main keyboard event entry point
  - `enterHotkeyMode()` / `cancelShortcuts()` - Mode management
  - `updateShortcuts()` - Update configuration
- **Dependencies:** All modules below
- **Lines:** ~467 lines

---

### Keyboard Module (core/keyboard/)

#### `KeyParser` (KeyParser.ts)
- **Responsibilities:** Parse keyboard events to standardized key strings
- **Key Methods:**
  - `parseKeyEvent()` - Convert KeyboardEvent to "ctrl+shift+A"
  - `convertToMacModifier()` - Platform-specific modifier conversion
  - `isModifierKey()` - Check if key is a modifier
- **Lines:** ~93 lines

#### `KeyboardListener` (KeyboardListener.ts)
- **Responsibilities:** Filter and categorize keyboard events
- **Key Methods:**
  - `handleKeyDown()` - Returns `KeyboardEventResult` with action type
  - `handleKeyUp()` - Clear pressed modifiers
- **Action Types:** `none`, `trigger`, `cancel`, `focus`, `sequence`
- **Lines:** ~337 lines

#### `SequenceMatcher` (SequenceMatcher.ts)
- **Responsibilities:** Track key sequences and match against shortcuts
- **Key Methods:**
  - `addKey()` - Add key to current sequence
  - `findMatch()` - Find matching shortcuts
  - `getCurrentSequenceString()` - Get formatted sequence
  - `reset()` / `startTimer()` - Sequence management
- **Lines:** ~202 lines

---

### Executor Module (core/executor/)

#### `ShortcutExecutor` (ShortcutExecutor.ts)
- **Responsibilities:** Execute shortcut actions
- **Action Types:**
  - `FUNC` - Execute predefined function
  - `ID` - Execute Obsidian command by ID
  - `ARIA` - Click element by aria-label
- **Key Methods:** `execute(config)` - Dispatch to appropriate handler
- **Lines:** ~119 lines

---

### Focus Module (core/focus/)

#### `FocusStateManager` (FocusStateManager.ts)
- **Responsibilities:** Unified focus state management (editor/input/contenteditable)
- **Key Methods:**
  - `setEditorFocus()` / `setInputFocus()` / `setContentEditableFocus()`
  - `restoreFocus()` - Restore previously focused element
  - `blurCurrent()` - Remove focus
- **Focus Types:** `editor`, `input`, `contenteditable`
- **Lines:** ~210 lines

#### `FocusHandler` (FocusHandler.ts)
- **Responsibilities:** Handle focus change events
- **Key Methods:**
  - `onEditorFocusChange()` - Handle editor focus
  - `onInputFocusChange()` - Handle input focus
  - `onContentEditableFocusChange()` - Handle contenteditable focus
- **Lines:** ~200 lines

---

### UI Module (core/ui/)

#### `StatusBarManager` (StatusBarManager.ts)
- **Responsibilities:** Manage status bar UI
- **Key Methods:**
  - `initialize()` - Setup status bar
  - `setActive()` - Toggle mod-active class
  - `setTooltip()` - Update tooltip
- **Lines:** ~132 lines

#### `NotificationService` (NotificationService.ts)
- **Responsibilities:** Display user notifications
- **Key Methods:**
  - `showShortcutModeActivated()` - Mode activation notice
  - `showCurrentSequence()` - Display sequence and matches
  - `showShortcutExecuted()` - Execution confirmation
  - `showNoMatch()` - No match found notice
- **Lines:** ~216 lines

---

## Key Flows

### 1. Keyboard Event Flow

```
User presses key
    ↓
main.ts: handleKeyDown()
    ↓
ShortcutManager: handleKeyDown()
    ↓
KeyboardListener: handleKeyDown()
    ↓
Returns KeyboardEventResult { action: "sequence", parsedKey: "ctrl+A" }
    ↓
ShortcutManager: processSequenceKey()
    ↓
SequenceMatcher: addKey("ctrl+A")
SequenceMatcher: findMatch(shortcuts)
    ↓
ShortcutExecutor: execute(matched)
    ↓
NotificationService: showShortcutExecuted()
```

### 2. Focus Change Flow

```
User focuses input
    ↓
DOM focus event (registered in main.ts)
    ↓
Workspace trigger: "shortcuts:input-focus-change"
    ↓
FocusHandler: onInputFocusChange()
    ↓
FocusStateManager: setInputFocus(element)
StatusBarManager: setActive(false)
    ↓
User presses Escape
    ↓
ShortcutManager: enterHotkeyMode()
    ↓
FocusStateManager: prepareForShortcutMode()
StatusBarManager: setActive(true)
```

### 3. Shortcut Matching Flow

```
Sequence: ["ctrl+A", "B"]
    ↓
SequenceMatcher formats as: "ctrl+a then b"
    ↓
Compare against all shortcuts:
  - "ctrl+a" → possible match (partial)
  - "ctrl+a then b" → exact match! ✓
  - "ctrl+a then c" → possible match (partial)
    ↓
NotificationService shows:
  - Current sequence: "ctrl+A then B"
  - Matches found: 3
  - Possible matches: [list]
    ↓
On exact match:
  - ShortcutExecutor executes action
  - SequenceMatcher resets
```

---

## Extension Guide

### Adding a New Shortcut Action Type

1. **Add type to `KeySequenceConfig`** (types/key.d.ts):
   ```typescript
   actionType: "FUNC" | "ID" | "ARIA" | "CUSTOM";
   ```

2. **Extend `ShortcutExecutor`** (core/executor/ShortcutExecutor.ts):
   ```typescript
   execute(config: KeySequenceConfig): void {
       switch (config.actionType) {
           case "CUSTOM":
               this.executeCustom(config);
               break;
           // ... existing cases
       }
   }

   private executeCustom(config: KeySequenceConfig): void {
       // Your custom execution logic
   }
   ```

3. **Update settings UI** (shortcutsSettingTab.ts) if needed

### Adding a New Focus Type

1. **Extend `FocusType`** (core/focus/FocusStateManager.ts):
   ```typescript
   export type FocusType = "editor" | "input" | "contenteditable" | "custom";
   ```

2. **Add methods to `FocusStateManager`**:
   ```typescript
   setCustomFocus(element: CustomElement): void {
       this.currentFocusState = {
           type: "custom",
           element: element,
       };
   }
   ```

3. **Add handler in `FocusHandler`**:
   ```typescript
   onCustomFocusChange(data: CustomFocusChangeData, ...): boolean {
       this.focusStateManager.setCustomFocus(data.element);
       // Handle mode changes
   }
   ```

4. **Trigger event** from appropriate location (main.ts or extensions)

### Adding a New Keyboard Action Type

1. **Extend `action` in `KeyboardEventResult`** (core/keyboard/KeyboardListener.ts):
   ```typescript
   action: "none" | "trigger" | "cancel" | "focus" | "sequence" | "custom";
   ```

2. **Add detection logic in `KeyboardListener.handleKeyDown()`**:
   ```typescript
   if (/* custom condition */) {
       return {
           shouldProcess: true,
           action: "custom",
           event,
       };
   }
   ```

3. **Handle action in `ShortcutManager.handleKeyDown()`**:
   ```typescript
   switch (result.action) {
       case "custom":
           this.handleCustomAction(event);
           break;
       // ... existing cases
   }
   ```

---

## Testing Guide

### Manual Testing Checklist

- [ ] **Basic Shortcuts:** Single keys (A, B, C)
- [ ] **Combo Shortcuts:** Ctrl+A, Shift+B
- [ ] **Sequence Shortcuts:** A then B, Ctrl+A then B
- [ ] **Trigger Key:** Escape toggles mode
- [ ] **Auto-shortcut Mode:** Auto-activate when leaving input
- [ ] **Focus Management:**
  - [ ] Editor focus → blur → shortcut mode
  - [ ] Input focus → blur → shortcut mode
  - [ ] Contenteditable focus → blur → shortcut mode
- [ ] **Status Bar:** Icon shows correct state
- [ ] **Notifications:**
  - [ ] Mode activation notice
  - [ ] Current sequence display
  - [ ] Execution confirmation
  - [ ] No match notice
- [ ] **Modal Handling:** Escape in modal doesn't trigger shortcuts
- [ ] **Settings:** All settings work correctly

### Unit Test Ideas (Future)

```typescript
// KeyParser
describe("KeyParser", () => {
    it("should parse ctrl+A correctly", () => {
        const event = createKeyEvent({ ctrlKey: true, key: "a" });
        expect(parser.parseKeyEvent(event)).toBe("ctrl+A");
    });

    it("should convert to macOS modifiers", () => {
        expect(parser.convertToMacModifier("meta+A")).toBe("command+A");
    });
});

// SequenceMatcher
describe("SequenceMatcher", () => {
    it("should match exact sequence", () => {
        matcher.addKey("ctrl+A");
        matcher.addKey("B");
        const result = matcher.findMatch(shortcuts);
        expect(result.matched).toBeDefined();
    });

    it("should find possible matches", () => {
        matcher.addKey("ctrl+A");
        const result = matcher.findMatch(shortcuts);
        expect(result.possibleMatches.length).toBeGreaterThan(0);
    });
});
```

---

## Backward Compatibility

### How It Works

The refactored code maintains 100% backward compatibility:

1. **Export Alias:** `hotkeyMonitor.ts` exports `ShortcutManager` as `HotkeyMonitor`
2. **Same Interface:** `ShortcutManager` implements all public methods of `HotkeyMonitor`
3. **Data Format:** Settings and sequence configuration unchanged
4. **Legacy Code:** Original `HotkeyMonitor` preserved in `hotkeyMonitor.legacy.ts`

### Migration Path

If you have custom code importing `HotkeyMonitor`:

**Before:**
```typescript
import { HotkeyMonitor } from "./hotkeyMonitor";
```

**After (recommended):**
```typescript
import { ShortcutManager } from "./core/ShortcutManager";
```

**Or keep using (compatibility):**
```typescript
import { HotkeyMonitor } from "./hotkeyMonitor"; // Works, but deprecated
```

---

## Performance Considerations

- **Module Initialization:** All modules initialized once at plugin load
- **Event Handling:** Keyboard events processed through single pipeline
- **Memory:** Stateless modules reduce memory overhead
- **Sequence Matching:** O(n) where n = number of shortcuts

---

## Code Quality

### Principles Applied

- **KISS (Keep It Simple):** Each module has one clear responsibility
- **DRY (Don't Repeat Yourself):** Unified focus management eliminates duplication
- **YAGNI (You Aren't Gonna Need It):** No over-engineering, only current needs
- **SOLID:**
  - **S**ingle Responsibility: Each class has one job
  - **O**pen/Closed: Extend via new executors, don't modify existing
  - **L**iskov Substitution: ShortcutManager can replace HotkeyMonitor
  - **I**nterface Segregation: Small, focused interfaces
  - **D**ependency Inversion: Depends on abstractions (interfaces)

### File Size Limits

- Maximum file size: **~470 lines** (ShortcutManager - the coordinator)
- Average file size: **~150 lines**
- Most modules: **< 200 lines**

---

## Contributing

When contributing to this plugin:

1. **Follow existing patterns:** Use existing modules as templates
2. **Add JSDoc comments:** All public methods need documentation
3. **Keep files small:** Split if approaching 250 lines
4. **Test thoroughly:** Use the manual testing checklist
5. **Update this doc:** Document any architectural changes

---

## Questions?

- **Architecture questions:** See this document
- **Bug reports:** GitHub Issues
- **Feature requests:** GitHub Discussions

---

*Last updated: 2025-01-24*
