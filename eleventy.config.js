module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("json", value => JSON.stringify(value || "").replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("dateISO", d => {
    if (!d) return "";
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? d : date.toISOString().slice(0, 10);
  });
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
