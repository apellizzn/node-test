const { createConnection } = require('typeorm')
module.exports = createConnection({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'prisma',
  database: 'node_credit',
  synchronize: true,
  entities: [
    require('./CreditEntity')
  ],
})
