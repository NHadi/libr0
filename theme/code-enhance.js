(function () {
    'use strict';

    var langLabels = {
        'rust': 'Rust',
        'bash': 'Shell',
        'sh': 'Shell',
        'asm': 'Assembly',
        'toml': 'TOML',
        'json': 'JSON',
        'text': '',
        'bob': null,      // skip - has own styling
        'mermaid': null,  // skip - has own styling
    };

    function enhanceCodeBlocks() {
        var pres = document.querySelectorAll('#content main pre');
        pres.forEach(function (pre) {
            var code = pre.querySelector('code');
            if (!code) return;

            // Determine language from code class
            var classes = code.className || '';
            var langMatch = classes.match(/language-(\w+)/);
            var lang = langMatch ? langMatch[1] : '';

            // Skip bob and mermaid blocks
            if (lang === 'bob' || lang === 'mermaid') return;
            // Skip blocks already enhanced
            if (pre.classList.contains('enhanced-code-block')) return;

            pre.classList.add('enhanced-code-block');

            // Add language label
            var label = langLabels[lang];
            if (label === null) return; // explicitly skipped
            if (label || lang) {
                var langEl = document.createElement('span');
                langEl.className = 'code-lang-label';
                langEl.textContent = label || lang.toUpperCase();
                pre.appendChild(langEl);
            }

            // Add copy button
            var btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy code to clipboard');
            btn.addEventListener('click', function () {
                var text = code.textContent;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        showCopied(btn);
                    }).catch(function () {
                        fallbackCopy(text, btn);
                    });
                } else {
                    fallbackCopy(text, btn);
                }
            });
            pre.appendChild(btn);
        });
    }

    function showCopied(btn) {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
        }, 2000);
    }

    function fallbackCopy(text, btn) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopied(btn);
        } catch (e) {
            btn.textContent = 'Failed';
            setTimeout(function () {
                btn.textContent = 'Copy';
            }, 2000);
        }
        document.body.removeChild(textarea);
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceCodeBlocks);
    } else {
        enhanceCodeBlocks();
    }
})();
