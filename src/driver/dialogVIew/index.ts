import 'reflect-metadata';
import 'driver/joplin/webview';
import './utils/Recognizor';
import './utils/Downloader';
import './utils/VideoRenderer';
import './utils/PdfRenderer';

import { createApp } from 'vue';
import App from './app/index.vue';

const app = createApp(App);
app.mount('#joplin-plugin-content');
