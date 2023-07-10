import react from "react"
import reactDOM from "react-dom/client"
import axios from "axios"
let items
function Main() {
  let renderer = react.useState()[1]
  function render() {
    renderer({})
  }
  let address = react.useRef()
  let name = react.useRef()
  let description = react.useRef()
  let list = []
  for (let index in items) {
    list.push(<div key = {index} style = {{ "borderStyle": "solid", "display": "flex", "justifyContent": "space-between" }}>
      <a target = {"_blank"} href = {items[index].address} style = {{ "display": "flex", "alignItems": "center", "textDecoration": "none", "color": "black" }}>
        <img src = {"https://www.google.com/s2/favicons?domain=" + items[index].address} style = {{ "height": "16px", "width": "16px" }} />
        <div style = {{ "fontWeight": "bold" }}>
          {items[index].name}
        </div>
        <div>
          {items[index].description}
        </div>
      </a>
      <button onClick = {function() {
        axios.delete("/item/" + items[index].index)
        delete items[index]
        render()
      }} style = {{ "margin": "16px" }}>
        delete
      </button>
    </div>)
  }
  return <>
    <div style = {{ "borderStyle": "solid", "display": "flex", "flexDirection": "column" }}>
      {list}
    </div>
    <form onSubmit = {function(event) {
      event.preventDefault()
      let index
      if (items[0]) {
        index = items[items.length - 1].index + 1
      } else {
        index = 0
      }
      if (!(address.current.value.startsWith("https://") || address.current.value.startsWith("http://"))) {
        address.current.value = "https://" + address.current.value
      }
      axios.post("/item", { "index": index, "name": name.current.value, "address": address.current.value, "description": description.current.value })
      items.push({ "index": index, "name": name.current.value, "address": address.current.value, "description": description.current.value })
      address.current.value = ""
      name.current.value = ""
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
    <Main />
  </react.StrictMode>)
})