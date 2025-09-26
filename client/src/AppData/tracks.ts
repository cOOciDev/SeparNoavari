// client/src/app/data/tracks.ts
export type Track = {
  id: number;
  slug: string;                // برای لینک /tracks/:slug
  titleKey: string;            // i18n: tracks.<slug>.title
  shortKey: string;            // i18n: tracks.<slug>.short
  longKey: string;             // i18n: tracks.<slug>.long
  cover?: string;              // مسیر عکس کاور
  tags?: string[];
  resources?: { labelKey: string; href: string }[];
};

export const TRACKS: Track[] = [
  {
    id: 1,
    slug: "resilience",
    titleKey: "tracks.resilience.title",
    shortKey: "tracks.resilience.short",
    longKey: "tracks.resilience.long",
    cover: "/images/tracks/resilience.jpg",
    tags: ["Risk", "Safety", "Preparedness"],
    resources: [
      { labelKey: "tracks.resource.brief", href: "/docs/tracks/resilience-brief.pdf" },
    ],
  },
  {
    id: 2,
    slug: "crisis-tech",
    titleKey: "tracks.crisisTech.title",
    shortKey: "tracks.crisisTech.short",
    longKey: "tracks.crisisTech.long",
    cover: "/images/tracks/crisis-tech.jpg",
    tags: ["AI", "Sensors", "Early Warning"],
  },
  {
    id: 3,
    slug: "passive-defense",
    titleKey: "tracks.passiveDefense.title",
    shortKey: "tracks.passiveDefense.short",
    longKey: "tracks.passiveDefense.long",
    cover: "/images/tracks/passive-defense.jpg",
    tags: ["Infrastructure", "Continuity"],
  },
  {
    id: 4,
    slug: "emergency-logistics",
    titleKey: "tracks.logistics.title",
    shortKey: "tracks.logistics.short",
    longKey: "tracks.logistics.long",
    cover: "/images/tracks/logistics.jpg",
    tags: ["Supply", "Routing"],
  },
  {
    id: 5,
    slug: "health-humanitarian",
    titleKey: "tracks.health.title",
    shortKey: "tracks.health.short",
    longKey: "tracks.health.long",
    cover: "/images/tracks/health.jpg",
    tags: ["Field", "Shelter"],
  },
  {
    id: 6,
    slug: "education-awareness",
    titleKey: "tracks.education.title",
    shortKey: "tracks.education.short",
    longKey: "tracks.education.long",
    cover: "/images/tracks/education.jpg",
    tags: ["Training", "Community"],
  },
];
