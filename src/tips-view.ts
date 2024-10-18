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

	constructor(plugin: ShortcutsPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const { contentEl } = this;
		this.plugin.settingTab.partDisplay(contentEl);
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

		this.cleanup = autoUpdate(targetEl, this.contentEl, () => {
			computePosition(targetEl, this.contentEl, {
				placement: "top-start",
				middleware: middleware,
			}).then(({ x, y }: { x: number; y: number }) => {
				Object.assign(this.contentEl.style, {
					left: `${x}px`,
					top: `${y}px`,
					position: 'fixed',
					transform: 'none',
				});
			});
		});
	}

	hide() {
		super.close();
	}
}
