import "obsidian";
import { EventRef } from "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById(id: string): void;
		};
	}

	interface View {
		setSortOrder(order: string): void;
	}
}
