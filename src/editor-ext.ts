import { EditorView } from "@codemirror/view";
import { StateEffect, EditorState } from "@codemirror/state";
import { App, editorEditorField, editorInfoField } from "obsidian";

const smokeEffect = StateEffect.define(undefined);

export const editorExt = (app: App) => {
	return EditorView.focusChangeEffect.of((state: EditorState, focusing) => {
		// For focus gain or non-input blur, trigger the event
		app.workspace.trigger("shortcuts:editor-focus-change", {
			focusing,
			editor: state.field(editorInfoField).editor,
			pos: state.selection.main,
		});
		return smokeEffect.of(null);
	});
};
