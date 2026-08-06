import { App, Component } from "obsidian";
import ShortcutsPlugin from "../main";
import { KeySequenceConfig } from "../types/key";
import { updateKeySequences } from "../keySequence";
import { editorExt } from "../editor-ext";

// Import sub-modules
import { KeyParser } from "./keyboard/KeyParser";
import { KeyboardListener } from "./keyboard/KeyboardListener";
import { SequenceMatcher } from "./keyboard/SequenceMatcher";
import { ShortcutExecutor } from "./executor/ShortcutExecutor";
import { StatusBarManager } from "./ui/StatusBarManager";
import { NotificationService } from "./ui/NotificationService";
import { FocusStateManager } from "./focus/FocusStateManager";
import { FocusHandler } from "./focus/FocusHandler";

/**
 * ShortcutManager - Facade Coordinator for Shortcut System
 *
 * Responsibilities:
 * - Coordinate all sub-modules (keyboard, focus, executor, UI)
 * - Manage shortcut mode state (hotkeyMode)
 * - Handle keyboard events and route to appropriate handlers
 * - Maintain backward compatibility with HotkeyMonitor interface
 *
 * Architecture (Facade Pattern):
 * - KeyParser: Parse keyboard events to key strings
 * - KeyboardListener: Filter and categorize keyboard events
 * - SequenceMatcher: Track and match key sequences
 * - ShortcutExecutor: Execute matched shortcuts
 * - NotificationService: Display user notifications
 * - StatusBarManager: Manage status bar UI
 * - FocusStateManager: Track focus state (editor/input/contenteditable)
 * - FocusHandler: Handle focus change events
 *
 * This class replaces the original HotkeyMonitor class while maintaining
 * the same public interface for backward compatibility.
 *
 * @example
 * const manager = new ShortcutManager(plugin, app, shortcuts);
 * manager.handleKeyDown(event);
 * manager.updateShortcuts(newShortcuts);
 * manager.unload();
 */
export class ShortcutManager extends Component {
	// Sub-modules
	private keyParser: KeyParser;
	private keyboardListener: KeyboardListener;
	private sequenceMatcher: SequenceMatcher;
	private editorScopeMatcher: SequenceMatcher;
	private shortcutExecutor: ShortcutExecutor;
	private statusBarManager: StatusBarManager;
	private notificationService: NotificationService;
	private focusStateManager: FocusStateManager;
	private focusHandler: FocusHandler;

	// Configuration
	private shortcuts: KeySequenceConfig[];
	private app: App;
	private plugin: ShortcutsPlugin;

	// State
	public hotkeyMode: boolean = false;
	private triggerKey: string;

	/**
	 * View types "disable editor auto-focus on open" intervenes on.
	 * "empty" is Obsidian's blank "New tab" view — everything else
	 * (graph, canvas, PDF, sidebar panes, ...) is left alone.
	 */
	private static readonly AUTO_FOCUS_RELEVANT_VIEW_TYPES = new Set([
		"markdown",
		"empty",
	]);
	private pendingAutoFocusTimeoutIds: number[] = [];

	constructor(
		plugin: ShortcutsPlugin,
		app: App,
		shortcuts: KeySequenceConfig[]
	) {
		super();
		this.app = app;
		this.shortcuts = shortcuts;
		this.plugin = plugin;
		this.triggerKey = plugin.settings.shortcutModeTrigger || "esc";

		// Initialize sub-modules
		this.initializeModules();

		// Setup event listeners
		this.setupEventListeners();
	}

