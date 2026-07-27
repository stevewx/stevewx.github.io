import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../consts";

export async function GET(context) {
  // English feed: only en posts, canonical slugs (strip any `.zh`).
  const posts = (
    await getCollection("blog", (p) => !p.data.draft && p.data.lang !== "zh")
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: [post.data.category, ...post.data.tags],
      link: `/blog/${post.id.replace(/\.zh$/, "")}/`,
    })),
    customData: `<language>${SITE.locale}</language>`,
  });
}
