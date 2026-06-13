import { useEffect } from "react";
import { DISPLACEMENT_MAP } from "./displacement-map";

/**
 * The liquid-glass effect is a single SVG filter that every <Glass> shares.
 *
 * It is applied as a `backdrop-filter`, so the filter operates on whatever is
 * painted *behind* the element. Because all coordinates use `objectBoundingBox`
 * units and the displacement map is stretched with `preserveAspectRatio="none"`,
 * the very same filter resolves correctly for any element size / position — the
 * element's own CSS (size, x/y, border-radius) is honoured automatically:
 *   - size / position  -> the bounding box the filter maps onto
 *   - border-radius     -> clips the backdrop-filter region for free
 *
 * The defs are injected into <body> once and ref-counted, so N glasses never
 * duplicate the ~120kb displacement map.
 */
export const GLASS_FILTER_ID = "ms-liquid-glass";
const DEFS_ID = "ms-liquid-glass-defs";

let refCount = 0;

/**
 * Three displacement passes (one per RGB channel, slightly different scales)
 * give chromatic aberration at the edges; the final pass re-adds a specular
 * highlight derived from the map. Mirrors the experimental-glass filter, with
 * the lens stretched to fill the whole bounding box (0,0 -> 1,1).
 */
const buildFilterMarkup = () => `
<filter
    id="${GLASS_FILTER_ID}"
    filterUnits="objectBoundingBox"
    primitiveUnits="objectBoundingBox"
    color-interpolation-filters="sRGB"
    x="0" y="0" width="1" height="1"
>
    <feFlood flood-color="rgb(128,128,128)" flood-opacity="1" result="mapBg" />
    <feImage
        href="${DISPLACEMENT_MAP}"
        preserveAspectRatio="none"
        result="rawMap"
        x="0" y="0" width="1" height="1"
    />
    <feComposite in="rawMap" in2="mapBg" operator="over" result="map" />

    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.104"
        xChannelSelector="R" yChannelSelector="G" x="0" y="0" width="1" height="1" />
    <feColorMatrix type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="dispR" />

    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.102"
        xChannelSelector="R" yChannelSelector="G" x="0" y="0" width="1" height="1" />
    <feColorMatrix type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="dispG" />

    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.1"
        xChannelSelector="R" yChannelSelector="G" x="0" y="0" width="1" height="1" />
    <feColorMatrix type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="dispB" />

    <feComposite in="dispR" in2="dispG" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
    <feComposite in2="dispB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lensResult" />

    <feColorMatrix in="map" type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 -0.5019607843137255" result="specMask" />
    <feComposite in="specMask" in2="lensResult" operator="arithmetic" k1="0" k2="0" k3="1" k4="0" />
</filter>`;

/** Ensure the shared <svg><defs> exists in the document (idempotent). */
const acquireGlassFilter = () => {
    if (typeof document === "undefined") return;
    refCount += 1;
    if (document.getElementById(DEFS_ID)) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = DEFS_ID;
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.cssText =
        "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    svg.innerHTML = `<defs>${buildFilterMarkup()}</defs>`;
    document.body.appendChild(svg);
};

/** Drop the shared defs once the last <Glass> unmounts. */
const releaseGlassFilter = () => {
    if (typeof document === "undefined") return;
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) document.getElementById(DEFS_ID)?.remove();
};

/** Mount the shared liquid-glass filter; returns the filter id to reference. */
export const useGlassFilter = () => {
    useEffect(() => {
        acquireGlassFilter();
        return releaseGlassFilter;
    }, []);

    return GLASS_FILTER_ID;
};
