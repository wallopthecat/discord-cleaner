// Shared constants between front-end and back-end

export const VERSION = 'v1.0.0';
export const GITHUB_REPO = 'mcuppi/discord-cleaner';
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

export const RATE_LIMIT = 2000;

export const ChannelType = {
	GUILD_TEXT: 0,
	DM: 1,
	GUILD_VOICE: 2,
	GROUP_DM: 3,
	GUILD_CATEGORY: 4,
	GUILD_NEWS: 5,
	GUILD_STORE: 6
};

export const MessageType = {
	DEFAULT: 0,
	RECIPIENT_ADD: 1,
	RECIPIENT_REMOVE: 2,
	CALL: 3,
	CHANNEL_NAME_CHANGE: 4,
	CHANNEL_ICON_CHANGE: 5,
	CHANNEL_PINNED_MESSAGE: 6,
	GUILD_MEMBER_JOIN: 7
};

export const LogType = {
	DEFAULT: 0,
	SUCCESS: 1,
	ERROR: 2,
	WARNING: 3
};
