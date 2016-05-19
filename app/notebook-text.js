/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */
var nbstore = require('./notebook-store');

/**
 * Extracts all text cells from a notebook
 * @param  {String} nbpath - relative path to notebook
 * @return {Promise.<string>} all markdown cell text
 */
module.exports = function(nbpath) {
    return nbstore.get(nbpath).then(function(nb) {
        return nb.cells.filter(function(cell) {
            return cell.cell_type === 'markdown';
        }).map(function(cell) {
            return cell.source;
        }).join('\n');
    });
};
