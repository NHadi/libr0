/**
 * diagram-enhance.js - Professional Memory Diagram Renderer
 * 
 * Transforms svgbob ASCII memory diagrams into cheats.rs-style
 * colored block visualizations. Works by post-processing the
 * rendered SVG output from mdbook-svgbob.
 * 
 * Strategy: Style the SVG elements directly with professional colors
 * and typography, making them look like cheats.rs memory layout diagrams.
 */
(function () {
    'use strict';

    // ========================================
    // COLOR PALETTE (light theme - matching libr0Pure original)
    // ========================================
    var PALETTE = {
        // Background
        bg: '#fff8f0',
        bgCard: '#ffffff',

        // Text
        textPrimary: '#1a1a1a',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',

        // Semantic colors for memory fields (light theme)
        ptr: '#1d4ed8',       // blue - pointers
        len: '#15803d',       // green - lengths
        cap: '#92400e',       // amber - capacity
        value: '#b91c1c',     // red - values/data
        tag: '#6d28d9',       // purple - discriminants
        strong: '#15803d',    // green - strong count
        weak: '#6b7280',      // gray - weak count
        borrow: '#6d28d9',    // purple - borrow count
        data: '#92400e',      // amber - raw data bytes
        freed: '#9ca3af',     // light gray - freed memory
        type: '#CE422B',      // rust orange - type names
        label: '#1d4ed8',     // blue - labels
        arrow: '#6b7280',     // gray - arrows/lines
        border: '#e5e7eb',    // border color
        borderAccent: '#CE422B', // rust orange border
    };

    // ========================================
    // MAIN ENHANCEMENT FUNCTION
    // ========================================

    function enhanceAllDiagrams() {
        // Target all svgbob-rendered containers
        var containers = document.querySelectorAll('div.svgbob');
        if (containers.length === 0) {
            // Try alternate selectors
            containers = document.querySelectorAll('pre > code.language-bob');
            if (containers.length > 0) {
                enhanceCodeBlocks(containers);
                return;
            }
            // Also try finding SVGs directly
            var svgs = document.querySelectorAll('svg.svgbob');
            if (svgs.length > 0) {
                enhanceSvgDiagrams(svgs);
            }
            return;
        }
        enhanceSvgContainers(containers);
    }

    // ========================================
    // SVG ENHANCEMENT (for rendered svgbob output)
    // ========================================

    function enhanceSvgDiagrams(svgs) {
        svgs.forEach(function (svg) {
            var container = svg.parentElement;
            styleSvgContainer(container, svg);
        });
    }

    function enhanceSvgContainers(containers) {
        containers.forEach(function (container) {
            var svg = container.querySelector('svg');
            if (svg) {
                styleSvgContainer(container, svg);
            }
        });
    }

    function styleSvgContainer(container, svg) {
        // Style the container (light theme matching original)
        container.style.background = PALETTE.bg;
        container.style.borderRadius = '4px';
        container.style.borderLeft = '4px solid ' + PALETTE.borderAccent;
        container.style.padding = '16px 20px';
        container.style.margin = '1.5em 0';
        container.style.overflowX = 'auto';
        container.style.position = 'relative';

        // Style SVG elements
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';

        // Style all text elements with smart coloring
        var texts = svg.querySelectorAll('text');
        texts.forEach(function (text) {
            text.style.fontFamily = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
            text.style.fontSize = '12px';

            var content = text.textContent.trim();
            var color = getTextColor(content);
            text.setAttribute('fill', color);
            text.style.fill = color;
        });

        // Style lines (structural elements) - subtle gray
        var lines = svg.querySelectorAll('line');
        lines.forEach(function (line) {
            line.setAttribute('stroke', '#d1d5db');
            line.style.stroke = '#d1d5db';
        });

        var paths = svg.querySelectorAll('path');
        paths.forEach(function (path) {
            var stroke = path.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                path.setAttribute('stroke', '#9ca3af');
                path.style.stroke = '#9ca3af';
            }
            var fill = path.getAttribute('fill');
            if (fill && fill !== 'none' && fill !== 'transparent') {
                path.setAttribute('fill', '#9ca3af');
            }
        });

        // Style rectangles
        var rects = svg.querySelectorAll('rect');
        rects.forEach(function (rect) {
            var stroke = rect.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                rect.setAttribute('stroke', '#d1d5db');
                rect.style.stroke = '#d1d5db';
            }
            var fill = rect.getAttribute('fill');
            if (fill && fill !== 'none' && fill !== 'transparent') {
                var width = parseFloat(rect.getAttribute('width') || 0);
                var height = parseFloat(rect.getAttribute('height') || 0);
                if (width > 500 && height > 200) {
                    rect.setAttribute('fill', 'transparent');
                } else {
                    rect.setAttribute('fill', '#ffffff');
                }
            }
        });

        // Style polygons (arrows)
        var polygons = svg.querySelectorAll('polygon');
        polygons.forEach(function (poly) {
            poly.setAttribute('fill', '#9ca3af');
            poly.setAttribute('stroke', '#9ca3af');
        });

        // Style circles
        var circles = svg.querySelectorAll('circle');
        circles.forEach(function (circle) {
            var fill = circle.getAttribute('fill');
            if (fill && fill !== 'none') {
                circle.setAttribute('fill', '#9ca3af');
            }
            var stroke = circle.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                circle.setAttribute('stroke', '#d1d5db');
            }
        });

        // Add region labels if STACK/HEAP detected
        addRegionOverlays(container, svg, texts);
    }

    // ========================================
    // SMART TEXT COLORING
    // ========================================

    function getTextColor(content) {
        if (!content) return PALETTE.textPrimary;

        var c = content.toLowerCase().trim();

        // Type names and struct names
        if (c.match(/^(box|vec|string|rc|cell|refcell|option|result|unsafecell|node|cons|list|number)/i)) {
            return PALETTE.type;
        }
        if (c.match(/^(box<|vec<|rc<|cell<|refcell<|option<|result<|&str|&\[)/i)) {
            return PALETTE.type;
        }

        // Pointer fields
        if (c.match(/^ptr[:\s]|^ptr$|^\*|pointer|0x[0-9a-f]/i)) {
            return PALETTE.ptr;
        }

        // Length fields
        if (c.match(/^len[:\s]|^len$|^length/i)) {
            return PALETTE.len;
        }

        // Capacity fields
        if (c.match(/^cap[:\s]|^cap$|^capacity/i)) {
            return PALETTE.cap;
        }

        // Strong/weak counts
        if (c.match(/strong|count/i)) {
            return PALETTE.strong;
        }
        if (c.match(/weak/i)) {
            return PALETTE.weak;
        }

        // Borrow state
        if (c.match(/borrow/i)) {
            return PALETTE.borrow;
        }

        // Region labels
        if (c.match(/^stack$|^heap$|^data|^rodata|^text|^bss/i)) {
            return PALETTE.label;
        }

        // Freed/consumed
        if (c.match(/freed|consumed|invalid|empty/i)) {
            return PALETTE.freed;
        }

        // Size annotations
        if (c.match(/bytes|byte|\d+\s*b\b/i)) {
            return PALETTE.textSecondary;
        }

        // Comments and notes
        if (c.match(/^[<>←→↑↓]|grows|points|note|each|total|no |all /i)) {
            return PALETTE.textSecondary;
        }

        // Variable names (x:, y:, s:, v:, etc.)
        if (c.match(/^[a-z_]\w*:/)) {
            return PALETTE.textPrimary;
        }

        // Single characters (data bytes like h, e, l, l, o)
        if (c.length === 1 && c.match(/[a-z0-9]/i)) {
            return PALETTE.data;
        }

        // Numbers
        if (c.match(/^\d+$/)) {
            return PALETTE.value;
        }

        // Arrows and structural
        if (c.match(/^[-|+.=*><!~^v]+$/)) {
            return PALETTE.arrow;
        }

        return PALETTE.textPrimary;
    }

    // ========================================
    // REGION OVERLAYS (STACK/HEAP labels)
    // ========================================

    function addRegionOverlays(container, svg, texts) {
        var hasStack = false;
        var hasHeap = false;

        texts.forEach(function (t) {
            var content = t.textContent.trim().toUpperCase();
            if (content === 'STACK') hasStack = true;
            if (content === 'HEAP') hasHeap = true;
        });

        if (hasStack || hasHeap) {
            var bar = document.createElement('div');
            bar.style.cssText = 'display:flex;gap:12px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;';

            if (hasStack) {
                var stackBadge = createBadge('STACK', '#15803d', 'rgba(22,163,74,0.08)');
                bar.appendChild(stackBadge);
            }
            if (hasHeap) {
                var heapBadge = createBadge('HEAP', '#1d4ed8', 'rgba(37,99,235,0.08)');
                bar.appendChild(heapBadge);
            }

            container.insertBefore(bar, container.firstChild);
        }
    }

    function createBadge(text, color, bg) {
        var badge = document.createElement('span');
        badge.textContent = text;
        badge.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:0.6rem;font-weight:700;letter-spacing:0.12em;padding:2px 8px;border-radius:3px;color:' + color + ';background:' + bg + ';border:1px solid ' + color + '22;';
        return badge;
    }

    // ========================================
    // CODE BLOCK ENHANCEMENT (fallback for unprocessed bob blocks)
    // ========================================

    function enhanceCodeBlocks(codeElements) {
        codeElements.forEach(function (code) {
            var pre = code.parentElement;
            if (!pre) return;

            // Style the pre/code block (light theme)
            pre.style.background = PALETTE.bg;
            pre.style.borderRadius = '4px';
            pre.style.borderLeft = '4px solid ' + PALETTE.borderAccent;
            pre.style.padding = '16px 20px';
            pre.style.margin = '1.5em 0';
            pre.style.overflowX = 'auto';

            code.style.background = 'none';
            code.style.color = PALETTE.textPrimary;
            code.style.fontFamily = "'JetBrains Mono', 'SF Mono', monospace";
            code.style.fontSize = '0.8rem';
            code.style.lineHeight = '1.5';

            // Colorize the text content
            colorizeCodeBlock(code);
        });
    }

    function colorizeCodeBlock(code) {
        var html = code.innerHTML;

        // Colorize known patterns
        var replacements = [
            // Type names
            [/\b(Box|Vec|String|Rc|Cell|RefCell|Option|Result|UnsafeCell|Node|Cons|List)\b/g,
                '<span style="color:' + PALETTE.type + '">$1</span>'],
            // Pointer fields
            [/\b(ptr)(\s*[:*])/g,
                '<span style="color:' + PALETTE.ptr + '">$1</span>$2'],
            // Length fields
            [/\b(len)(\s*[:])/g,
                '<span style="color:' + PALETTE.len + '">$1</span>$2'],
            // Capacity fields
            [/\b(cap)(\s*[:])/g,
                '<span style="color:' + PALETTE.cap + '">$1</span>$2'],
            // Strong/weak
            [/\b(strong_count|strong|weak_count|weak)\b/g,
                '<span style="color:' + PALETTE.strong + '">$1</span>'],
            // Borrow
            [/\b(borrow_count|borrow)\b/g,
                '<span style="color:' + PALETTE.borrow + '">$1</span>'],
            // Region labels
            [/\b(STACK|HEAP|DATA|RODATA|TEXT)\b/g,
                '<span style="color:' + PALETTE.label + ';font-weight:700">$1</span>'],
            // Hex addresses
            [/(0x[0-9A-Fa-f_]+)/g,
                '<span style="color:' + PALETTE.ptr + '">$1</span>'],
            // Size annotations
            [/(\d+\s*bytes?)/gi,
                '<span style="color:' + PALETTE.textSecondary + '">$1</span>'],
            // Freed/consumed
            [/\b(freed|consumed)\b/gi,
                '<span style="color:' + PALETTE.freed + ';text-decoration:line-through">$1</span>'],
        ];

        replacements.forEach(function (r) {
            html = html.replace(r[0], r[1]);
        });

        code.innerHTML = html;
    }

    // ========================================
    // COLLAPSIBLE SECTIONS
    // ========================================

    function makeCollapsible() {
        var headings = document.querySelectorAll('#content main h3, #content main h4');
        headings.forEach(function (heading) {
            var text = heading.textContent.toLowerCase();
            if (text.indexOf('inside') === -1 && text.indexOf('assembly') === -1) return;
            if (heading.closest('details')) return;

            var wrapper = document.createElement('details');
            var summary = document.createElement('summary');
            summary.className = 'collapsible-summary';
            summary.textContent = heading.textContent;

            var elements = [];
            var sibling = heading.nextElementSibling;
            while (sibling && !['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
                elements.push(sibling);
                sibling = sibling.nextElementSibling;
            }

            if (elements.length < 2) return;

            heading.parentNode.insertBefore(wrapper, heading);
            wrapper.appendChild(summary);
            elements.forEach(function (el) {
                wrapper.appendChild(el);
            });
            heading.remove();
        });
    }

    // ========================================
    // PROFESSIONAL ICON REPLACEMENT
    // Replace ✅ and ❌ emoji with styled SVG icons
    // ========================================

    function replaceEmojiIcons() {
        var checkSvg = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6 5 8.5 9.5 3.5"/></svg>';
        var crossSvg = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>';

        var checkHtml = '<span class="icon-check" aria-label="correct">' + checkSvg + '</span>';
        var crossHtml = '<span class="icon-cross" aria-label="incorrect">' + crossSvg + '</span>';

        // Walk through all text nodes in the content area
        var content = document.querySelector('#content main') || document.querySelector('#content') || document.body;
        replaceInElement(content, checkHtml, crossHtml);
    }

    function replaceInElement(element, checkHtml, crossHtml) {
        // Process child nodes
        var nodes = Array.prototype.slice.call(element.childNodes);

        nodes.forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent;
                if (!/[✅❌✗✓✔️✖❎☑️]/.test(text)) return;

                // Replace emoji with HTML
                var html = text
                    .replace(/[✅✓✔️☑️]/g, checkHtml)
                    .replace(/[❌✗✖❎]/g, crossHtml);

                var wrapper = document.createElement('span');
                wrapper.innerHTML = html;

                // Replace text node with the new nodes
                var parent = node.parentNode;
                while (wrapper.firstChild) {
                    parent.insertBefore(wrapper.firstChild, node);
                }
                parent.removeChild(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip script and style elements
                var tag = node.tagName.toLowerCase();
                if (tag === 'script' || tag === 'style' || tag === 'textarea') return;
                // Recurse into child elements
                replaceInElement(node, checkHtml, crossHtml);
            }
        });
    }

    // ========================================
    // INJECT MINIMAL CSS FOR MEM-LAYOUT BLOCKS AND ICONS
    // ========================================

    function injectStyles() {
        var style = document.createElement('style');
        style.textContent = [
            '.mem-layout{display:flex;flex-direction:column;gap:12px;margin:1.5em 0;padding:20px 24px;background:#fff8f0;border-left:4px solid #CE422B;border-radius:4px;font-family:"SF Mono",Monaco,monospace;font-size:0.9em}',
            '.mem-layout-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
            '.mem-layout-label{min-width:120px;font-weight:600;color:#1a1a1a}',
            '.mem-layout-blocks{display:flex;gap:2px;align-items:center}',
            '.mem-layout-block{padding:5px 10px;border-radius:3px;font-size:0.85em;font-weight:500;border:1px solid;text-align:center;white-space:nowrap}',
            '.mem-layout-block.ptr{background:rgba(37,99,235,0.08);border-color:rgba(37,99,235,0.3);color:#1d4ed8}',
            '.mem-layout-block.len{background:rgba(22,163,74,0.08);border-color:rgba(22,163,74,0.3);color:#15803d}',
            '.mem-layout-block.cap{background:rgba(161,98,7,0.08);border-color:rgba(161,98,7,0.25);color:#92400e}',
            '.mem-layout-block.val{background:rgba(206,66,43,0.08);border-color:rgba(206,66,43,0.25);color:#b91c1c}',
            '.mem-layout-block.tag{background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.25);color:#6d28d9}',
            '.mem-layout-block.data{background:rgba(161,98,7,0.06);border-color:rgba(161,98,7,0.2);color:#92400e}',
            '.mem-layout-block.freed{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.12);color:#9ca3af;border-style:dashed;text-decoration:line-through}',
            '.mem-layout-arrow{color:#6b7280;font-size:1.1rem;padding:0 4px}',
            '.mem-layout-heap-marker{font-size:0.75em;color:rgba(37,99,235,0.6);font-style:italic;margin-left:4px}',
            '.mem-layout-note{font-size:0.8em;color:#6b7280;margin-top:4px;font-style:italic}',
            '.icon-check,.icon-cross{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;vertical-align:middle;margin-right:4px;flex-shrink:0}',
            '.icon-check{background:rgba(22,163,74,0.1);border:1.5px solid rgba(22,163,74,0.4);color:#15803d}',
            '.icon-cross{background:rgba(220,38,38,0.08);border:1.5px solid rgba(220,38,38,0.35);color:#dc2626}',
            '.icon-check svg,.icon-cross svg{width:10px;height:10px}',
            'pre .icon-check,pre .icon-cross,code .icon-check,code .icon-cross{width:14px;height:14px;margin-right:2px}',
            'pre .icon-check svg,pre .icon-cross svg,code .icon-check svg,code .icon-cross svg{width:8px;height:8px}',
            'td .icon-check,td .icon-cross{width:16px;height:16px}',
        ].join('\n');
        document.head.appendChild(style);
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    function init() {
        injectStyles();
        makeCollapsible();
        replaceEmojiIcons();
        // Delay to ensure svgbob has rendered
        setTimeout(enhanceAllDiagrams, 300);
        // Run again after a longer delay in case of slow rendering
        setTimeout(enhanceAllDiagrams, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
