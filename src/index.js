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
let parent = "0"
let redirect = user
let items = [[]]
let next
let state = {}
let destroyed
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
      items[parent][props.index].address = address.current.value
      items[parent][props.index].name = name.current.value
      items[parent][props.index].description = description.current.value
      axios.put("/update", items[parent][props.index])
      editing[1]()
    }}>
      <input ref = {address} defaultValue = {items[parent][props.index].address} placeholder = {"address"} />
      <input ref = {name} defaultValue = {items[parent][props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[parent][props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  return <>
    <a className = {"item"} target = {"_blank"} href = {items[parent][props.index].address} style = {{ "textDecoration": "none", "color": "black" }}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + items[parent][props.index].address} style = {{ "height": "16px", "width": "16px" }} />
      <div style = {{ "fontWeight": "bold" }}>
        {items[parent][props.index].name}
      </div>
      <div>
        {items[parent][props.index].description}
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
      name.current.value = name.current.value.replaceAll(/[/?]/g, "")
      for (let index in items[parent]) {
        if (items[parent][index].name === name.current.value) {
          alert("Folder names must be unique.")
          name.current.focus()
          return
        }
      }
      items[parent][props.index].name = name.current.value
      items[parent][props.index].description = description.current.value
      axios.put("/update", items[parent][props.index])
      editing[1]()
    }}>
      <input ref = {name} defaultValue = {items[parent][props.index].name} placeholder = {"name"} />
      <input ref = {description} defaultValue = {items[parent][props.index].description} placeholder = {"description"} />
      <button>
        done
      </button>
    </form>
  }
  let path = window.location.pathname + "/" + items[parent][props.index].name
  return <>
    <a className = {"item"} href = {path} onClick = {function(event) {
      event.preventDefault()
      parent = items[parent][props.index].index
      window.history.pushState(undefined, undefined, path)
      render("Main")
    }} style = {{ "textDecoration": "none", "color": "black" }}>
      <div style = {{ "fontWeight": "bold" }}>
        {items[parent][props.index].name}
      </div>
      <div>
        {items[parent][props.index].description}
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
  if (items[parent][props.index].address) {
    return <Bookmark index = {props.index} />
  }
  return <Folder index = {props.index} />
}
function Main() {
  state.Main = react.useState()
  let folder = []
  for (let index in items[parent]) {
    folder.push(<div key = {index} style = {{ "position": "relative" }}>
      <Item index = {index} />
      <button onClick = {function() {
        destroyed = []
        destroy(parent, index)
        axios.put("/destroy", { "user": user, "destroyed": destroyed })
        render("Main")
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
      items[parent][next] = { "user": user, "index": next, "parent": parent, "name": bookmarkName.current.value, "description": bookmarkDescription.current.value, "address": bookmarkAddress.current.value }
      axios.post("/item", items[parent][next++])
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
      folderName.current.value = folderName.current.value.replaceAll(/[/?]/g, "")
      for (let index in items[parent]) {
        if (items[parent][index].name === folderName.current.value) {
          alert("Folder names must be unique.")
          folderName.current.focus()
          return
        }
      }
      items[parent][next] = { "user": user, "index": next, "parent": parent, "name": folderName.current.value, "description": folderDescription.current.value }
      items[next] = []
      axios.post("/item", items[parent][next++])
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
axios.get("/item/" + user).then(function(response) {
  for (let index in response.data) {
    map[response.data[index].index] = true
    if (!response.data[index].address) {
      if (response.data[index].name === path[step] && response.data[index].parent === parent) {
        redirect += "/" + response.data[index].name
        parent = response.data[index].index
        ++step
      }
      items[response.data[index].index] = []
    }
    items[response.data[index].parent][response.data[index].index] = response.data[index]
  }
  next = map.length
  window.history.replaceState(undefined, undefined, "/" + redirect)
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Main />
    <Add />
  </react.StrictMode>)
})