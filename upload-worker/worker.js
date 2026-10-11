const OWNER = "squashberry";
const REPO = "Read";
const BRANCH = "master";
const ALLOWED_ORIGIN = "https://squashberry.github.io";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 4;
const DAILY_IP_FILE_LIMIT = 10;
const DAILY_USER_FILE_LIMIT = 20;
const ALLOWED_EXTENSIONS = new Set(["pdf","ppt","pptx","doc","docx","txt","md","rtf"]);
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const LOGIN_CODE_TTL_SECONDS = 10 * 60;

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": ALLOWED_ORIGIN,
      "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
      "vary": "Origin",
      "x-content-type-options": "nosniff"
    }
  });
}
function safeName(name) {
  return String(name || "study-file").normalize("NFKC")
    .replace(/[\\/]/g, "-")
    .replace(/[^\p{L}\p{N}._ ()-]/gu, "_")
    .replace(/\s+/g, " ").trim().slice(0, 120) || "study-file";
}
function extension(name) { return (String(name).split(".").pop() || "").toLowerCase(); }
function cleanText(value, max = 80) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}
function emailLooksValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
function randomHex(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
function decodeUtf8Base64(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a, b) {
  a = String(a || "");
  b = String(b || "");
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
async function rateLimit(env, key, limit, ttlSeconds, increment = 1) {
  const current = Number(await env.UPLOAD_RATE_LIMIT.get(key) || 0);
  if (current + increment > limit) return false;
  await env.UPLOAD_RATE_LIMIT.put(key, String(current + increment), {expirationTtl: ttlSeconds});
  return true;
}
function ipOf(request) { return request.headers.get("CF-Connecting-IP") || "unknown"; }
async function verifyTurnstile(token, ip, secret) {
  if (!token || !secret) return false;
  const body = new URLSearchParams({secret, response:token});
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {method:"POST",body}).then(r => r.json());
    return result.success === true && result.hostname === "squashberry.github.io";
  } catch { return false; }
}
async function requestJson(request) {
  try { return await request.json(); }
  catch { throw new Error("The request was not valid JSON."); }
}
async function githubRequest(path, token, init = {}) {
  const result = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + path, {
    ...init,
    headers: {
      "accept":"application/vnd.github+json",
      "authorization":"Bearer " + token,
      "x-github-api-version":"2022-11-28",
      ...(init.headers || {})
    }
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) {
    const error = new Error("Repository service returned " + result.status + (body.message ? ": " + body.message : ""));
    error.status = result.status;
    throw error;
  }
  return body;
}
async function readCatalogue(token) {
  const file = await githubRequest("/contents/library-index.json?ref=" + BRANCH, token);
  const catalogue = JSON.parse(decodeUtf8Base64(file.content));
  if (!Array.isArray(catalogue.items)) throw new Error("The numbered file catalogue is invalid.");
  return {file,catalogue};
}
async function allocateFileId(env, token) {
  const {catalogue} = await readCatalogue(token);
  const maxId = Math.max(0, ...catalogue.items.map(item => Number.parseInt(item.id,10) || 0));
  await env.DB.prepare("INSERT INTO id_counters (name, next_id) VALUES ('study-files', ?) ON CONFLICT(name) DO UPDATE SET next_id = MAX(id_counters.next_id, excluded.next_id)")
    .bind(maxId + 1).run();
  const row = await env.DB.prepare("UPDATE id_counters SET next_id = next_id + 1 WHERE name = 'study-files' RETURNING next_id - 1 AS allocated_id").first();
  if (!row) throw new Error("Could not reserve a unique file number.");
  return String(row.allocated_id).padStart(3, "0");
}
async function registerCatalogueEntry(entry, token) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const {file,catalogue} = await readCatalogue(token);
    const sameId = catalogue.items.find(item => String(item.id).padStart(3,"0") === entry.id);
    if (sameId) {
      if (sameId.path === entry.path && sameId.kind === "study-material") return;
      throw new Error("The reserved file number is already in use. The file was uploaded but its catalogue entry needs owner review.");
    }
    catalogue.items.push(entry);
    catalogue.items.sort((a,b) => Number(a.id) - Number(b.id));
    try {
      await githubRequest("/contents/library-index.json", token, {
        method:"PUT",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          message:"Register study file " + entry.id + " - " + entry.name,
          content:bytesToBase64(new TextEncoder().encode(JSON.stringify(catalogue,null,2)+"\n")),
          sha:file.sha,
          branch:BRANCH
        })
      });
      return;
    } catch (error) {
      if (error && (error.status === 409 || error.status === 422) && attempt < 5) continue;
      throw error;
    }
  }
  throw new Error("Could not save the file catalogue after several attempts. Please retry.");
}
async function getSessionUser(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !env.DB) return null;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now()/1000);
  return env.DB.prepare(
    "SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at, s.expires_at " +
    "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
  ).bind(tokenHash, now).first();
}

