import type { Client } from "@/types/newphase";

interface ClientCardProps {
  client: Client;
  onClick?: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const cover = client.afterImageUrl || client.imageUrl || client.beforeImageUrl;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group surface relative flex flex-col overflow-hidden rounded-2xl text-left transition-transform duration-500 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-graphite">
        {cover ? (
          <img
            src={cover}
            alt={client.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-6xl text-graphite">
              {client.name?.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/10 to-transparent" />
        {client.category && (
          <span className="absolute left-4 top-4 rounded-full glass px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-off-white">
            {client.category}
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="display-lg text-2xl text-off-white">{client.name}</h3>
        {(client.result || client.headline) && (
          <p className="mt-2 text-sm text-accent">
            {client.result || client.headline}
          </p>
        )}
        {client.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-steel">
            {client.summary}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-off-white">
          View Story
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M5 12h14m-6-6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>
  );
}

export default ClientCard;
