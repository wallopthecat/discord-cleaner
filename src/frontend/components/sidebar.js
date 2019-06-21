import React from 'react';
import SimpleBar from 'simplebar-react';

import { ChannelList } from './channel-list.js';
import { AppContext } from './app-context.js';

const ChannelFilter = ({ filter, onChange, onClear }) => {
	return (
		<form className="d-flex" onSubmit={e => e.preventDefault()}>
			<input
				className="channel-list-search form-control"
				type="text"
				value={filter}
				onChange={onChange}
				placeholder="Filter"
			/>
			<div className="form-control-clear">
				{filter ? <button className="btn btn-link text-muted mdi mdi-close" onClick={onClear} /> : null}
			</div>
		</form>
	);
};

class Sidebar extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			filter: ''
		};

		this.onFilterInputChange = this.onFilterInputChange.bind(this);
		this.onClear = this.onClear.bind(this);
		this.onRefresh = this.onRefresh.bind(this);
	}

	onFilterInputChange(event) {
		let filter = event.target.value;
		this.setState({ filter: filter });
	}

	onClear() {
		this.setState({ filter: '' });
	}

	onRefresh() {
		const { socket } = this.context;
		socket.emit('refresh');
	}

	render() {
		const { filter } = this.state;

		return (
			<React.Fragment>
				<div className="channel-list-ctrl row no-gutters flex-nowrap">
					<div className="col flex-fill mr-2">
						<ChannelFilter filter={filter} onChange={this.onFilterInputChange} onClear={this.onClear} />
					</div>
					<div className="col">
						<button
							title="Refresh channel list"
							className="btn btn-outline-secondary text-muted mdi mdi-refresh"
							onClick={this.onRefresh}
							disabled={this.context.machineState !== 'ready'}
						/>
					</div>
				</div>

				<div className="row flex-fill">
					<div className="col d-flex flex-column">
						<div className="channel-list-wrapper flex-fill">
							<SimpleBar style={{ width: '100%', height: '100%' }}>
								<ChannelList filter={filter} />
							</SimpleBar>
						</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

Sidebar.contextType = AppContext;

export { Sidebar };
