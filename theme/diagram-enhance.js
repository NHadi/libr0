(function () {
    'use strict';

    /**
     * Make sections with "assembly" or specific technical headings collapsible.
     */
    function makeCollapsible() {
        var headings = document.querySelectorAll('#content main h3, #content main h4');
        headings.forEach(function (heading) {
            var text = heading.textContent.toLowerCase();
            if (text.indexOf('inside') === -1 && text.indexOf('assembly') === -1) return;
            if (heading.closest('details')) return; // Already wrapped

            var wrapper = document.createElement('details');
            var summary = document.createElement('summary');
            summary.className = 'collapsible-summary';
            summary.textContent = heading.textContent;

            // Gather all siblings until next heading
            var elements = [];
            var sibling = heading.nextElementSibling;
            while (sibling && !['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
                elements.push(sibling);
                sibling = sibling.nextElementSibling;
            }

            // Only make it collapsible if there's enough content (more than 1 block)
            if (elements.length < 2) return;

            heading.parentNode.insertBefore(wrapper, heading);
            wrapper.appendChild(summary);

            elements.forEach(function (el) {
                wrapper.appendChild(el);
            });

            heading.remove();
        });
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            makeCollapsible();
        });
    } else {
        makeCollapsible();
    }
})();
