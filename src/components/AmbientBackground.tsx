/**
 * AmbientBackground
 * Fond atmosphérique : 3 halos pastels radiaux ultra-diffus.
 * Statique mobile / dérive lente desktop (via @media + prefers-reduced-motion dans index.css).
 * Fixed, pointer-events:none, jamais sur scroll container.
 *
 * `scene` permet de teinter subtilement l'atmosphère selon la catégorie active.
 */
type Scene = "weather" | "air" | "alerts" | "savoir" | "nearby" | "nature" | null;

interface Props {
  scene?: Scene;
}

export default function AmbientBackground({ scene = null }: Props) {
  // Halo principal = teinte de scène si fournie, sinon jaune crème par défaut
  const primaryHalo =
    scene === "weather" ? "var(--scene-weather-halo)" :
    scene === "air" ? "var(--scene-air-halo)" :
    scene === "alerts" ? "var(--scene-alerts-halo)" :
    scene === "savoir" ? "var(--scene-savoir-halo)" :
    scene === "nearby" ? "var(--scene-nearby-halo)" :
    scene === "nature" ? "var(--scene-nature-halo)" :
    "var(--scene-weather-halo)";

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Halo A — teinte scène (haut-gauche) */}
      <div
        className="ambient-halo ambient-halo-a absolute"
        style={{
          top: "-15%",
          left: "-10%",
          width: "70vw",
          height: "70vw",
          background: `radial-gradient(circle at center, hsl(${primaryHalo} / 0.55) 0%, hsl(${primaryHalo} / 0.18) 35%, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      {/* Halo B — bleu brume (bas-droite) */}
      <div
        className="ambient-halo ambient-halo-b absolute"
        style={{
          bottom: "-20%",
          right: "-15%",
          width: "75vw",
          height: "75vw",
          background: `radial-gradient(circle at center, hsl(var(--scene-nearby-halo) / 0.40) 0%, hsl(var(--scene-nearby-halo) / 0.12) 40%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />
      {/* Halo C — vert sauge (centre-bas, très diffus) */}
      <div
        className="ambient-halo ambient-halo-c absolute"
        style={{
          bottom: "-30%",
          left: "30%",
          width: "60vw",
          height: "60vw",
          background: `radial-gradient(circle at center, hsl(var(--scene-air-halo) / 0.30) 0%, hsl(var(--scene-air-halo) / 0.08) 45%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}
