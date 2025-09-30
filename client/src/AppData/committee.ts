// import DrKarimiPhoto from "@/assets/committee/Dr_Karimi.png";
// import DrQaderiPhoto from "@/assets/committee/Dr_Qaderi.png";


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
    name: "committee.member1.name",
    role: "committee.member1.role",
    affiliation: "committee.member1.affiliation",
    photo: "/images/committee/Dr_Karimi.png?v=20250930",
    shortBio: "committee.member1.shortBio",
    profileUrl: "#",
    tags: ["committee.member1.tags"]
  },
  {
    id: 2,
    name: "committee.member2.name",
    role: "committee.member2.role",
    affiliation: "committee.member2.affiliation",
    photo: "/images/committee/Dr_Qaderi.png?v=20250930",
    shortBio: "committee.member2.shortBio",
    profileUrl: "#",
    tags: ["committee.member2.tags"]

  },
  
];
