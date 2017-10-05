
'use strict'

let model = null

// make doc id friendlier for using as DOM node id
const sanitize = id => {
  return id.replace(/[:.]/gi, '-')
}

// add docs to DOM node list
const addToDOM = (docs, clear) => {
  if (clear) {
    if (document.body.getAttribute('data-list-id')) {
      document.getElementById('shopping-list-items').innerHTML = ''
    } else {
      document.getElementById('shopping-lists').innerHTML = ''
    }
  }

  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i]

    const isItem = doc.type === 'item' || doc._id.indexOf('item:') === 0
    const isList = doc.type === 'list' || doc._id.indexOf('list:') === 0
    let shoppinglists = null

    if (isList) {
      shoppinglists = document.getElementById('shopping-lists')
    } else if (isItem) {
      shoppinglists = document.getElementById('shopping-list-items')
    } else {
      continue
    }

    doc._sanitizedid = sanitize(doc._id)
    doc._checked = doc.checked ? 'checked="checked"' : ''

    let template = document.getElementById(isItem ? 'shopping-list-item-template' : 'shopping-list-template').innerHTML
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

    let listdiv = document.createElement(isItem ? 'li' : 'div')
    listdiv.id = doc._sanitizedid
    listdiv.className = 'card ' + (isItem ? 'collection-item' : 'collapsible')
    listdiv.innerHTML = template

    const existingdiv = document.getElementById(doc._sanitizedid)
    if (existingdiv) {
      shoppinglists.replaceChild(listdiv, existingdiv)
    } else {
      shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
    }

    if (isItem) {
      updateItemCount(doc.list)
    } else {
      updateItemCount(doc._id)
    }
  }
}

// remove from DOM node list
const removeFromDOM = id => {
  let list = document.getElementById(sanitize(id))
  toggle(list)
  list.parentElement.removeChild(list)

  var listid = document.body.getAttribute('data-list-id')
  if (listid) {
    updateItemCount(listid)
  }
}

// figure out the checked items count for a list
const updateItemCount = listid => {
  model.count(listid)
    .then(counts => {
      let node = document.getElementById('checked-list-' + sanitize(listid))
      if (node) {
        node.nextElementSibling.innerText = counts[1] ? (counts[0] + ' of ' + counts[1] + ' items checked') : '0 items'
        node.checked = counts[0] && counts[0] === counts[1]
      }
    })
    .catch(console.error)
}

const showAddModal = () => {
  let form = null
  if (document.body.getAttribute('data-list-id')) {
    form = document.getElementById('shopping-list-item-add')
  } else {
    form = document.getElementById('shopping-list-add')
  }
  form.reset()
  document.body.className += ' ' + form.id
}

const closeModal = () => {
  document.body.className = document.body.className
    .replace('shopping-list-add', '')
    .replace('shopping-list-item-add', '')
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

const showList = (listid, title, event) => {
  if (event) {
    event.stopPropagation()
  }
  if (listid) {
    model.items(listid)
      .then(items => {
        document.getElementById('header-title').innerText = title
        document.body.setAttribute('data-list-id', listid)
        document.body.scrollTop = 0
        items.sort((a, b) => {
          return a.title < b.title
        })
        addToDOM(items, true)
      })
      .catch(err => {
        console.error(err)
      })
  } else {
    const listId = document.body.getAttribute('data-list-id')
    document.body.removeAttribute('data-list-id')
    document.getElementById('header-title').innerText = 'Shopping Lists'
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
  const listid = document.body.getAttribute('data-list-id')

  if (!elements['title'].value) {
    console.error('title required')
  } else if (listid && form.id.indexOf('list-item') === -1) {
    console.error('incorrect form')
  } else if (!listid && form.id.indexOf('list-item') > -1) {
    console.error('list id required')
  } else {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].tagName.toLowerCase() !== 'button') {
        doc[elements[i].name] = elements[i].value
      }
    }

    if (listid) {
      doc['list'] = listid
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
  const listid = document.body.getAttribute('data-list-id')
  let elements = document.getElementById('form-' + sanitize(id)).elements

  if (!elements['title'].value) {
    console.error('title required')
  } else {
    let doc = {
      '_id': id,
      'title': elements['title'].value,
      'type': listid ? 'item' : 'list'
    }

    if (listid) {
      const checked = document.getElementById('checked-item-' + sanitize(id))
      doc.list = listid
      doc.checked = checked ? !!checked.checked : false
    }

    model.save(doc)
      .then(updated => {
        addToDOM([updated])
      })
      .catch(console.error)
  }
}

shopper(require('./shoppinglist.model.js'))
