import React from 'react';

import { GITHUB_URL } from '../../../constants.js';
import { Modal } from '../modal.js';

const UpdateDialog = () => {
	return (
		<Modal>
			<div className="modal-content">
				<div className="modal-header">
					<h5 className="modal-title">Update Available</h5>
				</div>
				<div className="modal-body">
					There is a new version available: Please check{' '}
					<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
						GitHub
					</a>
				</div>
			</div>
		</Modal>
	);
};

export { UpdateDialog };
