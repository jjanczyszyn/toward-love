import { useState } from "react";

const CREATOR_URL = "https://justinalydia.com";
const CONTACT_EMAIL = "hello@toward.love";
const BOOKING_URL = "https://cal.com/justina-lydia/coaching-intro-call";

// Open Gmail's compose window in the browser, pre-filled per offering, instead
// of the system mail app (matches the main landing page's contact pattern).
function compose(subject: string): string {
  return (
    "https://mail.google.com/mail/?view=cm&fs=1&to=" +
    encodeURIComponent(CONTACT_EMAIL) +
    "&su=" +
    encodeURIComponent(subject)
  );
}

type Offering = {
  id: string;
  kicker: string;
  title: string;
  price?: string;
  // One clickable sentence used when this offering is shown as another way in.
  teaser: string;
  lede: string;
  body: string[];
  includes?: string[];
  image?: string;
  imageAlt?: string;
  ctaLabel: string;
  // Coaching starts with a discovery call (booking link); the cohort starts
  // with an application email. `ctaHref` decides which a card uses.
  ctaHref: string;
  featured?: boolean;
};

const OFFERINGS: Offering[] = [
  {
    id: "mastermind",
    kicker: "Group mastermind · Calling in the One",
    title: "Become the person your person is looking for",
    price: "$70 / month",
    teaser: "Single, and calling in a real partnership? Do the inner work together.",
    lede:
      "A small group moving through Katherine Woodward Thomas's Calling in the One together. Forty nine lessons of inner work, held at a pace that lets each one actually land.",
    body: [
      "You can do everything right on the apps and still come home to the same ache. More dates rarely fix it, because the thing in the way is usually not out there. It lives in the story you carry about love, the old agreements you made about what you are allowed to want, and the ways you protect yourself from the very closeness you are asking for.",
      "This is the most important investment you can make, because it changes the one variable you actually control. Not who is out there, but who is here to meet them. We clear the ground so that love has somewhere to take root. We practice recognizing a person who is good for you, and staying open long enough for something real to grow.",
      "We meet twice a month on video. Between calls you work the lessons on your own, then bring what surfaces back to the group. You are paired with a support buddy for the season, someone walking the same road, so the work continues in the days when no one is watching. The accountability is shared and the honesty is real. That is what moves people.",
    ],
    includes: [
      "An intro coaching session to surface what you are truly here to create",
      "Paired with a support buddy for the whole season",
      "Two live group calls each month",
      "Guided exercises between meetings, drawn from the 49 lessons",
      "A small circle for shared accountability and witness",
    ],
    ctaLabel: "Apply for the mastermind",
    ctaHref: compose("Calling in the One mastermind"),
    featured: true,
  },
  {
    id: "individual",
    kicker: "1:1 coaching",
    title: "Individual coaching",
    price: "$150 / session",
    teaser: "Meeting the same pattern again and again? Go to the root, one to one.",
    lede:
      "Private work for the moments your system shorts out, where words say one thing and the body says another, and the same loop keeps running with a new face each time.",
    body: [
      "We work with the patterns that repeat, the fears that show up right as things get close, and the picture of partnership you have never let yourself fully want. The work draws on parts work, somatic tracking, and authentic relating, bringing your words, body, and parts back onto the same current so you can move toward what you want without working against yourself.",
      "I bring a steady nervous system into the room, read what is being said and unsaid, and stay with you until the wiring comes back into contact. This is for you if you want focused attention on your particular story, at your own pace, with someone in your corner between the milestones.",
    ],
    ctaLabel: "Book a discovery call",
    ctaHref: BOOKING_URL,
  },
  {
    id: "couples",
    kicker: "For two · The art of turning toward each other",
    title: "Couples coaching",
    price: "$175 / session",
    teaser: "With someone, and longing to feel close again? Turn toward each other.",
    lede:
      "You already love each other. This is about being present enough to feel it.",
    body: [
      "Most of the time you talk about things. The schedule, the kids, who is picking up what. Useful, necessary, and a thousand miles from each other. The closeness is still there. It just gets buried under the running of a life, and connection becomes something you assume rather than something you feel.",
      "Arrive as you are. Together we move into a space of relaxation and embodied connection, paced gently to the energy in the room. You pick up simple, durable tools for the kind of communication that brings you back into intimacy, again and again. And together we plant a seed in the garden of your connection, one that keeps growing long after you leave the room.",
      "This is presence work, not therapy or crisis work. It is for couples who are basically solid and want to feel close again. If you are in acute crisis or considering separation, a licensed couples therapist will serve you better, and I will happily point you toward one.",
    ],
    image: "/photos/couples.jpg",
    imageAlt: "A couple sitting close on the floor, holding hands and laughing together",
    ctaLabel: "Reach out together",
    ctaHref: BOOKING_URL,
  },
];

