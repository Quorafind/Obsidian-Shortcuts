import { EditorView, keymap } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { Notice } from "obsidian";
import ShortcutsPlugin from "../../main";
import { KeyParser } from "../keyboard/KeyParser";

/**
 * Controls the editor scope mode so shortcuts can run consecutively inside the
 * editor without leaving scope mode between commands.
 */
export class EditorScopeManager {
	private currentView: EditorView | null = null;
	private readonly keyParser = new KeyParser();
	private scopeActive = false;

	constructor(private plugin: ShortcutsPlugin) {}

	/**
	 * Create the CodeMirror extension that toggles scope mode and captures keys.
	 */
	createExtension(): Extension {
		if (!this.plugin.settings.editorScopeEnabled) {
			return [];
		}

		const triggerKey =
			this.plugin.settings.editorScopeTrigger?.trim() || "Alt-s s";

		return keymap.of([
			{
				key: triggerKey,
				run: (view) => {
					this.toggle(view);
					return true;
				},
			},
			{
				// `any` lets us observe every key while scope mode is active.
				any: (_view: EditorView, event: KeyboardEvent) => {
					if (!this.scopeActive) {
						return false;
					}

					if (this.isStandaloneModifier(event)) {
						return false;
					}

					event.preventDefault();
					event.stopPropagation();

					const key = this.keyParser.parseKeyEvent(event);
					this.plugin.hotkeyMonitor.executeEditorScopeShortcut(key);

					return true;
				},
			} as any,
		]);
	}

	private toggle(view: EditorView): void {
		this.currentView = view;
		this.scopeActive = !this.scopeActive;

		if (this.scopeActive) {
			this.activate(view);
		} else {
			this.deactivate(view);
		}
	}

	private activate(view: EditorView): void {
		this.plugin.hotkeyMonitor.resetEditorScopeSequence();

		if (this.plugin.settings.editorScopeShowBorder) {
			view.dom.classList.add("editor-scope-active");
		}

		new Notice("Editor shortcuts scope: Activated", 2000);
	}

	private deactivate(view: EditorView): void {
		this.plugin.hotkeyMonitor.resetEditorScopeSequence();

		view.dom.classList.remove("editor-scope-active");
		new Notice("Editor Scope: Deactivated", 2000);
	}

	private isStandaloneModifier(event: KeyboardEvent): boolean {
		const modifierKeys = ["Control", "Alt", "Shift", "Meta", "OS"];
		return modifierKeys.includes(event.key);
	}

	isActive(): boolean {
		return this.scopeActive;
	}

	destroy(): void {
		this.plugin.hotkeyMonitor.resetEditorScopeSequence();

		if (this.currentView) {
			this.currentView.dom.classList.remove("editor-scope-active");
			this.currentView = null;
		}
		this.scopeActive = false;
	}
}
