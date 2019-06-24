import React from 'react';
import { matchesState } from 'xstate';

import { RATE_LIMIT } from '../../constants.js';
import { AppContext } from './app-context.js';

const IconIndicator = ({ machineState }) => {
	let icon = 'mdi-help';

	if (matchesState('ready', machineState)) {
		icon = 'mdi-check';
	} else if (matchesState('running', machineState)) {
		if (matchesState('running.starting', machineState)) icon = 'mdi-dots-horizontal';
		if (matchesState('running.stopping', machineState)) icon = 'mdi-pause';
		if (matchesState('running.analyzing', machineState)) icon = 'mdi-magnify';
		if (matchesState('running.cleaning', machineState)) icon = 'mdi-delete-outline';
	}

	return (
		<div className="d-flex align-items-center justify-content-center">
			<div
				className="spinner-border"
				style={{ borderRightColor: matchesState('running', machineState) ? 'transparent' : 'inherit' }}
			/>
			<i className={`mdi mdi-48px ${icon}`} />
		</div>
	);
};

const StatusIndicator = ({ name, status }) => {
	return (
		<div className="col-sm mt-1 mb-1 text-truncate">
			<div className="indicator-title text-muted">{name}:</div> {status}
		</div>
	);
};

function getStateLabel(machineState) {
	if (matchesState('ready', machineState)) {
		return 'Ready';
	} else if (matchesState('running', machineState)) {
		if (matchesState('running.starting', machineState)) return 'Starting';
		if (matchesState('running.stopping', machineState)) return 'Stopping';
		if (matchesState('running.analyzing', machineState)) return 'Analyzing';
		if (matchesState('running.cleaning', machineState)) return 'Cleaning';
	} else {
		return '...';
	}
}

function getStateColor(machineState) {
	if (matchesState('running', machineState)) {
		if (matchesState('running.starting', machineState)) return 'light';
		if (matchesState('running.analyzing', machineState)) return 'primary';
		if (matchesState('running.cleaning', machineState)) return 'success';
		if (matchesState('running.stopping', machineState)) return 'danger';
	} else {
		return 'muted';
	}
}

class Progress extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			channel: null,
			count: 0,
			total: 0
		};
	}

	componentDidMount() {
		const { socket } = this.context;

		socket.on('progress', this.onProgressUpdate.bind(this));
	}

	onProgressUpdate(state) {
		this.setState(state);
	}

	render() {
		const { machineState } = this.context;
		const { channel, count, total } = this.state;

		const percent = count ? (count / total) * 100 : 0;
		const diff = (total - count) * RATE_LIMIT;
		const time = new Date(diff).toISOString().substr(11, 8);
		const color = getStateColor(machineState);

		return (
			<div className="progress-wrapper">
				<div className="progress">
					<div className={`progress-bar bg-${color}`} style={{ width: `${percent}%` }} />
				</div>

				<div className="card mt-3 p-3">
					<div className="row">
						<div className={`col-md-2 progress-icon-wrapper d-flex justify-content-center text-${color}`}>
							<IconIndicator machineState={machineState} />
						</div>
						<div className="col align-self-center">
							<div className="row justify-content-start">
								<StatusIndicator name={'Status'} status={getStateLabel(machineState)} />
								<StatusIndicator name={'Channel'} status={channel ? channel.name : '...'} />
								<div className="w-100 d-xl-none" />
								<StatusIndicator name={'Time remaining'} status={time} />
								<StatusIndicator name={'Items remaining'} status={(total - count).toLocaleString()} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

Progress.contextType = AppContext;

export { Progress };
