import { App } from "obsidian";

export class KeySequenceConfigClass {
	sequence: string[];
	action: Action | CommandId;
	actionType: ActionType;
	timeout: number;

	constructor(config: KeySequenceConfig) {
		this.sequence = config.sequence;
		this.action = config.action;
		this.actionType = config.actionType;
		this.timeout = config.timeout ?? 5000;
	}
}

export const keyConfigs: KeySequenceConfigClass[] = [
	new KeySequenceConfigClass({
		sequence: ['Shift'],
		action: 'command-palette:open',
		actionType: 'ID'
	}),
	new KeySequenceConfigClass({
		sequence: [' '],
		action: 'switcher:open',
		actionType: 'ID'
	}),
	new KeySequenceConfigClass({
		sequence: ['o', 'l'],
		action: 'app:toggle-left-sidebar',
		actionType: 'ID'
	}),
	new KeySequenceConfigClass({
		sequence: ['o', 'r'],
		action: 'app:toggle-right-sidebar',
		actionType: 'ID'
	}),
	new KeySequenceConfigClass({
		sequence: ['g'],
		action: () => console.log("Graph view opened"),
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['o', 'f'],
		action: 'app:quick-open',
		actionType: 'ID'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', 'a'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('alphabetical');
			}
		},
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', 'd'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('alphabeticalReverse');
			}
		},
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', '1'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byModifiedTime');
			}
		},
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', '2'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byModifiedTimeReverse');
			}
		},
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', '3'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byCreatedTime');
			}
		},
		actionType: 'FUNC'
	}),
	new KeySequenceConfigClass({
		sequence: ['e', 's', '4'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byCreatedTimeReverse');
			}
		},
		actionType: 'FUNC'
	}),
];
