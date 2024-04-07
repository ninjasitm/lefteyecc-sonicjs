import { Hono } from "hono";
import { getLinkPreview } from "link-preview-js";

const adminHelper = new Hono();

adminHelper.get("/link-preview", async (ctx) => {
  const url = ctx.req.query().url;
  console.log("[Admin Helper]: Received request for link preview", url, ctx.req.query());
  if (url) {
    const data = await getLinkPreview(url, {
      followRedirects: 'follow'
    });
    console.log("[Admin Helper]: Sending link preview", data);
    return ctx.json({
      success: true,
      data
    });
  }
  return ctx.json({ success: false, message: "No url provided" });
});

export { adminHelper };
