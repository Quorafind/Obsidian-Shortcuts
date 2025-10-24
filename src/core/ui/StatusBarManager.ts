import { ExtraButtonComponent, setTooltip } from "obsidian";
import ShortcutsPlugin from "../../main";
import { TipsView } from "../../tips-view";

/**
 * StatusBarManager - Status Bar UI Manager
 *
 * Responsibilities:
 * - Create and manage status bar item
 * - Display shortcut mode activation state
 * - Handle status bar button click to toggle mode
 * - Provide context menu for tips view
 * - Update tooltip based on mode and settings
 *
 * Features:
 * - Visual feedback for shortcut mode (mod-active class)
 * - Toggle shortcut mode via click
 * - Right-click context menu for tips
 * - Auto-shortcut mode indicator
 *
 * @example
 * const manager = new StatusBarManager(plugin);
 * manager.initialize();
 * manager.setActive(true);
 * manager.setTooltip("Custom tooltip");
 */
export class StatusBarManager {
	private statusBarItem: HTMLElement;
	private plugin: ShortcutsPlugin;
	private button: ExtraButtonComponent | null = null;

	constructor(plugin: ShortcutsPlugin) {
		this.plugin = plugin;
		this.statusBarItem = plugin.addStatusBarItem();
	}

	/**
	 * Initialize the status bar item
	 *
	 * Sets up:
	 * - CSS classes
	 * - Button component
	 * - Context menu
	 * - Auto-shortcut mode indicator (if enabled)
	 */
	initialize(): void {
		this.statusBarItem.toggleClass(["shortcuts-status-item"], true);

		// Create button
		this.button = this.createButton();

		// Setup context menu
		this.setupContextMenu(this.button);

		// Set initial state based on auto-shortcut mode
		if (this.plugin.settings.autoShortcutMode) {
			this.statusBarItem.toggleClass("mod-active", true);
			setTooltip(this.statusBarItem, "Auto-shortcut mode enabled", {
				placement: "top",
			});
		}
	}

	/**
	 * Set the active state of the status bar
	 *
	 * @param active - True to show as active, false to show as inactive
	 */
	setActive(active: boolean): void {
		this.statusBarItem.toggleClass("mod-active", active);
	}

	/**
	 * Set the tooltip text
	 *
	 * @param text - Tooltip text
	 */
	setTooltip(text: string): void {
		setTooltip(this.statusBarItem, text, {
			placement: "top",
		});
	}

	/**
	 * Get the status bar element
	 *
	 * @returns Status bar HTML element
	 */
	getElement(): HTMLElement {
		return this.statusBarItem;
	}

	/**
	 * Remove the status bar item from DOM
	 */
	destroy(): void {
		this.statusBarItem.detach();
	}

	/**
	 * Create the status bar button component
	 *
	 * @returns Button component
	 */
	private createButton(): ExtraButtonComponent {
		return new ExtraButtonComponent(this.statusBarItem)
			.setIcon("scissors")
			.onClick(() => {
				this.handleButtonClick();
			});
	}

	/**
	 * Handle button click event
	 *
	 * Triggers workspace event to toggle shortcut mode
	 */
	private handleButtonClick(): void {
		this.plugin.app.workspace.trigger(
			"shortcuts:status-bar-click" as any
		);
	}

	/**
	 * Setup context menu for the button
	 *
	 * Right-click opens the tips view
	 *
	 * @param button - Button component
	 */
	private setupContextMenu(button: ExtraButtonComponent): void {
		button.extraSettingsEl.addEventListener("contextmenu", (e) => {
			new TipsView(this.plugin, button.extraSettingsEl).open();
		});
	}
}
