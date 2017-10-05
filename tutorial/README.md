# Shopping List with Electron & PouchDB Tutorial

This document describes how to build your own Offline First shopping list desktop app with Electron and PouchDB in a step-by-step tutorial.

## Table of Contents

* [Prerequisite Knowledge & Skills](#prerequisite-knowledge--skills)
* [Key Concepts](#key-concepts)
* [Initial Set Up](#initial-set-up)
* [Creating the Electron Desktop App](#creating-the-electron-desktop-app)
* [Going Offline](#going-offline)
* [Syncing Data](#syncing-data)
* [Detecting Offline](#detecting-offline)
* [Distributing the App](#distributing-the-app)
* [Summary](#summary)
* [Resources](#resources)

## Prerequisite Knowledge & Skills

A working knowledge of HTML, CSS, and JavaScript is required. This is not a tutorial to learn JavaScript, CSS, or HTML, therefore, some language specific concepts may be used but not discussed in detail. Familiarity with Google Chrome and its web developer tools for debugging your app is also helpful.

A [Node.js](https://nodejs.org/en/) environment with [npm](https://www.npmjs.com/get-npm) is also required for development of the desktop application.

## Key Concepts

The shopping list app is a small desktop application consisting of an HTML file and some CSS and JavaScript files. The desktop app will allow multiple shopping lists to be created (e.g., Groceries, Clothes, etc.) each with a number of shopping list items associated with them (e.g., Bread, Water, etc.).

*Persistance* of the shopping lists and items will be achieved using the in-browser database, [PouchDB](https://pouchdb.com/). Since Electron contains Chromium, PouchDB fits right in. It allows your data to survive between sessions, when disconnected, and also allow the data to be synced to the cloud and thus shared across applications.

At the end of the tutorial you will have created an Offline First desktop application which can be installed on multiple platforms and can then be used with or without an internet connection.

## Initial Set Up

> **Note**: It is recommended you have a code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/)) for working on your web app.

Much of the shopping list app's styling will be provided via [Materialize CSS](http://materializecss.com/getting-started.html), but an additional CSS file (`shoppinglist.css`) will be used for tweaking and replacing some of the styles. Separate JavaScript files- `shoppinglist.model.js` (to handle the storing, updating, etc of data) and `shoppinglist.js` (to control the app and define some of the logic) will be used, along with the [PouchDB](https://pouchdb.com/download.html) JavaScript library and the [ibm-shopping-list-model](https://www.npmjs.com/package/ibm-shopping-list-model) package.

> **Note**: When viewing the code snippets, some previously entered content may be intentionally omitted and replaced with `...` for readability. Refer to the referenced file in the corresponding tutorial step to see the full content.


## Creating the Electron Desktop App

### Creating the Basic Electron Shell

1. Create a new directory for your desktop app
1. Create the [`package.json`](step-01/package.json) and add the initial detail and dependencies for your application:

	```json
	{
		"name": "shopping-list-electron-pouchdb",
		"version": "0.0.1",
		"description": "An Offline First demo of a shopping list using Electron and PouchDB",
		"productName": "Shopping List",
		"main": "main.js",
		"scripts": {
		  "test": "echo \"Error: no test specified\" && exit 1",
		  "start": "electron ."
		}
	}
	```

1. Create the [`main.js`](step-01/main.js) to run your main process which will open a browser load your `index.html`. Also include the code to open the Web Developer Tools via a keyboard shortcut (to help with debugging)

	```js
	const {app, BrowserWindow, globalShortcut} = require('electron')
	const path = require('path')
	const url = require('url')
	
	let win
	
	const createWindow = () => {
		// Create the browser window.
		win = new BrowserWindow({
		  width: 500,
		  height: 900
		})
		
		// short cut to launch web developer tools
		globalShortcut.register('CmdOrCtrl+Shift+d', () => {
		  win.webContents.toggleDevTools()
		})
		
		// load the index.html
		win.loadURL(url.format({
		  pathname: path.join(__dirname, 'app/index.html'),
		  protocol: 'file:',
		  slashes: true
		}))
		
		win.on('closed', () => {
		  win = null
		})
	}
	
	app.on('ready', createWindow)
	
	app.on('will-quit', () => {
		globalShortcut.unregisterAll()
	})
	
	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
		  app.quit()
		}
	})
	
	app.on('activate', () => {
		if (win === null) {
		  createWindow()
		}
	})
	```

1. Create an `app` subdirectory where your app files can be placed.
1. Create an [`index.html`](step-01/app/index.html) in the `app` subdirectory and add the initial HTML markup for your app:

	```html
	<!doctype html>
	<html lang="en">
		<head>
		  <meta charset="utf-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
		
		  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
		  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700">
		  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
		  <link rel="stylesheet" href="shoppinglist.css">
		  
		  <title>Shopping List | Electron | PouchDB</title>
		</head>
		<body>
		
		  <!-- banner -->
		  <header class="navbar-fixed">
		    <nav id="nav" class="primary-color">
		      <div class="nav-wrapper">
		        <span class="brand-logo left">
		          <span id="header-title">Shopping Lists</span>
		        </span>
		      </div>
		    </nav>
		  </header>
		
		  <!-- content area -->
		  <main>
		    <div id="shopping-lists">
		      <!-- shopping lists get inserted here -->
		    </div>
		
		    <ul id="shopping-list-items" class="collection">
		      <!-- shopping list items get inserted here -->
		    </ul>
		  </main>
		</body>
	</html>
	```

1. Create the [`shoppinglist.css`](step-01/app/shoppinglist.css) for styling/customizing your app's look:

	```css
	body {
		background-color: #E1E2E1;
		box-shadow: none !important;
		overflow-x: hidden;
	}
	
	body * {
		box-shadow: none !important;
	}
	
	.primary-color {
		background-color: #52647A !important;
	}
	
	.primary-color * {
		color: #FFFFFF !important;
	}
	
	nav .nav-wrapper {
		padding-left: 10px;
	}
	
	main {
		display: flex;
		margin: 0 auto 75px auto;
		width: 200vw;
	}
	
	#shopping-lists,
	#shopping-list-items  {
		display: inline-block;
		flex: 1;
		margin: 0;
		padding: 0;
		transition-property: transform;
		transition-duration: 0.5s;
	}
	
	#shopping-list-items {
		background-color: #FFFFFF;
		border: 0 none;
		vertical-align: top;
	}
	```

1. Install the Electron module. From a command line prompt (at the root of your application), run the command:

	`npm install --save-dev electron`

1. Launch your Electron desktop application. From the command line prompt, run:

	`npm start`

1. You should see the basic shell of your desktop application. Your code should be similar to [Tutorial - Step 1](step-01) and your app should resemble this:

    ![Step 1 screenshot](resources/step-01.png)

### The PouchDB Database

The shopping list app will be using PouchDB, an in-browser database, for its data store. PouchDB allows your application state to be retained between site visits without needing to send any data to a server-side process. Being in-browser, PouchDB continues to work even when internet connection is not available or reliable.

1. Install the **ibm-shopping-list-model** to define the schema model for shopping lists and shopping list items. From teh command prompt:

	`npm install --save ibm-shopping-list-model`

1. Add the PouchDb library to the [`index.html`](step-02/app/index.html):

	```html
	<!doctype html>
	<html lang="en">
	
		...
	
	    <!-- javascript goodies -->
	    <script src="https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js"></script>
	    <script src="https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.find.min.js"></script>
	    <script src="shoppinglist.js"></script>
	  </body>
	</html>
	```

1. Create the [`shoppinglist.model.js`](step-02/app/shoppinglist.model.js) for handle communication between the shopping list and the model:

	```js
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
	```

1. Create the [`shoppinglist.js`](step-02/app/shoppinglist.js) for controlling the app and defining the app's logic:

	```js
	
	'use strict'
	
	let model = null
	
	const shopper = themodel => {
	  model = themodel()
	}
	
	shopper(require('./shoppinglist.model.js'))
	```


1. Launch your Electron desktop application:

	`npm start`

1. You should see the basic shell again but you can check the Web Developer Tools console and see the database info printed. Your code should be similar to [Tutorial - Step 2](step-02)

> From your app, press **CTRL+Shift+d** (**CMD+Shift+d** on a MAC) to open the Web Developer Tools. Go to the **Console** tab see `console.log` info.


### Creating a Shopping List

The first thing you want to be able to do with a shopping list app is to create new shopping lists and edit or remove existing shopping lists:

1. Update [`index.html`](step-03/app/index.html) to have an **Add** button, the **Create a Shopping List** form, and the template to represent a single shopping list:

	```html
	<!doctype html>
	<html lang="en">
	
		...
		
		<main>
	
			...
	
	      <!-- add more stuff button -->
	      <button id="add-button" class="btn-floating btn-large secondary-color right" onclick="showAddModal()">
	        <i class="material-icons">add</i>
	      </button>
	    </main>
	
	    <!-- modal: add a shopping list form -->
	    <div class="modal bottom-sheet list-bottom-sheet">
	      <form id="shopping-list-add" class="col s12 white" onsubmit="shopper.add(event); return false">
	        <div class="modal-content">
	            <h5>Create a Shopping List</h5>
	              <div class="row">
	                <div class="input-field col s12">
	                  <input name="title" type="text" class="validate" placeholder="Enter a title for the shopping list" required />
	                </div>
	                <input name="type" type="hidden" value="list">
	              </div>
	        </div>
	        <div class="modal-footer primary-color">
	          <button class="btn-flat" type="button" onclick="closeModal()">Cancel</button>
	          <button class="btn-flat" type="submit">Add</button>
	        </div>
	      </form>
	    </div>
	
	    <!-- modal: overlay -->
	    <div class="modal-overlay" onclick="closeModal()"></div>
	
	    <!-- template: shopping list -->
	    <script type="text/template" id="shopping-list-template">
	      <div class="list-view collapsible">
	        <div class="card-content">
	          <span class="card-title activator">{{title}}
	            <button class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
	          </span>
	        </div>
	      </div>
	      <div class="list-edit collapsible closed">
	        <form id="form-{{_sanitizedid}}" class="col s12 white" onsubmit="shopper.update('{{_id}}', event); return false">
	          <div class="card-content">
	            <span class="card-title">
	              <button id="close-{{_sanitizedid}}" type="button" class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">close</i></button>
	            </span>
	            <h5>Edit Shopping List</h5>
	            <div class="row">
	              <div class="input-field col s12">
	                <input name="title" type="text" class="validate" value="{{title}}" placeholder="{{title}}" required />
	              </div>
	            </div>
	          </div>
	          <div class="card-action">
	            <button class="btn-flat" type="button" onclick="shopper.remove('{{_id}}')">Remove</button>
	            <button class="btn-flat" type="submit">Update</button>
	          </div>
	        </form>
	      </div>
	    </script>
	
		...
		
	</html>
	```

1. Append the styling for the button and form to the [`shoppinglist.css`](step-03/app/shoppinglist.css):

	```css
	main #add-button {
	  position: fixed;
	  bottom: 25px;
	  right: 25px;
	}
	
	main .card {
	  margin: 30px;
	}
	
	.secondary-color {
	  background-color: #FF6CA1 !important;
	}
	
	.secondary-color * {
	  color: #000000 !important;
	}
	
	h5 {
	  font-weight: 300;
	}
	
	.btn-flat {
	  color: #7f91A9;
	}
	
	.btn-flat:hover {
	  background-color: rgba(0,0,0,0.1);
	}
	
	input:focus:not([disabled]):not([readonly]) {
	  border-bottom-color: #52647A !important;
	}
	
	body.shopping-list-add .list-bottom-sheet {
	  z-index: 1007;
	  display: block;
	  bottom: 0px;
	  opacity: 1;
		transition-property: bottom;
		transition-duration: .75s;
	}
	
	body.shopping-list-add .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	
	.collapsible {
	  overflow-y: hidden;
	  margin: 0;
		max-height: calc(100vh - 65px);
		transition-property: all;
		transition-duration: .55s;
	}
	
	.collapsible.closed {
		max-height: 0;
		transition-property: all;
		transition-duration: .15s;
	}
	
	.card.collapsible {
		transition-duration: 2s;
	}
	
	.list-edit .card-action {
	  border: 0 none;
	  padding: 0;
	  text-align: right;
	}
	
	.list-edit form {
	  margin: 15px;
	}
	```

1. Add the code in [`shoppinglist.js`](step-03/app/shoppinglist.js) to add, edit, and remove shopping lists:

	```js
	
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
	```

1. Update [`shoppinglists.model.js`](step-03/app/shoppinglist.model.js) to save and retrieve shoppings lists:

	```js
	
	...
	
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
	      .catch(console.error)
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
	
	module.exports = model
	```


1. Relaunch your Electron desktop application:

	`npm start`

1. At this point, you should be able to create and edit shopping lists. Your code should be similar to [Tutorial - Step 3](step-03) and your app should should resemble:

    ![Step 3 screenshot](resources/step-03.png)


### Adding Items to a Shopping List

A shopping list is not complete without the means to add items to the list. Next, you should add the ability to add, edit, remove, check-off items in a shopping list.

1. Similar to the shopping list, the [`index.html`](step-04/app/index.html) should include the **Add an Item** form and the template for a shopping list item:

	```html
	<!doctype html>
	<html lang="en">
	
		...
		
	          <span class="brand-logo left">
	            <a href="#" onclick="showList(); return false" class="goback"><i class="material-icons">arrow_back</i></a>
	            <span id="header-title">Shopping Lists</span>
	          </span>
	
		...
		
	    <!-- modal: add a shopping list item form -->
	    <div class="modal bottom-sheet item-bottom-sheet">
	      <form id="shopping-list-item-add" class="col s12 white" onsubmit="shopper.add(event); return false">
	        <div class="modal-content">
	          <h5>Add an Item</h5>
	          <div class="row">
	            <div class="input-field col s12">
	              <input name="title" type="text" class="validate" placeholder="Enter an item to add to the shopping list" required />
	            </div>
	            <input name="type" type="hidden" value="item">
	          </div>
	        </div>
	        <div class="modal-footer primary-color">
	          <button class="btn-flat" type="button" onclick="closeModal()">Cancel</button>
	          <button class="btn-flat" type="submit">Add</button>
	        </div>
	      </form>
	    </div>
	
	    <!-- modal: overlay -->
	    <div class="modal-overlay" onclick="closeModal()"></div>
	
	    <!-- template: shopping list -->
	    <script type="text/template" id="shopping-list-template">
	      <div class="list-view collapsible">
	        <div class="card-content" onclick="showList('{{_id}}', '{{title}}', event)">
	          <span class="card-title activator">{{title}}
	            <button class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
	          </span>
	        </div>
	      </div>
	      
	      ...
	      
	    </script>
	
	    <!-- template: shopping list item -->
	    <script type="text/template" id="shopping-list-item-template">
	      <div class="item-view collapsible">
	        <input type="checkbox" id="checked-item-{{_sanitizedid}}" name="checked-item-{{_sanitizedid}}" {{_checked}} onclick="shopper.update('{{_id}}')" value="{{title}}" />
	        <label for="checked-item-{{_sanitizedid}}">{{title}}</label>
	        <button class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
	      </div>
	      <div class="item-edit collapsible closed">
	        <form id="form-{{_sanitizedid}}" class="col s12 tertiary lighter" onsubmit="shopper.update('{{_id}}', event); return false">
	          <div>
	            <span class="card-title">
	              <button id="close-{{_sanitizedid}}" type="button" class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">close</i></button>
	            </span>
	            <h5>Edit Item</h5>
	            <div class="row">
	              <div class="input-field col s12">
	                <input name="title" type="text" class="validate" value="{{title}}" placeholder="{{title}}" required />
	              </div>
	            </div>
	          </div>
	          <div class="card-action">
	            <button class="btn-flat" type="button" onclick="shopper.remove('{{_id}}')">Remove</button>
	            <button class="btn-flat" type="submit">Update</button>
	          </div>
	        </form>
	      </div>
	    </script>
	    
	    ...
	    
	</html>
	```

1. The [`shoppinglist.css`](step-04/app/shoppinglist.css) should be updated to include styles for the shopping list items and shopping list item form:

	```css
	
	...
	
	body.shopping-list-add .list-bottom-sheet,
	body.shopping-list-item-add .item-bottom-sheet {
	  z-index: 1007;
	  display: block;
	  bottom: 0px;
	  opacity: 1;
		transition-property: bottom;
		transition-duration: .75s;
	}
	
	body.shopping-list-add .modal-overlay,
	body.shopping-list-item-add .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	
	...
	
	.list-edit .card-action,
	.item-edit .card-action {
	  border: 0 none;
	  padding: 0;
	  text-align: right;
	}
	
	.item-edit form,
	.list-edit form {
	  margin: 15px;
	}
	
	#shopping-list-items .card,
	#shopping-list-items .card .collapsible {
	  border: 0 none;
	  box-shadow: initial;
	}
	
	#shopping-list-items .collection-item {
	  border-bottom: 1px solid #DDDDDD;
	  padding: 30px;
	  margin: 0 35px;
	}
	
	#shopping-list-items .card label {
	  font-size: 20px;
	  font-weight: 300;
	  line-height: initial;
	}
	
	.collection-item input:checked ~ label {
	  text-decoration: line-through;
	}
	
	.collection-item input:checked ~ button {
	  visibility: hidden;
	}
	
	.collection-item input:not(:checked) ~ label {
	  color: #212121;
	}
	
	body[data-list-id] {
	  background-color: #FFFFFF !important;
	}
	
	body[data-list-id] #shopping-lists,
	body[data-list-id] #shopping-list-items {
	  transform: translate(-100vw);
	}
	
	.goback {
	  visibility: hidden;
	}
	
	body[data-list-id] .goback {
	  visibility: initial;
	}
	```

1. The add and update functions in the [`shoppinglist.js`](step-04/app/shoppinglist.js) need to updated to account for adding/updating of shopping list items. In addition, a **showList** function should be created to handle navigating between shopping lists and shopping list items:

	```js
	
	...
	
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
	  }
	}
	
	...
	
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
	
	...
	
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
	
	...
	
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
	
	...
	
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
	
	...
	
	```

1. Update the [`shoppinglist.model.js`](step-04/app/shoppinglist.model.js) functions to properly handle the saving, retrieving, and updating of shopping list items:

	```js
	
	...
	
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
	
	...
	
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
	```

1. Relaunch your app to view the latest version. You should be able to add, edit, remove, and check off shopping list items for your shopping lists. Your code should be similar to [Tutorial - Step 4](step-04) and your app should resemble:

    ![Step 4 screenshot](resources/step-04.png)


### Updating Shopping List Items Count

A much needed functionality to make the app feel closer to completion and improve user expereince is to be able to see the number of (checked and total) items in a shopping list without having to go into the shopping list. You should now add an items count to be shown for each shopping list:

1. In the [`index.html`](step-05/app/index.html), the shopping list template should be updated to include a `div` for the item count info:

	```html
	<!doctype html>
	<html lang="en">
	
	...
	
	    <!-- template: shopping list -->
	    <script type="text/template" id="shopping-list-template">
	      <div class="list-view collapsible">
	        <div class="card-content" onclick="showList('{{_id}}', '{{title}}', event)">
	          <span class="card-title activator">{{title}}
	            <button class="btn-flat more-btn right" onclick="toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
	          </span>
	        </div>
	        <div class="card-action">
	          <input type="checkbox" id="checked-list-{{_sanitizedid}}" name="checked-list-{{_sanitizedid}}" {{_checked}} disabled />
	          <label for="checked-list-{{_sanitizedid}}">0 items in list</label>
	        </div>
	      </div>
	 
	...
	
	</html>
	```

1. Style for the item count should be appended to the [`shoppinglist.css`](step-05/app/shoppinglist.css):

	```css
	[type="checkbox"]:disabled:not(:checked) + label::before {
	  display: none;
	}
	```

1. A function to compute the item counts needs to added to [`shoppinglist.js`](step-05/app/shoppinglist.js) and the add and remove functions updated accordingly:

	```js
	
	...
	
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
	
	...
	
	```

1. The [`shoppinglist.model.js`](step-05/app/shoppinglist.js) should provide a **count** to return the items count for a list:

	```js
	
	...
	
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
	
	module.exports = model
	```
	
1. Relaunch your app to view the updates. Shopping lists should now display with an items count which should update when items gets add, removed, or checked. Your code should be similar to [Tutorial - Step 5](step-05) and your app should resemble:

    ![Step 5 screenshot](resources/step-05.png)



## Going Offline

At this stage, you have a full functioning shopping list desktop application. However, it is not very helpful if you have no internet connection.

Try it! 

* Close your application
* Delete the Electron app cache
	* Windows: `C:\Users\<user>\AppData\Roaming\<yourAppName>`
	* Linux: `/home/<user>/.config/<yourAppName>`
	* OS X: `/Users/<user>/Library/Application Support/<yourAppName>`
* Disconnect from the network
* Launch your shopping list app

It is not very usable. To remedy this you want to package all required assets with your application:

1. From a command line prompt (at the root of your app), install the modules for the required assets:

	`npm install --save materialize-css pouchdb-browser pouchdb-find`

1. Download the [Material Design icon font](https://github.com/google/material-design-icons/tree/master/iconfont) and corresponding CSS. See [iconfont](step-06/app/iconfont)

1. Update [`index.html`](step-06/app/index.html) to reference the local CSS assets and remove the PouchDB libraries script tag:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">

    <link rel="stylesheet" href="iconfont/material-icons.css">
    <link rel="stylesheet" href="../node_modules/materialize-css/dist/css/materialize.min.css">
    <link rel="stylesheet" href="shoppinglist.css">
    
    <title>Shopping List | Electron | PouchDB</title>
  </head>
  <body>
  
  ...
  
    <!-- javascript goodies -->
    <script src="shoppinglist.js"></script>
  </body>
</html>
```

1. Update [`shoppinglist.model.js`](step-06/app/steppinglist.model.js) to use the PouchDB modules installed via NPM:

```js
'use strict'

const { ShoppingListFactory, ShoppingListRepositoryPouchDB } = require('ibm-shopping-list-model')
const shoppingListFactory = new ShoppingListFactory()
const PouchDB = require('pouchdb-browser')
PouchDB.plugin(require('pouchdb-find'))

let shoppingListRepository = null
let db = null

...

```

1. Clear it's cache and relaunch your app again with no internet connection. It should be a much improved experience. Your code should be similar to [Tutorial - Step 6](step-06).

That's it! You have yourself an Offline desktop application that can continue to function when internet connection is unavailable or unreliable.


## Syncing Data

Although your shopping list desktop app can now function offline, it is not yet fully complete. Currently, if you use your app on different machines, each instance will have its own set of data. Not an ideal situation if you want to share or access your shopping lists across browsers and devices.

With PouchDB, it is very simple to sync to a remote database for backup or data-sharing purposes. In the above scenario, if the app on each machine is configured to the same remote database, you can then have access to same shopping list no matter where you access it from.

1. Add a settings button and form to the [`index.html`](step-07/app/index.html):

	```js
	<!doctype html>
	<html lang="en">
	
		...
		
	    <header class="navbar-fixed">
	      <nav id="nav" class="primary-color">
	        <div class="nav-wrapper">
	          <span class="brand-logo left">
	            <a href="#" onclick="showList(); return false" class="goback"><i class="material-icons">arrow_back</i></a>
	            <span id="header-title">Shopping Lists</span>
	          </span>
	          <!-- settings button -->
	          <a href="#" onclick="showSettingsModal(); return false" class="right settings"><i class="material-icons">settings</i></a>
	        </div>
	      </nav>
	    </header>
	    
	    ...
	    
	    <!-- modal: add a shopping list settings form -->
	    <div class="modal top-sheet settings-top-sheet">
	      <form id="shopping-list-settings" class="col s12 white" onsubmit="shopper.settings(event); return false">
	        <div class="modal-content">
	            <h5>Shopping Lists Settings</h5>
	              <div class="row">
	                <div class="input-field col s12">
	                  <span class="primary-text darker">Enter a fully qualified URL (including username and password) to a remote IBM Cloudant, Apache CouchDB, or PouchDB database to sync your shopping list.</span>
	                  <input name="remoteDB" type="url" class="validate" placeholder="https://username:password@localhost:5984/database" />
	                  <div class="chip"></div>
	                </div>
	              </div>
	        </div>
	        <div class="modal-footer secondary-color">
	          <button class="btn-flat" type="button" onclick="closeModal()">Cancel</button>
	          <button class="btn-flat" type="submit">Sync</button>
	        </div>
	      </form>
	    </div>
	
	    <!-- modal: overlay -->
	    <div class="modal-overlay" onclick="closeModal()"></div>
	    
	    ...
	    
	</html>
	```

1. Add the styles for the settings form and syncing indicator in the [`shoppinglist.css`](step-07/app/shoppinglist.css):

	```css
	
	...
	
	body.shopping-list-add .modal-overlay,
	body.shopping-list-item-add .modal-overlay,
	body.shopping-list-settings .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	
	...
	
	.modal.top-sheet {
	  bottom: auto;
	  top: -100%;
	  margin: 0;
	  width: 100%;
	  border-radius: 0;
	  will-change: bottom, opacity;
	}
	
	body.shopping-list-settings .settings-top-sheet {
	  z-index: 1007;
	  display: block;
	  top: 0px;
	  opacity: 1;
	  transition-property: top;
	  transition-duration: .75s;
	}
	
	.settings {
	  margin-right: 25px;
	}
	
	#shopping-list-settings .input-field {
	  margin-top: 2.2rem;
	}
	
	#shopping-list-settings label {
	  font-size: 1.2rem;
	  top: -20px;
	}
	
	#shopping-list-settings .chip {
	  display: none;
	  font-weight: 300;
	}
	
	.shopping-list-error-sync #shopping-list-settings .chip {
	  display: inline-block;
	  background-color: #C83873;
	  color: #FFFFFF;
	}
	
	.shopping-list-error-sync #shopping-list-settings .chip::after {
	  content: 'Sync Error';
	}
	
	.shopping-list-sync #shopping-list-settings .chip {
	  display: inline-block;
	  background-color: #273A4E;
	  color: #FFFFFF;
	}
	
	.shopping-list-sync #shopping-list-settings .chip::after {
	  content: 'Syncing';
	}
	
	.shopping-list-sync nav a.settings > i {
	  display: inline-block;
	  animation-name: spinanimation;
	  animation-duration: 0.7s;
	  animation-timing-function: linear;
	  animation-iteration-count: infinite;
	}
	
	@-webkit-keyframes spinanimation {
	  from { -webkit-transform: rotate(0deg) }
	  to { -webkit-transform: rotate(360deg) }
	}
	@-moz-keyframes spinanimation {
	  from { -moz-transform: rotate(0deg) }
	  to { -moz-transform: rotate(360deg) }
	}
	@-ms-keyframes spinanimation {
	  from { -ms-transform: rotate(0deg) }
	  to { -ms-transform:rotate(360deg) }
	}
	@keyframes spinanimation {
	  from { transform: rotate(0deg) }
	  to { transform: rotate(360deg) }
	}
	```

1. In [`shoppinglist.js`](step-07/app/shoppinglist.js), define the settings and syncing functions:

	```js
	
	...
	
	const closeModal = () => {
	  document.body.className = document.body.className
	    .replace('shopping-list-add', '')
	    .replace('shopping-list-item-add', '')
	    .replace('shopping-list-settings', '')
	    .trim()
	}
	
	...
	
	const showSettingsModal = () => {
	  const form = document.getElementById('shopping-list-settings')
	  form.reset()
	
	  for (let setting in shopper.settings) {
	    if (form.elements.hasOwnProperty(setting)) {
	      const input = document.querySelector('form#shopping-list-settings [name=' + setting + ']')
	      input.value = shopper.settings[setting]
	    }
	  }
	
	  document.body.className += ' ' + form.id
	}
	
	const shopper = themodel => {
	  model = themodel()
	  // get settings
	  model.settings()
	    .then(settings => {
	      for (let setting in settings) {
	        shopper.settings[setting] = settings[setting]
	      }
	      return shopper.settings
	    })
	    .catch(console.error)
	    .then(() => {
	      shopper.sync(() => {
	        console.log('shopper ready!')
	      })
	    })
	}
	
	...
	
	shopper.settings = event => {
	  const form = event.target
	  const elements = form.elements
	  let doc = {}
	  let updated = false
	
	  for (let i = 0; i < elements.length; i++) {
	    if (elements[i].tagName.toLowerCase() !== 'button') {
	      if (shopper.settings[elements[i].name] !== elements[i].value) {
	        updated = true
	      }
	      doc[elements[i].name] = shopper.settings[elements[i].name] = elements[i].value
	    }
	  }
	
	  model.settings(updated ? doc : null)
	    .then(settings => {
	      shopper.sync(closeModal)
	    })
	    .catch(console.error)
	}
	
	shopper.sync = callback => {
	  const complete = (error, response) => {
	    document.body.className = document.body.className.replace('shopping-list-sync', '').trim()
	    document.body.removeAttribute('data-list-id')
	
	    if (error) {
	      document.body.className += ' shopping-list-error-sync'
	      console.error(error)
	    }
	
	    model.lists()
	      .then(lists => {
	        addToDOM(lists, true)
	        callback()
	      })
	      .catch(console.error)
	  }
	
	  const change = (err, docs) => {
	    if (err) {
	      document.body.className += ' shopping-list-error-sync'
	      console.error(err)
	    } else {
	      if (document.body.className.indexOf('shopping-list-error-sync') !== -1) {
	        document.body.className = document.body.className.replace('shopping-list-error-sync', '').trim()
	      }
	      let updates = []
	      for (let i = 0; i < docs.length; i++) {
	        if (docs[i]._deleted) {
	          removeFromDOM(docs[i]._id)
	        } else {
	          updates.push(docs[i])
	        }
	      }
	      addToDOM(updates)
	    }
	  }
	
	  if (shopper.settings.remoteDB) {
	    document.body.className = document.body.className.replace('shopping-list-error-sync', '').trim()
	    document.body.className += ' shopping-list-sync'
	    model.sync(shopper.settings.remoteDB, change)
	      .then(info => {
	        complete(null, info)
	      }).catch(err => {
	        complete(err)
	      })
	  } else {
	    model.sync()
	      .then(info => {
	        complete(null, info)
	      }).catch(err => {
	        complete(err)
	      })
	  }
	}
	
	shopper(require('./shoppinglist.model.js'))
	```

1. Adding the settings and syncing functions to the [`shoppinglist.model.js`](step-07/app/shoppinglist.model.js):

	```js
	
	...
	
	let shoppingListRepository = null
	let db = null
	let dbsync = null
	
	...
	
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
	```
	
1. Relaunch your app to view the completed shopping list. The app should now have a settings button you can click to go to the settings form and configure the URL to the remote database. Your code should be similar to [Tutorial - Step 7](step-07) and your app should resemble:

    ![Step 7 screenshot](resources/step-07.png)


### Remote Databases

PouchDB can sync with a remote Apache CouchDB, IBM Cloudant, or PouchDB database. In the settings form, enter the URL of a remote CouchDB, Cloudant or PouchDB database. For example:

`https://user:pass@host.cloudant.com/shopping`

and click the **Sync** button.


## Detecting Offline


1. Update the [`index.html`](step-08/app/index.html) to include sync error indicator and the script to listen to online status:

```html
<!doctype html>
<html lang="en">

...

    <header class="navbar-fixed">
      <nav id="nav" class="primary-color">
        <div class="nav-wrapper">
          <span class="brand-logo left">
            <a href="#" onclick="showList(); return false" class="goback"><i class="material-icons">arrow_back</i></a>
            <span id="header-title">Shopping Lists</span>
          </span>
          <!-- settings button -->
          <a href="#" onclick="showSettingsModal(); return false" class="right settings"><i class="material-icons">settings</i></a>
          <a href="#" onclick="showSettingsModal(); return false" class="right settings"><i class="material-icons secondary-text lighter">error</i></a>
        </div>
      </nav>
    </header>

...

    <!-- javascript goodies -->
    <script>
      const onlineStatusUpdate = function () {
        if (navigator.onLine) {
          document.body.className = document.body.className.replace('shopping-list-offline', '').trim()
        } else {
          document.body.className += ' shopping-list-offline'
        }
      }

      window.addEventListener('online',  onlineStatusUpdate)
      window.addEventListener('offline',  onlineStatusUpdate)
      onlineStatusUpdate()
    </script>
    <script src="shoppinglist.js"></script>
  </body>
</html>
```

1. Append the styles for the sync error and offline status in the [`shoppinglist.css`](step-08.png/app/shoppinglist.css):

```css
body.shopping-list-error-sync nav a.settings:first-of-type,
body:not(.shopping-list-error-sync) nav a.settings:last-of-type  {
  display: none;
}

body:not(.shopping-list-error-sync) nav a.settings:first-of-type,
body.shopping-list-error-sync nav a.settings:last-of-type  {
  display: initial;
}

body.shopping-list-offline .primary-color,
body.shopping-list-offline .secondary-color {
  background-color: #273A4E !important;
}
body.shopping-list-offline .primary-color *,
body.shopping-list-offline .secondary-color * {
  color: #E1E2E1 !important;
}
```
	
1. Relaunch your app to view the recent updates. Now the app should show an error icon when sync fails and also change color if offline is detected. Your code should be similar to [Tutorial - Step 8](step-08) and your app should resemble:

    ![Step 8 screenshot](resources/step-08.png)


## Distributing the App

Your shopping list desktop application is ready packaged. You can now build your app and distribute it to user to install and run in their machines like any other native desktop application. Depending on your target platform(s), you can find instructions on packaging your app in the [Electron Application Distribution guide](https://electron.atom.io/docs/tutorial/application-distribution/).


## Summary

In this tutorial, you have created a shopping list desktop app using Electron. It stores its data in an in-browser database. It can be used offline and also sync with remote databases.

The final version of the code can be found [here](https://github.com/ibm-watson-data-lab/shopping-list-electron-pouchdb). This version adds some extra features not included in the tutorial:

* Shopping lists are sorted on load by most recently updated
* Shopping list items are sorted on load by title


## Resources

* [Offline First](http://offlinefirst.org/)
* [Electron](https://electron.atom.io/)
* [PouchDB](https://pouchdb.com/)
* [Apache CouchDB](https://couchdb.apache.org/)
* [IBM Cloudant](https://cloudant.com/)
* [Materialize CSS](http://materializecss.com/getting-started.html)
