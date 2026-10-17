module.exports = function(eleventyConfig) {

  // ---- Copy every static, non-templated part of the site as-is ----
  // These live in /static (a mirror of the current hand-built site) and
  // get copied straight into the output root, untouched.
  eleventyConfig.addPassthroughCopy({ "static/index.html": "index.html" });
  eleventyConfig.addPassthroughCopy({ "static/about.html": "about.html" });
  eleventyConfig.addPassthroughCopy({ "static/contact.html": "contact.html" });
  eleventyConfig.addPassthroughCopy({ "static/privacy-policy.html": "privacy-policy.html" });
  eleventyConfig.addPassthroughCopy({ "static/terms-of-use.html": "terms-of-use.html" });
  eleventyConfig.addPassthroughCopy({ "static/disclaimer.html": "disclaimer.html" });
  eleventyConfig.addPassthroughCopy({ "static/reviews.html": "reviews.html" });
  eleventyConfig.addPassthroughCopy({ "static/ebooks.html": "ebooks.html" });
  eleventyConfig.addPassthroughCopy({ "static/trackers.html": "trackers.html" });
  eleventyConfig.addPassthroughCopy({ "static/services.html": "services.html" });
  eleventyConfig.addPassthroughCopy({ "static/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "static/blogs/blogs.html": "blogs/blogs.html" });
  eleventyConfig.addPassthroughCopy({ "static/ebooks": "ebooks" });
  eleventyConfig.addPassthroughCopy({ "static/trackers": "trackers" });
  eleventyConfig.addPassthroughCopy({ "static/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "static/calculators": "calculators" });
  eleventyConfig.addPassthroughCopy({ "static/business-guides": "business-guides" });

  // ---- Decap CMS admin panel (static files, no templating needed) ----
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });

  // ---- Nunjucks filter: turn an FAQ list into JSON-LD schema ----
  eleventyConfig.addFilter("faqSchema", function(faqs) {
    if (!faqs || !faqs.length) return "";
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    };
    return JSON.stringify(schema, null, 2);
  });

  // ---- Nunjucks filter: Article + Breadcrumb JSON-LD for a blog post ----
  eleventyConfig.addFilter("articleSchema", function(post) {
    const people = {
      pankaj: { "@type": "Person", "name": "CA Pankaj Chhabra", "url": "https://paisastack.com/about.html" },
      tripti: { "@type": "Person", "name": "CA Tripti Saini", "url": "https://paisastack.com/about.html" },
    };
    const url = `https://paisastack.com/blogs/${post.slug}.html`;
    const article = {
      "@type": "Article",
      "headline": post.title,
      "description": post.description,
      "url": url,
      "mainEntityOfPage": url,
      "inLanguage": "en-IN",
      "author": (post.authors || ["pankaj", "tripti"]).map(a => people[a]).filter(Boolean),
      "publisher": { "@type": "Organization", "name": "Paisa Stack", "url": "https://paisastack.com/" },
    };
    if (post.category) article.articleSection = post.category;
    // updatedDate is free text like "22 July 2026"; only emit it when it parses.
    const d = new Date(post.updatedDate);
    if (post.updatedDate && !isNaN(d)) {
      const pad = n => String(n).padStart(2, "0");
      article.dateModified = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    const breadcrumb = {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://paisastack.com/" },
        { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://paisastack.com/blogs/blogs.html" },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": url },
      ],
    };
    const schema = { "@context": "https://schema.org", "@graph": [article, breadcrumb] };
    return JSON.stringify(schema, null, 2).replace(/</g, "\\u003c");
  });

  // ---- Nunjucks filter: rough reading-time estimate ----
  eleventyConfig.addFilter("readingTime", function(content) {
    if (!content) return "10 min read";
    const words = String(content).split(/\s+/).length;
    const mins = Math.max(3, Math.round(words / 220));
    return mins + " min read";
  });

  // ---- Force every blog post to a consistent flat URL ----
  // Without this, a post's URL depends on whatever the CMS happens to name
  // the file, which can produce inconsistent folder-style URLs (and stray
  // "-1" suffixes on a title collision). This guarantees every post lands
  // at /blogs/{filename}.html, matching the rest of the site, every time.
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => `blogs/${data.page.fileSlug}.html`,
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
