import React from 'react';

import { GITHUB_URL } from '../../../constants.js';
import { AppContext } from '../app-context.js';
import { Modal } from '../modal.js';

const TokenInput = ({ value, onChange, error }) => (
	<div className="form-group">
		<input
			type="password"
			name="token"
			value={value}
			onChange={onChange}
			className="form-control"
			placeholder="Token"
		/>
		{error ? <div className="text-danger mt-2">{error}</div> : null}
	</div>
);

const EulaCheckbox = ({ value, onChange }) => (
	<div className="form-group custom-control custom-checkbox">
		<input type="checkbox" className="custom-control-input" name="eula" id="eula" onChange={onChange} checked={value} />
		<label className="custom-control-label" htmlFor="eula">
			I have read and agree to the terms of the Discord Cleaner License Agreement.{' '}
			<a href={`${GITHUB_URL}/blob/master/LICENSE.md`} target="_blank" rel="noopener noreferrer">
				Read the license here.
			</a>
		</label>
	</div>
);

class LoginDialog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			eula: false,
			token: '',
			error: ''
		};

		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.onFail = this.onFail.bind(this);
		this.onSuccess = this.onSuccess.bind(this);
	}

	handleSubmit(event) {
		event.preventDefault();

		const { socket } = this.context;
		socket.emit('login', this.state.token);
	}

	componentDidMount() {
		const { socket } = this.context;

		socket.on('login-fail', this.onFail);
		socket.on('login-success', this.onSuccess);
	}

	componentWillUnmount() {
		const { socket } = this.context;

		socket.removeListener('login-fail', this.onFail);
		socket.removeListener('login-success', this.onSuccess);
	}

	onFail(error) {
		console.log(`Login error: ${error}`);
		this.setState({ error: error });
	}

	onSuccess() {
		console.log(`Login successful.`);
	}

	handleInputChange(event) {
		const target = event.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		const name = target.name;

		this.setState({
			[name]: value,
			error: ''
		});
	}

	render() {
		const { token, eula, error } = this.state;
		const canSubmit = eula === true && token;

		return (
			<Modal>
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Setup</h5>
						<a
							href={`${GITHUB_URL}/#setup`}
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-default close">
							<i className="mdi mdi-24px mdi-help-circle text-white" />
						</a>
					</div>
					<div className="modal-body">
						<form autoComplete="off" onSubmit={this.handleSubmit}>
							<TokenInput value={token} onChange={this.handleInputChange} error={error} />
							<EulaCheckbox value={eula} onChange={this.handleInputChange} />
							<div className="form-group">
								<input type="submit" className="btn btn-primary btn-block" value="Set Token" disabled={!canSubmit} />
							</div>
						</form>
						<div className="text-danger">
							Using this app may result in account termination, data loss, and other damages. Use at your own risk.
						</div>
					</div>
				</div>
			</Modal>
		);
	}
}

LoginDialog.contextType = AppContext;

export { LoginDialog };
