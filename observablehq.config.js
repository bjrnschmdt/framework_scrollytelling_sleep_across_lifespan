// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "Sleep Across Lifespan",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {
      name: "Research Paper",
      open: true,
      pages: [
        { name: "Visualizing Uncertainty", path: "/visualizingUncertainty" },
        { name: "Affect and Emotions", path: "/affectAndEmotions" },
      ],
    },
    { name: "Design Process", path: "/designProcess" },
    { name: "Clearing House", path: "/clearingHouse" },
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  header:
    "<div>🚧 This project is a work in progress. Please do not share the URL. 🚧</div>", // what to show in the header (HTML)
  footer: `<p>© <script>document.write(new Date().getFullYear());</script> <a href="https://www.kielscn.de">Kiel Science Communication Network</a>. Alle Rechte vorbehalten.</p>`, // what to show in the footer (HTML)
  sidebar: false, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  typographer: true, // smart quotes and other typographic improvements
  // cleanUrls: true, // drop .html from URLs
};
