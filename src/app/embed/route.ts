import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Serves a script that injects a form into the page.
 * Usage: <script src="https://YOUR_DOMAIN/embed" data-form="PUBLIC_KEY"></script>
 * The script looks for data-form, fetches form config from /api/forms/[publicKey]/config, and renders a form into document.body or a target div.
 * TODO: Rate limiting; captcha; styled widget.
 */
export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const js = `
(function() {
  var script = document.currentScript;
  var publicKey = script && script.getAttribute('data-form');
  if (!publicKey) return;
  var actionUrl = '${baseUrl}/api/forms/' + encodeURIComponent(publicKey);
  var form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;
  form.innerHTML = [
    '<input type="hidden" name="form_id" value="' + publicKey + '">',
    '<input type="text" name="name" placeholder="Your name">',
    '<input type="email" name="email" placeholder="Your email" required>',
    '<textarea name="message" placeholder="How can we help?"></textarea>',
    '<button type="submit">Send</button>'
  ].join('');
  form.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-width:320px;padding:16px;border:1px solid #ccc;border-radius:8px;';
  var target = document.getElementById('form-container') || script.previousElementSibling || document.body;
  if (target && target.nodeType === 1) {
    target.appendChild(form);
  } else {
    document.body.appendChild(form);
  }
})();
`.trim();

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=60",
    },
  });
}
