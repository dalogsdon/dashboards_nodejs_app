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

var _protocol = config.get('SSL_OPTIONS') ? 'https' : 'http';
var IFRAME_BASEURL = _protocol + '://' + config.get('IP') + ':' + config.get('PORT') + '/dashboards';
var PUBLISH_URL = urljoin(config.get('DISCOVERY_URL'), config.get('DISCOVERY_POST_ENDPOINT'));

function publishPost(nbPath, postId) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbPath);
    return new Promise(function(resolve, reject) {
        request({
            url: PUBLISH_URL,
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
                	resolve(JSON.parse(response.body).id);
                } catch(e) {
                	reject(e);
                }
            }
        });
    });
}

module.exports = {
    create: function(nbPath){
    	return publishPost(nbPath);
    },
    update: function(nbPath, id){
    	return publishPost(nbPath, id);
    }
};
