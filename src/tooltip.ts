import { App, Component, debounce, Menu, MenuItem, setIcon } from "obsidian";
import ShortcutsPlugin from "./main";

export class TooltipObserver extends Component {
	private mutationObserver: MutationObserver;
	private debouncedCheckAndModify: () => void;
	private plugin: ShortcutsPlugin;

	constructor(plugin: ShortcutsPlugin) {
		super();
		this.mutationObserver = new MutationObserver(
			this.handleMutations.bind(this)
		);
		this.debouncedCheckAndModify = debounce(
			() => this.checkAndModifyAllTooltips(),
			100, // 延迟100ms
			true // 在延迟结束后调用
		);
		this.plugin = plugin;
	}

	onload() {
		super.onload();
		this.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class"],
		});

		// 注册一个定期检查的间隔
		this.registerInterval(
			window.setInterval(() => this.debouncedCheckAndModify(), 500)
		);
		this.registerDomEvent(document, "contextmenu", (event) => {
			if (
				event.target instanceof HTMLElement &&
				event.target.closest("[aria-label].clickable-icon")
			) {
				const menu = new Menu();
				menu.addItem((item: MenuItem) => {
					item.setTitle("Set hotkey").setIcon("scissors");
					item.onClick(() => {
						// @ts-ignore
						this.plugin.app.setting.open();
						// @ts-ignore
						this.plugin.app.setting.openTabById("shortcuts");

						if (
							event.target instanceof HTMLElement &&
							event.target.getAttribute("aria-label")
						) {
							const ariaLabel =
								event.target.getAttribute("aria-label") || "";
							this.plugin.settingTab.updateSearchQuery(ariaLabel);
						}
					});
				});
				menu.showAtPosition({ x: event.clientX, y: event.clientY });
			}
		});
	}

	onunload() {
		super.onunload();
		this.mutationObserver.disconnect();
	}

	private handleMutations(mutations: MutationRecord[]) {
		const tooltipsToModify = new Set<HTMLElement>();

		if (!mutations.find((m) => m.type === "childList")) {
			return;
		}

		mutations.forEach((mutation) => {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement) {
						const tooltips = node.findAll(".tooltip");
						tooltips.forEach((tooltip) =>
							tooltipsToModify.add(tooltip as HTMLElement)
						);
					}
				});
			} else if (
				mutation.type === "characterData" ||
				mutation.type === "attributes"
			) {
				const target = mutation.target;
				if (
					target instanceof HTMLElement &&
					target.hasClass("tooltip")
				) {
					tooltipsToModify.add(target);
				}
			}
		});

		if (tooltipsToModify.size > 0) {
			this.debouncedCheckAndModify();
		}
	}

	private checkAndModifyAllTooltips() {
		const tooltips = document.querySelectorAll(".tooltip");
		tooltips.forEach((tooltip) =>
			this.modifyTooltipContent(tooltip as HTMLElement)
		);
	}

	private modifyTooltipContent(tooltipElement: HTMLElement) {
		// 检查 tooltip 是否已经被修改过
		if (tooltipElement.dataset.modified) {
			return;
		}

		const originalContent = tooltipElement.textContent || "";
		tooltipElement.toggleClass("shortcuts-tooltip", true);

		const hotkey = this.plugin.settings.sequences
			.flatMap((s) => s.configs)
			.find((c) => c.id === originalContent);

		if (hotkey) {
			if (hotkey.sequence.length > 0) {
				tooltipElement.createEl(
					"div",
					{
						cls: "shortcuts-hotkey-label",
					},
					(el) => {
						const iconEl = el.createEl("span", {
							cls: "shortcuts-hotkey-label-icon",
						});
						setIcon(iconEl, "scissors");
						hotkey.sequence.forEach((s, index) => {
							el.createSpan({
								text: s.join(" + "),
								cls: "shortcuts-hotkey-label-item",
							});
							if (index < hotkey.sequence.length - 1) {
								el.createSpan({
									text: " then ",
									cls: "shortcuts-hotkey-label-separator",
								});
							}
						});
					}
				);
			}
		}

		tooltipElement.dataset.modified = "true";
	}
}
