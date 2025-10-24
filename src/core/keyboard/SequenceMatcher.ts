import { KeySequenceConfig } from "../../types/key";

/**
 * Match result for shortcut sequences
 */
export interface SequenceMatchResult {
	/** The matched shortcut configuration, or null if no match */
	matched: KeySequenceConfig | null;
	/** Array of possible matching shortcuts that start with the current sequence */
	possibleMatches: KeySequenceConfig[];
}

/**
 * SequenceMatcher - Keyboard Sequence Matcher
 *
 * Responsibilities:
 * - Track current key sequence input
 * - Match sequences against configured shortcuts
 * - Manage sequence timeout and auto-reset
 * - Format sequences for display and comparison
 *
 * @example
 * const matcher = new SequenceMatcher(200);
 * matcher.addKey("ctrl+A");
 * matcher.addKey("B");
 * const result = matcher.findMatch(shortcuts);
 * if (result.matched) {
 *   console.log("Matched shortcut:", result.matched.name);
 * }
 */
export class SequenceMatcher {
	private currentSequence: string[][] = [];
	private sequenceTimer: NodeJS.Timeout | null = null;
	private readonly COMBO_THRESHOLD: number;
	private lastKeyTime: number = 0;

	private readonly modifierKeys = ["ctrl", "alt", "shift", "meta"];

	/**
	 * @param comboThreshold - Time threshold in milliseconds to distinguish between
	 *                         combo keys and sequence keys (default: 200ms)
	 */
	constructor(comboThreshold: number = 200) {
		this.COMBO_THRESHOLD = comboThreshold;
	}

	/**
	 * Add a key to the current sequence
	 *
	 * Keys pressed within COMBO_THRESHOLD are treated as a combo (e.g., ctrl+A).
	 * Keys pressed after COMBO_THRESHOLD are treated as a new step in the sequence.
	 *
	 * @param key - Parsed key string (e.g., "ctrl+A", "B", "esc")
	 */
	addKey(key: string): void {
		const now = Date.now();

		// Start a new sequence or add to existing one based on timing
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
			if (this.isModifierKey(key) && lastKey.includes(key)) {
				return;
			}

			// If the last key was a single modifier, replace it with the new combo
			if (this.isModifierKey(lastKey) && key !== lastKey) {
				lastCombo[lastCombo.length - 1] = key;
			} else {
				lastCombo.push(key);
			}
		}

		this.lastKeyTime = now;
	}

	/**
	 * Find matching shortcuts for the current sequence
	 *
	 * @param shortcuts - Array of configured shortcuts
	 * @returns Match result with exact match and possible matches
	 */
	findMatch(shortcuts: KeySequenceConfig[]): SequenceMatchResult {
		const sequenceString = this.getCurrentSequenceString();

		// Find exact match
		const matched = shortcuts.find((shortcut) => {
			return this.formatSequence(shortcut.sequence) === sequenceString;
		});

		// Find all possible matches (shortcuts that start with current sequence)
		const possibleMatches = shortcuts.filter((shortcut) => {
			return this.formatSequence(shortcut.sequence).startsWith(
				sequenceString
			);
		});

		return {
			matched: matched || null,
			possibleMatches,
		};
	}

	/**
	 * Get the current sequence as a formatted string
	 *
	 * @returns Formatted sequence string (e.g., "ctrl+a then b")
	 */
	getCurrentSequenceString(): string {
		return this.formatSequence(this.currentSequence);
	}

	/**
	 * Get the raw current sequence
	 *
	 * @returns Current sequence as 2D array
	 */
	getCurrentSequence(): string[][] {
		return [...this.currentSequence];
	}

	/**
	 * Reset the current sequence
	 */
	reset(): void {
		this.currentSequence = [];
		this.resetTimer();
	}

	/**
	 * Start or restart the sequence timeout timer
	 *
	 * @param timeout - Timeout duration in milliseconds
	 * @param onTimeout - Callback function to execute when timeout occurs
	 */
	startTimer(timeout: number, onTimeout: () => void): void {
		this.resetTimer();
		this.sequenceTimer = setTimeout(() => {
			onTimeout();
			this.reset();
		}, timeout);
	}

	/**
	 * Clear the sequence timeout timer
	 */
	resetTimer(): void {
		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
			this.sequenceTimer = null;
		}
	}

	/**
	 * Format a sequence for display and comparison
	 *
	 * Converts sequence array to normalized string:
	 * - Sorts keys in each combo
	 * - Joins combos with " then "
	 * - Converts to lowercase
	 * - Converts meta→command, alt→option for consistency
	 *
	 * @param sequence - Sequence to format
	 * @returns Formatted sequence string
	 */
	private formatSequence(sequence: string[][]): string {
		return [...sequence]
			.map((combo) => combo.sort().join("+"))
			.join(" then ")
			.toLowerCase()
			.replace(/meta/g, "command")
			.replace(/alt/g, "option");
	}

	/**
	 * Check if a key is a modifier key
	 *
	 * @param key - Key string
	 * @returns True if the key is a modifier
	 */
	private isModifierKey(key: string): boolean {
		return this.modifierKeys.includes(key);
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		this.resetTimer();
		this.currentSequence = [];
	}
}
