export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#1B5E20" />
      <circle cx="46" cy="18" r="6" fill="#FBC02D" opacity="0.95" />
      <path
        d="M32 50V24M32 24C32 15 41 11 49 13C48 22 41 28 32 24ZM32 32C32 23 23 19 15 21C16 30 23 36 32 32Z"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 50H44"
        stroke="#A5D6A7"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
