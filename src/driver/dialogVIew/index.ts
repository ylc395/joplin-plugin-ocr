import 'reflect-metadata';
import 'tailwindcss/tailwind.css';
import './style/index.css';
import 'driver/joplin/webview';
import './utils/Recognizor';
import './utils/Downloader';
import './utils/VideoRenderer';
import './utils/PdfRenderer';

import { createApp } from 'vue';
import App from './app/index.vue';
import { getRootEl } from './utils/helper';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from 'driver/constants';

const app = createApp(App);
const rootEl = getRootEl();

rootEl.style.width = `${WINDOW_WIDTH}px`;
rootEl.style.height = `${WINDOW_HEIGHT}px`;
app.mount(rootEl);
