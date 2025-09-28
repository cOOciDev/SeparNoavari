import { useEffect } from "react";
import styles from "./committee.module.scss";
import type { CommitteeMember } from "../../AppData/committee";

type Props = {
  open: boolean;
  member: CommitteeMember | null;
  onClose: () => void;
};

export default function CommitteeModal({ open, member, onClose }: Props) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !member) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.fadeInUp}`}
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>

        <div className={styles.modalHeader}>
          <div
            className={styles.modalPhoto}
            style={{
              background:
                member.photo
                  ? `url("${member.photo}") center/cover no-repeat`
                  : "linear-gradient(120deg,#1a2740,#0f1c2e)",
            }}
          />
          <div className={styles.modalTitle}>
            <h3 className={styles.cardName} style={{ margin: 0 }}>{member.name}</h3>
            <span className={styles.cardRole}>
              {member.role} — {member.affiliation}
            </span>
            {member.shortBio && <p className={styles.modalBio}>{member.shortBio}</p>}

            {(member.tags?.length ?? 0) > 0 && (
              <div className={styles.tags} style={{ marginTop: 8 }}>
                {member.tags!.map((tg: string, i: number) => (
                  <span key={i} className={styles.tag}>{tg}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        

        {/* {member.profileUrl && (
          <a
            className="btn ghost"
            href={member.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: "fit-content", marginTop: 12 }}
          >
            View Profile
          </a>
        )} */}
      </div>
    </div>
  );
}
