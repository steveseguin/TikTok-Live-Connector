const assert = require('assert').strict;
const path = require('path');
// Run after npm run build: node tests/client-cookie-isolation.test.cjs
const root = process.argv[2] || path.join(__dirname, '..');
const { TikTokLiveConnection } = require(path.join(root, 'dist/index.js'));
const Config = require(path.join(root, 'dist/lib/config.js')).default;

(async () => {
    const errors = [];
    const defaults = { ...Config.DEFAULT_HTTP_CLIENT_COOKIES };
    const requests = [];
    const adapter = async config => {
        requests.push(config.headers.Cookie);
        return { data: 'offline fixture', status: 200, statusText: 'OK', headers: {}, config };
    };
    const a = new TikTokLiveConnection('synthetic_account_a', {
        sessionId: 'synthetic-a', ttTargetIdc: 'region-a', webClientOptions: { adapter }
    });
    const b = new TikTokLiveConnection('synthetic_account_b', {
        sessionId: 'synthetic-b', ttTargetIdc: 'region-b', webClientOptions: { adapter }
    });
    async function check(name, fn) {
        try { await fn(); console.log('PASS ' + name); }
        catch (error) { errors.push(name); console.error('FAIL ' + name + ': ' + error.message); }
    }
    await check('constructing B preserves A session', () => assert.equal(a.webClient.cookieJar.sessionId, 'synthetic-a'));
    await check('real Axios interceptor preserves A request session', async () => {
        assert.equal(await a.webClient.getHtmlFromTikTokWebsite('@synthetic_account_a/live'), 'offline fixture');
        assert.ok(requests[0].includes('sessionid=synthetic-a'));
        assert.ok(!requests[0].includes('synthetic-b'));
    });
    const c = new TikTokLiveConnection('synthetic_anonymous', { webClientOptions: { adapter } });
    await check('constructing anonymous C preserves both sessions', () => {
        assert.equal(a.webClient.cookieJar.sessionId, 'synthetic-a');
        assert.equal(b.webClient.cookieJar.sessionId, 'synthetic-b');
        assert.equal(c.webClient.cookieJar.sessionId, null);
    });
    await check('default config is unchanged', () => assert.deepEqual(Config.DEFAULT_HTTP_CLIENT_COOKIES, defaults));
    await check('anonymous request has no inherited account cookie', async () => {
        await c.webClient.getHtmlFromTikTokWebsite('@synthetic_anonymous/live');
        assert.ok(!requests[1].includes('synthetic-'));
    });
    console.log(`${5 - errors.length}/5 integration cases passed; all HTTP handled by local adapter`);
    if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
