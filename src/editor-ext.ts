import { EditorView } from "@codemirror/view";
import { StateEffect, EditorState } from "@codemirror/state";
import { App, editorEditorField, editorInfoField } from "obsidian";

const smokeEffect = StateEffect.define(undefined);

export const editorExt = (app: App) => {
	let lastFocusState = false;

	return EditorView.domEventHandlers({
		focus: (event, view) => {
			if (!lastFocusState) {
				lastFocusState = true;
				app.workspace.trigger("shortcuts:editor-focus-change", {
					focusing: true,
					editor: view.state.field(editorInfoField).editor,
					pos: view.state.selection.main,
				});
			}
		},
		blur: (event, view) => {
			// Only trigger blur when actually leaving the editor or clicking metadata/title
			if (
				(event.relatedTarget &&
					event.target instanceof HTMLElement &&
					((view.dom.contains(event.relatedTarget as Node) &&
						!(event.relatedTarget as HTMLElement).closest(".cm-contentContainer")) ||
						(event.relatedTarget as HTMLElement).closest(".metadata-container") ||
						(event.relatedTarget as HTMLElement).closest(".inline-title"))) ||
				!view.dom.contains(event.relatedTarget as Node)
			) {
				lastFocusState = false;
				app.workspace.trigger("shortcuts:editor-focus-change", {
					focusing: false,
					editor: view.state.field(editorInfoField).editor,
					pos: view.state.selection.main,
				});
			}
		},
	});
};
