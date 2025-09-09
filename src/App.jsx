import { useEffect, useState } from 'react'
import './App.css'
import Search from './components/Search'
import Spinner from './components/Spinner'
import MovieCard from './components/MovieCard'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite'

const API_BASE_URL = 'https://api.themoviedb.org/3'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}
const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [movies, setMovies] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setisLoading] = useState(false)
  
  const [trendingMovies, setTrendingMovies] = useState([])
  

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    try {
      setisLoading(true)
      setErrorMessage('')

      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`

      const response = await fetch(endpoint, API_OPTIONS)

      if (!response.ok) {
        throw new Error('Error buscando películas')
      }

      const data = await response.json()

      if (data.success === false) {
        setErrorMessage(data.error || 'Error buscando tu película. Porfavor intenta más tarde.')
        setMovies([])
        return
      }

      setMovies(data.results || [])

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`)
      setErrorMessage('Error buscando tu película. Porfavor intenta más tarde.')
    } finally {
      setisLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies()

      setTrendingMovies(movies)

    } catch (error) {
      console.log(`Error buscando peliculas de tendencia: ${error}`)
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies()
  }, [])

  return (
    <main>
      <div className='pattern' />

      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Encontrá la <span className='text-gradient'>película</span> que estás buscando</h1>
        </header>

        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Tendencia</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>Todas las películas</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movies.length === 0 ? (
                <p className='text-red-500'>No encontramos tu película.</p>
              ) : (
                movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              )}
            </ul>
          )}
        </section>

      </div>
    </main>
  )
}

export default App
