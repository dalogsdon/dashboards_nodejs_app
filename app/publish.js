/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Module to handle general dashboard publishing tasks
 */
var config = require('./config');
var fs = require('fs-extra');
var path = require('path');
var Promise = require('es6-promise').Promise;
var publishModule = config.get('PUBLISH_MODULE') ? require('./' + config.get('PUBLISH_MODULE')) : null;

var ENCODING = 'utf8';
var PUBLISH_PLATFORM = config.get('PUBLISH_PLATFORM');

function _getPublishMetadata(nbFilePath) {
    return new Promise(function(resolve, reject) {
        fs.stat(nbFilePath, function(err, stats) {
            if (err) {
                resolve(null);
            } else {
                fs.readFile(nbFilePath, ENCODING, function(err, rawData) {
                    if (err) {
                        resolve(null);
                    } else {
                        try {
                            var nb = JSON.parse(rawData);
                            if (nb.metadata &&
                                nb.metadata.urth &&
                                nb.metadata.urth.publish) {
                                resolve(nb.metadata.urth.publish);
                            } else {
                                resolve(null);
                            }
                        } catch(e) {
                            resolve(null);
                        }
                    }
                });
            }
        });
    });
}

function _publishDashboard(nbFilePath, nbUrlPath) {
    // check if publish metadata exists in existing version
    return _getPublishMetadata(nbFilePath).then(function(publishMetadata) {
        var promise;
        if (publishMetadata &&
            publishMetadata[PUBLISH_PLATFORM] &&
            publishMetadata[PUBLISH_PLATFORM].hasOwnProperty('post_id')) {
            promise = publishModule.update(nbUrlPath, publishMetadata[PUBLISH_PLATFORM].post_id);
        } else {
            promise = publishModule.create(nbUrlPath).then(function(post) {
                return _savePostId(nbFilePath, post.id).then(function() {
                    return Promise.resolve(post);
                });
            });
        }
        return promise;
    });
}

function _savePostId(nbFilePath, post_id) {
    return new Promise(function(resolve, reject) {
        fs.readFile(nbFilePath, ENCODING, function(err, rawData) {
            if (err) {
                reject(err);
            } else {
                try {
                    var nb = JSON.parse(rawData);
                    nb.metadata.urth.publish = nb.metadata.urth.publish || {};
                    nb.metadata.urth.publish[PUBLISH_PLATFORM] = nb.metadata.urth.publish[PUBLISH_PLATFORM] || {};
                    nb.metadata.urth.publish[PUBLISH_PLATFORM].post_id = post_id;
                    fs.writeFile(nbFilePath, JSON.stringify(nb), function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
}

function _updateBufferWithPublishMetadata(nbFilePath, nbBuffer) {
    return new Promise(function(resolve, reject) {
        // check if publish metadata exists in existing version
        _getPublishMetadata(nbFilePath).then(function(publishMetadata) {
            if (publishMetadata) {
                try {
                    var nb = JSON.parse(nbBuffer.toString());
                    nb.metadata = nb.metadata || {};
                    nb.metadata.urth = nb.metadata.urth || {};
                    nb.metadata.urth.publish = publishMetadata;
                    resolve(new Buffer(JSON.stringify(nb)));
                } catch(e) {
                    // TODO warning/error?
                    resolve(nbBuffer);
                }
            } else {
                resolve(nbBuffer);
            }
        });
    });
}

module.exports = {
    hasPlatform: !!publishModule,
    publishDashboard: function() {
        if (publishModule) {
            return _publishDashboard.apply(null, arguments);
        } else {
            return Promise.reject(new Error('No platform to publish to'));
        }
    },
    updateBufferWithPublishMetadata: _updateBufferWithPublishMetadata
};
