/** Minimal RSS/Atom feed parser — no npm deps needed */

export interface FeedItem {
  title:       string;
  link:        string;
  description: string;
  pubDate:     string | null;
  guid:        string;
}

function extractTag(xml: string, tag: string): string {
  // handles <tag>, <tag attr="x">, and CDATA sections
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

export function parseRSS(xml: string): FeedItem[] {
  // Handle both <item> (RSS) and <entry> (Atom)
  const isAtom  = /<feed\b/i.test(xml);
  const itemTag = isAtom ? "entry" : "item";
  const linkTag = isAtom ? "link" : "link";

  const raw = xml.match(new RegExp(`<${itemTag}>[\\s\\S]*?<\\/${itemTag}>`, "gi")) || [];

  return raw.map((block) => {
    let link = extractTag(block, linkTag);

    // Atom <link href="..."> fallback
    if (!link) {
      const m = block.match(/<link\s+[^>]*href="([^"]+)"/i);
      if (m) link = m[1];
    }

    return {
      title:       decodeHtmlEntities(extractTag(block, "title")),
      link:        link.replace(/\s/g, ""),
      description: extractTag(block, isAtom ? "summary" : "description"),
      pubDate:     extractTag(block, isAtom ? "updated" : "pubDate") || null,
      guid:        extractTag(block, isAtom ? "id" : "guid") || link,
    };
  });
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}
