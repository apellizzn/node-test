module.exports = class Credit {
  constructor(
    id,
    credit,
    position,
    smsCost
  ) {
    this.id = id
    this.credit = credit
    this.position = position
    this.smsCost = smsCost
  }
}
