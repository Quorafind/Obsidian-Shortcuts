import { App } from "obsidian";
import { KeySequenceConfig } from "../../types/key";
import { AVAILABLE_CONFIGS } from "../../keySequence";

type Action = (app: App) => void;
type CommandId = string;

/**
 * ShortcutExecutor - Shortcut Action Executor
 *
 * Responsibilities:
 * - Execute shortcut actions based on their type
 * - Support three action types: FUNC, ID, and ARIA
 * - Provide extensible execution strategy
 *
 * Action Types:
 * - FUNC: Execute a predefined function from AVAILABLE_CONFIGS
 * - ID: Execute an Obsidian command by its ID
 * - ARIA: Click an element by its aria-label attribute
 *
 * @example
 * const executor = new ShortcutExecutor(app);
 * executor.execute(shortcutConfig);
 */
export class ShortcutExecutor {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Execute a shortcut action based on its configuration
	 *
	 * @param config - Shortcut configuration to execute
	 * @throws No error is thrown; failed executions are silently ignored
	 */
	execute(config: KeySequenceConfig): void {
		switch (config.actionType) {
			case "FUNC":
				this.executeFunction(config);
				break;
			case "ID":
				this.executeCommand(config);
				break;
			case "ARIA":
				this.executeAria(config);
				break;
			default:
				console.warn(
					`Unknown action type: ${config.actionType} for shortcut: ${config.name}`
				);
		}
	}

	/**
	 * Execute a predefined function action
	 *
	 * Looks up the function from AVAILABLE_CONFIGS by ID and executes it.
	 *
	 * @param config - Shortcut configuration with actionType "FUNC"
	 */
	private executeFunction(config: KeySequenceConfig): void {
		const realFunction = AVAILABLE_CONFIGS.find(
			(c) => c.id === config.id
		)?.action as Action;

		if (realFunction) {
			realFunction(this.app);
		} else {
			console.warn(
				`Function not found for shortcut: ${config.name} (ID: ${config.id})`
			);
		}
	}

	/**
	 * Execute an Obsidian command by its ID
	 *
	 * @param config - Shortcut configuration with actionType "ID"
	 */
	private executeCommand(config: KeySequenceConfig): void {
		const commandId = config.action as CommandId;
		if (commandId) {
			this.app.commands.executeCommandById(commandId);
		} else {
			console.warn(
				`Command ID not found for shortcut: ${config.name}`
			);
		}
	}

	/**
	 * Execute a UI element click by its aria-label
	 *
	 * Finds an element with the specified aria-label and dispatches a click event.
	 *
	 * @param config - Shortcut configuration with actionType "ARIA"
	 */
	private executeAria(config: KeySequenceConfig): void {
		const element = document.body.find(`[aria-label="${config.id}"]`);
		if (element) {
			const { x, y } = element.getBoundingClientRect();
			const event = new MouseEvent("click", {
				clientX: x,
				clientY: y,
			});
			element.dispatchEvent(event);
		} else {
			console.warn(
				`Element with aria-label "${config.id}" not found for shortcut: ${config.name}`
			);
		}
	}
}
