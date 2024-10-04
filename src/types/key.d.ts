import { App, Modifier } from "obsidian";

type Action = (app: App) => void;
type CommandId = string;
type ActionType = 'FUNC' | 'ID' | "ARIA";
type ModifierKey = Modifier;

interface KeySequenceConfig {
	sequence: string[][];
	name: string;
	action: Action | CommandId;
	id: string;
	actionType: ActionType;
	hide?: boolean;
	timeout?: number;
}

type AvailableScope = 'General' | 'Canvas' | 'Daily notes' | 'Graph' | 'Editor' | "UI";

interface KeySequenceScope {
	scope: AvailableScope;
	configs: KeySequenceConfig[];
}

interface KeySequenceSettings {
	sequences: KeySequenceScope[];
}
