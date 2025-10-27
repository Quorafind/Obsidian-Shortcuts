<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/0f694cc2-1536-4a53-b13b-9fa31f04a967">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/459555bc-7a93-4c45-8b09-cbe303a9834a")
">
  <img alt="Shows project promo image in light and dark mode" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
</picture>

## Why use Shortcuts?

_Move faster in Obsidian with Shortcuts!_
Move around your vault without touching the mouse. The Shortcuts plugin lets you trigger any Obsidian command, custom action, or UI element by chaining single keys, modifier combos, or full key sequences. A scissors icon in the status bar shows when shortcuts are active and gives you quick access to your personal cheat sheet.


**Highlights**
- Create shortcuts such as `S`, `Ctrl+Shift+H`, or `A then B+C then D`
- Auto-enable shortcut mode when you leave an editor or input (optional)
- Surface context-aware shortcuts based on where you are in the app
- Display helpers, notifications, and surfing hints so you always know what will fire
- Stay productive on desktop or laptops without a full keyboard

> **Tip:** When shortcut mode is active the plugin listens to every key you press. It stops listening as soon as you focus an editor or standard input so that normal typing works as expected.

---

## Installation

1. Open Obsidian settings → *Community plugins* → *Browse*
2. Search for **“Shortcuts”** or install manually from the release ZIP
3. Enable the plugin and review the settings tab labelled **Shortcuts**
4. (Optional) Pin the scissors icon to your status bar for fast access

If you install from source, clone this repo inside your vault’s `.obsidian/plugins/` folder and run `npm install && npm run build`. Then enable it from Obsidian’s plugin list.

---

## Quick start

1. Click the scissors icon or press your configured trigger key (default `Esc`) to enter shortcut mode.
2. Start pressing keys. The plugin will display matching shortcuts and execute the first exact match.
3. Hit `Esc` again (or use the focus key `I`) to leave shortcut mode and return focus to the editor or input you were using.

Right-click the scissors icon at any time to see your active shortcut list and tips.

---

## Shortcut types

| Type | How it works | Example |
| --- | --- | --- |
| Single key | Press one key | `S` |
| Modified key | Combine with Ctrl/Alt/Shift/Meta | `Ctrl+Alt+L` |
| Simultaneous combo | Press several keys together | `J + K` |
| Hybrid sequence | Mix combos and singles in order | `Ctrl+K then V then Shift+Tab` |
| Surfing hint | Temporary key labels placed next to UI elements | `AA`, `SC`, etc. |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/24ebbd18-1064-40b5-b03a-212edc50f664">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/7e06eb8f-3175-4e5c-b788-5a1534e23ab3")
">
  <img alt="Shows project promo image in light and dark mode" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
</picture>

Sequences are evaluated left to right. For example, if you configure `Ctrl+J then P`, pressing `Ctrl+J`, releasing, then pressing `P` will run the mapped command.

---

## Everyday examples (You have to set it yourself)

- **Quick capture:** `Q` opens a Daily Note, `Q+S` inserts a timestamp, `Q+T` toggles a task. （Not yet implemented）
- **Navigation:** `G` then `1` jumps to your Inbox folder, `G` then `R` reopens the most recent note.
- **Editing:** `Ctrl+Shift+M` adds YAML metadata, `M` then `B` bolds the current selection.
- **Canvas/Surfing:** activate Surfing mode and press the on-screen pair such as `AD` to click complex UI elements without the mouse.
- **Workspace automation:** assign `W` then `1` to open Workspaces Plus layout or trigger third-party commands.

You can mix Obsidian core commands, community plugin commands, and custom functions provided by Shortcuts.

---

## Managing shortcuts

### Settings tab
- **Sequences:** Organize shortcuts by groups. Each entry supports multiple configs (combos, sequences, or surfing hints).
- **Trigger key:** Choose how you toggle shortcut mode. `Esc` is the default, but any key or combo works.
- **Timeout:** Control how long the plugin waits for the next key in a sequence (default 1200 ms).
- **Notifications:** Toggle “current sequence” popups or “shortcut executed” confirmations.
- **Auto shortcut mode:** Keep shortcut mode active whenever you are not typing in an editor or input field.

### Status bar indicator
- **Left-click:** Toggle shortcut mode on/off.
- **Right-click:** Open the Tips view showing current bindings, scopes, and usage hints.
- **Active state:** When lit, every key press is interpreted as part of a shortcut.

---

## Advanced capabilities

### Scoped shortcuts
Choose where a shortcut works: general, editor-only, UI elements, or custom scopes added by other plugins. This keeps editing shortcuts from firing in the wrong context.

### Surfing mode
Surfing overlays short key labels next to buttons and clickable elements. Type the label to “click” that target instantly—ideal for command palettes, tab headers, settings, or ribbon icons.

### Focus management
While in shortcut mode you can press `I` (or your configured focus key) to return to the previous editor/input without losing cursor position. Leaving shortcut mode automatically restores the last focus target.

---

## Recommended companion plugins

- [Floating Search](https://github.com/Quorafind/Obsidian-Float-Search) – summon search with a single shortcut.
- [Large Language Models](https://github.com/eharris128/Obsidian-LLM-Plugin) – bind prompts or AI helpers to quick keys.
- [Workspaces Plus](https://github.com/jsmorabito/obsidian-workspaces-plus) – switch entire layouts in one sequence.

---

## Troubleshooting

| Issue | Resolution |
| --- | --- |
| Shortcuts keep firing while I type | Disable auto-shortcut mode or choose a different trigger key. |
| Nothing happens when I press a sequence | Check the timeout value; long pauses reset the sequence. Also ensure no modal dialogs are open if `Esc` is the trigger key. |
| Surfing labels do not appear | Confirm surfing feature is enabled in settings and that the active view supports it. |
| I forgot what a shortcut does | Right-click the status bar scissors for the Tips view or review the Sequences list in settings. |

---

## Credits

- **Design:** [Johnny](https://github.com/jsmorabito)
- **Development:** [Boninall](https://github.com/Quorafind)
- Pixel-art scissors: [Pixilart](https://es.pixilart.com/art/rending-scissors-slash-51ea972a215c4f9)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/f05aca7d-9577-4b8c-a1f5-32f0bfffc9c3">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/ed44b0e7-c7c2-428f-ba64-a4be230c074e">
  <img alt="Shows project promo image in light and dark mode" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
</picture>
