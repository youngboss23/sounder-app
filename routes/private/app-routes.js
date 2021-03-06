const express = require('express');
const colorThief = require('colorthief');
const trackController = require('../../controllers/track.controller');
const playlistController = require('../../controllers/playlist.controller.js');
const userController = require('../../controllers/user.controller');

const router = express.Router();

// eslint-disable-next-line consistent-return
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

router.get('/discovery', ensureAuthenticated, async (req, res) => {
  const { user } = req;
  trackController.addAccessToken(user);
  try {
    const nullTrack = await trackController.getNullTrack(user);
    if (nullTrack.length > 0) {
      const colors = await colorThief.getColor(nullTrack[0].album.images[0].url);
      res.render('private/discovery/index', { track: nullTrack[0], colors: colors.join(','), user });
    } else {
      const newTrack = await trackController.getNewTrack(user);
      const colors = await colorThief.getColor(newTrack.album.images[0].url);
      res.render('private/discovery/index', { track: newTrack, colors: colors.join(','), user });
    }
  } catch (err) {
    if (err.statusCode === 401) {
      try {
        await userController.resetToken(user);
        res.redirect('/discovery');
      } catch (error) {
        console.log(error);
      }
    }
    console.log(err);
  }
});

router.post('/playlists/add-to-spotify', ensureAuthenticated, async (req, res) => {
  const playlistName = req.body.playlist_name;
  try {
    const spotifyTracksIdArray = await trackController.getLikedSpotifyTrackIds(req.user);
    await playlistController.addToSpotify(req.user, spotifyTracksIdArray, playlistName);
    res.redirect('/playlists');
  } catch (err) {
    if (err.statusCode === 401) {
      try {
        await userController.resetToken(req.user);
        res.redirect('/playlists');
      } catch (error) {
        console.log(error);
      }
    }
    console.log(err);
  }
});

router.post('/discovery/set-liked', ensureAuthenticated, async (req, res) => {
  try {
    const { liked, id } = req.body;
    if (liked === 'true') {
      await trackController.updateLiked(id, true);
    } else {
      await trackController.updateLiked(id, false);
    }
    res.redirect('/discovery');
  } catch (error) {
    if (error.statusCode === 401) {
      try {
        await userController.resetToken(req.user);
        res.redirect('/discovery');
      } catch (err) {
        console.log(err);
      }
    }
    console.log(error);
  }
});

router.get('/playlists', ensureAuthenticated, async (req, res) => {
  try {
    const plalistInfo = await playlistController.getPlaylists(req.user);
    res.render('private/playlist/index', { playlists: plalistInfo, user: req.user });
  } catch (error) {
    if (error.statusCode === 401) {
      try {
        await userController.resetToken(req.user);
        res.redirect('/playlists');
      } catch (err) {
        console.log(err);
      }
    }
  }
});

router.get('/tracks', ensureAuthenticated, async (req, res) => {
  try {
    const myTracks = await trackController.getLikedTracks(req.user);
    res.render('private/track/index', { myTracks, user: req.user });
  } catch (error) {
    if (error.statusCode === 401) {
      try {
        await userController.resetToken(req.user);
        res.redirect('/tracks');
      } catch (err) {
        console.log(err);
      }
    }
    console.log(error);
  }
});

module.exports = router;
