/** User class for message.ly */
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("Missing required information.", 400);
    }
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPw, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      throw new ExpressError("Username & password required.", 400);
    }
    const results = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    const hashedPw = results.rows[0].password;
    return await bcrypt.compare(password, hashedPw);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users SET last_login_at = current_timestamp
      WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users
      ORDER BY username`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    if (!results.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id, 
              m.to_username,
              u.first_name,
              u.last_name,
              u.phone, 
              m.body, 
              m.sent_at, 
              m.read_at
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE from_username = $1`,
      [username]
    );
    return results.rows.map((r) => ({
      id: r.id,
      to_user: {
        username: r.to_username,
        first_name: r.first_name,
        last_name: r.last_name,
        phone: r.phone,
      },
      body: r.body,
      sent_at: r.sent_at,
      read_at: r.read_at,
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id, 
              m.from_username,
              u.first_name,
              u.last_name,
              u.phone, 
              m.body, 
              m.sent_at, 
              m.read_at
      FROM messages AS m
      JOIN users AS u ON m.from_username = u.username
      WHERE to_username = $1`,
      [username]
    );
    return results.rows.map((r) => ({
      id: r.id,
      from_user: {
        username: r.from_username,
        first_name: r.first_name,
        last_name: r.last_name,
        phone: r.phone,
      },
      body: r.body,
      sent_at: r.sent_at,
      read_at: r.read_at,
    }));
  }
}

module.exports = User;
