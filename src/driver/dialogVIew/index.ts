import 'reflect-metadata';
import 'tailwindcss/tailwind.css';
import 'driver/joplin/webview';
import './utils/Recognizor';
import './utils/Downloader';
import './utils/VideoRenderer';
import './utils/PdfRenderer';

import { createApp } from 'vue';
import App from './app/index.vue';

const app = createApp(App);
const rootEl = document.getElementById('joplin-plugin-content')!;

rootEl.style.width = '600px';
rootEl.style.height = '400px';
app.mount(rootEl);
