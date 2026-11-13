
const ALLOWED_HOSTS = [
  "example.com",
  "www.example.com",
  "wikipedia.org",
  "www.wikipedia.org",
  "www.iana.org",
  "www.rfc-editor.org",
  "www.nasa.gov",
  "science.nasa.gov",
  "www.britannica.com",
  "www.gutenberg.org"
];

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only." });
  }

  try {
    const url = new URL(req.query.url || "");

    if (
      url.protocol !== "https:" ||
      !ALLOWED_HOSTS.includes(url.hostname) ||
      url.username ||
      url.password
    ) {
      return res.status(403).json({
        error: "This website is not approved."
      });
    }

    const response = await fetch(url.href, {
      headers: { "User-Agent": "NEXUS-Reader/2.0" },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "The website could not be loaded."
      });
    }

    const type = response.headers.get("content-type") || "";

    if (!type.toLowerCase().includes("text/html")) {
      return res.status(415).json({
        error: "Only HTML pages are supported."
      });
    }

    const html = (await response.text()).slice(0, 500000);

    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      || url.hostname;

    const content = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000);

    return res.status(200).json({
      title: title.replace(/<[^>]*>/g, "").slice(0, 200),
      content
    });

  } catch (error) {
    return res.status(400).json({
      error: "Unable to reach this page."
    });
  }
};
