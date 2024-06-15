import { App } from "obsidian";

type Action = (app: App) => void;
type CommandId = string;

type ActionType = 'FUNC' | 'ID';

interface KeySequenceConfig {
	sequence: string[];
	action: Action | CommandId;
	actionType: ActionType;
	timeout?: number;
}
