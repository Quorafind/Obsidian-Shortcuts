import {
	Command,
	Component,
	Editor,
	EditorPosition,
	Plugin,
	setTooltip,
} from "obsidian";
import { KeySequenceConfig } from "./types/key";
import { KeySequenceSettings } from "./types/settings";
import { HotkeyMonitor } from "./hotkeyMonitor";
import {
	DEFAULT_KEY_SEQUENCE_SETTINGS,
	ShortcutsSettingTab,
} from "./shortcutsSettingTab";
import { updateKeySequences } from "./keySequence";
import { TooltipObserver } from "./tooltip";
import { getAllSupportedShortcuts } from "./utils";

export default class ShortcutsPlugin extends Plugin {
	currentSequence: string[] = [];
	hotkeyMode: boolean = false;

	input: HTMLInputElement | HTMLTextAreaElement | null = null;
	lastActiveElementType: "editor" | "input" = "editor";
	editor: Editor | null = null;
	pos: EditorPosition | null = null;

	settings: KeySequenceSettings;
	settingTab: ShortcutsSettingTab;
	hotkeyMonitor: HotkeyMonitor;
	tooltipObserver: TooltipObserver;

	konamiListener: Component;

	capturing: boolean = false;

	async onload() {
		await this.loadSettings();

		this.settingTab = new ShortcutsSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		this.app.workspace.onLayoutReady(() => {
			this.initHotkeyMonitor();
			this.initTooltipObserver();
			getAllSupportedShortcuts();
		});
	}

	unload() {
		super.unload();
		this.hotkeyMonitor?.unload();
		this.tooltipObserver?.unload();
		this.settingTab?.hide();
		this.removeChild(this.hotkeyMonitor);
		this.removeChild(this.tooltipObserver);
	}

	async initHotkeyMonitor() {
		this.settings.sequences = updateKeySequences(
			this.app,
			this.settings.sequences
		);

		const allConfigs: KeySequenceConfig[] = this.settings.sequences.flatMap(
			(s) => s.configs
		);
		this.hotkeyMonitor = new HotkeyMonitor(this, this.app, allConfigs);
		this.addChild(this.hotkeyMonitor);

		this.registerDomEvent(
			document,
			"keydown",
			this.handleKeyDown.bind(this)
		);
		this.registerDomEvent(document, "keyup", (event: KeyboardEvent) => {
			this.hotkeyMonitor.handleKeyUp(event);
		});

		this.registerDomEvent(document, "focusin", (event: FocusEvent) => {
			if (event.target instanceof HTMLInputElement) {
				this.app.workspace.trigger("shortcuts:input-focus-change", {
					focusing: true,
					input: event.target as HTMLInputElement,
				});
			}
		});

		this.registerDomEvent(document, "focusout", (event: FocusEvent) => {
			if (event.target instanceof HTMLInputElement) {
				this.app.workspace.trigger("shortcuts:input-focus-change", {
					focusing: false,
					input: event.target as HTMLInputElement,
				});
			}
		});

		await this.saveSettings();
	}

	initTooltipObserver() {
		this.tooltipObserver = new TooltipObserver(this);
		this.tooltipObserver.onload();
		this.addChild(this.tooltipObserver);
	}

	handleKeyDown(event: KeyboardEvent) {
		this.hotkeyMonitor.handleKeyDown(event);
	}

	clearAllListeners() {
		this.konamiListener?.unload();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		const allConfigs: KeySequenceConfig[] = this.settings.sequences.flatMap(
			(s) => s.configs
		);
		this.hotkeyMonitor.updateShortcuts(allConfigs);
		this.hotkeyMonitor.updateTriggerKey();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_KEY_SEQUENCE_SETTINGS,
			await this.loadData()
		);
	}
}
