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
    longKey: "tracks.defense.desc",
    cover: "/assets/tracks/defense.png",
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
    longKey: "tracks.crisisSupport.desc",
    cover: "/assets/tracks/crisisSupport.png",
    tags: ["AI", "Sensors", "Early Warning"],
  },
  {
    id: 3,
    slug: "cyberDefense",
    titleKey: "tracks.cyberDefense.title",
    shortKey: "tracks.cyberDefense.desc",
    longKey: "tracks.cyberDefense.desc",
    cover: "/assets/tracks/cyberDefense.png",
    tags: ["Infrastructure", "Continuity"],
  },
  {
    id: 4,
    slug: "volunteerNetwork",
    titleKey: "tracks.volunteerNetwork.title",
    shortKey: "tracks.volunteerNetwork.desc",
    longKey: "tracks.volunteerNetwork.desc",
    cover: "/assets/tracks/volunteerNetwork.png",
    tags: ["Supply", "Routing"],
  },
  {
    id: 5,
    slug: "aiInCrisis",
    titleKey: "tracks.aiInCrisis.title",
    shortKey: "tracks.aiInCrisis.desc",
    longKey: "tracks.aiInCrisis.desc",
    cover: "/assets/tracks/aiInCrisis.png",
    tags: ["Field", "Shelter"],
  },
  {
    id: 6,
    slug: "dataParticipation",
    titleKey: "tracks.dataParticipation.title",
    shortKey: "tracks.dataParticipation.desc",
    longKey: "tracks.dataParticipation.desc",
    cover: "/assets/tracks/dataParticipation.png",
    tags: ["Training", "Community"],
  },
];
