import { KeySequenceScope } from "./key";

interface KeySequenceSettings {
	shortcutModeTrigger: string;
	showKeyPressNotice: boolean;
	showShortcutActivatedNotice: boolean;
	keyboardLayout: string;
	sequences: KeySequenceScope[];
	autoShortcutMode: boolean;
	sequenceTimeoutDuration: number;
	showCurrentSequence: boolean;

	// Editor Scope Mode settings
	editorScopeEnabled: boolean;
	editorScopeTrigger: string;
	editorScopeShowBorder: boolean;

	/** Key used to restore editor focus while in shortcut mode (default: "i", leave empty to disable) */
	focusKey: string;

	/** When enabled, the editor won't auto-focus when a file opens on startup or in a new tab, so shortcut mode stays active immediately */
	disableAutoFocusOnFileOpen: boolean;

	firstLoaded: boolean;
}
