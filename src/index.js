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
let destroyed
window.addEventListener("popstate", function() {
  render("Browse")
})
function redirect(items, path) {
  window.history.replaceState({ user: window.history.state.user, ancestors: [], index: "0", name: window.history.state.user, children: [] }, undefined, "/" + window.history.state.user)
  users[window.history.state.user] = [window.history.state]
  for (let index in items) {
    users[window.history.state.user][items[index].index] = items[index]
  }
  let step = 2
  for (let index in users[window.history.state.user]) {
    if (index !== "0") {
      users[window.history.state.user][users[window.history.state.user][index].parent].children[index] = true
      if (!users[window.history.state.user][index].address) {
        if (users[window.history.state.user][index].name === path[step] && users[window.history.state.user][index].parent === window.history.state.index) {
          window.history.replaceState(users[window.history.state.user][index], undefined, window.location.pathname + "/" + users[window.history.state.user][index].name)
          ++step
        }
        users[window.history.state.user][index].ancestors = users[window.history.state.user][users[window.history.state.user][index].parent].ancestors.slice()
        users[window.history.state.user][index].ancestors[users[window.history.state.user][index].parent] = true
        users[window.history.state.user][index].children = []
      }
    }
  }
  window.history.replaceState(users[window.history.state.user][window.history.state.index], undefined)
}
function render(component) {
  state[component][1]({})
}
function destroy(parent) {
  for (let index in users[window.history.state.user][parent].children) {
    destroy(index)
  }
  destroyed.push(parent)
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
          window.history.pushState({ user: name.current.value, ancestors: [], index: 0, name: name.current.value, children: [] }, undefined, "/" + name.current.value)
          axios.post("/usersCreate", { name: name.current.value, password: password.current.value }).then(function(response) {
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
  let ancestors = []
  for (let index in window.history.state.ancestors) {
    let limit = Number(index) + 1
    ancestors[index] = <button key = {index} onClick = {function() {
      let path = ""
      for (let index in window.history.state.ancestors) {
        if (index < limit) {
          path += "/" + users[window.history.state.user][index].name
        }
      }
      window.history.pushState(users[window.history.state.user][index], undefined, path)
      search = ""
      render("Main")
    }} style = {{ padding: "16px" }}>
      {users[window.history.state.user][index].name}
    </button>
  }
  ancestors[window.history.state.index] = <p key = {-1} style = {{ padding: "16px" }}>
    {window.history.state.name}
  </p>
  let create
  if (localStorage.user) {
    log = <button onClick = {function() {
      delete localStorage.user
      delete localStorage.token
      authenticated = undefined
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
  return <>
    <header style = {{ height: "51px", padding: "16px", display: "flex", justifyContent: "space-between" }}>
      <nav style = {{ display: "flex", alignItems: "center" }}>
        <button key = {-2} onClick = {function() {
          window.history.pushState({}, undefined, "/")
          search = ""
          render("Browse")
        }} style = {{ padding: "16px" }}>
          browse
        </button>
        {ancestors}
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
  let folder = []
  loop: for (let index in window.history.state.children) {
    let name = users[window.history.state.user][index].name?.toUpperCase()
    let description = users[window.history.state.user][index].description?.toUpperCase()
    let address = users[window.history.state.user][index].address?.toUpperCase()
    for (let index in terms) {
      if (!(name?.includes(terms[index]) || description?.includes(terms[index]) || address?.includes(terms[index]))) {
        continue loop
      }
    }
    folder.push(<Item key = {index} index = {index} />)
  }
  return <>
    {folder}
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
  let editing = react.useState(props.create)
  let name = react.useRef()
  let description = react.useRef()
  let address = react.useRef()
  let content
  let button
  if (editing[0]) {
    let bookmark
    let input
    if (props.create) {
      bookmark = props.create === "bookmark"
      content = <>
        <input ref = {name} placeholder = {"name"} />
        <input ref = {description} placeholder = {"description"} />
      </>
      if (bookmark) {
        input = <input ref = {address} placeholder = {"address"} />
      }
      button = "create " + props.create
    } else {
      bookmark = users[window.history.state.user][props.index].address
      if (bookmark) {
        input = <input ref = {address} defaultValue = {users[window.history.state.user][props.index].address} placeholder = {"address"} />
      }
      content = <>
        <input ref = {name} defaultValue = {users[window.history.state.user][props.index].name} placeholder = {"name"} />
        <input ref = {description} defaultValue = {users[window.history.state.user][props.index].description} placeholder = {"description"} />
      </>
      button = "confirm"
    }
    return <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      if (bookmark) {
        if (!(address.current.value.startsWith("https://") || address.current.value.startsWith("http://"))) {
          address.current.value = "https://" + address.current.value
        }
      } else {
        name.current.value = name.current.value.replaceAll(/[?/%\\]/g, "")
        for (let index in window.history.state.children) {
          if (users[window.history.state.user][index].name === name.current.value && (props.create || index !== props.index)) {
            alert("Folder names must be unique.")
            name.current.focus()
            return
          }
        }
      }
      if (name.current.value || bookmark) {
        if (props.create) {
          window.history.state.ancestors[window.history.state.index] = true
          let item = { user: window.history.state.user, index: users[window.history.state.user].length, ancestors: window.history.state.ancestors, parent: window.history.state.index, name: name.current.value, description: description.current.value, address: address.current?.value, children: [] }
          name.current.blur()
          description.current.blur()
          if (bookmark) {
            address.current.blur()
            address.current.value = ""
          }
          name.current.value = ""
          description.current.value = ""
          axios.post("/itemsCreate", item)
          users[window.history.state.user][window.history.state.index].children[users[window.history.state.user].length] = true
          window.history.replaceState(users[window.history.state.user][window.history.state.index], undefined)
          users[window.history.state.user].push(item)
          render("Items")
        } else {
          users[window.history.state.user][props.index].name = name.current.value
          users[window.history.state.user][props.index].description = description.current.value
          users[window.history.state.user][props.index].address = address.current?.value
          axios.put("/update", users[window.history.state.user][props.index])
          editing[1]()
        }
      } else {
        name.current.focus()
      }
    }}>
      {content}
      {input}
      <button>
        {button}
      </button>
    </form>
  }
  if (users[window.history.state.user][props.index].address) {
    content = <a className = {"item"} target = {"_blank"} href = {users[window.history.state.user][props.index].address} style = {{ textDecoration: "none", color: "black" }}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + users[window.history.state.user][props.index].address} style = {{ height: "16px", width: "16px" }} />
      <div style = {{ fontWeight: "bold" }}>
        {users[window.history.state.user][props.index].name}
      </div>
      <div>
        {users[window.history.state.user][props.index].description}
      </div>
    </a>
  } else {
    content = <button className = {"folder"} onClick = {function() {
      window.history.pushState(users[window.history.state.user][props.index], undefined, window.location.pathname + "/" + users[window.history.state.user][props.index].name)
      search = ""
      render("Main")
    }}>
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