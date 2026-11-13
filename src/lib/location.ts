/** Map links for a point (the shop's coordinates come from the backoffice). */
export interface MapPoint {
  latitude: number;
  longitude: number;
}

const point = ({ latitude, longitude }: MapPoint) => `${latitude},${longitude}`;

/** Embeddable map centred on the point (no API key needed). */
export const mapEmbedUrl = (at: MapPoint) => `https://www.google.com/maps?q=${point(at)}&z=17&output=embed`;

/** The pin in Google Maps. */
export const mapOpenUrl = (at: MapPoint) => `https://www.google.com/maps/search/?api=1&query=${point(at)}`;

/** Turn-by-turn directions to the point from wherever the visitor is. */
export const mapDirectionsUrl = (at: MapPoint) => `https://www.google.com/maps/dir/?api=1&destination=${point(at)}`;
