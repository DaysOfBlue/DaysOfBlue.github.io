import { buildPreview } from './build-preview.mjs';
import { createStaticServer } from './serve.mjs';

try {
  const port = Number(process.env.PORT ?? 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT는 1부터 65535까지의 정수여야 합니다.');
  const { directory } = buildPreview();
  const server = createStaticServer(directory);
  server.on('error', cause => { console.error(`서버 오류: ${cause.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/preview/devblog/`));
  const stop = () => server.close();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (cause) { console.error(`미리보기 실행 실패: ${cause.message}`); process.exitCode = 1; }
