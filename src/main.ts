import { Editor, EditorPosition, Plugin } from 'obsidian';
import { KeySequenceConfig } from "./types/key";
import { KeySequenceSettings } from "./types/settings";
import { HotkeyMonitor } from "./hotkeyMonitor";
import { DEFAULT_KEY_SEQUENCE_SETTINGS, ShortcutsSettingTab } from "./shortcutsSettingTab";

export default class ShortcutsPlugin extends Plugin {
	currentSequence: string[] = [];
	hotkeyMode: boolean = false;

	input: HTMLInputElement | HTMLTextAreaElement | null = null;
	lastActiveElementType: 'editor' | 'input' = 'editor';
	editor: Editor | null = null;
	pos: EditorPosition | null = null;

	settings: KeySequenceSettings;
	private hotkeyMonitor: HotkeyMonitor;

	capturing: boolean = false;

	async onload() {
		await this.loadSettings();
		const allConfigs: KeySequenceConfig[] = this.settings.sequences.flatMap(s => s.configs);

		this.hotkeyMonitor = new HotkeyMonitor(this, this.app, allConfigs);
		this.addSettingTab(new ShortcutsSettingTab(this.app, this));
		this.registerDomEvent(document, 'keydown', this.handleKeyDown.bind(this));
		this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
			this.hotkeyMonitor.handleKeyUp(event);
		});
	}

	handleKeyDown(event: KeyboardEvent) {
		this.hotkeyMonitor.handleKeyDown(event);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		const allConfigs: KeySequenceConfig[] = this.settings.sequences.flatMap(s => s.configs);
		this.hotkeyMonitor.updateShortcuts(allConfigs);
	}

	onunload() {
		this.hotkeyMonitor?.unload();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_KEY_SEQUENCE_SETTINGS, await this.loadData());
	}

}


