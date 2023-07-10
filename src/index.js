import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let items
function Bookmarks() {
  let renderer = react.useState()[1]
  function render() {
    renderer({})
  }
  let name = react.useRef()
  let address = react.useRef()
  let description = react.useRef()
  let list = []
  for (let index in items) {
    list.push(<a key = {index} target = {"_blank"} href = {items[index].address} style = {{ "display": "flex", "borderStyle": "solid", "textDecoration": "none", "color": "black" }}>
      <img src = {"https://www.google.com/s2/favicons?domain=" + items[index].address} />
      <div style = {{ "fontWeight": "bold" }}>
        {items[index].name}
      </div>
      <div>
        {items[index].description}
      </div>
    </a>)
  }
  return <>
    <div style = {{ "borderStyle": "solid", "display": "flex", "flexDirection": "column" }}>
      {list}
    </div>
    <form onSubmit = {function(event) {
      event.preventDefault()
      axios.post("/item", { "name": name.current.value, "address": address.current.value, "description": description.current.value })
      items.push({ "name": name.current.value, "address": address.current.value, "description": description.current.value })
      name.current.value = ""
      address.current.value = ""
      description.current.value = ""
      render()
    }}>
      <input ref = {address} placeholder = {"address"} />
      <input ref = {name} placeholder = {"name"} />
      <input ref = {description} placeholder = {"description"} />
      <button>
        add
      </button>
    </form>
  </>
}
axios.get("/item").then(function(response) {
  items = response.data
  reactDOM.createRoot(document.querySelector("div")).render(<react.StrictMode>
    <Bookmarks />
  </react.StrictMode>)
})