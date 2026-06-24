import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const LUMA_URL = "https://luma.com/toward-love-a-dating-event-for-het-monog";
const LUMA_COVER =
  "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,quality=85,width=900/api-uploads/y6/53e0b007-d86f-4446-9b5f-45146b4d2c6f.jpg";
const CREATOR_URL = "https://justinalydia.com";
const hasBackend = !!import.meta.env.VITE_CONVEX_URL;

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
    <section className="event" aria-label="Upcoming event">
      <h2 className="event__kicker">The next event</h2>
      <a className="event-card" href={LUMA_URL} target="_blank" rel="noreferrer">
        <img
          className="event-card__img"
          src={LUMA_COVER}
          alt="Toward Love: a dating event for het, monog, family-seeking singles"
          width={900}
          height={863}
          decoding="async"
        />
        <div className="event-card__body">
          <h3 className="event-card__title">
            Toward Love: a dating event for het, monog, family-seeking singles
          </h3>
          <ul className="event-card__meta">
            <li>Fri, Jun 26 · 6:00–9:00 PM PT</li>
            <li>Frontier Tower, San Francisco</li>
          </ul>
          <span className="event-card__cta">View &amp; register on Luma →</span>
        </div>
      </a>
    </section>
  );
}

function SignupForm() {
  const add = useMutation(api.signups.add);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("An email is required to join the list.");
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!lastName.trim()) return setError("Please enter your last name.");
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
        <a className="btn btn--primary" href={LUMA_URL} target="_blank" rel="noreferrer">
          View the event on Luma →
        </a>
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

export default function App() {
  return (
    <main className="wrap">
      <header className="hero">
        <div className="mark">toward<span>.love</span></div>
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
        <span>toward.love</span>
        <span className="foot__sep">·</span>
        <span>
          Created by{" "}
          <a href={CREATOR_URL} target="_blank" rel="noreferrer">
            justinalydia.com
          </a>
        </span>
      </footer>
    </main>
  );
}
