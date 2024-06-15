import { Editor, EditorPosition, Plugin } from 'obsidian';
import { keyConfigs, KeySequenceConfigClass } from "./keySequence";
import { Action, CommandId, KeySequenceConfig } from "./types/key";

export default class MyPlugin extends Plugin {
	currentSequence: string[] = [];
	sequenceTimer: number | null = null;

	hotkeyMode: boolean = false;

	input: HTMLInputElement | HTMLTextAreaElement | null = null;
	lastActiveElementType: 'editor' | 'input' = 'editor';
	editor: Editor | null = null;
	pos: EditorPosition | null = null;

	async onload() {
		this.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
			if (this.isInputOrEditor(e)) {
				if (e.key === 'Escape' && this.isTargetInCodeMirror(e)) {
					this.handleEscapeOnEditor();
				} else {
					this.prepareForInput(e);
				}
				return;
			}

			if (e.key === 'i') {
				this.handleFocusMode(e);
			}

			if (!this.hotkeyMode) {
				return;
			}


			clearTimeout(this.sequenceTimer as number);
			this.sequenceTimer = window.setTimeout(() => this.resetSequence(), 5000); // 5秒内完成序列

			this.currentSequence.push(e.key);
			this.checkSequence();
		});
	}

	private isInputOrEditor(e: KeyboardEvent): boolean {
		return e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			this.isTargetInCodeMirror(e);
	}

	private isTargetInCodeMirror(e: KeyboardEvent): boolean {
		return (e.target as HTMLElement).closest('.cm-scroller') !== null;
	}

	private handleEscapeOnEditor(): void {
		const editor = this.app.workspace.activeEditor;
		if (editor) {
			editor.editor?.blur();
			this.hotkeyMode = true;
			if (editor.editor) {
				this.editor = editor.editor;
			}

		}
	}

	private prepareForInput(e: KeyboardEvent): void {
		this.hotkeyMode = true;
		this.lastActiveElementType = 'input';
		this.input = e.target as HTMLInputElement | HTMLTextAreaElement;
	}

	private handleFocusMode(e: KeyboardEvent): void {
		if (!this.hotkeyMode) return;

		this.hotkeyMode = false;
		e.preventDefault();
		e.stopPropagation();
		if (this.lastActiveElementType === 'editor' && this.editor) {
			this.editor.focus();
			if (this.pos) {
				this.editor.setSelection(this.pos);
			}
		} else if (document.contains(this.input as Node)) {
			this.input?.focus();
		}
	}

	checkSequence(): void {
		if (this.currentSequence.length === 1) {
			const singleKeyConfig = keyConfigs.find((config: KeySequenceConfig) => config.sequence.length === 1 && config.sequence[0] === this.currentSequence[0]);
			if (singleKeyConfig) {
				this.executeAction(singleKeyConfig);
				this.resetSequence();
			}
		}

		for (const config of keyConfigs) {
			console.log(this.currentSequence.join(''), config.sequence.join(''));
			if (this.currentSequence.join('') === config.sequence.join('')) {
				this.executeAction(config);
				this.resetSequence();
				return;
			}
		}
	}

	executeAction(config: KeySequenceConfigClass): void {
		if (config.actionType === 'FUNC' && typeof config.action === 'function') {
			(config.action as Action)(this.app);
		} else if (config.actionType === 'ID') {
			this.app.commands.executeCommandById(config.action as CommandId);
		}
	}

	resetSequence(): void {
		clearTimeout(this.sequenceTimer as number);
		this.currentSequence = [];
	}

	onunload() {
		clearTimeout(this.sequenceTimer as number);
	}

}
