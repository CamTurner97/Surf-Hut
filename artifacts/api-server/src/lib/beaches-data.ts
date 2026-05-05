import type { Beach } from "@workspace/api-zod";

export const SYDNEY_BEACHES: Beach[] = [
  {
    id: "palm-beach",
    name: "Palm Beach",
    region: "northern-beaches",
    latitude: -33.5996,
    longitude: 151.3252,
    facingDirection: "E",
    description:
      "Sydney's northernmost surf beach. Long, exposed sweep that picks up most swells; can get crowded on the south corner when it's working.",
    heroImageUrl: "/api/images/palm-beach.png",
  },
  {
    id: "avalon",
    name: "Avalon",
    region: "northern-beaches",
    latitude: -33.6334,
    longitude: 151.3308,
    facingDirection: "E",
    description:
      "Powerful beach break flanked by headlands. Best at mid-tide with a clean east swell and offshore westerlies.",
    heroImageUrl: "/api/images/avalon.png",
  },
  {
    id: "newport",
    name: "Newport",
    region: "northern-beaches",
    latitude: -33.6595,
    longitude: 151.3185,
    facingDirection: "E",
    description:
      "Reliable peaks across a long stretch of sand. Handles a bit of size and is a Northern Beaches staple for all levels.",
    heroImageUrl: "/api/images/newport.png",
  },
  {
    id: "north-narrabeen",
    name: "North Narrabeen",
    region: "northern-beaches",
    latitude: -33.7035,
    longitude: 151.3,
    facingDirection: "E",
    description:
      "Sydney's most famous performance wave. The lefts off the rocks at the northern end are a world-class playground when it lines up.",
    heroImageUrl: "/api/images/north-narrabeen.png",
  },
  {
    id: "collaroy",
    name: "Collaroy",
    region: "northern-beaches",
    latitude: -33.7349,
    longitude: 151.3014,
    facingDirection: "E",
    description:
      "Sheltered southern corner is a local favourite when the swell is up and the wind is unfriendly elsewhere.",
    heroImageUrl: "/api/images/collaroy.png",
  },
  {
    id: "long-reef",
    name: "Long Reef",
    region: "northern-beaches",
    latitude: -33.7445,
    longitude: 151.3115,
    facingDirection: "NE",
    description:
      "Long, mellow point break wrapping around the headland. A patient longboarder's wave on a clean east swell.",
    heroImageUrl: "/api/images/long-reef.png",
  },
  {
    id: "dee-why",
    name: "Dee Why",
    region: "northern-beaches",
    latitude: -33.7536,
    longitude: 151.3,
    facingDirection: "E",
    description:
      "Punchy peaks along the main beach plus a heaving reef break on the south side that only the brave paddle out for.",
    heroImageUrl: "/api/images/dee-why.png",
  },
  {
    id: "north-curl-curl",
    name: "North Curl Curl",
    region: "northern-beaches",
    latitude: -33.7672,
    longitude: 151.3008,
    facingDirection: "E",
    description:
      "Sand-bottom wedges that turn on with east-southeast swell. Less crowded than its big neighbours.",
    heroImageUrl: "/api/images/north-curl-curl.png",
  },
  {
    id: "south-curl-curl",
    name: "South Curl Curl",
    region: "northern-beaches",
    latitude: -33.774,
    longitude: 151.2987,
    facingDirection: "E",
    description:
      "Fast, hollow beach break with a strong rip on bigger days. A core local crew make this their morning lap.",
    heroImageUrl: "/api/images/south-curl-curl.png",
  },
  {
    id: "freshwater",
    name: "Freshwater",
    region: "northern-beaches",
    latitude: -33.7811,
    longitude: 151.2887,
    facingDirection: "E",
    description:
      "Where Duke Kahanamoku surfed in 1915. Protected from southerlies and offers fun beach break peaks across all tides.",
    heroImageUrl: "/api/images/freshwater.png",
  },
  {
    id: "queenscliff",
    name: "Queenscliff",
    region: "northern-beaches",
    latitude: -33.7866,
    longitude: 151.2887,
    facingDirection: "E",
    description:
      "Northern end of the Manly stretch. Bombora reef on bigger days and a forgiving beach break in between.",
    heroImageUrl: "/api/images/queenscliff.png",
  },
  {
    id: "north-steyne",
    name: "North Steyne (Manly)",
    region: "northern-beaches",
    latitude: -33.7958,
    longitude: 151.2884,
    facingDirection: "E",
    description:
      "The middle stretch of Manly Beach. Plenty of peaks and easy access — a great spot for a quick after-work surf.",
    heroImageUrl: "/api/images/north-steyne.png",
  },
  {
    id: "south-steyne",
    name: "South Steyne (Manly)",
    region: "northern-beaches",
    latitude: -33.8,
    longitude: 151.2887,
    facingDirection: "E",
    description:
      "Manly's southern corner. Sheltered when the wind swings south and the busiest spot in town for board hire and lessons.",
    heroImageUrl: "/api/images/south-steyne.png",
  },
  {
    id: "bondi",
    name: "Bondi",
    region: "eastern-suburbs",
    latitude: -33.8908,
    longitude: 151.2773,
    facingDirection: "SE",
    description:
      "Sydney's icon. Backpackers in the middle, locals on the south corner and longboarders up north — something for everyone.",
    heroImageUrl: "/api/images/bondi.png",
  },
  {
    id: "tamarama",
    name: "Tamarama",
    region: "eastern-suburbs",
    latitude: -33.902,
    longitude: 151.2693,
    facingDirection: "E",
    description:
      "Tiny pocket beach with a punchy shore break and notorious rips. Watch it for a session before paddling out.",
    heroImageUrl: "/api/images/tamarama.png",
  },
  {
    id: "bronte",
    name: "Bronte",
    region: "eastern-suburbs",
    latitude: -33.905,
    longitude: 151.268,
    facingDirection: "E",
    description:
      "Compact beach with a strong rip down the middle (the Bronte Express) and shifty peaks on either side.",
    heroImageUrl: "/api/images/bronte.png",
  },
  {
    id: "maroubra",
    name: "Maroubra",
    region: "eastern-suburbs",
    latitude: -33.9499,
    longitude: 151.2576,
    facingDirection: "E",
    description:
      "Long, exposed beach that handles size better than most in the east. Three distinct ends: north, middle and south.",
    heroImageUrl: "/api/images/maroubra.png",
  },
  {
    id: "wanda",
    name: "Wanda",
    region: "cronulla",
    latitude: -34.0349,
    longitude: 151.1581,
    facingDirection: "E",
    description:
      "Northern end of the long Cronulla strip. Quieter beach break peaks away from the crowds at Cronulla Point.",
    heroImageUrl: "/api/images/wanda.png",
  },
  {
    id: "north-cronulla",
    name: "North Cronulla",
    region: "cronulla",
    latitude: -34.044,
    longitude: 151.1573,
    facingDirection: "E",
    description:
      "Consistent beach break with easy access from the esplanade. Picks up east, north-east and south swell.",
    heroImageUrl: "/api/images/north-cronulla.png",
  },
  {
    id: "cronulla-point",
    name: "Cronulla Point",
    region: "cronulla",
    latitude: -34.0561,
    longitude: 151.1565,
    facingDirection: "SE",
    description:
      "A long, hollow right-hand point break. Cronulla's crown jewel and ferociously protected by locals when it's pumping.",
    heroImageUrl: "/api/images/cronulla-point.png",
  },
];
