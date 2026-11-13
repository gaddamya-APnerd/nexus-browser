
const ALLOWED_HOSTS = [
  "example.com",
  "www.example.com",
  "wikipedia.org",
  "www.wikipedia.org"
];

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET requests only." });
  }

  try {
    const url = new URL(req.query.url || "");

    if (url.protocol !== "https:" ||
        !ALLOWED_HOSTS.includes(url.hostname)) {
      return res.status(403).json({
        error: "This website is not on the approved list."
      });
    }

    const response = await fetch(url.href, {
      headers: { "User-Agent": "NEXUS-Reader/1.0" },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "The website could not be loaded."
      });
    }

    const type = response.headers.get("content-type") || "";

    if (!type.includes("text/html")) {
      return res.status(415).json({
        error: "Only public HTML pages are supported."
      });
    }

    const html = await response.text();

    const readable = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000);

    return res.status(200).json({
      title: url.hostname,
      content: readable
    });
  } catch (error) {
    return res.status(400).json({
      error: "Invalid address or the website could not be reached."
    });
  }
};
