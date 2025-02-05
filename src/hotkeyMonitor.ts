import { KeySequenceConfig } from "./types/key";
import {
	App,
	Component,
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
import { editorExt } from "./editor-ext";
import { SelectionRange } from "@codemirror/state";
import { TipsView } from "./tips-view";

const keycode = require("keycode");

type Action = (app: App) => void;
type CommandId = string;
type ActionType = "FUNC" | "ID";

export class HotkeyMonitor extends Component {
	private currentSequence: string[][] = [];
	private sequenceTimer: NodeJS.Timeout | null = null;
	private shortcuts: KeySequenceConfig[];
	private app: App;
	hotkeyMode: boolean = false;
	private lastActiveElementType: "editor" | "input" | "contenteditable" =
		"editor";
	private input: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null =
		null;
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

	private matchesNotice: Notice | null = null;

	constructor(
		plugin: ShortcutsPlugin,
		app: App,
		shortcuts: KeySequenceConfig[]
	) {
		super();
		this.initializeProperties(plugin, app, shortcuts);
		this.setupStatusBarItem();
		this.setupEventListeners();
	}

	private initializeProperties(
		plugin: ShortcutsPlugin,
		app: App,
		shortcuts: KeySequenceConfig[]
	) {
		this.app = app;
		this.shortcuts = shortcuts;
		this.plugin = plugin;
		this.plugin.registerEditorExtension(editorExt(app));
		this.triggerKey = this.plugin.settings.shortcutModeTrigger || "esc";
	}

	private setupStatusBarItem() {
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.statusBarItem.toggleClass(["shortcuts-status-item"], true);

		if (this.plugin.settings.autoShortcutMode) {
			this.statusBarItem.toggleClass("mod-active", true);
			setTooltip(this.statusBarItem, "Auto-shortcut mode enabled", {
				placement: "top",
			});
		}

		const statusBarButton = this.createStatusBarButton();
		this.setupStatusBarContextMenu(statusBarButton);
	}

	private createStatusBarButton(): ExtraButtonComponent {
		return new ExtraButtonComponent(this.statusBarItem)
			.setIcon("scissors")
			.onClick(() => {
				this.hotkeyMode = !this.hotkeyMode;
				this.statusBarItem.toggleClass("mod-active", this.hotkeyMode);
				if (this.hotkeyMode) {
					this.programaticallyEnterHotkeyMode();
				} else {
					this.cancelShortcuts();
				}
			});
	}

	private setupStatusBarContextMenu(statusBarButton: ExtraButtonComponent) {
		this.registerDomEvent(
			statusBarButton.extraSettingsEl,
			"contextmenu",
			(e) => {
				new TipsView(
					this.plugin,
					statusBarButton.extraSettingsEl
				).open();
			}
		);
	}

	private setupEventListeners() {
		this.setupEditorFocusChangeListener();
		this.setupInputFocusChangeListener();
		this.setupContentEditableFocusChangeListener();
	}

	private setupEditorFocusChangeListener() {
		this.plugin.registerEvent(
			this.app.workspace.on(
				"shortcuts:editor-focus-change",
				this.handleEditorFocusChange.bind(this)
			)
		);
	}

	private setupInputFocusChangeListener() {
		this.plugin.registerEvent(
			this.app.workspace.on(
				"shortcuts:input-focus-change",
				this.handleInputFocusChange.bind(this)
			)
		);
	}

	private setupContentEditableFocusChangeListener() {
		this.plugin.registerEvent(
			this.app.workspace.on(
				"shortcuts:contenteditable-focus-change",
				this.handleContentEditableFocusChange.bind(this)
			)
		);
	}

	private handleEditorFocusChange({
		focusing,
		editor,
		pos,
	}: {
		focusing: boolean;
		editor: Editor;
		pos: SelectionRange;
	}) {
		this.lastActiveElementType = "editor";
		this.editor = editor;
		this.pos = editor.offsetToPos(pos.from);

		if (focusing) {
			this.cancelShortcuts();
		}

		if (
			!this.plugin.settings.autoShortcutMode ||
			(this.hotkeyMode && !focusing)
		)
			return;

		if (!focusing) {
			this.programaticallyEnterHotkeyMode();
		} else {
			this.statusBarItem.toggleClass("mod-active", false);
		}
	}

	private handleInputFocusChange({
		focusing,
		input,
	}: {
		focusing: boolean;
		input: HTMLInputElement;
	}) {
		this.lastActiveElementType = "input";
		this.input = input;

		if (focusing) {
			this.cancelShortcuts();
		}

		if (
			!this.plugin.settings.autoShortcutMode ||
			(this.hotkeyMode && !focusing)
		)
			return;

		if (!focusing) {
			this.programaticallyEnterHotkeyMode();
		} else {
			this.statusBarItem.toggleClass("mod-active", false);
			this.handleEscapeOnEditor();
		}
	}

	private handleContentEditableFocusChange({
		focusing,
		element,
	}: {
		focusing: boolean;
		element: HTMLElement;
	}) {
		this.lastActiveElementType = "contenteditable";
		this.input = element;

		if (focusing) {
			this.cancelShortcuts();
			return;
		}

		if (
			!this.plugin.settings.autoShortcutMode ||
			(this.hotkeyMode && !focusing)
		)
			return;

		if (!focusing) {
			this.programaticallyEnterHotkeyMode();
		} else {
			this.statusBarItem.toggleClass("mod-active", false);
			this.handleEscapeOnEditor();
		}
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
		const currentKeyCode = keycode(event.keyCode);

		if (this.isTargetInInputOrContentEditable(event)) {
			this.app.workspace.trigger("shortcuts:input-focus-change", {
				focusing: true,
				input: this.input,
			});
			return;
		}
		if (this.shouldIgnoreKeyDown(event, currentKeyCode)) return;
		if (this.shouldIgnoreModalKeyDown()) return;
		if (this.handleAutoShortcutMode(event)) return;
		if (this.handleTriggerKey(event, currentKeyCode)) return;
		if (this.handleFocusModeKey(event)) return;

		if (!this.hotkeyMode) return;

		if (this.plugin.modalOpened && this.triggerKey === currentKeyCode)
			return;

		this.processKeyInHotkeyMode(event);
	}

	private shouldIgnoreKeyDownInInputOrContentEditable(
		event: KeyboardEvent,
		currentKeyCode: string
	): boolean {
		return (
			this.isInputOrEditorOrContentEditable(event) &&
			this.triggerKey !== currentKeyCode
		);
	}

	private shouldIgnoreKeyDown(
		event: KeyboardEvent,
		currentKeyCode: string
	): boolean {
		return (
			(this.plugin.capturing && !this.plugin.settings.autoShortcutMode) ||
			(this.isInputOrEditorOrContentEditable(event) &&
				!this.hotkeyMode &&
				this.triggerKey !== currentKeyCode)
		);
	}

	private shouldIgnoreModalKeyDown(): boolean {
		return (
			document.body.find(".modal-container") &&
			(this.plugin.settings.shortcutModeTrigger === "esc" ||
				!this.plugin.settings.shortcutModeTrigger)
		);
	}

	private handleAutoShortcutMode(event: KeyboardEvent): boolean {
		if (
			this.plugin.settings.autoShortcutMode &&
			this.hotkeyMode &&
			event.key === this.triggerKey
		) {
			this.cancelShortcuts(event);
			return true;
		}

		if (
			this.plugin.settings.autoShortcutMode &&
			!this.hotkeyMode &&
			event.key === this.triggerKey
		) {
			return this.enterHotkeyMode(event);
		}

		return false;
	}

	private handleTriggerKey(
		event: KeyboardEvent,
		currentKeyCode: string
	): boolean {
		if (
			this.plugin.modalOpened &&
			this.triggerKey === currentKeyCode &&
			this.triggerKey === "esc"
		) {
			this.plugin.modalOpened = false;
			return true;
		}
		if (this.triggerKey === currentKeyCode) {
			this.hotkeyMode
				? this.cancelShortcuts(event)
				: this.enterHotkeyMode(event);
			return true;
		}
		return false;
	}

	private handleFocusModeKey(event: KeyboardEvent): boolean {
		if (event.key === "i" && this.currentSequence.length === 0) {
			this.handleFocusMode(event);
			this.statusBarItem.toggleClass("mod-active", false);
			this.notice?.hide();
			this.notice = null;
			return true;
		}
		return false;
	}

	private processKeyInHotkeyMode(event: KeyboardEvent): void {
		this.resetSequenceTimer();

		const key = this.getKeyString(event);
		if (key) {
			this.updateCurrentSequence(key);
			this.checkAndExecuteShortcut(event);
		}
	}

	updateTriggerKey(): void {
		this.triggerKey = this.plugin.settings.shortcutModeTrigger || "esc";
	}

	convertToMacModifier(key: string): string {
		if (Platform.isMacOS) {
			return key.replace(/meta/g, "command").replace(/alt/g, "option");
		} else return key;
	}

	cancelShortcuts(event?: KeyboardEvent): void {
		if (event && !document.body.find(".modal-container")) {
			this.handleFocusMode(event);
		}
		this.hotkeyMode = false;
		this.statusBarItem.toggleClass("mod-active", false);
		this.resetSequence();
		this.notice?.hide();
		this.notice = null;
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

	programaticallyEnterHotkeyMode(): void {
		this.hotkeyMode = true;
		this.notice = this.plugin.settings.showShortcutActivatedNotice
			? new Notice("Starting shortcuts mode", 3000)
			: null;
		this.statusBarItem.toggleClass("mod-active", true);
	}

	enterHotkeyMode(event: KeyboardEvent): boolean {
		this.hotkeyMode = true;
		this.notice = this.plugin.settings.showShortcutActivatedNotice
			? new Notice("Starting shortcuts mode", 3000)
			: null;
		this.statusBarItem.toggleClass("mod-active", true);

		if (this.isInputOrEditorOrContentEditable(event)) {
			if (this.isTargetInCodeMirror(event)) {
				this.handleEscapeOnEditor();

				return true;
			} else {
				this.prepareForInput(event);
				return true;
			}
		}

		return false;
	}

	private updateMessage(
		message: string,
		matches: number,
		possibleMatches: KeySequenceConfig[]
	): void {
		const fragment = document.createDocumentFragment();
		fragment.createDiv({
			text: "Current sequence: " + this.convertToMacModifier(message),
		});
		fragment.createDiv({
			text: "Matches found: " + matches,
		});
		const possibleMatchesEl = fragment.createDiv({
			text: "Possible matches:",
		});
		possibleMatches.forEach((match) => {
			const matchEl = possibleMatchesEl.createDiv();
			matchEl.createSpan({
				text: this.convertToMacModifier(match.sequence.join(" ")),
				cls: "shortcut-key",
			});
			matchEl.createSpan({
				text: ` - ${match.name}`,
			});
		});

		if (!this.matchesNotice) {
			this.matchesNotice = new Notice(fragment, 0);
		} else {
			this.matchesNotice?.setMessage(fragment);
		}
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

	private checkAndExecuteShortcut(event: KeyboardEvent): void {
		const sequenceString = this.formatSequence(this.currentSequence);
		const matchedShortcut = this.shortcuts.find((shortcut) => {
			return this.formatSequence(shortcut.sequence) === sequenceString;
		});

		const possibleMatches = this.shortcuts.filter((shortcut) => {
			return this.formatSequence(shortcut.sequence).startsWith(
				sequenceString
			);
		});

		this.updateMessage(
			sequenceString,
			possibleMatches.length,
			possibleMatches
		);

		if (matchedShortcut) {
			event.preventDefault();
			event.stopPropagation();
			this.executeAction(matchedShortcut);
			this.resetSequence();
		} else if (this.hotkeyMode && possibleMatches.length === 0) {
			this.resetSequence();
			this.notice?.hide();
			this.matchesNotice?.hide();
			this.matchesNotice = new Notice(
				"No shortcut found for " + sequenceString,
				5000
			);
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

		setTimeout(() => {
			this.notice?.hide();
		}, 3000);
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

		this.plugin.settings.showShortcutActivatedNotice &&
			new Notice(fragment, 5000);

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

	private isInputOrEditorOrContentEditable(e: KeyboardEvent): boolean {
		return (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			this.isTargetInCodeMirror(e) ||
			(e.target instanceof HTMLElement && e.target.isContentEditable)
		);
	}

	private isTargetInInputOrContentEditable(e: KeyboardEvent): boolean {
		return (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			(e.target instanceof HTMLElement && e.target.isContentEditable)
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
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		) {
			this.lastActiveElementType = "input";
			this.input = e.target;
		} else if (
			e.target instanceof HTMLElement &&
			e.target.isContentEditable
		) {
			this.lastActiveElementType = "contenteditable";
			this.input = e.target;
		}
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
		} else if (
			(this.lastActiveElementType === "input" ||
				this.lastActiveElementType === "contenteditable") &&
			this.input &&
			document.body.contains(this.input)
		) {
			this.input?.focus();
		}
	}

	updateShortcuts(shortcuts: KeySequenceConfig[]): void {
		this.shortcuts = shortcuts;
	}
}
