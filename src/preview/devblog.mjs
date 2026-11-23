import { renderDevBlogSite } from '../devblog.mjs';

export const previewBase = '/preview/devblog';

export function renderDevBlogPreview(pages, categories, settings, postSettings, examples) {
  return renderDevBlogSite(pages, categories, settings, postSettings, examples, { base: previewBase, preview: true });
}
