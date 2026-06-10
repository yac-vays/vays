
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export default {
  entry: {
    'monaco-editor': './src/workerInit.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
				type: 'asset/resource',
      }
    ],
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['yaml'], // Add supported languages here
      customLanguages: [
        {
          label: 'yaml',
          entry: 'monaco-yaml',
          worker: {
            id: 'monaco-yaml/yamlWorker',
            entry: 'monaco-yaml/yaml.worker',
          },
        },
      ],
      publicPath: '/editor/',
      filename: '[name].worker.js',
    }),
  ],
  output:{
    path: path.resolve(__dirname, 'public/editor'),

  }
};
