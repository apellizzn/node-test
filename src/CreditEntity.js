const EntitySchema = require('typeorm').EntitySchema
const CreditPackModel = require('./CreditModel')

module.exports = new EntitySchema({
  name: 'Credit',
  target: CreditPackModel,
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: 'uuid'
    },
    position: {
      type: 'integer'
    },
    credit: {
      type: 'integer',
    },
    createdAt: {
      createDate: true
    },
    updatedAt: {
      updateDate: true
    }
  },
  indices: [{
    name: 'credit_packposition',
    columns: ['position'],
    unique: true
  }]
})
