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

	firstLoaded: boolean;
}
