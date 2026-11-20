(function () {
    'use strict';
    var box = document.getElementById('community-ack');
    var actions = document.getElementById('community-actions');
    var wait = document.getElementById('community-wait');
    if (!box || !actions || !wait) return;
    var key = 'dth.community.ack.v1';
    function stored() {
        try { return localStorage.getItem(key) === '1'; }
        catch (_) { return false; }
    }
    function paint(open) {
        box.checked = open;
        actions.hidden = !open;
        wait.hidden = open;
    }
    paint(stored());
    box.addEventListener('change', function () {
        var open = box.checked;
        try {
            if (open) localStorage.setItem(key, '1');
            else localStorage.removeItem(key);
        } catch (_) {}
        paint(open);
        if (open) {
            var first = actions.querySelector('a');
            if (first) first.focus();
        }
    });
})();
