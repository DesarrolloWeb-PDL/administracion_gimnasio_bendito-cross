export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-black py-6">
      <div className="flex flex-col items-center gap-2 px-4">
        <p className="text-xs text-zinc-500">&copy; 2026 Bendito Cross. Todos los derechos reservados.</p>
        <a
          href="https://desarrolloweb-pdl.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-3.5 h-3.5">
            <rect x="4" y="4" width="11" height="11" rx="2" opacity="1" />
            <rect x="17" y="4" width="11" height="11" rx="2" opacity="0.7" />
            <rect x="4" y="17" width="11" height="11" rx="2" opacity="0.5" />
            <rect x="17" y="17" width="11" height="11" rx="2" opacity="0.3" />
          </svg>
          DesarrolloWeb-pdl
        </a>
      </div>
    </footer>
  );
}
