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

    consumeCredit: async smsLeft =>
      (await repo.find(
        {
          where: { credit: MoreThan(0) },
          order: { position: 'ASC' }
        })
      ).reduce(
        (progress, creditRecord) => {
          if (progress.smsLeft === 0) { return progress }

          const { id, credit, smsCost } = creditRecord
          const smsThatCanBeSent = parseInt(credit / smsCost)
          const hasEnoughCredit = smsThatCanBeSent >= progress.smsLeft

          return hasEnoughCredit ?
            {
              smsLeft: 0,
              usedCredits: [
                ...progress.usedCredits,
                {
                  id,
                  smsUsed: progress.smsLeft,
                  credit: credit - progress.smsLeft * smsCost
                }
              ]
            } : {
              smsLeft: progress.smsLeft - smsThatCanBeSent,
              usedCredits: [
                ...progress.usedCredits,
                {
                  id,
                  smsUsed: smsThatCanBeSent,
                  credit: credit - smsThatCanBeSent * smsCost
                }
              ]
            }
        },
        { smsLeft, usedCredits: [] }
      )
  }
}
