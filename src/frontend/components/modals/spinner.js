import React from 'react';

import { Modal } from '../modal.js';

const Spinner = () => {
	return (
		<Modal>
			<div className="spinner-wrapper d-flex justify-content-center">
				<div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }}>
					<span className="sr-only">Loading...</span>
				</div>
			</div>
		</Modal>
	);
};

export { Spinner };
