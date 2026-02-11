/**
 * StealthCloak Industrial Engine - v6.0 "TITAN" (FULL-DUPLEX)
 * Features: Formula Bypass Presets, Backend Auth, D1/KV Sync, Deep Traffic Analysis
 */

const ADMIN_API_PREFIX = '/api/v1/admin';
const AUTH_API_PREFIX = '/api/v1/auth';
const AUTH_TOKEN_SECRET = "industrial_stealth_token";

// INDUSTRIAL BLACKLIST (ASNs) - Core Audit & Security Firms
const CORE_BLOCKED_ASNS = [
  15169, 16509, 8075, 14061, 20473, 13335, 15133, 
  396982, 32934, 14618, 32934, 13238, 16509, 
  54113, 398324, 13335, 20940
];

// Formula-specific ASN supplements
const FORMULA_ASNS = {
    'google_ads': [15169, 396982, 19527], // Google, Google Cloud
    'fb_ads': [32934, 63293, 54113],      // Facebook, Fastly (often used by FB)
    'tiktok_ads': [138699, 16509],        // ByteDance, Amazon (often used by TT)
    'standard': []
};

// KNOWN TOR & VPN SUBNETS (Simulated)
const TOR_SUBNETS = ['104.244.72.', '185.220.101.', '23.129.64.']; 

