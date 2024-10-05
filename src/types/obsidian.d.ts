import { SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import "obsidian";
import { EventRef } from "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById(id: string): void;
			listCommands(): Command[];

			app: App;
			editorCommands: Map<string, Command>;
			commands: Map<string, Command>;
		};
	}

	interface View {
		setSortOrder(order: string): void;
	}

	interface Workspace {
		/**
		 * Triggered when the editor focus changes.
		 * @public
		 */
		on(
			name: "shortcuts:editor-focus-change",
			callback: ({
				focusing,
				editor,
				pos,
			}: {
				focusing: boolean;
				editor: Editor;
				pos: SelectionRange;
			}) => any,
			ctx?: any
		): EventRef;

		/**
		 * Triggered when the input focus changes.
		 * @public
		 */
		on(
			name: "shortcuts:input-focus-change",
			callback: ({
				focusing,
				input,
			}: {
				focusing: boolean;
				input: HTMLInputElement;
			}) => any,
			ctx?: any
		): EventRef;
	}
}
