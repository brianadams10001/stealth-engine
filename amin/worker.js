/**
 * StealthCloak Industrial Engine - v3.7.0 (FINAL)
 * Handles Traffic Filtering, Analytics Streaming (SSE), and Config Management.
 */

const ADMIN_API_PREFIX = '/api/v1/admin';
const AUTH_TOKEN_SECRET = "industrial_stealth_token";

// INDUSTRIAL BLACKLIST (ASNs)
const BLOCKED_ASNS = [
  15169, 16509, 8075, 14061, 20473, 13335, 15133, 
  396982, 32934, 14618, 16509, 14061
];

// KNOWN TOR EXIT NODE SUBNETS (Simulated)
const TOR_SUBNETS = ['104.244.72.', '185.220.101.']; 

const BOT_PATTERNS = [
  'headless', 'selenium', 'puppeteer', 'playwright', 'curl', 'wget', 
  'python', 'bot', 'crawler', 'spider', 'facebookexternalhit', 
  'googlebot', 'bingbot', 'tiktokbot', 'twitterbot'
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

    // --- 1. ADMIN API HANDLER ---
    if (url.pathname.startsWith(ADMIN_API_PREFIX)) {
       // Handle CORS Preflight
       if (request.method === "OPTIONS") {
         return new Response(null, { headers: corsHeaders });
       }

       // Auth Check
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
           engine: "v3.7.0-FINAL",
           timestamp: Date.now()
         }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }

       // SSE Stream Endpoint (Real-time Analytics)
       if (url.pathname.endsWith('/stream')) {
         const { readable, writable } = new TransformStream();
         const writer = writable.getWriter();
         const encoder = new TextEncoder();

         ctx.waitUntil((async () => {
           // Initial ping
           await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'init' })}\n\n`));
           
           // Keep connection open for 50s
           const startTime = Date.now();
           while (Date.now() - startTime < 50000) {
             try {
               // Abort if client disconnects
               if (request.signal.aborted) break;

               // Fetch Stats
               const stats = await env.DB.prepare("SELECT action_taken, COUNT(*) as count FROM traffic_logs GROUP BY action_taken").all();
               const logs = await env.DB.prepare("SELECT * FROM traffic_logs ORDER BY timestamp DESC LIMIT 20").all();
               
               const payload = JSON.stringify({ stats: stats.results, logs: logs.results });
               await writer.write(encoder.encode(`data: ${payload}\n\n`));
             } catch (e) {
               // D1 errors ignored to keep stream alive
             }
             await new Promise(r => setTimeout(r, 2000));
           }
           await writer.close();
         })());

         return new Response(readable, {
           headers: {
             "Content-Type": "text/event-stream",
             "Cache-Control": "no-cache",
             "Connection": "keep-alive",
             ...corsHeaders
           }
         });
       }

       // Config Sink (Save Domain Settings)
       if (url.pathname.endsWith('/config') && request.method === "POST") {
         try {
           const body = await request.json();
           // Save to KV
           await env.CONFIG.put(`domain:${body.domainName}`, JSON.stringify(body));
           return new Response(JSON.stringify({ success: true, id: body.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
         } catch (e) {
           return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
         }
       }
       
       return new Response("API Endpoint Not Found", { status: 404, headers: corsHeaders });
    }

    // --- 2. MANAGEMENT PANEL FALLBACK ---
    if (host.includes('.workers.dev') || url.pathname === '/admin_status') {
      return new Response("Stealth Engine Online. Connect via Dashboard.", { status: 200 });
    }

    // --- 3. TRAFFIC FILTERING LOGIC ---
    
    // 3.1 Fetch Config from KV
    const configRaw = await env.CONFIG.get(`domain:${host}`);
    if (!configRaw) {
      return new Response(`Stealth Gateway: No Config Found for ${host}`, { status: 404 });
    }
    const config = JSON.parse(configRaw);

    // 3.2 Detection Logic
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const asn = request.cf?.asn || 0;
    const botScore = request.cf?.botScore || 100;
    const tlsCipher = request.cf?.tlsCipher || "UNKNOWN";
    
    let isBot = false;
    let detectionReason = "CLEAN";

    // Rate Limiting (Simple KV counter)
    const rateKey = `rate:${ip}`;
    let rateCount = 0;
    try {
        const current = await env.CONFIG.get(rateKey);
        rateCount = current ? parseInt(current) : 0;
        rateCount++;
        ctx.waitUntil(env.CONFIG.put(rateKey, rateCount.toString(), { expirationTtl: 60 }));
    } catch(e) {}

    if (rateCount > 60) {
        isBot = true;
        detectionReason = `RATE_LIMIT:${rateCount}`;
    }

    if (!isBot) {
        if (!request.headers.get("Accept-Language")) { isBot = true; detectionReason = "MISSING_HEADER"; }
        if (ua.length < 10) { isBot = true; detectionReason = "UA_SHORT"; }
        if (BLOCKED_ASNS.includes(asn)) { isBot = true; detectionReason = `ASN_BLOCK:${asn}`; }
        if (TOR_SUBNETS.some(sub => ip.startsWith(sub))) { isBot = true; detectionReason = "TOR_EXIT"; }
        if (BOT_PATTERNS.some(p => ua.toLowerCase().includes(p))) { isBot = true; detectionReason = "UA_SIG"; }
        if (botScore < (config.botThreshold || 30)) { isBot = true; detectionReason = `CF_SCORE:${botScore}`; }
    }

    const actionTaken = isBot ? "MASKED_PROXY" : "HUMAN_REDIRECT";

    // 3.3 Async Logging to D1
    ctx.waitUntil(
      (async () => {
        try {
          await env.DB.prepare(
            "INSERT INTO traffic_logs (timestamp, ip_address, asn, bot_score, action_taken, subdomain, detection_reason, tls_cipher) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(Date.now(), ip, asn, botScore, actionTaken, host, detectionReason, tlsCipher).run();
        } catch (err) { console.error("D1 Log Failed", err); }
      })()
    );

    // 3.4 Routing
    if (isBot) {
       try {
         // Proxy to Safe URL
         const safeRes = await fetch(config.safeUrl, { 
           headers: {
             ...request.headers,
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
           },
           redirect: 'follow'
         });
         return new Response(safeRes.body, safeRes);
       } catch (e) {
         return new Response("Service Unavailable", { status: 502 });
       }
    }

    // Human Redirect
    return Response.redirect(config.moneyUrl, 302);
  }
};