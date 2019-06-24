import React from 'react';
import { matchesState } from 'xstate';

import { AppContext } from './app-context.js';

const CtrlButton = ({ icon, label, onClick, isDisabled, className }) => (
	<button
		type="button"
		className={`btn btn-ctrl ${className ? className : 'btn-secondary'}`}
		onClick={onClick}
		disabled={isDisabled}>
		<i className={`mdi mdi-24px ${icon}`} />
		<br /> {label}
	</button>
);

function canStop(machineState) {
	return matchesState('running.analyzing', machineState) || matchesState('running.cleaning', machineState);
}

class Header extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const { machineState } = this.context;
		const { menuCallback, settingsCallback, runCallback, previewCallback } = this.props;

		const isReady = matchesState('ready', machineState);
		const isRunning = matchesState('running', machineState);

		const CleanButton = (
			<CtrlButton
				label="Clean"
				icon="mdi-broom"
				onClick={runCallback}
				isDisabled={!isReady}
				className="btn-primary"
			/>
		);

		const StopButton = (
			<CtrlButton
				label="Stop"
				icon="mdi-stop-circle-outline"
				onClick={runCallback}
				isDisabled={!canStop(machineState)}
				className="btn-danger"
			/>
		);

		return (
			<React.Fragment>
				<CtrlButton
					label="Channels"
					icon="mdi-menu"
					onClick={menuCallback}
					isDisabled={!isReady}
				/>

				<CtrlButton
					label="Preview"
					icon="mdi-magnify"
					onClick={previewCallback}
					isDisabled={!isReady}
				/>

				{isRunning ? StopButton : CleanButton}

				<CtrlButton
					label="Settings"
					icon="mdi-settings"
					onClick={settingsCallback}
					isDisabled={!isReady}
					className="btn-secondary btn-settings"
				/>
			</React.Fragment>
		);
	}
}

Header.contextType = AppContext;

export { Header };
