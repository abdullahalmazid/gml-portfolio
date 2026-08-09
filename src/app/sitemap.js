
export default async function sitemap() {
  return [
    {
      url: 'https://abdullahalmazid.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    // If you have a blog or other pages later, add them here:
    // {
    //   url: 'https://vercel.app',
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // },
  ];

}
