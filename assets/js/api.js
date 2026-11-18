/* ============================================================
   تک نیوز — کلاینت API جاوا
   این فایل به صورت اسکریپت معمولی لود میشود تا حتی با file:// هم کار کند.
   ============================================================ */
(function () {
  "use strict";

  async function request(path, options) {
    const response = await fetch(path, options);
    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }
    return response.json();
  }

  window.TechNewsAPI = {
    getNews: function () {
      return request("/api/news");
    },
    getNewsByCategory: function (category) {
      return request("/api/news?category=" + encodeURIComponent(category));
    },
    getNewsById: function (id) {
      return request("/api/news/" + encodeURIComponent(id));
    },
    getCategories: function () {
      return request("/api/categories");
    },
    subscribe: function (email) {
      return request("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
    },
  };
})();
