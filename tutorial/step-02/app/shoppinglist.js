
'use strict'

let model = null

const shopper = themodel => {
  model = themodel()
}

shopper(require('./shoppinglist.model.js'))
