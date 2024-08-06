import { KeySequenceConfig } from "./types/key";
import { App, Editor, EditorPosition, Notice } from "obsidian";
import ShortcutsPlugin from "./main";
import { AVAILABLE_CONFIGS } from "./keySequence";

type Action = (app: App) => void;
type CommandId = string;
type ActionType = 'FUNC' | 'ID';

export class HotkeyMonitor {
	private currentSequence: string[][] = [];
	private sequenceTimer: NodeJS.Timeout | null = null;
	private shortcuts: KeySequenceConfig[];
	private app: App;
	private hotkeyMode: boolean = false;
	private lastActiveElementType: 'editor' | 'input' = 'editor';
	private input: HTMLInputElement | HTMLTextAreaElement | null = null;
	private editor: Editor | null = null;
	private pos: EditorPosition | null = null;
	private readonly COMBO_THRESHOLD = 200; // milliseconds
	private lastKeyTime: number = 0;

	private plugin: ShortcutsPlugin;
	private statusBarItem: HTMLElement;

	private pressedModifiers: Set<string> = new Set();
	private readonly modifierKeyMap: { [key: string]: string } = {
		'Control': 'Ctrl',
		'Alt': 'Alt',
		'Shift': 'Shift',
		'Meta': 'Meta'
	};

	private notice: Notice | null = null;

