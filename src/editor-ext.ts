import { EditorView } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";
import { App, editorEditorField, editorInfoField } from "obsidian";

const smokeEffect = StateEffect.define(undefined);

export const editorExt = (app: App) => {
	return EditorView.focusChangeEffect.of((_, focusing) => {
		app.workspace.trigger("shortcuts:editor-focus-change", {
			focusing,
			editor: _.field(editorInfoField).editor,
			pos: _.selection.main,
		});
		return smokeEffect.of(null);
	});
};
