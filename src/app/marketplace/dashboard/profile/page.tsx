import type { Metadata } from "next";
import Link from "next/link";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import { Field, inputClass, primaryBtn } from "@/components/marketplace/ui";
import { loadDashboard } from "@/lib/marketplace/dashboard";
import { saveProfile } from "@/lib/marketplace/actions";
import { BUSINESS_TYPES, MP } from "@/lib/marketplace/constants";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Company profile | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const join = (xs: string[]) => xs.join(", ");

export default async function ProfilePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { companies, company: c } = await loadDashboard(sp, `${MP}/dashboard/profile`);
  if (!c) redirect(`${MP}/dashboard`);
  const types = BUSINESS_TYPES.includes(c.type) ? BUSINESS_TYPES : [c.type, ...BUSINESS_TYPES];

  return (
    <DashboardShell active="profile" company={c} companies={companies}>
      <Notice sp={sp} />
      <form action={saveProfile} className="max-w-3xl space-y-8">
        <input type="hidden" name="companyId" value={c.id} />

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Business details</legend>
          <p className="text-sm text-slate-500">Registered name: <span className="text-slate-800">{c.name}</span> (changed by Bidcore support only). Everything below is optional unless marked.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" hint="How you want the company shown, if different from the registered name."><input name="displayName" defaultValue={c.displayName ?? ""} maxLength={200} className={inputClass} /></Field>
            <Field label="Business type *"><select name="type" defaultValue={c.type} className={inputClass}>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Logo (image address)" hint="A web address starting with https://. File upload is not available yet."><input name="logoUrl" type="url" defaultValue={c.logoUrl ?? ""} className={inputClass} /></Field>
            <Field label="Year founded"><input name="founded" inputMode="numeric" defaultValue={c.founded ?? ""} maxLength={4} className={inputClass} /></Field>
            <Field label="Company size"><input name="sizeRange" defaultValue={c.sizeRange ?? ""} placeholder="e.g. 51-200 employees" className={inputClass} /></Field>
            <Field label="GSTIN"><input name="gstin" defaultValue={c.gstin ?? ""} maxLength={15} className={inputClass} /></Field>
          </div>
          <Field label="About the company"><textarea name="about" rows={5} maxLength={4000} defaultValue={c.about ?? ""} className={inputClass} /></Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Contact and location</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website"><input name="website" defaultValue={c.website ?? ""} className={inputClass} /></Field>
            <Field label="Public business email"><input name="email" type="email" defaultValue={c.email ?? ""} className={inputClass} /></Field>
            <Field label="Business phone"><input name="phone" defaultValue={c.phone ?? ""} className={inputClass} /></Field>
            <Field label="City"><input name="city" defaultValue={c.cityName ?? ""} className={inputClass} /></Field>
            <Field label="Address"><input name="address" defaultValue={c.address ?? ""} maxLength={400} className={inputClass} /></Field>
            <Field label="PIN code"><input name="pinCode" defaultValue={c.pinCode ?? ""} maxLength={6} inputMode="numeric" className={inputClass} /></Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="contactPublic" defaultChecked={c.contactPublic} className="mt-1" />
            <span>Show phone, email and address to everyone. If unchecked, only signed-in Bidcore members see them. Enquiries always reach you either way.</span>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Capabilities</legend>
          <p className="text-sm text-slate-500">Separate items with commas.</p>
          <Field label="Specialisations"><input name="specializations" defaultValue={join(c.specializations)} className={inputClass} /></Field>
          <Field label="Capabilities and equipment"><input name="capabilities" defaultValue={join(c.capabilities)} placeholder="e.g. Precast yard, 24x7 dispatch, NABL lab" className={inputClass} /></Field>
          <Field label="Certifications and credentials"><input name="certifications" defaultValue={join(c.certifications)} placeholder="e.g. ISO 9001, BIS licence" className={inputClass} /></Field>
          <Field label="Industries"><input name="industries" defaultValue={join(c.industries)} placeholder="e.g. Roads, Water, Power" className={inputClass} /></Field>
          <Field label="Areas served"><input name="operatingLocations" defaultValue={join(c.operatingLocations)} placeholder="e.g. Tamil Nadu, Karnataka, Pan-India" className={inputClass} /></Field>
          <Field label="Project experience"><textarea name="projectExperience" rows={4} maxLength={4000} defaultValue={c.projectExperience ?? ""} className={inputClass} /></Field>
        </fieldset>

        <div className="flex items-center gap-3">
          <button className={primaryBtn}>Save profile</button>
          <Link href={`${MP}/dashboard?company=${c.id}`} className="text-sm text-slate-500 hover:text-slate-800">Cancel</Link>
        </div>
      </form>
    </DashboardShell>
  );
}
