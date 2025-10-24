import keycode from "keycode";
import ShortcutsPlugin from "../../main";
import { KeyParser } from "./KeyParser";

/**
 * Result of keyboard event processing
 */
export interface KeyboardEventResult {
	/** Whether the event should be processed for shortcuts */
	shouldProcess: boolean;
	/** Type of action to take */
	action:
		| "none" // Ignore the event
		| "trigger" // Toggle shortcut mode
		| "cancel" // Cancel shortcut mode
		| "focus" // Enter focus mode (key "i")
		| "sequence"; // Process as part of sequence
	/** Parsed key string if shouldProcess is true */
	parsedKey?: string;
	/** Original KeyboardEvent for reference */
	event: KeyboardEvent;
}

/**
 * KeyboardListener - Keyboard Event Handler
 *
 * Responsibilities:
 * - Listen to keyboard events (keydown/keyup)
 * - Determine if events should be processed
 * - Filter out events in input/editor/modal contexts
 * - Parse key events into standardized strings
 * - Track pressed modifier keys
 *
 * Decision Flow:
 * 1. Check if in input/editor/contenteditable
 * 2. Check if capturing or modal is open
 * 3. Check for trigger key
 * 4. Check for auto-shortcut mode
 * 5. Check for focus mode key ("i")
 * 6. Process as sequence key
 *
 * @example
 * const listener = new KeyboardListener(plugin, keyParser);
 * const result = listener.handleKeyDown(event);
 * if (result.shouldProcess && result.action === "sequence") {
 *   // Process the key in sequence
 * }
 */
export class KeyboardListener {
	private pressedModifiers: Set<string> = new Set();
	private plugin: ShortcutsPlugin;
	private keyParser: KeyParser;

	constructor(plugin: ShortcutsPlugin, keyParser: KeyParser) {
		this.plugin = plugin;
		this.keyParser = keyParser;
	}

