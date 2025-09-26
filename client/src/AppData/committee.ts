// واحدِ مرجع برای تایپ و دیتا

export type CommitteeMember = {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  photo?: string;
  shortBio?: string;
  profileUrl?: string;
  tags?: string[]; // اختیاری
};

// نمونه دیتا (می‌تونی با دیتای واقعی خودت جایگزین/تکمیل کنی)
export const COMMITTEE: CommitteeMember[] = [
  {
    id: 1,
    name: "Dr. Rasoul Karimi",
    role: "Chief Judge",
    affiliation: "Web & Game Studio",
    photo: "/images/committee/Dr_Karimi.png" ,
    shortBio:
      "Expert in disaster risk reduction and community resilience.",
    profileUrl: "#",
    tags: ["Risk", "Resilience"],
  },
  {
    id: 2,
    name: "Dr. Ali Taheri",
    role: "Judge",
    affiliation: "University of Technology",
    photo: "/images/committee/user.png",
    shortBio:
      "AI researcher focusing on crisis-tech and early warning systems.",
    profileUrl: "#",
    tags: ["AI", "Early Warning"],
  },
  {
    id: 3,
    name: "Maryam Hosseini",
    role: "Advisor",
    affiliation: "Health & Humanitarian NGO",
    photo: "/images/committee/user.png",
    shortBio: "Humanitarian operations and health logistics specialist.",
    profileUrl: "#",
    tags: ["Logistics", "Health"],
  },
  {
    id: 4,
    name: "Reza Moghaddam",
    role: "Judge",
    affiliation: "Smart Infrastructure Lab",
    photo: "/images/committee/user.png",
    shortBio: "Critical infrastructure protection and passive defense.",
    profileUrl: "#",
    tags: ["Infrastructure", "Defense"],
  },
  {
    id: 5,
    name: "Dr. Neda Fathi",
    role: "Judge",
    affiliation: "Applied Education Institute",
    photo: "/images/committee/user.png",
    shortBio:
      "Public awareness programs and simulation-based training.",
    profileUrl: "#",
    tags: ["Education", "Awareness"],
  },
  {
    id: 6,
    name: "Omid Karimi",
    role: "Mentor",
    affiliation: "Logistics & Supply Chain Expert",
    photo: "/images/committee/user.png",
    shortBio:
      "Emergency logistics and last-mile optimization.",
    profileUrl: "#",
    tags: ["Logistics", "Optimization"],
  },
];
