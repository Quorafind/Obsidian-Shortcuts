import {
	Component,
	Editor,
	EditorPosition,
	MarkdownRenderer,
	Notice,
	Plugin,
	Modal,
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

export default class ShortcutsPlugin extends Plugin {
	currentSequence: string[] = [];

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
			this.initTooltipObserver();
			getAllSupportedShortcuts();
			this.checkFirstLoaded();
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

		this.registerDomEvent(document, "focus", (event: FocusEvent) => {
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
							focusing: true,
							element: event.target,
						}
					);
				} else {
					this.app.workspace.trigger("shortcuts:input-focus-change", {
						focusing: true,
						input: event.target as
							| HTMLInputElement
							| HTMLTextAreaElement,
					});
				}
			}
		}, true); // 添加 true 参数启用捕获阶段

		this.registerDomEvent(document, "blur", (event: FocusEvent) => {
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
							focusing: false,
							element: event.target,
						}
					);
				} else {
					this.app.workspace.trigger("shortcuts:input-focus-change", {
						focusing: false,
						input: event.target as
							| HTMLInputElement
							| HTMLTextAreaElement,
					});
				}
			}
		}, true); // 添加 true 参数启用捕获阶段

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
You can now **activate Shortcuts mode** at any time, but you might want to configure your desired shortcuts first.
To get started, press the \`Escape\` key in the top-left corner of your keyboard. This should trigger a new notice, and the Status bar icon in the bottom-right will light up.
Then, simply press \`X\` to navigate to the Shortcuts plugin settings page.
Remember, you can always press \`Escape\` again to exit Shortcuts mode.`,
			container,
			"",
			this
		);

		new Notice(fragment, 20000);
		this.saveSettings();
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
