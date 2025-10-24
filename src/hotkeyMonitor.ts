/**
 * Backward Compatibility Layer
 *
 * This file provides backward compatibility by exporting ShortcutManager as HotkeyMonitor.
 * The original HotkeyMonitor implementation has been moved to hotkeyMonitor.legacy.ts.
 *
 * This allows existing code that imports HotkeyMonitor to continue working
 * without changes, while using the new modular architecture under the hood.
 *
 * @deprecated Import ShortcutManager directly from './core/ShortcutManager' instead
 */
export { ShortcutManager as HotkeyMonitor } from "./core/ShortcutManager";
