module.exports.notExpensive = (resolve, credit, params) => {

  if(credit.smsCost > params.smsCost) {
    throw new Error('Too Costly')
  }
  return resolve(credit, params)
}

module.exports.lowBudgetUser = (resolve, credit, params) => {
  if(credit.credit > params.credit) {
    throw new Error('Too Rich')
  }
  return resolve(credit, params)
}
