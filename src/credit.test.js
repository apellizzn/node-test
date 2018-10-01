const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect
const { In } = require('typeorm')
const { notExpensive, lowBudgetUser } = require('./rules')

require('./index')

describe('Credit service', () => {
  let creditFactory
  let creditService

  beforeEach(async () => {
    creditService = await require('./credit')()
  })

  describe('create', () => {
    it('creates a credit', async () => {
      const credit = await creditService.create({ position: 0, credit: 10, smsCost: 1 })
      expect(credit.id).to.not.be.undefined
    })

    describe('when the position overlaps at the end', () => {

      let credit0
      let credit1
      let credit2

      beforeEach(async () => {
        creditFactory = (await require('./factories')).creditFactory
        credit0 = await creditFactory.create({ position: 0 })
        credit1 = await creditFactory.create({ position: 1 })
        credit2 = await creditFactory.create({ position: 2 })
      })

      it('insert the credit in the correct position', async () => {
        const credit = await creditService.create({ position: 3, credit: 10, smsCost: 1 })

        const credits = await creditFactory.repository.find({
          where: { id: In([credit0.id, credit1.id, credit2.id, credit.id]) },
          order: { position: 'ASC' }
        })
        expect(credits).to.have.lengthOf(4)
        expect(credits[0].id).to.deep.eq(credit0.id)
        expect(credits[1].id).to.deep.eq(credit1.id)
        expect(credits[2].id).to.deep.eq(credit2.id)
        expect(credits[3].id).to.deep.eq(credit.id)
      })
    })

    describe('when the position overlaps in the middle', () => {

      let credit0
      let credit1
      let credit2

      beforeEach(async () => {
        creditFactory = (await require('./factories')).creditFactory
        credit0 = await creditFactory.create({ position: 0 })
        credit1 = await creditFactory.create({ position: 1 })
        credit2 = await creditFactory.create({ position: 2 })
      })

      it('adjusts other credit positions', async () => {
        const credit = await creditService.create({ position: 1, credit: 10, smsCost: 1 })

        const credits = await creditFactory.repository.find({
          where: { id: In([credit0.id, credit1.id, credit2.id, credit.id]) },
          order: { position: 'ASC' }
        })
        expect(credits).to.have.lengthOf(4)
        expect(credits[0].id).to.deep.eq(credit0.id)
        expect(credits[1].id).to.deep.eq(credit.id)
        expect(credits[2].id).to.deep.eq(credit1.id)
        expect(credits[3].id).to.deep.eq(credit2.id)
      })
    })

    describe('when the position overlaps at the start', () => {
      beforeEach(async () => {
        creditFactory = (await require('./factories')).creditFactory
        credit0 = await creditFactory.create({ position: 0 })
        credit1 = await creditFactory.create({ position: 1 })
        credit2 = await creditFactory.create({ position: 2 })
      })

      it('insert the credit in the correct position', async () => {
        const credit = await creditService.create({ position: 0, credit: 10, smsCost: 1 })

        const credits = await creditFactory.repository.find({
          where: { id: In([credit0.id, credit1.id, credit2.id, credit.id]) },
          order: { position: 'ASC' }
        })
        expect(credits).to.have.lengthOf(4)
        expect(credits[0].id).to.deep.eq(credit.id)
        expect(credits[1].id).to.deep.eq(credit0.id)
        expect(credits[2].id).to.deep.eq(credit1.id)
        expect(credits[3].id).to.deep.eq(credit2.id)
      })
    })
  })

  describe('consumeCredit', () => {
    it('consmue the sms', async () => {
      const credit = await creditFactory.create({ position: 0, credit: 10, smsCost: 1 })
      const { smsLeft } = await creditService.consumeCredit(5)
      expect(smsLeft).to.eq(0)
    })

    it('consumes the correct credit', async () => {
      const credit = await creditFactory.create({ position: 0, credit: 10, smsCost: 1 })
      const { usedCredits, smsLeft } = await creditService.consumeCredit(5)
      expect(usedCredits).to.deep.eq([{
        id: credit.id,
        smsUsed: 5,
        credit: 5
      }])
    })

    it('consumes the credits in order', async () => {
      const credit0 = await creditFactory.create({ position: 0, credit: 5, smsCost: 1 })
      const credit1 = await creditFactory.create({ position: 1, credit: 10, smsCost: 2 })
      const { usedCredits } = await creditService.consumeCredit(7)
      expect(usedCredits).to.deep.eq([{
        id: credit0.id,
        smsUsed: 5,
        credit: 0
      },{
        id: credit1.id,
        smsUsed: 2,
        credit: 6
      }])
    })

    it('skips the empty credits', async () => {
      await creditFactory.create({ position: 0, credit: 0, smsCost: 1 })
      const credit = await creditFactory.create({ position: 1, credit: 10, smsCost: 1 })
      const { usedCredits } = await creditService.consumeCredit(5)
      expect(usedCredits).to.deep.eq([{
        id: credit.id,
        smsUsed: 5,
        credit: 5
      }])
    })

    it('consumes the credits in order', async () => {
      const credit0 = await creditFactory.create({ position: 0, credit: 5, smsCost: 1 })
      const credit1 = await creditFactory.create({ position: 1, credit: 10, smsCost: 2 })
      const { usedCredits } = await creditService.consumeCredit(7)
      expect(usedCredits).to.deep.eq([{
        id: credit0.id,
        smsUsed: 5,
        credit: 0
      },{
        id: credit1.id,
        smsUsed: 2,
        credit: 6
      }])
    })
  })

  describe('composeRule', () => {
    let credit

    beforeEach(async () => {
      credit = await creditFactory.create({ credit: 10, smsCost: 2 })
    })

    describe('when not expensive is given', () => {
      const splittable = (c, params) => {
        if(c.credit % params.splitter === 0) { return c.credit / params.splitter }
        else { throw new Error('Cannot split') }
      }

      describe('when respects the rule', () => {
        it('returns the correct value', async () => {
          const response = await creditService.executeOnCredit(
            [notExpensive],
            splittable,
            credit.id,
            { splitter: 2, smsCost: 10, credit: 11 }
          )
          expect(response).to.eq(5)
        })
      })

      describe('when does not respect the rule', () => {
        it('throws an error', async () => {
          await expect(creditService.executeOnCredit(
            [notExpensive],
            splittable,
            credit.id,
            { splitter: 2, smsCost: 1 }
          )).to.be.rejectedWith('Too Costly')
        })
      })
    })

    describe('when multiple rules are given', () => {
      const splittable = (c, params) => {
        if(c.credit % params.splitter === 0) { return c.credit / params.splitter }
        else { throw new Error('Cannot split') }
      }

      describe('when respects the rule', () => {
        it('returns the correct value', async () => {
          const response = await creditService.executeOnCredit(
            [notExpensive, lowBudgetUser],
            splittable,
            credit.id,
            { splitter: 2, smsCost: 10, credit: 11 }
          )
          expect(response).to.eq(5)
        })
      })

      describe('when does not respect any of the rules', () => {
        it('throws an error', async () => {
          await expect(creditService.executeOnCredit(
            [notExpensive, lowBudgetUser],
            splittable,
            credit.id,
            { splitter: 2, smsCost: 1, credit: 11 }
          )).to.be.rejectedWith('Too Costly')

          await expect(creditService.executeOnCredit(
            [notExpensive, lowBudgetUser],
            splittable,
            credit.id,
            { splitter: 2, smsCost: 5, credit: 9 }
          )).to.be.rejectedWith('Too Rich')
        })
      })
    })
  })
})