const TESTIMONIALS = [
  {
    q: "I have never felt more seen than during a session with Justina. She is incredible at holding space and asking the questions that help you dig deeper into your own limiting beliefs and patterns, with a gentle kindness that is deeply warm and inviting.",
    by: "Deric",
  },
  {
    q: "Justina is a relational superwoman. Through her deep empathy and keen somatic observations, she helped my partner and me recognize the unspoken patterns in our relationship. We now feel more attuned to each other than ever.",
    by: "Amelie",
  },
  {
    q: "Justina has a very compassionate way of approaching her clients. She is sensitive, careful, and heart-centred. She is well grounded in her own body, which lets the client's system calm down easier and faster. I am thankful for the session and recommend it.",
    by: "Frederike",
  },
  {
    q: "Justina helped me navigate interpersonal conflicts, find emotional clarity, and develop strategies for future social interactions. All in an atmosphere of empathy, respect, and connection. Highly recommend.",
    by: "Krzysztof",
  },
  {
    q: "She helped me release emotional blocks I did not even realize were holding me back. She has this way of asking the right questions that make everything click, and she never pushes her own answers on you. One of the best decisions I have made.",
    by: "Michal",
  },
];

// The guided experience: one question that routes a visitor to the offering
// that best fits where they are right now.
const GUIDE_PATHS = [
  {
    label: "I am single, and I want to call in a real partnership",
    offeringId: "mastermind",
    why: "Begin with the mastermind. We do the inner work that clears the ground first, so the love you are calling in has somewhere to take root.",
  },
  {
    label: "I keep meeting the same pattern, and I want to understand myself",
    offeringId: "individual",
    why: "Begin one to one. We follow the pattern to its root and bring your words, body, and parts back onto the same current.",
  },
  {
    label: "I am with someone, and I want us to feel close again",
    offeringId: "couples",
    why: "Begin together. We slow down and practice the presence that lets you feel the love that is already there.",
  },
];
type GuidePath = (typeof GUIDE_PATHS)[number];

