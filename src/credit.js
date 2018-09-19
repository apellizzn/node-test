const dbConnection = require('./dbConnection')

module.exports = async () => {
  const db = await dbConnection
  const repo = db.getRepository('Credit')

  return {
    create: params => {}
  }
}
