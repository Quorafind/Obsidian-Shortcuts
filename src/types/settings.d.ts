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

	firstLoaded: boolean;
}
