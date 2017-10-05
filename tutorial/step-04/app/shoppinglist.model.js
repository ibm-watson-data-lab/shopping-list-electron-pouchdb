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

model.save = doc => {
  if (doc._id) {
    return shoppingListRepository.get(doc._id)
      .then(shoppingList => {
        return shoppingListRepository.put(shoppingList.mergeDeep(doc))
          .catch(console.error)
      })
      .catch(() => {
        return shoppingListRepository.getItem(doc._id)
          .then(shoppingListItem => {
            return shoppingListRepository.putItem(shoppingListItem.mergeDeep(doc))
              .catch(console.error)
          })
      })
  } else if (doc.type === 'list') {
    const shoppingList = shoppingListFactory.newShoppingList({
      title: doc.title
    })
    return shoppingListRepository.put(shoppingList)
      .catch(console.error)
  } else if (doc.type === 'item') {
    const shoppingList = shoppingListFactory.newShoppingList({
      _id: doc.list
    })
    const shoppingListItem = shoppingListFactory.newShoppingListItem({
      title: doc.title
    }, shoppingList)
    return shoppingListRepository.putItem(shoppingListItem)
      .catch(console.error)
  } else {
    return Promise.reject(new Error(`Missing or unsupported type: ${doc.type}`))
  }
}

model.remove = id => {
  if (id) {
    return shoppingListRepository.get(id)
      .then(shoppingList => {
        return shoppingListRepository.delete(shoppingList)
      })
      .catch(() => {
        return shoppingListRepository.getItem(id)
        .then(shoppingListItem => {
          return shoppingListRepository.deleteItem(shoppingListItem)
        })
      })
  } else {
    return Promise.reject(new Error('Missing id'))
  }
}

model.lists = () => {
  return shoppingListRepository.find()
    .then(listOfShoppingLists => {
      return listOfShoppingLists ? listOfShoppingLists.valueSeq().toArray() : []
    })
}

model.items = listid => {
  return shoppingListRepository.findItems({
    selector: {
      type: 'item',
      list: listid
    }
  }).then(listOfShoppingListItems => {
    return listOfShoppingListItems ? listOfShoppingListItems.valueSeq().toArray() : []
  })
}

module.exports = model
