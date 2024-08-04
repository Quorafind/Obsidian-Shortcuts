export class HotkeyMonitor {
	private currentSequence: string[] = [];
	private sequenceTimer: NodeJS.Timeout | null = null;
	private shortcuts: ShortcutConfig[];

	constructor(shortcuts: ShortcutConfig[]) {
		this.shortcuts = shortcuts;
	}

	handleKeyDown(event: KeyboardEvent): void {
		const key = this.getKeyString(event);

		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
		}

		this.currentSequence.push(key);

		this.sequenceTimer = setTimeout(() => {
			this.checkAndExecuteShortcut();
			this.resetSequence();
		}, 1000); // 1 second timeout for sequence completion

		this.checkAndExecuteShortcut();
	}

	private getKeyString(event: KeyboardEvent): string {
		let keyString = '';
		if (event.ctrlKey) keyString += 'Ctrl+';
		if (event.altKey) keyString += 'Alt+';
		if (event.shiftKey) keyString += 'Shift+';
		if (event.metaKey) keyString += 'Meta+';
		keyString += event.key;
		return keyString;
	}

	private checkAndExecuteShortcut(): void {
		const sequenceString = this.currentSequence.join(' then ');
		const matchedShortcut = this.shortcuts.find(shortcut => shortcut.shortcut.join(' then ') === sequenceString);

		if (matchedShortcut) {
			console.log(`Executing shortcut: ${matchedShortcut.name}`);
			// Here you would implement the actual shortcut execution logic
			this.resetSequence();
		}
	}

	private resetSequence(): void {
		this.currentSequence = [];
		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
			this.sequenceTimer = null;
		}
	}

	updateShortcuts(shortcuts: ShortcutConfig[]): void {
		this.shortcuts = shortcuts;
	}
}