function emailEscape(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function libraryEmailLayout(preheader, title, intro, inner) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Squashberry Library</title><style>@media(max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:28px!important}.email-cta{display:block!important;width:auto!important;margin:0 0 10px!important}}</style></head><body style="margin:0;padding:0;background:#f1ece6;font-family:Arial,Helvetica,sans-serif;color:#30261e"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">'+emailEscape(preheader)+'</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1ece6;padding:28px 10px"><tr><td align="center"><table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#fffdf9;border-radius:22px;overflow:hidden;border:1px solid #e7ddd1"><tr><td class="email-pad" style="padding:28px 34px;background:#181a20;color:#fffaf4"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="48" valign="middle"><div style="width:42px;height:42px;border-radius:14px;background:#f1b572;color:#21170d;font-size:24px;line-height:42px;text-align:center;font-weight:bold">S</div></td><td style="padding-left:12px"><div style="font-size:15px;letter-spacing:1.3px;font-weight:bold;color:#fffaf4">SQUASHBERRY LIBRARY</div><div style="font-size:10px;letter-spacing:2px;color:#b8a99b;margin-top:5px;text-transform:uppercase">Study · Learn · Grow</div></td></tr></table></td></tr><tr><td class="email-pad" style="padding:34px 34px 12px"><div style="font-size:11px;letter-spacing:2px;font-weight:bold;text-transform:uppercase;color:#946744;margin-bottom:12px">YOUR STUDY SPACE</div><h1 class="email-title" style="font-size:34px;line-height:1.12;letter-spacing:-1px;margin:0 0 16px;color:#30261e;font-weight:750">'+title+'</h1><p style="font-size:15px;line-height:1.8;color:#73675d;margin:0">'+intro+'</p></td></tr><tr><td class="email-pad" style="padding:18px 34px 16px">'+inner+'</td></tr><tr><td class="email-pad" style="padding:8px 34px 32px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 8px 8px 0"><a class="email-cta" href="https://squashberry.github.io/Read/" style="display:inline-block;background:#82583e;border-radius:12px;padding:14px 18px;color:#fffaf4;text-decoration:none;font-size:13px;font-weight:bold">Open Library ↗</a></td><td style="padding:0 0 8px"><a class="email-cta" href="https://squashberry.github.io/Read/gptinstruction/index.html" style="display:inline-block;background:#f3e8dc;border:1px solid #e6d6c5;border-radius:12px;padding:13px 16px;color:#65472f;text-decoration:none;font-size:13px;font-weight:bold">Learn how to use Library ↗</a></td></tr></table></td></tr><tr><td class="email-pad" style="padding:22px 34px;background:#f7f1ea;border-top:1px solid #e9dfd4"><p style="font-size:12px;line-height:1.7;color:#74685e;margin:0 0 8px">A little progress still counts. Pick one topic, open one note, and begin where you are.</p><p style="font-size:11px;line-height:1.7;color:#887b70;margin:0">Privacy note: study files uploaded to the public Library repository can be seen and downloaded by anyone. Only upload material you are allowed to share.</p><p style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9b8c7e;margin:18px 0 0">Made by Squashberry</p></td></tr></table></td></tr></table></body></html>';
}
function signInCodeEmailHtml(code) {
  const inner = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f0e6;border:1px solid #ecdfd0;border-radius:16px"><tr><td align="center" style="padding:22px 16px"><div style="font-size:10px;letter-spacing:2px;color:#8a6a50;font-weight:bold;text-transform:uppercase">ONE-TIME SIGN-IN CODE</div><div style="font-family:Arial,sans-serif;font-size:38px;font-weight:bold;letter-spacing:9px;color:#31241b;padding:12px 0 4px">'+emailEscape(code)+'</div><div style="font-size:12px;color:#786a5d">Expires in 10 minutes · can only be used once</div></td></tr></table><p style="font-size:12px;line-height:1.7;color:#7b6e62;margin:16px 0 0">If you did not request this code, you can safely ignore this email.</p>';
  return libraryEmailLayout("Your one-time code to sign in to Squashberry Library.", "Your sign-in code", "Enter this code on the sign-in screen to open your personal Library dashboard.", inner);
}
function welcomeEmailHtml(displayName) {
  const inner = '<div style="background:#f8f0e6;border:1px solid #ecdfd0;border-radius:16px;padding:20px 22px"><p style="font-size:13px;line-height:1.8;color:#594737;margin:0 0 12px">Here are three easy ways to get started:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" valign="top" style="font-size:16px;color:#9b7049;padding:3px 0">01</td><td style="font-size:13px;line-height:1.7;color:#594737;padding:0 0 10px"><strong>Find your notes</strong><br>Search by topic, filename, or document code on the Library tab.</td></tr><tr><td width="28" valign="top" style="font-size:16px;color:#9b7049;padding:3px 0">02</td><td style="font-size:13px;line-height:1.7;color:#594737;padding:0 0 10px"><strong>Study with ChatGPT</strong><br>Choose a file and use the study prompt to learn, revise, or practise questions.</td></tr><tr><td width="28" valign="top" style="font-size:16px;color:#9b7049;padding:3px 0">03</td><td style="font-size:13px;line-height:1.7;color:#594737"><strong>Set a small daily goal</strong><br>In the You tab, sign in and enable daily browser reminders if you want a gentle nudge.</td></tr></table></div><p style="font-size:12px;line-height:1.7;color:#7b6e62;margin:17px 0 0">No need to do everything at once. Start with one subject and build from there.</p>';
  return libraryEmailLayout("Welcome to Squashberry Library. Your study space is ready.", "Welcome, "+emailEscape(displayName)+"!", "Your Squashberry Library account is ready. This is your calm little space to keep study materials together and take the next step in your learning.", inner);
}
async function sendLibraryEmail(email, subject, text, html, env) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Email delivery is not configured.");
  const result = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json"},
    body:JSON.stringify({from:env.EMAIL_FROM,to:[email],subject,text,html})
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error("Email delivery failed. " + cleanText(body.message,180));
}
async function sendWelcomeEmail(email, displayName, env) {
  const name = cleanText(displayName,50) || "there";
  await sendLibraryEmail(
    email,
    "Welcome to Squashberry Library — your study space is ready",
    "Welcome, "+name+"! Your Squashberry Library account is ready. Open Library: https://squashberry.github.io/Read/ . Learn how to use Library: https://squashberry.github.io/Read/gptinstruction/index.html . Study files in the public Library repository may be viewed by anyone; only upload material you are allowed to share.",
    welcomeEmailHtml(name),
    env
  );
}

