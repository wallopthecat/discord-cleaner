const path = require('path');

module.exports = {
	entry: './src/backend/app.js',
	target: 'node',
	node: {
		__filename: false,
		__dirname: false
	},
	externals: ['bufferutil', 'utf-8-validate'], // surpress warnings
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'app.bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.node$/,
				loader: 'native-ext-loader'
			},
			{
				test: /\.(png|jpe?g|gif|svg|ico)$/,
				loader: 'file-loader?name=[name].[ext]'
			},
		]
	},
};
