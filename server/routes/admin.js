const express = require('express');
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Add a new movie (Admin Only)
router.post('/movie', authenticateToken, async (req, res) => {
    const {
        title, type, synopsis, releaseDate, movieLength,
        moviePosterLink, movieBackdropLink, language,
        imdbRating, fmdbRating, awards, boxOffice, mpaaRating,
        genres, keywords, actors, directors, writers
    } = req.body;

    const loggedInUserId = req.userId;

    try {
        // Check admin
        const adminResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1 AND LOWER(usertype) = 'admin'
        `, [loggedInUserId]);

        if (adminResult.rows.length === 0) {
            return res.status(403).send({ success: false, message: 'Only admins can add movies.' });
        }

        // Check duplicate (same title + same director)
        const directorParams = directors.map((_, i) => `$${i + 2}`).join(', ');
        const movieCheckResult = await pool.query(`
            SELECT m.movieid
            FROM movies m
            INNER JOIN moviedirectors md ON m.movieid = md.movieid
            INNER JOIN directors d       ON md.directorid = d.directorid
            WHERE m.title = $1 AND d.directorname IN (${directorParams})
        `, [title, ...directors]);

        if (movieCheckResult.rows.length > 0) {
            return res.status(400).send({ success: false, message: 'A movie with this title and one of the specified directors already exists.' });
        }

        // Insert the movie
        const movieResult = await pool.query(`
            INSERT INTO movies (title, type, synopsis, releasedate, movielength, movieposterlink, moviebackdroplink, language, imdb_rating, fmdb_rating, awards, boxoffice, mpaa_rating)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING movieid AS "MovieID"
        `, [title, type, synopsis, releaseDate, movieLength, moviePosterLink, movieBackdropLink, language, imdbRating, fmdbRating || 1, awards, boxOffice, mpaaRating]);

        const movieId = movieResult.rows[0].MovieID;

        // Insert genres
        if (genres && genres.length > 0) {
            for (const genre of genres) {
                const genreResult = await pool.query(`
                    SELECT genreid AS "GenreID" FROM genres WHERE genrename = $1
                `, [genre]);

                let genreId;
                if (genreResult.rows.length === 0) {
                    const ins = await pool.query(`
                        INSERT INTO genres (genrename) VALUES ($1) RETURNING genreid AS "GenreID"
                    `, [genre]);
                    genreId = ins.rows[0].GenreID;
                } else {
                    genreId = genreResult.rows[0].GenreID;
                }

                await pool.query(`
                    INSERT INTO moviegenres (genreid, movieid) VALUES ($1, $2)
                `, [genreId, movieId]);
            }
        }

        // Insert keywords
        if (keywords && keywords.length > 0) {
            for (const keyword of keywords) {
                const kwResult = await pool.query(`
                    SELECT keywordid AS "KeywordID" FROM keywords WHERE keywordname = $1
                `, [keyword]);

                let keywordId;
                if (kwResult.rows.length === 0) {
                    const ins = await pool.query(`
                        INSERT INTO keywords (keywordname) VALUES ($1) RETURNING keywordid AS "KeywordID"
                    `, [keyword]);
                    keywordId = ins.rows[0].KeywordID;
                } else {
                    keywordId = kwResult.rows[0].KeywordID;
                }

                await pool.query(`
                    INSERT INTO moviekeywords (keywordid, movieid) VALUES ($1, $2)
                `, [keywordId, movieId]);
            }
        }

        // Insert actors
        if (actors && actors.length > 0) {
            for (const actor of actors) {
                const actorResult = await pool.query(`
                    SELECT actorid AS "ActorID" FROM actors WHERE actorname = $1
                `, [actor.name]);

                let actorId;
                if (actorResult.rows.length === 0) {
                    const ins = await pool.query(`
                        INSERT INTO actors (actorname) VALUES ($1) RETURNING actorid AS "ActorID"
                    `, [actor.name]);
                    actorId = ins.rows[0].ActorID;
                } else {
                    actorId = actorResult.rows[0].ActorID;
                }

                await pool.query(`
                    INSERT INTO movieactors (actorid, movieid, charactername) VALUES ($1, $2, $3)
                `, [actorId, movieId, actor.character]);
            }
        }

        // Insert directors
        if (directors && directors.length > 0) {
            for (const director of directors) {
                const dirResult = await pool.query(`
                    SELECT directorid AS "DirectorID" FROM directors WHERE directorname = $1
                `, [director]);

                let directorId;
                if (dirResult.rows.length === 0) {
                    const ins = await pool.query(`
                        INSERT INTO directors (directorname) VALUES ($1) RETURNING directorid AS "DirectorID"
                    `, [director]);
                    directorId = ins.rows[0].DirectorID;
                } else {
                    directorId = dirResult.rows[0].DirectorID;
                }

                await pool.query(`
                    INSERT INTO moviedirectors (directorid, movieid) VALUES ($1, $2)
                `, [directorId, movieId]);
            }
        }

        // Insert writers
        if (writers && writers.length > 0) {
            for (const writer of writers) {
                const writerResult = await pool.query(`
                    SELECT writerid AS "WriterID" FROM writers WHERE writername = $1
                `, [writer]);

                let writerId;
                if (writerResult.rows.length === 0) {
                    const ins = await pool.query(`
                        INSERT INTO writers (writername) VALUES ($1) RETURNING writerid AS "WriterID"
                    `, [writer]);
                    writerId = ins.rows[0].WriterID;
                } else {
                    writerId = writerResult.rows[0].WriterID;
                }

                await pool.query(`
                    INSERT INTO moviewriters (writerid, movieid) VALUES ($1, $2)
                `, [writerId, movieId]);
            }
        }

        res.status(201).send({ success: true, message: 'Movie added successfully.', movieId });
    } catch (err) {
        console.error('Error adding movie:', err.message);
        res.status(500).send({ success: false, message: 'Error adding movie.', error: err.message });
    }
});

// Delete User Account (Admin Only)
router.delete('/user/:userId', authenticateToken, async (req, res) => {
    let { userId } = req.params;
    if (!userId) {
        return res.status(400).send({ success: false, message: 'userId parameter is required.' });
    }
    userId = parseInt(userId, 10);
    if (isNaN(userId)) {
        return res.status(400).send({ success: false, message: 'Invalid userId. It must be a number.' });
    }

    const loggedInUserId = req.userId;

    try {
        const adminResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1 AND LOWER(usertype) = 'admin'
        `, [loggedInUserId]);

        if (adminResult.rows.length === 0) {
            return res.status(403).send({ success: false, message: 'Only admins can delete accounts.' });
        }

        const userResult = await pool.query(`SELECT userid FROM users WHERE userid = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'User not found.' });
        }

        await pool.query(`DELETE FROM users WHERE userid = $1`, [userId]);
        res.send({ success: true, message: 'User account deleted successfully.' });
    } catch (err) {
        console.error('Error deleting user account:', err.message);
        res.status(500).send({ success: false, message: 'Error deleting user account.' });
    }
});

// Delete Movie (Admin Only)
router.delete('/movie/:movieId', authenticateToken, async (req, res) => {
    let { movieId } = req.params;
    if (!movieId) {
        return res.status(400).send({ success: false, message: 'movieId parameter is required.' });
    }
    movieId = parseInt(movieId, 10);
    if (isNaN(movieId)) {
        return res.status(400).send({ success: false, message: 'Invalid movieId. It must be a number.' });
    }

    const loggedInUserId = req.userId;

    try {
        const adminResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1 AND LOWER(usertype) = 'admin'
        `, [loggedInUserId]);

        if (adminResult.rows.length === 0) {
            return res.status(403).send({ success: false, message: 'Only admins can delete movies.' });
        }

        const movieResult = await pool.query(`SELECT movieid FROM movies WHERE movieid = $1`, [movieId]);
        if (movieResult.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'Movie not found.' });
        }

        await pool.query(`DELETE FROM movies WHERE movieid = $1`, [movieId]);
        res.send({ success: true, message: 'Movie deleted successfully.' });
    } catch (err) {
        console.error('Error deleting movie:', err.message);
        res.status(500).send({ success: false, message: 'Error deleting movie.' });
    }
});

module.exports = router;