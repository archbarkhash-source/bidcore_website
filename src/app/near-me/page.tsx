import NearMeFinder from "@/components/NearMeFinder";

export default function NearMePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Explore Near You</h1>
      <p className="mt-2 text-slate-600">
        Find construction companies near your location, live — beyond the verified directory.
      </p>

      <div className="mt-8">
        <NearMeFinder />
      </div>
    </div>
  );
}
