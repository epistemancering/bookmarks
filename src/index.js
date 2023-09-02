import react from "react"
import reactDom from "react-dom/client"
import axios from "axios"
let path = decodeURI(window.location.pathname).split("/")
let user = path[1].toLowerCase()
axios.post("/find", { user: user }).then(function(response) {
  for (let index in response.data[0]) {
    users[response.data[0][index].user] = []
    descriptions[response.data[0][index].user] = response.data[0][index].description
  }
  if (users[user]) {
    let index = 1
    cache(user, response.data[1], true)
    let parent = 0
    while (path[++index]) {
      for (let index2 in users[user][parent].children) {
        if (users[user][index2].name === path[index] && !users[user][index2].address) {
          window.history.replaceState(users[user][index2], undefined, window.location.pathname + "/" + path[index])
          parent = index2
          users[user][index2].open = true
          break
        }
      }
    }
    document.title = window.history.state.name
  } else {
    window.history.replaceState({}, undefined, "/")
    document.title = "Bookmark City"
  }
  reactDom.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <ul className = {"navigation"} style = {{ width: "max(201px, calc(22% - 96px))", padding: "48px" }}>
      <Folders />
    </ul>
    <div style = {{ width: "max(756px, 56%)" }}>
      <header style = {{ height: "51px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <nav>
          <Nav />
        </nav>
        <div>
          <Search />
        </div>
        <Account />
      </header>
      <div style = {{ borderStyle: "solid" }}>
        <City />
      </div>
    </div>
    <Overlay />
  </react.StrictMode>)
})
function Folders() {
  state.Folders = react.useState()
  let folders = []
  for (let index in users) {
    folders.push(<li key = {index}>
      <Folder user = {index} index = {0} path = {"/" + index} />
    </li>)
  }
  return folders
}
function Folder(props) {
  let state = react.useState()
  let folders = []
  let arrow, folder
  if (users[props.user][0]) {
    for (let index in users[props.user][props.index].children) {
      if (!users[props.user][index].address) {
        folders[users[props.user][index].order] = <li key = {index}>
          <Folder user = {props.user} index = {index} path = {props.path + "/" + users[props.user][index].name} />
        </li>
      }
    }
    if (folders.length) {
      if (users[props.user][props.index].open) {
        arrow = <Arrow state = {state} user = {props.user} index = {props.index} arrow = {"v"} />
      } else {
        arrow = <Arrow state = {state} user = {props.user} index = {props.index} arrow = {">"} />
        folders = undefined
      }
    }
  } else {
    arrow = <Arrow state = {state} user = {props.user} index = {props.index} arrow = {">"} />
  }
  if (props.index) {
    folder = <button onClick = {function() {
      users[props.user][props.index].open = true
      render(["Nav", "Account", "City"], users[props.user][props.index], props.path)
      state[1]({})
    }}>
      {users[props.user][props.index].name}
    </button>
  } else {
    folder = <button onClick = {function() {
      onClick(props.user)
    }}>
      {props.user}
    </button>
  }
  return <>
    <div style = {{ display: "flex" }}>
      <div style = {{ width: "24px" }}>
        {arrow}
      </div>
      {folder}
    </div>
    <ul>
      {folders}
    </ul>
  </>
}
function Arrow(props) {
  return <button onClick = {async function() {
    if (!users[props.user][0]) {
      cache(props.user, (await axios.post("/itemsFind", { user: props.user })).data)
    }
    users[props.user][props.index].open = !users[props.user][props.index].open
    props.state[1]({})
  }} style = {{ width: "100%" }}>
    {props.arrow}
  </button>
}
function Nav() {
  state.Nav = react.useState()
  if (window.history.state.user) {
    return <>
      <button onClick = {function() {
        render(["Folders", "Nav", "Account", "City"], {}, "/")
      }} style = {{ padding: "16px" }}>
        city
      </button>
      <Ancestry />
    </>
  }
  return <p style = {{ padding: "16px" }}>
    city
  </p>
}
function Ancestry() {
  state.Ancestry = react.useState()
  let parent = users[window.history.state.user][window.history.state.index].parent
  let ancestors = []
  while (parent !== undefined) {
    ancestors.push(parent)
    parent = users[window.history.state.user][parent].parent
  }
  let buttons = []
  for (let index in ancestors.reverse()) {
    buttons.push(<button key = {index} onClick = {function() {
      path = ""
      for (let index2 in ancestors) {
        path += "/" + users[window.history.state.user][ancestors[index2]].name
        if (index2 === index) {
          break
        }
      }
      render(["Ancestry", "Items"], users[window.history.state.user][ancestors[index]], path)
    }} onDragOver = {function(event) {
      onDragOver(event, 0)
    }} onDrop = {function(event) {
      onDrop(event, ancestors[index])
    }} style = {{ padding: "16px" }}>
      {users[window.history.state.user][ancestors[index]].name}
    </button>)
  }
  return <>
    {buttons}
    <p style = {{ padding: "16px" }}>
      {window.history.state.name}
    </p>
  </>
}
function Search() {
  search = react.useRef()
  return <input ref = {search} placeholder = {"search"} onChange = {function() {
    terms = search.current.value.toUpperCase().split(" ")
    if (window.history.state.user) {
      render(["Items"])
    } else {
      render(["Users"])
    }
  }} />
}
function Account() {
  state.Account = react.useState()
  let password = react.useRef()
  if (localStorage.user) {
    return <div style = {{ flexDirection: "column" }}>
      {localStorage.user}
      <div>
        <button onClick = {function() {
          delete localStorage.user
          delete localStorage.token
          render(["Account", "City"])
        }} style = {{ height: "21px" }}>
          log out
        </button>
        <button onClick = {function() {
          overlay = <Settings />
          render(["Overlay"])
        }}>
          settings
        </button>
      </div>
    </div>
  }
  if (window.history.state.user) {
    return <form onSubmit = {async function(event) {
      event.preventDefault()
      axios.defaults.headers.token = (await axios.post("/usersFind", { user: window.history.state.user, password: password.current.value })).data
      if (axios.defaults.headers.token) {
        localStorage.token = axios.defaults.headers.token
        localStorage.user = axios.defaults.headers.user = window.history.state.user
        render(["Account", "Main"])
      } else {
        reject(password)
      }
    }} style = {{ flexDirection: "column" }}>
      <input ref = {password} placeholder = {"password"} type = {"password"} />
      <button>
        log into {window.history.state.user}
      </button>
    </form>
  }
  return <button onClick = {function() {
    overlay = <div style = {{ borderStyle: "solid", padding: "16px", width: "500px", backgroundColor: "white" }}>
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
    render(["Overlay"])
  }}>
    about Bookmark City
  </button>
}
function City() {
  state.City = react.useState()
  user = react.useRef()
  let password = react.useRef()
  let confirm = react.useRef()
  if (window.history.state.user) {
    return <Main />
  }
  let create
  if (!localStorage.user) {
    create = <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      user.current.value = user.current.value.trim().replaceAll(/[?/%\\]/g, "").toLowerCase()
      if (user.current.value) {
        if (users[user.current.value]) {
          alert("Name must be unique.")
          user.current.focus()
        } else if (password.current.value === confirm.current.value) {
          axios.post("/create", { size: 0, user: user.current.value, description: "", password: password.current.value }).then(function(response) {
            localStorage.token = axios.defaults.headers.token = response.data
          })
          users[user.current.value] = [{ user: user.current.value, index: 0, name: user.current.value, children: [], end: 0, open: true }]
          descriptions[user.current.value] = ""
          localStorage.user = axios.defaults.headers.user = user.current.value
          render(["Folders", "Nav", "Account", "City"], users[user.current.value][0], "/" + user.current.value)
        } else {
          mismatch("Password and confirm password must be the same.", password, confirm)
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
  return <>
    <Users />
    {create}
  </>
}
function Users() {
  state.Users = react.useState()
  let list = []
  loop: for (let index in users) {
    let user = index.toUpperCase()
    let description = descriptions[index].toUpperCase()
    for (let index in terms) {
      if (!(user.includes(terms[index]) || description.includes(terms[index]))) {
        continue loop
      }
    }
    list.push(<button key = {index} className = {"folder"} onClick = {function() {
      onClick(index)
    }}>
      <div style = {{ fontWeight: "bold" }}>
        {index}
      </div>
      <div>
        {descriptions[index]}
      </div>
    </button>)
  }
  return list
}
function Main() {
  state.Main = react.useState()
  authenticated = window.history.state.user === localStorage.user
  let create
  if (authenticated) {
    create = <>
      <Content create = {"bookmark"} />
      <Content create = {"folder"} />
    </>
  }
  return <>
    <Items />
    {create}
  </>
}
function Items() {
  state.Items = react.useState()
  let items = []
  loop: for (let index in users[window.history.state.user][window.history.state.index].children) {
    let name = users[window.history.state.user][index].name.toUpperCase()
    let description = users[window.history.state.user][index].description.toUpperCase()
    let address = users[window.history.state.user][index].address?.toUpperCase()
    for (let index in terms) {
      if (!(name.includes(terms[index]) || description.includes(terms[index]) || address?.includes(terms[index]))) {
        continue loop
      }
    }
    let button
    if (authenticated) {
      button = <button onClick = {function() {
        increment = 0
        destroying = []
        destroy(index)
        axios.put("/destroyIncrement", { destroy: destroying, increment: increment })
        delete users[window.history.state.user][window.history.state.index].children[index]
        window.history.replaceState(users[window.history.state.user][window.history.state.index], undefined)
        render(["Folders", "Items"])
      }} style = {{ position: "absolute", top: "16px", right: "16px" }}>
        delete
      </button>
    }
    items[users[window.history.state.user][index].order] = <div key = {index} style = {{ position: "relative" }}>
      <Content index = {index} />
      {button}
    </div>
  }
  if (items.length) {
    return items
  }
  return <div className = "item" onDragOver = {onDragOver} onDrop = {onDrop} style = {{ padding: "16px" }}>
    (nothing here)
  </div>
}
function Content(props) {
  let autoFocus = props.index === imported
  let editing = react.useState(props.create || autoFocus)
  let name = react.useRef()
  let description = react.useRef()
  let address = react.useRef()
  let bookmark, button, input, content
  if (editing[0] && authenticated) {
    if (props.create) {
      bookmark = props.create === "bookmark"
      button = "create " + props.create
    } else {
      bookmark = users[window.history.state.user][props.index].address
      button = "confirm"
    }
    if (bookmark) {
      input = <input ref = {address} defaultValue = {users[window.history.state.user][props.index]?.address} placeholder = {"address"} />
    }
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
          axios.put("/createIncrementUpdate", { create: item })
          users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
          users[window.history.state.user].push(item)
          render(["Folders", "Items"])
        } else {
          users[window.history.state.user][props.index].name = name.current.value
          users[window.history.state.user][props.index].description = description.current.value
          users[window.history.state.user][props.index].address = address.current?.value
          axios.put("/createIncrementUpdate", { update: [users[window.history.state.user][props.index]] })
          render(["Folders"])
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
      <input ref = {name} defaultValue = {users[window.history.state.user][props.index]?.name} placeholder = {"name"} autoFocus = {autoFocus} />
      <input ref = {description} defaultValue = {users[window.history.state.user][props.index]?.description} placeholder = {"description"} />
      {input}
      <button>
        {button}
      </button>
    </form>
  }
  let label = <>
    <div style = {{ fontWeight: "bold" }}>
      {users[window.history.state.user][props.index].name}
    </div>
    <div>
      {users[window.history.state.user][props.index].description}
    </div>
  </>
  if (users[window.history.state.user][props.index].address) {
    content = <div className = {"item bookmark"}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + users[window.history.state.user][props.index].address} style = {{ height: "16px", width: "16px" }} />
      {label}
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
      users[window.history.state.user][props.index].open = true
      render(["Folders", "Ancestry", "Items"], users[window.history.state.user][props.index], window.location.pathname + "/" + users[window.history.state.user][props.index].name)
    }} draggable = {authenticated} onDragStart = {function() {
      onDragStart(props.index)
    }} onDragOver = {function(event) {
      onDragOver(event, props.index)
    }} onDrop = {function(event) {
      onDrop(event, props.index)
    }} onDragEnd = {onDragEnd}>
      {label}
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
      <div className = {"overlay"} onMouseDown = {onMouseDown} style = {{ position: "fixed", backgroundColor: "rgb(0, 0, 0, .5)" }} />
      <div className = {"overlay"} onMouseDown = {onMouseDown} style = {{ position: "absolute", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {overlay}
      </div>
    </>
  }
}
function Settings() {
  let description = react.useRef()
  let changePass = react.useRef()
  let update = react.useRef()
  let confirm = react.useRef()
  let deletePass = react.useRef()
  return <div style = {{ borderStyle: "solid" }}>
    <form onSubmit = {function(event) {
      event.preventDefault()
      axios.put("/usersUpdate", { description: description.current.value })
      descriptions[localStorage.user] = description.current.value
      overlay = undefined
      if (!window.history.state.user) {
        render(["Users"])
      }
      render(["Overlay"])
    }}>
      <input ref = {description} defaultValue = {descriptions[localStorage.user]} placeholder = {"description"} autoFocus />
      <button>
        change description
      </button>
    </form>
    <form onSubmit = {async function(event) {
      event.preventDefault()
      if (update.current.value === confirm.current.value) {
        if ((await axios.put("/findUpdate", { password: changePass.current.value, new: update.current.value })).data) {
          overlay = undefined
          render(["Overlay"])
        } else {
          reject(changePass)
        }
      } else {
        mismatch("New password and confirm new password must be the same.", update, confirm)
      }
    }}>
      <input ref = {changePass} placeholder = {"password"} type = {"password"} />
      <input ref = {update} placeholder = {"new password"} type = {"password"} />
      <input ref = {confirm} placeholder = {"confirm new password"} type = {"password"} />
      <button style = {{ marginRight: "16px" }}>
        change password
      </button>
    </form>
    <form onSubmit = {async function(event) {
      event.preventDefault()
      if (deleter) {
        if ((await axios.put("/findDestroy", { password: deletePass.current.value })).data) {
          delete users[localStorage.user]
          delete localStorage.user
          delete localStorage.token
          overlay = deleter = undefined
          if (authenticated) {
            window.history.replaceState({}, undefined, "/")
            render(["Nav", "City"], true)
          } else if (!window.history.state.user) {
            render(["Nav", "Users"])
          }
          render(["Folders", "Account", "Overlay"])
        } else {
          reject(deletePass)
        }
      } else {
        deleter = <input ref = {deletePass} placeholder = {"password"} type = {"password"} style = {{ color: "red" }} autoFocus />
        render(["Deleter"])
      }
    }}>
      <Deleter />
      <button>
        delete {localStorage.user}
      </button>
    </form>
  </div>
}
function Deleter() {
  state.Deleter = react.useState()
  return deleter
}
function cache(user, items, navigate) {
  users[user] = [{ user: user, index: 0, name: user, children: [], end: [] }]
  for (let index in items) {
    items[index].children = []
    items[index].end = []
    users[user][items[index].index] = items[index]
  }
  for (let index in users[user]) {
    if (index !== "0") {
      users[user][users[user][index].parent].children[index] = users[user][users[user][index].parent].end[users[user][index].order] = true
    }
  }
  for (let index in users[user]) {
    users[user][index].end = users[user][index].end.length
  }
  if (navigate) {
    users[user][0].open = true
    window.history.replaceState(users[user][0], undefined, "/" + user)
  }
}
function render(components, push, path) {
  if (push) {
    if (path) {
      window.history.pushState(push, undefined, path)
    }
    if (window.history.state.user) {
      document.title = window.history.state.name
    } else {
      document.title = "Bookmark City"
    }
    search.current.value = ""
    terms = undefined
  }
  for (let index in components) {
    state[components[index]][1]({})
  }
}
function onMouseDown(event) {
  if (event.target === event.currentTarget) {
    overlay = undefined
    render(["Overlay"])
  }
}
async function onClick(index) {
  path = "/" + index
  if (users[index][0]) {
    window.history.pushState(users[index][0], undefined, path)
    users[index][0].open = true
  } else {
    window.history.pushState({ user: index }, undefined, path)
    cache(index, (await axios.post("/itemsFind", window.history.state)).data, true)
  }
  render(["Folders", "Nav", "Account", "City"], true)
}
function mismatch(error, password, confirm) {
  alert(error)
  password.current.value = ""
  confirm.current.value = ""
  password.current.focus()
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
      let origin = users[window.history.state.user][traveler].order
      let destination = users[window.history.state.user][index].order
      let direction = Math.sign(origin - destination)
      if (users[window.history.state.user][index].address || (high && direction === 1) || (low && direction === -1)) {
        shift(origin - direction, direction, destination)
        users[window.history.state.user][traveler].order = destination
        render(["Folders", "Items"])
      }
    }
  }
}
function onDrop(event, index) {
  event.preventDefault()
  if (traveler) {
    if (index !== traveler && index !== undefined) {
      users[window.history.state.user][traveler].order = users[window.history.state.user][index].end++
      users[window.history.state.user][traveler].parent = index
      axios.put("/createIncrementUpdate", { update: [users[window.history.state.user][traveler]] })
      delete users[window.history.state.user][window.history.state.index].children[traveler]
      for (let index in users[window.history.state.user][window.history.state.index].children) {
        users[window.history.state.user][index].order = users[window.history.state.user][index].origin
      }
      users[window.history.state.user][index].children[traveler] = true
      traveler = undefined
      render(["Folders"])
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
        item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: index, order: users[window.history.state.user][index].end++, name: "", description: "", address: address }
        users[window.history.state.user][index].children[users[window.history.state.user].length] = true
      } else {
        item = { user: window.history.state.user, index: users[window.history.state.user].length, parent: window.history.state.index, order: order, name: "", description: "", address: address }
        users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
        imported = String(users[window.history.state.user].length)
      }
      users[window.history.state.user].push(item)
      arrange(item)
    }
  }
  render(["Items"])
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
function arrange(create) {
  let update = []
  for (let index in users[window.history.state.user][window.history.state.index].children) {
    update.push(users[window.history.state.user][index])
  }
  axios.put("/createIncrementUpdate", { create: create, update: update })
}
function destroy(item) {
  if (users[window.history.state.user][item].address) {
    --increment
  } else {
    for (let index in users[window.history.state.user][item].children) {
      destroy(index)
    }
  }
  destroying.push(item)
}
function reject(password) {
  alert("Incorrect password.")
  password.current.value = ""
  password.current.focus()
}
let users = {}
let descriptions = {}
let state = {}
let authenticated, search, terms, item, overlay, traveler, high, low, destroying, increment, deleter
axios.defaults.headers.user = localStorage.user
axios.defaults.headers.token = localStorage.token
let imported = false
window.onpopstate = function() {
  render(["Nav", "Account", "City"], true)
}