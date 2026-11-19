(function () {
    'use strict';
    let token = null;
    let expiresAt = 0;
    let expiryTimer;
    let generation = 0;
    class ApiError extends Error {
        constructor(code, details, status) { super(code); this.code = code; this.details = details || {}; this.status = status; }
    }
    function clearSession(expired) {
        token = null; expiresAt = 0; generation += 1; clearTimeout(expiryTimer);
        window.dispatchEvent(new CustomEvent(expired ? 'session-expired' : 'session-cleared'));
    }
    async function call(path, options = {}) {
        const authenticated = options.auth !== false;
        if (authenticated && (!token || Date.now() >= expiresAt)) {
            clearSession(true); throw new ApiError('session_expired', {}, 401);
        }
        const headers = new Headers();
        if (authenticated) headers.set('Authorization', 'Bearer ' + token);
        let body = options.body;
        if (authenticated && body && (body instanceof FormData ? body.has('init_data') : Object.hasOwn(body,'init_data'))) {
            throw new ApiError('ambiguous_authentication', {}, 400);
        }
        if (body && !(body instanceof FormData)) {
            headers.set('Content-Type', 'application/json'); body = JSON.stringify(body);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);
        const startedGeneration = generation;
        try {
            const response = await fetch(SiteConfig.API_BASE + path, {
                method: options.method || 'GET', headers, body,
                credentials: 'omit', cache: 'no-store', signal: controller.signal
            });
            if (authenticated && startedGeneration !== generation) throw new ApiError('session_expired', {}, 401);
            if (response.status === 401 && authenticated) {
                clearSession(true); throw new ApiError('session_expired', {}, 401);
            }
            let payload;
            try { payload = await response.json(); } catch (_) { throw new ApiError('invalid_response', {}, response.status); }
            if (authenticated && startedGeneration !== generation) throw new ApiError('session_expired', {}, 401);
            if (!response.ok || payload.status === 'error') {
                throw new ApiError(payload.code || payload.detail || 'request_failed', payload.details, response.status);
            }
            return payload;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            // Never replay mutations: a timed-out order may already be saved.
            throw new ApiError(error.name === 'AbortError' ? 'request_timeout' : 'network_error');
        } finally { clearTimeout(timeout); }
    }
    window.SiteAPI = {
        call, ApiError,
        isLoggedIn: () => !!token && Date.now() < expiresAt,
        clearSession: () => clearSession(false),
        expireSession: () => clearSession(true),
        restoreSession(savedToken, savedExpiresAt) {
            if (!savedToken || typeof savedToken !== 'string') return false;
            if (!Number.isFinite(savedExpiresAt) || Date.now() >= savedExpiresAt) return false;
            token = savedToken;
            expiresAt = savedExpiresAt;
            generation += 1;
            clearTimeout(expiryTimer);
            expiryTimer = setTimeout(() => clearSession(true), Math.max(1000, expiresAt - Date.now()));
            return true;
        },
        getSession() {
            return (token && Date.now() < expiresAt) ? { token, expiresAt } : null;
        },
        async login(widgetCallback) {
            const result = await call('/web/auth/telegram', {method: 'POST', auth: false, body: widgetCallback});
            if (!result.access_token || !Number.isFinite(result.expires_in) || result.expires_in <= 0) throw new ApiError('invalid_response');
            token = result.access_token;
            expiresAt = Date.now() + Math.min(result.expires_in, 3600) * 1000;
            generation += 1; clearTimeout(expiryTimer);
            expiryTimer = setTimeout(() => clearSession(true), expiresAt - Date.now());
            return result;
        }
    };
})();
