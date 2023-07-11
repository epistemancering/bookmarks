import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let slash
let user = ""
let items
let counter
let state = {}
if (window.location.pathname === "/") {
  window.history.replaceState(undefined, undefined, "user")
}
for (let index in window.location.pathname) {
  if (window.location.pathname[index] === "/") {
    if (slash) {
      break
    } else {
      slash = true
    }
  }
  user += window.location.pathname[index]
}
function render(component) {
  state[component][1]({})
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
      items[props.index].address = address.current.value
      items[props.index].name = name.current.value
      items[props.index].description = description.current.value
      axios.put("/item", items[props.index])
      editing[1]()
    }}>
      <input ref = {address} defaultValue = {items[props.index].address} placeholder = {"address"} />
      <input ref = {name} defaultValue = {items[props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  return <>
    <a className = {"item"} target = {"_blank"} href = {items[props.index].address} style = {{ "textDecoration": "none", "color": "black" }}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + items[props.index].address} style = {{ "height": "16px", "width": "16px" }} />
      <div style = {{ "fontWeight": "bold" }}>
        {items[props.index].name}
      </div>
      <div>
        {items[props.index].description}
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
      items[props.index].name = name.current.value
      items[props.index].description = description.current.value
      axios.put("/item", items[props.index])
      editing[1]()
    }}>
      <input ref = {name} defaultValue = {items[props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  let path = window.location.pathname + items[props.index].name
  return <>
    <a className = {"item"} href = {path} onClick = {function(event) {
      event.preventDefault()
      window.history.pushState(undefined, undefined, path)
      render("Main")
    }} style = {{ "textDecoration": "none", "color": "black" }}>
      <div style = {{ "fontWeight": "bold" }}>
        {items[props.index].name}
      </div>
      <div>
        {items[props.index].description}
      </div>
    </a>
    <button onClick = {function() {
      editing[1](true)
    }} style = {{ "position": "absolute", "top": "16px", "right": "100px" }}>
      edit
    </button>
  </>
}
function Item(props) {
  if (items[props.index].address) {
    return <Bookmark index = {props.index} />
  }
  return <Folder index = {props.index} />
}
function Main() {
  state.Main = react.useState()
  let folder = []
  for (let index in items) {
    if (items[index].path === window.location.pathname) {
      folder.push(<div key = {index} style = {{ "position": "relative" }}>
        <Item index = {index} />
        <button onClick = {function() {
          axios.delete("/item/" + items[index].index)
          delete items[index]
          render("Main")
        }} style = {{ "position": "absolute", "top": "16px", "right": "16px" }}>
          delete
        </button>
      </div>)
    }
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
      items[++counter] = { "index": counter, "path": window.location.pathname, "name": bookmarkName.current.value, "description": bookmarkDescription.current.value, "address": bookmarkAddress.current.value }
      axios.post("/item", items[counter])
      bookmarkAddress.current.blur()
      bookmarkName.current.blur()
      bookmarkDescription.current.blur()
      bookmarkAddress.current.value = ""
      bookmarkName.current.value = ""
      bookmarkDescription.current.value = ""
      render("Main")
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
      items[++counter] = { "index": counter, "path": window.location.pathname, "name": folderName.current.value, "description": folderDescription.current.value }
      axios.post("/item", items[counter])
      folderName.current.blur()
      folderDescription.current.blur()
      folderName.current.value = ""
      folderDescription.current.value = ""
      render("Main")
    }}>
      <input ref = {folderName} placeholder = {"name"} />
      <input ref = {folderDescription} placeholder = {"description"} />
      <button>
        add folder
      </button>
    </form>
  </>
}
axios.get("/item" + user).then(function(response) {
  items = response.data
  if (items[0]) {
    counter = items[items.length - 1].index
  } else {
    counter = -1
  }
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Main />
    <Add />
  </react.StrictMode>)
})