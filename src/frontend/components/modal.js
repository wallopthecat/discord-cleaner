import React from 'react';
import ReactDOM from 'react-dom';

const MODAL_ROOT = document.getElementById('modal-root');

class Modal extends React.Component {
	constructor(props) {
		super(props);

		this.el = document.createElement('div');
		this.dialog = React.createRef();

		this.handleClick = this.handleClick.bind(this);
	}

	componentDidMount() {
		const { onOpen } = this.props;

		if (typeof onOpen === 'function') {
			onOpen();
		}

		MODAL_ROOT.appendChild(this.el);
	}

	componentWillUnmount() {
		const { onClose } = this.props;

		if (typeof onClose === 'function') {
			onClose();
		}

		MODAL_ROOT.removeChild(this.el);
	}

	handleClick(event) {
		const { onClick } = this.props;

		if (event.target === this.dialog.current) {
			if (typeof onClick === 'function') {
				onClick();
			}
		}
	}

	render() {
		const { className, children } = this.props;

		return ReactDOM.createPortal(
			<div className="modal" ref={this.dialog} onClick={this.handleClick}>
				<div className={`modal-dialog modal-dialog-centered ${className}`}>{children}</div>
			</div>,
			this.el
		);
	}
}

export { Modal };
