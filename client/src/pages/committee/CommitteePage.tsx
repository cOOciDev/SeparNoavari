// client/src/app/pages/committee/CommitteePage.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./committee.module.scss";
import CommitteeCard from "./CommitteeCard";
import CommitteeModal from "./CommitteeModal";
import type { CommitteeMember } from "../../AppData/committee";
import { COMMITTEE } from "../../AppData/committee";

type RenderMember = CommitteeMember & { tags?: string[] };

export default function CommitteePage() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  // Helper: translate a member whose fields are i18n keys
  const translateMember = (m: CommitteeMember): RenderMember => {
    // name/role/... may already be plain text; keep safe fallback
    const name = m.name ? t(m.name as string, { defaultValue: m.name }) : m.name;
    const role = m.role ? t(m.role as string, { defaultValue: m.role }) : m.role;
    const affiliation = m.affiliation
      ? t(m.affiliation as string, { defaultValue: m.affiliation })
      : m.affiliation;
    const shortBio = m.shortBio
      ? t(m.shortBio as string, { defaultValue: m.shortBio })
      : m.shortBio;

    // Tags: if a tag points to an array (like "committee.member1.tags"),
    // use returnObjects:true to get the string[]; also support literal strings.
    const tagsRaw = m.tags ?? [];
    const tags = tagsRaw.flatMap((keyOrText) => {
      if (!keyOrText) return [];
      const val = t(keyOrText as string, { returnObjects: true, defaultValue: keyOrText });
      return Array.isArray(val) ? (val as string[]) : [String(val)];
    });

    return { ...m, name, role, affiliation, shortBio, tags };
  };

  // Build translated list whenever language changes or data changes
  const translatedList: RenderMember[] = useMemo(
    () => COMMITTEE.map(translateMember),
    // depend on i18n language so switching updates UI
    // (t function identity also changes per language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  );

  // Search over translated content
  const list: RenderMember[] = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return translatedList;
    return translatedList.filter((m) =>
      [m.name, m.role, m.affiliation, ...(m.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q, translatedList]);

  const member: RenderMember | null =
    translatedList.find((x) => x.id === selected) ?? null;

  return (
    <main /* Header/Footer come from Layout */>
      <section className="container" style={{ padding: "28px 0" }}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>{t("committee.title")}</h1>
            <p className={styles.pageSubtitle}>{t("committee.text")}</p>
          </div>

          {/* Optional search */}
          {/* <input
            className={styles.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              i18n.language.startsWith("fa")
                ? "جستجو بر اساس نام، نقش، سازمان..."
                : "Search by name, role, affiliation..."
            }
          /> */}
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
