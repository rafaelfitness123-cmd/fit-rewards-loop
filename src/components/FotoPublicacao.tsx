import { useEffect, useState } from "react";
import { urlDaFoto } from "@/lib/comunidade";

/** Foto de publicação — bucket privado, carregada por URL assinada + lazy loading. */
export default function FotoPublicacao({
  path,
  alt,
  className = "",
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    void urlDaFoto(path).then((u) => {
      if (!vivo) return;
      if (u) setUrl(u);
      else setErro(true);
    });
    return () => {
      vivo = false;
    };
  }, [path]);

  if (erro) {
    return (
      <div className={`flex items-center justify-center bg-muted/40 text-xs text-muted-foreground ${className}`}>
        Foto indisponível
      </div>
    );
  }

  if (!url) return <div className={`animate-pulse bg-muted/40 ${className}`} />;

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setErro(true)}
    />
  );
}
