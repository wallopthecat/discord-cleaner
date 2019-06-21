import fs from 'fs';
import path from 'path';

import long from 'long';

export function isChromeInstalled() {
	const suffix = `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`;
	const prefixes = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']].filter(Boolean);

	for (let prefix of prefixes) {
		const chromePath = path.join(prefix, suffix);
		try {
			if (fs.existsSync(chromePath)) return true;
		} catch (error) {
			return false;
		}
	}

	return false;
}

export function formatDays(days) {
	if (days === 1) {
		return '24 hours';
	} else if (days <= 7) {
		return `${days} days`;
	} else if (days <= 28) {
		return `${parseInt(days / 7)} weeks`;
	} else {
		return `${parseInt(days / 30)} months`;
	}
}

export function calculateOffset(limit) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - limit);
	return long
		.fromNumber(cutoff.getTime() - 14200704e5)
		.shiftLeft(22)
		.toString();
}
