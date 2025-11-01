// --- Helper functions ---

function parseColor(colorStr) {
    const rgba = colorStr.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
    if (!rgba) return {r: 255, g: 255, b: 255, a: 1}; // fallback white
    return {
        r: parseInt(rgba[1]),
        g: parseInt(rgba[2]),
        b: parseInt(rgba[3]),
        a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1
    };
}

function blendColors(top, bottom) {
    const alpha = top.a + bottom.a * (1 - top.a);
    if (alpha === 0) return {r:0, g:0, b:0, a:0};
    return {
        r: Math.round((top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha),
        g: Math.round((top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha),
        b: Math.round((top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha),
        a: alpha
    };
}

function getFinalColor(el) {
    if (!el) return {r: 255, g: 255, b: 255, a: 1}; // fallback white
    const style = window.getComputedStyle(el);
    const color = parseColor(style.backgroundColor);

    if (color.a === 1) return color; // fully opaque
    if (color.a === 0) return getFinalColor(el.parentElement); // fully transparent

    // partially transparent → blend with parent
    const parentColor = getFinalColor(el.parentElement);
    return blendColors(color, parentColor);
}

const colorCache = new WeakMap();
function getColorAt(x, y) {
    const element = document.elementFromPoint(x, y);
    if (colorCache.has(element)) {
        return colorCache.get(element);
    }
    const color = getFinalColor(element);
    colorCache.set(element, color);
    return color;
}

function isPageDark(step = 100) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const brightnessValues = [];

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const color = getColorAt(x, y);

            const brightness = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
            brightnessValues.push(brightness);
        }
    }

    brightnessValues.sort((a, b) => a - b);
    const mid = Math.floor(brightnessValues.length / 2);
    const medianBrightness = brightnessValues.length % 2 === 0
        ? (brightnessValues[mid - 1] + brightnessValues[mid]) / 2
        : brightnessValues[mid];

    return medianBrightness < 128;
}

function createColorPreview(dark) {
    let host = document.getElementById('color-picker-host');
    if (!host) {
        host = document.createElement('color-picker-host');
        host.id = 'color-picker-host';
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });

        const preview = document.createElement('div');
        preview.id = 'color-picker-preview';
        Object.assign(preview.style, {
            all: 'unset',
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontFamily: 'system-ui',
            backgroundColor: dark ? 'black' : 'white',
        });
        preview.textContent = dark ? '🌙' : '☀️';

        shadow.appendChild(preview);

        const rect = preview.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const color = getColorAt(centerX, centerY);
        preview.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

        return preview;
    } else {
        return host.shadowRoot.querySelector('#color-picker-preview');
    }
}

const dark = isPageDark(100);
let colorPreview = createColorPreview(dark);

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
            if (node.id === 'color-picker-preview') {
                colorPreview = createColorPreview(dark);
            }
        });
    });
});
observer.observe(document.body, { childList: true });

document.addEventListener('mousemove', (e) => {
    let color = getColorAt(e.clientX, e.clientY);
    
    const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
    colorPreview.style.backgroundColor = rgb;
});
