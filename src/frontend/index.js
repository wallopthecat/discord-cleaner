import React from 'react';
import ReactDOM from 'react-dom';

import './assets/imgs/favicons/favicon.ico';
import './assets/imgs/favicons/favicon-16.png';
import './assets/imgs/favicons/favicon-32.png';

import './styles/main.scss';

import './index.html';

import { App } from './components/app.js';

ReactDOM.render(<App />, document.getElementById('root'));
