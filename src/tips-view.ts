import { Component, App, Modal } from "obsidian";
import {
	computePosition,
	autoUpdate,
	flip,
	shift,
	offset,
	type Middleware,
} from "@floating-ui/dom";
import ShortcutsPlugin from "./main";

export class TipsView extends Modal {
	private cleanup: (() => void) | null = null;
	private plugin: ShortcutsPlugin;
	private targetEl: HTMLElement;
	constructor(plugin: ShortcutsPlugin, targetEl: HTMLElement) {
		super(plugin.app);
		this.plugin = plugin;
		this.targetEl = targetEl;
	}

	onOpen(): void {
		const { contentEl } = this;
		this.containerEl.toggleClass("shortcuts-tips", true);
		this.plugin.settingTab.partDisplay(contentEl, "assigned");
		this.show(this.targetEl);
	}

	onClose(): void {
		if (this.cleanup) {
			this.cleanup();
			this.cleanup = null;
		}
		this.plugin.settingTab.partHide(this.contentEl);
		this.contentEl.empty();
	}

	show(targetEl: HTMLElement) {
		super.open();

		const middleware: Middleware[] = [
			offset(5),
			flip(),
			shift({ padding: 5 }),
		];

		this.cleanup = autoUpdate(targetEl, this.modalEl, () => {
			computePosition(targetEl, this.modalEl, {
				placement: "top-start",
				middleware: middleware,
			}).then(({ x, y }: { x: number; y: number }) => {
				Object.assign(this.modalEl.style, {
					left: `${x}px`,
					top: `${y - 10}px`, // Moved up by 10 pixels
					position: "fixed",
					transform: "none",
				});
			});
		});
	}

	hide() {
		super.close();
	}
}
