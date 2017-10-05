'use strict'

const { ShoppingListFactory, ShoppingListRepositoryPouchDB } = require('ibm-shopping-list-model')
const shoppingListFactory = new ShoppingListFactory()
const PouchDB = require('pouchdb-browser')
PouchDB.plugin(require('pouchdb-find'))

let shoppingListRepository = null
let db = null
let dbsync = null

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

model.count = id => {
  return shoppingListRepository.findItemsCountByList()
    .then(itemsCount => {
      return itemsCount.get(id) || 0
    })
    .then(total => {
      return shoppingListRepository.findItemsCountByList({
        selector: {
          type: 'item',
          checked: true
        },
        fields: [ 'list' ]
      })
      .then(checkedCount => {
        return [checkedCount.get(id) || 0, total]
      })
    })
}

model.settings = settings => {
  const id = '_local/user'

  return db.get(id)
    .then(doc => {
      if (settings && typeof settings === 'object') {
        settings._id = id
        settings._rev = doc._rev
        return db.put(settings)
      } else {
        return doc
      }
    })
    .catch(err => {
      console.warn(err)
      if (settings) {
        settings._id = id
      } else {
        settings = {
          _id: '_local/user'
        }
      }
      return db.put(settings)
    })
}

model.sync = (remoteDB, onchange) => {
  if (dbsync) {
    dbsync.cancel()
  }

  if (remoteDB) {
    return new Promise((resolve, reject) => {
      // do one-off sync from the server until completion
      db.sync(remoteDB)
        .on('complete', info => {
          // handleResponse(null, info, oncomplete, 'model.sync.complete')
          // then two-way, continuous, retriable sync
          dbsync = db.sync(remoteDB, { live: true, retry: true })
            .on('change', info => {
              // incoming changes only
              if (info.direction === 'pull' && info.change && info.change.docs && typeof onchange === 'function') {
                onchange(null, info.change.docs)
              }
            })
            .on('error', err => {
              console.warn(err)
              if (typeof onchange === 'function') {
                onchange(err)
              }
            })

          return resolve(info)
        })
        .on('error', err => {
          return reject(err)
        })
    })
  } else {
    return Promise.resolve()
  }
}

module.exports = model
