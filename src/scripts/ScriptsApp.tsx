import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { marked } from "marked";
import { api } from "../../convex/_generated/api";
import { buildPdf, pdfBase64, type Section } from "./pdf";

const TOKEN_KEY = "tl_scripts_token";
const SEL_KEY = "tl_scripts_selection";

type ScriptDoc = {
  slug: string;
  order: number;
  title: string;
  theme: string;
  tone: string;
  sections: { id: string; title: string; duration?: string; markdown: string }[];
};

marked.setOptions({ breaks: true });
const md = (s: string) => ({ __html: marked.parse(s) as string });

// ─────────────────────────────────────────────────────────────────────────────
export default function ScriptsApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const session = useQuery(api.scriptsAuth.validate, token ? { token } : "skip");

  useEffect(() => {
    if (token && session === null) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
    }
  }, [token, session]);

  const onAuthed = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };
  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  };

  if (!token) return <LoginGate onAuthed={onAuthed} />;
  if (session === undefined)
    return <div className="wrap centered muted">Unlocking…</div>;
  if (session === null) return <LoginGate onAuthed={onAuthed} />;
  return <Studio token={token} onLogout={onLogout} />;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginGate({ onAuthed }: { onAuthed: (t: string) => void }) {
  const requestCode = useAction(api.scriptsAuth.requestCode);
  const verifyCode = useMutation(api.scriptsAuth.verifyCode);
  const loginPw = useMutation(api.scriptsAuth.loginWithPassword);

  const [email, setEmail] = useState("hello@toward.love");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [emailedHint, setEmailedHint] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await requestCode({ email });
      setSent(true);
      setEmailedHint(r.emailed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await verifyCode({ email, code });
      onAuthed(r.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  const signInPw = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await loginPw({ email, password });
      onAuthed(r.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wrong email or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="wrap login-wrap">
      <div className="mark mark--center">
        toward<span>.love</span>
      </div>
      <h1 className="login-title">Script studio</h1>
      <p className="muted login-sub">
        Private. Sign in to read, mix, and finalize the event scripts.
      </p>

      <div className="card login-card">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        {!sent ? (
          <button className="btn btn--primary btn--full" disabled={busy} onClick={send}>
            {busy ? "Sending…" : "Email me a login code"}
          </button>
        ) : (
          <>
            <p className="muted small">
              {emailedHint
                ? `A 6-digit code was sent to ${email}. Check that inbox.`
                : "Code generated. (Email delivery isn't configured on this deployment yet — use the password below, or set RESEND_API_KEY to receive codes.)"}
            </p>
            <label className="field">
              <span>Login code</span>
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </label>
            <button
              className="btn btn--primary btn--full"
              disabled={busy || code.length < 4}
              onClick={verify}
            >
              {busy ? "Verifying…" : "Enter"}
            </button>
            <button className="linklike resend" disabled={busy} onClick={send}>
              Resend code
            </button>
          </>
        )}

        <div className="login-divider">
          <span>or</span>
        </div>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && password && signInPw()}
          />
        </label>
        <button
          className="btn btn--ghost btn--full"
          disabled={busy || !password}
          onClick={signInPw}
        >
          Sign in with password
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}

// ── Studio ────────────────────────────────────────────────────────────────────
function Studio({ token, onLogout }: { token: string; onLogout: () => void }) {
  const scripts = useQuery(api.scriptsContent.list, { token }) as
    | ScriptDoc[]
    | undefined;
  const sendPdf = useAction(api.scriptsEmail.sendPdf);

  // Canonical section order + labels from the first script (all are consistent).
  const sectionOrder = useMemo(() => {
    if (!scripts || !scripts.length) return [];
    return scripts[0].sections.map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.duration,
    }));
  }, [scripts]);

  // selection: sectionId -> chosen script slug
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [view, setView] = useState<"compose" | "browse">("compose");
  const [browseSlug, setBrowseSlug] = useState<string>("");
  const [openSection, setOpenSection] = useState<string>("");
  const [emailState, setEmailState] = useState<string>("");

  // Initialize selection (from storage, else default everything to script #1).
  useEffect(() => {
    if (!scripts || !scripts.length) return;
    const stored = localStorage.getItem(SEL_KEY);
    const valid = (sel: Record<string, string>) =>
      Object.values(sel).every((slug) => scripts.some((s) => s.slug === slug));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (valid(parsed)) {
          setSelection(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    const init: Record<string, string> = {};
    for (const sec of scripts[0].sections) init[sec.id] = scripts[0].slug;
    setSelection(init);
  }, [scripts]);

  useEffect(() => {
    if (Object.keys(selection).length)
      localStorage.setItem(SEL_KEY, JSON.stringify(selection));
  }, [selection]);

  if (scripts === undefined)
    return <div className="wrap centered muted">Loading scripts…</div>;
  if (!scripts.length)
    return (
      <div className="wrap centered muted">
        No scripts found. Run the seed script.
      </div>
    );

  const bySlug = (slug: string) => scripts.find((s) => s.slug === slug);

  const finalSections: Section[] = sectionOrder
    .map(({ id }) => {
      const slug = selection[id];
      if (!slug) return null;
      const doc = bySlug(slug);
      const sec = doc?.sections.find((s) => s.id === id);
      if (!doc || !sec) return null;
      return { ...sec, fromTheme: doc.theme } as Section;
    })
    .filter(Boolean) as Section[];

  const includedCount = finalSections.length;
  const themesUsed = new Set(finalSections.map((s) => s.fromTheme)).size;

  const makeDoc = () =>
    buildPdf("Custom Event Script", finalSections);

  const filename = "toward-love-event-script.pdf";

  const onDownload = () => {
    makeDoc().save(filename);
  };

  const onEmail = async () => {
    setEmailState("Preparing…");
    try {
      const doc = makeDoc();
      const base64 = pdfBase64(doc);
      const r = await sendPdf({
        token,
        filename,
        base64,
        note: `Your finalized toward.love script — ${includedCount} sections, drawn from ${themesUsed} of the 10 versions.`,
      });
      if (r.emailed) {
        setEmailState("✓ Emailed to you. Check your inbox.");
      } else if (r.reason === "email-not-configured") {
        doc.save(filename);
        setEmailState(
          "Email isn't configured on this deployment yet, so the PDF was downloaded instead. (Set RESEND_API_KEY to enable emailing.)",
        );
      } else {
        doc.save(filename);
        setEmailState(`Couldn't email (${r.reason}). Downloaded the PDF instead.`);
      }
    } catch (e) {
      setEmailState(
        "Something went wrong emailing. Use Download PDF instead. " +
          (e instanceof Error ? e.message : ""),
      );
    }
  };

  return (
    <main className="studio">
      <header className="studio-top">
        <div className="mark">
          toward<span>.love</span> <em>script studio</em>
        </div>
        <div className="studio-top__actions">
          <div className="seg">
            <button
              className={"seg__btn" + (view === "compose" ? " seg__btn--on" : "")}
              onClick={() => setView("compose")}
            >
              Compose
            </button>
            <button
              className={"seg__btn" + (view === "browse" ? " seg__btn--on" : "")}
              onClick={() => {
                setView("browse");
                if (!browseSlug) setBrowseSlug(scripts[0].slug);
              }}
            >
              Read full scripts
            </button>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {view === "compose" ? (
        <div className="studio-body">
          <section className="compose">
            <div className="compose-intro">
              <h1>Build your final script</h1>
              <p className="muted">
                For each of the 12 sections below, choose which of the 10 versions
                you want. Click a version to select it; click its title to read it.
                Your final script is assembled live on the right.
              </p>
            </div>

            {sectionOrder.map((sec, idx) => {
              const chosen = selection[sec.id];
              const chosenDoc = bySlug(chosen);
              const open = openSection === sec.id;
              return (
                <div className="sec-panel" key={sec.id}>
                  <button
                    className="sec-panel__head"
                    onClick={() => setOpenSection(open ? "" : sec.id)}
                  >
                    <span className="sec-panel__num">{idx + 1}</span>
                    <span className="sec-panel__title">
                      {sec.title}
                      {sec.duration ? (
                        <span className="sec-panel__dur"> · {sec.duration}</span>
                      ) : null}
                    </span>
                    <span className="sec-panel__chosen">
                      {chosenDoc ? chosenDoc.theme : "— none —"}
                    </span>
                    <span className="sec-panel__chev">{open ? "▾" : "▸"}</span>
                  </button>

                  {open && (
                    <div className="sec-panel__body">
                      <div className="variant-grid">
                        {scripts.map((doc) => {
                          const v = doc.sections.find((s) => s.id === sec.id);
                          if (!v) return null;
                          const on = chosen === doc.slug;
                          return (
                            <div
                              key={doc.slug}
                              className={"variant" + (on ? " variant--on" : "")}
                            >
                              <label className="variant__pick">
                                <input
                                  type="radio"
                                  name={"sec-" + sec.id}
                                  checked={on}
                                  onChange={() =>
                                    setSelection((s) => ({
                                      ...s,
                                      [sec.id]: doc.slug,
                                    }))
                                  }
                                />
                                <span className="variant__theme">{doc.theme}</span>
                                {v.duration ? (
                                  <span className="variant__dur">{v.duration}</span>
                                ) : null}
                              </label>
                              <div
                                className="variant__preview md"
                                dangerouslySetInnerHTML={md(v.markdown)}
                              />
                            </div>
                          );
                        })}
                        <div className="variant variant--none">
                          <label className="variant__pick">
                            <input
                              type="radio"
                              name={"sec-" + sec.id}
                              checked={!chosen}
                              onChange={() =>
                                setSelection((s) => {
                                  const next = { ...s };
                                  delete next[sec.id];
                                  return next;
                                })
                              }
                            />
                            <span className="variant__theme">
                              Skip this section
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <aside className="finalbar">
            <div className="finalbar__card">
              <h2>Final script</h2>
              <p className="muted small">
                {includedCount} of {sectionOrder.length} sections · mixing{" "}
                {themesUsed} version{themesUsed === 1 ? "" : "s"}
              </p>
              <ol className="finalbar__list">
                {sectionOrder.map((sec) => {
                  const slug = selection[sec.id];
                  const doc = slug ? bySlug(slug) : null;
                  return (
                    <li
                      key={sec.id}
                      className={!doc ? "finalbar__li finalbar__li--off" : "finalbar__li"}
                    >
                      <span className="finalbar__sec">{sec.title}</span>
                      <span className="finalbar__from">
                        {doc ? doc.theme : "skipped"}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="finalbar__actions">
                <button
                  className="btn btn--primary btn--full"
                  onClick={onEmail}
                  disabled={!includedCount}
                >
                  Email the PDF to me
                </button>
                <button
                  className="btn btn--ghost btn--full"
                  onClick={onDownload}
                  disabled={!includedCount}
                >
                  Download PDF
                </button>
                {emailState && <p className="muted small">{emailState}</p>}
              </div>

              <div className="finalbar__quick">
                <span className="muted small">Quick fill from one version:</span>
                <div className="finalbar__quickrow">
                  {scripts.map((doc) => (
                    <button
                      key={doc.slug}
                      className="chip chip--mini"
                      title={`Use every section from “${doc.theme}”`}
                      onClick={() => {
                        const all: Record<string, string> = {};
                        for (const s of doc.sections) all[s.id] = doc.slug;
                        setSelection(all);
                      }}
                    >
                      {doc.theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="browse">
          <div className="browse__tabs">
            {scripts.map((doc) => (
              <button
                key={doc.slug}
                className={
                  "browse__tab" + (browseSlug === doc.slug ? " browse__tab--on" : "")
                }
                onClick={() => setBrowseSlug(doc.slug)}
              >
                {doc.theme}
              </button>
            ))}
          </div>
          {(() => {
            const doc = bySlug(browseSlug) || scripts[0];
            return (
              <article className="browse__doc">
                <h1>{doc.title}</h1>
                {doc.tone && <p className="muted browse__tone">{doc.tone}</p>}
                {doc.sections.map((s) => (
                  <section className="browse__sec" key={s.id}>
                    <h2>
                      {s.title}
                      {s.duration ? (
                        <span className="muted"> · {s.duration}</span>
                      ) : null}
                    </h2>
                    <div className="md" dangerouslySetInnerHTML={md(s.markdown)} />
                  </section>
                ))}
              </article>
            );
          })()}
        </div>
      )}
    </main>
  );
}
