import { App, Command } from "obsidian";
import {
	Action,
	ActionType,
	AvailableScope,
	CommandId,
	KeySequenceConfig,
	KeySequenceScope,
} from "./types/key";
import { getAllSupportedShortcuts } from "./utils";

export class KeySequenceConfigClass {
	sequence: string[][];
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
		sequence: [["shift"]],
		action: "command-palette:open",
		actionType: "ID",
		name: "Open command palette",
		id: "command-palette:open",
	},
	{
		sequence: [["space"]],
		action: "switcher:open",
		actionType: "ID",
		name: "Open switcher",
		id: "switcher:open",
	},
	{
		sequence: [["o"], ["l"]],
		action: "app:toggle-left-sidebar",
		actionType: "ID",
		name: "Toggle left sidebar",
		id: "app:toggle-left-sidebar",
	},
	{
		sequence: [["o"], ["r"]],
		action: "app:toggle-right-sidebar",
		actionType: "ID",
		name: "Toggle right sidebar",
		id: "app:toggle-right-sidebar",
	},
	{
		sequence: [["g"]],
		action: "graph:open",
		actionType: "ID",
		name: "Open graph view",
		id: "graph:open",
	},
	{
		sequence: [["o"], ["f"]],
		action: "switcher:open",
		actionType: "ID",
		name: "Open quick open",
		id: "app:quick-open",
	},
	{
		sequence: [["e"], ["s"], ["a"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				view.setSortOrder("alphabetical");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by alphabetical order",
		id: "file-explorer:sort-alphabetical",
	},
	{
		sequence: [["e"], ["s"], ["d"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				view.setSortOrder("alphabeticalReverse");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by reverse alphabetical order",
		id: "file-explorer:sort-alphabetical-reverse",
	},
	{
		sequence: [["e"], ["s"], ["1"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				view.setSortOrder("byModifiedTime");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by modified time",
		id: "file-explorer:sort-modified-time",
	},
	{
		sequence: [["e"], ["s"], ["2"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				view.setSortOrder("byModifiedTimeReverse");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by reverse modified time",
		id: "file-explorer:sort-modified-time-reverse",
	},
	{
		sequence: [["e"], ["s"], ["3"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				view.setSortOrder("byCreatedTime");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by created time",
		id: "file-explorer:sort-created-time",
	},
	{
		sequence: [["e"], ["s"], ["4"]],
		action: (app: App) => {
			app.commands.executeCommandById("file-explorer:open");
			const view =
				app.workspace.getLeavesOfType("file-explorer")[0]?.view;
			if (view) {
				(view as any).setSortOrder("byCreatedTimeReverse");
			}
		},
		actionType: "FUNC",
		name: "Sort file explorer by reverse created time",
		id: "file-explorer:sort-created-time-reverse",
	},
	{
		action: "workspace:split-vertical",
		name: "Split right",
		actionType: "ID",
		id: "workspace:split-vertical",
		sequence: [],
	},
	{
		action: "workspace:split-horizontal",
		name: "Split down",
		actionType: "ID",
		id: "workspace:split-horizontal",
		sequence: [],
	},
	{
		action: "workspace:toggle-stacked-tabs",
		name: "Toggle stacked tabs",
		actionType: "ID",
		id: "workspace:toggle-stacked-tabs",
		sequence: [],
	},
	{
		action: "workspace:edit-file-title",
		name: "Rename file",
		actionType: "ID",
		id: "workspace:edit-file-title",
		sequence: [],
	},
	{
		action: "workspace:copy-path",
		name: "Copy file path",
		actionType: "ID",
		id: "workspace:copy-path",
		sequence: [],
	},
	{
		action: "workspace:copy-url",
		name: "Copy Obsidian URL",
		actionType: "ID",
		id: "workspace:copy-url",
		sequence: [],
	},
	{
		action: "workspace:undo-close-pane",
		name: "Undo close tab",
		actionType: "ID",
		id: "workspace:undo-close-pane",
		sequence: [],
	},
	{
		action: "workspace:export-pdf",
		name: "Export to PDF...",
		actionType: "ID",
		id: "workspace:export-pdf",
		sequence: [],
	},
	{
		action: "workspace:open-in-new-window",
		name: "Open current tab in new window",
		actionType: "ID",
		id: "workspace:open-in-new-window",
		sequence: [],
	},
	{
		action: "workspace:move-to-new-window",
		name: "Move current tab to new window",
		actionType: "ID",
		id: "workspace:move-to-new-window",
		sequence: [],
	},
	{
		action: "workspace:next-tab",
		name: "Go to next tab",
		actionType: "ID",
		id: "workspace:next-tab",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-1",
		name: "Go to tab #1",
		actionType: "ID",
		id: "workspace:goto-tab-1",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-2",
		name: "Go to tab #2",
		actionType: "ID",
		id: "workspace:goto-tab-2",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-3",
		name: "Go to tab #3",
		actionType: "ID",
		id: "workspace:goto-tab-3",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-4",
		name: "Go to tab #4",
		actionType: "ID",
		id: "workspace:goto-tab-4",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-5",
		name: "Go to tab #5",
		actionType: "ID",
		id: "workspace:goto-tab-5",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-6",
		name: "Go to tab #6",
		actionType: "ID",
		id: "workspace:goto-tab-6",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-7",
		name: "Go to tab #7",
		actionType: "ID",
		id: "workspace:goto-tab-7",
		sequence: [],
	},
	{
		action: "workspace:goto-tab-8",
		name: "Go to tab #8",
		actionType: "ID",
		id: "workspace:goto-tab-8",
		sequence: [],
	},
	{
		action: "workspace:goto-last-tab",
		name: "Go to last tab",
		actionType: "ID",
		id: "workspace:goto-last-tab",
		sequence: [],
	},
	{
		action: "workspace:previous-tab",
		name: "Go to previous tab",
		actionType: "ID",
		id: "workspace:previous-tab",
		sequence: [],
	},
	{
		action: "workspace:new-tab",
		name: "New tab",
		actionType: "ID",
		id: "workspace:new-tab",
		sequence: [],
	},
	{
		action: "workspace:show-trash",
		name: "Show trash",
		actionType: "ID",
		id: "workspace:show-trash",
		sequence: [],
	},
	{
		action: "app:go-back",
		name: "Navigate back",
		actionType: "ID",
		id: "app:go-back",
		sequence: [],
	},
	{
		action: "app:go-forward",
		name: "Navigate forward",
		actionType: "ID",
		id: "app:go-forward",
		sequence: [],
	},
	{
		action: "app:open-vault",
		name: "Open another vault",
		actionType: "ID",
		id: "app:open-vault",
		sequence: [],
	},
	{
		action: "theme:use-dark",
		name: "Use dark mode",
		actionType: "ID",
		id: "theme:use-dark",
		sequence: [],
	},
	{
		action: "theme:use-light",
		name: "Use light mode",
		actionType: "ID",
		id: "theme:use-light",
		sequence: [],
	},
	{
		action: "theme:switch",
		name: "Change theme",
		actionType: "ID",
		id: "theme:switch",
		sequence: [],
	},
	{
		action: "app:open-settings",
		name: "Open settings",
		actionType: "ID",
		id: "app:open-settings",
		sequence: [],
	},
	{
		action: "app:show-release-notes",
		name: "Show release notes",
		actionType: "ID",
		id: "app:show-release-notes",
		sequence: [],
	},
	{
		action: "workspace:close",
		name: "Close current tab",
		actionType: "ID",
		id: "workspace:close",
		sequence: [],
	},
	{
		action: "workspace:close-window",
		name: "Close window",
		actionType: "ID",
		id: "workspace:close-window",
		sequence: [],
	},
	{
		action: "workspace:close-others",
		name: "Close all other tabs",
		actionType: "ID",
		id: "workspace:close-others",
		sequence: [],
	},
	{
		action: "workspace:close-tab-group",
		name: "Close this tab group",
		actionType: "ID",
		id: "workspace:close-tab-group",
		sequence: [],
	},
	{
		action: "workspace:close-others-tab-group",
		name: "Close others in tab group",
		actionType: "ID",
		id: "workspace:close-others-tab-group",
		sequence: [],
	},
	{
		action: "app:delete-file",
		name: "Delete current file",
		actionType: "ID",
		id: "app:delete-file",
		sequence: [],
	},
	{
		action: "app:toggle-ribbon",
		name: "Toggle ribbon",
		actionType: "ID",
		id: "app:toggle-ribbon",
		sequence: [],
	},
	{
		action: "app:toggle-left-sidebar",
		name: "Toggle left sidebar",
		actionType: "ID",
		id: "app:toggle-left-sidebar",
		sequence: [],
	},
	{
		action: "app:toggle-right-sidebar",
		name: "Toggle right sidebar",
		actionType: "ID",
		id: "app:toggle-right-sidebar",
		sequence: [],
	},
	{
		action: "app:toggle-default-new-pane-mode",
		name: "Toggle default mode for new tabs",
		actionType: "ID",
		id: "app:toggle-default-new-pane-mode",
		sequence: [],
	},
	{
		action: "app:open-help",
		name: "Open help",
		actionType: "ID",
		id: "app:open-help",
		sequence: [],
	},
	{
		action: "app:reload",
		name: "Reload app without saving",
		actionType: "ID",
		id: "app:reload",
		sequence: [],
	},
	{
		action: "app:show-debug-info",
		name: "Show debug info",
		actionType: "ID",
		id: "app:show-debug-info",
		sequence: [],
	},
	{
		action: "app:open-sandbox-vault",
		name: "Open sandbox vault",
		actionType: "ID",
		id: "app:open-sandbox-vault",
		sequence: [],
	},
	{
		action: "window:toggle-always-on-top",
		name: "Toggle window always on top",
		actionType: "ID",
		id: "window:toggle-always-on-top",
		sequence: [],
	},
	{
		action: "window:zoom-in",
		name: "Zoom in",
		actionType: "ID",
		id: "window:zoom-in",
		sequence: [],
	},
	{
		action: "window:zoom-out",
		name: "Zoom out",
		actionType: "ID",
		id: "window:zoom-out",
		sequence: [],
	},
	{
		action: "window:reset-zoom",
		name: "Reset zoom",
		actionType: "ID",
		id: "window:reset-zoom",
		sequence: [],
	},
	{
		action: "file-explorer:new-file",
		name: "Create new note",
		actionType: "ID",
		id: "file-explorer:new-file",
		sequence: [],
	},
	{
		action: "file-explorer:new-file-in-current-tab",
		name: "Create new note in current tab",
		actionType: "ID",
		id: "file-explorer:new-file-in-current-tab",
		sequence: [],
	},
	{
		action: "file-explorer:new-file-in-new-pane",
		name: "Create note to the right",
		actionType: "ID",
		id: "file-explorer:new-file-in-new-pane",
		sequence: [],
	},
	{
		action: "open-with-default-app:open",
		name: "Open in default app",
		actionType: "ID",
		id: "open-with-default-app:open",
		sequence: [],
	},
	{
		action: "file-explorer:move-file",
		name: "Move current file to another folder",
		actionType: "ID",
		id: "file-explorer:move-file",
		sequence: [],
	},
	{
		action: "file-explorer:duplicate-file",
		name: "Make a copy of the current file",
		actionType: "ID",
		id: "file-explorer:duplicate-file",
		sequence: [],
	},
	{
		action: "open-with-default-app:show",
		name: "Show in system explorer",
		actionType: "ID",
		id: "open-with-default-app:show",
		sequence: [],
	},
	{
		action: "file-explorer:open",
		name: "Files: Show file explorer",
		actionType: "ID",
		id: "file-explorer:open",
		sequence: [],
	},
	{
		action: "file-explorer:reveal-active-file",
		name: "Files: Reveal current file in navigation",
		actionType: "ID",
		id: "file-explorer:reveal-active-file",
		sequence: [],
	},
	{
		action: "file-explorer:new-folder",
		name: "Files: Create new folder",
		actionType: "ID",
		id: "file-explorer:new-folder",
		sequence: [],
	},
	{
		action: "global-search:open",
		name: "Search: Search in all files",
		actionType: "ID",
		id: "global-search:open",
		sequence: [],
	},
	{
		action: "switcher:open",
		name: "Quick switcher: Open quick switcher",
		actionType: "ID",
		id: "switcher:open",
		sequence: [],
	},
	{
		action: "graph:open",
		name: "Graph view: Open graph view",
		actionType: "ID",
		id: "graph:open",
		sequence: [],
	},
	{
		action: "graph:open-local",
		name: "Graph view: Open local graph",
		actionType: "ID",
		id: "graph:open-local",
		sequence: [],
	},
	{
		action: "graph:animate",
		name: "Graph view: Start graph timelapse animation",
		actionType: "ID",
		id: "graph:animate",
		sequence: [],
	},
	{
		action: "backlink:open",
		name: "Backlinks: Show backlinks",
		actionType: "ID",
		id: "backlink:open",
		sequence: [],
	},
	{
		action: "backlink:open-backlinks",
		name: "Backlinks: Open backlinks for the current note",
		actionType: "ID",
		id: "backlink:open-backlinks",
		sequence: [],
	},
	{
		action: "backlink:toggle-backlinks-in-document",
		name: "Backlinks: Toggle backlinks in document",
		actionType: "ID",
		id: "backlink:toggle-backlinks-in-document",
		sequence: [],
	},
	{
		action: "canvas:new-file",
		name: "Canvas: Create new canvas",
		actionType: "ID",
		id: "canvas:new-file",
		sequence: [],
	},
	{
		action: "canvas:export-as-image",
		name: "Canvas: Export as image",
		actionType: "ID",
		id: "canvas:export-as-image",
		sequence: [],
	},
	{
		action: "canvas:jump-to-group",
		name: "Canvas: Jump to group",
		actionType: "ID",
		id: "canvas:jump-to-group",
		sequence: [],
	},
	{
		action: "canvas:convert-to-file",
		name: "Canvas: Convert to file...",
		actionType: "ID",
		id: "canvas:convert-to-file",
		sequence: [],
	},
	{
		action: "outgoing-links:open",
		name: "Outgoing links: Show outgoing links",
		actionType: "ID",
		id: "outgoing-links:open",
		sequence: [],
	},
	{
		action: "outgoing-links:open-for-current",
		name: "Outgoing links: Open outgoing links for the current file",
		actionType: "ID",
		id: "outgoing-links:open-for-current",
		sequence: [],
	},
	{
		action: "tag-pane:open",
		name: "Tags view: Show tags",
		actionType: "ID",
		id: "tag-pane:open",
		sequence: [],
	},
	{
		action: "daily-notes",
		name: "Daily notes: Open today's daily note",
		actionType: "ID",
		id: "daily-notes",
		sequence: [],
	},
	{
		action: "daily-notes:goto-prev",
		name: "Daily notes: Open previous daily note",
		actionType: "ID",
		id: "daily-notes:goto-prev",
		sequence: [],
	},
	{
		action: "daily-notes:goto-next",
		name: "Daily notes: Open next daily note",
		actionType: "ID",
		id: "daily-notes:goto-next",
		sequence: [],
	},
	{
		action: "insert-template",
		name: "Templates: Insert template",
		actionType: "ID",
		id: "insert-template",
		sequence: [],
	},
	{
		action: "insert-current-date",
		name: "Templates: Insert current date",
		actionType: "ID",
		id: "insert-current-date",
		sequence: [],
	},
	{
		action: "insert-current-time",
		name: "Templates: Insert current time",
		actionType: "ID",
		id: "insert-current-time",
		sequence: [],
	},
	{
		action: "note-composer:merge-file",
		name: "Note composer: Merge current file with another file...",
		actionType: "ID",
		id: "note-composer:merge-file",
		sequence: [],
	},
	{
		action: "note-composer:split-file",
		name: "Note composer: Extract current selection...",
		actionType: "ID",
		id: "note-composer:split-file",
		sequence: [],
	},
	{
		action: "note-composer:extract-heading",
		name: "Note composer: Extract this heading...",
		actionType: "ID",
		id: "note-composer:extract-heading",
		sequence: [],
	},
	{
		action: "command-palette:open",
		name: "Command palette: Open command palette",
		actionType: "ID",
		id: "command-palette:open",
		sequence: [],
	},
	{
		action: "bookmarks:open",
		name: "Bookmarks: Show bookmarks",
		actionType: "ID",
		id: "bookmarks:open",
		sequence: [],
	},
	{
		action: "bookmarks:bookmark-current-view",
		name: "Bookmarks: Bookmark...",
		actionType: "ID",
		id: "bookmarks:bookmark-current-view",
		sequence: [],
	},
	{
		action: "bookmarks:bookmark-current-search",
		name: "Bookmarks: Bookmark current search...",
		actionType: "ID",
		id: "bookmarks:bookmark-current-search",
		sequence: [],
	},
	{
		action: "bookmarks:unbookmark-current-view",
		name: "Bookmarks: Remove bookmark for the current file",
		actionType: "ID",
		id: "bookmarks:unbookmark-current-view",
		sequence: [],
	},
	{
		action: "bookmarks:bookmark-current-section",
		name: "Bookmarks: Bookmark block under cursor...",
		actionType: "ID",
		id: "bookmarks:bookmark-current-section",
		sequence: [],
	},
	{
		action: "bookmarks:bookmark-current-heading",
		name: "Bookmarks: Bookmark heading under cursor...",
		actionType: "ID",
		id: "bookmarks:bookmark-current-heading",
		sequence: [],
	},
	{
		action: "bookmarks:bookmark-all-tabs",
		name: "Bookmarks: Bookmark all tabs...",
		actionType: "ID",
		id: "bookmarks:bookmark-all-tabs",
		sequence: [],
	},
	{
		action: "random-note",
		name: "Random note: Open random note",
		actionType: "ID",
		id: "random-note",
		sequence: [],
	},
	{
		action: "outline:open",
		name: "Outline: Show outline",
		actionType: "ID",
		id: "outline:open",
		sequence: [],
	},
	{
		action: "outline:open-for-current",
		name: "Outline: Open outline of the current file",
		actionType: "ID",
		id: "outline:open-for-current",
		sequence: [],
	},
	{
		action: "audio-recorder:start",
		name: "Audio recorder: Start recording audio",
		actionType: "ID",
		id: "audio-recorder:start",
		sequence: [],
	},
	{
		action: "audio-recorder:stop",
		name: "Audio recorder: Stop recording audio",
		actionType: "ID",
		id: "audio-recorder:stop",
		sequence: [],
	},
	{
		action: "workspaces:load",
		name: "Workspaces: Load workspace layout",
		actionType: "ID",
		id: "workspaces:load",
		sequence: [],
	},
	{
		action: "workspaces:save",
		name: "Workspaces: Save layout",
		actionType: "ID",
		id: "workspaces:save",
		sequence: [],
	},
	{
		action: "workspaces:save-and-load",
		name: "Workspaces: Save and load another layout",
		actionType: "ID",
		id: "workspaces:save-and-load",
		sequence: [],
	},
	{
		action: "workspaces:open-modal",
		name: "Workspaces: Manage workspace layouts",
		actionType: "ID",
		id: "workspaces:open-modal",
		sequence: [],
	},
	{
		action: "file-recovery:open",
		name: "File recovery: Open saved snapshots",
		actionType: "ID",
		id: "file-recovery:open",
		sequence: [],
	},
	{
		action: "hot-reload:scan-for-changes",
		name: "Hot Reload: Check plugins for changes and reload them",
		actionType: "ID",
		id: "hot-reload:scan-for-changes",
		sequence: [],
	},
];

export const keyConfigs: KeySequenceConfigClass[] = AVAILABLE_CONFIGS.map(
	(config) => new KeySequenceConfigClass(config)
);

export function updateKeySequences(
	app: App,
	currentSequences: KeySequenceScope[]
): KeySequenceScope[] {
	const allCommands = Object.values(app.commands.commands);
	const editorCommandsSet = new Set(Object.keys(app.commands.editorCommands));
	const generalCommandsSet = new Set(Object.keys(app.commands.commands));

	// Helper function to determine the scope of a command
	function getCommandScope(commandId: string): AvailableScope {
		if (editorCommandsSet.has(commandId)) return "Editor";
		if (generalCommandsSet.has(commandId)) return "General";
		return "General"; // Default to General if not found
	}

	// Create a map of all valid commands
	const validCommands = new Map(allCommands.map((cmd) => [cmd.id, cmd]));
	const ariaCommands = getAllSupportedShortcuts();
	const validAriaCommands = new Set(ariaCommands.map((c) => c.id));

	// Initialize new sequences with all possible scopes
	const newSequences: KeySequenceScope[] = [
		{ scope: "General", configs: [] },
		{ scope: "Editor", configs: [] },
		{ scope: "Canvas", configs: [] },
		{ scope: "Daily notes", configs: [] },
		{ scope: "Graph", configs: [] },
		{ scope: "UI", configs: [] },
	];

	// Process existing configs
	currentSequences.forEach((scope) => {
		scope.configs.forEach((config) => {
			if (config.actionType === "ID" && validCommands.has(config.id)) {
				const commandScope = getCommandScope(config.id);
				const targetScope = newSequences.find(
					(s) => s.scope === commandScope
				);
				if (
					targetScope &&
					!targetScope.configs.some((c) => c.id === config.id)
				) {
					targetScope.configs.push({
						...config,
						hide: false,
					});
				}
			} else if (config.actionType === "ARIA") {
				const targetScope = newSequences.find((s) => s.scope === "UI");
				if (
					targetScope &&
					!targetScope.configs.some((c) => c.id === config.id)
				) {
					targetScope.configs.push({
						...config,
						hide: !validAriaCommands.has(config.id),
					});
				}
			}
		});
	});

	// Add new commands that are not in the current sequences
	allCommands.forEach((command) => {
		const commandScope = getCommandScope(command.id);
		const targetScope = newSequences.find((s) => s.scope === commandScope);
		if (
			targetScope &&
			!targetScope.configs.some((c) => c.id === command.id)
		) {
			targetScope.configs.push({
				sequence: [], // Empty sequence, to be set by the user
				name: command.name,
				action: command.id,
				id: command.id,
				actionType: "ID",
				hide: false,
			});
		}
	});

	ariaCommands.forEach((ariaCommand) => {
		const targetScope = newSequences.find((s) => s.scope === "UI");
		if (
			targetScope &&
			!targetScope.configs.some((c) => c.id === ariaCommand.id)
		) {
			targetScope.configs.push({
				...ariaCommand,
				hide: false,
			});
		}
	});

	// Remove empty scopes
	return newSequences.filter((scope) => scope.configs.length > 0);
}
