import { INetwork } from "../store/networks/networkTypes"

export const dummyState: INetwork = {
  id: "0",
  name: "dummy network",
  people: [
    {
      name: "Luke Skywalker",
      thumbnail_url:
        "https://static.tvtropes.org/pmwiki/pub/images/skywalker_luke.jpg",
      relationships: {
        "Leia Organa": ["Brother", "Sister"],
        "Anakin Skywalker": ["Son", "Father"],
      },
    },
    {
      name: "Leia Organa",
      thumbnail_url: "https://www1.pictures.zimbio.com/mp/Pkxxy9ZCJAjx.jpg",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
    {
      name: "Anakin Skywalker",
      thumbnail_url:
        "https://pbs.twimg.com/profile_images/939771637213417472/-PlBbjo_.jpg",
      relationships: {
        "Luke Skywalker": ["Father", "Son"],
        "Leia Organa": ["Father", "Daughter"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
    {
      name: "Nute Gunray",
      thumbnail_url:
        "https://static.tvtropes.org/pmwiki/pub/images/nute_gunray_sw_4394.jpg",
      relationships: {
        "Lott Dodd": ["Associate", "Associate"],
      },
    },
    {
      name: "Lott Dodd",
      thumbnail_url: "https://www.postavy.cz/foto/lott-dodd-foto.jpg",
      relationships: {
        "Nute Gunray": ["Associate", "Associate"],
      },
    },
    {
      name: "Sheev Palpatine",
      thumbnail_url:
        "https://memegenerator.net/img/images/600x600/16353631/chancellor-palpatine-do-it.jpg",
      relationships: {
        "Nute Gunray": ["Puppetmaster", "Pawn"],
        "Anakin Skywalker": ["Mentor", "Secret Apprentice"],
      },
    },
    {
      name: "Count Dooku",
      thumbnail_url:
        "https://pbs.twimg.com/profile_images/1031629581692878848/eWF-884Y_400x400.jpg",
      relationships: {
        "Nute Gunray": ["Associate", "Associate"],
        "Sheev Palpatine": ["Apprentice", "Master"],
      },
    },
  ],
}