	/**
	 * Initialize all sub-modules
	 */
	private initializeModules(): void {
		// Keyboard modules
		this.keyParser = new KeyParser();
		this.keyboardListener = new KeyboardListener(
			this.plugin,
			this.keyParser
		);
		this.sequenceMatcher = new SequenceMatcher(200); // 200ms combo threshold
		this.editorScopeMatcher = new SequenceMatcher(200);

		// Executor
		this.shortcutExecutor = new ShortcutExecutor(this.app);

		// UI modules
		this.statusBarManager = new StatusBarManager(this.plugin);
		this.notificationService = new NotificationService({
			showShortcutActivatedNotice:
				this.plugin.settings.showShortcutActivatedNotice,
			showCurrentSequence: this.plugin.settings.showCurrentSequence,
			sequenceTimeoutDuration:
				this.plugin.settings.sequenceTimeoutDuration,
		});

		// Focus modules
		this.focusStateManager = new FocusStateManager(this.app);
		this.focusHandler = new FocusHandler(
			this.app,
			this.plugin,
			this.focusStateManager,
			this.statusBarManager
		);

		// Initialize status bar
		this.statusBarManager.initialize();

		// Register editor extension
		this.plugin.registerEditorExtension(editorExt(this.app));

		// Trigger initial editor focus if applicable
		this.checkInitialFocus();
	}

	/**
	 * Check and trigger initial focus event
	 */
	private checkInitialFocus(): void {
		if (!this.plugin.settings.disableAutoFocusOnFileOpen) {
			const activeElement = document.activeElement;
			if (activeElement?.closest(".cm-contentContainer")) {
				this.app.workspace.trigger("shortcuts:editor-focus-change", {
					focusing: true,
					editor: null,
					pos: { from: 0, to: 0 },
				});
			}
			return;
		}

		if (this.shouldInterceptAutoFocus()) {
			this.scheduleAutoFocusInterception();
		}
	}

	/**
	 * Handles "disable editor auto-focus on open" for a file-open or
	 * active-leaf-change event.
	 */
	private onFileOpenOrLeafChange(): void {
		if (!this.shouldInterceptAutoFocus()) return;
		this.scheduleAutoFocusInterception();
	}

	/**
	 * Whether "disable editor auto-focus on open" should act right now:
	 * the setting is on, auto-shortcut mode is on (otherwise there'd be no
	 * way to re-enter shortcut mode after blurring, leaving the editor
	 * worse off than before), and the active leaf is one this feature
	 * actually applies to.
	 */
	private shouldInterceptAutoFocus(): boolean {
		return (
			this.plugin.settings.disableAutoFocusOnFileOpen &&
			this.plugin.settings.autoShortcutMode &&
			this.isAutoFocusRelevantLeaf()
		);
	}

	/**
	 * Whether the active leaf is a markdown editor or Obsidian's blank
	 * "New tab" placeholder — the only view types this feature should
	 * touch. Excludes graph/canvas/PDF/sidebar views, where forcing
	 * shortcut mode on every switch would be surprising and unrelated to
	 * "opening a file."
	 */
	private isAutoFocusRelevantLeaf(): boolean {
		const viewType = this.app.workspace.activeLeaf?.view?.getViewType();
		return (
			viewType !== undefined &&
			ShortcutManager.AUTO_FOCUS_RELEVANT_VIEW_TYPES.has(viewType)
		);
	}

	/**
	 * Blurs the editor if Obsidian has auto-focused it, then falls back to
	 * arming shortcut mode directly for the case nothing was ever focused
	 * (e.g. a blank "New tab"). Blurring flows through the same "blur" DOM
	 * event and FocusHandler cascade as every other focus-loss path in this
	 * class, so hotkeyMode ends up consistent through one code path rather
	 * than a second one bypassing it.
	 */
	private blurEditorIfAutoFocused(): void {
		if (document.activeElement?.closest(".cm-contentContainer")) {
			this.blurEditor();
		}
		this.enterHotkeyModeIfUnfocused();
	}

