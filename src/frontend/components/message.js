import React from 'react';

import { LogType } from '../../constants.js';

class Message extends React.Component {
	renderType(type) {
		if (type === LogType.DEFAULT) return 'default';
		if (type === LogType.SUCCESS) return 'text-success';
		if (type === LogType.WARNING) return 'text-warning';
		if (type === LogType.ERROR) return 'text-danger';
	}

	render() {
		const { time, text, type } = this.props;
		const style = this.renderType(type);

		return (
			<dl className={`row log-message ${style} no-gutters`}>
				<dt className="col log-message-time text-muted align-self-center">{time}</dt>
				<dd className="col log-message-text">{text}</dd>
			</dl>
		);
	}
}

export { Message };
