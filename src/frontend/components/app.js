import React from 'react';
import WebSocketWrapper from 'ws-wrapper';
import { matchesState } from 'xstate';

/** Components **/
import { AppContext } from './app-context.js';
import { Sidebar } from './sidebar.js';
import { Header } from './header.js';
import { Log } from './log.js';
import { Progress } from './progress.js';

/** Modals **/
import { Spinner } from './modals/spinner.js';
import { ErrorDialog } from './modals/error.js';
import { UpdateDialog } from './modals/update.js';
import { SettingsDialog } from './modals/settings.js';
import { LoginDialog } from './modals/login.js';

const PARSED_URL = new URL(window.location.href);
const WS_URL = `ws://localhost:${PARSED_URL.port}`;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			machineState: 'connecting',
			error: undefined,
			showSidebar: true,
			showSettings: false
		};

		this.toggleSettings = this.toggleSettings.bind(this);
		this.toggleSidebar = this.toggleSidebar.bind(this);
		this.toggleRun = this.toggleRun.bind(this);
		this.requestPreview = this.requestPreview.bind(this);

		const socket = new WebSocketWrapper(new WebSocket(WS_URL));
		socket.on('connect', this.onConnect.bind(this));
		socket.on('disconnect', this.onDisconnect.bind(this));
		socket.on('error', this.onSocketError.bind(this));
		socket.on('state', this.onMachineStateUpdate.bind(this));

		this.socket = socket;
	}

	/** Websocket Events **/

	onConnect() {}

	onSocketError(event) {
		console.error(event);
		this.setState({
			machineState: 'failure',
			error: 'Socket error'
		});
	}

	onDisconnect(event) {
		// attempt to close window for a natural shut down or for multiple windows
		if (event.code === 1001 || event.code === 4000) {
			window.close();
		}

		this.setState({
			machineState: 'failure',
			error: event.reason
		});
	}

	onMachineStateUpdate(state) {
		this.setState({ machineState: state });
	}

	/** Control Callbacks **/

	toggleRun() {
		const { machineState } = this.state;

		if (matchesState('ready', machineState)) {
			this.socket.emit('run');
		} else if (matchesState('running', machineState)) {
			this.socket.emit('stop');
		}
	}

	toggleSettings() {
		this.setState({ showSettings: !this.state.showSettings });
	}

	toggleSidebar() {
		this.setState({ showSidebar: !this.state.showSidebar });
	}

	requestPreview() {
		this.socket.emit('run', { preview: true });
	}

	/** Utilities **/

	isLoading() {
		const { machineState } = this.state;

		return (
			matchesState('connecting', machineState) ||
			matchesState('initializing.logging_in', machineState) ||
			matchesState('refreshing', machineState)
		);
	}

	/** Render **/

	render() {
		const { machineState, showSidebar, showSettings } = this.state;

		const showSpinner = this.isLoading();
		const showUpdate = matchesState('initializing.update_available', machineState);
		const showLogin = matchesState('initializing', machineState);
		const showError = matchesState('failure', machineState);

		return (
			<AppContext.Provider value={{ machineState: machineState, socket: this.socket }}>
				<div className="container-fluid d-flex flex-column">
					<div className="row header-wrapper bg-dark">
						<div className="col text-left">
							<Header
								menuCallback={this.toggleSidebar}
								settingsCallback={this.toggleSettings}
								runCallback={this.toggleRun}
								previewCallback={this.requestPreview}
							/>
						</div>
					</div>

					<div className="row flex-fill">
						<div className={showSidebar ? 'col-md-3 sidebar-wrapper d-flex flex-column' : 'd-none'}>
							<Sidebar />
						</div>

						<div className="col main-wrapper d-flex flex-column">
							<div className="row">
								<div className="col">
									<Progress />
								</div>
							</div>

							<div className="row flex-fill">
								<div className="col log-wrapper d-flex flex-column">
									<Log />
								</div>
							</div>
						</div>
					</div>

					{showLogin ? <LoginDialog /> : null}
					{showSettings ? <SettingsDialog closeCallback={this.toggleSettings} /> : null}
					{showError ? <ErrorDialog reason={this.state.error} /> : null}
					{showUpdate ? <UpdateDialog /> : null}
					{showSpinner ? <Spinner /> : null}
				</div>
			</AppContext.Provider>
		);
	}
}

export { App };
