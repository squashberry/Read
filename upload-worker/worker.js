const OWNER = "squashberry";
const REPO = "Read";
const BRANCH = "master";
const ALLOWED_ORIGIN = "https://squashberry.github.io";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 4;
const DAILY_FILE_LIMIT = 10;
const ALLOWED_EXTENSIONS = new Set(["pdf","ppt","pptx","doc","docx","txt","md","rtf"]);

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "Origin"
    }
  });
}
function safeName(name) {
  return String(name || "study-file").normalize("NFKC").replace(/[\\/]/g, "-").replace(/[^\p{L}\p{N}._ ()-]/gu, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "study-file";
}
function extension(name) { return (String(name).split(".").pop() || "").toLowerCase(); }
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
async function gh(path, token, init = {}) {
  const response = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + path, {
    ...init,
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": "Bearer " + token,
      "x-github-api-version": "2022-11-28",
      ...(init.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Storage service returned " + response.status + (body.message ? ": " + body.message : ""));
    error.status = response.status;
    throw error;
  }
  return body;
}
async function readCatalogue(token) {
  const registry = await gh("/contents/library-index.json?ref=" + BRANCH, token);
  const catalogue = JSON.parse(decodeUtf8Base64(registry.content));
  if (!Array.isArray(catalogue.items)) throw new Error("The numbered file catalogue is invalid.");
  return {registry,catalogue};
}
async function saveCatalogue(catalogue, token, sha, message) {
  return gh("/contents/library-index.json", token, {
    method:"PUT",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({
      message,
      content:bytesToBase64(new TextEncoder().encode(JSON.stringify(catalogue,null,2)+"\n")),
      sha,
      branch:BRANCH
    })
  });
}
async function reserveEntry(filename, size, token) {
  for (let attempt=0; attempt<5; attempt++) {
    const {registry,catalogue} = await readCatalogue(token);
    const next = Math.max(0, ...catalogue.items.map(item => Number.parseInt(item.id,10) || 0)) + 1;
    const id = String(next).padStart(3,"0");
    const entry = {id,name:filename,path:id+" - "+filename,size,kind:"upload-pending",uploadedAt:new Date().toISOString()};
    catalogue.items.push(entry);
    catalogue.items.sort((a,b) => Number(a.id)-Number(b.id));
    try {
      const result = await saveCatalogue(catalogue,token,registry.sha,"Reserve study file ID "+id);
      return {entry,sha:result.content.sha};
    } catch (error) {
      if (error && (error.status===409 || error.status===422) && attempt<4) continue;
      throw error;
    }
  }
  throw new Error("The file number could not be reserved. Please try again.");
}
async function publishEntry(id, token) {
  for (let attempt=0; attempt<5; attempt++) {
    const {registry,catalogue} = await readCatalogue(token);
    const entry = catalogue.items.find(item => String(item.id).padStart(3,"0") === String(id).padStart(3,"0"));
    if (!entry) throw new Error("The reserved file number is missing from the catalogue.");
    if (entry.kind === "study-material") return;
    entry.kind = "study-material";
    try {
      await saveCatalogue(catalogue,token,registry.sha,"Publish study file "+id);
      return;
    } catch (error) {
      if (error && (error.status===409 || error.status===422) && attempt<4) continue;
      throw error;
    }
  }
  throw new Error("The uploaded file could not be published in the catalogue. Please retry or contact the Library owner.");
}
async function verifyTurnstile(token, ip, secret) {
  const body = new URLSearchParams({secret, response: token});
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {method:"POST", body});
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === "squashberry.github.io";
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return json({error:"This upload page is not allowed to use the service."}, 403, ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, {status:204, headers:{
      "access-control-allow-origin": ALLOWED_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      "vary":"Origin"
    }});
    if (request.method !== "POST") return json({error:"Use POST to upload study files."}, 405);
    if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET_KEY || !env.UPLOAD_RATE_LIMIT) {
      return json({error:"The upload service is not fully configured yet."}, 503);
    }
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const today = new Date().toISOString().slice(0,10);
    const rateKey = "upload:" + ip + ":" + today;
    const used = Number(await env.UPLOAD_RATE_LIMIT.get(rateKey) || 0);
    if (used >= DAILY_FILE_LIMIT) return json({error:"This connection has reached today’s upload limit. Try again tomorrow."}, 429);
    let form;
    try { form = await request.formData(); }
    catch { return json({error:"The upload form was not readable."}, 400); }
    const captcha = form.get("cf-turnstile-response");
    if (typeof captcha !== "string" || !(await verifyTurnstile(captcha, ip, env.TURNSTILE_SECRET_KEY))) {
      return json({error:"Please complete the human check and try again."}, 400);
    }
    const uploads = form.getAll("files").filter(item => item && typeof item.arrayBuffer === "function");
    if (!uploads.length || uploads.length > MAX_FILES_PER_REQUEST) return json({error:"Choose between 1 and " + MAX_FILES_PER_REQUEST + " files per upload."}, 400);
    for (const file of uploads) {
      if (!ALLOWED_EXTENSIONS.has(extension(file.name))) return json({error:"Unsupported file type: " + safeName(file.name)}, 400);
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) return json({error:"Each file must be smaller than 8 MB: " + safeName(file.name)}, 413);
    }
    const uploaded = [];
    try {
      // Count attempts before writing so failed requests cannot bypass the daily limit.
      await env.UPLOAD_RATE_LIMIT.put(rateKey, String(used + uploads.length), {expirationTtl: 86400});
      for (const file of uploads) {
        const filename = safeName(file.name);
        const {entry} = await reserveEntry(filename,file.size,env.GITHUB_TOKEN);
        const id = entry.id;
        const encodedPath = entry.path.split("/").map(encodeURIComponent).join("/");
        const bytes = new Uint8Array(await file.arrayBuffer());
        await gh("/contents/" + encodedPath, env.GITHUB_TOKEN, {
          method:"PUT",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({message:"Upload study material " + id + " - " + filename,content:bytesToBase64(bytes),branch:BRANCH})
        });
        await publishEntry(id,env.GITHUB_TOKEN);
        uploaded.push({id,name:filename,path:entry.path,size:file.size,download_url:"https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/"+encodedPath});
      }
      return json({ok:true,files:uploaded});
    } catch (error) {
      return json({error:"The upload could not be completed: " + String(error && error.message || error)}, 502);
    }
  }
};
