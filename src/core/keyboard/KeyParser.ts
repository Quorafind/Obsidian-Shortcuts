import { Platform } from "obsidian";
import keycode from "keycode";

/**
 * KeyParser - Keyboard Event Parser
 *
 * Responsibilities:
 * - Parse KeyboardEvent into standardized key strings
 * - Handle modifier key combinations and formatting
 * - Cross-platform modifier key conversion (macOS: meta→command, alt→option)
 *
 * @example
 * const parser = new KeyParser();
 * const keyString = parser.parseKeyEvent(event); // "ctrl+shift+A"
 * const macKey = parser.convertToMacModifier("meta+A"); // "command+A"
 */
export class KeyParser {
	private readonly modifierKeyMap: Record<string, string> = {
		Control: "ctrl",
		Alt: "alt",
		Shift: "shift",
		Meta: "meta",
		Command: "meta",
	};

	/**
	 * Parse keyboard event into a standardized key string
	 *
	 * @param event - Keyboard event
	 * @returns Standardized key string, e.g., "ctrl+shift+A" or "esc"
	 */
	parseKeyEvent(event: KeyboardEvent): string {
		const modifiers: string[] = [];

		// Detect modifier keys
		if (event.ctrlKey) modifiers.push("ctrl");
		if (event.altKey) modifiers.push("alt");
		if (event.shiftKey) modifiers.push("shift");
		if (event.metaKey) modifiers.push("meta");

		let key = event.key;

		// Normalize modifier key names
		if (key in this.modifierKeyMap) {
			key = this.modifierKeyMap[key];
		} else {
			key = keycode(event.keyCode);
		}

		// Convert single character keys to uppercase
		if (key.length === 1) {
			key = key.toUpperCase();
		}

		// If the key is already in the modifiers list, don't add it again
		if (!modifiers.includes(key)) {
			return modifiers.length > 0 ? [...modifiers, key].join("+") : key;
		} else {
			return modifiers.join("+");
		}
	}

	/**
	 * Convert modifier keys to macOS style
	 *
	 * On macOS platform:
	 * - meta → command
	 * - alt → option
	 *
	 * @param key - Key string
	 * @returns Converted key string
	 */
	convertToMacModifier(key: string): string {
		if (Platform.isMacOS) {
			return key.replace(/meta/g, "command").replace(/alt/g, "option");
		}
		return key;
	}

	/**
	 * Check if a key is a modifier key
	 *
	 * @param key - Key string
	 * @returns True if the key is a modifier
	 */
	isModifierKey(key: string): boolean {
		const modifiers = Object.values(this.modifierKeyMap);
		return modifiers.includes(key);
	}
}
