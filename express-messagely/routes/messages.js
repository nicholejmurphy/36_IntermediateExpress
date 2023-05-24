const express = require("express");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");
const router = new express.Router();

const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
} = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureCorrectUser, async (req, res, next) => {
  try {
    const message = await Message.get(req.params.id);
    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const { username } = req.user;
    const msgData = {
      from_username: username,
      to_username: req.body.to_username,
      body: req.body.body,
    };
    const message = await Message.create(msgData);
    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureCorrectUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const msgData = await Message.markRead(id);
    return res.json({ message: msgData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
