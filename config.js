window.DASH_CONFIG = {
  // Smithland, KY
  home: {
    lat: 37.1394,
    lon: -88.4028,
    timezone: "America/Chicago",
    label: "Smithland, KY"
  },

  // Feed rotation seconds
  rotateSec: 22,

  // Normal mode feeds (animals + underwater + weather + deer pantry)
  feedsNormal: [
    {
      name: "Underwater Reef Cam (Explore Oceans)",
      type: "youtube",
      id: "1zcIUk66HX4"
    },
    {
      name: "Brownville Deer Pantry (Skyline Webcams)",
      type: "iframe",
      url: "https://www.skylinewebcams.com/en/webcam/united-states/maine/brownville/deer-pantry.html"
    },
    {
      name: "Brown Bears (Explore)",
      type: "youtube",
      id: "1HGX0sWwA5w"
    },
    {
      name: "African Waterhole (Explore)",
      type: "youtube",
      id: "ydYDqZQpim8"
    },
    {
      name: "Bald Eagle Nest (Explore)",
      type: "youtube",
      id: "B4-L2nfGcuE"
    },
    {
      name: "Mount Washington Weather Cam",
      type: "youtube",
      id: "1i9Gm7EoR9A"
    }
  ],

  // Severe mode feeds (only used when alerts are active near Smithland)
  feedsSevere: [
    {
      name: "RYAN HALL, Y'ALL (24/7 Severe Monitoring)",
      type: "youtube",
      id: "ezp-7eLXBVs"
    },
    {
      name: "Live Storm Chaser (Tornado/Severe Coverage)",
      type: "youtube",
      id: "B_YQdy8TrPQ"
    },
    {
      name: "Radar / Weather Coverage Stream",
      type: "youtube",
      id: "0smDzw4Hil8"
    }
  ],

  // Notes + Photos
  photos: { intervalSec: 12 }
};
