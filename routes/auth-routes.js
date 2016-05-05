/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Routes that make use of auth token
 */
var authToken = require('../app/auth-token');
var config = require('../app/config');
var upload = require('../app/notebook-upload');
var router = require('express').Router();
var urljoin = require('url-join');

var GET_URL = urljoin(config.get('PUBLIC_LINK'), '/dashboards');
var UPLOAD_MESSAGE = 'Notebook successfully uploaded';
var POST_MESSAGE = UPLOAD_MESSAGE + ' and published';

/* POST /notebooks/* - upload a dashboard notebook */
router.post('/notebooks(/*)', authToken, upload, function(req, res) {
    var message = req.post ? POST_MESSAGE : UPLOAD_MESSAGE;
    var resBody = {
        link: urljoin(GET_URL, req.params[0]),
        message: 'Notebook successfully uploaded.',
        status: 201,
        url: req.url
    };
    if (req.post) {
        resBody.post = req.post;
    }
    res.status(201).json(resBody);
});

module.exports = router;
