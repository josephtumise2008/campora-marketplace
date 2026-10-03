const jwt = require("jsonwebtoken");
const env = require("../config/env");

const sign = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      store: user.store || undefined,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const verify = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { sign, verify };
