import React from 'react';
import { matchesState } from 'xstate';

import { AppContext } from './app-context.js';

const CtrlButton = ({ handleClick, isDisabled, children, className }) => (
	<button
		type="button"
		className={`btn btn-ctrl ${className ? className : ''}`}
		onClick={handleClick}
		disabled={isDisabled}>
		{children}
	</button>
);

class Header extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const { machineState } = this.context;
		const { menuCallback, settingsCallback, runCallback, previewCallback } = this.props;

		const isReady = matchesState('ready', machineState);
		const isRunning = matchesState('running', machineState);
		const canStop = matchesState('running.analyzing', machineState) || matchesState('running.cleaning', machineState);

		const CleanButton = (
			<CtrlButton handleClick={runCallback} className="btn-primary" isDisabled={!isReady}>
				<i className="mdi mdi-24px mdi-broom" />
				<br /> Clean
			</CtrlButton>
		);

		const StopButton = (
			<CtrlButton handleClick={runCallback} className="btn-danger" isDisabled={!canStop}>
				<i className="mdi mdi-24px mdi-stop-circle-outline" />
				<br /> Stop
			</CtrlButton>
		);

		return (
			<React.Fragment>
				<CtrlButton className="btn-secondary" handleClick={menuCallback}>
					<i className="mdi mdi-24px mdi-format-list-checkbox" />
					<br /> Channels
				</CtrlButton>

				<CtrlButton className="btn-secondary" handleClick={previewCallback} isDisabled={!isReady}>
					<i className="mdi mdi-24px mdi-magnify" />
					<br /> Preview
				</CtrlButton>

				{isRunning ? StopButton : CleanButton}

				<CtrlButton className="btn-settings btn-secondary" handleClick={settingsCallback} isDisabled={!isReady}>
					<i className="mdi mdi-24px mdi-settings" />
					<br /> Settings
				</CtrlButton>
			</React.Fragment>
		);
	}
}

Header.contextType = AppContext;

export { Header };
