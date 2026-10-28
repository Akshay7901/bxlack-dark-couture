import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { loadPage, loadPageEditTimes } from "@/lib/pages/pages";
import { resetPageContent, savePageContent } from "@/lib/pages/pages.functions";
import {
  PAGE_META,
  PAGE_SLUGS,
  type AboutPageContent,
  type ContactPageContent,
  type FaqPageContent,
  type InfoPageContent,
  type PageContentMap,
  type PageSlug,
} from "@/lib/pages/content";

const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const inputClass =
  "mt-1.5 w-full border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 outline-none focus:border-black/60";
const smallButton =
  "flex items-center gap-1.5 border border-black/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40";
const iconButton =
  "flex h-8 w-8 items-center justify-center border border-black/15 text-neutral-500 hover:border-black/50 hover:text-black disabled:opacity-30";

const PAGE_HINT: Record<PageSlug, string> = {
  about: "Hero, philosophy, story, the codes and the closing line",
  shipping: "Page heading and numbered sections",
  returns: "Page heading and numbered sections",
  faq: "Page heading and questions & answers",
  contact: "Page heading and contact details (the message form stays)",
};

export function AdminPages() {
  const [editing, setEditing] = useState<PageSlug | null>(null);
  const { data: edited = {}, error } = useQuery({ queryKey: ["admin-pages"], queryFn: () => loadPageEditTimes() });

  if (editing) return <PageEditor key={editing} slug={editing} onBack={() => setEditing(null)} />;

  return (
    <section>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Pages</h2>
      <p className="mt-1.5 text-[13px] text-neutral-500">Edit the text on your store's information pages.</p>
      {error ? <p className="mt-3 text-[13px] text-red-600">{(error as Error).message}</p> : null}

      <div className="mt-6 space-y-2">
        {PAGE_SLUGS.map((slug) => (
          <div key={slug} className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-black/10 bg-black/[0.02] px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e3e3e3] text-neutral-600">
              <FileText size={17} />
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] text-neutral-900">
                {PAGE_META[slug].name}
                {edited[slug] ? <Badge tone="info">Edited</Badge> : <Badge>Default text</Badge>}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                {PAGE_HINT[slug]}
                {edited[slug] ? ` · Last edited ${new Date(edited[slug]!).toLocaleString()}` : ""}
              </p>
            </div>
            <a href={PAGE_META[slug].path} target="_blank" rel="noreferrer" className={smallButton}>
              View <ExternalLink size={12} />
            </a>
            <button type="button" onClick={() => setEditing(slug)} className="border border-black bg-black px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
              Edit
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageEditor({ slug, onBack }: { slug: PageSlug; onBack: () => void }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm("light");
  const { data: saved, isLoading } = useQuery({
    queryKey: ["admin-page", slug],
    queryFn: () => loadPage(slug),
    refetchOnWindowFocus: false,
  });
  const [draft, setDraft] = useState<PageContentMap[PageSlug] | null>(null);
  useEffect(() => {
    if (saved) setDraft(structuredClone(saved));
  }, [saved]);

  const dirty = !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-page", slug] });
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
  };

  const save = useMutation({
    mutationFn: () => savePageContent({ data: { slug, content: draft } }),
    onSuccess: () => {
      toast.success(`${PAGE_META[slug].name} saved — live on the site now`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reset = useMutation({
    mutationFn: () => resetPageContent({ data: { slug } }),
    onSuccess: () => {
      toast.success(`${PAGE_META[slug].name} reset to the default text`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <a href={PAGE_META[slug].path} target="_blank" rel="noreferrer" className={smallButton}>
        View page <ExternalLink size={12} />
      </a>
      <button
        type="button"
        className={smallButton}
        onClick={() =>
          confirm({
            title: "Reset to default",
            message: `Replace all your edits on ${PAGE_META[slug].name} with the original text?`,
            confirmLabel: "Reset",
            destructive: true,
            onConfirm: () => reset.mutate(),
          })
        }
      >
        Reset to default
      </button>
      <button
        type="button"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
        className="border border-black bg-black px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white disabled:opacity-40"
      >
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );

  return (
    <section>
      {dialog}
      <button type="button" onClick={onBack} className="mb-3 text-[13px] text-neutral-500 hover:text-black">
        ← All pages
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">{PAGE_META[slug].name}</h2>
          <p className="mt-1.5 text-[13px] text-neutral-500">
            {dirty ? "Unsaved changes" : "Changes go live as soon as you save."}
          </p>
        </div>
        {actions}
      </div>

      {slug === "returns" ? (
        <p className="mt-4 rounded-lg bg-[#fff8db] p-3 text-[12px] text-[#5e4200]">
          This page explains your policy to customers. Changing the text here doesn't change how returns work in the
          store (7-day window, ₹300 packing-tube charge) — ask a developer to change those rules.
        </p>
      ) : null}

      <div className="mt-6 space-y-6">
        {isLoading || !draft ? (
          <p className="text-[13px] text-neutral-500">Loading…</p>
        ) : slug === "about" ? (
          <AboutEditor value={draft as AboutPageContent} onChange={setDraft} />
        ) : slug === "faq" ? (
          <FaqEditor value={draft as FaqPageContent} onChange={setDraft} />
        ) : slug === "contact" ? (
          <ContactEditor value={draft as ContactPageContent} onChange={setDraft} />
        ) : (
          <InfoEditor value={draft as InfoPageContent} onChange={setDraft} />
        )}
      </div>

      <div className="mt-8 flex justify-end">{actions}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border border-black/12 p-5">
      <div>
        <p className="text-[14px] font-semibold text-neutral-900">{title}</p>
        {hint ? <p className="mt-0.5 text-[12px] text-neutral-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={inputClass} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      {hint ? <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span> : null}
    </label>
  );
}

/** A list with add, remove and move up/down. */
function ListEditor<T>({
  items,
  onChange,
  make,
  addLabel,
  render,
  itemLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  addLabel: string;
  itemLabel: (i: number) => string;
  render: (item: T, update: (item: T) => void) => React.ReactNode;
}) {
  const move = (i: number, d: number) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-[#e3e3e3] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-neutral-600">{itemLabel(i)}</span>
            <div className="flex gap-1.5">
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move down"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                className={`${iconButton} hover:!border-red-400 hover:!text-red-600`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {render(item, (updated) => onChange(items.map((x, j) => (j === i ? updated : x))))}
        </div>
      ))}
      <button type="button" className={smallButton} onClick={() => onChange([...items, make()])}>
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}

function Paragraphs({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5 space-y-2">
        {value.map((p, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={p}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
              rows={3}
              className={`${inputClass} !mt-0`}
            />
            <button
              type="button"
              className={`${iconButton} shrink-0`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="Remove paragraph"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button type="button" className={smallButton} onClick={() => onChange([...value, ""])}>
          <Plus size={12} /> Add paragraph
        </button>
      </div>
    </div>
  );
}

type Header = { eyebrow: string; title: string; italic: string; intro: string };

function HeaderFields<T extends Header>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
  return (
    <Card title="Page heading" hint="The large title at the top. The italic part is shown after the title in the serif style.">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Small label above" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} />
        <Field label="Title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
        <Field label="Italic ending" value={value.italic} onChange={(italic) => onChange({ ...value, italic })} />
      </div>
      <Field label="Introduction" value={value.intro} onChange={(intro) => onChange({ ...value, intro })} multiline />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page editors
// ---------------------------------------------------------------------------

function InfoEditor({ value, onChange }: { value: InfoPageContent; onChange: (v: InfoPageContent) => void }) {
  return (
    <>
      <HeaderFields value={value} onChange={onChange} />
      <Card title="Sections" hint="Numbered automatically (01, 02, …) in the order shown.">
        <ListEditor
          items={value.blocks}
          onChange={(blocks) => onChange({ ...value, blocks })}
          make={() => ({ heading: "", body: [""] })}
          addLabel="Add section"
          itemLabel={(i) => `Section ${String(i + 1).padStart(2, "0")}`}
          render={(b, update) => (
            <div className="space-y-3">
              <Field label="Heading" value={b.heading} onChange={(heading) => update({ ...b, heading })} />
              <Paragraphs label="Paragraphs" value={b.body} onChange={(body) => update({ ...b, body })} />
            </div>
          )}
        />
      </Card>
    </>
  );
}

function FaqEditor({ value, onChange }: { value: FaqPageContent; onChange: (v: FaqPageContent) => void }) {
  return (
    <>
      <HeaderFields value={value} onChange={onChange} />
      <Card title="Questions & answers" hint="Also used for Google's FAQ results.">
        <ListEditor
          items={value.faqs}
          onChange={(faqs) => onChange({ ...value, faqs })}
          make={() => ({ q: "", a: "" })}
          addLabel="Add question"
          itemLabel={(i) => `Question ${i + 1}`}
          render={(f, update) => (
            <div className="space-y-3">
              <Field label="Question" value={f.q} onChange={(q) => update({ ...f, q })} />
              <Field label="Answer" value={f.a} onChange={(a) => update({ ...f, a })} multiline />
            </div>
          )}
        />
      </Card>
    </>
  );
}

function ContactEditor({ value, onChange }: { value: ContactPageContent; onChange: (v: ContactPageContent) => void }) {
  return (
    <>
      <HeaderFields value={value} onChange={onChange} />
      <Card title="Contact details" hint="Shown beside the message form, e.g. Timing, Email, Contact number, Address, Instagram.">
        <ListEditor
          items={value.channels}
          onChange={(channels) => onChange({ ...value, channels })}
          make={() => ({ label: "", value: "" })}
          addLabel="Add detail"
          itemLabel={(i) => `Detail ${i + 1}`}
          render={(c, update) => (
            <div className="grid gap-3 md:grid-cols-[200px_1fr]">
              <Field label="Label" value={c.label} onChange={(label) => update({ ...c, label })} />
              <Field label="Value" value={c.value} onChange={(v) => update({ ...c, value: v })} />
            </div>
          )}
        />
      </Card>
    </>
  );
}

function AboutEditor({ value, onChange }: { value: AboutPageContent; onChange: (v: AboutPageContent) => void }) {
  const set = <K extends keyof AboutPageContent>(key: K, v: AboutPageContent[K]) => onChange({ ...value, [key]: v });
  const { hero, philosophy, story, codes, closing } = value;
  const titleHint = "Press Enter to split the heading over two lines.";

  return (
    <>
      <Card title="Hero" hint="The full-screen opening over the photo.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Small label" value={hero.eyebrow} onChange={(eyebrow) => set("hero", { ...hero, eyebrow })} />
          <Field label="Title" value={hero.title} onChange={(title) => set("hero", { ...hero, title })} />
          <Field label="Italic ending" value={hero.italic} onChange={(italic) => set("hero", { ...hero, italic })} />
        </div>
        <Field label="Tagline" value={hero.tagline} onChange={(tagline) => set("hero", { ...hero, tagline })} />
      </Card>

      <Card title="Philosophy">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Label" value={philosophy.label} onChange={(label) => set("philosophy", { ...philosophy, label })} />
          <Field label="Heading" value={philosophy.title} onChange={(title) => set("philosophy", { ...philosophy, title })} multiline rows={2} hint={titleHint} />
        </div>
        <Field label="Opening line" value={philosophy.lead} onChange={(lead) => set("philosophy", { ...philosophy, lead })} multiline rows={2} />
        <Paragraphs label="Paragraphs" value={philosophy.paragraphs} onChange={(paragraphs) => set("philosophy", { ...philosophy, paragraphs })} />
        <Field label="Highlighted quote" value={philosophy.quote} onChange={(quote) => set("philosophy", { ...philosophy, quote })} multiline rows={2} />
      </Card>

      <Card title="Story">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Label" value={story.label} onChange={(label) => set("story", { ...story, label })} />
          <Field label="Heading" value={story.title} onChange={(title) => set("story", { ...story, title })} multiline rows={2} hint={titleHint} />
        </div>
        <Field label="Opening line" value={story.lead} onChange={(lead) => set("story", { ...story, lead })} multiline rows={2} />
        <Paragraphs label="Paragraphs" value={story.paragraphs} onChange={(paragraphs) => set("story", { ...story, paragraphs })} />
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <Field label="Big quote" value={story.quote} onChange={(quote) => set("story", { ...story, quote })} multiline rows={2} />
          <Field label="Quote credit" value={story.cite} onChange={(cite) => set("story", { ...story, cite })} />
        </div>
      </Card>

      <Card title="The codes" hint="The cards under the codes heading (three fit best).">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Label" value={codes.label} onChange={(label) => set("codes", { ...codes, label })} />
          <Field label="Heading" value={codes.title} onChange={(title) => set("codes", { ...codes, title })} multiline rows={2} hint={titleHint} />
        </div>
        <Field label="Introduction" value={codes.intro} onChange={(intro) => set("codes", { ...codes, intro })} multiline rows={2} />
        <ListEditor
          items={codes.items}
          onChange={(items) => set("codes", { ...codes, items })}
          make={() => ({ name: "", line: "", body: "", attrs: [] })}
          addLabel="Add card"
          itemLabel={(i) => `Card ${String(i + 1).padStart(2, "0")}`}
          render={(item, update) => (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name" value={item.name} onChange={(name) => update({ ...item, name })} />
                <Field label="Italic line" value={item.line} onChange={(line) => update({ ...item, line })} />
              </div>
              <Field label="Description" value={item.body} onChange={(body) => update({ ...item, body })} multiline />
              <div>
                <span className={labelClass}>Attributes</span>
                <div className="mt-1.5 space-y-2">
                  {item.attrs.map((a, j) => (
                    <div key={j} className="flex gap-2">
                      <input
                        value={a.k}
                        placeholder="Label"
                        onChange={(e) => update({ ...item, attrs: item.attrs.map((x, n) => (n === j ? { ...x, k: e.target.value } : x)) })}
                        className={`${inputClass} !mt-0 max-w-[180px]`}
                      />
                      <input
                        value={a.v}
                        placeholder="Value"
                        onChange={(e) => update({ ...item, attrs: item.attrs.map((x, n) => (n === j ? { ...x, v: e.target.value } : x)) })}
                        className={`${inputClass} !mt-0`}
                      />
                      <button
                        type="button"
                        className={`${iconButton} shrink-0`}
                        onClick={() => update({ ...item, attrs: item.attrs.filter((_, n) => n !== j) })}
                        aria-label="Remove attribute"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className={smallButton} onClick={() => update({ ...item, attrs: [...item.attrs, { k: "", v: "" }] })}>
                    <Plus size={12} /> Add attribute
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      </Card>

      <Card title="Closing">
        <Field label="Closing statement" value={closing.statement} onChange={(statement) => set("closing", { ...closing, statement })} multiline rows={2} />
        <Field label="Button text" value={closing.button} onChange={(button) => set("closing", { ...closing, button })} hint="Links to the shop. Leave empty to hide the button." />
      </Card>
    </>
  );
}
