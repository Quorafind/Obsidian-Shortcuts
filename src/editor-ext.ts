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
				event.target instanceof HTMLElement &&
				(!event.relatedTarget ||
					!view.dom.contains(event.relatedTarget as Node) ||
					event.target.closest(".metadata-container") ||
					event.target.closest(".inline-title"))
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
