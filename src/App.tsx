import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  analyticsConfigured,
  getConsent,
  setConsent,
} from "./analytics";

// ─── Events — add/edit/remove entries here in any order ──────────────────────
// `endsAt` is the event's end time (ISO, UTC). Once it passes, the event moves
// automatically from the "Upcoming" tab to "Past".
const EVENTS = [
  {
    title: "Toward Love: a dating event for het, monog, family-seeking singles",
    date: "Fri, Jun 26 · 6:00–9:00 PM PT",
    endsAt: "2026-06-27T04:00:00Z",
    location: "Frontier Tower, San Francisco",
    url: "https://luma.com/toward-love-a-dating-event-for-het-monog",
    cover:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,quality=85,width=900/api-uploads/y6/53e0b007-d86f-4446-9b5f-45146b4d2c6f.jpg",
  },
  {
    title:
      "toward.love: a dating event for ENM, seeking a person to build a life with",
    date: "Thu, Jul 2 · 6:00–9:00 PM PT",
    endsAt: "2026-07-03T04:00:00Z",
    location: "Frontier Tower, San Francisco",
    url: "https://luma.com/towardlove-a-dating-event-for-enm-seekin",
    cover:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,quality=85,width=900/uploads/0n/178fd9eb-f9f8-43df-931c-a7a91fe44c96.png",
  },
];
// ────────────────────────────────────────────────────────────────────────────

const CREATOR_URL = "https://justinalydia.com";
const CONTACT_EMAIL = "hello@toward.love";
// Open Gmail's compose window in the browser instead of the system mail app.
const GMAIL_COMPOSE =
  "https://mail.google.com/mail/?view=cm&fs=1&to=" +
  encodeURIComponent(CONTACT_EMAIL) +
  "&su=" +
  encodeURIComponent("Thoughts, desires, co-creation");
const hasBackend = !!import.meta.env.VITE_CONVEX_URL;
const MAX_BIRTH_YEAR = new Date().getFullYear() - 18; // must be 18+

type Option<T extends string> = { value: T; label: string };

