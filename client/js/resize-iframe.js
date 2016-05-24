/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

'use strict';

var $ = require('jquery');

    var Config = window.jupyter_dashboard.Config;
    var sendHandle;
    var prevHeight;

    function sendHeight() {
        var height = $('body').outerHeight();
        if (height !== prevHeight) {
            prevHeight = height;
            console.info('Sending document height to parent:', height);
            window.parent.postMessage({ height: height }, Config.DISCOVERY_URL);
        }
    }

    function sendHeightDebounced() {
        window.clearTimeout(sendHandle);
        sendHandle = window.setTimeout(sendHeight, 100);
    }

    if (window.parent !== window) {
        // send initial height immediately and then on page modification
        sendHeight();
        var observer = new MutationObserver(sendHeightDebounced);
        observer.observe($('body').get(0), { childList: true, subtree: true });
    }
