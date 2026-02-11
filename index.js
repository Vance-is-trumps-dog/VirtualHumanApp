/**
 * App入口（React Native默认）
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer; // Polyfill Buffer globally

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
