import { Search } from "lucide-react";

export default function Buscador({ placeholder, value, onChange }) {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder || "Buscar..."}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-medium text-gray-900 transition-all"
      />
    </div>
  );
}
