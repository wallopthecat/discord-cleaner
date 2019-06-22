import path from 'path';
import { spawn } from 'child_process';
import { NotifyIcon, Icon, Menu } from 'not-the-systray';

import { shredder } from './shredder.js';
import { SERVER_URL, wss } from './server.js';
import { isChromeInstalled } from './utils.js';

import iconFile from './assets/trayicon.ico';

const notificationIcon = Icon.load(path.join(__dirname, iconFile), Icon.large);
const trayIcon = Icon.load(path.join(__dirname, iconFile), Icon.small);

const MenuID = {
	EXIT: 1,
	OPEN: 2
};

const trayMenu = new Menu([{ id: MenuID.OPEN, text: 'Open' }, { separator: true }, { id: MenuID.EXIT, text: 'Quit' }]);

let BROWSER = ['']; // use default browser
if (isChromeInstalled()) {
	BROWSER = ['chrome', '--new-window']; // use chrome
}

class Tray {
	constructor() {
		this.notifyIcon = null;

		this.dblClickCheck = false;
		this.dblClickTimeout = null;

		shredder.on('cleaning-complete', this.alertComplete.bind(this));
		shredder.on('error', this.alertError.bind(this));

		shredder.on('analyzing', () => {
			this.notifyIcon.update({ tooltip: 'Discord Cleaner - Analyzing' });
		});

		shredder.on('cleaning', () => {
			this.notifyIcon.update({ tooltip: 'Discord Cleaner - Cleaning' });
		});

		shredder.on('done', () => {
			this.notifyIcon.update({ tooltip: 'Discord Cleaner' });
		});
	}

	start() {
		let onSelect = this.onSelect.bind(this);

		this.notifyIcon = new NotifyIcon({
			icon: trayIcon,
			tooltip: 'Discord Cleaner',
			onSelect
		});

		this.openInterface();
	}

	openInterface() {
		spawn('cmd', ['/C', 'start', '/B', ...BROWSER, `${SERVER_URL}/#Discord-Cleaner`], {
			detached: true,
			windowsHide: true
		});
	}

	onSelect({ target, rightButton, mouseX, mouseY }) {
		if (rightButton) {
			this.handleMenu(mouseX, mouseY);
		} else {
			if (this.dblClickTimeout) clearTimeout(this.dblClickTimeout);

			if (this.dblClickCheck) {
				this.dblClickCheck = false;
				this.openInterface();
				return;
			}

			this.dblClickCheck = true;
			this.dblClickTimeout = setTimeout(() => {
				this.dblClickCheck = false;
			}, 200);
		}
	}

	issueNotification(text, title = 'Discord Cleaner') {
		this.notifyIcon.update({
			notification: {
				icon: notificationIcon,
				title: title,
				text: text
			}
		});
	}

	handleMenu(x, y) {
		const id = trayMenu.showSync(x, y);
		switch (id) {
			case MenuID.EXIT:
				wss.sockets.forEach(ws => ws.disconnect(1001, 'App was closed'));
				process.exit();
				break;
			case MenuID.OPEN: {
				this.openInterface();
				break;
			}
		}
	}

	alertComplete(deletedMessages) {
		let text;
		if (deletedMessages > 0) {
			const noun = deletedMessages === 1 ? 'message' : 'messages';
			text = `${deletedMessages.toLocaleString()} ${noun} deleted`;
		} else {
			text = `No messages could be deleted`;
		}

		this.issueNotification(text, 'Cleaning Complete');
	}

	alertError() {
		this.issueNotification('An error has occurred', 'Error');
	}
}

export const tray = new Tray();
