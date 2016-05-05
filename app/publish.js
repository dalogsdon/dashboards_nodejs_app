/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Module to handle general dashboard publishing tasks
 */
var config = require('./config');
var nbmetadata = require('./notebook-metadata');
var Promise = require('es6-promise').Promise;
var publishModule = config.get('PUBLISH_MODULE') ? require('./' + config.get('PUBLISH_MODULE')) : null;

function _publishDashboard(nbpath) {
    // check if publish metadata exists in existing version
    return nbmetadata.getPublishMetadata(nbpath).then(function(publishMetadata) {
        return publishModule.publish(nbpath).then(function(post) {
            return _savePostId(nbpath, post.id).then(function() {
                return post;
            });
        });
    });
}

function _savePostId(nbpath, postId) {
    return nbmetadata.setPublishMetadata(nbpath, { post_id: postId });
}

module.exports = {
    /**
     * True if a publish platform has been configured
     * @type {Boolean}
     */
    hasPlatform: !!publishModule,
    /**
     * Publishes a new post containing the specified notebook dashboard
     * @param {String} nbpath - path of notebook to publish
     * @return {Promise} resolved with post information
     */
    publishDashboard: function() {
        if (publishModule) {
            return _publishDashboard.apply(null, arguments);
        } else {
            return Promise.reject(new Error('No platform to publish to'));
        }
    }
};
