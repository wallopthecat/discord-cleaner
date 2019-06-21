import React from 'react';
import Select from 'react-select';

import { Modal } from '../modal.js';
import { AppContext } from '../app-context.js';

const RANGE_OPTIONS = [
	{ value: 0, label: 'No limit' },
	{ value: 1, label: '24 hours' },
	{ value: 7, label: '7 days' },
	{ value: 14, label: '2 weeks' },
	{ value: 28, label: '4 weeks' },
	{ value: 183, label: '6 months' },
	{ value: 365, label: '12 months' }
];

const COLOR_STYLES = {
	control: styles => ({
		...styles,
		border: 'none',
		boxShadow: 'none',
		'&:hover': {
			backgroundColor: '#121315'
		},
		backgroundColor: '#202225'
	}),
	indicatorSeparator: () => ({
		display: 'none'
	}),
	dropdownIndicator: styles => ({
		...styles,
		borderColor: '#36393f'
	}),
	menu: styles => ({
		...styles,
		backgroundColor: '#202225'
	}),
	option: (styles, state) => {
		return {
			...styles,
			color: '#b9bbbe',
			backgroundColor: state.isSelected ? '#121315' : null,
			'&:hover': {
				backgroundColor: '#2a2c30'
			}
		};
	},
	singleValue: styles => {
		return {
			...styles,
			color: '#b9bbbe'
		};
	}
};

class SettingsDialog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			initializing: true,
			settings: {
				range: RANGE_OPTIONS[0]
			}
		};

		this.handleChange = this.handleChange.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.saveChanges = this.saveChanges.bind(this);
	}

	componentDidMount() {
		const { socket } = this.context;
		socket.on('settings', this.onSettings);
		socket.emit('settings-request');
	}

	componentWillUnmount() {
		const { socket } = this.context;
		socket.removeListener('settings', this.onSettings);
	}

	onSettings(settings) {
		const item = RANGE_OPTIONS.find(option => option.value === settings.limit);

		this.setState({
			initializing: false,
			settings: {
				range: item
			}
		});
	}

	handleChange(selectedOption) {
		this.setState({ settings: { range: selectedOption } });
	}

	saveChanges() {
		const { socket } = this.context;
		const { closeCallback } = this.props;
		const { settings } = this.state;

		const payload = {
			limit: settings.range.value
		};

		socket.emit('settings-save', payload);

		if (typeof closeCallback === 'function') {
			closeCallback();
		}
	}

	render() {
		const { closeCallback } = this.props;

		return (
			<Modal>
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Settings</h5>
						<button type="button" className="close" onClick={closeCallback}>
							<i className="mdi mdi-24px mdi-window-close" />
						</button>
					</div>
					<div className="modal-body">
						<p>Only delete messages older than:</p>
						<Select
							value={this.state.settings.range}
							options={RANGE_OPTIONS}
							styles={COLOR_STYLES}
							onChange={this.handleChange}
							isSearchable={false}
							isDisabled={this.state.initializing}
						/>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn text-white btn-link" onClick={closeCallback}>
							Cancel
						</button>
						<button type="button" className="btn btn-primary" onClick={this.saveChanges}>
							Save changes
						</button>
					</div>
				</div>
			</Modal>
		);
	}
}

SettingsDialog.contextType = AppContext;

export { SettingsDialog };
