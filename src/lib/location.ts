/** Where the TechLium shop is, for the map and the directions links. */
export const SHOP_LOCATION = {
  latitude: 5.3013244,
  longitude: -4.0021515,
  /** The same point as read on a map: 5°18'04.8"N 4°00'07.8"W. */
  dms: `5°18'04.8"N 4°00'07.8"W`,
};

const POINT = `${SHOP_LOCATION.latitude},${SHOP_LOCATION.longitude}`;

/** Embeddable map centred on the shop (no API key needed). */
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${POINT}&z=17&output=embed`;

/** The shop's pin in Google Maps. */
export const MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${POINT}`;

/** Turn-by-turn directions to the shop from wherever the visitor is. */
export const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${POINT}`;
