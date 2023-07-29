import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let path = decodeURI(window.location.pathname).split("/")
window.history.replaceState({ user: path[1].toLowerCase() }, undefined)
axios.post("/find", { user: window.history.state.user }).then(function(response) {
  for (let index in response.data[0]) {
    users[response.data[0][index].user] = []
    descriptions[response.data[0][index].user] = response.data[0][index].description
  }
  if (users[window.history.state.user]) {
    redirect(response.data[1], path)
  } else {
    window.history.replaceState({}, undefined, "/")
  }
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <App />
  </react.StrictMode>)
})
let users = {}
let descriptions = {}
let state = {}
let authenticated
let account
let search = ""
let item
let overlay
axios.defaults.headers.user = localStorage.user
axios.defaults.headers.token = localStorage.token
let traveler
let high
let low
let destroyed
let imported = false
let deleting
let password
window.addEventListener("popstate", function() {
  render("City")
})
function redirect(items, path) {
  window.history.replaceState({ user: window.history.state.user, index: 0, name: window.history.state.user, children: [], end: [] }, undefined, "/" + window.history.state.user)
  users[window.history.state.user] = [window.history.state]
  for (let index in items) {
    items[index].children = []
    items[index].end = []
    users[window.history.state.user][items[index].index] = items[index]
  }
  for (let index in users[window.history.state.user]) {
    if (index !== "0") {
      users[window.history.state.user][users[window.history.state.user][index].parent].children[index] = true
      users[window.history.state.user][users[window.history.state.user][index].parent].end[users[window.history.state.user][index].order] = true
    }
  }
  for (let index in users[window.history.state.user]) {
    users[window.history.state.user][index].end = users[window.history.state.user][index].end.length
  }
  let index = 1
  let parent = 0
  while (path[++index]) {
    for (let index2 in users[window.history.state.user][parent].children) {
      if (users[window.history.state.user][index2].name === path[index] && !users[window.history.state.user][index2].address) {
        window.history.replaceState(users[window.history.state.user][index2], undefined, window.location.pathname + "/" + path[index])
        parent = index2
        break
      }
    }
  }
}
function render(component) {
  state[component][1]({})
}
function onClick(event) {
  if (event.target === event.currentTarget) {
    overlay = undefined
    render("Overlay")
  }
}
function mismatch(error, password, confirm) {
  alert(error)
  password.value = ""
  confirm.value = ""
  password.focus()
}
function onDragStart(index) {
  traveler = index
  for (let index in users[window.history.state.user][window.history.state.index].children) {
    users[window.history.state.user][index].origin = users[window.history.state.user][index].order
  }
}
function onDragOver(event, index) {
  if (authenticated && (index !== undefined || !traveler)) {
    event.preventDefault()
    let box = event.target.getBoundingClientRect()
    let mouse = 4 * event.clientY
    high = 3 * box.top + box.bottom > mouse
    low = box.top + 3 * box.bottom < mouse
    if (traveler) {
      event.preventDefault()
      let origin = users[window.history.state.user][traveler].order
      let destination = users[window.history.state.user][index].order
      let direction = Math.sign(origin - destination)
      if (users[window.history.state.user][index].address || (high && direction === 1) || (low && direction === -1)) {
        shift(origin - direction, direction, destination)
        users[window.history.state.user][traveler].order = destination
        render("Items")
      }
    }
  }
}
function onDrop(event, index) {
  if (authenticated) {
    event.preventDefault()
    if (traveler) {
      if (index !== traveler && index !== undefined) {
        users[window.history.state.user][traveler].order = users[window.history.state.user][index].end++
        users[window.history.state.user][traveler].parent = index
        axios.put("/itemsUpdate", users[window.history.state.user][traveler])
        delete users[window.history.state.user][window.history.state.index].children[traveler]
        for (let index in users[window.history.state.user][window.history.state.index].children) {
          users[window.history.state.user][index].order = users[window.history.state.user][index].origin
        }
        users[window.history.state.user][index].children[traveler] = true
        traveler = undefined
      }
    } else {
      let address = event.dataTransfer.getData("text")
      if (address.startsWith("http")) {
        let order
        if (users[window.history.state.user][window.history.state.index].children[index] && (users[window.history.state.user][index].address || high || low)) {
          order = users[window.history.state.user][index].order
          if (low && !users[window.history.state.user][index].address) {
            ++order
          }
          shift(users[window.history.state.user][window.history.state.index].end++, 1, order)
        } else if (index === undefined) {
          order = users[window.history.state.user][window.history.state.index].end++
        }
        if (order === undefined) {
          item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: index, order: users[window.history.state.user][index].end++, address: address }
          users[window.history.state.user][index].children[users[window.history.state.user].length] = true
        } else {
          item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: window.history.state.index, order: order, address: address }
          users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
          imported = String(users[window.history.state.user].length)
        }
        users[window.history.state.user].push(item)
        arrange(item)
      }
    }
    render("Items")
  }
}
function onDragEnd() {
  if (traveler) {
    arrange()
    traveler = undefined
  }
}
function shift(origin, direction, destination) {
  for (let index in users[window.history.state.user][window.history.state.index].children) {
    if ((Math.sign(users[window.history.state.user][index].order - origin) !== direction) && (Math.sign(destination - users[window.history.state.user][index].order) !== direction)) {
      users[window.history.state.user][index].order += direction
    }
  }
}
function arrange(item) {
  let indices = []
  let orders = []
  for (let index in users[window.history.state.user][window.history.state.index].children) {
    indices.push(index)
    orders.push(users[window.history.state.user][index].order)
  }
  axios.put("/createUpdate", { item: item, indices: indices, orders: orders })
}
function destroy(parent) {
  for (let index in users[window.history.state.user][parent].children) {
    destroy(index)
  }
  destroyed.push(parent)
}
function reject(password) {
  alert("Incorrect password.")
  password.value = ""
  password.focus()
}
function App() {
  state.App = react.useState()
  return <>
    <City />
    <Overlay />
  </>
}
function City() {
  state.City = react.useState()
  let user = react.useRef()
  let password = react.useRef()
  let confirm = react.useRef()
  if (window.history.state.user) {
    if (window.history.state.name) {
      authenticated = window.history.state.user === localStorage.user
      search = ""
      return <Main />
    }
    axios.post("/itemsFind", { user: window.history.state.user }).then(function(response) {
      redirect(response.data, decodeURI(window.location.pathname).split("/"))
      render("City")
    })
  }
  document.title = "Bookmark City"
  let create
  if (localStorage.user) {
    account = <Account />
  } else {
    account = <div>
      <button onClick = {function() {
        overlay = <About />
        render("Overlay")
      }}>
        about Bookmark City
      </button>
    </div>
    create = <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      user.current.value = user.current.value.trim().replaceAll(/[?/%\\]/g, "").toLowerCase()
      if (user.current.value) {
        if (users[user.current.value]) {
          alert("Name must be unique.")
          user.current.focus()
        } else if (password.current.value === confirm.current.value) {
          window.history.pushState({ user: user.current.value, index: 0, name: user.current.value, children: [], end: 0 }, undefined, "/" + user.current.value)
          axios.post("/create", { user: user.current.value, password: password.current.value }).then(function(response) {
            localStorage.token = response.data
            axios.defaults.headers.token = localStorage.token
          })
          users[user.current.value] = [window.history.state]
          localStorage.user = user.current.value
          axios.defaults.headers.user = localStorage.user
          render("City")
        } else {
          mismatch("Password and confirm password must be the same.", password.current, confirm.current)
        }
      } else {
        user.current.focus()
      }
    }}>
      <input ref = {user} placeholder = {"name"} />
      <input ref = {password} placeholder = {"password"} type = {"password"} />
      <input ref = {confirm} placeholder = {"confirm password"} type = {"password"} />
      <button>
        create
      </button>
    </form>
  }
  let terms = search.toUpperCase().split(" ")
  let city = []
  loop: for (let index in users) {
    let user = index.toUpperCase()
    let description = descriptions[index]?.toUpperCase()
    for (let index in terms) {
      if (!(user.includes(terms[index]) || description?.includes(terms[index]))) {
        continue loop
      }
    }
    city.push(<button key = {index} className = {"folder"} onClick = {function() {
      let path = "/" + index
      if (users[index]?.[0]) {
        window.history.pushState(users[index][0], undefined, path)
      } else {
        window.history.pushState({ user: index }, undefined, path)
      }
      render("City")
    }}>
      <div style = {{ fontWeight: "bold" }}>
        {index}
      </div>
      <div>
        {descriptions[index]}
      </div>
    </button>)
  }
  return <>
    <header style = {{ height: "51px", padding: "16px", display: "flex", justifyContent: "space-between" }}>
      <nav style = {{ padding: "16px" }}>
        city
      </nav>
      <Search />
      {account}
    </header>
    <div style = {{ borderStyle: "solid" }}>
      {city}
      {create}
    </div>
  </>
}
function Search() {
  return <div style = {{ display: "flex", alignItems: "center" }}>
    <input value = {search} placeholder = {"search"} onChange = {function(event) {
      search = event.target.value
      if (window.history.state.name) {
        render("Main")
      } else {
        render("City")
      }
    }} />
  </div>
}
function Account() {
  return <div style = {{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    {localStorage.user}
    <nav>
      <button onClick = {function() {
        delete localStorage.user
        delete localStorage.token
        if (window.history.state.name) {
          authenticated = false
          render("Main")
        } else {
          render("City")
        }
      }} style = {{ height: "21px" }}>
        log out
      </button>
      <button onClick = {function() {
        overlay = <Settings />
        render("Overlay")
      }}>
        settings
      </button>
    </nav>
  </div>
}
function Main() {
  state.Main = react.useState()
  let password = react.useRef()
  document.title = window.history.state.name
  let parent = users[window.history.state.user][window.history.state.index].parent
  let ancestors = []
  while (parent !== undefined) {
    ancestors.push(parent)
    parent = users[window.history.state.user][parent].parent
  }
  let nav = []
  for (let index in ancestors.reverse()) {
    nav.push(<button key = {index} onClick = {function() {
      let path = ""
      for (let index2 in ancestors) {
        path += "/" + users[window.history.state.user][ancestors[index2]].name
        if (index2 === index) {
          window.history.pushState(users[window.history.state.user][ancestors[index]], undefined, path)
          break
        }
      }
      search = ""
      render("Main")
    }} onDragOver = {function(event) {
      event.preventDefault()
    }} onDrop = {function(event) {
      onDrop(event, ancestors[index])
    }} style = {{ padding: "16px" }}>
      {users[window.history.state.user][ancestors[index]].name}
    </button>)
  }
  let create
  if (localStorage.user) {
    account = <Account />
    if (authenticated) {
      create = <>
        <Content create = {"bookmark"} />
        <Content create = {"folder"} />
      </>
    }
  } else {
    account = <form onSubmit = {async function(event) {
      event.preventDefault()
      axios.defaults.headers.token = (await axios.post("/usersFind", { user: window.history.state.user, password: password.current.value })).data
      if (axios.defaults.headers.token) {
        localStorage.user = window.history.state.user
        localStorage.token = axios.defaults.headers.token
        axios.defaults.headers.user = localStorage.user
        authenticated = true
        render("Main")
      } else {
        reject(password.current)
      }
    }} style = {{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <input ref = {password} placeholder = {"password"} type = {"password"} />
      <button>
        log into {window.history.state.user}
      </button>
    </form>
  }
  imported = false
  return <>
    <header style = {{ height: "51px", padding: "16px", display: "flex", justifyContent: "space-between" }}>
      <nav style = {{ display: "flex", alignItems: "center" }}>
        <button onClick = {function() {
          window.history.pushState({}, undefined, "/")
          search = ""
          render("City")
        }} style = {{ padding: "16px" }}>
          city
        </button>
        {nav}
        <p style = {{ padding: "16px" }}>
          {window.history.state.name}
        </p>
      </nav>
      <Search />
      {account}
    </header>
    <div style = {{ borderStyle: "solid" }}>
      <Items />
      {create}
    </div>
  </>
}
function Items() {
  state.Items = react.useState()
  let terms = search.toUpperCase().split(" ")
  let items = []
  loop: for (let index in users[window.history.state.user][window.history.state.index].children) {
    let name = users[window.history.state.user][index].name?.toUpperCase()
    let description = users[window.history.state.user][index].description?.toUpperCase()
    let address = users[window.history.state.user][index].address?.toUpperCase()
    for (let index in terms) {
      if (!(name?.includes(terms[index]) || description?.includes(terms[index]) || address?.includes(terms[index]))) {
        continue loop
      }
    }
    items[users[window.history.state.user][index].order] = <Item key = {index} index = {index} />
  }
  if (items.length) {
    return <>
      {items}
    </>
  }
  return <div className = "item" onDragOver = {onDragOver} onDrop = {onDrop} style = {{ padding: "16px" }}>
    (empty)
  </div>
}
function Item(props) {
  let button
  if (authenticated) {
    button = <button onClick = {function() {
      destroyed = []
      destroy(props.index)
      axios.put("/destroy", destroyed)
      delete users[window.history.state.user][window.history.state.index].children[props.index]
      window.history.replaceState(users[window.history.state.user][window.history.state.index], undefined)
      render("Items")
    }} style = {{ position: "absolute", top: "16px", right: "16px" }}>
      delete
    </button>
  }
  return <div style = {{ position: "relative" }}>
    <Content index = {props.index} />
    {button}
  </div>
}
function Content(props) {
  let autoFocus = props.index === imported
  let editing = react.useState(props.create || autoFocus)
  let name = react.useRef()
  let description = react.useRef()
  let address = react.useRef()
  let button
  if (editing[0] && authenticated) {
    let bookmark
    if (props.create) {
      bookmark = props.create === "bookmark"
      button = "create " + props.create
    } else {
      bookmark = users[window.history.state.user][props.index].address
      button = "confirm"
    }
    let input
    if (bookmark) {
      input = <input ref = {address} defaultValue = {users[window.history.state.user][props.index]?.address} placeholder = {"address"} />
    }
    let content = <>
      <input ref = {name} defaultValue = {users[window.history.state.user][props.index]?.name} placeholder = {"name"} autoFocus = {autoFocus} />
      <input ref = {description} defaultValue = {users[window.history.state.user][props.index]?.description} placeholder = {"description"} />
      {input}
      <button>
        {button}
      </button>
    </>
    return <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      if (bookmark) {
        if (!(address.current.value.startsWith("https://") || address.current.value.startsWith("http://"))) {
          address.current.value = "https://" + address.current.value
        }
      } else {
        name.current.value = name.current.value.replaceAll(/[?/%\\]/g, "")
        for (let index in users[window.history.state.user][window.history.state.index].children) {
          if (users[window.history.state.user][index].name === name.current.value && index !== props.index && !users[window.history.state.user][index].address) {
            alert("Folder names must be unique.")
            name.current.focus()
            return
          }
        }
      }
      if (name.current.value || bookmark) {
        if (props.create) {
          let item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: window.history.state.index, order: users[window.history.state.user][window.history.state.index].end++, name: name.current.value, description: description.current.value, address: address.current?.value, children: [], end: 0 }
          name.current.value = ""
          description.current.value = ""
          if (bookmark) {
            address.current.value = ""
          }
          name.current.focus()
          axios.put("/createUpdate", { item: item })
          users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
          users[window.history.state.user].push(item)
          render("Items")
        } else {
          users[window.history.state.user][props.index].name = name.current.value
          users[window.history.state.user][props.index].description = description.current.value
          users[window.history.state.user][props.index].address = address.current?.value
          axios.put("/itemsUpdate", users[window.history.state.user][props.index])
          editing[1]()
        }
      } else {
        name.current.focus()
      }
    }} onDragOver = {function(event) {
      onDragOver(event, props.index)
    }} onDrop = {function(event) {
      onDrop(event, props.index)
    }}>
      {content}
    </form>
  }
  let content
  if (users[window.history.state.user][props.index].address) {
    content = <div className = {"item bookmark"}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + users[window.history.state.user][props.index].address} style = {{ height: "16px", width: "16px" }} />
      <div style = {{ fontWeight: "bold" }}>
        {users[window.history.state.user][props.index].name}
      </div>
      <div>
        {users[window.history.state.user][props.index].description}
      </div>
      <a target = {"_blank"} href = {users[window.history.state.user][props.index].address} onDragStart = {function() {
        onDragStart(props.index)
      }} onDragOver = {function(event) {
        onDragOver(event, props.index)
      }} onDrop = {function(event) {
        onDrop(event, props.index)
      }} onDragEnd = {onDragEnd} style = {{ position: "absolute", margin: 0, height: "100%", width: "100%" }}>
        <data style = {{ display: "none" }}>
          {users[window.history.state.user][props.index].name}
        </data>
      </a>
    </div>
  } else {
    content = <button className = {"folder"} onClick = {function() {
      window.history.pushState(users[window.history.state.user][props.index], undefined, window.location.pathname + "/" + users[window.history.state.user][props.index].name)
      search = ""
      render("Main")
    }} draggable = {authenticated} onDragStart = {function() {
      onDragStart(props.index)
    }} onDragOver = {function(event) {
      onDragOver(event, props.index)
    }} onDrop = {function(event) {
      onDrop(event, props.index)
    }} onDragEnd = {onDragEnd}>
      <div style = {{ fontWeight: "bold" }}>
        {users[window.history.state.user][props.index].name}
      </div>
      <div>
        {users[window.history.state.user][props.index].description}
      </div>
    </button>
  }
  if (authenticated) {
    button = <button onClick = {function() {
      editing[1](true)
    }} style = {{ position: "absolute", top: "16px", right: "100px" }}>
      edit
    </button>
  }
  return <>
    {content}
    {button}
  </>
}
function Overlay() {
  state.Overlay = react.useState()
  if (overlay) {
    return <>
      <div className = {"overlay"} onClick = {onClick} style = {{ position: "fixed", backgroundColor: "rgb(0, 0, 0, .5)" }} />
      <div className = {"overlay"} onClick = {onClick} style = {{ position: "absolute", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {overlay}
      </div>
    </>
  }
}
function About() {
  return <div style = {{ borderStyle: "solid", padding: "16px", width: "500px", backgroundColor: "white" }}>
    <p>
      Welcome to Austin Henrie's Bookmark City, the lightning fast bookmark manager where anyone can make a web directory for all to use.
    </p>
    <p>
      Click any of the collections in the list to see what's inside. If you'd like to keep a bookmark for yourself, try clicking and dragging it to your browser's bookmarks bar.
    </p>
    <p>
      To start your own collection, set a name and password at the bottom of the list. You can then add bookmarks either from scratch or by clicking and dragging from your browser's bookmarks bar. Once you have some bookmarks, try clicking and dragging to organize them.
    </p>
    <p>
      There are many more features than are mentioned here, so go see what you can do! Here are some collections you could make:
    </p>
    <ul>
      <li>
        Playlists that link to music from different sites
      </li>
      <li>
        Recipe books that link to recipes from different blogs
      </li>
      <li>
        Wish lists that link to products from different stores
      </li>
      <li>
        Productivity tools for your colleagues
      </li>
      <li>
        Technical resources for your study group
      </li>
      <li>
        Interesting Bookmark City collections you've found
      </li>
      <li>
        Examples of React apps with optimistic UI, dynamic routing, global state, and token authentication that reinvent forgotten concepts from the 90s for the modern web
      </li>
      <li>
        Literally anything else you can think of
      </li>
    </ul>
    <div style = {{ display: "flex", justifyContent: "center" }}>
      <a href = "https://github.com/epistemancering/bookmarks" target = "_blank">
        GitHub repository
      </a>
    </div>
  </div>
}
function Settings() {
  let description = react.useRef()
  let current = react.useRef()
  let change = react.useRef()
  let confirm = react.useRef()
  return <div style = {{ borderStyle: "solid" }}>
    <form onSubmit = {function(event) {
      event.preventDefault()
      axios.put("/usersUpdate", { description: description.current.value })
      descriptions[localStorage.user] = description.current.value
      overlay = undefined
      if (window.history.state.name) {
        render("Overlay")
      } else {
        render("App")
      }
    }}>
      <input ref = {description} defaultValue = {descriptions[localStorage.user]} placeholder = {"description"} autoFocus />
      <button>
        change description
      </button>
    </form>
    <form onSubmit = {async function(event) {
      event.preventDefault()
      if (change.current.value === confirm.current.value) {
        if ((await axios.put("/findUpdate", { password: current.current.value, new: change.current.value })).data) {
          overlay = undefined
          render("Overlay")
        } else {
          reject(current.current)
        }
      } else {
        mismatch("New password and confirm new password must be the same.", change.current, confirm.current)
      }
    }}>
      <input ref = {current} placeholder = {"password"} type = {"password"} />
      <input ref = {change} placeholder = {"new password"} type = {"password"} />
      <input ref = {confirm} placeholder = {"confirm new password"} type = {"password"} />
      <button style = {{ marginRight: "16px" }}>
        change password
      </button>
    </form>
    <form onSubmit = {async function(event) {
      event.preventDefault()
      if (deleting) {
        if ((await axios.put("/findDestroy", { password: password.current.value })).data) {
          window.history.replaceState({}, undefined, "/")
          overlay = undefined
          delete users[localStorage.user]
          delete descriptions[localStorage.user]
          delete localStorage.user
          delete localStorage.token
          deleting = undefined
          render("App")
        } else {
          reject(password.current)
        }
      } else {
        deleting = true
        render("Delete")
      }
    }}>
      <Delete />
      <button>
        delete {localStorage.user}
      </button>
    </form>
  </div>
}
function Delete() {
  state.Delete = react.useState()
  password = react.useRef()
  if (deleting) {
    return <input ref = {password} placeholder = {"password"} type = {"password"} style = {{ color: "red" }} autoFocus />
  }
}