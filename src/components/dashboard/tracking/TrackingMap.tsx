"use client";

import Image from "next/image";

export function TrackingMap() {
    return (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 h-full min-h-[300px] relative overflow-hidden">
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src="https://www.openstreetmap.org/export/embed.html?bbox=-0.15%2C51.5%2C-0.1%2C51.52&amp;layer=mapnik&amp;marker=51.51%2C-0.12"
                className="absolute inset-0 w-full h-full"
                title="Tracking Map"
            ></iframe>
        </div>
    );
}