	/**
	 * Handle keydown event
	 *
	 * @param event - Keyboard event
	 * @param hotkeyMode - Current shortcut mode state
	 * @param triggerKey - Configured trigger key
	 * @returns Event processing result
	 */
	handleKeyDown(
		event: KeyboardEvent,
		hotkeyMode: boolean,
		triggerKey: string
	): KeyboardEventResult {
		const currentKeyCode = keycode(event.keyCode);

		// Check if in input or contenteditable (not CodeMirror)
		if (this.isTargetInInputOrContentEditable(event)) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Ignore if capturing (and not in auto-shortcut mode)
		if (this.plugin.capturing && !this.plugin.settings.autoShortcutMode) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Ignore if in input/editor and not in hotkey mode (unless trigger key)
		if (
			this.isInputOrEditorOrContentEditable(event) &&
			!hotkeyMode &&
			triggerKey !== currentKeyCode
		) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Ignore if modal is open and trigger is "esc"
		if (this.shouldIgnoreModalKeyDown(triggerKey)) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Handle auto-shortcut mode toggle
		const autoShortcutResult = this.handleAutoShortcutMode(
			event,
			hotkeyMode,
			triggerKey
		);
		if (autoShortcutResult) {
			return autoShortcutResult;
		}

		// Handle trigger key
		const triggerResult = this.handleTriggerKey(
			event,
			hotkeyMode,
			currentKeyCode,
			triggerKey
		);
		if (triggerResult) {
			return triggerResult;
		}

		// Handle focus mode key ("i")
		if (hotkeyMode && event.key === "i") {
			return {
				shouldProcess: true,
				action: "focus",
				event,
			};
		}

		// Only process sequence keys if in hotkey mode
		if (!hotkeyMode) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Skip if modal is open and trigger is "esc"
		if (this.plugin.modalOpened && triggerKey === currentKeyCode) {
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Process as sequence key
		const parsedKey = this.keyParser.parseKeyEvent(event);
		if (parsedKey) {
			return {
				shouldProcess: true,
				action: "sequence",
				parsedKey,
				event,
			};
		}

		return {
			shouldProcess: false,
			action: "none",
			event,
		};
	}

	/**
	 * Handle keyup event
	 *
	 * Clears pressed modifier keys
	 *
	 * @param event - Keyboard event
	 */
	handleKeyUp(event: KeyboardEvent): void {
		let key = event.key;
		const modifierKeyMap: Record<string, string> = {
			Control: "ctrl",
			Alt: "alt",
			Shift: "shift",
			Meta: "meta",
			Command: "meta",
		};

		if (key in modifierKeyMap) {
			key = modifierKeyMap[key];
		}
		this.pressedModifiers.delete(key);

		// Clear modifier states based on event properties
		if (!event.ctrlKey) this.pressedModifiers.delete("ctrl");
		if (!event.altKey) this.pressedModifiers.delete("alt");
		if (!event.shiftKey) this.pressedModifiers.delete("shift");
		if (!event.metaKey) this.pressedModifiers.delete("meta");
	}

	/**
	 * Handle auto-shortcut mode toggle
	 *
	 * @param event - Keyboard event
	 * @param hotkeyMode - Current hotkey mode state
	 * @param triggerKey - Configured trigger key
	 * @returns Event result if handled, null otherwise
	 */
	private handleAutoShortcutMode(
		event: KeyboardEvent,
		hotkeyMode: boolean,
		triggerKey: string
	): KeyboardEventResult | null {
		if (!this.plugin.settings.autoShortcutMode) {
			return null;
		}

		if (hotkeyMode && event.key === triggerKey) {
			return {
				shouldProcess: true,
				action: "cancel",
				event,
			};
		}

		if (!hotkeyMode && event.key === triggerKey) {
			return {
				shouldProcess: true,
				action: "trigger",
				event,
			};
		}

		return null;
	}

	/**
	 * Handle trigger key press
	 *
	 * @param event - Keyboard event
	 * @param hotkeyMode - Current hotkey mode state
	 * @param currentKeyCode - Current key code
	 * @param triggerKey - Configured trigger key
	 * @returns Event result if handled, null otherwise
	 */
	private handleTriggerKey(
		event: KeyboardEvent,
		hotkeyMode: boolean,
		currentKeyCode: string,
		triggerKey: string
	): KeyboardEventResult | null {
		// Handle modal close with esc
		if (
			this.plugin.modalOpened &&
			triggerKey === currentKeyCode &&
			triggerKey === "esc"
		) {
			this.plugin.modalOpened = false;
			return {
				shouldProcess: false,
				action: "none",
				event,
			};
		}

		// Toggle hotkey mode
		if (triggerKey === currentKeyCode) {
			return {
				shouldProcess: true,
				action: hotkeyMode ? "cancel" : "trigger",
				event,
			};
		}

		return null;
	}

	/**
	 * Check if event should be ignored in modal
	 *
	 * @param triggerKey - Configured trigger key
	 * @returns True if should ignore
	 */
	private shouldIgnoreModalKeyDown(triggerKey: string): boolean {
		return (
			document.body.find(".modal-container") !== null &&
			(this.plugin.settings.shortcutModeTrigger === "esc" ||
				!this.plugin.settings.shortcutModeTrigger)
		);
	}

	/**
	 * Check if event target is in input or contenteditable (excluding CodeMirror)
	 *
	 * @param event - Keyboard event
	 * @returns True if in input or contenteditable
	 */
	private isTargetInInputOrContentEditable(
		event: KeyboardEvent
	): boolean {
		return (
			(event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement &&
					event.target.isContentEditable)) &&
			!this.isTargetInCodeMirror(event)
		);
	}

	/**
	 * Check if event target is in input, editor, or contenteditable
	 *
	 * @param event - Keyboard event
	 * @returns True if in input, editor, or contenteditable
	 */
	private isInputOrEditorOrContentEditable(event: KeyboardEvent): boolean {
		return (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			this.isTargetInCodeMirror(event) ||
			(event.target instanceof HTMLElement &&
				event.target.isContentEditable)
		);
	}

	/**
	 * Check if event target is in CodeMirror editor
	 *
	 * @param event - Keyboard event
	 * @returns True if in CodeMirror
	 */
	private isTargetInCodeMirror(event: KeyboardEvent): boolean {
		return (event.target as HTMLElement).closest(".cm-scroller") !== null;
	}
}
