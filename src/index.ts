import joplin from 'api';
import { Joplin } from './driver/joplin';

const joplinInstance = new Joplin();

joplin.plugins.register({
  onStart: async function () {
    await joplinInstance.setupDialog();
    await joplinInstance.setupMarkdownView();
  },
});
