const dbConnection = require('./dbConnection')
const { lte, compose, property, partition } = require('lodash/fp')
const Promise = require('bluebird')
const { MoreThan } = require('typeorm')

module.exports = async () => {
  const db = await dbConnection
  const repo = db.getRepository('Credit')

  const adjustPositions = async (credits, position) => {
    const byPriority = compose(
      lte(position),
      property('position')
    )
    await Promise.each(
      partition(byPriority, credits)[0],
      credit => repo.increment({ id: credit.id }, 'position', 1)
    )
  }

  return {
    create: async params => {
      const credits = await repo.find({ order: { position: 'DESC' }})
      await adjustPositions(credits, params.position)
      return repo.save(params)
    },

    consumeCredit: smsLeft => {}
  }
}
