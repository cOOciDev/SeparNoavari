// client/src/app/pages/ideas/IdeaDetail.tsx
import { useParams } from "react-router-dom";

export default function IdeaDetail() {
  const { id } = useParams();
  return (
    <div className="container section">
      <h1>Idea #{id}</h1>
      <p>Idea details page…</p>
    </div>
  );
}
