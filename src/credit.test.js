const chai = require('chai')
const expect = chai.expect
const { In } = require('typeorm')

require('./index')

describe('Credit service', () => {
  let creditFactory
  let creditService

  beforeEach(async () => {
    creditService = await require('./credit')()
  })

  describe('create', () => {
    it('creates a credit', async () => {
      const credit = await creditService.create({ position: 0, credit: 10 })
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
        const credit = await creditService.create({ position: 3, credit: 10 })

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
        const credit = await creditService.create({ position: 1, credit: 10 })

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
        const credit = await creditService.create({ position: 0, credit: 10 })

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
})
