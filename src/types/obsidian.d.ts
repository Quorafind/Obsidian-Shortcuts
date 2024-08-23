import "obsidian";
import { EventRef } from "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById(id: string): void;
			listCommands(): Command[];

			app: App;
			editorCommands: Map<string, Command>;
			commands: Map<string, Command>;
		};
	}

	interface View {
		setSortOrder(order: string): void;
	}
}
