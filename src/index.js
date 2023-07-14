import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
if (window.location.pathname === "/") {
  window.history.replaceState(undefined, undefined, "user")
}
let path = decodeURI(window.location.pathname).split("/")
let user = path[1]
let map = []
let step = 2
let items = [[]]
let next
let state = {}
let destroyed
window.addEventListener("popstate", function() {
  render("Main")
})
function render(component) {
  state[component][1]({})
}
function destroy(parent, index) {
  for (let child in items[index]) {
    destroy(index, child)
  }
  delete items[index]
  delete items[parent][index]
  destroyed.push(index)
}
function Bookmark(props) {
  let editing = react.useState()
  let address = react.useRef()
  let name = react.useRef()
  let description = react.useRef()
  if (editing[0]) {
    return <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      if (!(address.current.value.startsWith("https://") || address.current.value.startsWith("http://"))) {
        address.current.value = "https://" + address.current.value
      }
      items[window.history.state.current][props.index].address = address.current.value
      items[window.history.state.current][props.index].name = name.current.value
      items[window.history.state.current][props.index].description = description.current.value
      axios.put("/update", items[window.history.state.current][props.index])
      editing[1]()
    }}>
      <input ref = {address} defaultValue = {items[window.history.state.current][props.index].address} placeholder = {"address"} />
      <input ref = {name} defaultValue = {items[window.history.state.current][props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[window.history.state.current][props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  return <>
    <a className = {"item"} target = {"_blank"} href = {items[window.history.state.current][props.index].address} style = {{ "textDecoration": "none", "color": "black" }}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + items[window.history.state.current][props.index].address} style = {{ "height": "16px", "width": "16px" }} />
      <div style = {{ "fontWeight": "bold" }}>
        {items[window.history.state.current][props.index].name}
      </div>
      <div>
        {items[window.history.state.current][props.index].description}
      </div>
    </a>
    <button onClick = {function() {
      editing[1](true)
    }} style = {{ "position": "absolute", "top": "16px", "right": "100px" }}>
      edit
    </button>
  </>
}
function Folder(props) {
  let editing = react.useState()
  let name = react.useRef()
  let description = react.useRef()
  if (editing[0]) {
    return <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      name.current.value = name.current.value.replaceAll(/[/?\\]/g, "")
      if (name.current.value) {
        for (let index in items[window.history.state.current]) {
          if (items[window.history.state.current][index].name === name.current.value && index !== props.index) {
            alert("Folder names must be unique.")
            name.current.focus()
            return
          }
        }
        items[window.history.state.current][props.index].name = name.current.value
        items[window.history.state.current][props.index].description = description.current.value
        axios.put("/update", items[window.history.state.current][props.index])
        editing[1]()
      } else {
        name.current.focus()
      }
    }}>
      <input ref = {name} defaultValue = {items[window.history.state.current][props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[window.history.state.current][props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  let path = window.location.pathname + "/" + items[window.history.state.current][props.index].name
  return <>
    <button className = {"folder"} onClick = {function() {
      window.history.state.names[props.index] = items[window.history.state.current][props.index].name
      window.history.pushState({ "names": window.history.state.names, "current": props.index }, undefined, path)
      render("Main")
    }}>
      <div style = {{ "fontWeight": "bold" }}>
        {items[window.history.state.current][props.index].name}
      </div>
      <div>
        {items[window.history.state.current][props.index].description}
      </div>
    </button>
    <button onClick = {function() {
      editing[1](true)
    }} style = {{ "position": "absolute", "top": "16px", "right": "100px" }}>
      edit
    </button>
  </>
}
function Item(props) {
  if (items[window.history.state.current][props.index].address) {
    return <Bookmark index = {props.index} />
  }
  return <Folder index = {props.index} />
}
function Items() {
  state.Items = react.useState()
  let folder = []
  for (let index in items[window.history.state.current]) {
    folder.push(<div key = {index} style = {{ "position": "relative" }}>
      <Item index = {index} />
      <button onClick = {function() {
        destroyed = []
        destroy(window.history.state.current, index)
        axios.put("/destroy", { "user": user, "destroyed": destroyed })
        render("Items")
      }} style = {{ "position": "absolute", "top": "16px", "right": "16px" }}>
        delete
      </button>
    </div>)
  }
  return <>
    {folder}
  </>
}
function Add() {
  let bookmarkAddress = react.useRef()
  let bookmarkName = react.useRef()
  let bookmarkDescription = react.useRef()
  let folderName = react.useRef()
  let folderDescription = react.useRef()
  return <>
    <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      if (!(bookmarkAddress.current.value.startsWith("https://") || bookmarkAddress.current.value.startsWith("http://"))) {
        bookmarkAddress.current.value = "https://" + bookmarkAddress.current.value
      }
      items[window.history.state.current][++next] = { "user": user, "index": next, "parent": window.history.state.current, "name": bookmarkName.current.value, "description": bookmarkDescription.current.value, "address": bookmarkAddress.current.value }
      axios.post("/create", items[window.history.state.current][next])
      bookmarkAddress.current.blur()
      bookmarkName.current.blur()
      bookmarkDescription.current.blur()
      bookmarkAddress.current.value = ""
      bookmarkName.current.value = ""
      bookmarkDescription.current.value = ""
      render("Items")
    }}>
      <input ref = {bookmarkAddress} placeholder = {"address"} />
      <input ref = {bookmarkName} placeholder = {"name"} />
      <input ref = {bookmarkDescription} placeholder = {"description"} />
      <button>
        add bookmark
      </button>
    </form>
    <form className = {"item"} onSubmit = {function(event) {
      event.preventDefault()
      folderName.current.value = folderName.current.value.replaceAll(/[/?\\]/g, "")
      if (folderName.current.value) {
        for (let index in items[window.history.state.current]) {
          if (items[window.history.state.current][index].name === folderName.current.value) {
            alert("Folder names must be unique.")
            folderName.current.focus()
            return
          }
        }
        items[window.history.state.current][++next] = { "user": user, "index": next, "parent": window.history.state.current, "name": folderName.current.value, "description": folderDescription.current.value }
        items[next] = []
        axios.post("/create", items[window.history.state.current][next])
        folderName.current.blur()
        folderDescription.current.blur()
        folderName.current.value = ""
        folderDescription.current.value = ""
        render("Items")
      } else {
        folderName.current.focus()
      }
    }}>
      <input ref = {folderName} placeholder = {"name"} />
      <input ref = {folderDescription} placeholder = {"description"} />
      <button>
        add folder
      </button>
    </form>
  </>
}
function Main() {
  state.Main = react.useState()
  let path = []
  for (let index in window.history.state.names) {
    path[index] = <button key = {index} onClick = {function() {
      let names = window.history.state.names.slice(0, Number(index) + 1)
      let path = ""
      for (let index in names) {
        path += "/" + names[index]
      }
      window.history.pushState({ "names": names, "current": index }, undefined, path)
      render("Main")
    }}>
      {window.history.state.names[index]}
    </button>
  }
  path[window.history.state.current] = window.history.state.names[window.history.state.current]
  return <>
    {path}
    <div style = {{ "borderStyle": "solid" }}>
      <Items />
      <Add />
    </div>
  </>
}
axios.post("/findAll", { "user": user }).then(function(response) {
  window.history.replaceState({ "names": [user], "current": "0" }, undefined, "/" + user)
  for (let index in response.data) {
    map[response.data[index].index] = true
    if (!response.data[index].address) {
      if (response.data[index].name === path[step] && response.data[index].parent === window.history.state.current) {
        window.history.state.names[response.data[index].index] = response.data[index].name
        window.history.replaceState({ "names": window.history.state.names, "current": response.data[index].index }, undefined, window.location.pathname + "/" + response.data[index].name)
        ++step
      }
      items[response.data[index].index] = []
    }
    items[response.data[index].parent][response.data[index].index] = response.data[index]
  }
  next = map.length
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Main />
  </react.StrictMode>)
})