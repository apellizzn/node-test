module.exports = require('./dbConnection').then(() => {
  const { Factory } = require('typeorm-factory')
  const CreditPack = require('./CreditModel')
  return {
    creditFactory: new Factory(CreditPack)
    .attr('credit', 100)
    .attr('smsCost', 1)
    .sequence('position', i => i)
  }
})
