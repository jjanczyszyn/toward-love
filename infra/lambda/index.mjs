// toward.love Script Studio — backend (AWS Lambda Function URL)
// Email-code login (only hello@toward.love), scripts served only to a valid
// session, and email-the-PDF — all via SES. Scripts are embedded in this package
// (private) and are NEVER in the public web bundle.
import { readFileSync } from "node:fs";
import { createHash, randomUUID, randomInt } from "node:crypto";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.TABLE || "toward-love-scripts-auth";
const ALLOWED_EMAIL = (process.env.ALLOWED_EMAIL || "hello@toward.love").toLowerCase();
const FROM = process.env.FROM_EMAIL || "toward.love <no-reply@toward.love>";
const PDF_TO = process.env.PDF_TO || "justynajanczyszyn@gmail.com";
const SALT = process.env.SALT || "toward-love";
const CODE_TTL = 15 * 60; // seconds
const SESSION_TTL = 30 * 24 * 60 * 60; // seconds

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const ses = new SESv2Client({ region: REGION });

const SCRIPTS = JSON.parse(readFileSync(new URL("./scripts.json", import.meta.url)));

const now = () => Math.floor(Date.now() / 1000);
const sha = (s) => createHash("sha256").update(SALT + ":" + s).digest("hex");
const norm = (e) => (e || "").trim().toLowerCase();

function json(status, body) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function getSessionEmail(token) {
  if (!token) return null;
  const r = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { pk: "sess#" + token } }),
  );
  if (!r.Item || r.Item.ttl < now()) return null;
  return r.Item.email;
}

async function requestCode(email) {
  // Only ever send to the one allowed address; otherwise pretend success.
  if (norm(email) !== ALLOWED_EMAIL) return json(200, { ok: true });
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: "code#" + ALLOWED_EMAIL,
        codeHash: sha(ALLOWED_EMAIL + ":" + code),
        ttl: now() + CODE_TTL,
        attempts: 0,
      },
    }),
  );
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [ALLOWED_EMAIL] },
      Content: {
        Simple: {
          Subject: { Data: `Your script.toward.love login code: ${code}` },
          Body: {
            Text: {
              Data:
                `Your login code is ${code}\n\n` +
                `It expires in 15 minutes. If you didn't request this, ignore this email.\n\n— script.toward.love`,
            },
          },
        },
      },
    }),
  );
  return json(200, { ok: true });
}

async function verifyCode(email, code) {
  if (norm(email) !== ALLOWED_EMAIL) return json(401, { error: "Invalid code." });
  const r = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { pk: "code#" + ALLOWED_EMAIL } }),
  );
  const item = r.Item;
  if (!item || item.ttl < now() || (item.attempts || 0) > 6) {
    return json(401, { error: "That code is invalid or expired." });
  }
  if (item.codeHash !== sha(ALLOWED_EMAIL + ":" + (code || "").trim())) {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: { ...item, attempts: (item.attempts || 0) + 1 },
      }),
    );
    return json(401, { error: "That code is invalid or expired." });
  }
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { pk: "code#" + ALLOWED_EMAIL } }));
  const token = randomUUID() + randomUUID().replace(/-/g, "");
  const ttl = now() + SESSION_TTL;
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: { pk: "sess#" + token, email: ALLOWED_EMAIL, ttl },
    }),
  );
  return json(200, { token, expiresAt: ttl * 1000 });
}

function rawMime({ from, to, subject, text, filename, base64 }) {
  const b = "b_" + randomUUID().replace(/-/g, "");
  const wrapped = base64.replace(/.{76}/g, "$&\r\n");
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${b}"`,
    "",
    `--${b}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "",
    `--${b}`,
    `Content-Type: application/pdf; name="${filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${filename}"`,
    "",
    wrapped,
    "",
    `--${b}--`,
    "",
  ].join("\r\n");
}

async function emailPdf(token, filename, base64, note) {
  const email = await getSessionEmail(token);
  if (!email) return json(401, { error: "Not authorized." });
  const mime = rawMime({
    from: FROM,
    to: PDF_TO,
    subject: "Your finalized toward.love event script",
    text: (note ? note + "\n\n" : "") + "Your finalized script is attached.\n\n— script.toward.love",
    filename: filename || "toward-love-event-script.pdf",
    base64,
  });
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [PDF_TO] },
      Content: { Raw: { Data: new TextEncoder().encode(mime) } },
    }),
  );
  return json(200, { ok: true, emailed: true, to: PDF_TO });
}

async function listScripts(token) {
  const email = await getSessionEmail(token);
  if (!email) return json(401, { error: "Not authorized." });
  return json(200, { scripts: SCRIPTS });
}

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method || "POST";
  if (method === "OPTIONS") return { statusCode: 204 };
  let body = {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Bad request." });
  }
  try {
    switch (body.action) {
      case "request_code":
        return await requestCode(body.email);
      case "verify_code":
        return await verifyCode(body.email, body.code);
      case "list_scripts":
        return await listScripts(body.token);
      case "email_pdf":
        return await emailPdf(body.token, body.filename, body.base64, body.note);
      default:
        return json(400, { error: "Unknown action." });
    }
  } catch (e) {
    console.error("handler error", e);
    return json(500, { error: "Server error.", detail: String(e?.message || e).slice(0, 200) });
  }
};
