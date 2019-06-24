const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: './src/frontend/index.js',
	target: 'web',
	output: {
		path: path.resolve(__dirname, 'build/public'),
		filename: '[name].bundle.js',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				}
			},
			{
				test:/\.scss$/,
				use: [
					{ loader: MiniCssExtractPlugin.loader },
					{ loader: 'css-loader' },
					{ loader: 'sass-loader' }
				],
			},
			{
				test: /\.(html)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
				}
			},
			{
				test: /\.(png|jpe?g|gif|svg|ico)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'imgs',
				}
			},
			{
				test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'fonts',
				}
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin({ filename: '[name].bundle.css' }),
	]
};
