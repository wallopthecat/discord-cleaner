import React from 'react';

import { Modal } from '../modal.js';

const ErrorDialog = ({ reason }) => {
	return (
		<Modal>
			<div className="modal-content text-white bg-danger">
				<div className="modal-header">
					<h5 className="modal-title">Error</h5>
				</div>
				<div className="modal-body">{reason ? reason : 'An unknown error has occurred'}</div>
			</div>
		</Modal>
	);
};

export { ErrorDialog };
