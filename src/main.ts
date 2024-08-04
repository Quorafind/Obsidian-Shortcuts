import { App, Editor, EditorPosition, Plugin, PluginSettingTab, SearchComponent, Setting } from 'obsidian';
import { AVAILABLE_CONFIGS, keyConfigs, KeySequenceConfigClass } from "./keySequence";
import { Action, AvailableScope, CommandId, KeySequenceConfig, KeySequenceScope } from "./types/key";
import { KeySequenceSettings } from "./types/settings";
import { HotkeyMonitor } from "./hotkeyMonitor";

const HEADER_ARRAY: AvailableScope[] = ['General', 'Canvas', 'Daily notes', 'Graph', 'Editor'];
const HEADER_MAP: Record<AvailableScope, string> = {
	'General': 'General',
	'Canvas': 'Canvas',
	'Daily notes': 'Daily notes',
	'Graph': 'Graph',
	'Editor': 'Editor'
};

const DEFAULT_KEY_SEQUENCE_SETTINGS: KeySequenceSettings = {
	sequences: [
		{
			scope: 'General',
			configs: AVAILABLE_CONFIGS,
		}
	]
};

export default class ShortcutsPlugin extends Plugin {
	currentSequence: string[] = [];
	sequenceTimer: number | null = null;

	hotkeyMode: boolean = false;

	input: HTMLInputElement | HTMLTextAreaElement | null = null;
	lastActiveElementType: 'editor' | 'input' = 'editor';
	editor: Editor | null = null;
	pos: EditorPosition | null = null;

	settings: KeySequenceSettings;

	private hotkeyMonitor: HotkeyMonitor;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ShortcutsSettingTab(this.app, this));

		this.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
			if (this.isInputOrEditor(e)) {
				if (e.key === 'Escape' && this.isTargetInCodeMirror(e)) {
					this.handleEscapeOnEditor();
				} else {
					this.prepareForInput(e);
				}
				return;
			}

			if (e.key === 'i') {
				this.handleFocusMode(e);
			}

			if (!this.hotkeyMode) {
				return;
			}


			clearTimeout(this.sequenceTimer as number);
			this.sequenceTimer = window.setTimeout(() => this.resetSequence(), 5000); // 5秒内完成序列

			this.currentSequence.push(e.key);
			this.checkSequence();
		});
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
			this.hotkeyMode = true;
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

	checkSequence(): void {
		if (this.currentSequence.length === 1) {
			const singleKeyConfig = keyConfigs.find((config: KeySequenceConfig) => {
				return config.sequence.length === 1 && config.sequence[0] === this.currentSequence[0];
			});
			if (singleKeyConfig) {
				this.executeAction(singleKeyConfig);
				this.resetSequence();
			}
		}

		for (const config of keyConfigs) {
			console.log(this.currentSequence.join(''), config.sequence.join(''));
			if (this.currentSequence.join('') === config.sequence.join('')) {
				this.executeAction(config);
				this.resetSequence();
				return;
			}
		}
	}

	executeAction(config: KeySequenceConfigClass): void {
		if (config.actionType === 'FUNC' && typeof config.action === 'function') {
			(config.action as Action)(this.app);
		} else if (config.actionType === 'ID') {
			this.app.commands.executeCommandById(config.action as CommandId);
		}
	}

	resetSequence(): void {
		clearTimeout(this.sequenceTimer as number);
		this.currentSequence = [];
	}

	onunload() {
		clearTimeout(this.sequenceTimer as number);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_KEY_SEQUENCE_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}


class ShortcutsSettingTab extends PluginSettingTab {
	plugin: ShortcutsPlugin;
	private commandId: string | null = null;
	private currentSequence: string[] = [];

	constructor(app: App, plugin: ShortcutsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Shortcuts Settings'});

		new Setting(containerEl)
			.setName('Add new shortcut')
			.setDesc('Click to add a new shortcut')
			.addButton(button => button
				.setButtonText('Add Shortcut')
				.onClick(() => this.addNewShortcut()));

		this.generateHotkeyList();
	}

	generateHotkeyList() {
		for (const header of HEADER_ARRAY) {
			new Setting(this.containerEl).setHeading().setName(HEADER_MAP[header]);
			const scope = this.plugin.settings.sequences.find((scope: KeySequenceScope) => scope.scope === header);
			const configs = scope?.configs;
			if (configs && configs.length > 0) {
				for (const config of configs) {
					this.createShortcutSetting(config, header);
				}
			}
		}
	}

