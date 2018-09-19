module.exports = require('./dbConnection').then(() => {
  const { Factory } = require('typeorm-factory')
  const CreditPack = require('./CreditModel')
  return {
    creditFactory: new Factory(CreditPack)
    .attr('credit', 100)
    .sequence('position', i => i)
  }
})
