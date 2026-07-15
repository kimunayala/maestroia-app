export default function VerticeLogo({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="verticeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C547" />
          <stop offset="45%" stopColor="#C8A118" />
          <stop offset="100%" stopColor="#3D3410" />
        </linearGradient>
      </defs>

      {/* Triángulo exterior invertido */}
      <path
        d="M50 88 L8 18 L92 18 Z"
        fill="none"
        stroke="url(#verticeGrad)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Triángulo medio invertido */}
      <path
        d="M50 74 L20 24 L80 24 Z"
        fill="none"
        stroke="url(#verticeGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Triángulo interior invertido */}
      <path
        d="M50 60 L32 30 L68 30 Z"
        fill="none"
        stroke="url(#verticeGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.7"
      />

      {/* Nodos dorados en los vértices exteriores */}
      <circle cx="50" cy="88" r="4" fill="url(#verticeGrad)" />
      <circle cx="8" cy="18" r="4" fill="url(#verticeGrad)" />
      <circle cx="92" cy="18" r="4" fill="url(#verticeGrad)" />
    </svg>
  );
}
