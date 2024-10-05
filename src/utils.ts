import { KeySequenceConfig } from "./types/key";

export function getAllSupportedShortcuts(): KeySequenceConfig[] {
	const elementList = document.body.findAll("[aria-label]");
	const result: KeySequenceConfig[] = [];

	elementList.forEach((element) => {
		const ariaLabel = element.getAttribute("aria-label");
		if (ariaLabel) {
			result.push({
				sequence: [],
				name: ariaLabel.split("\n")[0],
				action: ariaLabel,
				id: ariaLabel,
				actionType: "ARIA",
			});
		}
	});

	return result;
}
