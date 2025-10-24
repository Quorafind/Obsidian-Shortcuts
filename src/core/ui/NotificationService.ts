import { Notice, Platform } from "obsidian";
import { KeySequenceConfig } from "../../types/key";

/**
 * Settings interface for notification display preferences
 */
export interface NotificationSettings {
	showShortcutActivatedNotice: boolean;
	showCurrentSequence: boolean;
	sequenceTimeoutDuration: number;
}

/**
 * NotificationService - User Notification Manager
 *
 * Responsibilities:
 * - Display shortcut mode activation/deactivation notices
 * - Show current sequence and possible matches
 * - Display shortcut execution confirmations
 * - Manage notice lifecycle (create, update, hide)
 *
 * Features:
 * - Settings-driven notification display
 * - Reuses notice instances to avoid multiple popups
 * - Converts modifier keys to platform-specific format (macOS)
 *
 * @example
 * const service = new NotificationService(settings);
 * service.showShortcutModeActivated();
 * service.showCurrentSequence("ctrl+a", 3, possibleMatches);
 * service.hideAll();
 */
export class NotificationService {
	private notice: Notice | null = null;
	private matchesNotice: Notice | null = null;
	private settings: NotificationSettings;

	constructor(settings: NotificationSettings) {
		this.settings = settings;
	}

	/**
	 * Update settings
	 *
	 * @param settings - New notification settings
	 */
	updateSettings(settings: NotificationSettings): void {
		this.settings = settings;
	}

	/**
	 * Show shortcut mode activation notice
	 */
	showShortcutModeActivated(): void {
		if (!this.settings.showShortcutActivatedNotice) return;

		this.notice = new Notice("Starting shortcuts mode", 3000);
	}

	/**
	 * Show current sequence with match information
	 *
	 * Displays:
	 * - Current key sequence
	 * - Number of matches found
	 * - List of possible matching shortcuts
	 *
	 * @param sequenceString - Current sequence as formatted string
	 * @param matchCount - Number of possible matches
	 * @param possibleMatches - Array of possible matching shortcuts
	 */
	showCurrentSequence(
		sequenceString: string,
		matchCount: number,
		possibleMatches: KeySequenceConfig[]
	): void {
		if (!this.settings.showCurrentSequence) return;

		const fragment = this.createSequenceFragment(
			sequenceString,
			matchCount,
			possibleMatches
		);

		// Reuse or create new notice
		if (!this.matchesNotice) {
			this.matchesNotice = new Notice(fragment, 0);
		} else {
			this.matchesNotice.setMessage(fragment);
		}
	}

	/**
	 * Show shortcut execution confirmation
	 *
	 * @param configName - Name of the executed shortcut
	 */
	showShortcutExecuted(configName: string): void {
		if (!this.settings.showShortcutActivatedNotice) return;

		// Hide activation notice
		this.notice?.hide();

		// Show execution confirmation
		new Notice("Shortcut executed: " + configName);

		// Show continuation hint
		const fragment = document.createDocumentFragment();
		fragment.createDiv({
			text: "Previous shortcut executed: " + configName,
		});
		fragment.createEl("br");
		fragment.createDiv({
			text: "Press Escape to exit shortcuts mode or continue typing to execute another shortcut.",
		});

		new Notice(fragment, 5000);
	}

	/**
	 * Show "no match found" notice
	 *
	 * @param sequenceString - The sequence that didn't match
	 */
	showNoMatch(sequenceString: string): void {
		if (!this.settings.showCurrentSequence) return;

		this.matchesNotice?.hide();
		this.matchesNotice = new Notice(
			"No shortcut found for " +
				this.convertToMacModifier(sequenceString),
			this.settings.sequenceTimeoutDuration
		);
	}

	/**
	 * Hide all active notices
	 */
	hideAll(): void {
		this.notice?.hide();
		this.notice = null;
		this.matchesNotice?.hide();
		this.matchesNotice = null;
	}

	/**
	 * Hide activation notice only
	 */
	hideActivationNotice(): void {
		this.notice?.hide();
		this.notice = null;
	}

	/**
	 * Hide matches notice only
	 */
	hideMatchesNotice(): void {
		this.matchesNotice?.hide();
		this.matchesNotice = null;
	}

	/**
	 * Create a document fragment showing sequence match information
	 *
	 * @param sequenceString - Current sequence
	 * @param matchCount - Number of matches
	 * @param possibleMatches - Possible matching shortcuts
	 * @returns Document fragment for notice display
	 */
	private createSequenceFragment(
		sequenceString: string,
		matchCount: number,
		possibleMatches: KeySequenceConfig[]
	): DocumentFragment {
		const fragment = document.createDocumentFragment();

		fragment.createDiv({
			text:
				"Current sequence: " +
				this.convertToMacModifier(sequenceString),
		});

		fragment.createDiv({
			text: "Matches found: " + matchCount,
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

		return fragment;
	}

	/**
	 * Convert modifier keys to macOS format for display
	 *
	 * @param key - Key string
	 * @returns Converted key string
	 */
	private convertToMacModifier(key: string): string {
		if (Platform.isMacOS) {
			return key.replace(/meta/g, "command").replace(/alt/g, "option");
		}
		return key;
	}

	/**
	 * Clean up all notices
	 */
	dispose(): void {
		this.hideAll();
	}
}
