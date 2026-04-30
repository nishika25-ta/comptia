import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export default function NotFoundPage() {
  return (
    <div className="card p-10 text-center max-w-xl mx-auto animate-fade-in">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 grid place-items-center text-white mb-4">
        <Icon name="info" size={28} />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
        Page not found
      </h1>
      <p className="text-ink-600 dark:text-ink-300 mt-2">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-5 inline-flex">
        <Icon name="home" size={14} /> Back to home
      </Link>
    </div>
  );
}
