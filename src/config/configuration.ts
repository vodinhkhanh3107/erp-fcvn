export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development', // mặc định 'development' nếu quên khai — an toàn hơn là mặc định 'production'... nhưng vẫn LUÔN khai rõ NODE_ENV khi deploy thật để tránh nhầm lẫn
  port: parseInt(process.env.PORT, 10) || 3000,

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined, // Memurai mặc định không đặt password
  },

  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET_KEY,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
});
