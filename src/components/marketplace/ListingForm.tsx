"use client";

import { useState } from "react";
import { saveListing } from "@/lib/marketplace/actions";
import { AVAILABILITY_OPTIONS, UNITS, type AttributeDef } from "@/lib/marketplace/constants";
import { Field, inputClass } from "./ui";

export interface CategoryOption {
  id: string;
  label: string;
  kind: string;
  attributes: AttributeDef[];
}

export interface ListingValues {
  id?: string;
  title?: string;
  categoryId?: string | null;
  brand?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  specs?: Record<string, string>;
  applications?: string[];
  variants?: string[];
  unit?: string | null;
  moq?: string | null;
  priceMode?: string;
  priceText?: string | null;
  supplyLocations?: string[];
  availability?: string | null;
  images?: string[];
  documents?: { name: string; url: string }[];
  scope?: string | null;
  projectTypes?: string[];
  industries?: string[];
  capabilities?: string[];
  certifications?: string[];
  pricingBasis?: string | null;
  status?: string;
}

const j = (xs?: string[]) => (xs ?? []).join(", ");

export default function ListingForm({ companyId, kind, categories, values = {} }: { companyId: string; kind: "product" | "service"; categories: CategoryOption[]; values?: ListingValues }) {
  const options = categories.filter((c) => c.kind === "both" || c.kind === kind);
  const [categoryId, setCategoryId] = useState(values.categoryId ?? "");
  const [priceMode, setPriceMode] = useState(values.priceMode ?? "on_request");
  const attrs = options.find((c) => c.id === categoryId)?.attributes ?? [];
  const isProduct = kind === "product";

  return (
    <form action={saveListing} className="max-w-3xl space-y-8">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="kind" value={kind} />
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-900">Basics</legend>
        <Field label={isProduct ? "Product name *" : "Service title *"}>
          <input name="title" required minLength={3} maxLength={200} defaultValue={values.title ?? ""} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" hint="Required to submit for review. Categories are managed by Bidcore.">
            <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Choose a category</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
          {isProduct && (
            <Field label="Brand or manufacturer"><input name="brand" maxLength={120} defaultValue={values.brand ?? ""} className={inputClass} /></Field>
          )}
        </div>
        <Field label="Short description" hint="One or two sentences shown on cards and in search results.">
          <input name="shortDescription" maxLength={400} defaultValue={values.shortDescription ?? ""} className={inputClass} />
        </Field>
        <Field label="Detailed description"><textarea name="description" rows={6} maxLength={6000} defaultValue={values.description ?? ""} className={inputClass} /></Field>
      </fieldset>

      {attrs.length > 0 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Specifications</legend>
          <p className="text-sm text-slate-500">Fields for the selected category. Leave blank what does not apply.</p>
          <div className="grid gap-4 sm:grid-cols-2" key={categoryId}>
            {attrs.map((a) => (
              <Field key={a.key} label={`${a.label}${a.unit ? ` (${a.unit})` : ""}`}>
                {a.type === "select" ? (
                  <select name={`spec_${a.key}`} defaultValue={values.specs?.[a.key] ?? ""} className={inputClass}>
                    <option value="">—</option>
                    {(a.options ?? []).map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input name={`spec_${a.key}`} type={a.type === "number" ? "number" : "text"} defaultValue={values.specs?.[a.key] ?? ""} className={inputClass} />
                )}
              </Field>
            ))}
          </div>
        </fieldset>
      )}

      {isProduct ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Supply</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Unit of measurement">
              <select name="unit" defaultValue={values.unit ?? ""} className={inputClass}>
                <option value="">—</option>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Minimum order quantity"><input name="moq" maxLength={80} defaultValue={values.moq ?? ""} placeholder="e.g. 10 tonnes" className={inputClass} /></Field>
            <Field label="Availability">
              <select name="availability" defaultValue={values.availability ?? ""} className={inputClass}>
                <option value="">—</option>
                {AVAILABILITY_OPTIONS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Supply locations" hint="Comma separated: states or cities you supply to."><input name="supplyLocations" defaultValue={j(values.supplyLocations)} className={inputClass} /></Field>
          <Field label="Variants" hint="Comma separated."><input name="variants" defaultValue={j(values.variants)} className={inputClass} /></Field>
          <Field label="Applications and compatible uses" hint="Comma separated."><input name="applications" defaultValue={j(values.applications)} className={inputClass} /></Field>
        </fieldset>
      ) : (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Service details</legend>
          <Field label="Scope of service"><textarea name="scope" rows={4} maxLength={4000} defaultValue={values.scope ?? ""} className={inputClass} /></Field>
          <Field label="Project types served" hint="Comma separated, e.g. Highway, Bridge, Building."><input name="projectTypes" defaultValue={j(values.projectTypes)} className={inputClass} /></Field>
          <Field label="Industries served" hint="Comma separated."><input name="industries" defaultValue={j(values.industries)} className={inputClass} /></Field>
          <Field label="Geographic coverage" hint="Comma separated: states or cities."><input name="supplyLocations" defaultValue={j(values.supplyLocations)} className={inputClass} /></Field>
          <Field label="Technical, equipment and team capabilities" hint="Comma separated."><input name="capabilities" defaultValue={j(values.capabilities)} className={inputClass} /></Field>
          <Field label="Certifications and qualifications" hint="Comma separated."><input name="certifications" defaultValue={j(values.certifications)} className={inputClass} /></Field>
          <Field label="Pricing basis" hint="Optional, e.g. per day, per sample, lump sum."><input name="pricingBasis" maxLength={300} defaultValue={values.pricingBasis ?? ""} className={inputClass} /></Field>
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-900">Price</legend>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="priceMode" value="on_request" checked={priceMode === "on_request"} onChange={() => setPriceMode("on_request")} /> Price on request</label>
          <label className="flex items-center gap-2"><input type="radio" name="priceMode" value="indicative" checked={priceMode === "indicative"} onChange={() => setPriceMode("indicative")} /> Show an indicative price</label>
        </div>
        {priceMode === "indicative" && (
          <Field label="Indicative price" hint="Shown publicly and labelled indicative, e.g. ₹6,200 – ₹6,600 per tonne ex-works."><input name="priceText" maxLength={200} defaultValue={values.priceText ?? ""} className={inputClass} /></Field>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-900">Images and documents</legend>
        <p className="text-sm text-slate-500">File upload is not available yet. Paste web addresses (https://) of images and datasheets hosted on your own site or a file host.</p>
        <Field label="Images" hint="One address per line, up to 6. The first is the main image."><textarea name="images" rows={3} defaultValue={(values.images ?? []).join("\n")} className={inputClass} /></Field>
        <Field label="Datasheets and documents" hint='One per line as "Name | https://link", up to 6.'><textarea name="documents" rows={3} defaultValue={(values.documents ?? []).map((d) => `${d.name} | ${d.url}`).join("\n")} className={inputClass} /></Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button name="intent" value="submit" className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light">
          {values.status === "published" ? "Save changes" : "Save and submit for review"}
        </button>
        {values.status !== "published" && (
          <button name="intent" value="draft" className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">Save as draft</button>
        )}
      </div>
    </form>
  );
}
