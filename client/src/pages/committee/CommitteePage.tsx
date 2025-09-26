// client/src/app/pages/committee/CommitteePage.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./committee.module.scss";
import CommitteeCard from "./CommitteeCard";
import CommitteeModal from "./CommitteeModal";
import { COMMITTEE } from "../../AppData/committee";
import type { CommitteeMember } from "../../AppData/committee";

export default function CommitteePage() {
  const {  i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMITTEE;
    return COMMITTEE.filter((m) =>
      [m.name, m.role, m.affiliation, ...(m.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q]);

  const member: CommitteeMember | null =
    COMMITTEE.find((x) => x.id === selected) ?? null;

  return (
    <main /* Header/Footer از Layout می‌آیند؛ اینجا تکرارش نمی‌کنیم */>
      <section className="container" style={{ padding: "28px 0" }}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>
              {i18n.language.startsWith("fa") ? "هیئت علمی" : "Scientific Committee"}
            </h1>
            <p className={styles.pageSubtitle}>
              {i18n.language.startsWith("fa")
                ? "با اعضای هیئت داوران و مشاوران آشنا شوید."
                : "Meet our judging and advisory board."}
            </p>
          </div>
          <input
            className={styles.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              i18n.language.startsWith("fa")
                ? "جستجو بر اساس نام، نقش، سازمان..."
                : "Search by name, role, affiliation..."
            }
          />
        </div>

        <div className={styles.grid}>
          {list.map((m) => (
            <CommitteeCard
              key={m.id}
              member={m}
              onClick={() => setSelected(m.id)}
            />
          ))}
        </div>
      </section>

      <CommitteeModal
        open={selected !== null}
        member={member}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}
