import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { MARKDOWN_SCRIPT_ID } from '../constants';
import type { MarkdownOcrRequest } from '../markdownView/type';

export async function setupDialog() {
  const dialog = await joplin.views.dialogs.create('main');
  await joplin.views.dialogs.addScript(dialog, './driver/dialogWebview/index.js');
}

export async function setupMarkdownView() {
  await joplin.contentScripts.register(
    ContentScriptType.MarkdownItPlugin,
    MARKDOWN_SCRIPT_ID,
    './driver/markdownView/index.js',
  );
  await joplin.contentScripts.onMessage(MARKDOWN_SCRIPT_ID, (payload: MarkdownOcrRequest) => {
    console.log(payload);
  });
}
