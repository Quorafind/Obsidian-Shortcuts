import { KeySequenceConfig } from "./types/key";
import {
	App,
	Editor,
	EditorPosition,
	ExtraButtonComponent,
	Notice,
	Platform,
	setIcon,
	setTooltip,
} from "obsidian";
import ShortcutsPlugin from "./main";
import { AVAILABLE_CONFIGS, updateKeySequences } from "./keySequence";

const keycode = require("keycode");

type Action = (app: App) => void;
type CommandId = string;
type ActionType = "FUNC" | "ID";

export class HotkeyMonitor {
	private currentSequence: string[][] = [];
	private sequenceTimer: NodeJS.Timeout | null = null;
	private shortcuts: KeySequenceConfig[];
	private app: App;
	private hotkeyMode: boolean = false;
	private lastActiveElementType: "editor" | "input" = "editor";
	private input: HTMLInputElement | HTMLTextAreaElement | null = null;
	private editor: Editor | null = null;
	private pos: EditorPosition | null = null;
	private readonly COMBO_THRESHOLD = 200; // milliseconds
	private lastKeyTime: number = 0;

	private plugin: ShortcutsPlugin;
	private statusBarItem: HTMLElement;

	private pressedModifiers: Set<string> = new Set();
	private readonly modifierKeyMap: { [key: string]: string } = {
		Control: "ctrl",
		Alt: "alt",
		Shift: "shift",
		Meta: "meta",
		Command: "meta",
	};

	private triggerKey: string;

	private notice: Notice | null = null;

	constructor(
		plugin: ShortcutsPlugin,
		app: App,
		shortcuts: KeySequenceConfig[]
	) {
		this.app = app;
		this.shortcuts = shortcuts;

		this.plugin = plugin;
		this.statusBarItem = this.plugin.addStatusBarItem();

		this.statusBarItem.toggleClass(["shortcuts-status-item"], true);
		new ExtraButtonComponent(this.statusBarItem)
			.setIcon("scissors")
			.onClick(() => {
				this.hotkeyMode = !this.hotkeyMode;
				this.statusBarItem.toggleClass("mod-active", this.hotkeyMode);
				this.cancelShortcuts();
			});

		this.triggerKey = this.plugin.settings.shortcutModeTrigger || "esc";
	}

	unload(): void {
		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
		}

