
'use strict'

let model = null

// make doc id friendlier for using as DOM node id
const sanitize = id => {
  return id.replace(/[:.]/gi, '-')
}

// add docs to DOM node list
const addToDOM = (docs) => {
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i]

    const isList = doc.type === 'list' || doc._id.indexOf('list:') === 0
    let shoppinglists = null

    if (isList) {
      shoppinglists = document.getElementById('shopping-lists')
    } else {
      continue
    }

    doc._sanitizedid = sanitize(doc._id)

    let template = document.getElementById('shopping-list-template').innerHTML
    template = template.replace(/\{\{(.+?)\}\}/g, ($0, $1) => {
      let fields = ($1).split('.')
      let value = doc
      while (fields.length) {
        if (value[fields[0]]) {
          value = value[fields.shift()]
        } else {
          value = null
          break
        }
      }
      return value || ''
    })

    let listdiv = document.createElement('div')
    listdiv.id = doc._sanitizedid
    listdiv.className = 'card collapsible'
    listdiv.innerHTML = template

    const existingdiv = document.getElementById(doc._sanitizedid)
    if (existingdiv) {
      shoppinglists.replaceChild(listdiv, existingdiv)
    } else {
      shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
    }
  }
}

// remove from DOM node list
const removeFromDOM = id => {
  let list = document.getElementById(sanitize(id))
  toggle(list)
  list.parentElement.removeChild(list)
}

const showAddModal = () => {
  let form = document.getElementById('shopping-list-add')
  form.reset()
  document.body.className += ' ' + form.id
}

const closeModal = () => {
  document.body.className = document.body.className
    .replace('shopping-list-add', '')
    .trim()
}

const toggle = (node, event) => {
  if (event) {
    event.stopPropagation()
  }

  if (typeof node === 'string') {
    const nodes = document.querySelectorAll('#' + node + ' .collapsible')
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].classList) {
        nodes[i].classList.toggle('closed')
      }
    }
  } else {
    node.classList.toggle('closed')
  }
}

const shopper = themodel => {
  model = themodel()

  model.lists()
    .then(lists => {
      addToDOM(lists)
    })
    .catch(console.error)
}

shopper.add = event => {
  const form = event.target
  const elements = form.elements
  let doc = {}

  if (!elements['title'].value) {
    console.error('title required')
  } else {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].tagName.toLowerCase() !== 'button') {
        doc[elements[i].name] = elements[i].value
      }
    }

    model.save(doc)
      .then(updated => {
        doc._id = doc._id || updated._id || updated.id
        addToDOM([doc])
        closeModal()
      })
      .catch(console.error)
  }
}

shopper.remove = id => {
  model.remove(id)
    .then(removed => {
      removeFromDOM(id)
    })
    .catch(console.err)
}

shopper.update = id => {
  let elements = document.getElementById('form-' + sanitize(id)).elements
  if (!elements['title'].value) {
    console.error('title required')
  } else {
    let doc = {
      '_id': id,
      'title': elements['title'].value,
      'type': 'list'
    }
    model.save(doc)
      .then(updated => {
        addToDOM([updated])
      })
      .catch(console.error)
  }
}

shopper(require('./shoppinglist.model.js'))
