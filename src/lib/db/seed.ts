import type { Database } from "@/lib/types";

const now = new Date().toISOString();

/**
 * Seed content taken from the Trovert Space private-cinema flyers.
 * Everything here is editable from the admin dashboard.
 */
export const seedDatabase: Database = {
  movies: [
    {
      id: "mv_interstellar",
      title: "Interstellar",
      year: 2014,
      genre: "Sci-Fi / Drama",
      language: "English",
      durationMins: 169,
      rating: "PG-13",
      synopsis:
        "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      posterUrl: "",
      accent: "#5B86C6",
      active: true,
      createdAt: now,
    },
    {
      id: "mv_the_dark_knight",
      title: "The Dark Knight",
      year: 2008,
      genre: "Action / Thriller",
      language: "English",
      durationMins: 152,
      rating: "PG-13",
      synopsis:
        "Batman raises the stakes in his war on crime as the Joker throws Gotham into anarchy.",
      posterUrl: "",
      accent: "#8E7CC3",
      active: true,
      createdAt: now,
    },
    {
      id: "mv_the_legend_of_maula_jatt",
      title: "The Legend of Maula Jatt",
      year: 2022,
      genre: "Action / Punjabi",
      language: "Punjabi",
      durationMins: 168,
      rating: "18+",
      synopsis:
        "A fearsome warrior returns to settle an old score with the ruthless Natt clan.",
      posterUrl: "",
      accent: "#C0392B",
      active: true,
      createdAt: now,
    },
    {
      id: "mv_la_la_land",
      title: "La La Land",
      year: 2016,
      genre: "Romance / Musical",
      language: "English",
      durationMins: 128,
      rating: "PG-13",
      synopsis:
        "A jazz pianist and an aspiring actress fall in love while chasing their dreams in Los Angeles.",
      posterUrl: "",
      accent: "#E1A95F",
      active: true,
      createdAt: now,
    },
    {
      id: "mv_3_idiots",
      title: "3 Idiots",
      year: 2009,
      genre: "Comedy / Drama",
      language: "Hindi",
      durationMins: 170,
      rating: "PG",
      synopsis:
        "Two friends search for their long-lost companion and revisit their college days.",
      posterUrl: "",
      accent: "#D98E3A",
      active: true,
      createdAt: now,
    },
  ],

  slots: [
    { id: "sl_1100", label: "11:00 AM - 1:30 PM", start: "11:00", end: "13:30", period: "afternoon-evening", order: 1, active: true },
    { id: "sl_1330", label: "1:30 PM - 4:00 PM", start: "13:30", end: "16:00", period: "afternoon-evening", order: 2, active: true },
    { id: "sl_1600", label: "4:00 PM - 6:30 PM", start: "16:00", end: "18:30", period: "afternoon-evening", order: 3, active: true },
    { id: "sl_1830", label: "6:30 PM - 9:00 PM", start: "18:30", end: "21:00", period: "afternoon-evening", order: 4, active: true },
    { id: "sl_2100", label: "9:00 PM - 11:30 PM", start: "21:00", end: "23:30", period: "afternoon-evening", order: 5, active: true },
    { id: "sl_2330", label: "11:30 PM - 2:00 AM", start: "23:30", end: "02:00", period: "late-night-morning", order: 6, active: true },
    { id: "sl_0200", label: "2:00 AM - 4:30 AM", start: "02:00", end: "04:30", period: "late-night-morning", order: 7, active: true },
    { id: "sl_0430", label: "4:30 AM - 7:00 AM", start: "04:30", end: "07:00", period: "late-night-morning", order: 8, active: true },
    { id: "sl_0700", label: "7:00 AM - 9:30 AM", start: "07:00", end: "09:30", period: "late-night-morning", order: 9, active: true },
    { id: "sl_0930", label: "9:30 AM - 11:00 AM", start: "09:30", end: "11:00", period: "late-night-morning", order: 10, active: true },
  ],

  packages: [
    {
      id: "pk_shared",
      name: "Shared Slot",
      note: "Per person. Date & time depend on availability.",
      price: 2500,
      minGuests: 1,
      maxGuests: 11,
      exclusive: false,
      order: 1,
      active: true,
    },
    {
      id: "pk_couple",
      name: "Couple",
      note: "2 persons only. Specific dates/days.",
      price: 10000,
      minGuests: 2,
      maxGuests: 2,
      exclusive: true,
      order: 2,
      active: true,
    },
    {
      id: "pk_group4",
      name: "Group of 4",
      note: "Specific dates/days. Entire cinema yours.",
      price: 15000,
      minGuests: 3,
      maxGuests: 4,
      exclusive: true,
      order: 3,
      active: true,
    },
    {
      id: "pk_group6",
      name: "Group of 6",
      note: "Specific dates/days. Entire cinema yours.",
      price: 20000,
      minGuests: 5,
      maxGuests: 6,
      exclusive: true,
      order: 4,
      active: true,
    },
    {
      id: "pk_group11",
      name: "Group of more than 6",
      note: "Max 11 persons. Any date / day / time.",
      price: 25000,
      minGuests: 7,
      maxGuests: 11,
      exclusive: true,
      order: 5,
      active: true,
    },
  ],

  bookings: [],
  blocks: [],

  settings: {
    venueNote: "Trovert Space presents a private home cinema experience.",
    locationNote:
      "It's a home cinema in DHA 5, Lahore. Exact location is shared once the booking confirms.",
    whatsapp: "+92 300 0000000",
    instagram: "trovertspace",
    currency: "PKR",
  },
};
