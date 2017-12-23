const request = require('supertest');
const express = require('express');
const app = require('../server/server.js');
const chai = require('chai');

describe('GET /search', function() {
  it('respond with json', function(done) {
    request(app)
      .get('/search?title=sports')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
  it('returns an array of hits', function(done) {
    request(app)
      .get('/search?title=chaitest')
      .set('Accept', 'application/json')
      .expect(200)
      .then(response => {
        chai.expect([response.body.hits.hits]).to.be.an('array');
        done();
      });
  });
});

describe('GET /queries', function() {
  it('respond with json', function(done) {
    request(app)
      .get('/search?title=sports')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
  it('returns an array of hits', function(done) {
    request(app)
      .get('/search?title=sports')
      .set('Accept', 'application/json')
      .expect(200)
      .then(response => {
        chai.expect([response.body.hits.hits]).to.be.an('array');
        done();
      });
  });
});
