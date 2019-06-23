import fs from 'fs';
import path from 'path';

import axios from 'axios';
import { Machine, interpret } from 'xstate';

import { VERSION, GITHUB_API_URL, ChannelType } from '../constants.js';
import { HOST, PORT, httpServer, wss } from './server.js';
import { discord } from './discord.js';
import { log } from './log.js';
import { shredder } from './shredder.js';
import { gc } from './gc.js';

// windows only
import { tray } from './tray.js';

// config constants
const CONFIG_FILENAME = 'config.json';
const CONFIG_DIR = 'Discord Cleaner';
const CONFIG_BASEPATH = process.env.APPDATA ? path.join(process.env.APPDATA, CONFIG_DIR) : __dirname;
const CONFIG_PATH = path.join(CONFIG_BASEPATH, CONFIG_FILENAME);
const DEFAULT_CONFIG = {
	limit: 14,
	selected: []
};

class App {
	constructor() {
		const config = this.loadConfig();

		this.channels = [];
		this.selected = config.selected;

		shredder.limit = config.limit;

		wss.on('connection', this.onConnection.bind(this));
		wss.on('disconnect', this.onDisconnect.bind(this));

		shredder.on('analyzing', this.onShredderAnalyzing.bind(this));
		shredder.on('cleaning', this.onShredderCleaning.bind(this));
		shredder.on('done', this.onShredderDone.bind(this));
		shredder.on('progress', this.onShredderProgress.bind(this));

		this.appMachine = Machine({
			id: 'app',
			initial: 'initializing',
			states: {
				initializing: {
					type: 'compound',
					initial: 'checking_update',
					states: {
						checking_update: {
							invoke: {
								id: 'checkUpdate',
								src: this.checkUpdate.bind(this),
								onDone: [
									{ target: 'update_available', cond: (context, event) => event.data === false },
									{ target: 'awaiting_token' }
								]
							}
						},
						awaiting_token: {
							on: { login: 'logging_in' }
						},
						logging_in: {
							invoke: {
								id: 'tryLogin',
								src: this.tryLogin.bind(this),
								onDone: 'success',
								onError: 'awaiting_token'
							}
						},
						update_available: {},
						success: { type: 'final' }
					},
					onDone: 'ready'
				},
				ready: {
					on: {
						start: 'running',
						refresh: 'refreshing'
					}
				},
				refreshing: {
					invoke: {
						id: 'refreshChannels',
						src: this.updateChannelList.bind(this),
						onDone: 'ready',
						onError: 'ready'
					}
				},
				running: {
					onEntry: this.onRun.bind(this),
					type: 'compound',
					initial: 'starting',
					states: {
						starting: { onEntry: this.startShredder.bind(this) },
						stopping: { onEntry: this.stopShredder.bind(this) },
						analyzing: {},
						cleaning: {}
					},
					on: {
						// keep track of shredder machine
						analyzing: '.analyzing',
						cleaning: '.cleaning',
						stop: '.stopping',
						done: 'ready'
					}
				}
			}
		});

		this.service = interpret(this.appMachine).start();
		this.service.onTransition(this.onStateTransition.bind(this));

		// start server
		httpServer.listen({ host: HOST, port: PORT }, this.onServerStarted.bind(this)); //TODO refactor this later
	}

	/** Internal Events **/

	onServerStarted() {
		console.log(`Server is listening on port ${PORT}`);
		tray.start(); // windows only
	}

	onStateTransition(state) {
		wss.emit('state', state.value);
	}

	onRun() {
		this.saveConfig(); // fire and forget
	}

	/** Shredder Control **/

	async startShredder(context, event) {
		log.add(`Starting ${event.preview ? 'preview' : 'cleaner'}`);

		let channels = await this.updateChannelList(); // update the channel list before running

		shredder.service.send('start', {
			channels: channels,
			selected: this.selected,
			preview: event.preview
		}); // forward event to shredder

		gc(); // Improve RAM usage
	}

	stopShredder() {
		shredder.service.send('stop');
	}

	onShredderAnalyzing() {
		this.service.send('analyzing');
	}

	onShredderCleaning() {
		this.service.send('cleaning');
	}

	onShredderDone() {
		gc(); // Improve RAM usage

		this.service.send('done');
	}

	onShredderProgress(update) {
		wss.emit('progress', update);
	}

	/** WebSocket Events **/

