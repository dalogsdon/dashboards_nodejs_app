/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
/**
 * Accessors for notebook dashboard metadata
 */
var config = require('./config');
var nbstore = require('./notebook-store');

var PUBLISH_PLATFORM = config.get('PUBLISH_PLATFORM');

function _getHeight(nbpath) {
    return _getMetadata(nbpath).then(function(metadata) {
        return (metadata && metadata.dashboard &&
            metadata.dashboard.container_height) || 500;
    });
}

function _getTitle(nbpath) {
    return _getMetadata(nbpath).then(function(metadata) {
        return (metadata && metadata.dashboard &&
            metadata.dashboard.post_title) || nbpath;
    });
}

function _getMetadata(nbpath) {
    return nbstore.get(nbpath).then(function(nb) {
        return nb.metadata && nb.metadata.urth;
    });
}

function _getPublishMetadata(nbpath) {
    return _getMetadata(nbpath).then(function(metadata) {
        return metadata && metadata.publish && metadata.publish[PUBLISH_PLATFORM];
    });
}

function _setPublishMetadata(nbpath, publishMetadata) {
    return nbstore.get(nbpath).then(function(nb) {
        nb.metadata = nb.metadata || {};
        nb.metadata.urth = nb.metadata.urth || {};
        nb.metadata.urth.publish = nb.metadata.urth.publish || {};
        nb.metadata.urth.publish[PUBLISH_PLATFORM] = publishMetadata;
        return nbstore.update(nbpath, nb);
    });
}

function _copyDashboardServerMetadata(nbBufferOrString, nbpath) {
    return nbstore.get(nbpath).then(
        function(existingNb) {
            var updatedBuffer = nbBufferOrString;
            if (existingNb.metadata &&
                existingNb.metadata.urth &&
                existingNb.metadata.urth.publish) {
                    var newNb = JSON.parse(nbBufferOrString.toString());
                    newNb.metadata = newNb.metadata || {};
                    newNb.metadata.urth = newNb.metadata.urth || {};
                    newNb.metadata.urth.publish = existingNb.metadata.urth.publish;
                    updatedBuffer = JSON.stringify(newNb);
                    if (nbBufferOrString instanceof Buffer) {
                        updatedBuffer = new Buffer(updatedBuffer);
                    }
            }
            return updatedBuffer;
        },
        function failure(err) {
            if (err && err.status === 404) {
                // if no existing file, nothing to do so return original data
                return nbBufferOrString;
            } else {
                throw err;
            }
        }
    );
}

module.exports = {
    /**
     * Copies any existing dashboard server-set metadata to new notebok data
     * @param {String} nbpath - data path of existing notebook file
     * @param {(Buffer|String)} nbBufferOrString - new notebook data
     * @returns {Promise} resolved with updated Buffer or string
     */
    copyDashboardServerMetadata: _copyDashboardServerMetadata,
    /**
     * Returns the dashboard height as specified in the notebook metadata
     * @param {String} nbpath - data path of the notebook file
     * @returns {Promise} resolved with dashboard height in px (no units)
     */
    getHeight: _getHeight,
    /**
     * Returns the dashboard post title as specified in the notebook metadata
     * @param {String} nbpath - data path of the notebook file
     * @returns {Promise} resolved with dashboard post title
     */
    getTitle: _getTitle,
    /**
     * Returns the dashboard metadata for the specified notebook
     * @param {String} nbpath - data path of the notebook file
     * @returns {Promise} resolved with dashboard metadata
     */
    getMetadata: _getMetadata,
    /**
     * Returns the publish metadata for the specified notebook
     * @param {String} nbpath - data path of the notebook file
     * @returns {Promise} resolved with publish metadata
     */
    getPublishMetadata: _getPublishMetadata,
    /**
     * Saves updated publish metadata in the specified notebook.
     * Uses the configured publish platform.
     * @param {String} nbpath - data path of the notebook file
     * @param {Object} publishMetadata - publish metadata to set
     * @returns {Promise} resolved with `nbstore.update`
     */
    setPublishMetadata: _setPublishMetadata
};
