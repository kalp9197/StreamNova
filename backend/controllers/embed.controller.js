export const getEmbedUrl = (req, res) => {
  const { tmdb, type, season, episode, sub_url, ds_lang } = req.query;

  if (!tmdb) {
    return res.status(400).json({ error: 'TMDb ID is required' });
  }

  if (!type || (type !== 'movie' && type !== 'tv')) {
    return res.status(400).json({ error: 'Type must be either "movie" or "tv"' });
  }

  let url = `https://vidsrc.xyz/embed/${type}`;

  if (tmdb) url += `/${tmdb}`;
  if (type === 'tv' && season && episode) {
    url += `/${season}-${episode}`;
  }
  if (sub_url) url += `?sub_url=${encodeURIComponent(sub_url)}`;
  if (ds_lang) url += `&ds_lang=${ds_lang}`;

  res.json({ embedUrl: url });
};

export const getLatestMovies = (req, res) => {
  const { page } = req.params;
  const url = `https://vidsrc.xyz/movies/latest/page-${page}.json`;
  res.json({ latestMoviesUrl: url });
};

export const getLatestEpisodes = (req, res) => {
  const { page } = req.params;
  const url = `https://vidsrc.xyz/episodes/latest/page-${page}.json`;
  res.json({ latestEpisodesUrl: url });
};
