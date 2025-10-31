// Create the color preview circle
const colorPreview = document.createElement('div');
colorPreview.id = 'color-picker-preview';
Object.assign(colorPreview.style, {
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
    backgroundColor: 'transparent'
});
document.body.appendChild(colorPreview);

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

// --- Update preview on mouse move ---
document.addEventListener('mousemove', (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const finalColor = getFinalColor(el);
    const rgb = `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`;

    colorPreview.style.backgroundColor = rgb;
});
