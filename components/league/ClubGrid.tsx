import Image from "next/image";
import { CLUBS } from "@/data/clubs";

export default function ClubGrid() {
  return (
    <section id="kluby" className="bg-white border-b border-gray-200 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-xl font-black text-gray-900">Kluby Osmé ligy</h2>
        <p className="mt-1 mb-8 text-sm text-gray-500">
          Deset týmů, deset znaků a jen omezený počet lidí, kteří opravdu dorazí.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {CLUBS.map((club) => (
            <div
              key={club.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center hover:border-green-300 hover:bg-green-50 transition"
            >
              <Image
                src={club.banner}
                alt={club.name}
                width={64}
                height={64}
                className="object-contain"
              />
              <div className="text-xs font-bold text-gray-800 leading-snug">{club.name}</div>
              <div className="text-[10px] text-gray-500 leading-snug">{club.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
