// client/src/app/pages/tracks/TrackDetail.tsx
import { useParams } from "react-router-dom";

export default function TrackDetail() {
  const { slug } = useParams();
  return (
    <div className="container section">
      <h1>Track: {slug}</h1>
      <p>Details will be here…</p>
    </div>
  );
}
