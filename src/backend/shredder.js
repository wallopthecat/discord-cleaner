import EventEmitter from 'eventemitter3';
import { Machine, interpret, assign } from 'xstate';

import { discord } from './discord.js';
import { gc } from './gc.js';

import { ChannelType, MessageType } from '../constants.js';
import { calculateOffset } from './utils.js';

class Shredder extends EventEmitter {
	constructor() {
		super();

		this.limit = 14; // default 2 week age limit

		this.progress = {
			channel: null,
			count: 0,
			total: 0
		};

		this.shredMachine = Machine({
			id: 'shredder',
			context: {
				preview: false
			},
			initial: 'ready',
			states: {
				ready: {
					onEntry: this.onReady.bind(this),
					on: {
						start: {
							actions: [
								assign((context, event) => ({
									channels: event.channels,
									selected: event.selected,
									preview: event.preview
								})),
								this.onStart.bind(this)
							],
							target: 'analyzing'
						}
					}
				},
				analyzing: {
					onEntry: this.onAnalyze.bind(this),
					invoke: {
						id: 'analyzer',
						src: this.startAnalysis.bind(this),
						onDone: [
							{ target: 'finished', cond: context => context.preview === true },
							{ target: 'finished', cond: (context, event) => event.data === 0 },
							{ target: 'cleaning' }
						],
						onError: 'failure'
					},
					on: { stop: 'stopping' }
				},
				cleaning: {
					onEntry: this.onClean.bind(this),
					invoke: {
						id: 'cleaner',
						src: this.startClean.bind(this),
						onDone: 'finished',
						onError: 'failure'
					},
					on: { stop: 'stopping' }
				},
				stopping: {
					on: {
						stopped: {
							target: 'finished',
							actions: this.onStopped.bind(this)
						}
					}
				},
				failure: {
					type: 'final',
					onEntry: this.onFailure.bind(this)
				},
				finished: { type: 'final' }
			},
			onDone: { target: 'ready', actions: this.onDone.bind(this) }
		});

		this.service = interpret(this.shredMachine).start();
	}

	/** Internal Events **/

	onReady() {
		this.emit('ready');
	}

	onStart(context) {
		this.emit('start', context.preview);
	}

	onDone(context, event) {
		this.clearProgress();
		this.emit('done', event);
	}

	onStopped() {
		this.emit('stopped');
	}

	onAnalyze() {
		this.emit('analyzing');
	}

	onClean() {
		this.emit('cleaning');
	}

	onFailure(context, event) {
		const error = event.data;
		this.emit('error', error);
	}

	/** Progress Functions **/

	getProgress() {
		return this.progress;
	}

	clearProgress() {
		this.updateProgress({
			channel: null,
			count: 0,
			total: 0
		});
	}

	updateProgress(update) {
		this.progress = Object.assign(this.progress, update);
		this.emit('progress', update);
		update = null; // help gc
	}

	checkCancel() {
		if (this.service.state.value === 'stopping') {
			throw new Error('canceled');
		} else {
			return false;
		}
	}

	/** Cleaning Functions **/

	async shredMessage(message) {
		await discord.deleteMessage(message.channel_id, message.id); // delete message
	}

	async getMessages(channel, options) {
		return await (channel.type === ChannelType.GUILD_TEXT
			? discord.searchGuild(channel.id, options)
			: discord.searchChannel(channel.id, options));
	}

	async startAnalysis(context) {
		const { channels, selected } = context;

		let totalMessages = 0;

		const options = {
			author_id: discord.user.id,
			context_size: 0,
			include_nsfw: true,
			max_id: calculateOffset(this.limit)
		};

		try {
			this.updateProgress({ total: selected.length });

			for (const id of selected) {
				let channel = channels.find(channel => channel.id === id);

				if (channel) {
					this.updateProgress({ channel: channel, count: ++this.progress.count });

					let results = await this.getMessages(channel, options);
					channel.messages = results.total_results;
					totalMessages += results.total_results;

					this.emit('channel-analyzed', channel);
				}

				this.checkCancel();
			}

			this.emit('analysis-complete', totalMessages);

			// reset progress with new total
			this.updateProgress({
				channel: null,
				count: 0,
				total: totalMessages
			});

			return totalMessages;
		} catch (error) {
			if (error.message === 'canceled') {
				return this.service.send('stopped');
			}

			throw error;
		}
	}

	async startClean(context) {
		const { channels, selected } = context;

		try {
			let deletedMessages = 0;

			for (const id of selected) {
				const channel = channels.find(channel => channel.id === id);

				if (channel && channel.messages) {
					this.updateProgress({ channel: channel });
					deletedMessages += await this.shredChannel(channel);
				}

				gc(); // Improve RAM usage

				this.checkCancel();
			}

			this.emit('cleaning-complete', deletedMessages);
			return deletedMessages;
		} catch (error) {
			if (error.message === 'canceled') {
				return this.service.send('stopped');
			}

			throw error;
		}
	}

	async shredChannel(channel) {
		let deletedMessages = 0;

		let options = {
			author_id: discord.user.id,
			context_size: 0,
			include_nsfw: true,
			max_id: calculateOffset(this.limit)
		};

		// fetch the initial results
		let results = await this.getMessages(channel, options);

		// primary shred loop
		while (results.messages.length) {
			let messages = results.messages.flat(); // flatten the array

			for (const message of messages) {
				if (message.type === MessageType.DEFAULT) {
					await this.shredMessage(message);
					this.updateProgress({ count: ++this.progress.count });
					deletedMessages++;
				} else {
					this.progress.count++; // avoid spamming progress updates
				}

				this.checkCancel();
			}

			gc(); // Improve RAM usage

			// shift the max id to the last message in the array
			// and get new set of messages for the next loop
			options.max_id = messages[messages.length - 1].id;
			results = await this.getMessages(channel, options);

			this.updateProgress({ count: this.progress.count }); //TODO possibly unnecessary
		}

		this.emit('channel-cleaned', channel, deletedMessages);
		return deletedMessages;
	}
}

export const shredder = new Shredder();
