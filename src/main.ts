import {
	Component,
	Editor,
	EditorPosition,
	MarkdownRenderer,
	Notice,
	Plugin,
	Modal,
	View,
	MenuItem,
	Keymap,
	setIcon,
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
import { around } from "monkey-around";
import ElementMonitor from "./surfing-key/element-monitor";

export default class ShortcutsPlugin extends Plugin {
	currentSequence: string[] = [];
	documentMonitor: ElementMonitor | null = null;

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
	modalOpened: boolean = false;

	private originalEscapeFunction:
		| ((evt: KeyboardEvent, ctx: any) => void)
		| null = null;

	async onload() {
		await this.loadSettings();

		this.settingTab = new ShortcutsSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		this.registerCustomCommands();

		this.app.workspace.onLayoutReady(() => {
			this.initHotkeyMonitor();
			this.patchOriginalEscapeScope();
			this.patchModalScope(this);
			this.initTooltipObserver(this);
			getAllSupportedShortcuts();
			this.checkFirstLoaded();
			this.patchSettingTab();
		});
	}

	unload() {
		super.unload();
		this.hotkeyMonitor?.unload();
		this.tooltipObserver?.unload();
		this.settingTab?.hide();
		this.removeChild(this.hotkeyMonitor);
		this.removeChild(this.tooltipObserver);
		this.restoreOriginalEscapeScope();
	}

	patchOriginalEscapeScope() {
		const scope = this.app.scope as any; // Type assertion to avoid TypeScript errors
		const originalEscapeIndex = scope.keys.findIndex(
			(key: any) => key.key === "Escape"
		);

		if (originalEscapeIndex !== -1) {
			this.originalEscapeFunction = scope.keys[originalEscapeIndex].func;

			const patchFunction = (evt: KeyboardEvent, ctx: any) => {
				if (
					evt.target instanceof HTMLInputElement ||
					evt.target instanceof HTMLTextAreaElement
				) {
					evt.target.blur();
					return;
				}
			};

			// Remove the original Escape key binding
			scope.keys.splice(originalEscapeIndex, 1);

			// Register the new patched Escape key binding
			scope.register([], "Escape", patchFunction);
		}
	}

	restoreOriginalEscapeScope() {
		if (this.originalEscapeFunction) {
			const scope = this.app.scope as any;
			// Remove the patched Escape key binding
			const patchedEscapeIndex = scope.keys.findIndex(
				(key: any) => key.key === "Escape"
			);
			if (patchedEscapeIndex !== -1) {
				scope.keys.splice(patchedEscapeIndex, 1);
			}
			// Restore the original Escape key binding
			scope.register([], "Escape", this.originalEscapeFunction);
			this.originalEscapeFunction = null;
		}
	}

	patchModalScope(plugin: ShortcutsPlugin) {
		this.register(
			around(Modal.prototype, {
				onOpen: (next) => {
					return function (...args: any[]) {
						plugin.modalOpened = true;
						return next.apply(this, args);
					};
				},
			})
		);
	}

	registerCustomCommands() {
		this.addCommand({
			id: "open-settings",
			name: "Open settings",
			callback: () => {
				// @ts-ignore
				this.app.setting.open();
				// @ts-ignore
				this.app.setting.openTabById("shortcuts");
			},
		});

		this.addCommand({
			id: "reload-first-loaded-tips",
			name: "Reload first loaded tips",
			callback: () => {
				this.settings.firstLoaded = true;
				this.saveSettings();
				this.checkFirstLoaded();
			},
		});

		this.addCommand({
			id: "surfing-key",
			name: "Surfing Key",
			callback: () => {
				if (!this.documentMonitor) {
					this.documentMonitor = new ElementMonitor(
						activeDocument,
						() => {
							this.documentMonitor = null;
						},
						this
					);
					this.documentMonitor.init();
				}
			},
		});
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

		const handleFocusEvent = (event: FocusEvent, focusing: boolean) => {
			const target = event.target as HTMLElement;
			if (target.closest(".cm-contentContainer")) {
				return;
			}

			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement &&
					event.target.isContentEditable)
			) {
				if (event.target instanceof HTMLElement) {
					this.app.workspace.trigger(
						"shortcuts:contenteditable-focus-change",
						{
							focusing,
							element: event.target,
						}
					);
				} else {
					this.app.workspace.trigger("shortcuts:input-focus-change", {
						focusing,
						input: event.target as
							| HTMLInputElement
							| HTMLTextAreaElement,
					});
				}
			}
		};

		this.registerDomEvent(
			document,
			"focusin",
			(event: FocusEvent) => handleFocusEvent(event, true),
			true
		);

		this.registerDomEvent(
			document,
			"focus",
			(event: FocusEvent) => handleFocusEvent(event, true),
			true
		);

		this.registerDomEvent(
			document,
			"blur",
			(event: FocusEvent) => handleFocusEvent(event, false),
			true
		);

		await this.saveSettings();
	}

	checkFirstLoaded() {
		if (!this.settings.firstLoaded) {
			return;
		}
		this.settings.firstLoaded = false;
		const fragment = new DocumentFragment();
		const container = fragment.createDiv({
			cls: "markdown-rendered",
		});
		MarkdownRenderer.render(
			this.app,
			` 
Congratulations! 🎉 **Shortcuts plugin** has been successfully loaded for the first time.
You are now able to activate commands using single keys \`A\`, combos \`A+B\`, and \`A then B+C then D\` sequences.
Shortcuts mode is activated at all times except when the editor or an input field is focused and this will be indicated by a newly added icon to your status bar.
Pressing the \`Escape\` key while focused will return you to Shortcuts mode, and pressing it again will take you back to the focused state.
Press \`x\` to continue to the Shortcuts plugin settings page where you can configure your own shortcuts.`,
			container,
			"",
			this
		);

		new Notice(fragment, 20000);
		this.saveSettings();
	}

	initTooltipObserver(plugin: ShortcutsPlugin) {
		this.tooltipObserver = new TooltipObserver(this);
		this.tooltipObserver.onload();
		this.addChild(this.tooltipObserver);

		this.register(
			around(View.prototype, {
				onTabMenu: (next) => {
					return function (...args: any[]) {
						const menu = args[0];
						menu.addItem((item: MenuItem) => {
							item.setTitle("Set shortcut").setIcon("scissors");
							item.onClick(() => {
								// @ts-ignore
								plugin.app.setting.open();
								// @ts-ignore
								plugin.app.setting.openTabById("shortcuts");
							});
						});
						return next.apply(this, args);
					};
				},
			})
		);
	}

	patchSettingTab() {
		const setting = (this.app as any).setting;
		const prototype = Object.getPrototypeOf(setting);

		const uninstaller = around(prototype, {
			onOpen: (next) => {
				return function (this: {
					pluginTabs: Array<{ id: string; navEl: HTMLElement }>;
				}) {
					console.log(this);
					const tab = this.pluginTabs.find((pluginTab) => {
						return pluginTab.id === "shortcuts";
					});
					if (tab) {
						(tab.navEl as HTMLElement).dataset.pluginId =
							"shortcuts";

						tab.navEl.createEl(
							"span",
							{
								cls: "shortcuts-logo",
							},
							(el) => {
								setIcon(el, "scissors");
							}
						);
					}
					const result = next.call(this);
					return result;
				};
			},
		});
		this.register(uninstaller);
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