	createShortcutSetting(config: KeySequenceConfig, scope: AvailableScope) {
		const setting = new Setting(this.containerEl)
			.setName(config.name || (typeof config.action === 'string' ? config.action : 'Custom action'))
			.addExtraButton(btn => {
				btn.setIcon('trash')
					.setTooltip('Delete')
					.onClick(() => this.deleteShortcut(config, scope));
			});

		setting.controlEl.createEl('div', {
			cls: 'setting-command-hotkeys',
		}, (el) => {
			const spanEl = el.createEl('span', {
				cls: ['setting-hotkey', this.commandId === config.id ? 'mod-active' : '']
			});
			this.commandId === config.id ? spanEl.setText('Press hotkey...') : spanEl.setText(config.sequence.join(' then '));
		});

		setting.addExtraButton((btn) => {
			btn.setIcon('plus')
				.setTooltip('Customize hotkey')
				.onClick(() => {
					this.commandId = config.id;
					this.currentSequence = [...config.sequence];
					this.display();
				});
			btn.extraSettingsEl.toggleClass('mod-active', this.commandId === config.id);
		});

		if (this.commandId === config.id) {
			this.createShortcutEditor(setting.controlEl, config, scope);
		}
	}

	createShortcutEditor(containerEl: HTMLElement, config: KeySequenceConfig, scope: AvailableScope) {
		const editorEl = containerEl.createEl('div', {cls: 'setting-command-hotkeys'});
		const inputEl = editorEl.createEl('input', {
			type: 'text',
			value: this.currentSequence.join(' then '),
			attr: {readonly: 'readonly'}
		});

		const instructionEl = editorEl.createEl('div', {
			text: 'Press keys for your shortcut. Use "then" for sequences.'
		});

		const saveButton = editorEl.createEl('button', {text: 'Save'});
		saveButton.onclick = () => this.saveShortcut(config, scope);

		this.plugin.registerDomEvent(inputEl, 'keydown', (event: KeyboardEvent) => {
			event.preventDefault();
			this.handleShortcutInput(event, inputEl);
		});
	}

	handleShortcutInput(event: KeyboardEvent, inputEl: HTMLInputElement) {
		const key = event.key;
		if (key === 'Backspace') {
			this.currentSequence.pop();
		} else if (key === 'Enter') {
			const config = this.findConfigById(this.commandId);
			if (config) {
				this.saveShortcut(config, this.findScopeByConfigId(this.commandId));
			}
		} else if (key !== 'Shift' && key !== 'Control' && key !== 'Alt' && key !== 'Meta') {
			let keyCombo = [];
			if (event.ctrlKey) keyCombo.push('Ctrl');
			if (event.altKey) keyCombo.push('Alt');
			if (event.shiftKey) keyCombo.push('Shift');
			if (event.metaKey) keyCombo.push('Meta');
			keyCombo.push(key);

			if (this.currentSequence.length > 0 && this.currentSequence[this.currentSequence.length - 1] !== 'then') {
				this.currentSequence.push('then');
			}
			this.currentSequence.push(keyCombo.join('+'));
		}

		inputEl.value = this.currentSequence.join(' ');
	}

	saveShortcut(config: KeySequenceConfig, scope: AvailableScope) {
		config.sequence = this.currentSequence;
		this.commandId = null;
		this.plugin.saveSettings();
		this.display();
	}

	addNewShortcut() {
		const newShortcut: KeySequenceConfig = {
			id: String(Date.now()),
			name: 'New Shortcut',
			sequence: [],
			action: '',
			actionType: 'ID'
		};
		const generalScope = this.plugin.settings.sequences.find(s => s.scope === 'General');
		if (generalScope) {
			generalScope.configs.push(newShortcut);
		} else {
			this.plugin.settings.sequences.push({
				scope: 'General',
				configs: [newShortcut]
			});
		}
		this.plugin.saveSettings();
		this.display();
	}

	deleteShortcut(config: KeySequenceConfig, scope: AvailableScope) {
		const scopeIndex = this.plugin.settings.sequences.findIndex(s => s.scope === scope);
		if (scopeIndex > -1) {
			const configIndex = this.plugin.settings.sequences[scopeIndex].configs.findIndex(c => c.id === config.id);
			if (configIndex > -1) {
				this.plugin.settings.sequences[scopeIndex].configs.splice(configIndex, 1);
				this.plugin.saveSettings();
				this.display();
			}
		}
	}

	findConfigById(id: string | null): KeySequenceConfig | undefined {
		for (const scope of this.plugin.settings.sequences) {
			const config = scope.configs.find(c => c.id === id);
			if (config) return config;
		}
		return undefined;
	}

	findScopeByConfigId(id: string | null): AvailableScope {
		for (const scope of this.plugin.settings.sequences) {
			if (scope.configs.some(c => c.id === id)) return scope.scope;
		}
		return 'General'; // Default to General if not found
	}
}
