import { INetwork } from "../store/networks/networkTypes"

export const dummyState: INetwork = {
  id: "0",
  name: "dummy network",
  people: [
    {
      id: "1",
      name: "Luke Skywalker",
      thumbnail_url:
        "https://static.tvtropes.org/pmwiki/pub/images/skywalker_luke.jpg",
      relationships: {
        "2": ["Brother", "Sister"],
        "3": ["Son", "Father"],
      },
    },
    {
      id: "2",
      name: "Leia Organa",
      thumbnail_url: "https://www1.pictures.zimbio.com/mp/Pkxxy9ZCJAjx.jpg",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
      },
    },
    {
      id: "3",
      name: "Anakin Skywalker",
      thumbnail_url:
        "https://pbs.twimg.com/profile_images/939771637213417472/-PlBbjo_.jpg",
      relationships: {
        "1": ["Father", "Son"],
        "2": ["Father", "Daughter"],
      },
    },
    {
      id: "4",
      name: "Nute Gunray",
      thumbnail_url:
        "https://static.tvtropes.org/pmwiki/pub/images/nute_gunray_sw_4394.jpg",
      relationships: {
        "5": ["Associate", "Associate"],
      },
    },
    {
      id: "5",
      name: "Lott Dodd",
      thumbnail_url: "https://www.postavy.cz/foto/lott-dodd-foto.jpg",
      relationships: {
        "4": ["Associate", "Associate"],
      },
    },
    {
      id: "6",
      name: "Sheev Palpatine",
      thumbnail_url:
        "https://memegenerator.net/img/images/600x600/16353631/chancellor-palpatine-do-it.jpg",
      relationships: {
        "4": ["Puppetmaster", "Pawn"],
        "3": ["Mentor", "Secret Apprentice"],
      },
    },
    {
      id: "7",
      name: "Count Dooku",
      thumbnail_url:
        "https://pbs.twimg.com/profile_images/1031629581692878848/eWF-884Y_400x400.jpg",
      relationships: {
        "4": ["Associate", "Associate"],
        "6": ["Apprentice", "Master"],
      },
    },
  ],
}
