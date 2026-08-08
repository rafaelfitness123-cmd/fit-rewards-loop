import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CardMissao from "@/components/CardMissao";
import { useClienteAtual } from "@/lib/session";
import {
  criarPublicacao,
  enviarFoto,
  legendaSugerida,
  lerRascunhoMissao,
  limparRascunhoMissao,
  type MissaoSnapshot,
} from "@/lib/comunidade";

export const Route = createFileRoute("/app/comunidade/novo")({
  head: () => ({
    meta: [
      { title: "Nova publicação — PulseFit" },
      {
        name: "description",
        content: "Compartilhe uma foto, um treino ou uma missão concluída com a comunidade.",
      },
      { property: "og:title", content: "Nova publicação — PulseFit" },
      {
        property: "og:description",
        content: "Publique sua conquista no feed da Companhia Fitness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaPublicacao;
});

function NovaPublicacao() {
  return null;
}
