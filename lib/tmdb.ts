import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export const fetchFromTMDB = async (url: string) => {
  const options = {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_API_KEY}`,
    },
  };

  const response = await axios.get(url, options);

  if (response.status !== 200) {
    throw new Error(`Failed to fetch data from TMDB: ${response.statusText}`);
  }

  return response.data;
};
