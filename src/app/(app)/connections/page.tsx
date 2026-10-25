import { Users } from "lucide-react";

export default function ConnectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My Connections</h1>
      <p className="mt-1 text-sm text-slate-500">
        Build your construction network and connect directly with verified companies.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Users className="mx-auto h-8 w-8 text-slate-300" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">No connections yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Connect with companies from their profile page to start building your network here.
        </p>
      </div>
    </div>
  );
}
