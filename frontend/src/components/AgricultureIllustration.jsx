export default function AgricultureIllustration() {
  return (
    <svg
      viewBox="0 0 520 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Green agricultural fields, sun, and sprouting crops illustration"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="hillBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#4CAF50" />
        </linearGradient>
        <linearGradient id="hillFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
      </defs>

      <rect width="520" height="380" rx="24" fill="url(#skyGrad)" />

      {/* Warm Sun */}
      <circle cx="415" cy="84" r="42" fill="#FFF3CD" />
      <circle cx="415" cy="84" r="28" fill="#FBC02D" />

      {/* Soft Clouds */}
      <path
        d="M84 96C84 84.9543 92.9543 76 104 76C112.1 76 119.08 80.82 122.22 87.75C124.53 86.63 127.12 86 129.86 86C139.58 86 147.46 93.88 147.46 103.6C147.46 104.24 147.43 104.88 147.36 105.5H85.15C84.4 102.45 84 99.27 84 96Z"
        fill="#FFFFFF"
      />
      <path
        d="M210 72C210 63.72 216.72 57 225 57C231.1 57 236.35 60.64 238.68 65.87C240.42 65.03 242.36 64.55 244.41 64.55C251.72 64.55 257.65 70.48 257.65 77.79C257.65 78.27 257.62 78.75 257.57 79.22H210.87C210.3 76.92 210 74.52 210 72Z"
        fill="#FFFFFF"
      />

      {/* Rolling Agricultural Fields */}
      <path
        d="M0 245C95 205 185 215 275 245C365 275 445 225 520 235V380H0V245Z"
        fill="url(#hillBack)"
        opacity="0.9"
      />
      <path
        d="M0 285C110 250 220 270 325 295C410 315 470 285 520 275V380H0V285Z"
        fill="url(#hillFront)"
      />

      {/* Furrow Lines */}
      <path d="M20 345C130 310 250 325 360 355" stroke="#66BB6A" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M120 370C220 342 330 348 490 325" stroke="#A5D6A7" strokeWidth="3" strokeLinecap="round" opacity="0.45" />

      {/* Central Sprout & Grain Illustration */}
      <g transform="translate(175, 118)">
        <circle cx="85" cy="95" r="76" fill="#FFFFFF" opacity="0.92" />
        <circle cx="85" cy="95" r="68" stroke="#C8E6C9" strokeWidth="2.5" strokeDasharray="6 6" />
        <path
          d="M85 138V72"
          stroke="#1B5E20"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M85 78C85 52 114 40 132 45C130 70 109 86 85 78Z"
          fill="#4CAF50"
          stroke="#1B5E20"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M85 96C85 70 56 58 38 63C40 88 61 104 85 96Z"
          fill="#66BB6A"
          stroke="#1B5E20"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M55 138H115"
          stroke="#2E7D32"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Side Crops / Wheat Stalks */}
      <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        <path d="M72 315V265" />
        <path d="M72 288C62 280 56 272 58 265" />
        <path d="M72 278C82 270 88 262 86 255" />
        <path d="M445 310V262" />
        <path d="M445 286C435 278 429 270 431 263" />
        <path d="M445 276C455 268 461 260 459 253" />
      </g>
    </svg>
  );
}
