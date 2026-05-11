(function () {
    'use strict';

    // Memory region keywords and their CSS class names
    var regionMap = [
        { keywords: ['STACK', 'stack'],         className: 'memory-region-stack' },
        { keywords: ['HEAP', 'heap'],           className: 'memory-region-heap' },
        { keywords: ['BSS'],                    className: 'memory-region-bss' },
        { keywords: ['DATA', 'data segment'],   className: 'memory-region-data' },
        { keywords: ['TEXT', 'code segment'],   className: 'memory-region-text' },
        { keywords: ['REGISTERS', 'registers'], className: 'memory-region-registers' },
    ];

    /**
     * Enhance svgbob SVG diagrams by detecting memory region labels
     * and adding color classes to their parent groups.
     */
    function enhanceDiagrams() {
        var svgs = document.querySelectorAll('#content main svg.svgbob');
        svgs.forEach(function (svg) {
            // Find all text elements in the SVG
            var textElements = svg.querySelectorAll('text');
            textElements.forEach(function (textEl) {
                var content = textEl.textContent || '';

                for (var i = 0; i < regionMap.length; i++) {
                    var region = regionMap[i];
                    var matched = false;

                    for (var j = 0; j < region.keywords.length; j++) {
                        // Match keyword as standalone word or in a label like "STACK (grows..."
                        if (content.toUpperCase().indexOf(region.keywords[j]) !== -1) {
                            matched = true;
                            break;
                        }
                    }

                    if (matched) {
                        // Walk up from <text> to find the parent <g> group
                        var parent = textEl.parentElement;
                        while (parent && parent !== svg) {
                            if (parent.tagName === 'g' || parent.tagName === 'svg') {
                                parent.classList.add(region.className);
                                break;
                            }
                            parent = parent.parentElement;
                        }
                        break; // Only match the first region per text element
                    }
                }
            });
        });
    }

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
            enhanceDiagrams();
            makeCollapsible();
        });
    } else {
        enhanceDiagrams();
        makeCollapsible();
    }
})();