		this.currentSequence = [];
		this.statusBarItem.detach();
		this.notice?.hide();
		this.notice = null;
		this.hotkeyMode = false;
	}

	updateTriggerKey(): void {
		this.triggerKey = this.plugin.settings.shortcutModeTrigger || "esc";
	}

	convertToMacModifier(key: string): string {
		if (Platform.isMacOS) {
			return key.replace(/meta/g, "command").replace(/alt/g, "option");
		} else return key;
	}

	cancelShortcuts(): void {
		this.hotkeyMode = false;
		this.statusBarItem.toggleClass("mod-active", false);
		this.resetSequence();
		this.notice?.hide();
	}

	handleKeyDown(event: KeyboardEvent): void {
		if (
			(this.plugin.capturing && !this.plugin.settings.autoShortcutMode) ||
			(this.isInputOrEditor(event) &&
				this.triggerKey !== keycode(event.keyCode))
		)
			return;
		if (
			document.body.find(".modal-container") &&
			(this.plugin.settings.shortcutModeTrigger === "esc" ||
				!this.plugin.settings.shortcutModeTrigger)
		)
			return;

		if (this.plugin.settings.autoShortcutMode && !this.hotkeyMode) {
			if (this.enterHotkeyMode(event)) {
				return;
			}
		} else if (this.triggerKey === keycode(event.keyCode)) {
			this.hotkeyMode
				? this.cancelShortcuts()
				: this.enterHotkeyMode(event);
			return;
		}

		if (event.key === "i" && this.currentSequence.length === 0) {
			this.handleFocusMode(event);
			this.statusBarItem.toggleClass("mod-active", false);
			this.notice?.hide();
		}

		if (!this.hotkeyMode) {
			return;
		}

		this.resetSequenceTimer();
		event.preventDefault();
		event.stopPropagation();

		const key = this.getKeyString(event);
		if (key) {
			this.updateCurrentSequence(key);
			this.checkAndExecuteShortcut();
		}
	}

	updateConfig() {
		this.plugin.settings.sequences = updateKeySequences(
			this.app,
			this.plugin.settings.sequences
		);
		this.shortcuts = this.plugin.settings.sequences.flatMap(
			(s) => s.configs
		);
		this.plugin.saveSettings();
	}

	private enterHotkeyMode(event: KeyboardEvent): boolean {
		this.hotkeyMode = true;
		this.notice = this.plugin.settings.showShortcutActivatedNotice
			? new Notice("Starting shortcuts mode", 0)
			: null;
		this.statusBarItem.toggleClass("mod-active", true);

		if (this.isInputOrEditor(event)) {
			if (this.isTargetInCodeMirror(event)) {
				this.handleEscapeOnEditor();

				return true;
			} else {
				this.prepareForInput(event);
			}
		}

		return false;
	}

	private updateMessage(message: string, matches: number): void {
		const fragment = document.createDocumentFragment();
		fragment.createDiv({
			text: "Current sequence: " + this.convertToMacModifier(message),
		});
		fragment.createDiv({
			text: "Matches found: " + matches,
		});
		this.notice?.setMessage(fragment);
	}

	private getKeyString(event: KeyboardEvent): string {
		const modifiers: string[] = [];

		// Check for modifier keys
		if (event.ctrlKey) modifiers.push("ctrl");
		if (event.altKey) modifiers.push("alt");
		if (event.shiftKey) modifiers.push("shift");
		if (event.metaKey) modifiers.push("meta");

		let key = event.key;

		// Normalize modifier keys
		if (key in this.modifierKeyMap) {
			key = this.modifierKeyMap[key];
		} else {
			key = keycode(event.keyCode);
		}

		if (key.length === 1) key = key.toUpperCase();

		// If the key is already in modifiers, don't add it again
		if (!modifiers.includes(key)) {
			return modifiers.length > 0 ? [...modifiers, key].join("+") : key;
		} else {
			return modifiers.join("+");
		}
	}

	private updateCurrentSequence(key: string): void {
		const now = Date.now();
		if (
			this.currentSequence.length === 0 ||
			now - this.lastKeyTime > this.COMBO_THRESHOLD
		) {
			this.currentSequence.push([key]);
		} else {
			const lastCombo =
				this.currentSequence[this.currentSequence.length - 1];
			const lastKey = lastCombo[lastCombo.length - 1];

			// If the new key is just a modifier and it's already in the last combo, don't add it
			if (
				Object.values(this.modifierKeyMap).includes(key) &&
				lastKey.includes(key)
			) {
				return;
			}

			// If the last key was a single modifier, replace it with the new combo
			if (
				Object.values(this.modifierKeyMap).includes(lastKey) &&
				key !== lastKey
			) {
				lastCombo[lastCombo.length - 1] = key;
			} else {
				lastCombo.push(key);
			}
		}

		this.lastKeyTime = now;
	}

	// Add a method to handle keyup events
	handleKeyUp(event: KeyboardEvent): void {
		let key = event.key;
		if (key in this.modifierKeyMap) {
			key = this.modifierKeyMap[key];
		}
		this.pressedModifiers.delete(key);

		if (!event.ctrlKey) this.pressedModifiers.delete("ctrl");
		if (!event.altKey) this.pressedModifiers.delete("alt");
		if (!event.shiftKey) this.pressedModifiers.delete("shift");
		if (!event.metaKey) this.pressedModifiers.delete("meta");
	}

	private checkAndExecuteShortcut(): void {
		const sequenceString = this.formatSequence(this.currentSequence);
		const matchedShortcut = this.shortcuts.find((shortcut) => {
			return this.formatSequence(shortcut.sequence) === sequenceString;
		});

		const possibleMatches = this.shortcuts.filter((shortcut) => {
			return this.formatSequence(shortcut.sequence).startsWith(
				sequenceString
			);
		});

		this.updateMessage(sequenceString, possibleMatches.length);

		if (matchedShortcut) {
			this.executeAction(matchedShortcut);
			this.resetSequence();
		}
	}

	private formatSequence(sequence: string[][]): string {
		return [...sequence]
			.map((combo) => combo.sort().join("+"))
			.join(" then ")
			.toLowerCase()
			.replace(/meta/g, "command")
			.replace(/alt/g, "option");
	}

	private executeAction(config: KeySequenceConfig): void {
		if (config.actionType === "FUNC") {
			const realFunction = AVAILABLE_CONFIGS.find(
				(c) => c.id === config.id
			)?.action as Action;
			(realFunction as Action)(this.app);
		} else if (config.actionType === "ID") {
			this.app.commands.executeCommandById(config.action as CommandId);
		} else if (config.actionType === "ARIA") {
			const element = document.body.find(`[aria-label="${config.id}"]`);
			if (element) {
				const { x, y } = element.getBoundingClientRect();
				const event = new MouseEvent("click", {
					clientX: x,
					clientY: y,
				});
				element.dispatchEvent(event);
			}
		}

		this.plugin.settings.showShortcutActivatedNotice &&
			new Notice("Shortcut executed: " + config.name);
		const fragment = document.createDocumentFragment();
		fragment.createDiv({
			text: "Previous shortcut executed: " + config.name,
		});
		fragment.createEl("br");
		fragment.createDiv({
			text: "Press Escape to exit shortcuts mode or continue typing to execute another shortcut.",
		});

		if (this.plugin.settings.autoShortcutMode) {
			this.notice?.hide();
			this.notice = new Notice(fragment);
		} else {
			this.notice?.setMessage(fragment);
		}

		this.resetSequence();
		this.resetSequenceTimer();
	}

	private resetSequence(): void {
		this.currentSequence = [];
		this.resetSequenceTimer();
	}

	private resetSequenceTimer(): void {
		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
		}
		this.sequenceTimer = setTimeout(() => this.resetSequence(), 5000);
	}

	private isInputOrEditor(e: KeyboardEvent): boolean {
		return (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			this.isTargetInCodeMirror(e)
		);
	}

	private isTargetInCodeMirror(e: KeyboardEvent): boolean {
		return (e.target as HTMLElement).closest(".cm-scroller") !== null;
	}

	private handleEscapeOnEditor(): void {
		const editor = this.app.workspace.activeEditor;
		if (editor) {
			editor.editor?.blur();
			if (editor.editor) {
				this.editor = editor.editor;
			}

			this.app.workspace.activeEditor = null;
		}
	}

	private prepareForInput(e: KeyboardEvent): void {
		this.hotkeyMode = true;
		this.lastActiveElementType = "input";
		this.input = e.target as HTMLInputElement | HTMLTextAreaElement;
	}

	private handleFocusMode(e: KeyboardEvent): void {
		if (!this.hotkeyMode) return;

		this.hotkeyMode = false;
		e.preventDefault();
		e.stopPropagation();
		if (this.lastActiveElementType === "editor" && this.editor) {
			this.editor.focus();
			if (this.pos) {
				this.editor.setSelection(this.pos);
			}
		} else if (document.contains(this.input as Node)) {
			this.input?.focus();
		}
	}

	updateShortcuts(shortcuts: KeySequenceConfig[]): void {
		this.shortcuts = shortcuts;
	}
}
