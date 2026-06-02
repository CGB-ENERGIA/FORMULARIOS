import { defineBoot } from '#q-app/wrappers';

export default defineBoot(({ app, store }) => {
  app.use(store);
});
