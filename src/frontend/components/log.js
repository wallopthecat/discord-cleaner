import React from 'react';
import SimpleBar from 'simplebar-react';

import { AppContext } from './app-context.js';
import { Message } from './message.js';

const DATE_FORMAT = { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };

class Log extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			messages: []
		};

		this.scrollable = React.createRef();

		this.addMessage = this.addMessage.bind(this);
	}

	componentDidMount() {
		const { socket } = this.context;
		socket.on('log', this.addMessage);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isScrolledToBottom() || prevState.messages.length === 0) {
			this.scrollToBottom();
		}
	}

	addMessage(data) {
		let messages = [].concat(data || []); // handle array or single message
		messages.forEach(message => (message.time = new Date(message.time).toLocaleString('en-US', DATE_FORMAT)));

		let newMessages = this.state.messages.concat(messages);
		if (newMessages.length >= 50) {
			newMessages.shift();
		}

		this.setState({ messages: newMessages });
	}

	isScrolledToBottom() {
		const scrollElement = this.scrollable.current.parentNode;
		return scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 100;
	}

	scrollToBottom() {
		const scrollElement = this.scrollable.current.parentNode;
		scrollElement.scrollTop = scrollElement.scrollHeight;
	}

	render() {
		return (
			<div className="card log flex-fill">
				<SimpleBar
					style={{ width: '100%', height: '100%' }}
					data-simplebar-auto-hide="false"
					scrollableNodeProps={{ ref: this.scrollable }}>
					<ol className="log-message-list list-unstyled">
						{this.state.messages.map((message, i) => {
							return (
								<li key={i}>
									<Message time={message.time} text={message.text} type={message.type} key={i} />
								</li>
							);
						})}
					</ol>
				</SimpleBar>
			</div>
		);
	}
}

Log.contextType = AppContext;

export { Log };
