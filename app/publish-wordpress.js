/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Example: Wordpress strategy for publishing uploaded dashboards
 */
var config = require('./config');
var nbmetadata = require('./notebook-metadata');
var Promise = require('es6-promise').Promise;
var request = require('request');
var urljoin = require('url-join');

var IFRAME_BASEURL = urljoin(config.get('PUBLIC_LINK'), '/dashboards');
var PUBLISH_URL = urljoin(config.get('DISCOVERY_URL'),
                          config.get('DISCOVERY_POST_ENDPOINT'));

function _isInteger(i) {
    return Number(i) === parseInt(i, 10);
}

function _publishPost(nbpath) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbpath);

    return Promise.all([
        nbmetadata.getPublishMetadata(nbpath),
        nbmetadata.getHeight(nbpath),
        nbmetadata.getTitle(nbpath)
    ]).then(function(values) {
        var publishMetadata = values[0] || {};
        var height = values[1];
        return new Promise(function(resolve, reject) {
            var postId = publishMetadata.post_id;
            var publishUrl = _isInteger(postId) ?
                urljoin(PUBLISH_URL, postId) : PUBLISH_URL;

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
                        raw: '[iframe src="' + iframeUrl + '" ' +
                        'scrolling="no" ' +
                        'height="' + height + '"]'
                    },
                    title: {
                        raw: values[2]
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
                    var body = JSON.parse(response.body);
                    resolve({
                        id: body.id,
                        link: body.link
                    });
                }
            });
        });
    });
}

module.exports = {
    publish: _publishPost
};
