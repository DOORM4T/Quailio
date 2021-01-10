import { INetwork } from "../store/networks/networkTypes"

export const dummyState: INetwork = {
  id: "0",
  name: "dummy network",
  people: [
    {
      name: "Luke Skywalker",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/3/3d/LukeSkywalker.png/revision/latest/scale-to-width-down/499?cb=20201218190434",
      relationships: {
        "Leia Organa": ["Brother", "Sister"],
        "Anakin Skywalker": ["Son", "Father"],
      },
    },
    {
      name: "Leia Organa",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/f/f1/Leia_Organa_TROS.png/revision/latest/scale-to-width-down/500?cb=20200102034101",
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
        "https://static.wikia.nocookie.net/starwars/images/6/6f/Anakin_Skywalker_RotS.png/revision/latest/scale-to-width-down/500?cb=20130621175844",
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
      relationships: {
        "Lott Dodd": ["Associate", "Associate"],
      },
    },
    {
      name: "Lott Dodd",
      relationships: {
        "Nute Gunray": ["Associate", "Associate"],
      },
    },
    {
      name: "Sheev Palpatine",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/9/98/Palpatine-TROS-infobox.jpg/revision/latest/scale-to-width-down/500?cb=20200401080828",
      relationships: {
        "Nute Gunray": ["Puppetmaster", "Pawn"],
        "Anakin Skywalker": ["Mentor", "Secret Apprentice"],
      },
    },
    {
      name: "Count Dooku",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/b/b8/Dooku_Headshot.jpg/revision/latest/scale-to-width-down/500?cb=20180430181839",
      relationships: {
        "Nute Gunray": ["Associate", "Associate"],
        "Sheev Palpatine": ["Apprentice", "Master"],
      },
    },
  ],
}
