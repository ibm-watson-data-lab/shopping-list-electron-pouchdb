'use strict'

const { ShoppingListFactory, ShoppingListRepositoryPouchDB } = require('ibm-shopping-list-model')
const shoppingListFactory = new ShoppingListFactory()

let shoppingListRepository = null
let db = null

const model = () => {
  db = new PouchDB('shoppinglist')

  db.info((err, info) => {
    if (err) {
      console.error(err)
    } else {
      console.log('db.info', info)
    }
  })

  shoppingListRepository = new ShoppingListRepositoryPouchDB(db)
  shoppingListRepository.ensureIndexes()
  return model
}

module.exports = model
