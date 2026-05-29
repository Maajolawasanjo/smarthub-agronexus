const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '../public/brush-border.svg');

function generateEnsoSVG() {
    const size = 500;
    const center = size / 2;
    const baseRadius = 200;
    const points = [];

    // Enso parameters
    const startAngle = 0.1; // Start a bit off 0
    const endAngle = Math.PI * 2 * 0.95; // Leave a gap for the "Enso" look
    const steps = 200;

    // Generate the path points
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = startAngle + (endAngle - startAngle) * t;

        // Tapering logic: Thick in middle, thin at ends
        // Use sine wave for thickness profile: sin(0) -> 0, sin(PI/2) -> 1, sin(PI) -> 0
        // We map t (0 to 1) to (0 to PI) for a single hump of thickness
        const thicknessProfile = Math.sin(t * Math.PI);

        // Base thickness + variability
        const width = 5 + (thicknessProfile * 20) + (Math.random() * 3);

        // Add roughness/jitter to the radius
        const jitter = (Math.random() - 0.5) * 8;
        const r = baseRadius + jitter;

        points.push({ angle, r, width });
    }

    // Construct the SVG path text
    // We need to go "out" along the top edge of the stroke, then "back" along the bottom edge

    let pathD = "";

    // Forward pass (Outer edge)
    points.forEach((p, i) => {
        const rOuter = p.r + p.width / 2;
        const x = center + Math.cos(p.angle) * rOuter;
        const y = center + Math.sin(p.angle) * rOuter;
        if (i === 0) pathD += `M ${x.toFixed(1)} ${y.toFixed(1)} `;
        else pathD += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
    });

    // Backward pass (Inner edge)
    // We reverse the points to go back to the start
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const rInner = p.r - p.width / 2;
        const x = center + Math.cos(p.angle) * rInner;
        const y = center + Math.sin(p.angle) * rInner;

        // Curve the end cap slightly
        if (i === points.length - 1) {
            pathD += `Q ${x.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
        pathD += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
    }

    pathD += "Z"; // Close the loop

    const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" fill="#1B4D28" opacity="0.95" />
</svg>
`.trim();

    fs.writeFileSync(OUTPUT_PATH, svgContent);
    console.log(`Generated SVG brush border at: ${OUTPUT_PATH}`);
}

generateEnsoSVG();
