import { App, Editor } from "obsidian";
import { SelectionRange } from "@codemirror/state";
import ShortcutsPlugin from "../../main";
import { FocusStateManager } from "./FocusStateManager";
import { StatusBarManager } from "../ui/StatusBarManager";

/**
 * Focus change event data interfaces
 */
export interface EditorFocusChangeData {
	focusing: boolean;
	editor: Editor;
	pos: SelectionRange;
}

export interface InputFocusChangeData {
	focusing: boolean;
	input: HTMLInputElement | HTMLTextAreaElement;
}

export interface ContentEditableFocusChangeData {
	focusing: boolean;
	element: HTMLElement;
}

/**
 * FocusHandler - Focus Event Handler
 *
 * Responsibilities:
 * - Handle focus change events from editor, input, and contenteditable elements
 * - Update focus state via FocusStateManager
 * - Manage shortcut mode state based on focus changes
 * - Update status bar based on auto-shortcut mode and focus state
 *
 * Integration:
 * - Works with FocusStateManager to track focus state
 * - Works with StatusBarManager to update UI
 * - Triggered by workspace events from editor-ext.ts and element-monitor.ts
 *
 * @example
 * const handler = new FocusHandler(app, plugin, focusStateManager, statusBarManager);
 * // Events are triggered from workspace:
 * workspace.trigger("shortcuts:editor-focus-change", data);
 */
export class FocusHandler {
	private app: App;
	private plugin: ShortcutsPlugin;
	private focusStateManager: FocusStateManager;
	private statusBarManager: StatusBarManager;

	constructor(
		app: App,
		plugin: ShortcutsPlugin,
		focusStateManager: FocusStateManager,
		statusBarManager: StatusBarManager
	) {
		this.app = app;
		this.plugin = plugin;
		this.focusStateManager = focusStateManager;
		this.statusBarManager = statusBarManager;
	}

	/**
	 * Handle editor focus change event
	 *
	 * @param data - Editor focus change data
	 * @param hotkeyMode - Current shortcut mode state
	 * @param cancelShortcuts - Callback to cancel shortcuts
	 * @param enterShortcutMode - Callback to enter shortcut mode
	 * @returns New hotkey mode state
	 */
	onEditorFocusChange(
		data: EditorFocusChangeData,
		hotkeyMode: boolean,
		cancelShortcuts: () => void,
		enterShortcutMode: () => void
	): boolean {
		const { focusing, editor, pos } = data;

		// Update focus state
		this.focusStateManager.setEditorFocus(
			editor,
			editor.offsetToPos(pos.from)
		);

		let nextHotkeyMode = hotkeyMode;

		// Cancel shortcuts if focusing
		if (focusing) {
			cancelShortcuts();
			nextHotkeyMode = false;
			return nextHotkeyMode;
		}

		// Handle auto-shortcut mode
		if (!this.plugin.settings.autoShortcutMode) {
			return nextHotkeyMode;
		}

		// If already in hotkey mode and focusing, do nothing
		if (nextHotkeyMode && focusing) {
			return nextHotkeyMode;
		}

		// Avoid re-entering when already active
		if (nextHotkeyMode && !focusing) {
			return nextHotkeyMode;
		}

		// Toggle shortcut mode based on focus
		if (!focusing) {
			enterShortcutMode();
			return true;
		} else {
			this.statusBarManager.setActive(false);
			return false;
		}
	}

	/**
	 * Handle input focus change event
	 *
	 * @param data - Input focus change data
	 * @param hotkeyMode - Current shortcut mode state
	 * @param cancelShortcuts - Callback to cancel shortcuts
	 * @param enterShortcutMode - Callback to enter shortcut mode
	 * @param blurEditor - Callback to blur editor
	 * @returns New hotkey mode state
	 */
	onInputFocusChange(
		data: InputFocusChangeData,
		hotkeyMode: boolean,
		cancelShortcuts: () => void,
		enterShortcutMode: () => void,
		blurEditor: () => void
	): boolean {
		const { focusing, input } = data;

		// Update focus state
		this.focusStateManager.setInputFocus(input);

		let nextHotkeyMode = hotkeyMode;

		// Cancel shortcuts if focusing
		if (focusing) {
			cancelShortcuts();
			nextHotkeyMode = false;
		}

		// Handle auto-shortcut mode
		if (!this.plugin.settings.autoShortcutMode) {
			return nextHotkeyMode;
		}

		// If already in hotkey mode and focusing, do nothing
		if (nextHotkeyMode && focusing) {
			return nextHotkeyMode;
		}

		// Avoid re-entering when already active
		if (nextHotkeyMode && !focusing) {
			return nextHotkeyMode;
		}

		// Toggle shortcut mode based on focus
		if (!focusing) {
			enterShortcutMode();
			return true;
		} else {
			this.statusBarManager.setActive(false);
			blurEditor();
			return false;
		}
	}

	/**
	 * Handle contenteditable focus change event
	 *
	 * @param data - Contenteditable focus change data
	 * @param hotkeyMode - Current shortcut mode state
	 * @param cancelShortcuts - Callback to cancel shortcuts
	 * @param enterShortcutMode - Callback to enter shortcut mode
	 * @param blurEditor - Callback to blur editor
	 * @returns New hotkey mode state
	 */
	onContentEditableFocusChange(
		data: ContentEditableFocusChangeData,
		hotkeyMode: boolean,
		cancelShortcuts: () => void,
		enterShortcutMode: () => void,
		blurEditor: () => void
	): boolean {
		const { focusing, element } = data;

		// Update focus state
		this.focusStateManager.setContentEditableFocus(element);

		let nextHotkeyMode = hotkeyMode;

		// Cancel shortcuts if focusing
		if (focusing) {
			cancelShortcuts();
			nextHotkeyMode = false;
		}

		// Handle auto-shortcut mode
		if (!this.plugin.settings.autoShortcutMode) {
			return nextHotkeyMode;
		}

		// If already in hotkey mode and focusing, do nothing
		if (nextHotkeyMode && focusing) {
			return nextHotkeyMode;
		}

		// Avoid re-entering when already active
		if (nextHotkeyMode && !focusing) {
			return nextHotkeyMode;
		}

		// Toggle shortcut mode based on focus
		if (!focusing) {
			enterShortcutMode();
			return true;
		} else {
			this.statusBarManager.setActive(false);
			blurEditor();
			return false;
		}
	}
}
