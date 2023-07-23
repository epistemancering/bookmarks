import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let path = decodeURI(window.location.pathname).split("/")
window.history.replaceState({ user: path[1].toLowerCase() }, undefined)
axios.defaults.headers.token = localStorage.token
axios.post("/find", { user: window.history.state.user }).then(function(response) {
  for (let index in response.data[0]) {
    users[response.data[0][index].name] = []
    descriptions[response.data[0][index].name] = response.data[0][index].description
  }
  if (users[window.history.state.user]) {
    redirect(response.data[1], path)
  } else {
    window.history.replaceState({}, undefined, "/")
  }
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Browse />
  </react.StrictMode>)
})
let users = {}
let descriptions = {}
let state = {}
let authenticated
let log
let search = ""
let item
let traveler
let high
let low
let destroyed
let imported = false
window.addEventListener("popstate", function() {
  render("Browse")
})
function redirect(items, path) {
  window.history.replaceState({ user: window.history.state.user, index: 0, name: window.history.state.user, children: [] }, undefined, "/" + window.history.state.user)
  users[window.history.state.user] = [window.history.state]
  for (let index in items) {
    items[index].children = []
    users[window.history.state.user][items[index].index] = items[index]
  }
  for (let index in users[window.history.state.user]) {
    if (index !== "0") {
      users[window.history.state.user][users[window.history.state.user][index].parent].children[index] = true
    }
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
function end(parent) {
  let orders = []
  for (let index in users[window.history.state.user][parent].children) {
    orders[users[window.history.state.user][index].order] = true
  }
  return orders.length
}
function destroy(parent) {
  for (let index in users[window.history.state.user][parent].children) {
    destroy(index)
  }
  destroyed.push(parent)
}
function onSubmit(event, bookmark, props, editing, name, description, address) {
  event.preventDefault()
  if (bookmark) {
    if (!(address.value.startsWith("https://") || address.value.startsWith("http://"))) {
      address.value = "https://" + address.value
    }
  } else {
    name.value = name.value.replaceAll(/[?/%\\]/g, "")
    for (let index in users[window.history.state.user][window.history.state.index].children) {
      if (users[window.history.state.user][index].name === name.value && index !== props.index && !users[window.history.state.user][index].address) {
        alert("Folder names must be unique.")
        name.focus()
        return
      }
    }
  }
  if (name.value || bookmark) {
    if (props.create) {
      let item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: window.history.state.index, order: end(window.history.state.index), name: name.value, description: description.value, address: address?.value, children: [] }
      name.value = ""
      description.value = ""
      if (bookmark) {
        address.value = ""
      }
      name.focus()
      axios.put("/createUpdate", { user: window.history.state.user, item: item })
      users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
      users[window.history.state.user].push(item)
      render("Items")
    } else {
      users[window.history.state.user][props.index].name = name.value
      users[window.history.state.user][props.index].description = description.value
      users[window.history.state.user][props.index].address = address?.value
      axios.put("/update", users[window.history.state.user][props.index])
      editing()
    }
  } else {
    name.focus()
  }
}
function onDragStart(index) {
  traveler = index
  for (let index in users[window.history.state.user][window.history.state.index].children) {
    users[window.history.state.user][index].origin = users[window.history.state.user][index].order
  }
}
function onDragOver(event, index) {
  if (authenticated) {
    event.preventDefault()
    let box = event.target.getBoundingClientRect()
    let mouse = 4 * event.clientY
    high = 3 * box.top + box.bottom > mouse
    low = box.top + 3 * box.bottom < mouse
    if (traveler) {
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
      if (index !== traveler) {
        users[window.history.state.user][traveler].order = end(index)
        users[window.history.state.user][traveler].parent = index
        axios.put("/update", users[window.history.state.user][traveler])
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
        if (users[window.history.state.user][window.history.state.index].children[index] && (users[window.history.state.user][index].address || high || low)) {
          let order = users[window.history.state.user][index].order
          if (low && !users[window.history.state.user][index].address) {
            ++order
          }
          shift(end(window.history.state.index), 1, order)
          item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: window.history.state.index, order: order, address: address }
          users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
          imported = String(users[window.history.state.user].length)
        } else {
          item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: index, order: end(index), address: address }
          users[window.history.state.user][index].children[users[window.history.state.user].length] = true
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
  axios.put("/createUpdate", { user: window.history.state.user, item: item, indices: indices, orders: orders })
}
function Browse() {
  state.Browse = react.useState()
  let name = react.useRef()
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
      render("Browse")
    })
  }
  let log
  let create
  if (localStorage.user) {
    log = <button onClick = {function() {
      delete localStorage.user
      delete localStorage.token
      render("Browse")
    }} style = {{ height: "21px" }}>
      log out from {localStorage.user}
    </button>
  } else {
    create = <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      name.current.value = name.current.value.replaceAll(/[?/%\\]/g, "").toLowerCase()
      if (name.current.value) {
        if (users[name.current.value]) {
          alert("Name must be unique.")
          name.current.focus()
        } else if (password.current.value === confirm.current.value) {
          window.history.pushState({ user: name.current.value, index: 0, name: name.current.value, children: [] }, undefined, "/" + name.current.value)
          axios.post("/create", { name: name.current.value, password: password.current.value }).then(function(response) {
            axios.defaults.headers.token = response.data
            localStorage.token = response.data
          })
          users[name.current.value] = [window.history.state]
          localStorage.user = name.current.value
          render("Browse")
        } else {
          alert("Password and confirm password must be the same.")
          password.current.value = ""
          confirm.current.value = ""
          password.current.focus()
        }
      } else {
        name.current.focus()
      }
    }}>
      <input ref = {name} placeholder = {"name"} />
      <input ref = {password} placeholder = {"password"} type = {"password"} />
      <input ref = {confirm} placeholder = {"confirm password"} type = {"password"} />
      <button>
        create
      </button>
    </form>
  }
  let terms = search.toUpperCase().split(" ")
  let browse = []
  loop: for (let index in users) {
    let name = index.toUpperCase()
    let description = descriptions[index]?.toUpperCase()
    for (let index in terms) {
      if (!(name.includes(terms[index]) || description?.includes(terms[index]))) {
        continue loop
      }
    }
    browse.push(<button key = {index} className = {"folder"} onClick = {function() {
      let path = "/" + index
      if (users[index]?.[0]) {
        window.history.pushState(users[index][0], undefined, path)
      } else {
        window.history.pushState({ user: index }, undefined, path)
      }
      render("Browse")
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
        browse
      </nav>
      <div style = {{ display: "flex", alignItems: "center" }}>
        <input value = {search} placeholder = {"search"} onChange = {function(event) {
          search = event.target.value
          render("Browse")
        }} />
      </div>
      {log}
    </header>
    <div style = {{ borderStyle: "solid" }}>
      {browse}
      {create}
    </div>
  </>
}
function Main() {
  state.Main = react.useState()
  let password = react.useRef()
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
    log = <button onClick = {function() {
      delete localStorage.user
      delete localStorage.token
      authenticated = false
      render("Main")
    }} style = {{ height: "21px" }}>
      log out from {localStorage.user}
    </button>
    if (authenticated) {
      create = <>
        <Content create = {"bookmark"} />
        <Content create = {"folder"} />
      </>
    }
  } else {
    log = <form onSubmit = {async function(event) {
      event.preventDefault()
      axios.defaults.headers.token = (await axios.post("/usersFind", { name: window.history.state.user, password: password.current.value })).data
      if (axios.defaults.headers.token) {
        localStorage.token = axios.defaults.headers.token
        localStorage.user = window.history.state.user
        authenticated = true
        render("Main")
      } else {
        alert("Incorrect password.")
        password.current.value = ""
        password.current.focus()
      }
    }} style = {{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
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
          render("Browse")
        }} style = {{ padding: "16px" }}>
          browse
        </button>
        {nav}
        <p style = {{ padding: "16px" }}>
          {window.history.state.name}
        </p>
      </nav>
      <div style = {{ display: "flex", alignItems: "center" }}>
        <input value = {search} placeholder = {"search"} onChange = {function(event) {
          search = event.target.value
          render("Main")
        }} />
      </div>
      {log}
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
  return <>
    {items}
  </>
}
function Item(props) {
  let button
  if (authenticated) {
    button = <button onClick = {function() {
      destroyed = []
      destroy(props.index)
      axios.put("/destroy", { user: window.history.state.user, destroyed: destroyed })
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
    if (props.create) {
      return <form className = {"item"} onSubmit = {function(event) {
        onSubmit(event, bookmark, props, editing[1], name.current, description.current, address.current)
      }}>
        {content}
      </form>
    }
    return <form className = {"item"} onSubmit = {function(event) {
      onSubmit(event, bookmark, props, editing[1], name.current, description.current, address.current)
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
    content = <div className = {"item"}>
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
    }} draggable onDragStart = {function() {
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