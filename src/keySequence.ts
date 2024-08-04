import { App } from "obsidian";
import { Action, ActionType, CommandId, KeySequenceConfig } from "./types/key";

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

export const AVAILABLE_CONFIGS: KeySequenceConfig[] = [
	{
		sequence: ['Shift'],
		action: 'command-palette:open',
		actionType: 'ID',
		name: 'Open command palette',
		id: 'command-palette:open',
	},
	{
		sequence: [' '],
		action: 'switcher:open',
		actionType: 'ID',
		name: 'Open switcher',
		id: 'switcher:open',
	},
	{
		sequence: ['o', 'l'],
		action: 'app:toggle-left-sidebar',
		actionType: 'ID',
		name: 'Toggle left sidebar',
		id: 'app:toggle-left-sidebar',
	},
	{
		sequence: ['o', 'r'],
		action: 'app:toggle-right-sidebar',
		actionType: 'ID',
		name: 'Toggle right sidebar',
		id: 'app:toggle-right-sidebar',
	},
	{
		sequence: ['g'],
		action: 'graph:open',
		actionType: 'ID',
		name: 'Open graph view',
		id: 'graph:open',
	},
	{
		sequence: ['o', 'f'],
		action: 'app:quick-open',
		actionType: 'ID',
		name: 'Open quick open',
		id: 'app:quick-open',
	},
	{
		sequence: ['e', 's', 'a'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('alphabetical');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by alphabetical order',
		id: 'file-explorer:sort-alphabetical',
	},
	{
		sequence: ['e', 's', 'd'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('alphabeticalReverse');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by reverse alphabetical order',
		id: 'file-explorer:sort-alphabetical-reverse',
	},
	{
		sequence: ['e', 's', '1'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byModifiedTime');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by modified time',
		id: 'file-explorer:sort-modified-time',
	},
	{
		sequence: ['e', 's', '2'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byModifiedTimeReverse');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by reverse modified time',
		id: 'file-explorer:sort-modified-time-reverse',
	},
	{
		sequence: ['e', 's', '3'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				view.setSortOrder('byCreatedTime');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by created time',
		id: 'file-explorer:sort-created-time',
	},
	{
		sequence: ['e', 's', '4'],
		action: (app: App) => {
			app.commands.executeCommandById('file-explorer:open');
			const view = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
			if (view) {
				(view as any).setSortOrder('byCreatedTimeReverse');
			}
		},
		actionType: 'FUNC',
		name: 'Sort file explorer by reverse created time',
		id: 'file-explorer:sort-created-time-reverse',
	},
];

export const keyConfigs: KeySequenceConfigClass[] = AVAILABLE_CONFIGS.map((config) => new KeySequenceConfigClass(config));
