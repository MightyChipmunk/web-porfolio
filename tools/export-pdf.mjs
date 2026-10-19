// 포트폴리오 PDF 내보내기: index.html 을 인쇄용 스타일(css/print.css)로 렌더링해 PDF로 저장
//
//   node tools/export-pdf.mjs [출력 경로]
//
// 설치 필요 없음 (Node 22+ 내장 WebSocket 사용). Chrome 또는 Edge가 필요하며,
// 다른 위치에 있으면 CHROME_PATH 환경 변수로 지정.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(process.argv[2] ?? join(ROOT, 'dist', '김지훈_포트폴리오.pdf'));
const SITE = 'https://mightychipmunk.github.io/web-porfolio/';

const BROWSERS = [
	process.env.CHROME_PATH,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
].filter(Boolean);

const MIME = {
	'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
	'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
	'.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
	'.mp4': 'video/mp4',
};

// 저장소 폴더를 그대로 서빙하는 정적 서버 (file:// 보다 실제 배포 환경에 가까움)
function startServer() {
	const server = createServer((req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '');
		const file = join(ROOT, path || 'index.html');
		if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
			res.writeHead(404).end();
			return;
		}
		res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
		res.end(readFileSync(file));
	});
	return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

function launchBrowser(profileDir) {
	const exe = BROWSERS.find(p => existsSync(p));
	if (!exe) throw new Error('Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH 환경 변수로 경로를 지정하세요.');
	const proc = spawn(exe, [
		'--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`,
		'--no-first-run', '--no-default-browser-check', '--mute-audio', '--hide-scrollbars', 'about:blank',
	], { stdio: ['ignore', 'ignore', 'pipe'] });
	return new Promise((ok, fail) => {
		let log = '';
		proc.stderr.on('data', chunk => {
			log += chunk;
			const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
			if (match) ok({ proc, wsUrl: match[1] });
		});
		proc.on('exit', code => fail(new Error(`브라우저가 종료되었습니다 (code ${code})\n${log}`)));
	});
}

// 최소한의 Chrome DevTools Protocol 클라이언트
async function connect(wsUrl) {
	const ws = new WebSocket(wsUrl);
	await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
	let nextId = 0;
	const pending = new Map();
	const listeners = new Map();
	ws.onmessage = ({ data }) => {
		const msg = JSON.parse(data);
		if (msg.id !== undefined) {
			const { ok, fail } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
		} else {
			listeners.get(msg.method)?.forEach(fn => fn(msg.params));
		}
	};
	return {
		send: (method, params = {}) => new Promise((ok, fail) => {
			const id = ++nextId;
			pending.set(id, { ok, fail });
			ws.send(JSON.stringify({ id, method, params }));
		}),
		once: method => new Promise(ok => {
			const fns = listeners.get(method) ?? [];
			const fn = params => { fns.splice(fns.indexOf(fn), 1); ok(params); };
			fns.push(fn);
			listeners.set(method, fns);
		}),
		close: () => ws.close(),
	};
}

// 페이지 안에서 실행: 지연 로딩 이미지 즉시 로드, 상대 링크를 배포 주소로 바꿔 PDF 안 링크가 웹으로 이어지게 함
const PREPARE = `(async () => {
	document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
	document.querySelectorAll('a[href]').forEach(a => {
		const href = a.getAttribute('href');
		if (/^(https?:|mailto:|tel:)/.test(href)) return;
		a.href = new URL(href, ${JSON.stringify(SITE)}).href;
	});
	const images = [...document.images].filter(img => img.closest('.print-only, #about-section, #resume-section'));
	const bgImages = [...document.querySelectorAll('.img-about .img')].map(el => {
		const url = getComputedStyle(el).backgroundImage.slice(5, -2);
		return new Promise(done => { const img = new Image(); img.onload = img.onerror = done; img.src = url; });
	});
	await Promise.race([
		Promise.all([document.fonts.ready, ...bgImages, ...images.map(img => img.complete ? null : new Promise(done => { img.onload = img.onerror = done; }))]),
		new Promise(done => setTimeout(done, 15000)),
	]);

	// Chrome은 WebP를 무손실 PNG로 바꿔 PDF에 넣어 용량이 커짐 → 인쇄 크기(약 240dpi)에 맞춘 JPEG로 교체
	const converted = images.filter(img => img.naturalWidth && /\\.webp(\\?|$)/i.test(img.currentSrc)).map(async img => {
		const width = Math.min(img.naturalWidth, Math.ceil(img.getBoundingClientRect().width * 2.5));
		if (!width) return;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = Math.round(img.naturalHeight * width / img.naturalWidth);
		canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
		img.removeAttribute('srcset');
		img.src = canvas.toDataURL('image/jpeg', 0.85);
		await img.decode().catch(() => {});
	});
	await Promise.all(converted);
	return images.filter(img => img.getAttribute('src') && !img.naturalWidth).map(img => img.src);
})()`;

const FOOTER = `<div style="width:100%; padding:0 14mm; font-size:7.5px; color:#888; display:flex; justify-content:space-between; font-family:sans-serif;">
	<span>김지훈 · 유니티 클라이언트 개발자 · ${SITE.replace('https://', '').replace(/\/$/, '')}</span>
	<span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;

const profileDir = mkdtempSync(join(tmpdir(), 'portfolio-pdf-'));
const server = await startServer();
const { proc, wsUrl } = await launchBrowser(profileDir);
try {
	const browserHttp = wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*$/, '');
	const target = await (await fetch(`${browserHttp}/json/new?about:blank`, { method: 'PUT' })).json();
	const page = await connect(target.webSocketDebuggerUrl);
	await page.send('Page.enable');
	await page.send('Emulation.setEmulatedMedia', { media: 'print' });

	const loaded = page.once('Page.loadEventFired');
	await page.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/index.html` });
	await loaded;

	const { result } = await page.send('Runtime.evaluate', { expression: PREPARE, awaitPromise: true, returnByValue: true });
	if (result.value?.length) console.warn('불러오지 못한 이미지:', result.value);

	const { data } = await page.send('Page.printToPDF', {
		printBackground: true,
		preferCSSPageSize: true,
		displayHeaderFooter: true,
		headerTemplate: '<span></span>',
		footerTemplate: FOOTER,
		generateDocumentOutline: true,
	});
	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, Buffer.from(data, 'base64'));
	console.log(`PDF 저장: ${OUTPUT} (${(statSync(OUTPUT).size / 1024 / 1024).toFixed(1)}MB)`);
	page.close();
} finally {
	proc.kill();
	server.close();
	await new Promise(done => setTimeout(done, 500));
	rmSync(profileDir, { recursive: true, force: true, maxRetries: 5 });
}
