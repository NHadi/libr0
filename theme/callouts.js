(function () {
    'use strict';

    // Callout types with detection patterns and styling
    var calloutTypes = [
        { pattern: /^key\s*insight/i,  className: 'callout-insight',  icon: '\u{1F4A1}' },
        { pattern: /^important/i,      className: 'callout-important', icon: '\u2757' },
        { pattern: /^warning/i,        className: 'callout-warning',  icon: '\u26A0\uFE0F' },
        { pattern: /^tip/i,            className: 'callout-tip',      icon: '\u2705' },
        { pattern: /^implementation\s*note/i, className: 'callout-impl', icon: '\u2699\uFE0F' },
        { pattern: /^note/i,           className: 'callout-note',     icon: '\u2139\uFE0F' },
    ];

    // Process all blockquotes in the main content
    function enhanceCallouts() {
        var blockquotes = document.querySelectorAll('#content main blockquote');
        blockquotes.forEach(function (bq) {
            var firstStrong = bq.querySelector('strong');
            if (!firstStrong) return;

            var text = firstStrong.textContent.replace(/[.:]/g, '').trim();
            for (var i = 0; i < calloutTypes.length; i++) {
                var type = calloutTypes[i];
                if (type.pattern.test(text)) {
                    bq.classList.add(type.className);

                    // Insert icon before the first paragraph
                    var firstP = bq.querySelector('p');
                    if (firstP) {
                        var iconSpan = document.createElement('em');
                        iconSpan.className = 'callout-icon';
                        iconSpan.textContent = type.icon + ' ';
                        firstP.insertBefore(iconSpan, firstP.firstChild);
                    }
                    break;
                }
            }
        });
    }

    // Detect "Key Takeaways" headings and style them
    function enhanceKeyTakeaways() {
        var headings = document.querySelectorAll('#content main h2');
        headings.forEach(function (h2) {
            if (h2.textContent.toLowerCase().includes('key takeaway')) {
                h2.classList.add('key-takeaways-heading');

                // Find the next sibling list (ol or ul)
                var sibling = h2.nextElementSibling;
                if (sibling && (sibling.tagName === 'OL' || sibling.tagName === 'UL')) {
                    sibling.classList.add('key-takeaways-list');
                }
            }
        });
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            enhanceCallouts();
            enhanceKeyTakeaways();
        });
    } else {
        enhanceCallouts();
        enhanceKeyTakeaways();
    }
})();
