/* Shared API client.
   Points at the backend REST API. Override the base URL by defining
   window.CEC_API_BASE before this file loads (defaults to same-origin /api/v1).
   Every data fetch in the portal now talks to this API instead of mock data. */
(function (global) {
    'use strict';

    var API_BASE = global.CEC_API_BASE || '/api/v1';

    function buildUrl(path, params) {
        var url = API_BASE + (path.charAt(0) === '/' ? path : '/' + path);
        if (!params) return url;
        var qs = Object.keys(params)
            .filter(function (k) {
                return params[k] !== undefined && params[k] !== null && params[k] !== '';
            })
            .map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            })
            .join('&');
        return qs ? url + (url.indexOf('?') === -1 ? '?' : '&') + qs : url;
    }

    function request(method, path, body, params) {
        var opts = {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        };
        if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
        return fetch(buildUrl(path, params), opts).then(function (res) {
            if (!res.ok) {
                return res.json().catch(function () { return {}; }).then(function (err) {
                    var e = new Error((err && err.message) ? err.message : ('Request failed (' + res.status + ')'));
                    e.status = res.status;
                    throw e;
                });
            }
            if (res.status === 204) return null;
            return res.json().catch(function () { return null; });
        });
    }

    var api = {
        base: API_BASE,
        get: function (path, params) { return request('GET', path, undefined, params); },
        post: function (path, body) { return request('POST', path, body); },
        put: function (path, body) { return request('PUT', path, body); },
        patch: function (path, body) { return request('PATCH', path, body); },
        del: function (path) { return request('DELETE', path); }
    };

    global.API = api;
})(window);