const dbConnection = require('./dbConnection')
const { lte, compose, property, partition, partial, reduce } = require('lodash/fp')
const Promise = require('bluebird')
const { MoreThan } = require('typeorm')

module.exports = async () => {
  const db = await dbConnection
  const repo = db.getRepository('Credit')
  const composeRule = (rules, resolve) => reduce(
    (memo, f) => partial(f, [memo]),
    resolve,
    rules
  )
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
      (await repo.find({
          where: { credit: MoreThan(0) },
          order: { position: 'ASC' }
      })).reduce(
        (progress, creditRecord) => {
          if (progress.smsLeft === 0) { return progress }

          const { id, smsCost } = creditRecord
          const smsThatCanBeSent = parseInt(creditRecord.credit / smsCost)
          const smsUsed = Math.min(progress.smsLeft, smsThatCanBeSent)
          const smsLeft = Math.max(0, progress.smsLeft - smsThatCanBeSent)
          const credit = creditRecord.credit - (smsUsed * smsCost)

          return {
            smsLeft,
            usedCredits: [
              ...progress.usedCredits,
              { id, smsUsed, credit }
            ]
          }
        },
        { smsLeft, usedCredits: [] }
      ),
    executeOnCredit: async (rules, resolve, id, params) => {
      const operation = composeRule(rules, resolve)
      return operation(await repo.findOne(id), params)
    }
  }
}
