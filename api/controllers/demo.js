'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var _ = require('underscore');
var request = require('request');

//mine
var config = require('../config');

router.post('/submit', jwt({secret: config.life.jwt.pub}), function(req, res, next) {
    //create new task
    request.post({
        url: config.sca.api+"/task",
        json: true,
        body: {
            workflow_id: "569560ec961f025847282970",
            step_idx: 0,
            resources: req.body.resources,
            service_id: "lifedemo",
            name: "life demo submission by sub:"+req.user.sub,
            config: req.body.config
        },
        headers: { 'Authorization': 'Bearer '+config.sca.jwt }
    }, function (err, resp, body) {
        if(err) return next(err);
        res.json(body);
    });
});

//return all recent tasks
router.get('/task/recent', jwt({secret: config.life.jwt.pub}), function(req, res, next) {
    request.get({
        url: config.sca.api+"/task/recent",
        json: true,
        headers: { 'Authorization': 'Bearer '+config.sca.jwt }
    }, function (err, resp, task) {
        if(err) return next(err);
        res.json(task);
    });
});


//just a plain proxy for /task/:id as lifedemo user
router.get('/task/:id', jwt({secret: config.life.jwt.pub}), function(req, res, next) {
    var task_id = req.params.id;
    //create new task
    request.get({
        url: config.sca.api+"/task/"+task_id,
        json: true,
        headers: { 'Authorization': 'Bearer '+config.sca.jwt }
    }, function (err, resp, task) {
        if(err) return next(err);
        res.json(task);
    });
});

//proxy raw data
router.get('/raw', jwt({
    secret: config.life.jwt.pub,
    getToken: function fromHeaderOrQuerystring (req) { return req.query.at; }
}), function(req, res, next) {
    var task_id = req.query.t;
    var product_id = req.query.p;
    var file_id = req.query.f;
    request.get({
        url: config.sca.api+"/product/raw/",
        qs: {
            at: config.sca.jwt,
            t: task_id,
            p: product_id,
            f: file_id,
        }
    }).pipe(res);
});

module.exports = router;