	constructor(plugin: ShortcutsPlugin, app: App, shortcuts: KeySequenceConfig[]) {
		this.app = app;
		this.shortcuts = shortcuts;

		this.plugin = plugin;
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.statusBarItem.setText('Shortcuts disabled');
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

	handleKeyDown(event: KeyboardEvent): void {
		if (this.plugin.capturing) return;

		if (this.isInputOrEditor(event)) {
			if (event.key === 'Escape' && this.isTargetInCodeMirror(event)) {
				this.handleEscapeOnEditor();
			} else {
				this.prepareForInput(event);
				return;
			}
		}

		if (event.key === 'i') {
			this.handleFocusMode(event);
		}

		console.log(event.key, this.hotkeyMode, this.isInputOrEditor(event));

		if (event.key === 'Escape' && this.hotkeyMode) {
			this.hotkeyMode = false;
			this.statusBarItem.setText('Shortcuts disabled');
			this.resetSequence();
			this.notice?.hide();
		} else if (event.key === 'Escape' && !this.hotkeyMode) {
			this.hotkeyMode = true;
			this.notice = new Notice("Starting shortcuts mode", 0);
			this.statusBarItem.setText('Shortcuts enabled');
			return;
		}


		if (!this.hotkeyMode) {
			return;
		}

		this.resetSequenceTimer();

		const key = this.getKeyString(event);
		if (key) {  // Only update if key is not empty
			this.updateCurrentSequence(key);
			this.checkAndExecuteShortcut();
			if (this.notice) {
				const fragment = document.createDocumentFragment();
				fragment.createDiv({
					text: "Current sequence: " + this.formatSequence(this.currentSequence)
				});
				this.notice?.setMessage(fragment);
			}
		}
	}

	private updateMessage(message: string, matches: number): void {
		const fragment = document.createDocumentFragment();
		fragment.createDiv({
			text: "Current sequence: " + message
		});
		fragment.createDiv({
			text: "Matches found: " + matches
		});
		this.notice?.setMessage(fragment);
	}

	private getKeyString(event: KeyboardEvent): string {
		const modifiers: string[] = [];

		// Check for modifier keys
		if (event.ctrlKey) modifiers.push('Ctrl');
		if (event.altKey) modifiers.push('Alt');
		if (event.shiftKey) modifiers.push('Shift');
		if (event.metaKey) modifiers.push('Meta');

		let key = event.key;

		// Normalize modifier keys
		if (key in this.modifierKeyMap) {
			key = this.modifierKeyMap[key];
		}

		// Special cases
		if (key === ' ') key = 'Space';
		if (key.length === 1) key = key.toUpperCase();

		// If the key is already in modifiers, don't add it again
		if (!modifiers.includes(key)) {
			return modifiers.length > 0 ? [...modifiers, key].join('+') : key;
		} else {
			return modifiers.join('+');
		}
	}

	private updateCurrentSequence(key: string): void {
		const now = Date.now();
		if (this.currentSequence.length === 0 || now - this.lastKeyTime > this.COMBO_THRESHOLD) {
			this.currentSequence.push([key]);
		} else {
			const lastCombo = this.currentSequence[this.currentSequence.length - 1];
			const lastKey = lastCombo[lastCombo.length - 1];

			// If the new key is just a modifier and it's already in the last combo, don't add it
			if (Object.values(this.modifierKeyMap).includes(key) && lastKey.includes(key)) {
				return;
			}

			// If the last key was a single modifier, replace it with the new combo
			if (Object.values(this.modifierKeyMap).includes(lastKey) && key !== lastKey) {
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

		if (!event.ctrlKey) this.pressedModifiers.delete('Ctrl');
		if (!event.altKey) this.pressedModifiers.delete('Alt');
		if (!event.shiftKey) this.pressedModifiers.delete('Shift');
		if (!event.metaKey) this.pressedModifiers.delete('Meta');
	}

	// private updateCurrentSequence(key: string): void {
	// 	const now = Date.now();
	// 	if (this.currentSequence.length === 0 || now - this.lastKeyTime > this.COMBO_THRESHOLD) {
	// 		this.currentSequence.push([key]);
	// 	} else {
	// 		this.currentSequence[this.currentSequence.length - 1].push(key);
	// 	}
	//
	// 	console.log(this.currentSequence);
	//
	// 	this.lastKeyTime = now;
	// }

	private checkAndExecuteShortcut(): void {
		const sequenceString = this.formatSequence(this.currentSequence);
		const matchedShortcut = this.shortcuts.find(shortcut => {
				return this.formatSequence(shortcut.sequence) === sequenceString;
			}
		);

		const possibleMatches = this.shortcuts.filter(shortcut => {
			return this.formatSequence(shortcut.sequence).startsWith(sequenceString);
		});

		this.updateMessage(sequenceString, possibleMatches.length);

		if (matchedShortcut) {
			this.executeAction(matchedShortcut);
			this.resetSequence();
		}
	}

	private formatSequence(sequence: string[][]): string {
		return [...sequence].map(combo => combo.sort().join('+')).join(' then ').toLowerCase();
	}

	private executeAction(config: KeySequenceConfig): void {
		if (config.actionType === 'FUNC') {
			const realFunction = AVAILABLE_CONFIGS.find(c => c.id === config.id)?.action as Action;
			(realFunction as Action)(this.app);
		} else if (config.actionType === 'ID') {
			this.app.commands.executeCommandById(config.action as CommandId);
		}

		new Notice("Shortcut executed" + config.name);
		this.notice?.setMessage("Shortcut executed" + config.name);

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
		return e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			this.isTargetInCodeMirror(e);
	}

	private isTargetInCodeMirror(e: KeyboardEvent): boolean {
		return (e.target as HTMLElement).closest('.cm-scroller') !== null;
	}

	private handleEscapeOnEditor(): void {
		const editor = this.app.workspace.activeEditor;
		if (editor) {
			editor.editor?.blur();
			if (editor.editor) {
				this.editor = editor.editor;
			}
		}
	}

	private prepareForInput(e: KeyboardEvent): void {
		this.hotkeyMode = true;
		this.lastActiveElementType = 'input';
		this.input = e.target as HTMLInputElement | HTMLTextAreaElement;
	}

	private handleFocusMode(e: KeyboardEvent): void {
		if (!this.hotkeyMode) return;

		this.hotkeyMode = false;
		e.preventDefault();
		e.stopPropagation();
		if (this.lastActiveElementType === 'editor' && this.editor) {
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
