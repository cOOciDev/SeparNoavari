// client/src/app/pages/ideas/IdeaEdit.tsx
import { useParams } from "react-router-dom";

export default function IdeaEdit() {
  const { id } = useParams();
  return (
    <div className="container section">
      <h1>Edit Idea #{id}</h1>
      <p>Idea edit form…</p>
    </div>
  );
}
