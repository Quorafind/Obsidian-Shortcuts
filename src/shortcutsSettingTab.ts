import {
	App,
	Component,
	ExtraButtonComponent,
	Menu,
	Modal,
	Notice,
	Platform,
	PluginSettingTab,
	prepareFuzzySearch,
	prepareSimpleSearch,
	SearchComponent,
	setIcon,
	Setting,
	setTooltip,
} from "obsidian";
import {
	AvailableScope,
	KeySequenceConfig,
	KeySequenceScope,
} from "./types/key";
import { KeySequenceSettings } from "./types/settings";
import { AVAILABLE_CONFIGS } from "./keySequence";
import ShortcutsPlugin from "./main";
import keycode from "keycode";
import confetti from "canvas-confetti";

const HEADER_ARRAY: AvailableScope[] = [
	"General",
	"Canvas",
	"Daily notes",
	"Graph",
	"Editor",
	"UI",
];
const HEADER_MAP: Record<AvailableScope, string> = {
	General: "General",
	Canvas: "Canvas",
	"Daily notes": "Daily notes",
	Graph: "Graph",
	Editor: "Editor",
	UI: "UI",
};
export const DEFAULT_KEY_SEQUENCE_SETTINGS: KeySequenceSettings = {
	sequences: [
		{
			scope: "General",
			configs: AVAILABLE_CONFIGS,
		},
	],
	shortcutModeTrigger: "esc",
	showKeyPressNotice: false,
	showShortcutActivatedNotice: false,
	keyboardLayout: "qwerty",
	autoShortcutMode: true,
	sequenceTimeoutDuration: 5000,
	showCurrentSequence: true,
	editorScopeEnabled: true,
	editorScopeTrigger: "Alt-s s",
	editorScopeShowBorder: true,
	firstLoaded: true,
};

interface CapturedKey {
	key: string;
	timestamp: number;
}

const modifierKeys = [16, 17, 18, 91, 93];

export class ShortcutsSettingTab extends PluginSettingTab {
	plugin: ShortcutsPlugin;
	private commandId: string | null = null;
	private currentSequence: string[][] = [];
	private searchComponent: SearchComponent;
	private filterStatus: "all" | "unassigned" | "assigned" = "all";
	private searchQuery: string = "";
	isCapturing: boolean = false;
	private capturedKeys: Set<number> = new Set();
	private lastKeyDownTime: number = 0;
	private filterContainer: HTMLElement | null = null;
	private hotkeyContainer: HTMLElement | null = null;
	private readonly COMBO_THRESHOLD = 200;

	private filteredConfigs: KeySequenceConfig[] = [];

	private innerComponent: Component | null = null;
	private konamiListener: Component | null = null;
	private showShortcutsDom: Setting | null = null;
	private showedCommands: number = 0;

	private tempFunc: any;

	constructor(app: App, plugin: ShortcutsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.toggleClass("shortcuts-setting-tab", true);

		this.plugin.hotkeyMonitor.updateConfig();

		this.filteredConfigs = this.filterAndSearchConfigs(
			this.plugin.settings.sequences[0].configs,
		);
		this.createGeneralSettings(containerEl);
		this.createEditorScopeSettings(containerEl);
		this.createSearchAndFilterComponents(containerEl);
		this.generateHotkeyList();
		this.createHr(containerEl);
		this.generateKonami(containerEl);
	}

	partDisplay(
		containerEl: HTMLElement,
		filterStatus: "all" | "unassigned" | "assigned",
	): void {
		containerEl.empty();
		this.containerEl = containerEl;

		containerEl.toggleClass("shortcuts-setting-tab", true);

		this.plugin.hotkeyMonitor.updateConfig();

		this.filteredConfigs = this.filterAndSearchConfigs(
			this.plugin.settings.sequences[0].configs,
		);

		// this.createGeneralSettings(containerEl);
		this.createSearchAndFilterComponents(containerEl);
		this.generateHotkeyList();

		this.filterStatus = filterStatus;
		this.updateFilterDisplay();
		this.generateHotkeyList();
	}

	partHide(containerEl: HTMLElement): void {
		this.plugin.capturing = false;
		if (this.innerComponent) {
			this.innerComponent.unload();
		}
		if (this.konamiListener) {
			this.konamiListener.unload();
		}
		this.currentSequence = [];
		this.commandId = null;
		this.searchQuery = "";
		this.filterStatus = "all";
		containerEl.empty();
	}

