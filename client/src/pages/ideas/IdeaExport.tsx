// client/src/app/pages/ideas/IdeaExport.tsx
import { useParams } from "react-router-dom";

export default function IdeaExport() {
  const { id } = useParams();
  return (
    <div className="container section">
      <h1>Export Idea #{id}</h1>
      <p>Generating PDF…</p>
    </div>
  );
}
