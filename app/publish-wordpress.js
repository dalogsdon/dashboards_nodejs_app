/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Example: Wordpress strategy for publishing uploaded dashboards
 */
var config = require('./config');
var request = require('request');
var urljoin = require('url-join');
var Promise = require('es6-promise').Promise;

var IFRAME_BASEURL = urljoin(config.get('PUBLIC_LINK'), '/dashboards');
var PUBLISH_URL = urljoin(config.get('DISCOVERY_URL'), config.get('DISCOVERY_POST_ENDPOINT'));

function _isInteger(i) {
    return Number(i) === parseInt(i, 10);
}

function publishPost(nbPath, postId) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbPath);
    var publishUrl = PUBLISH_URL;
    if (_isInteger(postId)) {
        publishUrl = urljoin(publishUrl, postId);
    }
    return new Promise(function(resolve, reject) {
        request({
            url: publishUrl,
            method: 'POST',
            headers: {
                Authorization: config.get('DISCOVERY_BASIC_AUTH'),
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                content: {
                    raw: '[iframe src="'+iframeUrl+'"]'
                },
                title: {
                    raw: 'Uploaded dashboard: ' + nbPath
                },
                author: 1,
                excerpt: {
                    raw: ''
                },
                status: 'publish'
            })
        }, function(err, response) {
            if (err) {
                reject(err);
            } else {
                try {
                    var body = JSON.parse(response.body);
                	resolve({
                        id: body.id,
                        link: body.link
                    });
                } catch(e) {
                	reject(e);
                }
            }
        });
    });
}

module.exports = {
    create: function(nbPath) {
    	return publishPost(nbPath);
    },
    update: function(nbPath, id) {
        if (_isInteger(id)) {
    	    return publishPost(nbPath, id);
        } else {
            throw new Error('Invalid id, must be integer');
        }
    }
};
