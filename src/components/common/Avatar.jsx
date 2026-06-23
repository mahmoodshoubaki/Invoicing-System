export default function Avatar({ name, size = 32 }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
  const color = colors[initials.charCodeAt(0) % colors.length];

  return (
    <div
      className={`${color} text-white rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
