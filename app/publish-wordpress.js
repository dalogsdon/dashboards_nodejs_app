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

function getContentHeight(nbMetadata) {
	if (nbMetadata && nbMetadata.dashboard && nbMetadata.dashboard.container_height) {
		return nbMetadata.dashboard.container_height;
	} else {
		return "500";
	}
}

function publishPost(nbPath, nbMetadata) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbPath);
    var publishUrl = PUBLISH_URL;
    var postId = nbMetadata && nbMetadata.post_id;
    if (_isInteger(postId)) {
        publishUrl = urljoin(publishUrl, postId);
    }
    var postContent = '[iframe src="'+iframeUrl+'" scrolling="no" height="'+ getContentHeight(nbMetadata) + '"]';
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
                    raw: postContent
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
    create: function(nbPath, nbMetadata) {
    	return publishPost(nbPath, nbMetadata);
    },
    update: function(nbPath, nbMetadata) {
    	var id = nbMetadata && nbMetadata.post_id;
        if (_isInteger(id)) {
    	    return publishPost(nbPath, nbMetadata);
        } else {
            throw new Error('Invalid id, must be integer');
        }
    }
};
