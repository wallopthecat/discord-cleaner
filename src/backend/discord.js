import axios from 'axios';
import http from 'http';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import querystring from 'querystring';
import { promisify } from 'util';

import { RATE_LIMIT } from '../constants.js';

const BASE_URL = 'https://discordapp.com/api/v6';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0';

const delay = promisify(setTimeout);

class Discord {
	constructor() {
		this.user = undefined;

		this.api = axios.create({
			baseURL: BASE_URL,
			timeout: 60000,
			httpAgent: new http.Agent({ keepAlive: true }),
			httpsAgent: new https.Agent({ keepAlive: true }),
			maxRedirects: 10,
			maxContentLength: 50 * 1000 * 1000,
			headers: {
				host: 'discordapp.com',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US',
				pragma: 'no-cache',
				'user-agent': USER_AGENT,
				accept: '*/*',
				'cache-control': 'no-cache',
				referer: 'https://discordapp.com/'
			},
			validateStatus: status => {
				if (status === 202) return false;
				return status >= 200 && status < 300; // default
			}
		});

		rateLimit(this.api, { maxRequests: 1, perMilliseconds: RATE_LIMIT });
	}

	setAuth(auth) {
		this.api.defaults.headers['authorization'] = auth;
	}

	setUser(user) {
		console.log(`Logged in as: ${user.username}`);
		this.user = user;
	}

	async makeCall(config) {
		let attempts = 0;

		while (true) {
			try {
				const response = await this.api.request(config);
				return response.data;
			} catch (error) {
				if (error.response) {
					const status = error.response.status;

					if (status === 202 || status === 429) {
						if (attempts++ >= 3) throw error;
						await delay(RATE_LIMIT * 2);
						continue; // retry
					}
				}

				throw error;
			}
		}
	}

	async getChannel(channelID) {
		return await this.makeCall({ url: `/channels/${channelID}` });
	}

	async getUserChannels() {
		return await this.makeCall({ url: `/users/@me/channels` });
	}

	async getUserGuilds() {
		return await this.makeCall({ url: `/users/@me/guilds` });
	}

	async getGuildChannels(guildID) {
		return await this.makeCall({ url: `/guilds/${guildID}/channels` });
	}

	async deleteMessage(channelID, messageID) {
		return await this.makeCall({
			url: `/channels/${channelID}/messages/${messageID}`,
			method: 'delete'
		});
	}

	async editMessage(channelID, messageID, message) {
		return await this.makeCall({
			url: `/channels/${channelID}/messages/${messageID}`,
			method: 'patch',
			data: { content: message }
		});
	}

	async searchChannel(channelID, options) {
		let query = querystring.stringify(options);

		return await this.makeCall({
			url: `/channels/${channelID}/messages/search?${query}`
		});
	}

	async searchGuild(guildID, options) {
		let query = querystring.stringify(options);

		return await this.makeCall({
			url: `/guilds/${guildID}/messages/search?${query}`
		});
	}

	async getCurrentUser() {
		return await this.makeCall({ url: `/users/@me` });
	}
}

export const discord = new Discord();