	hide(): void {
		this.plugin.capturing = false;
		if (this.innerComponent) {
			this.innerComponent.unload();
		}
		if (this.konamiListener) {
			this.konamiListener.unload();
		}
		this.currentSequence = [];
		this.commandId = null;
		this.searchQuery = "";
		this.filterStatus = "all";
	}

	createGeneralSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Auto-shortcuts mode")
			.setDesc(
				"Shortcuts mode is active at all times except when the editor or an input field is focused",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoShortcutMode)
					.onChange((value) => {
						this.plugin.settings.autoShortcutMode = value;
						this.plugin.saveSettings();
					});
			});

		const enterShortCutModeHotkeySetting = new Setting(containerEl)
			.setName("Enter shortcut mode")
			.setDesc("Press this key combination to enter shortcut mode");

		const hotkeyContainer =
			enterShortCutModeHotkeySetting.controlEl.createDiv({
				cls: "setting-command-hotkeys",
			});
		this.renderShortcutModeTrigger(hotkeyContainer);

		!this.plugin.settings.shortcutModeTrigger &&
			enterShortCutModeHotkeySetting.addExtraButton((btn) =>
				btn
					.setIcon("plus-circle")
					.setTooltip("Set shortcut mode trigger")
					.onClick(() => {
						this.captureShortcutModeTrigger(hotkeyContainer);
					}),
			);

		new Setting(containerEl)
			.setName("Show key press visualizer")
			.setDesc("Show the key presses on screen while in shortcut mode")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showKeyPressNotice)
					.onChange((value) => {
						this.plugin.settings.showKeyPressNotice = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Show shortcut activation signifier")
			.setDesc(
				"Show the toast notification that signals when a shortcut is activated",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showShortcutActivatedNotice)
					.onChange((value) => {
						this.plugin.settings.showShortcutActivatedNotice =
							value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Sequence timeout duration")
			.setDesc(
				"How long to wait (in milliseconds) before resetting the current key sequence",
			)
			.addSlider((slider) => {
				slider
					.setLimits(1000, 10000, 500)
					.setValue(this.plugin.settings.sequenceTimeoutDuration)
					.onChange((value) => {
						this.plugin.settings.sequenceTimeoutDuration = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Show current sequence")
			.setDesc(
				"Show the current key sequence and possible matches while typing",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showCurrentSequence)
					.onChange((value) => {
						this.plugin.settings.showCurrentSequence = value;
						this.plugin.saveSettings();
					});
			});

		// new Setting(containerEl).setName('Keyboard layout').setDesc('Select your keyboard layout').addDropdown((dropdown) => {
		// 	dropdown.addOption('qwerty', 'QWERTY');
		// 	dropdown.addOption('dvorak', 'Dvorak');
		// 	dropdown.addOption('colemak', 'Colemak');
		// 	dropdown.setValue(this.plugin.settings.keyboardLayout).onChange((value) => {
		// 		this.plugin.settings.keyboardLayout = value;
		// 		this.plugin.saveSettings();
		// 	});
		// });

		this.createHr(containerEl);
	}

	createEditorScopeSettings(containerEl: HTMLElement): void {
		// Add a heading for the editor scope mode section
		new Setting(containerEl).setName("Editor scope mode").setHeading();

		containerEl.createEl("p", {
			text: "Enable continuous shortcut execution in the editor without repeatedly pressing Esc. This allows you to trigger multiple shortcuts in sequence (for example Q, then Q+S, then Q+T) without leaving shortcut mode between commands.",
			cls: "setting-item-description",
		});

		// Toggle control for enabling the feature
		new Setting(containerEl)
			.setName("Enable editor scope mode")
			.setDesc(
				"Toggle this feature on or off. You'll need to reload Obsidian after changing this setting.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.editorScopeEnabled)
					.onChange(async (value) => {
						this.plugin.settings.editorScopeEnabled = value;
						await this.plugin.saveSettings();
						new Notice(
							"Please reload Obsidian for changes to take effect",
							4000,
						);
					});
			});

		// Trigger shortcut configuration
		new Setting(containerEl)
			.setName("Trigger shortcut")
			.setDesc(
				'Keyboard shortcut to toggle editor scope mode. Format: "Alt-s s" means press Alt+S, release, then press S again. You can also use single keys like "Alt-s" or "Ctrl-e".',
			)
			.addText((text) => {
				text.setPlaceholder("Alt-s s")
					.setValue(this.plugin.settings.editorScopeTrigger)
					.onChange(async (value) => {
						this.plugin.settings.editorScopeTrigger =
							value || "Alt-s s";
						await this.plugin.saveSettings();
						new Notice(
							"Please reload Obsidian for changes to take effect",
							4000,
						);
					});
			});

		// Visual feedback setting
		new Setting(containerEl)
			.setName("Show border decoration")
			.setDesc(
				"Display a colored border and indicator around the editor when scope mode is active, making it clear when the mode is enabled.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.editorScopeShowBorder)
					.onChange(async (value) => {
						this.plugin.settings.editorScopeShowBorder = value;
						await this.plugin.saveSettings();
					});
			});
	}



	createHr(containerEl: HTMLElement): void {
		const dividerEl = containerEl.createDiv(
			{ cls: "settings-divider" },
			(el) => {
				const iconEl = el.createSpan({ cls: "settings-divider-icon" });
				setIcon(iconEl, "scissors");
			},
		);
	}

	createSearchAndFilterComponents(containerEl: HTMLElement): void {
		this.showShortcutsDom = new Setting(containerEl)
			.setHeading()
			.setName("Search")
			.setDesc("Showing " + this.showedCommands + " shortcuts")
			.addExtraButton((btn) => {
				btn.setIcon("filter")
					.setTooltip("Filter")
					.onClick(() => {
						const menu = new Menu();
						menu.addItem((item) => {
							item.setTitle("All").onClick(() => {
								this.filterStatus = "all";
								this.updateFilterDisplay();
								this.generateHotkeyList();
							});
						});

						menu.addItem((item) => {
							item.setTitle("Unassigned").onClick(() => {
								this.filterStatus = "unassigned";
								this.updateFilterDisplay();
								this.generateHotkeyList();
							});
						});

						menu.addItem((item) => {
							item.setTitle("Assigned").onClick(() => {
								this.filterStatus = "assigned";
								this.updateFilterDisplay();
								this.generateHotkeyList();
							});
						});

						const btnRect =
							btn.extraSettingsEl.getBoundingClientRect();
						menu.showAtPosition({
							x: btnRect.left,
							y: btnRect.bottom,
						});
					});
			})
			.addSearch((searchComponent) => {
				this.searchComponent = searchComponent;
				searchComponent
					.setPlaceholder("Search shortcuts...")
					.onChange((value) => {
						this.searchQuery = value;
						this.updateFilterDisplay();
						this.generateHotkeyList();
					});
			});

		this.filterContainer = this.containerEl.createDiv({
			cls: "setting-filter-container",
		});
		this.hotkeyContainer = this.containerEl.createDiv({
			cls: "hotkey-list-container",
		});
	}

	updateSearchQuery(query: string): void {
		this.searchQuery = query;
		this.updateFilterDisplay();
		this.generateHotkeyList();
	}

	updateFilterDisplay(): void {
		if (!this.filterContainer) return;
		this.filterContainer.empty();

		if (this.filterStatus !== "all" || this.searchQuery) {
			const filterInner = this.filterContainer.createDiv({
				cls: "hotkey-filter",
			});
			filterInner.createDiv({
				cls: "hotkey-filter-inner",
				text: this.filterStatus,
			});
			const removeButton = filterInner.createDiv(
				{
					cls: "hotkey-filter-remove-button",
				},
				(el) => {
					new ExtraButtonComponent(el).setIcon("x").onClick(() => {
						this.filterStatus = "all";
						this.searchQuery = "";
						this.searchComponent.setValue("");
						this.updateFilterDisplay();
						this.generateHotkeyList();
					});
				},
			);
		}
	}

	generateHotkeyList(): void {
		if (!this.hotkeyContainer) return;
		this.hotkeyContainer.empty();

		this.showedCommands = 0;

		for (const header of HEADER_ARRAY) {
			const scope = this.plugin.settings.sequences.find(
				(scope: KeySequenceScope) => scope.scope === header,
			);
			const configs = scope?.configs;

			if (configs && configs.length > 0) {
				this.filteredConfigs = this.filterAndSearchConfigs(configs);
				this.showedCommands =
					this.showedCommands + this.filteredConfigs.length;
				if (this.filteredConfigs.length > 0) {
					const headSetting = new Setting(this.hotkeyContainer)
						.setHeading()
						.setName(HEADER_MAP[header]);

					const iconEl = createDiv("fold-indicator", (el) => {
						setIcon(el, "chevron-right");
					});

					headSetting.nameEl.prepend(iconEl);

					const childList: Setting[] = [];

					for (const config of this.filteredConfigs) {
						if (config.hide && config.actionType === "ARIA")
							continue;
						const childSetting = this.createShortcutSetting(
							this.hotkeyContainer,
							config,
							header,
						);
						childList.push(childSetting);
					}

					this.plugin.registerDomEvent(
						headSetting.nameEl,
						"click",
						() => {
							const isActive = iconEl.hasClass("mod-active");
							iconEl.toggleClass("mod-active", !isActive);
							childList.forEach((child) => {
								isActive
									? child.settingEl.show()
									: child.settingEl.hide();
							});
						},
					);
				}
			}
		}

		if (this.showShortcutsDom) {
			this.showShortcutsDom.setDesc(
				"Showing " + this.showedCommands + " shortcuts",
			);
		}
	}

	generateKonami(containerEl: HTMLElement): void {
		const konamiCode = [
			"ArrowUp",
			"ArrowUp",
			"ArrowDown",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"ArrowLeft",
			"ArrowRight",
			"b",
			"a",
		];
		let konamiIndex = 0;

		let comboEl: HTMLElement;
		let iconEl: HTMLElement;
		const container = containerEl.createDiv({
			cls: "special-thanks-container",
		});

		container.createDiv(
			{
				cls: "special-container",
			},
			(el) => {
				iconEl = el.createDiv({ cls: "special-icon" });
				setIcon(iconEl, "scissors");
				const nameEl = el.createDiv({
					cls: "special-name",
					text: "Shortcuts",
				});
				comboEl = el.createDiv({ cls: "special-combo" });
				this.createKonamiIcons(comboEl, konamiCode);
				const creditsEl = el.createDiv({
					cls: "special-credits",
					text: "by Johnny & Boninall",
				});
				const versionEl = el.createDiv({
					cls: "special-version",
					text: this.plugin.manifest.version,
				});
			},
		);

		this.plugin.clearAllListeners();
		this.plugin.konamiListener = new Component();

		this.plugin.konamiListener.registerDomEvent(
			document,
			"keydown",
			(event) => {
				if (this.isCapturing) return;

				if (
					event.key.toLowerCase() ===
					konamiCode[konamiIndex].toLowerCase()
				) {
					this.highlightKey(comboEl, konamiIndex);
					konamiIndex++;
					if (konamiIndex === konamiCode.length) {
						iconEl.toggleClass("mod-active", true);
						this.triggerConfetti();
						setTimeout(() => {
							window.open(
								"https://github.com/Quorafind/Obsidian-Shortcuts/wiki/Donate",
								"_blank",
							);
						}, 400);

						setTimeout(() => {
							this.resetKonamiHighlight(comboEl);
							iconEl.toggleClass("mod-active", false);
						}, 1000);
						konamiIndex = 0;
					}
				} else {
					this.resetKonamiHighlight(comboEl);
					konamiIndex = 0;
				}
			},
		);
		this.plugin.addChild(this.plugin.konamiListener);
	}

	createKonamiIcons(comboEl: HTMLElement, konamiCode: string[]): void {
		konamiCode.forEach((key) => {
			const span = comboEl.createSpan();
			switch (key) {
				case "ArrowUp":
					span.setText("\u2191");
					break;
				case "ArrowDown":
					span.setText("\u2193");
					break;
				case "ArrowLeft":
					span.setText("\u2190");
					break;
				case "ArrowRight":
					span.setText("\u2192");
					break;
				default:
					span.setText(key.toUpperCase());
			}
		});
	}

	highlightKey(comboEl: HTMLElement, index: number): void {
		const spans = comboEl.querySelectorAll("span");
		spans[index].toggleClass("mod-active", true);
	}

	resetKonamiHighlight(comboEl: HTMLElement): void {
		const spans = comboEl.querySelectorAll("span");
		spans.forEach((span) => span.toggleClass("mod-active", false));
	}

	triggerConfetti(): void {
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
		});
	}

	filterAndSearchConfigs(configs: KeySequenceConfig[]): KeySequenceConfig[] {
		let filteredConfigsTemp = configs;

		if (this.filterStatus === "unassigned") {
			filteredConfigsTemp = filteredConfigsTemp.filter(
				(config) => config.sequence.length === 0,
			);
		} else if (this.filterStatus === "assigned") {
			filteredConfigsTemp = filteredConfigsTemp.filter(
				(config) => config.sequence.length > 0,
			);
		}
		if (this.searchQuery) {
			const search =
				configs.length > 1000
					? prepareSimpleSearch(this.searchQuery)
					: prepareFuzzySearch(this.searchQuery);

			filteredConfigsTemp = filteredConfigsTemp.filter((config) => {
				return search(config.name) !== null;
			});
		}

		return filteredConfigsTemp.filter((i) => !i.hide);
	}

	createShortcutSetting(
		containerEl: HTMLElement,
		config: KeySequenceConfig,
		scope: AvailableScope,
	): Setting {
		const setting = new Setting(containerEl).setName(
			config.name ||
				(typeof config.action === "string"
					? config.action
					: "Custom action"),
		);

		const hotkeyContainer = setting.controlEl.createDiv({
			cls: "setting-command-hotkeys",
		});
		this.renderHotkeyStatus(hotkeyContainer, config);

		setting.addExtraButton((btn) =>
			btn
				.setIcon("plus-circle")
				.setTooltip("Add hotkey")
				.onClick(() => {
					this.commandId = config.id;
					this.currentSequence = [];
					this.renderHotkeyStatus(hotkeyContainer, config);
				}),
		);

		return setting;
	}

	renderHotkeyStatus(
		containerEl: HTMLElement | null,
		config: KeySequenceConfig | null,
	): void {
		if (!containerEl || !config) {
			console.warn(
				"Container element or config is null in renderHotkeyStatus",
			);
			return;
		}

		containerEl.empty();

		if (config.sequence.length > 0) {
			const hotkeySpan = containerEl.createSpan({
				cls: "setting-hotkey",
			});
			hotkeySpan.setText(this.formatSequence(config.sequence));

			const deleteButton = hotkeySpan.createSpan(
				{
					cls: "setting-hotkey-icon setting-delete-hotkey",
				},
				(el) => {
					new ExtraButtonComponent(el).setIcon("x").onClick(() => {
						config.sequence = [];
						this.plugin.saveSettings();
						this.renderHotkeyStatus(containerEl, config);
					});
				},
			);
		}

		if (this.commandId === config.id) {
			const activeSpan = containerEl.createSpan({
				cls: "setting-hotkey mod-active",
				text: "Press hotkey...",
			});
			const confirmButton = containerEl.createSpan(
				{
					cls: "setting-hotkey-icon setting-confirm-hotkey",
				},
				(el) => {
					new ExtraButtonComponent(el)
						.setIcon("check")
						.setTooltip("Finish capture")
						.onClick(() => {
							this.finishCapture(containerEl, config);
						});
				},
			);
			this.captureHotkey(activeSpan, config);
		} else if (config.sequence.length === 0) {
			containerEl.createSpan({
				cls: "setting-hotkey mod-empty",
				text: "Blank",
			});
		}
	}

	captureHotkey(element: HTMLElement, config: KeySequenceConfig): void {
		this.isCapturing = true;
		this.currentSequence = [];
		this.capturedKeys = new Set();
		this.lastKeyDownTime = 0;

		this.plugin.capturing = true;

		const pressedModifiers = new Set<number>();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!this.isCapturing) return;
			e.preventDefault();
			e.stopPropagation();

			const keyCode = e.keyCode;
			const now = Date.now();

			const isModifier = modifierKeys.includes(keyCode);

			if (isModifier) {
				pressedModifiers.add(keyCode);
			}

			if (
				!this.capturedKeys.has(keyCode) ||
				now - this.lastKeyDownTime > this.COMBO_THRESHOLD
			) {
				// Clear previous keys if it's a new combo
				if (now - this.lastKeyDownTime > this.COMBO_THRESHOLD) {
					this.capturedKeys.clear();
				}

				// Add all currently pressed modifiers
				for (const modifierKey of pressedModifiers) {
					this.capturedKeys.add(modifierKey);
				}

				// Add the current key
				this.capturedKeys.add(keyCode);

				this.updateCurrentSequence();
			}

			this.lastKeyDownTime = now;
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			const keyCode = e.keyCode;
			if (modifierKeys.includes(keyCode)) {
				pressedModifiers.delete(keyCode);
			}

			// If all keys are released, update the sequence
			if (
				this.capturedKeys.size > 0 &&
				pressedModifiers.size === 0 &&
				!modifierKeys.includes(keyCode)
			) {
				this.updateCurrentSequence();
				this.capturedKeys.clear();
			}
		};

		this.innerComponent = new Component();
		this.innerComponent.registerDomEvent(
			document,
			"keydown",
			handleKeyDown,
		);
		this.innerComponent.registerDomEvent(document, "keyup", handleKeyUp);

		this.innerComponent.register(() => {
			this.isCapturing = false;
		});
	}

	finishCapture(
		element: HTMLElement | null,
		config: KeySequenceConfig,
	): void {
		this.isCapturing = false;
		this.commandId = null;
		if (this.currentSequence.length > 0 && config) {
			config.sequence = this.currentSequence;
			this.plugin.saveSettings();
		}

		this.innerComponent?.unload();
		this.plugin.capturing = false;

		if (!element) {
			element = this.containerEl.querySelector(
				".setting-command-hotkeys",
			);
		}

		if (config && element) {
			this.renderHotkeyStatus(element, config);
		}
	}

	updateCurrentSequence(): void {
		// Shift, Ctrl, Alt, Meta (left), Meta (right)
		const combo = Array.from(this.capturedKeys)
			.sort((a, b) => {
				const aIsModifier = modifierKeys.includes(a);
				const bIsModifier = modifierKeys.includes(b);
				if (aIsModifier && !bIsModifier) return -1;
				if (!aIsModifier && bIsModifier) return 1;
				return a - b;
			})
			.map(this.getKeyStringFromCode)
			.join("+");

		if (combo) {
			if (
				this.currentSequence.length === 0 ||
				Date.now() - this.lastKeyDownTime > this.COMBO_THRESHOLD
			) {
				this.currentSequence.push([combo.toLowerCase()]);
			} else {
				this.currentSequence[this.currentSequence.length - 1] = [
					combo.toLowerCase(),
				];
			}
		}

		this.updateDisplay();
	}

	updateDisplay(): void {
		const activeSpan = this.containerEl.querySelector(
			".setting-hotkey.mod-active",
		);
		if (activeSpan) {
			activeSpan.setText(this.formatSequence(this.currentSequence));
		}
	}

	convertToMacModifier(key: string): string {
		if (Platform.isMacOS) {
			return key.replace("meta", "command").replace("alt", "option");
		} else return key;
	}

	formatSequence(sequence: string[][]): DocumentFragment {
		const fragment = document.createDocumentFragment();
		if (sequence.join(" then ") === " ") {
			fragment.createEl("span", { text: "Space", cls: "individual-key" });
			return fragment;
		}

		sequence.forEach((combo, index) => {
			const comboSpan = fragment.createEl("span", { cls: "key-combo" });

			combo.forEach((key, keyIndex) => {
				const keySpan = comboSpan.createEl("span", {
					text: this.convertToMacModifier(key),
					cls: "individual-key",
				});
				if (keyIndex < combo.length - 1) {
					comboSpan.createEl("span", {
						text: "+",
						cls: "key-separator",
					});
				}
			});

			if (index < sequence.length - 1) {
				fragment.createEl("span", {
					text: "then",
					cls: "combo-separator",
				});
			}
		});

		return fragment;
	}

	getKeyStringFromCode(keyCode: number): string {
		if (keyCode === 91 || keyCode === 93) return "meta";

		return keycode(keyCode);
	}

	renderShortcutModeTrigger(containerEl: HTMLElement): void {
		containerEl.empty();

		if (this.plugin.settings.shortcutModeTrigger) {
			const hotkeySpan = containerEl.createSpan({
				cls: "setting-hotkey",
			});
			hotkeySpan.setText(
				this.formatSequence([
					[this.plugin.settings.shortcutModeTrigger],
				]),
			);
			const deleteButton = hotkeySpan.createSpan(
				{
					cls: "setting-hotkey-icon setting-delete-hotkey",
				},
				(el) => {
					new ExtraButtonComponent(el).setIcon("x").onClick(() => {
						this.plugin.settings.shortcutModeTrigger = "";
						this.plugin.saveSettings();

						this.renderShortcutModeTrigger(containerEl);

						this.display();
					});
				},
			);
		}
	}

	captureShortcutModeTrigger(containerEl: HTMLElement): void {
		const activeSpan = containerEl.createSpan({
			cls: "setting-hotkey mod-active",
			text: "Press hotkey...",
		});
		const confirmButton = containerEl.createSpan(
			{
				cls: "setting-hotkey-icon setting-confirm-hotkey",
			},
			(el) => {
				new ExtraButtonComponent(el)
					.setIcon("check")
					.setTooltip("Finish capture")
					.onClick(() => {
						this.finishShortcutModeTriggerCapture(containerEl);

						this.display();
					});
			},
		);

		this.isCapturing = true;
		this.capturedKeys = new Set();
		this.lastKeyDownTime = 0;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!this.isCapturing) return;
			e.preventDefault();
			e.stopPropagation();

			const keyCode = e.keyCode;
			const now = Date.now();

			if (
				!this.capturedKeys.has(keyCode) ||
				now - this.lastKeyDownTime > this.COMBO_THRESHOLD
			) {
				this.capturedKeys.clear();
				this.capturedKeys.add(keyCode);
			}

			this.lastKeyDownTime = now;
			this.updateShortcutModeTriggerDisplay(activeSpan);
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (!this.isCapturing) return;

			if (this.capturedKeys.size > 0) {
				this.updateShortcutModeTriggerDisplay(activeSpan);
			}
		};

		this.innerComponent = new Component();
		containerEl.focus();
		// @ts-ignore
		this.tempFunc = this.setting.scope.keys[0].func;
		// @ts-ignore
		this.setting.scope.keys[0].func = () => {};
		this.innerComponent.registerDomEvent(
			document,
			"keydown",
			handleKeyDown,
		);
		this.innerComponent.registerDomEvent(document, "keyup", handleKeyUp);
	}

	updateShortcutModeTriggerDisplay(activeSpan: HTMLElement): void {
		const combo = Array.from(this.capturedKeys)
			.map(this.getKeyStringFromCode)
			.join("+");
		activeSpan.setText(combo);
	}

	finishShortcutModeTriggerCapture(containerEl: HTMLElement): void {
		this.isCapturing = false;
		const combo = Array.from(this.capturedKeys)
			.map(this.getKeyStringFromCode)
			.join("+");

		if (combo) {
			this.plugin.settings.shortcutModeTrigger = combo.toLowerCase();
			this.plugin.saveSettings();
		}

		this.innerComponent?.unload();
		this.renderShortcutModeTrigger(containerEl);

		// @ts-ignore
		this.setting.scope.keys[0].func = this.tempFunc;
	}
}

//
//
// class BlankModal extends Modal {
// 	handlers: {
// 		handleKeyDown: (e: KeyboardEvent) => void;
// 		handleKeyUp: (e: KeyboardEvent) => void;
// 	};
//
// 	constructor(
// 		app: App,
// 		readonly component: Component,
// 		handleKeyDown: (e: KeyboardEvent) => void,
// 		handleKeyUp: (e: KeyboardEvent) => void,
// 	) {
// 		super(app);
// 		this.handlers = {
// 			handleKeyDown,
// 			handleKeyUp
// 		};
// 	}
//
// 	onOpen(): void {
// 		this.modalEl.detach();
//
// 		this.removeExistingKeys();  // Call this method before registering new events
//
// 		this.component.registerDomEvent(this.containerEl, 'keydown', this.handlers.handleKeyDown);
// 		this.component.registerDomEvent(this.containerEl, 'keyup', this.handlers.handleKeyUp);
// 	}
//
// 	onClose() {
// 		this.containerEl.onkeydown = null;
// 		this.containerEl.onkeyup = null;
//
// 		super.onClose();
// 	}
//
// 	removeExistingKeys(): void {
// 		this.scope.keys.length = 0;
// 	}
// }

