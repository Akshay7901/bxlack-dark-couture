import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Columns3, Monitor, Smartphone, Tablet } from "lucide-react";
import { fetchProducts } from "@/lib/catalog";
import { emailCatalog, preheaderOf, type EmailPreview } from "@/lib/email/catalog";
import {
  COPY_FIELDS,
  COPY_FIELD_LABELS,
  VARIABLE_HELP,
  resolveCopy,
  unknownVariables,
  type CopyField,
  type TemplateCopy,
} from "@/lib/email/copy";
import {
  listEmailTemplateSettings,
  resetEmailTemplate,
  saveEmailTemplate,
  type TemplateSetting,
} from "@/lib/email/templates.functions";
import { useConfirm } from "@/components/admin/ConfirmDialog";

const DEVICES = [
  { key: "phone", label: "Phone", width: 375, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { key: "desktop", label: "Desktop", width: 1280, icon: Monitor },
] as const;
type DeviceKey = (typeof DEVICES)[number]["key"] | "all";

const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500";
const inputClass =
  "mt-1.5 w-full border border-black/15 bg-white px-3 py-2 font-sans text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";
const smallButton =
  "border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-40";

export function AdminEmails() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const { data: settings = {}, error: settingsError } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: () => listEmailTemplateSettings(),
    refetchOnWindowFocus: false,
  });
  const images = useMemo(() => products.slice(0, 2).map((p) => p.cardImageUrl ?? p.imageUrl), [products]);
  const catalog = useMemo(() => emailCatalog(images), [images]);
  const [selectedId, setSelectedId] = useState<string>(catalog[0].id);
  const [device, setDevice] = useState<DeviceKey>("phone");

  const selected = catalog.find((e) => e.id === selectedId) ?? catalog[0];
  const groups = Array.from(new Set(catalog.map((e) => e.group)));

  return (
    <section>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
        Emails — {catalog.length}
      </h2>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        Edit the wording of every email the store sends · previews use sample data
      </p>
      {settingsError ? (
        <p className="mt-3 font-mono text-[11px] text-red-600">{(settingsError as Error).message}</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Email templates" className="space-y-5">
          {groups.map((g) => (
            <div key={g}>
              <p className={`${labelClass} mb-1.5`}>{g}</p>
              <div className="flex flex-wrap gap-1 lg:flex-col">
                {catalog
                  .filter((e) => e.group === g)
                  .map((e) => {
                    const s = settings[e.id];
                    const active = e.id === selected.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-3 px-3 py-2 text-left font-sans text-[13px] transition-colors ${
                          active ? "bg-black text-white" : "bg-black/[0.03] text-neutral-700 hover:bg-black/[0.07]"
                        }`}
                      >
                        {e.name}
                        {s ? (
                          <span
                            className={`font-mono text-[9px] uppercase tracking-[0.18em] ${
                              !s.enabled ? "text-red-500" : active ? "text-white/60" : "text-neutral-400"
                            }`}
                          >
                            {s.enabled ? "Edited" : "Off"}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Keyed so switching templates starts a fresh draft. */}
        <TemplateWorkspace
          key={selected.id}
          preview={selected}
          setting={settings[selected.id] ?? null}
          device={device}
          onDevice={setDevice}
        />
      </div>
    </section>
  );
}

function TemplateWorkspace({
  preview,
  setting,
  device,
  onDevice,
}: {
  preview: EmailPreview;
  setting: TemplateSetting | null;
  device: DeviceKey;
  onDevice: (d: DeviceKey) => void;
}) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm("light");
  const saved = useMemo(() => resolveCopy(preview.id, setting?.copy), [preview.id, setting]);
  const [draft, setDraft] = useState<TemplateCopy>(saved);
  const [enabled, setEnabled] = useState(setting?.enabled ?? true);
  const [editing, setEditing] = useState(false);
  const fieldRefs = useRef<Partial<Record<CopyField, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const lastField = useRef<CopyField>("intro");

  // Re-sync only when the saved values actually change (e.g. after Save or
  // Reset), not on every refetch, so typing is never wiped out.
  const savedKey = JSON.stringify(saved);
  useEffect(() => {
    setDraft(saved);
    setEnabled(setting?.enabled ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey, setting?.enabled]);

  const dirty = COPY_FIELDS.some((f) => draft[f] !== saved[f]) || enabled !== (setting?.enabled ?? true);
  const problems = COPY_FIELDS.flatMap((f) =>
    unknownVariables(draft[f], preview.variables).map((v) => `${COPY_FIELD_LABELS[f]}: {{${v}}} isn't available here`),
  );
  const email = useMemo(() => preview.render(draft), [preview, draft]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-email-templates"] });

  const save = useMutation({
    mutationFn: () => {
      // Store only what differs from the default, so future default improvements still apply.
      const defaults = preview.defaults;
      const value = (f: CopyField) => (draft[f].trim() && draft[f].trim() !== defaults[f] ? draft[f].trim() : null);
      return saveEmailTemplate({
        data: {
          id: preview.id,
          enabled,
          subject: value("subject"),
          heading: value("heading"),
          intro: value("intro"),
          button: value("button"),
          footer: value("footer"),
        },
      });
    },
    onSuccess: () => {
      toast.success(`${preview.name} saved`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => resetEmailTemplate({ data: { id: preview.id } }),
    onSuccess: () => {
      toast.success(`${preview.name} reset to default`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const insertVariable = (v: string) => {
    const f = lastField.current;
    const el = fieldRefs.current[f];
    const token = `{{${v}}}`;
    const text = draft[f];
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setDraft({ ...draft, [f]: text.slice(0, start) + token + text.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const copySupabaseHtml = async () => {
    try {
      await navigator.clipboard.writeText(preview.render(draft).html);
      toast.success("HTML copied — paste it into Supabase");
    } catch {
      toast.error("Couldn't copy automatically");
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {dialog}
      <div className="border border-black/10 bg-black/[0.02] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-[11px] text-neutral-500">
            <span className="text-neutral-900">BXLACK</span> · to {preview.to}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Sent when: {preview.when}</p>
        </div>
        <p className="mt-2 font-sans text-[15px] font-semibold text-neutral-900">{email.subject}</p>
        <p className="mt-0.5 truncate font-sans text-[13px] text-neutral-500">{preheaderOf(email.html)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing((v) => !v)} className={smallButton}>
          {editing ? "Close editor" : "Edit wording"}
        </button>
        {!preview.supabase ? (
          <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${enabled ? "text-green-600" : "text-red-600"}`}>
            {enabled ? "Sending on" : "Sending off"}
          </span>
        ) : null}
        {dirty ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600">Unsaved changes</span>
        ) : null}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (problems.length) return toast.error(problems[0]);
            save.mutate();
          }}
          className="space-y-4 border border-black/12 p-5"
        >
          {preview.supabase ? (
            <p className="bg-amber-50 p-3 font-mono text-[11px] leading-relaxed text-amber-800">
              Supabase sends this email, not the site. After saving, use “Copy HTML for Supabase” and paste it into
              Supabase → Authentication → Email Templates.
            </p>
          ) : (
            <label className="flex items-center gap-3 font-mono text-[12px] text-neutral-700">
              <input
                id={`enabled-${preview.id}`}
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Send this email
            </label>
          )}

          {COPY_FIELDS.map((f) => {
            const multiline = f === "intro" || f === "footer" || f === "heading";
            const common = {
              id: `${preview.id}-${f}`,
              value: draft[f],
              placeholder: preview.defaults[f],
              onFocus: () => (lastField.current = f),
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setDraft({ ...draft, [f]: e.target.value }),
              className: inputClass,
            };
            return (
              <label key={f} htmlFor={common.id} className="block">
                <span className={labelClass}>{COPY_FIELD_LABELS[f]}</span>
                {multiline ? (
                  <textarea
                    {...common}
                    ref={(el) => {
                      fieldRefs.current[f] = el;
                    }}
                    rows={f === "intro" ? 4 : 2}
                    maxLength={2000}
                  />
                ) : (
                  <input
                    {...common}
                    ref={(el) => {
                      fieldRefs.current[f] = el;
                    }}
                    maxLength={f === "button" ? 60 : 2000}
                  />
                )}
              </label>
            );
          })}

          {preview.variables.length ? (
            <div>
              <p className={labelClass}>Insert a variable into the last field you clicked</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    title={VARIABLE_HELP[v]}
                    onClick={() => insertVariable(v)}
                    className="bg-black/5 px-2.5 py-1.5 font-mono text-[11px] text-neutral-700 hover:bg-black/10"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-neutral-400">This email has no variables.</p>
          )}

          {problems.length ? <p className="font-mono text-[11px] text-red-600">{problems[0]}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={!dirty || save.isPending}
              className="border border-black bg-black px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-40"
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDraft(saved);
                setEnabled(setting?.enabled ?? true);
              }}
              className={smallButton}
            >
              Discard changes
            </button>
            {setting ? (
              <button
                type="button"
                disabled={reset.isPending}
                onClick={() =>
                  confirm({
                    title: "Reset to default",
                    message: `Put “${preview.name}” back to the original wording and switch it on?`,
                    confirmLabel: "Reset",
                    onConfirm: () => reset.mutate(),
                  })
                }
                className={smallButton}
              >
                Reset to default
              </button>
            ) : null}
            {preview.supabase ? (
              <button type="button" onClick={copySupabaseHtml} className={smallButton}>
                Copy HTML for Supabase
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preview size">
        {[...DEVICES, { key: "all" as const, label: "All sizes", width: 0, icon: Columns3 }].map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDevice(d.key)}
              aria-pressed={device === d.key}
              className={`flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                device === d.key ? "bg-black text-white" : "bg-black/5 text-neutral-600 hover:bg-black/10"
              }`}
            >
              <Icon size={13} />
              {d.label}
              {d.width ? <span className="opacity-60">{d.width}px</span> : null}
            </button>
          );
        })}
      </div>

      {device === "all" ? (
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_2fr]">
          {DEVICES.map((d) => (
            <DeviceFrame key={d.key} label={`${d.label} · ${d.width}px`} width={d.width} kind={d.key} html={email.html} />
          ))}
        </div>
      ) : (
        DEVICES.filter((d) => d.key === device).map((d) => (
          <DeviceFrame key={d.key} label={`${d.label} · ${d.width}px`} width={d.width} kind={d.key} html={email.html} />
        ))
      )}
    </div>
  );
}

/** Renders the email in a sandboxed frame at a real device width, scaled
 * down to fit the available space, with the frame's height following the
 * email's own height. */
function DeviceFrame({
  label,
  width,
  kind,
  html,
}: {
  label: string;
  width: number;
  kind: "phone" | "tablet" | "desktop";
  html: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(width);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = () => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.documentElement) setHeight(doc.documentElement.scrollHeight);
  };

  // Images (logo, thumbnails) load after the frame does, changing its height.
  useEffect(() => {
    const t = setTimeout(fit, 400);
    return () => clearTimeout(t);
  }, [html, width]);

  const bezel = kind === "desktop" ? 2 : 20;
  const scale = Math.min(1, Math.max(available - bezel, 120) / width);
  const chrome =
    kind === "phone"
      ? "rounded-[28px] border-[10px] border-neutral-900"
      : kind === "tablet"
        ? "rounded-[18px] border-[10px] border-neutral-900"
        : "rounded-md border border-neutral-300";

  return (
    <figure className="min-w-0">
      <figcaption className={`${labelClass} mb-2`}>{label}</figcaption>
      <div ref={boxRef} className="w-full">
        <div className={`mx-auto overflow-hidden bg-black ${chrome}`} style={{ width: width * scale + bezel }}>
          {kind === "desktop" ? (
            <div className="flex items-center gap-1.5 border-b border-neutral-300 bg-neutral-100 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            </div>
          ) : null}
          <div style={{ width: width * scale, height: height * scale, overflow: "hidden" }}>
            <iframe
              ref={frameRef}
              title={`${label} preview`}
              sandbox="allow-same-origin"
              srcDoc={html}
              onLoad={fit}
              style={{
                width,
                height,
                border: 0,
                display: "block",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
