'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var _ = require('underscore');
var request = require('request');

//mine
var config = require('../config');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

router.get('/config', jwt({secret: config.life.jwt.pub, credentialsRequired: false}), function(req, res) {
    var conf = {
        /*
        service_types: config.meshconfig.service_types,
        mesh_types: config.meshconfig.mesh_types,
        defaults: config.meshconfig.defaults,
        //menu: get_menu(req.user),
        */
        resources: config.life.resources,
    };
    res.json(conf);
});

router.use('/demo', require('./demo'));
//router.use('/workflow', require('./workflow'));
///router.use('/resource', require('./resource'));
//outer.use('/task', require('./task'));
//router.use('/product', require('./product'));

module.exports = router;

