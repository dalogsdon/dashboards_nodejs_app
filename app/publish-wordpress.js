/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Example: Wordpress strategy for publishing uploaded dashboards
 */
var config = require('./config');
var escape = require('escape-html');
var nbmetadata = require('./notebook-metadata');
var nbtext = require('./notebook-text');
var Promise = require('es6-promise').Promise;
var request = require('request');
var urljoin = require('url-join');

var IFRAME_BASEURL = urljoin(config.get('PUBLIC_LINK'), '/dashboards');
var API_BASE = urljoin(config.get('PUBLISH_URL'),
                          config.get('PUBLISH_API_BASE'));

var REQ_HEADERS = {
    Authorization: config.get('PUBLISH_BASIC_AUTH'),
    'Content-Type': 'application/json',
    Accept: 'application/json'
};

function _isInteger(i) {
    return Number(i) === parseInt(i, 10);
}

function _getExistingTags() {
    return new Promise(function(resolve, reject) {
        request({
            url: urljoin(API_BASE, '/tags'),
            method: 'GET',
            headers: REQ_HEADERS
        }, function(err, response) {
            if (err) {
                reject(err);
            } else {
                var body = JSON.parse(response.body);
                resolve(body);
            }
        });
    });
}

function _getTagIdFromList(tag, tagList) {
    var tag_id = -1;
    tagList.some(function(tagObj) {
        if (tagObj.name === tag) {
            tag_id = tagObj.id;
            return true;
        }
    });
    return tag_id;
}

function _createNewTag(tagName) {
    return new Promise(function(resolve, reject) {
        request({
            url: urljoin(API_BASE, '/tags'),
            method: 'POST',
            headers: REQ_HEADERS,
            body: JSON.stringify({ name: tagName })
        }, function(err, response) {
            if (err) {
                reject(err);
            } else {
                var body = JSON.parse(response.body);
                resolve(body.id);
            }
        });
    });
}

function _publishPost(nbpath) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbpath);

    return Promise.all([
        nbmetadata.getPublishMetadata(nbpath),
        nbmetadata.getPostInfo(nbpath),
        nbtext(nbpath)
    ]).then(function(values) {
        var publishMetadata = values[0] || {};
        var postMetadata = values[1] || {};
        var title = postMetadata.title || nbpath;
        var author = postMetadata.author || 1;
        var excerpt = postMetadata.excerpt || "";
        var tags = postMetadata.tags || "";
        var searchable = values[2];

        var content =
            '<!-- ' + escape(searchable) + ' -->\n' +
            '[iframe ' +
                'data-type="dashboard" ' +
                'src="' + iframeUrl + '" ' +
                'scrolling="no" ' +
            ']';

        // Handle tags
        var existing_tags = _getExistingTags();
        var userTags_ids = []; // array of promises
        var userTags = tags.split(",");

        return existing_tags.then(function(tagList) {
            userTags.forEach(function(userTag) {
                userTag = userTag.trim();
                tag_id = _getTagIdFromList(userTag, tagList);
                if (tag_id > -1) { // if userTag is already an existing tag, push its id 
                    userTags_ids.push(new Promise(function(resolve, reject) {
                        resolve(tag_id);
                    }));
                } else { // else, create a new tag and push its id
                    userTags_ids.push(_createNewTag(userTag));
                }
            });

            return Promise.all(userTags_ids).then(function(tag_ids) {
                return new Promise(function(resolve, reject) {
                    var postId = publishMetadata.post_id;
                    var publishUrl = urljoin(API_BASE, '/posts');
                    publishUrl = _isInteger(postId) ?
                        urljoin(publishUrl, postId) : publishUrl;

                    request({
                        url: publishUrl,
                        method: 'POST',
                        headers: REQ_HEADERS,
                        body: JSON.stringify({
                            content: content,
                            title: {
                                raw: title
                            },
                            author: author,
                            status: 'publish',
                            excerpt: {
                                raw: excerpt
                            },
                            tags: tag_ids
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
        });  
    });
}

module.exports = {
    publish: _publishPost
};
