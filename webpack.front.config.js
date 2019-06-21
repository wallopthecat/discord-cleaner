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
                loader: "file-loader?name=[name].[ext]"
            },
            {
                test: /\.(png|jpe?g|gif|svg|ico)$/,
                loader: "file-loader?name=/imgs/[name].[ext]",
                exclude: [/font\.svg$/] // try to exclude svg web fonts
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader?name=/fonts/[name].[ext]"
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: '[name].bundle.css' }),
    ]
};