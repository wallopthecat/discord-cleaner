import { wss } from './server.js';
import { shredder } from './shredder.js';

import { LogType, ChannelType } from '../constants.js';
import { formatDays } from './utils.js';

class Log {
	constructor() {
		this.messages = [];

		shredder.on('start', this.announceStart.bind(this));
		shredder.on('stopped', this.announceStopped.bind(this));
		shredder.on('analysis-complete', this.announceAnalysisComplete.bind(this));
		shredder.on('cleaning-complete', this.announceCleaningComplete.bind(this));
		shredder.on('channel-analyzed', this.announceChannelAnalyzed.bind(this));
		shredder.on('channel-cleaned', this.announceChannelCleaned.bind(this));
		shredder.on('error', this.announceError.bind(this));
	}

	add(text, type = LogType.DEFAULT) {
		const time = new Date();
		const message = {
			time: time.getTime(),
			text: text,
			type: type
		};

		if (this.messages.length >= 50) {
			this.messages[0] = null; // help gc
			this.messages.shift();
		}

		this.messages.push(message);
		wss.emit('log', message);
	}

	announceStart(isPreview) {
		const condition = shredder.limit > 0 ? `messages older than ${formatDays(shredder.limit)}` : 'all messages';

		if (isPreview) {
			this.add(`Previewing ${condition}`);
		} else {
			this.add(`Cleaning ${condition}`);
		}
	}

	announceStopped() {
		this.add(`Process stopped`);
	}

	announceChannelAnalyzed(channel) {
		const total = channel.messages;
		const preposition = channel.type === ChannelType.DM ? 'with' : 'in';
		if (total > 0) {
			const noun = total === 1 ? 'message' : 'messages';
			this.add(`Found ${total.toLocaleString()} possible ${noun} ${preposition} ${channel.name}`);
		} else {
			this.add(`No messages found ${preposition} ${channel.name}`);
		}
	}

	announceAnalysisComplete(totalMessages) {
		if (totalMessages > 0) {
			const noun = totalMessages === 1 ? 'message' : 'messages';
			this.add(`Analysis complete: ${totalMessages.toLocaleString()} possible ${noun} found`, LogType.SUCCESS);
		} else {
			this.add(`Analysis complete: No messages found`, LogType.SUCCESS);
		}
	}

	announceCleaningComplete(totalMessages) {
		if (totalMessages > 0) {
			const noun = totalMessages === 1 ? 'message' : 'messages';
			this.add(`Cleaning complete: ${totalMessages.toLocaleString()} ${noun} deleted`, LogType.SUCCESS);
		} else {
			this.add(`Cleaning complete: No messages could be deleted`, LogType.SUCCESS);
		}
	}

	announceChannelCleaned(channel, deletedMessages) {
		const preposition = channel.type === ChannelType.DM ? 'with' : 'in';
		if (deletedMessages) {
			const noun = deletedMessages === 1 ? 'message' : 'messages';
			this.add(`Deleted ${deletedMessages.toLocaleString()} ${noun} ${preposition} ${channel.name}`);
		} else {
			this.add(`No messages could be deleted ${preposition} ${channel.name}`);
		}
	}

	announceError(error) {
		this.add(`Fatal error: ${error.message}`, LogType.ERROR);
	}
}

export const log = new Log();