function publicUser(user) {
  return {id:user.id,email:user.email,displayName:user.display_name,createdAt:user.created_at,updatedAt:user.updated_at,sessionExpiresAt:user.expires_at};
}
async function sendLoginCode(email, code, env) {
  await sendLibraryEmail(email,"Your Squashberry Library sign-in code","Your one-time sign-in code is "+code+". It expires in 10 minutes. If you did not request it, ignore this email.",signInCodeEmailHtml(code),env);
}
async function handleRequestCode(request, env) {
  if (!env.DB || !env.UPLOAD_RATE_LIMIT || !env.AUTH_CODE_SECRET) return response({error:"Personal Library sign-in is not configured yet."},503);
  const body = await requestJson(request);
  const email = cleanText(body.email,254).toLowerCase();
  const displayName = cleanText(body.displayName,50);
  if (!emailLooksValid(email)) return response({error:"Enter a valid email address."},400);
  if (!await verifyTurnstile(body.captcha, ipOf(request), env.TURNSTILE_SECRET_KEY)) {
    return response({error:"Please complete the human-check box, then try again."},400);
  }
  const emailKey = "login-email:" + await sha256Hex(email);
  const ipKey = "login-ip:" + await sha256Hex(ipOf(request));
  if (!await rateLimit(env,emailKey,3,900)) return response({error:"Too many codes requested for this email. Please wait 15 minutes."},429);
  if (!await rateLimit(env,ipKey,12,3600)) return response({error:"Too many sign-in attempts from this connection. Try again later."},429);
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6,"0");
  const now = Math.floor(Date.now()/1000);
  const codeHash = await hmacHex(env.AUTH_CODE_SECRET,email+"|"+code);
  await env.DB.prepare("UPDATE login_codes SET used_at = ? WHERE email = ? AND used_at IS NULL").bind(now,email).run();
  await env.DB.prepare(
    "INSERT INTO login_codes (id,email,code_hash,desired_name,expires_at,attempts,created_at,used_at) VALUES (?,?,?,?,?,0,?,NULL)"
  ).bind(crypto.randomUUID(),email,codeHash,displayName,now+LOGIN_CODE_TTL_SECONDS,now).run();
  try {
    await sendLoginCode(email,code,env);
  } catch (error) {
    await env.DB.prepare("UPDATE login_codes SET used_at = ? WHERE email = ? AND used_at IS NULL").bind(now,email).run();
    return response({error:cleanText(error.message,240) || "Could not send the email. Please try again later."},502);
  }
  return response({ok:true,message:"A six-digit sign-in code is on its way. Check your inbox and spam folder.",expiresIn:LOGIN_CODE_TTL_SECONDS});
}
async function handleVerifyCode(request, env) {
  if (!env.DB || !env.UPLOAD_RATE_LIMIT || !env.AUTH_CODE_SECRET) return response({error:"Personal Library sign-in is not configured yet."},503);
  const body = await requestJson(request);
  const email = cleanText(body.email,254).toLowerCase();
  const code = cleanText(body.code,10);
  if (!emailLooksValid(email) || !/^\d{6}$/.test(code)) return response({error:"Enter the same email address and the six-digit code."},400);
  const ipKey = "verify-ip:" + await sha256Hex(ipOf(request));
  if (!await rateLimit(env,ipKey,20,3600)) return response({error:"Too many attempts. Please try again later."},429);
  const now = Math.floor(Date.now()/1000);
  const row = await env.DB.prepare("SELECT id, code_hash, desired_name, expires_at, attempts FROM login_codes WHERE email = ? AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1").bind(email,now).first();
  if (!row || row.attempts >= 5) return response({error:"That code has expired or is no longer available. Request a new code."},400);
  const receivedHash = await hmacHex(env.AUTH_CODE_SECRET,email+"|"+code);
  if (!timingSafeEqual(receivedHash,row.code_hash)) {
    await env.DB.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ? AND used_at IS NULL").bind(row.id).run();
    return response({error:"That code does not match. Check the email and try again."},400);
  }
  const used = await env.DB.prepare("UPDATE login_codes SET used_at = ? WHERE id = ? AND used_at IS NULL AND attempts < 5 AND expires_at > ?").bind(now,row.id,now).run();
  if (!used.meta || used.meta.changes !== 1) return response({error:"That code was already used or has expired. Request a new one."},400);
  const existing = await env.DB.prepare("SELECT id,email,display_name,created_at,updated_at FROM users WHERE email = ?").bind(email).first();
  let user = existing;
  if (!user) {
    const name = row.desired_name || cleanText(email.split("@")[0],50) || "Student";
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO users (id,email,display_name,created_at,updated_at) VALUES (?,?,?,?,?)").bind(id,email,name,now,now).run();
    user = await env.DB.prepare("SELECT id,email,display_name,created_at,updated_at FROM users WHERE id = ?").bind(id).first();
    await env.DB.prepare("INSERT INTO activity (id,user_id,kind,detail,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),id,"welcome","Joined Squashberry Library",now).run();
    try { await sendWelcomeEmail(email,name,env); }
    catch (error) { console.warn("Library welcome email could not be sent:",cleanText(error && error.message,160)); }
  }
  const sessionToken = randomHex(32);
  const tokenHash = await sha256Hex(sessionToken);
  const expiresAt = now + SESSION_TTL_SECONDS;
  await env.DB.prepare("INSERT INTO sessions (id,user_id,token_hash,created_at,expires_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),user.id,tokenHash,now,expiresAt).run();
  return response({ok:true,token:sessionToken,expiresAt,user:publicUser({...user,expires_at:expiresAt})});
}
async function handleMe(request, env) {
  const user = await getSessionUser(request,env);
  if (!user) return response({error:"Please sign in to your personal Library again."},401);
  if (request.method === "GET") return response({ok:true,user:publicUser(user)});
  if (request.method === "PATCH") {
    const body = await requestJson(request);
    const name = cleanText(body.displayName,50);
    if (name.length < 2) return response({error:"Your display name must be at least two characters."},400);
    const now = Math.floor(Date.now()/1000);
    await env.DB.prepare("UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?").bind(name,now,user.id).run();
    const changed = await env.DB.prepare("SELECT id,email,display_name,created_at,updated_at,? AS expires_at FROM users WHERE id = ?").bind(user.expires_at,user.id).first();
    return response({ok:true,user:publicUser(changed)});
  }
  return response({error:"Method not allowed."},405);
}
async function handleDashboard(request, env) {
  const user = await getSessionUser(request,env);
  if (!user) return response({error:"Please sign in to your personal Library again."},401);
  const summary = await env.DB.prepare("SELECT COUNT(*) AS file_count, COALESCE(SUM(file_size),0) AS total_bytes FROM uploads WHERE user_id = ?").bind(user.id).first();
  const uploads = await env.DB.prepare("SELECT file_id,file_name,file_path,file_size,created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 12").bind(user.id).all();
  const activity = await env.DB.prepare("SELECT kind,detail,created_at FROM activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 8").bind(user.id).all();
  return response({
    ok:true,
    stats:{fileCount:Number(summary.file_count||0),totalBytes:Number(summary.total_bytes||0)},
    uploads:(uploads.results||[]).map(row=>({id:String(row.file_id).padStart(3,"0"),name:row.file_name,path:row.file_path,size:Number(row.file_size||0),createdAt:row.created_at})),
    activity:(activity.results||[]).map(row=>({kind:row.kind,detail:row.detail,createdAt:row.created_at}))
  });
}
async function handleActivity(request, env) {
  const user = await getSessionUser(request,env);
  if (!user) return response({error:"Please sign in again."},401);
  const body = await requestJson(request);
  const allowed = new Set(["opened-file","started-study","viewed-library","copied-prompt"]);
  const kind = cleanText(body.kind,32);
  const detail = cleanText(body.detail,180);
  if (!allowed.has(kind)) return response({error:"That activity type is not supported."},400);
  const now = Math.floor(Date.now()/1000);
  await env.DB.prepare("INSERT INTO activity (id,user_id,kind,detail,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),user.id,kind,detail||kind,now).run();
  return response({ok:true});
}
async function handleLogout(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  return response({ok:true});
}
async function handleUpload(request, env) {
  const user = await getSessionUser(request,env);
  if (!user) return response({error:"Sign in to your personal Library before uploading files."},401);
  if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET_KEY || !env.UPLOAD_RATE_LIMIT || !env.DB) {
    return response({error:"The secure upload service is not fully configured yet."},503);
  }
  const ip = ipOf(request);
  let form;
  try { form = await request.formData(); }
  catch { return response({error:"The upload form could not be read. Please try again."},400); }
  if (!await verifyTurnstile(form.get("cf-turnstile-response"),ip,env.TURNSTILE_SECRET_KEY)) {
    return response({error:"Please complete the human-check box, then try again."},400);
  }
  const uploads = form.getAll("files").filter(item => item && typeof item.arrayBuffer === "function");
  if (!uploads.length || uploads.length > MAX_FILES_PER_REQUEST) {
    return response({error:"Choose between one and "+MAX_FILES_PER_REQUEST+" study files at a time."},400);
  }
  for (const file of uploads) {
    if (!ALLOWED_EXTENSIONS.has(extension(file.name))) return response({error:"Unsupported file type: "+safeName(file.name)},400);
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) return response({error:"Each file must be smaller than 8 MB: "+safeName(file.name)},413);
  }
  const today = new Date().toISOString().slice(0,10);
  const ipKey = "upload-ip:"+await sha256Hex(ip)+":"+today;
  const userKey = "upload-user:"+user.id+":"+today;
  if (!await rateLimit(env,ipKey,DAILY_IP_FILE_LIMIT,86400,uploads.length)) {
    return response({error:"This connection has reached its daily upload limit. Please try again tomorrow."},429);
  }
  if (!await rateLimit(env,userKey,DAILY_USER_FILE_LIMIT,86400,uploads.length)) {
    return response({error:"Your personal Library has reached today's upload limit. Try again tomorrow."},429);
  }
  const uploaded = [];
  try {
    for (const file of uploads) {
      const filename = safeName(file.name);
      const id = await allocateFileId(env,env.GITHUB_TOKEN);
      const path = id+" - "+filename;
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const bytes = new Uint8Array(await file.arrayBuffer());
      await githubRequest("/contents/"+encodedPath,env.GITHUB_TOKEN,{
        method:"PUT",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({message:"Upload study material "+id+" - "+filename,content:bytesToBase64(bytes),branch:BRANCH})
      });
      const entry = {id,name:filename,path,size:file.size,kind:"study-material",uploadedAt:new Date().toISOString()};
      await registerCatalogueEntry(entry,env.GITHUB_TOKEN);
      const now = Math.floor(Date.now()/1000);
      await env.DB.prepare("INSERT INTO uploads (id,user_id,file_id,file_name,file_path,file_size,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),user.id,id,filename,path,file.size,now).run();
      await env.DB.prepare("INSERT INTO activity (id,user_id,kind,detail,created_at) VALUES (?,?,?,?,?)")
        .bind(crypto.randomUUID(),user.id,"uploaded-file","Uploaded "+filename+" (file "+id+")",now).run();
      uploaded.push({id,name:filename,path,size:file.size,download_url:"https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/"+encodedPath});
    }
    return response({ok:true,files:uploaded});
  } catch (error) {
    return response({error:"The upload could not be completed: "+cleanText(error && error.message,220)},502);
  }
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return response({error:"This website is not allowed to use the personal Library service."},403);
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{
      "access-control-allow-origin":ALLOWED_ORIGIN,
      "access-control-allow-methods":"GET, POST, PATCH, OPTIONS",
      "access-control-allow-headers":"authorization, content-type",
      "access-control-max-age":"86400",
      "vary":"Origin"
    }});
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/,"") || "/";
    try {
      if (path === "/health" && request.method === "GET") {
        const configured = Boolean(env.DB && env.UPLOAD_RATE_LIMIT && env.AUTH_CODE_SECRET && env.RESEND_API_KEY && env.EMAIL_FROM && env.GITHUB_TOKEN && env.TURNSTILE_SECRET_KEY);
        return response({ok:true,service:"squashberry-library-api",configured});
      }
      if (path === "/auth/request-code" && request.method === "POST") return await handleRequestCode(request,env);
      if (path === "/auth/verify-code" && request.method === "POST") return await handleVerifyCode(request,env);
      if (path === "/auth/me" && (request.method === "GET" || request.method === "PATCH")) return await handleMe(request,env);
      if (path === "/auth/dashboard" && request.method === "GET") return await handleDashboard(request,env);
      if (path === "/auth/activity" && request.method === "POST") return await handleActivity(request,env);
      if (path === "/auth/logout" && request.method === "POST") return await handleLogout(request,env);
      if (path === "/upload" && request.method === "POST") return await handleUpload(request,env);
      return response({error:"This Library API route was not found."},404);
    } catch (error) {
      return response({error:"The request could not be completed: "+cleanText(error && error.message,200)},500);
    }
  }
};
