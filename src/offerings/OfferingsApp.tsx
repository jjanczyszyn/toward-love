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
  lede: string;
  body: string[];
  includes?: string[];
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
    lede:
      "Private work for the moments your system shorts out, where words say one thing and the body says another, and the same loop keeps running with a new face each time.",
    body: [
      "We work with the patterns that repeat, the fears that show up right as things get close, and the picture of partnership you have never let yourself fully want. The work draws on parts work, somatic tracking, and authentic relating, with an executive coach's clarity about where you are headed and the steps to get there.",
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
    lede:
      "You already love each other. This is about being present enough to feel it.",
    body: [
      "Most of the time you talk about things. The schedule, the kids, who is picking up what. Useful, necessary, and a thousand miles from each other. The closeness is still there. It just gets buried under the running of a life, and connection becomes something you assume rather than something you feel.",
      "Arrive as you are. Together we move into a space of relaxation and embodied connection, paced gently to the energy in the room. You pick up simple, durable tools for the kind of communication that brings you back into intimacy, again and again. And together we plant a seed in the garden of your connection, one that keeps growing long after you leave the room.",
      "This is presence work, not therapy or crisis work. It is for couples who are basically solid and want to feel close again. If you are in acute crisis or considering separation, a licensed couples therapist will serve you better, and I will happily point you toward one.",
    ],
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
    q: "She helped me release emotional blocks I did not even realize were holding me back. She has this way of asking the right questions that make everything click, and she never pushes her own answers on you. One of the best decisions I have made.",
    by: "A client",
  },
];

function OfferingCard({ o }: { o: Offering }) {
  return (
    <article
      id={o.id}
      className={"offering" + (o.featured ? " offering--featured" : "")}
    >
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
        className={
          "btn " + (o.featured ? "btn--primary" : "btn--ghost")
        }
        href={o.ctaHref}
        target="_blank"
        rel="noreferrer"
      >
        {o.ctaLabel} →
      </a>
    </article>
  );
}

export default function OfferingsApp() {
  return (
    <main className="wrap">
      <header className="hero hero--offerings">
        <a className="mark mark--link" href="/">
          toward<span>.love</span>
          <sup className="mark__sm">℠</sup>
        </a>
        <p className="offerings__eyebrow">Coaching &amp; the inner work</p>
        <h1>The work that lets love bloom.</h1>
        <p className="lede">
          Most people wait for the right person to arrive. The quieter truth is
          that who shows up, and whether you can recognize and hold them when
          they do, depends on who you have become by the time they get here.
          These offerings are about that becoming.
        </p>
      </header>

      <section className="arc" aria-label="The arc of the work">
        <div className="arc__col">
          <h2 className="arc__label">How you arrive</h2>
          <p className="arc__story">
            Tired of dating that goes nowhere. Carrying the ache of wanting
            something you cannot seem to make happen, and a small fear that the
            problem might be you. You have read the books and tried to think
            your way through it, yet the same pattern keeps finding you with a
            new face each time.
          </p>
        </div>
        <div className="arc__bridge" aria-hidden="true">
          <span>→</span>
        </div>
        <div className="arc__col">
          <h2 className="arc__label">How you leave</h2>
          <p className="arc__story">
            Clear about the life you are actually building toward. Able to feel
            a person who is good for you in your body, not just name the ones
            who are not. Relating from a sense of enough rather than from
            hunger. Still yourself, more at home in it, and far more available
            to be found.
          </p>
        </div>
      </section>

      <p className="offerings__note">
        I work as an executive coach and a Calling in the One coach, drawing on
        authentic relating, parts work, somatic tracking, and breathwork. That
        means clarity about what you want and the steps to get there, held with
        real fluency for the heart underneath it.
      </p>

      <section className="offerings" aria-label="Offerings">
        {OFFERINGS.map((o) => (
          <OfferingCard key={o.id} o={o} />
        ))}
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

      <footer className="foot">
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
