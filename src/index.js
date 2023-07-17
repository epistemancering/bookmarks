import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let users = {}
let descriptions = {}
let state = {}
let user
let authenticated
let log
let destroyed
window.addEventListener("popstate", function() {
  render("Browse")
})
function render(component) {
  state[component][1]({})
}
function destroy(parent) {
  for (let index in users[window.history.state.user][parent].children) {
    destroy(index)
  }
  destroyed.push(parent)
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
          axios.post("/create", item)
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
function Items() {
  state.Items = react.useState()
  let folder = []
  for (let index in window.history.state.children) {
    folder.push(<Item key = {index} index = {index} />)
  }
  return <>
    {folder}
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
      render("Main")
    }} style = {{ padding: "16px" }}>
      {users[window.history.state.user][index].name}
    </button>
  }
  ancestors[window.history.state.index] = <p key = {-1} style = {{ padding: "16px" }}>
    {window.history.state.name}
  </p>
  let create
  if (user) {
    log = <button onClick = {function() {
      user = undefined
      authenticated = undefined
      render("Main")
    }} style = {{ height: "21px" }}>
      log out from {user}
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
      if ((await axios.post("/passwordFind", { user: window.history.state.user, password: password.current.value })).data) {
        user = window.history.state.user
        authenticated = true
        render("Main")
      } else {
        alert("Incorrect password.")
        password.current.value = ""
        password.current.focus()
      }
    }} style = {{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <input ref = {password} placeholder = {"password"} type = {"password"} autoFocus />
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
          render("Browse")
        }} style = {{ padding: "16px" }}>
          browse
        </button>
        {ancestors}
      </nav>
      {log}
    </header>
    <div style = {{ borderStyle: "solid" }}>
      <Items />
      {create}
    </div>
  </>
}
function Download() {
  state.Download = react.useState()
  if (window.history.state.name) {
    authenticated = window.history.state.user === user
    return <Main />
  }
  axios.post("/itemsFind", { user: window.history.state.user }).then(function(response) {
    let path = decodeURI(window.location.pathname).split("/")
    window.history.replaceState({ user: window.history.state.user, ancestors: [], index: "0", name: window.history.state.user, children: [] }, undefined, "/" + window.history.state.user)
    users[window.history.state.user] = [window.history.state]
    for (let index in response.data) {
      users[window.history.state.user][response.data[index].index] = response.data[index]
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
    render("Download")
  })
}
function Browse() {
  state.Browse = react.useState()
  let name = react.useRef()
  let password = react.useRef()
  let confirm = react.useRef()
  if (window.history.state.user) {
    return <Download />
  }
  let log
  let create
  if (user) {
    log = <button onClick = {function() {
      user = undefined
      render("Browse")
    }} style = {{ height: "21px" }}>
      log out from {user}
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
          window.history.pushState({ user: name.current.value, name: name.current.value, index: 0, children: [] }, undefined, "/" + name.current.value)
          axios.post("/usersCreate", { name: name.current.value, password: password.current.value })
          users[name.current.value] = [window.history.state]
          user = name.current.value
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
  let browse = []
  for (let index in users) {
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
      {log}
    </header>
    <div style = {{ borderStyle: "solid" }}>
      {browse}
      {create}
    </div>
  </>
}
axios.post("/usersFind").then(function(response) {
  for (let index in response.data) {
    users[response.data[index].name] = []
    descriptions[response.data[index].name] = response.data[index].description
  }
  let user = decodeURI(window.location.pathname).split("/")[1].toLowerCase()
  if (users[user]) {
    window.history.replaceState({ user: user }, undefined)
  } else {
    window.history.replaceState({}, undefined, "/")
  }
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Browse />
  </react.StrictMode>)
})





// axios.post("/findAll", { user: user }).then(function(response) {
//   window.history.replaceState({ names: [user], current: "0" }, undefined, "/" + user)
//   for (let index in response.data) {
//     map[response.data[index].index] = true
//     if (!response.data[index].address) {
//       if (response.data[index].name === path[step] && response.data[index].parent === window.history.state.current) {
//         window.history.state.names[response.data[index].index] = response.data[index].name
//         window.history.replaceState({ names: window.history.state.names, current: response.data[index].index }, undefined, window.location.pathname + "/" + response.data[index].name)
//         ++step
//       }
//       items[response.data[index].index] = []
//     }
//     items[response.data[index].parent][response.data[index].index] = response.data[index]
//   }
//   next = map.length
//   reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
//     <App />
//   </react.StrictMode>)
// })