	onConnection(socket) {
		// don't allow more than one connection
		if (wss.sockets.size > 1) {
			if (wss.sockets.size > 1) {
				wss.sockets.forEach(ws => {
					if (ws !== socket) ws.disconnect(4000, 'Please keep only one window open');
				});
			}
		}

		// Setup Websocket RPCs
		socket.on('login', (...args) => this.onLoginRequest.apply(this, [socket, ...args]));
		socket.on('run', (...args) => this.onRunRequest.apply(this, [socket, ...args]));
		socket.on('stop', (...args) => this.onStopRequest.apply(this, [socket, ...args]));
		socket.on('select', (...args) => this.onSelect.apply(this, [socket, ...args]));
		socket.on('refresh', (...args) => this.onRefreshRequest.apply(this, [socket, ...args]));
		socket.on('settings-request', (...args) => this.onSettingsRequest.apply(this, [socket, ...args]));
		socket.on('settings-save', (...args) => this.onSetSettings.apply(this, [socket, ...args]));

		// Send current app state
		socket.emit('state', this.service.state.value);

		// Send current progress
		const progress = shredder.getProgress();
		socket.emit('progress', progress);

		// Send log history
		socket.emit('log', log.messages);

		// Send current channel list
		if (this.channels && this.channels.length) {
			socket.emit('channel-list', this.channels, this.selected);
		}
	}

	onLoginRequest(socket, token) {
		this.service.send('login', { socket: socket, token: token });
	}

	onRunRequest(socket, options = { preview: false }) {
		if (!this.selected.length) return;

		this.service.send('start', { preview: options.preview });
	}

	onStopRequest() {
		this.service.send('stop');
	}

	onSelect(socket, selectedChannels) {
		this.selected = selectedChannels;
	}

	onRefreshRequest() {
		this.service.send('refresh');
	}

	onSettingsRequest(socket) {
		const settings = {
			limit: shredder.limit
		};

		socket.emit('settings', settings);
	}

	onSetSettings(socket, settings) {
		shredder.limit = parseInt(settings.limit);
		this.saveConfig();
	}

	onDisconnect(socket) {
		socket.removeAllListeners('login');
		socket.removeAllListeners('run');
		socket.removeAllListeners('stop');
		socket.removeAllListeners('select');
		socket.removeAllListeners('refresh');
		socket.removeAllListeners('settings-request');
		socket.removeAllListeners('settings-save');
	}

	/** Functions **/

	async checkUpdate() {
		if (process.env.NODE_ENV === 'production') {
			try {
				const github = await axios.get(`${GITHUB_API_URL}/releases/latest`);
				if (github.data.tag_name === VERSION) {
					console.log('Discord Cleaner is up to date');
					return true;
				} else {
					console.log('Discord Cleaner requires an update');
					return false;
				}
			} catch (error) {
				console.error('Update check failed');
				return true; // proceed regardless
			}
		} else {
			console.log('Skipping update check in dev mode');
			return true;
		}
	}

	async tryLogin(context, props) {
		const { socket, token } = props;

		discord.setAuth(token);

		try {
			// get user
			const user = await discord.getCurrentUser();
			discord.setUser(user);

			// get channel list
			await this.updateChannelList();

			socket.emit('login-success');
		} catch (error) {
			const reason = this.handleLoginError(error);
			socket.emit('login-fail', reason);
			throw error;
		}
	}

	async updateChannelList() {
		this.channels = null; // help gc

		try {
			const dms = await discord.getUserChannels();
			const guilds = await discord.getUserGuilds();

			this.channels = [...dms, ...guilds].map(channel => {
				return {
					id: channel.id,
					name: channel.name
						? channel.name
						: channel.recipients.length
						? channel.recipients.map(r => r.username).join(', ')
						: 'Unnamed',
					type: channel.type ? channel.type : ChannelType.GUILD_TEXT
				};
			});

			// remove any selected channels that are no longer in the list
			this.selected = this.channels.reduce((valid, channel) => {
				if (this.selected.includes(channel.id)) valid.push(channel.id);
				return valid;
			}, []);

			// emit the update
			wss.emit('channel-list', this.channels, this.selected);

			return this.channels;
		} catch (error) {
			console.error(error.message);
			throw error;
		}
	}

	/** Config Handling **/

	loadConfig() {
		try {
			const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
			return Object.assign({}, DEFAULT_CONFIG, config);
		} catch (err) {
			return DEFAULT_CONFIG;
		}
	}

	async saveConfig() {
		try {
			const config = {
				limit: shredder.limit,
				selected: this.selected
			};

			if (!fs.existsSync(CONFIG_BASEPATH)) {
				fs.mkdirSync(CONFIG_BASEPATH);
			}

			fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, '\t'));
		} catch (err) {
			console.error(err);
		}
	}

	/** Error Handling **/

	handleLoginError(error) {
		if (error.code) {
			if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') return 'Internet connection error';
			if (error.code === 'ECONNREFUSED') return 'Discord refused the connection';
		}

		if (error.response) {
			if (error.response.status === 429) return 'Too many requests';
			if (error.response.status === 401) return 'Token was rejected';
		}

		return error.message;
	}
}

new App();
