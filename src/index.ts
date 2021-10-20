import joplin from 'api';
import { Joplin } from './driver/joplin/joplinPlugin';

const joplinInstance = new Joplin();

joplin.plugins.register({
  onStart: async function () {
    await joplinInstance.setupDialog();
    await joplinInstance.setupMarkdownView();
  },
});
