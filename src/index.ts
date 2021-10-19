import joplin from 'api';
import { setupMarkdownView } from './driver/joplin';

joplin.plugins.register({
  onStart: async function () {
    await setupMarkdownView();
  },
});