const GENDERS: Option<"male" | "female" | "non-binary" | "other">[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

const ORIENTATIONS: Option<
  "heterosexual" | "homosexual" | "bisexual" | "pansexual" | "asexual" | "other"
>[] = [
  { value: "heterosexual", label: "Heterosexual" },
  { value: "homosexual", label: "Homosexual" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual" },
  { value: "other", label: "Other" },
];

const RELATIONSHIPS: Option<"monogamous" | "non-monogamous" | "other">[] = [
  { value: "monogamous", label: "Monogamous" },
  { value: "non-monogamous", label: "Non-monogamous" },
  { value: "other", label: "Other" },
];

const HAVE_KIDS: Option<"yes" | "no">[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const WANT_KIDS: Option<"yes" | "no" | "maybe" | "open">[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
  { value: "open", label: "Open to it" },
];

function ChipGroup<T extends string>(props: {
  name: string;
  options: Option<T>[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={props.name}>
      {props.options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={props.value === o.value}
          className={"chip" + (props.value === o.value ? " chip--on" : "")}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EventEmbed() {
  return (
    <EventList />
  );
}

type EventItem = (typeof EVENTS)[number];

function EventCard({ ev, past }: { ev: EventItem; past?: boolean }) {
  return (
    <a
      className={"event-card" + (past ? " event-card--past" : "")}
      href={ev.url}
      target="_blank"
      rel="noreferrer"
    >
      <img
        className="event-card__img"
        src={ev.cover}
        alt={ev.title}
        width={900}
        height={863}
        decoding="async"
        loading={past ? "lazy" : "eager"}
      />
      <div className="event-card__body">
        <h3 className="event-card__title">{ev.title}</h3>
        <ul className="event-card__meta">
          <li>{ev.date}</li>
          <li>{ev.location}</li>
        </ul>
        <span className="event-card__cta">
          {past ? "View on Luma →" : "View & register on Luma →"}
        </span>
      </div>
    </a>
  );
}

function EventList() {
  const now = Date.now();
  const ends = (e: EventItem) => new Date(e.endsAt).getTime();
  const upcoming = EVENTS.filter((e) => ends(e) >= now).sort(
    (a, b) => ends(a) - ends(b),
  );
  const past = EVENTS.filter((e) => ends(e) < now).sort(
    (a, b) => ends(b) - ends(a),
  );

  const [tab, setTab] = useState<"upcoming" | "past">(
    upcoming.length === 0 && past.length > 0 ? "past" : "upcoming",
  );

  // Before any event has happened, keep it simple: just the upcoming list.
  if (past.length === 0) {
    return (
      <section className="event" aria-label="Upcoming events">
        <h2 className="event__kicker">
          {upcoming.length > 1 ? "Upcoming events" : "The next event"}
        </h2>
        <div className="event__list">
          {upcoming.map((ev) => (
            <EventCard key={ev.url} ev={ev} />
          ))}
        </div>
      </section>
    );
  }

  const list = tab === "upcoming" ? upcoming : past;
  return (
    <section className="event" aria-label="Events">
      <div className="event__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={"event__tab" + (tab === "upcoming" ? " event__tab--on" : "")}
          onClick={() => setTab("upcoming")}
        >
          Upcoming{upcoming.length ? ` (${upcoming.length})` : ""}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          className={"event__tab" + (tab === "past" ? " event__tab--on" : "")}
          onClick={() => setTab("past")}
        >
          Past ({past.length})
        </button>
      </div>
      <div className="event__list">
        {list.length === 0 ? (
          <p className="muted event__empty">No upcoming events right now. Check back soon.</p>
        ) : (
          list.map((ev) => (
            <EventCard key={ev.url} ev={ev} past={tab === "past"} />
          ))
        )}
      </div>
    </section>
  );
}

function SignupForm() {
  const add = useMutation(api.signups.add);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<"" | (typeof GENDERS)[number]["value"]>("");
  const [genderOther, setGenderOther] = useState("");
  const [orientation, setOrientation] = useState<
    "" | (typeof ORIENTATIONS)[number]["value"]
  >("");
  const [orientationOther, setOrientationOther] = useState("");
  const [relationship, setRelationship] = useState<
    "" | (typeof RELATIONSHIPS)[number]["value"]
  >("");
  const [relationshipOther, setRelationshipOther] = useState("");
  const [haveKids, setHaveKids] = useState<"" | "yes" | "no">("");
  const [wantKids, setWantKids] = useState<
    "" | (typeof WANT_KIDS)[number]["value"]
  >("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState(""); // honeypot — real users never fill this

  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Honeypot: a bot filled the hidden field. Pretend success, store nothing.
    if (hp.trim()) {
      setStatus("done");
      return;
    }

    if (!email.trim()) return setError("An email is required to join the list.");
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!lastName.trim()) return setError("Please enter your last name.");
    const yr = Number(birthYear);
    if (!birthYear.trim() || !Number.isInteger(yr))
      return setError("Please enter the year you were born.");
    if (yr < 1900 || yr > MAX_BIRTH_YEAR)
      return setError(`Please enter a valid birth year (you must be 18+).`);
    if (!gender) return setError("Please choose a gender.");
    if (gender === "other" && !genderOther.trim())
      return setError("Please describe your gender.");
    if (!orientation) return setError("Please choose a sexual orientation.");
    if (orientation === "other" && !orientationOther.trim())
      return setError("Please describe your orientation.");
    if (!relationship) return setError("Please choose a relationship preference.");
    if (relationship === "other" && !relationshipOther.trim())
      return setError("Please describe your relationship preference.");
    if (!haveKids) return setError("Please let us know if you have kids.");
    if (!wantKids) return setError("Please let us know about wanting kids.");

    setStatus("saving");
    try {
      await add({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthYear: Number(birthYear),
        gender,
        genderOther: gender === "other" ? genderOther.trim() : undefined,
        orientation,
        orientationOther:
          orientation === "other" ? orientationOther.trim() : undefined,
        relationship,
        relationshipOther:
          relationship === "other" ? relationshipOther.trim() : undefined,
        haveKids,
        wantKids,
        message: message.trim() || undefined,
        hp: hp || undefined,
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "done") {
    return (
      <div className="card thanks">
        <h2>You're on the list 💌</h2>
        <p>
          Thanks{firstName ? `, ${firstName}` : ""}. We'll be in touch as new
          events and matches come together.
        </p>
      </div>
    );
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Join the mailing list</h2>
      <p className="muted">
        Get notified about future events. A few quick questions help us match the
        community to who you are.
      </p>

      {/* Honeypot: hidden from real users; bots that fill it are silently dropped. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Email *</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>First name *</span>
        <input
          type="text"
          autoComplete="given-name"
          placeholder="Alex"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Last name *</span>
        <input
          type="text"
          autoComplete="family-name"
          placeholder="Rivera"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>What year were you born? *</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="1990"
          min={1900}
          max={MAX_BIRTH_YEAR}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          required
        />
      </label>

      <fieldset className="field">
        <legend>Gender</legend>
        <ChipGroup name="Gender" options={GENDERS} value={gender} onChange={setGender} />
        {gender === "other" && (
          <input
            className="other-input"
            type="text"
            placeholder="How would you describe it?"
            value={genderOther}
            onChange={(e) => setGenderOther(e.target.value)}
          />
        )}
      </fieldset>

      <fieldset className="field">
        <legend>Sexual orientation</legend>
        <ChipGroup
          name="Sexual orientation"
          options={ORIENTATIONS}
          value={orientation}
          onChange={setOrientation}
        />
        {orientation === "other" && (
          <input
            className="other-input"
            type="text"
            placeholder="How would you describe it?"
            value={orientationOther}
            onChange={(e) => setOrientationOther(e.target.value)}
          />
        )}
      </fieldset>

      <fieldset className="field">
        <legend>Relationship preference</legend>
        <ChipGroup
          name="Relationship preference"
          options={RELATIONSHIPS}
          value={relationship}
          onChange={setRelationship}
        />
        {relationship === "other" && (
          <input
            className="other-input"
            type="text"
            placeholder="How would you describe it?"
            value={relationshipOther}
            onChange={(e) => setRelationshipOther(e.target.value)}
          />
        )}
      </fieldset>

      <fieldset className="field">
        <legend>Do you have kids?</legend>
        <ChipGroup
          name="Do you have kids?"
          options={HAVE_KIDS}
          value={haveKids}
          onChange={setHaveKids}
        />
      </fieldset>

      <fieldset className="field">
        <legend>{haveKids === "yes" ? "Do you want more kids?" : "Do you want kids?"}</legend>
        <ChipGroup
          name="Do you want kids?"
          options={WANT_KIDS}
          value={wantKids}
          onChange={setWantKids}
        />
      </fieldset>

      <label className="field">
        <span>Anything else? (optional)</span>
        <textarea
          className="message-input"
          rows={5}
          placeholder="Special requests or desires for future events…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button
        className="btn btn--primary btn--full"
        type="submit"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Adding you…" : "Add me to the list"}
      </button>
    </form>
  );
}

function ConsentBanner(props: {
  onAccept: () => void;
  onDecline: () => void;
  onPrivacy: () => void;
}) {
  return (
    <div className="consent" role="dialog" aria-label="Analytics consent">
      <p className="consent__text">
        We use Google Analytics to understand how the site is used. Okay to enable
        analytics cookies?{" "}
        <button type="button" className="linklike" onClick={props.onPrivacy}>
          Privacy policy
        </button>
      </p>
      <div className="consent__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={props.onDecline}>
          Decline
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={props.onAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}

function PrivacyModal(props: { onClose: () => void }) {
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Privacy policy"
      onClick={props.onClose}
    >
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" aria-label="Close" onClick={props.onClose}>
          ×
        </button>
        <h2>Privacy policy</h2>
        <p className="muted">Last updated June 2026.</p>

        <h3>What we collect</h3>
        <p>
          When you join the mailing list we store your name, email, year of birth,
          and the dating preferences you choose to share (gender, sexual
          orientation, relationship preference, and whether you have or want
          kids), plus any optional message. Some of this is sensitive personal
          information, and you provide it voluntarily by submitting the form.
        </p>

        <h3>Why we collect it</h3>
        <p>
          To run the toward.love events and community, to contact you about future
          events, and to help match the community. We do not sell your data.
        </p>

        <h3>Where it is stored</h3>
        <p>Submissions are stored securely with our database provider, Convex.</p>

        <h3>Analytics</h3>
        <p>
          Only if you accept analytics cookies, we use Google Analytics to
          understand site usage. You can decline and the site works exactly the
          same. We never load analytics without your consent.
        </p>

        <h3>Your choices</h3>
        <p>
          To access, correct, or delete your information, contact the organizers
          via{" "}
          <a href={CREATOR_URL} target="_blank" rel="noreferrer">
            justinalydia.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(
    () => analyticsConfigured() && getConsent() === null,
  );
  const decide = (value: "granted" | "denied") => {
    setConsent(value);
    setShowConsent(false);
  };

  return (
    <main className="wrap">
      <header className="hero">
        <div className="mark">toward<span>.love</span><sup className="mark__sm">℠</sup></div>
        <h1>Intentional dating, toward lasting partnership.</h1>
        <p className="lede">
          A space for people serious about a lasting partnership, in an
          environment designed so real connection has a chance to bloom.
        </p>
      </header>

      <div className="split">
        <div id="event" className="split__event">
          <EventEmbed />
        </div>

        <section id="join" className="split__join">
          {hasBackend ? (
            <SignupForm />
          ) : (
            <div className="card">
              <h2>Mailing list</h2>
              <p className="muted">
                The signup backend isn't connected yet. Run{" "}
                <code>npm run dev:backend</code> (Convex) to enable it locally.
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="foot">
        <p className="foot__invite">
          Thoughts, desires, or want to co-create?{" "}
          <a href={GMAIL_COMPOSE} target="_blank" rel="noreferrer">
            Email {CONTACT_EMAIL}
          </a>
        </p>
        <div className="foot__meta">
          <span>toward.love</span>
          <span className="foot__sep">·</span>
          <span>
            Created by{" "}
            <a href={CREATOR_URL} target="_blank" rel="noreferrer">
              justinalydia.com
            </a>
          </span>
          <span className="foot__sep">·</span>
          <button type="button" className="linklike" onClick={() => setPrivacyOpen(true)}>
            Privacy
          </button>
        </div>
      </footer>

      {showConsent && (
        <ConsentBanner
          onAccept={() => decide("granted")}
          onDecline={() => decide("denied")}
          onPrivacy={() => setPrivacyOpen(true)}
        />
      )}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </main>
  );
}
