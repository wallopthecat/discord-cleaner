
<p align="center">
  <img width="128" height="128" src="https://user-images.githubusercontent.com/46288829/59956401-19ab3c80-945e-11e9-965c-3dd65fd0d91f.png">
</p>
<h2 align="center">Discord Cleaner</h2>

Discord Cleaner is a free and open-source tool that can clean your messages. It can remove your messages across Discord - providing you with more control over your privacy and personal information. This application was developed for educational purposes and to demonstrate technical proficiency.

**WARNING: Using this app may result in account termination, data loss, and other damages. Use at your own risk.**

![Discord Cleaner Screenshot](https://user-images.githubusercontent.com/46288829/59959817-70c80600-948c-11e9-8ab8-5e549094d3c3.png)

###### *All product names, logos, and brands are property of their respective owners. All company, product and service names used in this software are for identification purposes only.*

## Features

- Choose the specific servers, groups, and direct messages you want to clear
- Clean only messages that are older than a certain amount of time
- Preview how many messages will be cleared
- Detailed progress logging

## Installing

Download the latest [Discord Cleaner executable](https://github.com/mcuppi/discord-cleaner/releases/latest). The pre-compiled executable is for 64-bit Windows systems only. Discord Cleaner will check for updates using the GitHub API, but it will not automatically update. You can also download the source code and build the application yourself.

*You are required to read and agree to the [license](https://github.com/mcuppi/discord-cleaner/blob/master/LICENSE.md) before downloading.*

The portable executable was created using [Enigma Virtual Box](https://enigmaprotector.com/en/aboutvb.html).

### Requirements

Discord Cleaner has the following runtime requirements:

- Windows 8.1 (or newer) (64-bit systems only)
- Chrome 75, Firefox 67, or Edge 44 (or newer)

## Setup

### Token
Discord Cleaner requires your authentication token to access your Discord account. To find your token you can use this guide: [How to Find Your Discord Token](https://discordhelp.net/discord-token).

**WARNING: Anyone who knows your Discord token has full access to your account. Do not share it with anyone.**

Discord Cleaner will not remember or save your token. You will be asked for it every time you relaunch the program.

*Even though I've taken steps to secure the application, there is always the chance that using Discord Cleaner could result in your token being compromised. If you're uncomfortable with this possibility, do not use the application.*

### Settings

Discord Cleaner will save your settings (e.g. selected channels, message age limits) to a `config.json` file in the directory the program was started. You can delete this file to reset your settings.


## Build Instructions

1. Clone the repo and and install the npm dependencies:

```sh
npm install
```

2. Then run the webpack build script:

```sh
npm run build
```

3. Once webpack is finished bundling the files, you can start the app using the run script:

```sh
npm run start
```

## Development Philosophy
  
The app runs a local web server that serves the front-end interface — allowing users to access the app through their browser. The front-end [React](https://github.com/facebook/react) interface communicates with the [Node](https://github.com/nodejs/node) back-end using WebSockets. Both connections are currently bound to localhost on port 54733.

There are two main reasons for this design decision:
1. Discord Cleaner could be running for hours. Electron's additional memory usage isn't really acceptable when the app is going to be minimized the entire time.
2. Theoretically, the web server structure allows the app to be hosted remotely. In other words, you could install Discord Cleaner on a server and have it run automatically — persistently cleaning messages.*

**Discord Cleaner is absolutely not ready to be run remotely. **Do not do it.** I need to make significant security improvements before that it is a viable option.*

## Acknowledgements

- Thanks to [Simon Buchan](https://github.com/simonbuchan/node-not-the-systray) for his Windows notification icon library.

## Todo

- Refactor the SCSS
- Add better error handling
- Add additional settings
- More notification icon options and detailed tooltips
- Improve security

## License

[License Agreement](https://github.com/mcuppi/discord-cleaner/blob/master/LICENSE.md)
