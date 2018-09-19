const syncDb = async () => {
  const db = await require('./dbConnection')
  return db.synchronize(true)
}
afterEach(syncDb)
