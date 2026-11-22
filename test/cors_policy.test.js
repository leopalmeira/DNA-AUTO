'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCorsOptions } = require('../server/src/utils/corsPolicy');

const call = (origin, host, options={}) => {
    const resolver = createCorsOptions({
        environment: 'production',
        allowedOrigins: 'https://dna-auto-vua4.onrender.com,https://oficina-app.onrender.com',
        ...options
    });
    let result;
    resolver({
        headers: {origin,host},
        get(key) { return ({origin,host})[key.toLowerCase()]; }
    }, (error, corsOptions) => { result = {error,corsOptions}; });
    return result;
};

test('permite cadastro no próprio endereço Render sem depender de allowlist antiga', () => {
    const r=call('https://dna-auto-byin.onrender.com','dna-auto-byin.onrender.com');
    assert.equal(r.error,null);
    assert.equal(r.corsOptions.origin,true);
    assert.equal(r.corsOptions.credentials,true);
});
test('permite a própria origem de domínio customizado', () => {
    assert.equal(call('https://oficina.dnaauto.com.br','oficina.dnaauto.com.br').error,null);
});
test('permite frontend externo já autorizado', () => {
    assert.equal(call('https://oficina-app.onrender.com','dna-auto-vua4.onrender.com').error,null);
});
test('bloqueia origem de domínio não autorizado', () => {
    const r=call('https://outro.onrender.com','dna-auto-byin.onrender.com');
    assert.equal(r.error.code,'CORS_ORIGIN_DENIED');
    assert.equal(r.error.status,403);
});
test('bloqueia domínio malicioso com prefixo enganoso', () => {
    const r=call('https://dna-auto-byin.onrender.com.evil.tld','dna-auto-byin.onrender.com');
    assert.equal(r.error.status,403);
});
test('mantém acesso das requisições sem Origin, comuns em chamadas nativas', () => {
    assert.equal(call(undefined,'dna-auto-byin.onrender.com').error,null);
});
test('preserva compatibilidade quando allowlist está vazia', () => {
    assert.equal(call('https://outro.tld','dna-auto-byin.onrender.com',{allowedOrigins:''}).error,null);
});
test('não interfere em ambientes de testes', () => {
    assert.equal(call('https://outro.tld','dna-auto-byin.onrender.com',{environment:'test'}).error,null);
});
