import { useParams } from "react-router-dom";
import ComingSoon from "./ComingSoon";

// Placeholder for group pages built in later stages (/preferences in Stage 5, /reveal in Stage 7).
export default function GroupComingSoon({ title }) {
  const { slug } = useParams();
  return <ComingSoon title={title} backTo={`/g/${slug}/dashboard`} backLabel="Back to dashboard" />;
}
