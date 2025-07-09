import { supabase } from "../config/supabase.js";
import { fetchFromTMDB } from "../services/tmdb.service.js";

export async function searchPerson(req, res) {
  const { query } = req.params;
  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/person?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return res.status(404).send(null);
    }

    // Insert search history into Supabase
    await supabase
      .from('search_history')
      .insert({
        user_id: req.user.id,
        tmdb_id: response.results[0].id,
        image_path: response.results[0].profile_path,
        title: response.results[0].name,
        search_type: "person",
      });

    res.status(200).json({ success: true, content: response.results });
  } catch (error) {
    console.log("Error in searchPerson controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function searchMovie(req, res) {
  const { query } = req.params;

  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return res.status(404).send(null);
    }

    // Insert search history into Supabase
    await supabase
      .from('search_history')
      .insert({
        user_id: req.user.id,
        tmdb_id: response.results[0].id,
        image_path: response.results[0].poster_path,
        title: response.results[0].title,
        search_type: "movie",
      });

    res.status(200).json({ success: true, content: response.results });
  } catch (error) {
    console.log("Error in searchMovie controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function searchTv(req, res) {
  const { query } = req.params;

  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/tv?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return res.status(404).send(null);
    }

    // Insert search history into Supabase
    await supabase
      .from('search_history')
      .insert({
        user_id: req.user.id,
        tmdb_id: response.results[0].id,
        image_path: response.results[0].poster_path,
        title: response.results[0].name,
        search_type: "tv",
      });

    res.json({ success: true, content: response.results });
  } catch (error) {
    console.log("Error in searchTv controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getSearchHistory(req, res) {
  try {
    const { data: searchHistory, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedHistory = searchHistory.map(item => ({
      id: item.tmdb_id,
      image: item.image_path,
      title: item.title,
      searchType: item.search_type,
      createdAt: item.created_at,
    }));

    res.status(200).json({ success: true, content: transformedHistory });
  } catch (error) {
    console.log("Error in getSearchHistory controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function removeItemFromSearchHistory(req, res) {
  let { id } = req.params;

  id = parseInt(id);

  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', req.user.id)
      .eq('tmdb_id', id);

    if (error) {
      throw error;
    }

    res
      .status(200)
      .json({ success: true, message: "Item removed from search history" });
  } catch (error) {
    console.log(
      "Error in removeItemFromSearchHistory controller: ",
      error.message
    );
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}