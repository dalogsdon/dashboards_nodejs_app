/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

/**
 * Module to create a dashboard layout to match the Gridstack layout from the
 * notebook dashboard authoring extension.
 */

'use strict';

var $ = require('jquery');

    var Config = window.jupyter_dashboard.Config;
    var cellMargin = Number(Config.cellMargin);
    var halfMargin = cellMargin / 2;
    var cellHeight = Number(Config.defaultCellHeight);
    var numColumns = Number(Config.maxColumns);
    var visibleCells = $('.dashboard-cell:not(.hidden)');
    var maxY = visibleCells.map(function(i, cell) {
            return $(cell).attr('data-layout-row');
        }).get().reduce(function(a, b) {
            return Math.max(a, b);
        }, 0);
    var maxHeight = visibleCells.map(function(i, cell) {
            return $(cell).attr('data-layout-height');
        }).get().reduce(function(a, b) {
            return Math.max(a, b);
        }, 0);

    function _createStyle() {
        $('#dashboard-layout').remove();
        var style = $('<style>')
            .attr('id', 'dashboard-layout')
            .attr('type', 'text/css');
        $('head').append(style);
        var sheet = style.get(0).sheet;

        // set document height
        var bottomCellHeight = visibleCells.map(function(cell) {
            return Number($(cell).attr('data-layout-row'));
        }).filter(function(y) {
            return y === maxY;
        });
        $('body').css('height',
            (maxY * cellHeight + maxY * cellMargin) +
            (bottomCellHeight * cellHeight + (bottomCellHeight-1) * cellMargin) + 'px');

        // x-position
        var left;
        for (var x = 0; x < numColumns; x++) {
            left = (x / numColumns * 100) + '%';
            sheet.insertRule('.dashboard-cell[data-layout-col="' + x + '"] { left: ' + left + ' }', 0);
        }

        // y-position
        var top;
        for (var y = 0; y <= maxY; y++) {
            top = y * cellHeight + y * cellMargin + 'px';
            sheet.insertRule('.dashboard-cell[data-layout-row="' + y + '"] { top: ' + top + ' }', 0);
        }

        // width
        var width;
        for (var w = 1; w <= numColumns; w++) {
            width = (w / numColumns * 100) + '%';
            sheet.insertRule('.dashboard-cell[data-layout-width="' + w + '"] { width: ' + width + ' }', 0);
        }

        // height
        var height;
        for (var h = 1; h <= maxHeight; h++) {
            height = h * cellHeight + (h-1) * cellMargin + 'px';
            sheet.insertRule('.dashboard-cell[data-layout-height="' + h + '"] { height: ' + height + '}', 0);
        }

        // cell padding
        sheet.insertRule('.dashboard-cell { padding: ' +
            halfMargin + 'px ' + (halfMargin + 6) + 'px }', 0);
    }

    module.exports = {
        createStyle: _createStyle
    };
