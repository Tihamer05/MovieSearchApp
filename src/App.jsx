import React, {useEffect, useState} from "react";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { useDebounce} from "react-use";
import {getTrandingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers : {
        accept : 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }

}

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState([]);
    
    useDebounce(() => setDebouncedSearch(searchTerm), 500, [searchTerm]);
    
    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try{
            const endPoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endPoint, API_OPTIONS);

            if(!response.ok){
                throw new Error('Failed to fetch movies!');
            }

            const data = await response.json();

            if(data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch!');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if(query && data.results.length > 0){
                await updateSearchCount(query, data.results[0]);
            }

        }catch (error){
            console.error(`Error fetching: ${error}`);
            setErrorMessage('Error fetching movies!');
        }finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try{
            const movies = await getTrandingMovies();

            setTrendingMovies(movies);
        }catch(error){
            console.error(`Error fetching trendings ${error}`);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearch);
    }, [debouncedSearch]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return(
        <main>
            <div className="pattern"></div>

            <div className="wrapper">
                <header>
                    <img src="/hero.png" alt="Heros" className="max-w-[200px] h-auto"/>
                    <h1 className="text-4xl font-bold font-sans">Find <span className="text-gradient">Movies</span> You Will Enjoy</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}></Search>
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Popular Movies</h2>

                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies relative z-10">
                    <h2>All movies</h2>
                    {isLoading ? (
                        <Spinner></Spinner>
                    ): errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ): (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}></MovieCard>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

        </main>
    )
}

export default App