// Run after installing dev dependencies: node tests/cookie-jar.test.cjs
// No requests or real credentials are used. Exercise source and shipped JavaScript.
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function fixture(build) {
    const defaults = { 'tt-target-idc': 'useast1a' };
    const config = { DEFAULT_HTTP_CLIENT_COOKIES: defaults };
    const filename = path.join(__dirname, '..', build === 'source'
        ? 'src/lib/web/lib/cookie-jar.ts' : 'dist/lib/web/lib/cookie-jar.js');
    let code = fs.readFileSync(filename, 'utf8');
    if (build === 'source') {
        const compiled = ts.transpileModule(code, {
            fileName: filename,
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
            reportDiagnostics: true
        });
        assert.equal(compiled.diagnostics.length, 0);
        code = compiled.outputText;
    }
    const exports = {};
    vm.runInNewContext(code, {
        exports,
        require(id) {
            assert.ok(id === '@/lib/config' || id === '../../../lib/config');
            return { __esModule: true, default: config };
        }
    }, { filename });
    function create(initial) {
        const handlers = {};
        const axios = { interceptors: {
            request: { use(fn) { handlers.request = fn; } },
            response: { use(fn) { handlers.response = fn; } }
        } };
        const jar = new exports.default(axios, initial);
        return { jar, handlers };
    }
    return { create, defaults };
}

const tests = {
    'default stores have separate identities and keep defaults intact'({ create, defaults }) {
        const a = create().jar, b = create().jar;
        assert.notEqual(a.cookies, b.cookies);
        assert.notEqual(a.cookies, defaults);
        assert.equal(a.getCookieString(), 'tt-target-idc=useast1a');
        assert.equal(b.getCookieString(), 'tt-target-idc=useast1a');
    },
    'setting a second session cannot change the first'({ create, defaults }) {
        const a = create().jar;
        a.setSession('synthetic-a', 'region-a');
        const b = create().jar;
        b.setSession('synthetic-b', 'region-b');
        assert.equal(a.sessionId, 'synthetic-a');
        assert.equal(a.ttTargetIdc, 'region-a');
        assert.equal(b.sessionId, 'synthetic-b');
        assert.equal(defaults.sessionid, undefined);
    },
    'a new anonymous connection cannot clear the first session'({ create }) {
        const a = create().jar;
        a.setSession('synthetic-a', 'region-a');
        const b = create().jar;
        b.setSession(null, null);
        assert.equal(a.sessionId, 'synthetic-a');
        assert.equal(b.sessionId, null);
    },
    'response interceptor changes only its own jar'({ create, defaults }) {
        const a = create(), b = create();
        const response = { headers: { 'set-cookie': ['visitor=synthetic-a; Path=/'] } };
        assert.equal(a.handlers.response(response), response);
        assert.equal(a.jar.cookies.visitor, 'synthetic-a');
        assert.equal(b.jar.cookies.visitor, undefined);
        assert.equal(defaults.visitor, undefined);
    },
    'request interceptor uses only its own session'({ create }) {
        const a = create(), b = create();
        a.jar.setSession('synthetic-a', 'region-a');
        b.jar.setSession('synthetic-b', 'region-b');
        const request = { headers: {} };
        assert.equal(a.handlers.request(request), request);
        assert.ok(request.headers.Cookie.includes('sessionid=synthetic-a'));
        assert.ok(!request.headers.Cookie.includes('synthetic-b'));
    },
    'custom request cookies do not spread to another jar'({ create }) {
        const a = create(), b = create();
        const request = { headers: { cookie: 'visitor=synthetic-a' } };
        a.handlers.request(request);
        assert.equal(request.headers.cookie, undefined);
        assert.ok(request.headers.Cookie.includes('visitor=synthetic-a'));
        assert.equal(b.jar.cookies.visitor, undefined);
    },
    'proxy mutation and deletion are local'({ create, defaults }) {
        const a = create().jar, b = create().jar;
        a.visitor = 'synthetic-a';
        b.visitor = 'synthetic-b';
        delete a.visitor;
        assert.equal(a.visitor, undefined);
        assert.equal(b.visitor, 'synthetic-b');
        assert.equal(defaults.visitor, undefined);
    },
    'explicit caller-owned cookie maps retain existing semantics'({ create }) {
        const initial = { visitor: 'provided' };
        const a = create(initial).jar;
        assert.equal(a.cookies, initial);
        a.processSetCookieHeader('visitor=updated; Path=/');
        assert.equal(initial.visitor, 'updated');
    },
    'session validation and clearing still work'({ create }) {
        const a = create().jar;
        assert.throws(() => a.setSession('synthetic-a', null), /tt-target-idc is required/);
        a.setSession('synthetic-a', 'region-a');
        a.setSession(null, null);
        assert.equal(a.sessionId, null);
        assert.equal(a.getCookieString(), '');
    },
    'response parsing keeps equals signs and ignores attributes'({ create }) {
        const a = create().jar;
        a.readCookies({ headers: { 'set-cookie': 'visitor=a=b; Path=/; HttpOnly' } });
        assert.equal(a.cookies.visitor, 'a=b');
        assert.equal(a.cookies.Path, undefined);
    }
};

let failed = 0;
for (const build of ['source', 'dist']) {
    for (const [name, test] of Object.entries(tests)) {
        try {
            test(fixture(build));
            console.log(`PASS ${build}: ${name}`);
        } catch (error) {
            failed++;
            console.error(`FAIL ${build}: ${name}: ${error.message}`);
        }
    }
}
console.log(`${20 - failed}/20 passed`);
if (failed) process.exitCode = 1;