const BOT_PATTERNS = [
  'headless', 'selenium', 'puppeteer', 'playwright', 'curl', 'wget', 
  'python', 'bot', 'crawler', 'spider', 'facebookexternalhit', 
  'googlebot', 'bingbot', 'tiktokbot', 'twitterbot', 'ahrefs', 'mj12bot',
  'semrush', 'dotbot', 'petalbot', 'bytespider', 'adreview', 'mediapartners'
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;

    // --- 0. PREFLIGHT CHECKS ---
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // --- 1. AUTHENTICATION & LOGIN ---
    if (url.pathname.startsWith(AUTH_API_PREFIX)) {
        if (url.pathname.endsWith('/login') && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                // In production, use env.ADMIN_USER / env.ADMIN_PASS
                if (username === 'admin' && password === 'root') {
                    return new Response(JSON.stringify({ 
                        success: true, 
                        token: AUTH_TOKEN_SECRET,
                        msg: "Session Established"
                    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401, headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ error: "Bad Request" }), { status: 400, headers: corsHeaders });
            }
        }
    }

    // --- 2. ADMIN API HANDLER ---
    if (url.pathname.startsWith(ADMIN_API_PREFIX)) {
       const auth = request.headers.get('Authorization') || url.searchParams.get('token');
       if (!auth || !auth.includes(AUTH_TOKEN_SECRET)) {
         return new Response(JSON.stringify({ error: "Access Denied" }), { 
           status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
         });
       }

       // Health Check
       if (url.pathname.endsWith('/status')) {
         return new Response(JSON.stringify({ 
           status: "ONLINE", 
           bindings: { kv: !!env.CONFIG, d1: !!env.DB },
           engine: "v6.0-TITAN",
           timestamp: Date.now()
         }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }

       // --- DOMAIN MANAGEMENT ---
       if (url.pathname.endsWith('/domains') && request.method === "GET") {
          try {
             const list = await env.CONFIG.list({ prefix: "domain:" });
             const domains = [];
             await Promise.all(list.keys.map(async (key) => {
                 const val = await env.CONFIG.get(key.name);
                 if (val) domains.push(JSON.parse(val));
             }));
             return new Response(JSON.stringify(domains), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } catch(e) {
             return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
          }
       }

       if (url.pathname.endsWith('/config') && request.method === "POST") {
         try {
           const body = await request.json();
           if (!body.domainName) return new Response(JSON.stringify({ error: "Missing domainName" }), { status: 400, headers: corsHeaders });
           await env.CONFIG.put(`domain:${body.domainName}`, JSON.stringify(body));
           return new Response(JSON.stringify({ success: true, id: body.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
         } catch (e) {
           return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
         }
       }

       // --- SAFE SITE MANAGEMENT ---
       if (url.pathname.endsWith('/safesites') && request.method === "GET") {
          const list = await env.CONFIG.list({ prefix: "safesite:" });
          const sites = [];
          await Promise.all(list.keys.map(async (key) => {
              const val = await env.CONFIG.get(key.name);
              if (val) sites.push(JSON.parse(val));
          }));
          return new Response(JSON.stringify(sites), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }

       if (url.pathname.endsWith('/safesites') && request.method === "POST") {
          const body = await request.json();
          await env.CONFIG.put(`safesite:${body.url}`, JSON.stringify(body));
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }

       // --- STREAMING ANALYTICS ---
       if (url.pathname.endsWith('/stream')) {
         const { readable, writable } = new TransformStream();
         const writer = writable.getWriter();
         const encoder = new TextEncoder();
         ctx.waitUntil((async () => {
           await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'init' })}\n\n`));
           const startTime = Date.now();
           while (Date.now() - startTime < 50000) {
             if (request.signal.aborted) break;
             try {
               const stats = await env.DB.prepare("SELECT action_taken, COUNT(*) as count FROM traffic_logs GROUP BY action_taken").all();
               const logs = await env.DB.prepare("SELECT * FROM traffic_logs ORDER BY timestamp DESC LIMIT 15").all();
               await writer.write(encoder.encode(`data: ${JSON.stringify({ stats: stats.results, logs: logs.results })}\n\n`));
             } catch (e) {}
             await new Promise(r => setTimeout(r, 2000));
           }
           await writer.close();
         })());
         return new Response(readable, {
           headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", ...corsHeaders }
         });
       }
       return new Response("Endpoint Not Found", { status: 404, headers: corsHeaders });
    }

    // --- 3. TRAFFIC FILTERING (THE CLOAK) ---
    // Direct Access Check
    if (host.includes('.workers.dev') || url.pathname === '/admin_status') {
      return new Response("Stealth Engine v6.0-TITAN Online. Configure via Dashboard.", { status: 200 });
    }
    
    // 3.1 Fetch Config
    let configRaw = await env.CONFIG.get(`domain:${host}`);
    if (!configRaw) {
        const parts = host.split('.');
        if (parts.length > 2) {
            const rootDomain = parts.slice(parts.length - 2).join('.');
            configRaw = await env.CONFIG.get(`domain:${rootDomain}`);
        }
    }

    if (!configRaw) return new Response("Host Not Configured", { status: 404 });
    const config = JSON.parse(configRaw);

    // 3.2 Detection Metrics
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const country = request.cf?.country || "XX";
    const asn = request.cf?.asn || 0;
    const botScore = request.cf?.botScore || 100;
    const referer = request.headers.get("Referer") || "";
    
    // 3.3 Apply Formula Bypass Logic
    const activeFormula = config.formula || 'standard';
    const formulaAsns = FORMULA_ASNS[activeFormula] || [];
    const fullBlockList = [...CORE_BLOCKED_ASNS, ...formulaAsns];

    let isBot = false;
    let detectionReason = "CLEAN";
    let trustScore = 100; // Start high, deduct points

    // --- TITAN DETECTION MATRIX ---

    // A. ASN & Network Check
    if (fullBlockList.includes(asn)) { trustScore -= 100; detectionReason = `ASN_BAN:${asn}`; }
    if (TOR_SUBNETS.some(sub => ip.startsWith(sub))) { trustScore -= 100; detectionReason = "TOR_EXIT"; }
    
    // B. Honey Token & Pattern
    if (config.isHoneyToken && request.url.includes('admin_')) {
        trustScore -= 100;
        detectionReason = "HONEY_POT";
        ctx.waitUntil(env.CONFIG.put(`ban:${ip}`, "true", { expirationTtl: 86400 }));
    }
    if (BOT_PATTERNS.some(p => ua.toLowerCase().includes(p))) { trustScore -= 80; detectionReason = "UA_SIG"; }

    // C. Header Hygiene (Crucial for Ad Formulas)
    // Real browsers usually send Sec-Fetch-Dest. Scripts often don't.
    const secDest = request.headers.get("Sec-Fetch-Dest");
    if (!secDest && activeFormula !== 'standard') { trustScore -= 30; detectionReason = "MISSING_SEC_HEADERS"; }
    
    // D. Formula Specifics
    if (activeFormula === 'google_ads' || activeFormula === 'fb_ads') {
        // High strictness on Linux Desktop (often reviewers/headless)
        if (ua.includes('Linux') && !ua.includes('Android')) { trustScore -= 50; detectionReason = "LINUX_DESKTOP_SUSPECT"; }
    }

    // E. User Settings Overrides
    if (config.isGhostReferrerEnabled && config.ghostReferrer) {
        if (!referer.includes(config.ghostReferrer)) { trustScore -= 100; detectionReason = "BAD_REFERRER"; }
    }
    
    if (config.allowedCountries && config.allowedCountries.length > 0) {
        const allowed = config.allowedCountries.split(',').map(c => c.trim().toUpperCase());
        if (!allowed.includes(country)) { trustScore -= 100; detectionReason = `GEO_BLOCK:${country}`; }
    }

    if (botScore < (config.botThreshold || 30)) { trustScore -= 60; detectionReason = `CF_SCORE:${botScore}`; }

    // F. Final Verdict
    isBot = trustScore < 50;
    const actionTaken = isBot ? "MASKED_PROXY" : "HUMAN_REDIRECT";

    // 3.4 Logging
    ctx.waitUntil((async () => {
        try {
          await env.DB.prepare(
            "INSERT INTO traffic_logs (timestamp, ip_address, asn, bot_score, action_taken, subdomain, detection_reason, tls_cipher) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(Date.now(), ip, asn, botScore, actionTaken, host, detectionReason, request.cf?.tlsCipher || "UNK").run();
        } catch (err) {}
    })());

    // 3.5 Execution
    if (isBot) {
       // --- SAFE SITE PROXY ---
       try {
         const safeTarget = config.safeUrl; 
         const proxyReq = new Request(safeTarget, request);
         proxyReq.headers.set('Host', new URL(safeTarget).hostname);
         proxyReq.headers.delete('CF-Connecting-IP');
         proxyReq.headers.delete('Cookie'); 
         
         const safeRes = await fetch(proxyReq);
         const newHeaders = new Headers(safeRes.headers);
         newHeaders.delete('Set-Cookie');
         // Prevent indexing of the cloak
         newHeaders.set('X-Robots-Tag', 'noindex, nofollow');
         
         return new Response(safeRes.body, { status: safeRes.status, headers: newHeaders });
       } catch (e) {
         return new Response("Service Unavailable", { status: 503 });
       }
    }

    // --- HUMAN HANDLING ---
    if (config.isDeepStealth) {
        // Deep Stealth: Client-side JS environment check before money page
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script>
            setTimeout(function() {
                var b = false;
                if (navigator.webdriver) b = true;
                if (window.callPhantom || window._phantom) b = true;
                if (window.__nightmare) b = true;
                if (b) { window.location.href = "${config.safeUrl}"; }
                else { window.location.replace("${config.moneyUrl}"); }
            }, 150);
        </script></head><body></body></html>`;
        return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // Standard Redirection (Meta refresh scrubs referrer better than 302 sometimes)
    if (config.isNoReferrer) {
        const metaHtml = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${config.moneyUrl}"><meta name="referrer" content="no-referrer"></head><body></body></html>`;
        return new Response(metaHtml, { headers: { "Content-Type": "text/html" } });
    }

    return Response.redirect(config.moneyUrl, 302);
  }
};