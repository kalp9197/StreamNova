export const getEmbedUrl = (req, res) => {
  const { tmdb, type, season, episode, sub_url, ds_lang } = req.query;

  if (!tmdb) {
    return res.status(400).json({ error: 'TMDb ID is required' });
  }

  if (!type || (type !== 'movie' && type !== 'tv')) {
    return res.status(400).json({ error: 'Type must be either "movie" or "tv"' });
  }

  let url = `https://vidsrc.xyz/embed/${type}/${tmdb}`;
  
  if (type === 'tv' && season && episode) {
    url += `/${season}-${episode}`;
  }

  let queryParams = [];

  if (sub_url) {
    queryParams.push(`sub_url=${encodeURIComponent(sub_url)}`);
  }

  if (ds_lang) {
    queryParams.push(`ds_lang=${ds_lang}`);
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  res.json({ embedUrl: url });
};
