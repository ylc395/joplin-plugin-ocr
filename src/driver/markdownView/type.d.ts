export interface MarkdownOcrRequest {
  event: 'markdownOcrRequest';
  payload: {
    url: string;
    index: number;
  };
}
