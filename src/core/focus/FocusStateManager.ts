import { App, Editor, EditorPosition } from "obsidian";

/**
 * Type of focused element
 */
export type FocusType = "editor" | "input" | "contenteditable";

/**
 * Focus state information
 */
export interface FocusState {
	/** Type of focused element */
	type: FocusType;
	/** The focused element (can be HTMLElement or Editor) */
	element: HTMLElement | Editor | null;
	/** Cursor position (for editor only) */
	position?: EditorPosition;
}

/**
 * FocusStateManager - Unified Focus State Management
 *
 * Responsibilities:
 * - Track current focus state (editor, input, or contenteditable)
 * - Store focus context (element reference and position)
 * - Restore focus when exiting shortcut mode
 * - Remove focus when entering shortcut mode
 *
 * Design:
 * - Eliminates duplicate focus tracking code
 * - Unified interface for all focus types
 * - Simplified focus restoration logic
 *
 * @example
 * const manager = new FocusStateManager(app);
 * manager.setEditorFocus(editor, pos);
 * // Later...
 * manager.restoreFocus(); // Returns to the editor at saved position
 */
export class FocusStateManager {
	private currentFocusState: FocusState;
	private app: App;

	constructor(app: App) {
		this.app = app;
		this.currentFocusState = {
			type: "editor",
			element: null,
			position: undefined,
		};
	}

	/**
	 * Set editor focus state
	 *
	 * @param editor - Editor instance
	 * @param pos - Cursor position
	 */
	setEditorFocus(editor: Editor, pos: EditorPosition): void {
		this.currentFocusState = {
			type: "editor",
			element: editor,
			position: pos,
		};
	}

	/**
	 * Set input element focus state
	 *
	 * @param input - Input or textarea element
	 */
	setInputFocus(input: HTMLInputElement | HTMLTextAreaElement): void {
		this.currentFocusState = {
			type: "input",
			element: input,
			position: undefined,
		};
	}

	/**
	 * Set contenteditable element focus state
	 *
	 * @param element - Contenteditable HTML element
	 */
	setContentEditableFocus(element: HTMLElement): void {
		this.currentFocusState = {
			type: "contenteditable",
			element: element,
			position: undefined,
		};
	}

	/**
	 * Get current focus state
	 *
	 * @returns Current focus state
	 */
	getCurrentFocus(): FocusState {
		return { ...this.currentFocusState };
	}

	/**
	 * Get the type of currently focused element
	 *
	 * @returns Focus type
	 */
	getCurrentFocusType(): FocusType {
		return this.currentFocusState.type;
	}

	/**
	 * Restore focus to the previously focused element
	 *
	 * Handles three cases:
	 * - Editor: Restores focus and cursor position
	 * - Input: Restores focus to input/textarea
	 * - Contenteditable: Restores focus to contenteditable element
	 */
	restoreFocus(): void {
		const { type, element, position } = this.currentFocusState;

		switch (type) {
			case "editor":
				this.restoreEditorFocus(element as Editor, position);
				break;

			case "input":
			case "contenteditable":
				this.restoreInputFocus(element as HTMLElement);
				break;
		}
	}

	/**
	 * Remove focus from current element (blur)
	 */
	blurCurrent(): void {
		const { type, element } = this.currentFocusState;

		if (type === "editor") {
			const editor = this.app.workspace.activeEditor;
			if (editor?.editor) {
				editor.editor.blur();
				this.app.workspace.activeEditor = null;
			}
		} else if (element instanceof HTMLElement) {
			element.blur();
		}
	}

	/**
	 * Prepare for entering shortcut mode from current focus
	 *
	 * @param event - Keyboard event that triggered the mode entry
	 */
	prepareForShortcutMode(event: KeyboardEvent): void {
		// Determine focus type from event target
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
			this.setInputFocus(event.target);
		} else if (
			event.target instanceof HTMLElement &&
			event.target.isContentEditable
		) {
			this.setContentEditableFocus(event.target);
		}
	}

	/**
	 * Restore editor focus and cursor position
	 *
	 * @param editor - Editor instance
	 * @param position - Cursor position
	 */
	private restoreEditorFocus(
		editor: Editor | null,
		position: EditorPosition | undefined
	): void {
		if (editor) {
			editor.focus();
			if (position) {
				editor.setSelection(position);
			}
		}
	}

	/**
	 * Restore focus to input or contenteditable element
	 *
	 * Only restores if the element still exists in the document
	 *
	 * @param element - HTML element
	 */
	private restoreInputFocus(element: HTMLElement | null): void {
		if (element && document.body.contains(element)) {
			element.focus();
		}
	}

	/**
	 * Check if there is a valid focus state to restore
	 *
	 * @returns True if focus can be restored
	 */
	canRestoreFocus(): boolean {
		const { type, element } = this.currentFocusState;

		if (type === "editor") {
			return element !== null;
		}

		return element !== null && document.body.contains(element as HTMLElement);
	}
}
