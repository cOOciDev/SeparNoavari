import styles from "./committee.module.scss";
import type { CommitteeMember } from "../../AppData/committee";

type Props = {
  member: CommitteeMember;
  onClick: () => void;
};

export default function CommitteeCard({ member, onClick }: Props) {
  return (
    <article className={styles.card} role="button" onClick={onClick} tabIndex={0}>
      <div className={styles.cardPhoto}>
        <div
          className={styles.cardPhoto + " " + styles.card_photo_inner}
        style={{
          background:
            member.photo
              ? `url("${member.photo}") center/cover no-repeat`
              : "linear-gradient(120deg,#1a2740,#0f1c2e)",
        }}
        aria-label={member.name}
          title={member.name}
        />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{member.name}</h3>
        <span className={styles.cardRole}>
          {member.role} 
          <br/>
          {member.affiliation}
        </span>
        {member.shortBio && <p className={styles.modalBio}>{member.shortBio.length > 80 ? member.shortBio.slice(0, 80) + " … " : member.shortBio}</p>}

        {(member.tags?.length ?? 0) > 0 && (
          <div className={styles.tags}>
            {member.tags!.map((tg: string, i: number) => (
              <span key={i} className={styles.tag}>
                {tg}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