	/**
	 * Schedules blurEditorIfAutoFocused() immediately and again at a couple
	 * of short delays, to catch Obsidian's auto-focus whether it already
	 * happened or is about to happen asynchronously — without guessing from
	 * elapsed time. Clears any previously scheduled checks first, so
	 * file-open and active-leaf-change firing together for one navigation
	 * collapses into one set of timers instead of two independent ones.
	 */
	private scheduleAutoFocusInterception(): void {
		this.clearPendingAutoFocusChecks();
		this.blurEditorIfAutoFocused();
		this.pendingAutoFocusTimeoutIds.push(
			window.setTimeout(() => this.blurEditorIfAutoFocused(), 50),
			window.setTimeout(() => this.blurEditorIfAutoFocused(), 250)
		);
	}

	/**
	 * Cancels any pending auto-focus-interception timers.
	 */
	private clearPendingAutoFocusChecks(): void {
		this.pendingAutoFocusTimeoutIds.forEach((id) =>
			window.clearTimeout(id)
		);
		this.pendingAutoFocusTimeoutIds = [];
	}

	/**
	 * Explicitly enters shortcut mode when nothing legitimately holds
	 * keyboard focus (no input/textarea/contenteditable). Respects
	 * auto-shortcut mode, since that setting is what defines "shortcut mode
	 * is active whenever nothing else needs focus".
	 */
	private enterHotkeyModeIfUnfocused(): void {
		if (!this.plugin.settings.autoShortcutMode || this.hotkeyMode) return;

		const activeElement = document.activeElement;
		const hasLegitimateFocus =
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement ||
			(activeElement instanceof HTMLElement &&
				activeElement.isContentEditable);

		if (hasLegitimateFocus) return;

		this.programaticallyEnterHotkeyMode();
	}