function Guide({ onChoose }: { onChoose: (p: GuidePath) => void }) {
  const [step, setStep] = useState<"breath" | "ask">("breath");

  return (
    <section className="guide" aria-label="Find where to begin">
      {step === "breath" ? (
        <div className="guide__panel">
          <p className="guide__eyebrow">Before you begin</p>
          <p className="guide__breath">
            Let your eyes soften for a moment. Take one slow breath, all the way
            down. Feel the weight of your body settle into the soles of your
            feet, into the floor that is holding you. There is no rush here.
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep("ask")}
          >
            I am here
          </button>
        </div>
      ) : (
        <div className="guide__panel">
          <p className="guide__eyebrow">A place to start</p>
          <h2 className="guide__q">What is alive for you right now?</h2>
          <div className="guide__options">
            {GUIDE_PATHS.map((p) => (
              <button
                type="button"
                key={p.offeringId}
                className="guide__option"
                onClick={() => onChoose(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function OfferingCard({ o }: { o: Offering }) {
  return (
    <article
      id={o.id}
      className={"offering" + (o.featured ? " offering--featured" : "")}
    >
      {o.image && (
        <img
          className="offering__img"
          src={o.image}
          alt={o.imageAlt}
          loading="lazy"
          decoding="async"
        />
      )}
      <p className="offering__kicker">{o.kicker}</p>
      <div className="offering__head">
        <h2 className="offering__title">{o.title}</h2>
        {o.price && <span className="offering__price">{o.price}</span>}
      </div>
      <p className="offering__lede">{o.lede}</p>
      {o.body.map((p, i) => (
        <p key={i} className="offering__p">
          {p}
        </p>
      ))}
      {o.includes && (
        <ul className="offering__includes">
          {o.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <a
        className={"btn " + (o.featured ? "btn--primary" : "btn--ghost")}
        href={o.ctaHref}
        target="_blank"
        rel="noreferrer"
      >
        {o.ctaLabel} →
      </a>
    </article>
  );
}

function OfferingView(props: {
  offering: Offering;
  why: string | null;
  others: Offering[];
  onSelect: (id: string) => void;
  onRestart: () => void;
}) {
  const { offering, why, others, onSelect, onRestart } = props;
  return (
    <>
      <div className="result">
        <button type="button" className="result__back" onClick={onRestart}>
          ← Begin again
        </button>
        {why ? (
          <>
            <p className="result__eyebrow">Where I would begin you</p>
            <p className="result__why">{why}</p>
          </>
        ) : (
          <p className="result__eyebrow">Here is the work</p>
        )}
      </div>

      <section className="offerings offerings--single" aria-label="Your offering">
        <OfferingCard o={offering} />
      </section>

      <section className="more" aria-label="Other ways to begin">
        <p className="more__eyebrow">Or begin somewhere else</p>
        <ul className="more__list">
          {others.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="more__item"
                onClick={() => onSelect(o.id)}
              >
                <span className="more__sentence">{o.teaser}</span>
                <span className="more__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="quotes" aria-label="From clients">
        <p className="quotes__eyebrow">From clients</p>
        <div className="quotes__grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.by} className="quote">
              <blockquote>{t.q}</blockquote>
              <figcaption>{t.by}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}

export default function OfferingsApp() {
  // null selection = the guided experience stands alone; a selection reveals
  // that one offering, with the others reachable by a clickable sentence.
  const [selected, setSelected] = useState<string | null>(null);
  const [guidePick, setGuidePick] = useState<GuidePath | null>(null);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const chooseFromGuide = (p: GuidePath) => {
    setGuidePick(p);
    setSelected(p.offeringId);
    toTop();
  };
  const selectOffering = (id: string) => {
    setSelected(id);
    toTop();
  };
  const restart = () => {
    setSelected(null);
    setGuidePick(null);
    toTop();
  };

  const current = selected
    ? OFFERINGS.find((o) => o.id === selected) ?? null
    : null;
  const others = current
    ? OFFERINGS.filter((o) => o.id !== current.id)
    : [];
  const why =
    current && guidePick && guidePick.offeringId === current.id
      ? guidePick.why
      : null;

  return (
    <main className={"wrap" + (current ? "" : " wrap--guide")}>
      <header className="ohead">
        <a className="mark mark--link" href="/">
          toward<span>.love</span>
          <sup className="mark__sm">℠</sup>
        </a>
      </header>

      {current ? (
        <OfferingView
          offering={current}
          why={why}
          others={others}
          onSelect={selectOffering}
          onRestart={restart}
        />
      ) : (
        <Guide onChoose={chooseFromGuide} />
      )}

      <footer className="foot">
        {current && (
          <p className="foot__invite">
            Not sure which is right for you?{" "}
            <a
              href={compose("Which offering is right for me?")}
              target="_blank"
              rel="noreferrer"
            >
              Email {CONTACT_EMAIL}
            </a>
          </p>
        )}
        <div className="foot__meta">
          <a href="/">toward.love</a>
          <span className="foot__sep">·</span>
          <span>
            Created by{" "}
            <a href={CREATOR_URL} target="_blank" rel="noreferrer">
              justinalydia.com
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
