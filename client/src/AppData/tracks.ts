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
    slug: "defense",
    titleKey: "tracks.defense.title",
    shortKey: "tracks.defense.desc",
    longKey: "tracks.defense.text",
    cover: "/assets/tracks/defense.png?v=20250930",
    tags: ["Risk", "Safety", "Preparedness"],
    resources: [
      { labelKey: "tracks.resource.brief", href: "/docs/tracks/defense-brief.pdf" },
    ],
  },
  {
    id: 2,
    slug: "crisisSupport",
    titleKey: "tracks.crisisSupport.title",
    shortKey: "tracks.crisisSupport.desc",
    longKey: "tracks.crisisSupport.text",
    cover: "/assets/tracks/crisisSupport.png?v=20250930",
    tags: ["AI", "Sensors", "Early Warning"],
  },
  {
    id: 3,
    slug: "cyberDefense",
    titleKey: "tracks.cyberDefense.title",
    shortKey: "tracks.cyberDefense.desc",
    longKey: "tracks.cyberDefense.text",
    cover: "/assets/tracks/cyberDefense.png?v=20250930",
    tags: ["Infrastructure", "Continuity"],
  },
  {
    id: 4,
    slug: "volunteerNetwork",
    titleKey: "tracks.volunteerNetwork.title",
    shortKey: "tracks.volunteerNetwork.desc",
    longKey: "tracks.volunteerNetwork.text",
    cover: "/assets/tracks/volunteerNetwork.png?v=20250930",
    tags: ["Supply", "Routing"],
  },
  {
    id: 5,
    slug: "aiInCrisis",
    titleKey: "tracks.aiInCrisis.title",
    shortKey: "tracks.aiInCrisis.desc",
    longKey: "tracks.aiInCrisis.text",
    cover: "/assets/tracks/aiInCrisis.png?v=20250930",
    tags: ["Field", "Shelter"],
  },
  {
    id: 6,
    slug: "dataParticipation",
    titleKey: "tracks.dataParticipation.title",
    shortKey: "tracks.dataParticipation.desc",
    longKey: "tracks.dataParticipation.text",
    cover: "/assets/tracks/dataParticipation.png?v=20250930",
    tags: ["Training", "Community"],
  },
];
