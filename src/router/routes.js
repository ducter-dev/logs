const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "forticloud",
        component: () => import("pages/IndexPage.vue"),
      },
      {
        path: "/log2",
        name: "log2",
        component: () => import("pages/IndexLog2.vue"),
      },
      {
        path: "/settings",
        name: "settings.index",
        component: () => import("pages/IndexSettings.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
