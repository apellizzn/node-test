const dbConnection = require('./dbConnection')
const { lte, compose, property, includes, partition } = require('lodash/fp')
const Promise = require('bluebird')

module.exports = async () => {
  const db = await dbConnection
  const repo = db.getRepository('Credit')

  const adjustPositions = async (credits, position) => {
    const byPriority = compose(
      lte(position),
      property('position')
    )

    const positionTaken = includes(position, credits.map(property('position')))

    if (positionTaken) {
      const [lowerPriority,] = partition(byPriority, credits)

      await Promise.each(
        lowerPriority,
        credit => repo.increment({ id: credit.id }, 'position', 1)
      )
    }
  }

  return {
    create: async params => {
      const credits = await repo.find({ order: { position: 'DESC' }})
      await adjustPositions(credits, params.position)
      return repo.save(params)
    }
  }
}