	/**
	 * Setup event listeners for focus changes and status bar
	 */
	private setupEventListeners(): void {
		// Editor focus change
		this.plugin.registerEvent(
			this.app.workspace.on(
				"shortcuts:editor-focus-change",
				(data) => {
					this.hotkeyMode = this.focusHandler.onEditorFocusChange(
						data,
						this.hotkeyMode,
						() => this.cancelShortcuts(),
						() => this.programaticallyEnterHotkeyMode()
					);
				}
			)
		);

		// Input focus change
		this.plugin.registerEvent(
			this.app.workspace.on("shortcuts:input-focus-change", (data) => {
				this.hotkeyMode = this.focusHandler.onInputFocusChange(
					data,
					this.hotkeyMode,
					() => this.cancelShortcuts(),
					() => this.programaticallyEnterHotkeyMode(),
					() => this.blurEditor()
				);
			})
		);

		// Contenteditable focus change
		this.plugin.registerEvent(
			this.app.workspace.on(
				"shortcuts:contenteditable-focus-change",
				(data) => {
					this.hotkeyMode =
						this.focusHandler.onContentEditableFocusChange(
							data,
							this.hotkeyMode,
							() => this.cancelShortcuts(),
							() => this.programaticallyEnterHotkeyMode(),
							() => this.blurEditor()
						);
				}
			)
		);

		// Prevent editor auto-focus on file open (startup) / new tab, when enabled
		this.plugin.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.onFileOpenOrLeafChange();
			})
		);

		this.plugin.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.onFileOpenOrLeafChange();
			})
		);

		// Status bar click
		this.plugin.registerEvent(
			this.app.workspace.on("shortcuts:status-bar-click", () => {
				this.hotkeyMode = !this.hotkeyMode;
				this.statusBarManager.setActive(this.hotkeyMode);
				if (this.hotkeyMode) {
					this.programaticallyEnterHotkeyMode();
				} else {
					this.cancelShortcuts();
				}
			})
		);
	}

	/**
	 * Handle keydown event
	 *
	 * Main entry point for keyboard events
	 *
	 * @param event - Keyboard event
	 */
	handleKeyDown(event: KeyboardEvent): void {
		// Process the event through keyboard listener
		const result = this.keyboardListener.handleKeyDown(
			event,
			this.hotkeyMode,
			this.triggerKey
		);

		if (!result.shouldProcess) {
			return;
		}

		// Handle different action types
		switch (result.action) {
			case "trigger":
				this.enterHotkeyMode(event);
				break;

			case "cancel":
				this.cancelShortcuts(event);
				break;

			case "focus":
				if (this.sequenceMatcher.getCurrentSequence().length === 0) {
					this.restoreFocus(event);
				}
				break;

			case "sequence":
				this.processSequenceKey(event, result.parsedKey!);
				break;
		}
	}

	/**
	 * Handle keyup event
	 *
	 * @param event - Keyboard event
	 */
	handleKeyUp(event: KeyboardEvent): void {
		this.keyboardListener.handleKeyUp(event);
	}

	/**
	 * Process a key as part of a sequence
	 *
	 * @param event - Keyboard event
	 * @param parsedKey - Parsed key string
	 */
	private processSequenceKey(event: KeyboardEvent, parsedKey: string): void {
		// Add key to sequence
		this.sequenceMatcher.addKey(parsedKey);

		// Start/restart timeout timer
		this.sequenceMatcher.startTimer(
			this.plugin.settings.sequenceTimeoutDuration,
			() => {
				this.notificationService.hideAll();
			}
		);

		// Find matches
		const matchResult = this.sequenceMatcher.findMatch(this.shortcuts);
		const currentSequenceString =
			this.sequenceMatcher.getCurrentSequenceString();

		// Show current sequence if enabled
		if (this.plugin.settings.showCurrentSequence) {
			this.notificationService.showCurrentSequence(
				currentSequenceString,
				matchResult.possibleMatches.length,
				matchResult.possibleMatches
			);
		}

		// Execute matched shortcut
		if (matchResult.matched) {
			event.preventDefault();
			event.stopPropagation();
			this.executeShortcut(matchResult.matched);
		} else if (matchResult.possibleMatches.length === 0) {
			// No matches found
			this.sequenceMatcher.reset();
			this.notificationService.hideActivationNotice();
			if (this.plugin.settings.showCurrentSequence) {
				this.notificationService.showNoMatch(currentSequenceString);
			}
		}
	}

	/**
	 * Execute a matched shortcut
	 *
	 * @param config - Matched shortcut configuration
	 */
	private executeShortcut(config: KeySequenceConfig): void {
		// Execute the shortcut
		this.shortcutExecutor.execute(config);

		// Show notification
		this.notificationService.showShortcutExecuted(config.name);

		// Reset sequence
		this.sequenceMatcher.reset();
	}

	/**
	 * Enter shortcut mode (triggered by trigger key)
	 *
	 * @param event - Keyboard event
	 */
	private enterHotkeyMode(event: KeyboardEvent): void {
		this.hotkeyMode = true;
		this.notificationService.showShortcutModeActivated();
		this.statusBarManager.setActive(true);

		// If in input/editor, handle focus
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			event.target instanceof HTMLElement
		) {
			const isCodeMirror =
				(event.target).closest(".cm-scroller") !== null;

			if (isCodeMirror) {
				this.blurEditor();
			} else {
				this.focusStateManager.prepareForShortcutMode(event);
			}
		}
	}

	/**
	 * Enter shortcut mode programmatically (from auto-shortcut mode)
	 */
	programaticallyEnterHotkeyMode(): void {
		this.hotkeyMode = true;
		this.notificationService.showShortcutModeActivated();
		this.statusBarManager.setActive(true);
	}

	/**
	 * Cancel/exit shortcut mode
	 *
	 * @param event - Keyboard event (optional)
	 */
	cancelShortcuts(event?: KeyboardEvent): void {
		if (event && !document.body.find(".modal-container")) {
			this.restoreFocus(event);
		}

		this.hotkeyMode = false;
		this.statusBarManager.setActive(false);
		this.sequenceMatcher.reset();
		this.notificationService.hideAll();
	}

	/**
	 * Restore focus to previously focused element
	 *
	 * @param event - Keyboard event
	 */
	private restoreFocus(event: KeyboardEvent): void {
		if (!this.hotkeyMode) return;

		this.hotkeyMode = false;
		event.preventDefault();
		event.stopPropagation();

		this.focusStateManager.restoreFocus();
	}

	/**
	 * Blur the active editor
	 */
	private blurEditor(): void {
		const editor = this.app.workspace.activeEditor;
		if (editor?.editor) {
			editor.editor.blur();
			const editorInstance = editor.editor;
			this.focusStateManager.setEditorFocus(
				editorInstance,
				editorInstance.getCursor()
			);
			this.app.workspace.activeEditor = null;
		}
	}

	/**
	 * Update shortcuts configuration
	 *
	 * @param shortcuts - New shortcuts array
	 */
	updateShortcuts(shortcuts: KeySequenceConfig[]): void {
		this.shortcuts = shortcuts;
	}

	/**
	 * Update trigger key from settings
	 */
	updateTriggerKey(): void {
		this.triggerKey = this.plugin.settings.shortcutModeTrigger || "esc";
	}

	/**
	 * Update configuration from settings
	 *
	 * Refreshes shortcuts and saves settings
	 */
	updateConfig(): void {
		this.plugin.settings.sequences = updateKeySequences(
			this.app,
			this.plugin.settings.sequences
		);
		this.shortcuts = this.plugin.settings.sequences.flatMap(
			(s) => s.configs
		);
		void this.plugin.saveSettings();

		// Update notification settings
		this.notificationService.updateSettings({
			showShortcutActivatedNotice:
				this.plugin.settings.showShortcutActivatedNotice,
			showCurrentSequence: this.plugin.settings.showCurrentSequence,
			sequenceTimeoutDuration:
				this.plugin.settings.sequenceTimeoutDuration,
		});
	}

	/**
	 * Convert modifier keys to macOS format (for backward compatibility)
	 *
	 * @param key - Key string
	 * @returns Converted key string
	 */
	convertToMacModifier(key: string): string {
		return this.keyParser.convertToMacModifier(key);
	}

	/**
	 * Execute shortcuts while editor scope mode captures key input.
	 *
	 * @param key - Parsed key string (for example "ctrl+b" or "g")
	 */
	executeEditorScopeShortcut(key: string): void {
		this.editorScopeMatcher.addKey(key);
		this.editorScopeMatcher.startTimer(
			this.plugin.settings.sequenceTimeoutDuration,
			() => {
				this.notificationService.hideAll();
				this.editorScopeMatcher.reset();
			}
		);

		const matchResult = this.editorScopeMatcher.findMatch(this.shortcuts);
		const currentSequence = this.editorScopeMatcher.getCurrentSequenceString();

		if (this.plugin.settings.showCurrentSequence) {
			this.notificationService.showCurrentSequence(
				currentSequence,
				matchResult.possibleMatches.length,
				matchResult.possibleMatches
			);
		}

		if (matchResult.matched) {
			this.shortcutExecutor.execute(matchResult.matched);

			if (this.plugin.settings.showShortcutActivatedNotice) {
				this.notificationService.showShortcutExecuted(
					matchResult.matched.name
				);
			}

			this.editorScopeMatcher.reset();
			return;
		}

		if (matchResult.possibleMatches.length === 0) {
			this.editorScopeMatcher.reset();
			this.notificationService.hideActivationNotice();

			if (this.plugin.settings.showCurrentSequence) {
				this.notificationService.showNoMatch(currentSequence);
			}
		}
	}

	/**
	 * Clear editor scope sequence state when the mode is toggled off.
	 */
	resetEditorScopeSequence(): void {
		this.editorScopeMatcher.reset();
		this.notificationService.hideAll();
	}

	/**
	 * Clean up resources
	 */
	unload(): void {
		this.clearPendingAutoFocusChecks();
		this.editorScopeMatcher.dispose();
		this.sequenceMatcher.dispose();
		this.notificationService.dispose();
		this.statusBarManager.destroy();
		this.hotkeyMode = false;
	}
}
