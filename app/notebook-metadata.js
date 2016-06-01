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

function _getPostInfo(nbpath) {
    return nbstore.get(nbpath).then(function(nb) {
        var source = [];
        var post_info = {};
        nb.cells.some(function(cell) {
            if (cell.cell_type === 'markdown'
                && cell.source[0] && cell.source[0].indexOf("'''") > -1) {
                source = cell.source;
                return true;
            }
        });

        source.forEach(function(line) {
            if (line.indexOf(':') > 0) {
                line = line.split(":");
                post_info[line[0]] = line[1].trim();
            }
        });
        return post_info;
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
    setPublishMetadata: _setPublishMetadata,

    getPostInfo: _getPostInfo
};
