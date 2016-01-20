var path = require('path');
var HtmlwebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var merge = require('webpack-merge');
var Clean = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

// Load *package.json* so we can use `dependencies` from there
var pkg = require('./package.json');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
    app: path.join(__dirname, 'app'),
    build: path.join(__dirname, 'build')
};

process.env.BABEL_ENV = TARGET;

var common = {
// Entry accepts a path or an object of entries.
// The build chapter contains an example of the latter.
    entry: PATHS.app,
    // Add resolve.extensions. '' is needed to allow imports an extension
// Note the .'s before extensions!!! Without those matching will fail
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
// Given webpack-dev-server runs in-memory, we can drop
// `output`. We'll look into it again once we get to the
// build chapter.
    /*output: {
     path: PATHS.build,
     filename: 'bundle.js'
     },*/
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: ['babel'],
                include: PATHS.app
            }
        ]
    },
    devServer: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        progress: true,
        // Display only errors to reduce the amount of output.
        stats: 'errors-only',
        // Parse host and port from env so this is easy to customize.
        host: process.env.HOST,
        port: process.env.PORT
    },
    plugins: [
        //new webpack.HotModuleReplacementPlugin(),
        new HtmlwebpackPlugin({
            title: 'Kanban app'
        })
    ]
};

if(TARGET === 'start' || !TARGET) {
    module.exports = merge(common, {
        devtool: 'eval-source-map',
        devServer: {
            historyApiFallback: true,
            hot: true,
            inline: true,
            progress: true,
// Display only errors to reduce the amount of output.
            stats: 'errors-only',
// Parse host and port from env so this is easy to customize.
            host: process.env.HOST,
            port: process.env.PORT
        },
        module: {
            loaders: [
                // Define development specific CSS setup
                {
                    test: /\.css$/,
                    loaders: ['style', 'css'],
                    include: PATHS.app
                }
            ]
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ]
    });
}

if(TARGET === 'build' || TARGET === 'stats' || TARGET === 'deploy') {
    module.exports = merge(common, {
        // Define entry points needed for splitting
        entry: {
            app: PATHS.app,
            vendor: Object.keys(pkg.dependencies).filter(function(v) {
            // Exclude alt-utils as it won't work with this setup
            // due to the way the package has been designed
            // (no package.json main).
                return v !== 'alt-utils';
            })
        },
        output: {
            path: PATHS.build,
            filename: '[name].[chunkhash].js',
            chunkFilename: '[chunkhash].js'
        },
        devtool: 'source-map',
        module: {
            loaders: [
                // Extract CSS during build
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract('style', 'css'),
                    include: PATHS.app
                }
            ]
        },
        plugins: [
            new Clean([PATHS.build]),
            // Output extracted CSS to a file
            new ExtractTextPlugin('styles.[chunkhash].css'),
            // Extract vendor and manifest files
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor', 'manifest']
            }),
            // Setting DefinePlugin affects React library size!
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            })
        ]
    });
}