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
                resolve(JSON.parse(response.body).id);
            }
        });
    });
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
                resolve(JSON.parse(response.body));
            }
        });
    });
}

/**
 * Get ids for tags specified in a notebook. Creates new tags as necessary.
 * @param  {string} nbpath - path to a notebook
 * @return {Promise.<Number[]>} tag ids for the specified notebook
 */
function _getTagIds(nbpath) {
    return Promise.all([
        nbmetadata.getPostInfo(nbpath),
        _getExistingTags()
    ]).then(function(values) {
        var postTags = values[0].tags || '';
        return Promise.all(postTags.split(/\s*,\s*/).map(function(postTag) {
            tagId = _getTagIdFromList(postTag, values[1]);
            // if tag exists use id, else create new tag and use new tag id
            return typeof tagId === 'number' ? tagId : _createNewTag(postTag);
        }));
    });
}

function _getTagIdFromList(tag, tagList) {
    return tagList.filter(function(item) {
        return item.name === tag;
    }).map(function(item) {
        return item.id;
    })[0];
}

function _publishPost(nbpath) {
    var iframeUrl = urljoin(IFRAME_BASEURL, nbpath);

    return Promise.all([
        nbmetadata.getPostInfo(nbpath),
        nbmetadata.getPublishMetadata(nbpath),
        nbtext(nbpath),
        _getTagIds(nbpath)
    ]).then(function(values) {
        var postMetadata = values[0];
        var publishMetadata = values[1] || {};
        var postContent =
            '<!-- ' + escape(values[2]) + ' -->\n' +
            '[iframe ' +
                'data-type="dashboard" ' +
                'src="' + iframeUrl + '" ' +
                'scrolling="no" ' +
            ']';

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
                    content: postContent,
                    title: postMetadata.title || nbpath,
                    author: postMetadata.author || 1,
                    status: 'publish',
                    excerpt: postMetadata.excerpt || '',
                    tags: values[3]
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
